"""
Core test suite — Safe Ingestion Engine v3.0.0
Covers: models, auth, PII, policy, content hashing, job status machine
"""
from __future__ import annotations

import hashlib
import pytest
from unittest.mock import MagicMock, patch


# ── JobStatus state machine ───────────────────────────────────────────────────

from core.models import JobStatus, transition


def test_pending_to_running():
    assert transition(JobStatus.PENDING, JobStatus.RUNNING) == JobStatus.RUNNING


def test_pending_to_blocked():
    assert transition(JobStatus.PENDING, JobStatus.BLOCKED) == JobStatus.BLOCKED


def test_running_to_completed():
    assert transition(JobStatus.RUNNING, JobStatus.COMPLETED) == JobStatus.COMPLETED


def test_running_to_retrying():
    assert transition(JobStatus.RUNNING, JobStatus.RETRYING) == JobStatus.RETRYING


def test_running_to_failed():
    assert transition(JobStatus.RUNNING, JobStatus.FAILED) == JobStatus.FAILED


def test_retrying_to_running():
    assert transition(JobStatus.RETRYING, JobStatus.RUNNING) == JobStatus.RUNNING


def test_retrying_to_failed():
    assert transition(JobStatus.RETRYING, JobStatus.FAILED) == JobStatus.FAILED


def test_invalid_transition_completed():
    with pytest.raises(ValueError):
        transition(JobStatus.COMPLETED, JobStatus.RUNNING)


def test_invalid_transition_blocked():
    with pytest.raises(ValueError):
        transition(JobStatus.BLOCKED, JobStatus.COMPLETED)


def test_invalid_transition_failed():
    with pytest.raises(ValueError):
        transition(JobStatus.FAILED, JobStatus.RUNNING)


def test_invalid_transition_pending_to_failed():
    with pytest.raises(ValueError):
        transition(JobStatus.PENDING, JobStatus.FAILED)


# ── Content hashing ───────────────────────────────────────────────────────────

def _hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def test_content_hash_deterministic():
    assert _hash("hello world") == _hash("hello world")


def test_content_hash_different_inputs():
    assert _hash("hello") != _hash("world")


def test_content_hash_length():
    assert len(_hash("test")) == 64


def test_content_hash_empty():
    h = _hash("")
    assert len(h) == 64


# ── PII scrubbing ─────────────────────────────────────────────────────────────

from core.pii import scrub_text


def test_pii_email_redacted():
    result = scrub_text("Contact us at user@example.com for help.")
    assert "user@example.com" not in result.text
    assert result.count >= 1


def test_pii_phone_redacted():
    result = scrub_text("Call us at +1 555 867 5309 anytime.")
    assert "555 867 5309" not in result.text


def test_pii_credit_card_redacted():
    result = scrub_text("Card number: 4111 1111 1111 1111")
    assert "4111 1111 1111 1111" not in result.text


def test_pii_no_false_positive_plain_text():
    result = scrub_text("The quick brown fox jumps over the lazy dog.")
    assert result.count == 0


def test_pii_multiple_emails():
    result = scrub_text("Email a@b.com or c@d.com for support.")
    assert result.count >= 2


def test_pii_result_has_text():
    result = scrub_text("Hello user@test.com")
    assert isinstance(result.text, str)
    assert len(result.text) > 0


# ── SSRF guard ────────────────────────────────────────────────────────────────

from collectors.http_connector import SSRFBlockedError, HTTPConnector
import asyncio


def test_ssrf_localhost_blocked():
    connector = HTTPConnector()
    with pytest.raises(Exception):
        asyncio.run(connector._validate_host_async("http://127.0.0.1/admin"))


def test_ssrf_private_ip_blocked():
    connector = HTTPConnector()
    with pytest.raises(Exception):
        asyncio.run(connector._validate_host_async("http://192.168.1.1/data"))


def test_ssrf_internal_blocked():
    connector = HTTPConnector()
    with pytest.raises(Exception):
        asyncio.run(connector._validate_host_async("http://10.0.0.1/secret"))


def test_ssrf_unsupported_scheme():
    connector = HTTPConnector()
    with pytest.raises(SSRFBlockedError):
        asyncio.run(connector._validate_host_async("ftp://example.com/file"))


# ── Auth / API key hashing ────────────────────────────────────────────────────

from core.auth import hash_api_key


def test_hash_api_key_deterministic():
    assert hash_api_key("sk-test123") == hash_api_key("sk-test123")


def test_hash_api_key_different_keys():
    assert hash_api_key("sk-aaa") != hash_api_key("sk-bbb")


def test_hash_api_key_not_plaintext():
    result = hash_api_key("sk-mysecretkey")
    assert "sk-mysecretkey" not in result


def test_hash_api_key_length():
    result = hash_api_key("sk-test")
    assert len(result) == 64