"""
TEOS Cost & Usage Tracker
Logs token usage per request/user/agent for cost accounting.
Uses shared Redis connection pool for production-grade connection management.
"""
import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

TOKEN_COST_PER_MILLION = {
    "claude-sonnet-4-6": {"input": 3.0, "output": 15.0},
}


class UsageTracker:
    def __init__(self):
        self._redis = None
        self._pool: Optional[object] = None
        self._enabled = bool(os.environ.get("ENABLE_COST_TRACKING", "true").lower() == "true")

    async def _get_redis(self):
        if self._redis is None:
            from src.database.redis_pool import RedisPool
            self._pool = RedisPool()
            await self._pool.connect()
            self._redis = await self._pool.get_redis()
        return self._redis

    async def disconnect(self) -> None:
        self._redis = None
        self._pool = None

    async def log_usage(
        self,
        user_id: str,
        session_id: str,
        agent: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        status: str = "ok",
    ) -> dict:
        costs = TOKEN_COST_PER_MILLION.get(model, {"input": 3.0, "output": 15.0})
        input_cost = (input_tokens / 1_000_000) * costs["input"]
        output_cost = (output_tokens / 1_000_000) * costs["output"]
        total_cost = round(input_cost + output_cost, 6)

        record = {
            "user_id": user_id,
            "session_id": session_id,
            "agent": agent,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "input_cost": input_cost,
            "output_cost": output_cost,
            "total_cost": total_cost,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        if self._enabled:
            try:
                r = await self._get_redis()
                key = f"usage:{datetime.now(timezone.utc):%Y-%m-%d}"
                await r.rpush(key, json.dumps(record))
                await r.expire(key, 86400 * 90)
                await r.zincrby("usage:users", total_cost, user_id)
                await r.zincrby("usage:agents", total_cost, agent)
            except Exception as e:
                logger.warning("Failed to persist usage record: %s", e)

        return record

    async def get_daily_usage(self, date: str | None = None) -> list[dict]:
        if not self._enabled:
            return []
        from datetime import date as date_type
        date_str = date or str(date_type.today())
        try:
            r = await self._get_redis()
            key = f"usage:{date_str}"
            raw = await r.lrange(key, 0, -1)
            return [json.loads(item) for item in raw]
        except Exception as e:
            logger.warning("Failed to read usage: %s", e)
            return []

    async def get_user_summary(self, user_id: str) -> dict:
        if not self._enabled:
            return {"total_cost": 0, "total_tokens": 0}
        try:
            r = await self._get_redis()
            score = await r.zscore("usage:users", user_id)
            return {"user_id": user_id, "total_cost": round(score or 0, 6)}
        except Exception:
            return {"user_id": user_id, "total_cost": 0}
