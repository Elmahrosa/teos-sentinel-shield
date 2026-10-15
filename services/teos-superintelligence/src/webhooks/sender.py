"""
TEOS Webhook Sender
Delivers async inference results to callback URLs via background task.
"""
import json
import logging
import hmac
import hashlib
from typing import Optional
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)


class WebhookDelivery:
    def __init__(self, callback_url: str, secret: Optional[str] = None):
        self.callback_url = callback_url
        if not secret:
            raise ValueError("Webhook secret is required for HMAC signing")
        self.secret = secret

    def _sign_payload(self, payload: str) -> str:
        return hmac.new(
            self.secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    async def deliver(self, result: dict) -> bool:
        payload_str = json.dumps(result, default=str)
        signature = self._sign_payload(payload_str)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    self.callback_url,
                    json=result,
                    headers={
                        "Content-Type": "application/json",
                        "X-TEOS-Signature": signature,
                        "X-TEOS-Timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
                if resp.is_success:
                    logger.info("Webhook delivered to %s", self.callback_url)
                    return True
                logger.warning(
                    "Webhook to %s returned %s", self.callback_url, resp.status_code
                )
                return False
        except Exception as e:
            logger.error("Webhook delivery failed for %s: %s", self.callback_url, e)
            return False


async def dispatch_webhook(
    callback_url: str,
    result: dict,
    secret: Optional[str] = None,
) -> bool:
    if not secret:
        logger.error("Webhook dispatch skipped: no secret configured")
        return False
    delivery = WebhookDelivery(callback_url, secret)
    return await delivery.deliver(result)
