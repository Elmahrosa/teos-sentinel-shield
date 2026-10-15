"""
TEOS Memory Layer
Redis-backed session memory with agent-specific persistent namespaces.
Uses shared Redis connection pool for production-grade connection management.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)


class MemoryStore:
    def __init__(self):
        self._redis: Optional[object] = None
        self._pool: Optional[object] = None

    async def connect(self) -> None:
        from src.database.redis_pool import RedisPool
        self._pool = RedisPool()
        await self._pool.connect()
        self._redis = await self._pool.get_redis()
        logger.info("Memory store connected via shared Redis pool")

    async def _get_redis(self):
        if not self._redis:
            await self.connect()
        return self._redis

    async def disconnect(self) -> None:
        self._redis = None
        self._pool = None

    async def save(self, session_id: str, role: str, content: str) -> None:
        r = await self._get_redis()
        key = f"session:{session_id}:messages"
        msg = json.dumps({"role": role, "content": content, "timestamp": datetime.now(timezone.utc).isoformat()})
        await r.rpush(key, msg)
        await r.expire(key, 86400)

    async def get_context(self, session_id: str, limit: int = 10) -> list[dict]:
        try:
            r = await self._get_redis()
            key = f"session:{session_id}:messages"
            raw = await r.lrange(key, -limit, -1)
            return [json.loads(m) for m in raw]
        except Exception as e:
            logger.warning("Memory read failed: %s", e)
            return []

    async def clear(self, session_id: str) -> None:
        r = await self._get_redis()
        await r.delete(f"session:{session_id}:messages")

    async def get_session_info(self, session_id: str) -> dict:
        r = await self._get_redis()
        key = f"session:{session_id}:messages"
        length = await r.llen(key)
        ttl = await r.ttl(key)
        return {"session_id": session_id, "message_count": length, "ttl_seconds": ttl}

    async def save_agent_memory(
        self, agent_name: str, session_id: str, key: str, value: str
    ) -> None:
        r = await self._get_redis()
        redis_key = f"agent:{agent_name}:{session_id}:{key}"
        await r.set(redis_key, value, ex=86400 * 30)
        await r.sadd(f"agent:{agent_name}:{session_id}:keys", key)

    async def get_agent_memory(
        self, agent_name: str, session_id: str, key: str
    ) -> Optional[str]:
        r = await self._get_redis()
        redis_key = f"agent:{agent_name}:{session_id}:{key}"
        val = await r.get(redis_key)
        return val

    async def get_all_agent_memory(
        self, agent_name: str, session_id: str
    ) -> dict:
        r = await self._get_redis()
        keys_key = f"agent:{agent_name}:{session_id}:keys"
        keys = await r.smembers(keys_key)
        result = {}
        for k in keys:
            val = await r.get(f"agent:{agent_name}:{session_id}:{k}")
            if val:
                result[k] = val
        return result

    async def clear_agent_memory(self, agent_name: str, session_id: str) -> None:
        r = await self._get_redis()
        keys_key = f"agent:{agent_name}:{session_id}:keys"
        keys = await r.smembers(keys_key)
        for k in keys:
            await r.delete(f"agent:{agent_name}:{session_id}:{k}")
        await r.delete(keys_key)
