from __future__ import annotations

import json
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="forbid",
        case_sensitive=False,
    )

    app_name: str = "safe-ingestion-engine"
    environment: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"

    database_url: str = "sqlite:///./data/jobs.db"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    pii_salt: str
    api_key_salt: str
    gas_webhook_secret: str = ""
    dashboard_admin_password: str
    api_key_hashes_json: str = "[]"

    request_timeout_seconds: int = 10
    max_response_bytes: int = 5_242_880
    robots_error_mode: str = "deny"
    allow_redirects: bool = False
    rate_limit_per_minute: int = 10
    cors_origins_json: str = "[]"

    @field_validator("pii_salt", "api_key_salt")
    @classmethod
    def validate_salt(cls, v: str) -> str:
        if not v or len(v) < 32:
            raise ValueError("salt values must be at least 32 characters")
        return v

    @field_validator("dashboard_admin_password")
    @classmethod
    def validate_dashboard_password(cls, v: str) -> str:
        if not v or len(v) < 12:
            raise ValueError("DASHBOARD_ADMIN_PASSWORD must be at least 12 characters")
        return v

    @field_validator("robots_error_mode")
    @classmethod
    def validate_robots_mode(cls, v: str) -> str:
        allowed = {"deny", "allow"}
        if v not in allowed:
            raise ValueError(f"ROBOTS_ERROR_MODE must be one of {sorted(allowed)}")
        return v

    @property
    def api_key_hashes(self) -> list[str]:
        value = json.loads(self.api_key_hashes_json)
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise ValueError("API_KEY_HASHES_JSON must be a JSON array of strings")
        return value

    @property
    def cors_origins(self) -> list[str]:
        value = json.loads(self.cors_origins_json)
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise ValueError("CORS_ORIGINS_JSON must be a JSON array of strings")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
