# tests/conftest.py
from __future__ import annotations
import os
import pytest
from unittest.mock import patch

@pytest.fixture(autouse=True)
def mock_settings_for_tests():
    """Override Settings with test-safe defaults for all tests."""
    test_env = {
        "PII_SALT": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "API_KEY_SALT": "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
        "GAS_WEBHOOK_SECRET": "test-secret",
        "DASHBOARD_ADMIN_PASSWORD": "TestPass123!",
        "DATABASE_URL": "sqlite:///:memory:",
        "REDIS_URL": "redis://localhost:6379/15",
        "CELERY_BROKER_URL": "redis://localhost:6379/14",
        "CELERY_RESULT_BACKEND": "redis://localhost:6379/13",
        "ENVIRONMENT": "test",
        "LOG_LEVEL": "WARNING",
    }
    
    with patch.dict(os.environ, test_env, clear=False):
        # Clear lru_cache so Settings reloads with new env
        from core.config import get_settings
        get_settings.cache_clear()
        yield
        get_settings.cache_clear()
