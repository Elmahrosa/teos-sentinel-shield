from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

from core.config import get_settings

REQUEST_COUNT = Counter("ingestion_requests_total", "Total ingestion requests", ["status"])
REQUEST_DURATION = Histogram("ingestion_request_duration_seconds", "Request duration")

router = APIRouter()
_security = HTTPBasic()


def _require_metrics_auth(
    credentials: HTTPBasicCredentials = Depends(_security),
) -> None:
    """Protect /metrics with HTTP Basic Auth (username=metrics, password=DASHBOARD_ADMIN_PASSWORD)."""
    settings = get_settings()
    ok = (
        secrets.compare_digest(credentials.username.encode(), b"metrics")
        and secrets.compare_digest(
            credentials.password.encode(),
            settings.dashboard_admin_password.encode(),
        )
    )
    if not ok:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )


@router.get("/metrics", dependencies=[Depends(_require_metrics_auth)])
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
