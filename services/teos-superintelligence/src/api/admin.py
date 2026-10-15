"""
TEOS Admin Control Plane — Sovereign Veto & Emergency Controls
Dual-key security protocol:
  - EMERGENCY_HALT_KEY: controls halt/resume/status (emergency operations)
  - ADMIN_VETO_KEY: controls skill veto (governance operations)
Fail-closed: missing or wrong key = 403. No single key can perform both functions.
"""
import os
import logging
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Depends, status, Request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin Control Plane"])

EMERGENCY_HALT_KEY = os.environ.get("EMERGENCY_HALT_KEY", "")
ADMIN_VETO_KEY = os.environ.get("ADMIN_VETO_KEY", "")

_halted = False
_redis_client = None

HALT_REDIS_KEY = "teos:engine:halted"


async def _get_redis():
    global _redis_client
    if _redis_client is None:
        from src.database.redis_pool import RedisPool
        _redis_client = await RedisPool().get_client()
    return _redis_client


def _verify_emergency_halt_key(
    x_emergency_halt_key: Optional[str] = Header(None, alias="X-Emergency-Halt-Key"),
) -> str:
    if not EMERGENCY_HALT_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="EMERGENCY_HALT_KEY not configured on server",
        )
    if not x_emergency_halt_key or x_emergency_halt_key != EMERGENCY_HALT_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing emergency halt key",
        )
    return x_emergency_halt_key


def _verify_admin_veto_key(
    x_admin_veto_key: Optional[str] = Header(None, alias="X-Admin-Veto-Key"),
) -> str:
    if not ADMIN_VETO_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ADMIN_VETO_KEY not configured on server",
        )
    if not x_admin_veto_key or x_admin_veto_key != ADMIN_VETO_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing admin veto key",
        )
    return x_admin_veto_key


@router.post(
    "/halt",
    summary="Emergency kill-switch",
    description=(
        "Gracefully rejects all incoming traffic and pauses the orchestrator queue. "
        "Protected by EMERGENCY_HALT_KEY."
    ),
)
async def halt_engine(
    request: Request,
    _: str = Depends(_verify_emergency_halt_key),
):
    global _halted
    _halted = True

    try:
        r = await _get_redis()
        await r.set(HALT_REDIS_KEY, "1")
    except Exception as e:
        logger.warning("Redis halt state save failed (falling back to local): %s", e)

    orch = request.app.state.orchestrator
    try:
        orch.patrol_runner.stop()
    except Exception as e:
        logger.warning("Patrol stop failed during halt: %s", e)

    try:
        await orch.message_queue.connect()
    except Exception:
        pass

    logger.critical("SOVEREIGN HALT ACTIVATED — engine paused")
    return {
        "status": "halted",
        "message": "TEOS engine halted. All incoming requests will be rejected. "
        "POST /admin/resume to restore.",
    }


@router.post(
    "/resume",
    summary="Resume engine after halt",
    description="Clears the halt flag. Protected by EMERGENCY_HALT_KEY.",
)
async def resume_engine(
    _: str = Depends(_verify_emergency_halt_key),
):
    global _halted
    _halted = False

    try:
        r = await _get_redis()
        await r.delete(HALT_REDIS_KEY)
    except Exception as e:
        logger.warning("Redis halt state clear failed (falling back to local): %s", e)

    logger.info("SOVEREIGN RESUME — engine unpaused")
    return {"status": "resumed", "message": "TEOS engine resumed."}


@router.get(
    "/halt-status",
    summary="Check halt state",
    description="Returns current halt status. Protected by EMERGENCY_HALT_KEY.",
)
async def halt_status(
    _: str = Depends(_verify_emergency_halt_key),
):
    state = _halted
    try:
        r = await _get_redis()
        redis_val = await r.get(HALT_REDIS_KEY)
        if redis_val is not None:
            state = redis_val == b"1" or redis_val == "1"
    except Exception:
        pass
    return {"halted": state}


