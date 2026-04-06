from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request


def get_api_key(request: Request) -> str:
    key = request.headers.get("x-api-key", "")
    if key:
        return f"apikey:{key[:16]}"
    return get_remote_address(request)


limiter = Limiter(key_func=get_api_key)