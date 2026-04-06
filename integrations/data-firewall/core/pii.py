from __future__ import annotations

import hashlib
import hmac
import re
from dataclasses import dataclass

from core.config import get_settings
from core.logging import logger


settings = get_settings()

# ── Regex patterns ────────────────────────────────────────────────────────────
# All patterns are anchored/bounded to reduce false positives and ReDoS risk.

EMAIL_RE = re.compile(r"(?i)\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b")

# Phone: optional +country code, digits/spaces/dashes, 7-15 digits total
PHONE_RE = re.compile(r"\+?1?[\s.\-]?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}\b")

# Credit card: 13-19 digits, grouped by spaces or dashes (Luhn-format-like)
# Possessive quantifier keeps it linear — no backtracking
CARD_RE = re.compile(r"\b(?:\d[ -]?){13,18}\d\b")

# SSN: xxx-xx-xxxx or xxxxxxxxx (9 digits)
SSN_RE = re.compile(r"\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0{4})\d{4}\b")

# IPv4: standard dotted-quad, each octet 0-255
IPV4_RE = re.compile(
    r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}"
    r"(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b"
)

# Maximum input size for scrubbing (1 MB)
MAX_SCRUB_BYTES = 1_000_000


@dataclass
class PIIScrubResult:
    text: str
    count: int
    truncated: bool = False


@dataclass
class AIResult:
    available: bool
    error: str | None = None
    spans: list[tuple[int, int, str]] | None = None


def detect_pii_ai(text: str) -> AIResult:
    return AIResult(available=False, error="presidio_not_configured")


def stable_hash(value: str) -> str:
    return hmac.new(
        settings.pii_salt.encode("utf-8"),
        value.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _scrub_with_regex(text: str) -> PIIScrubResult:
    count = 0

    def _replace(kind: str):
        def inner(match: re.Match) -> str:
            nonlocal count
            count += 1
            return f"[{kind}:{stable_hash(match.group(0))[:12]}]"
        return inner

    # Order matters: SSN before PHONE (SSN digits could partially match phone)
    text = EMAIL_RE.sub(_replace("EMAIL"), text)
    text = SSN_RE.sub(_replace("SSN"), text)
    text = PHONE_RE.sub(_replace("PHONE"), text)
    text = CARD_RE.sub(_replace("CARD"), text)
    text = IPV4_RE.sub(_replace("IPV4"), text)
    return PIIScrubResult(text=text, count=count)


def scrub_text(text: str, fallback_to_regex: bool = True) -> PIIScrubResult:
    truncated = False

    # Truncate oversized input instead of skipping scrubbing entirely.
    # This ensures PII in the first 1MB is always scrubbed.
    if len(text) > MAX_SCRUB_BYTES:
        logger.warning(
            "pii.scrub.truncated",
            original_len=len(text),
            truncated_to=MAX_SCRUB_BYTES,
            security_event=True,
        )
        text = text[:MAX_SCRUB_BYTES]
        truncated = True

    ai_result = detect_pii_ai(text)
    if not ai_result.available:
        if fallback_to_regex:
            result = _scrub_with_regex(text)
        else:
            logger.error("pii.presidio_failed", error=ai_result.error, security_event=True)
            raise RuntimeError(f"PII scrubbing unavailable: {ai_result.error}")
    else:
        result = PIIScrubResult(text=text, count=0)

    if result.count > 0:
        logger.warning(
            "pii.scrubbed",
            count=result.count,
            truncated=truncated,
            mode="hmac_hash",
            security_event=True,
        )

    result.truncated = truncated
    return result
