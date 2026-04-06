from __future__ import annotations

import hashlib
import hmac

import redis as redis_lib

from core.config import get_settings

_redis_client: redis_lib.Redis | None = None

PLAN_TTL: dict[str, int | None] = {
    "trial": 60 * 60 * 48,
    "starter": 60 * 60 * 24 * 32,
    "growth": 60 * 60 * 24 * 32,
    "enterprise": None,
}


def _get_redis() -> redis_lib.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis_lib.Redis.from_url(
            get_settings().redis_url, decode_responses=True
        )
    return _redis_client


def hash_api_key(api_key: str, salt: str | None = None) -> str:
    settings = get_settings()
    secret = (salt or settings.api_key_salt).encode("utf-8")
    return hmac.new(secret, api_key.encode("utf-8"), hashlib.sha256).hexdigest()


def _credit_key(key_hash: str) -> str:
    return f"key:{key_hash}"


def _meta_key(key_hash: str) -> str:
    return f"meta:{key_hash}"


def register_api_key(
    api_key: str,
    credits: int = 100,
    plan: str = "starter",
    ttl_seconds: int | None = None,
) -> str:
    key_hash = hash_api_key(api_key)
    r = _get_redis()
    ttl = ttl_seconds if ttl_seconds is not None else PLAN_TTL.get(plan)

    pipe = r.pipeline()
    pipe.set(_credit_key(key_hash), credits)
    pipe.set(_meta_key(key_hash), plan)
    if ttl:
        pipe.expire(_credit_key(key_hash), ttl)
        pipe.expire(_meta_key(key_hash), ttl)
    pipe.execute()

    return key_hash


def expire_api_key(api_key: str) -> None:
    key_hash = hash_api_key(api_key)
    r = _get_redis()
    pipe = r.pipeline()
    pipe.set(_credit_key(key_hash), 0)
    pipe.expire(_credit_key(key_hash), 1)
    pipe.expire(_meta_key(key_hash), 1)
    pipe.execute()


def revoke_api_key(api_key: str) -> None:
    key_hash = hash_api_key(api_key)
    r = _get_redis()
    r.delete(_credit_key(key_hash), _meta_key(key_hash))


def is_valid_api_key(api_key: str) -> bool:
    key_hash = hash_api_key(api_key)
    return _get_redis().exists(_credit_key(key_hash)) == 1


def get_credits(api_key: str) -> int:
    key_hash = hash_api_key(api_key)
    value = _get_redis().get(_credit_key(key_hash))
    return int(value) if value is not None else 0


def deduct_credit(api_key: str) -> bool:
    key_hash = hash_api_key(api_key)
    redis_client = _get_redis()
    ckey = _credit_key(key_hash)

    with redis_client.pipeline() as pipe:
        while True:
            try:
                pipe.watch(ckey)
                current = redis_client.get(ckey)
                credits = int(current) if current is not None else 0
                if credits <= 0:
                    pipe.unwatch()
                    return False
                pipe.multi()
                pipe.decr(ckey)
                pipe.execute()
                return True
            except redis_lib.WatchError:
                continue


def add_credits(api_key: str, amount: int) -> int:
    key_hash = hash_api_key(api_key)
    return int(_get_redis().incrby(_credit_key(key_hash), amount))


def get_key_info(api_key: str) -> dict:
    key_hash = hash_api_key(api_key)
    r = _get_redis()
    ckey = _credit_key(key_hash)
    mkey = _meta_key(key_hash)

    credits = r.get(ckey)
    plan = r.get(mkey)
    ttl = r.ttl(ckey)

    return {
        "valid": credits is not None,
        "credits": int(credits) if credits is not None else 0,
        "plan": plan or "unknown",
        "hash_preview": key_hash[:12],
        "expires_in_seconds": ttl if ttl >= 0 else None,
    }
