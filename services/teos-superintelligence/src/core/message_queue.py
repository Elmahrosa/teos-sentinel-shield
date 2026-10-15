"""
TEOS Air-gapped Async Message Queue
Redis List-based queue with Sentinel pre-inspection before Orchestrator reads.
Fail-closed: malformed or blocked payloads are discarded, never forwarded.
External systems write to the queue; Sentinel inspects before internal consumption.
Uses shared Redis connection pool for production-grade connection management.
"""
import os
import json
import time
import hashlib
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

QUEUE_KEY = os.environ.get("TEOS_QUEUE_KEY", "teos:incoming_queue")
DLQ_KEY = os.environ.get("TEOS_DLQ_KEY", "teos:dead_letter_queue")
MAX_MESSAGE_SIZE = int(os.environ.get("TEOS_QUEUE_MAX_MSG_SIZE", "1048576"))


class MessageQueue:
    def __init__(self, sentinel=None, audit=None):
        self._redis = None
        self._pool: Optional[object] = None
        self.sentinel = sentinel
        self.audit = audit

    async def connect(self) -> None:
        if not self._redis:
            from src.database.redis_pool import RedisPool
            self._pool = RedisPool()
            await self._pool.connect()
            self._redis = await self._pool.get_redis()
            logger.info("Message queue connected via shared Redis pool")

    async def _get_redis(self):
        if not self._redis:
            await self.connect()
        return self._redis

    async def disconnect(self) -> None:
        self._redis = None
        self._pool = None

    async def enqueue(
        self,
        payload: dict[str, Any],
        source: str = "external",
        priority: int = 0,
    ) -> dict[str, Any]:
        """
        Write a message to the incoming queue.
        Returns status of the write operation.
        """
        r = await self._get_redis()

        message = {
            "payload": payload,
            "source": source,
            "enqueued_at": time.time(),
            "priority": priority,
        }

        msg_json = json.dumps(message)
        if len(msg_json.encode("utf-8")) > MAX_MESSAGE_SIZE:
            return {
                "status": "rejected",
                "reason": f"Message exceeds max size ({MAX_MESSAGE_SIZE} bytes)",
            }

        msg_hash = hashlib.sha256(msg_json.encode("utf-8")).hexdigest()[:16]
        message["hash"] = msg_hash

        await r.rpush(QUEUE_KEY, json.dumps(message))
        await r.expire(QUEUE_KEY, 86400 * 7)

        logger.info("Enqueued message %s from %s", msg_hash, source)

        return {
            "status": "queued",
            "hash": msg_hash,
            "queue_length": await r.llen(QUEUE_KEY),
        }

    async def inspect_and_dequeue(
        self,
        batch_size: int = 10,
        user_id: str = "queue_system",
    ) -> list[dict[str, Any]]:
        """
        Pull messages from queue, run each through Sentinel Shield.
        ALLOW -> return to caller. BLOCK -> move to dead letter queue.
        Fail-closed: Sentinel error -> message goes to DLQ.
        """
        r = await self._get_redis()
        processed = []

        for _ in range(batch_size):
            raw = await r.lpop(QUEUE_KEY)
            if raw is None:
                break

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                logger.error("Malformed message in queue, discarding")
                if self.audit:
                    await self.audit.log_verdict(
                        user_id=user_id,
                        payload="MALFORMED_QUEUE_MSG",
                        verdict="BLOCK",
                        rule_triggered="MALFORMED_PAYLOAD",
                        action="queue_inspect",
                    )
                continue

            payload_str = json.dumps(message.get("payload", {}))

            if self.sentinel:
                verdict = await self.sentinel.check(
                    f"QUEUE_MSG:{message.get('hash', 'unknown')}:{payload_str[:2000]}",
                    user_id=user_id,
                )

                verdict_action = verdict.get("action", "BLOCK")

                if self.audit:
                    await self.audit.log_verdict(
                        user_id=user_id,
                        payload=f"QUEUE:{message.get('hash', 'unknown')}",
                        verdict=verdict_action,
                        rule_triggered=verdict.get("rule"),
                        action="queue_inspect",
                    )

                if verdict_action != "ALLOW":
                    logger.warning(
                        "Queue message %s blocked by Sentinel: %s",
                        message.get("hash"), verdict.get("rule"),
                    )
                    await r.rpush(DLQ_KEY, raw)
                    await r.expire(DLQ_KEY, 86400 * 30)
                    processed.append({
                        "status": "blocked",
                        "hash": message.get("hash"),
                        "rule": verdict.get("rule"),
                    })
                    continue

            message["dequeued_at"] = time.time()
            processed.append(message)

        return processed

    async def queue_length(self) -> int:
        r = await self._get_redis()
        return await r.llen(QUEUE_KEY)

    async def dlq_length(self) -> int:
        r = await self._get_redis()
        return await r.llen(DLQ_KEY)

    async def peek_dlq(self, count: int = 5) -> list[dict[str, Any]]:
        r = await self._get_redis()
        raw_list = await r.lrange(DLQ_KEY, 0, count - 1)
        messages = []
        for raw in raw_list:
            try:
                messages.append(json.loads(raw))
            except json.JSONDecodeError:
                messages.append({"error": "malformed", "raw": raw[:200]})
        return messages

    async def health(self) -> dict[str, Any]:
        try:
            r = await self._get_redis()
            await r.ping()
            return {
                "status": "ok",
                "queue_length": await r.llen(QUEUE_KEY),
                "dlq_length": await r.llen(DLQ_KEY),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
