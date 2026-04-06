from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from api.routes.ingest import router as ingest_router
from api.routes.metrics import router as metrics_router
from core.config import get_settings
from core.database import init_db
from core.logging import configure_logging


settings = get_settings()
configure_logging(settings.log_level)
init_db()

app = FastAPI(title="Safe Ingestion Engine", version="2.0.0")
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(ingest_router)
app.include_router(metrics_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "2.0.0"}
