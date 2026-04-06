from __future__ import annotations

import hashlib
from datetime import datetime, timezone

import redis as redis_lib
from celery import Task
from sqlalchemy import select

from collectors.http_connector import HTTPConnector, SSRFBlockedError
from core.config import get_settings
from core.database import session_scope
from core.logging import logger
from core.models import Job, JobStatus, transition
from core.pii import scrub_text
from core.policy import PolicyEngine
from infrastructure.queue.celery_app import celery_app

settings = get_settings()

_redis_client: redis_lib.Redis | None = None


def _get_redis() -> redis_lib.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis_lib.Redis.from_url(
            settings.redis_url, decode_responses=True
        )
    return _redis_client


def _get_policy_engine() -> PolicyEngine:
    return PolicyEngine(_get_redis())


def _hash_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
    reject_on_worker_lost=True,
)
def ingest_url_task(self: Task, *, job_id: str) -> dict:
    """
    Core ingestion task.

    Pipeline:
      1. Load job from DB and mark RUNNING
      2. Policy gate (YAML rules + robots.txt + crawl budget + concurrency)
      3. HTTP fetch with SSRF protection and size cap
      4. PII scrub
      5. Write results back to DB

    Security: API key never passes through Celery — only job_id.
    """
    log = logger.bind(job_id=job_id)
    log.info("task.started")

    policy_engine = _get_policy_engine()
    domain: str = "unknown"
    url: str = ""

    # ── Load job and transition to RUNNING ─────────────────────────────────────
    with session_scope() as session:
        db_job = session.scalar(select(Job).where(Job.job_id == job_id))
        if db_job is None:
            log.error("task.job_not_found")
            return {"error": "job not found"}

        url = db_job.source_url
        domain = db_job.domain or "unknown"

        try:
            db_job.status = transition(db_job.status, JobStatus.RUNNING)
        except ValueError as exc:
            log.warning("task.invalid_transition", error=str(exc))
            return {"error": str(exc)}

        db_job.attempt_count = (db_job.attempt_count or 0) + 1
        db_job.last_attempt = datetime.now(timezone.utc)

    log.info("task.running", url=url, domain=domain)

    try:
        # ── Policy gate ────────────────────────────────────────────────────────
        allowed, reason = policy_engine.evaluate(url)
        if not allowed:
            log.warning("task.blocked", url=url, reason=reason)
            with session_scope() as session:
                db_job = session.scalar(select(Job).where(Job.job_id == job_id))
                if db_job is not None:
                    db_job.status = transition(db_job.status, JobStatus.BLOCKED)
                    db_job.error_message = reason
                    db_job.security_event = True
                    db_job.completed_at = datetime.now(timezone.utc)
            return {"status": "BLOCKED", "reason": reason}

        # ── HTTP fetch ─────────────────────────────────────────────────────────
        import asyncio
        connector = HTTPConnector(user_agent="TeosCrawl/2.0")

        async def _fetch() -> str:
            try:
                result = await connector.fetch(url, follow_redirects=False)
                return result.content
            finally:
                await connector.close()

        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        raw_content = loop.run_until_complete(_fetch())

        # ── PII scrub ──────────────────────────────────────────────────────────
        scrub_result = scrub_text(raw_content)
        clean_content = scrub_result.text
        pii_count = scrub_result.count
        content_hash = _hash_content(clean_content)
        excerpt = clean_content[:500].strip()

        log.info(
            "task.completed",
            url=url,
            pii_found=pii_count,
            content_hash=content_hash[:16],
            truncated=scrub_result.truncated,
        )

        # ── Write result ───────────────────────────────────────────────────────
        with session_scope() as session:
            db_job = session.scalar(select(Job).where(Job.job_id == job_id))
            if db_job is not None:
                db_job.status = transition(db_job.status, JobStatus.COMPLETED)
                db_job.pii_found = pii_count
                db_job.content_hash = content_hash
                db_job.result_excerpt = excerpt
                db_job.error_message = None
                db_job.security_event = False
                db_job.completed_at = datetime.now(timezone.utc)

        policy_engine.concurrency.release(domain)
        return {
            "status": "COMPLETED",
            "job_id": job_id,
            "pii_found": pii_count,
            "content_hash": content_hash,
        }

    except SSRFBlockedError as exc:
        # SSRF block — security event, do not retry
        log.warning("task.ssrf_blocked", url=url, error=str(exc), security_event=True)
        policy_engine.concurrency.release(domain)
        with session_scope() as session:
            db_job = session.scalar(select(Job).where(Job.job_id == job_id))
            if db_job is not None:
                try:
                    db_job.status = transition(db_job.status, JobStatus.BLOCKED)
                except ValueError:
                    db_job.status = JobStatus.BLOCKED
                db_job.error_message = f"SSRF blocked: {exc}"
                db_job.security_event = True
                db_job.completed_at = datetime.now(timezone.utc)
        return {"status": "BLOCKED", "reason": str(exc)}

    except Exception as exc:
        policy_engine.concurrency.release(domain)
        is_retry = self.request.retries < self.max_retries
        log.exception("task.failed", url=url, will_retry=is_retry)

        with session_scope() as session:
            db_job = session.scalar(select(Job).where(Job.job_id == job_id))
            if db_job is not None:
                next_status = JobStatus.RETRYING if is_retry else JobStatus.FAILED
                try:
                    db_job.status = transition(db_job.status, next_status)
                except ValueError:
                    db_job.status = JobStatus.FAILED
                db_job.error_message = str(exc)
                db_job.security_event = False   # only SSRF gets flagged
                if not is_retry:
                    db_job.completed_at = datetime.now(timezone.utc)

        if is_retry:
            raise self.retry(exc=exc)
        raise
