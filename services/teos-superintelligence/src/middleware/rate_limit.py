"""
TEOS Rate Limiting Middleware
Token bucket algorithm per user_id.
Configurable via RATE_LIMIT_RPH env var (default: 100 requests/hour).
"""
import os
import time
import logging
from collections import defaultdict

import jwt
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from src.auth.jwt import _get_public_key, _get_algorithm

logger = logging.getLogger(__name__)

RATE_LIMIT_RPH = int(os.environ.get("RATE_LIMIT_RPH", "100"))


class TokenBucket:
    def __init__(self, rate: float, capacity: int) -> None:
        self.rate = rate / 3600.0
        self.capacity = capacity
        self.tokens = float(capacity)
        self.last_refill = time.monotonic()

    def _refill(self) -> None:
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_refill = now

    def consume(self, tokens: float = 1.0) -> bool:
        self._refill()
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

    def wait_time(self) -> float:
        if self.tokens >= 1.0:
            return 0.0
        return (1.0 - self.tokens) / self.rate if self.rate > 0 else float("inf")


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rate_rph: int = RATE_LIMIT_RPH) -> None:
        super().__init__(app)
        self._buckets: dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(rate=rate_rph, capacity=rate_rph)
        )
        self.rate_rph = rate_rph

    async def dispatch(self, request: Request, call_next):
        if request.url.path in ("/health", "/docs", "/redoc", "/openapi.json", "/auth/token"):
            return await call_next(request)

        user_id = "anonymous"
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                payload = jwt.decode(
                    auth_header.split(" ", 1)[1],
                    _get_public_key(),
                    algorithms=[_get_algorithm()],
                    options={"verify_exp": False},
                )
                user_id = payload.get("user_id", "anonymous")
            except Exception:
                pass

        bucket = self._buckets[user_id]
        if not bucket.consume():
            wait = int(bucket.wait_time())
            logger.warning(f"Rate limit exceeded for user={user_id}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "type": "https://tools.ietf.org/html/rfc6585#section-4",
                    "title": "Too Many Requests",
                    "status": 429,
                    "detail": f"Rate limit of {self.rate_rph} requests per hour exceeded",
                    "retry_after_seconds": wait,
                },
                headers={"Retry-After": str(wait)},
            )

        response = await call_next(request)
        return response
