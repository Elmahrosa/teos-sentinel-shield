"""
TEOS Shared Redis Connection Pool
Single, centralized Redis connection pool shared across all modules.
Prevents connection exhaustion under production load.
"""
import os
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_MAX_CONNECTIONS = int(os.environ.get("REDIS_MAX_CONNECTIONS", "100"))
REDIS_SOCKET_TIMEOUT = int(os.environ.get("REDIS_SOCKET_TIMEOUT", "10"))
REDIS_RETRY_ON_TIMEOUT = True


class RedisPool:
    """Singleton shared Redis connection pool."""

    _instance: Optional["RedisPool"] = None
    _redis: Optional[Any] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def connect(self) -> None:
        if self._redis is not None:
            return
        import redis.asyncio as aioredis
        pool = aioredis.ConnectionPool.from_url(
            REDIS_URL,
            max_connections=REDIS_MAX_CONNECTIONS,
            socket_timeout=REDIS_SOCKET_TIMEOUT,
            retry_on_timeout=REDIS_RETRY_ON_TIMEOUT,
            decode_responses=True,
        )
        self._redis = aioredis.Redis(connection_pool=pool)
        await self._redis.ping()
        logger.info(
            "Shared Redis pool connected (max=%d, timeout=%ds)",
            REDIS_MAX_CONNECTIONS, REDIS_SOCKET_TIMEOUT,
        )

    async def get_redis(self) -> Any:
        if self._redis is None:
            await self.connect()
        return self._redis

    async def disconnect(self) -> None:
        if self._redis is not None:
            try:
                await self._redis.aclose()
            except Exception as e:
                logger.warning("Redis disconnect error (non-fatal): %s", e)
            finally:
                self._redis = None
                logger.info("Shared Redis pool disconnected")

    @classmethod
    def reset(cls) -> None:
        """Reset singleton for testing only."""
        cls._instance = None
        cls._redis = None
