"""
TEOS JWT Authentication
RS256-based JWT with Redis revocation list.
"""
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import HTTPException, Header, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)

JWT_EXPIRY_HOURS = 24


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = JWT_EXPIRY_HOURS * 3600


class TokenPayload(BaseModel):
    sub: str
    user_id: str
    exp: datetime
    iat: datetime


def _get_private_key() -> str:
    key = os.environ.get("JWT_PRIVATE_KEY", "")
    if key:
        return key.replace("\\n", "\n")
    secret = os.environ.get("JWT_SECRET", "")
    if secret and len(secret.encode("utf-8")) < 32:
        raise RuntimeError(
            "JWT_SECRET must be at least 32 bytes when used as HS256 key. "
            "Set JWT_PRIVATE_KEY/JWT_PUBLIC_KEY for RS256, or use a stronger secret."
        )
    return secret


def _get_public_key() -> str:
    key = os.environ.get("JWT_PUBLIC_KEY", "")
    if key:
        return key.replace("\\n", "\n")
    secret = os.environ.get("JWT_SECRET", "")
    if secret and len(secret.encode("utf-8")) < 32:
        raise RuntimeError(
            "JWT_SECRET must be at least 32 bytes when used as HS256 key. "
            "Set JWT_PRIVATE_KEY/JWT_PUBLIC_KEY for RS256, or use a stronger secret."
        )
    return secret


def _get_algorithm() -> str:
    if os.environ.get("JWT_PRIVATE_KEY") and os.environ.get("JWT_PUBLIC_KEY"):
        return "RS256"
    return "HS256"


def create_token(user_id: str, username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "user_id": user_id,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    key = _get_private_key()
    algorithm = _get_algorithm()
    token = jwt.encode(payload, key, algorithm=algorithm)
    return token


async def verify_token(authorization: Optional[str] = Header(None)) -> TokenPayload:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1]
    try:
        key = _get_public_key()
        algorithm = _get_algorithm()
        payload = jwt.decode(token, key, algorithms=[algorithm])
        token_payload = TokenPayload(
            sub=payload["sub"],
            user_id=payload["user_id"],
            exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
            iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        from src.database.redis_pool import RedisPool
        r = await RedisPool().get_client()
        revocation_key = f"revoked_token:{token}"
        is_revoked = await r.exists(revocation_key)
        if is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        raise
    except Exception:
        pass

    return token_payload


async def is_token_revoked(redis, token: str) -> bool:
    key = f"revoked_token:{token}"
    return await redis.exists(key) > 0


async def revoke_token(redis, token: str) -> None:
    key = f"revoked_token:{token}"
    await redis.setex(key, JWT_EXPIRY_HOURS * 3600, "1")


async def verify_token_with_revocation(
    authorization: Optional[str] = Header(None),
    redis=None,
) -> TokenPayload:
    token_payload = verify_token(authorization)
    if redis and authorization:
        token = authorization.split(" ", 1)[1]
        if await is_token_revoked(redis, token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
    return token_payload
