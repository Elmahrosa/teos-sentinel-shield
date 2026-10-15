"""
TEOS Sentinel Shield Client
Wraps the deployed Sentinel API.
Fail-closed: network errors -> BLOCK.
"""
import os
import httpx
import logging

logger = logging.getLogger(__name__)

SENTINEL_URL = os.environ.get(
    "SENTINEL_URL",
    "https://sentinel.teosegypt.com"
)


class SentinelClient:
    def __init__(self):
        self.base_url = SENTINEL_URL.rstrip("/")
        self._client = httpx.AsyncClient(timeout=5.0)

    async def check(self, payload: str, user_id: str = "system") -> dict:
        """
        Returns: {"action": "ALLOW"|"WARN"|"BLOCK", "rule": str, "message": str}
        Fails closed on any exception.
        """
        try:
            resp = await self._client.post(
                f"{self.base_url}/analyze",
                json={"content": payload, "user_id": user_id},
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code >= 500:
                logger.error(f"Sentinel server error: {resp.status_code}")
                return {
                    "action": "BLOCK",
                    "rule": "SENTINEL_ERROR",
                    "message": "Safety layer unavailable. Request blocked.",
                }
            return resp.json()
        except Exception as e:
            logger.error(f"Sentinel unreachable: {e} -- defaulting to BLOCK")
            return {
                "action": "BLOCK",
                "rule": "SENTINEL_UNREACHABLE",
                "message": "Safety layer unavailable. Request blocked.",
            }

    async def close(self) -> None:
        try:
            await self._client.aclose()
        except Exception:
            pass

    async def health(self) -> bool:
        try:
            resp = await self._client.get(f"{self.base_url}/health")
            return resp.status_code == 200
        except Exception:
            return False