async def is_halted() -> bool:
    if _halted:
        return True
    try:
        r = await _get_redis()
        redis_val = await r.get(HALT_REDIS_KEY)
        return redis_val is not None and (redis_val == b"1" or redis_val == "1")
    except Exception:
        return _halted


@router.delete(
    "/skills/veto/{skill_id}",
    summary="Veto and delete a sovereign skill",
    description=(
        "Directly removes a specific AI-generated SOP/skill from ChromaDB "
        "by its document ID. Protected by ADMIN_VETO_KEY."
    ),
)
async def veto_skill(
    skill_id: str,
    request: Request,
    _: str = Depends(_verify_admin_veto_key),
):
    orch = request.app.state.orchestrator
    vs = orch.vector_store
    vs.connect()

    if not vs.exists(skill_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill '{skill_id}' not found in vector store",
        )

    vs.delete_document(skill_id)
    logger.warning("SOVEREIGN VETO: skill %s deleted from ChromaDB", skill_id)

    return {
        "status": "vetoed",
        "skill_id": skill_id,
        "message": f"Skill '{skill_id}' has been permanently removed.",
    }


@router.post(
    "/genesis-sync",
    summary="Execute remote knowledge ingestion into ChromaDB",
    description=(
        "One-shot endpoint to fetch READMEs and architecture docs from active "
        "Elmahrosa GitHub repos and embed them into the production vector store. "
        "Protected by ADMIN_VETO_KEY."
    ),
)
async def genesis_sync(
    request: Request,
    _: str = Depends(_verify_admin_veto_key),
):
    import hashlib
    import httpx

    github_pat = os.environ.get("GITHUB_PAT", "")
    if not github_pat:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GITHUB_PAT not configured",
        )

    deprecated = [
        r.strip() for r in os.environ.get("DEPRECATED_REPOS", "").split(",") if r.strip()
    ]

    doc_filenames = [
        "README.md", "README.rst", "README.txt",
        "ARCHITECTURE.md", "DESIGN.md", "CONTRIBUTING.md",
        "docs/architecture.md", "docs/overview.md",
    ]

    headers = {"Accept": "application/vnd.github+json", "Authorization": f"Bearer {github_pat}"}

    repos = []
    page = 1
    while True:
        resp = httpx.get(
            f"https://api.github.com/orgs/Elmahrosa/repos?per_page=100&page={page}&type=all",
            headers=headers, timeout=30,
        )
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        repos.extend(batch)
        page += 1

    active = [r["name"] for r in repos if r["name"] not in deprecated and not r.get("archived")]

    all_docs = []
    for name in active:
        for fname in doc_filenames:
            try:
                url = f"https://api.github.com/repos/Elmahrosa/{name}/contents/{fname}"
                resp = httpx.get(url, headers=headers, timeout=15)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("encoding") == "base64":
                        import base64
                        content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
                        if content.strip():
                            all_docs.append({"repo": name, "filename": fname, "content": content})
            except Exception:
                continue

    from src.rag.vector_store import chunk_document

    orch = request.app.state.orchestrator
    vs = orch.vector_store
    vs.connect()

    new_count = 0
    skipped = 0
    for doc in all_docs:
        chunks = chunk_document(doc["content"])
        for idx, chunk in enumerate(chunks):
            doc_id = hashlib.sha256(chunk.encode()).hexdigest()[:16]
            if vs.exists(doc_id):
                skipped += 1
                continue
            vs.add_document(
                content=chunk,
                metadata={
                    "repo": doc["repo"], "filename": doc["filename"],
                    "chunk_index": idx, "total_chunks": len(chunks),
                    "source": "genesis_sync", "status": "active",
                },
                doc_id=doc_id,
            )
            new_count += 1

    logger.info("Genesis sync: %d new chunks, %d skipped (duplicates)", new_count, skipped)

    return {
        "status": "complete",
        "repos_scanned": len(active),
        "docs_fetched": len(all_docs),
        "chunks_ingested": new_count,
        "duplicates_skipped": skipped,
        "total_in_store": vs.count(),
    }
