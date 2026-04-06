from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import get_settings
from core.logging import logger
from core.models import Base


settings = get_settings()

if settings.database_url.startswith("sqlite:///./"):
    os.makedirs("./data", exist_ok=True)

engine = create_engine(
    settings.database_url,
    future=True,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    if settings.environment == "production" and settings.database_url.startswith("sqlite"):
        logger.critical(
            "sqlite_not_recommended_for_production",
            suggestion="Set DATABASE_URL to postgresql://...",
            security_event=True,
        )
    Base.metadata.create_all(bind=engine)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def execute_with_retry(session, stmt):
    try:
        return session.execute(stmt)
    except sqlite3.OperationalError as exc:
        if "database is locked" in str(exc).lower():
            raise
        raise


@contextmanager
def session_scope():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
