from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class JobStatus(str, enum.Enum):
    PENDING   = "PENDING"
    RUNNING   = "RUNNING"
    RETRYING  = "RETRYING"
    COMPLETED = "COMPLETED"
    BLOCKED   = "BLOCKED"
    FAILED    = "FAILED"


VALID_TRANSITIONS: dict[JobStatus, set[JobStatus]] = {
    JobStatus.PENDING:   {JobStatus.RUNNING, JobStatus.BLOCKED},
    JobStatus.RUNNING:   {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.RETRYING},
    JobStatus.RETRYING:  {JobStatus.RUNNING, JobStatus.FAILED},
    JobStatus.COMPLETED: set(),
    JobStatus.BLOCKED:   set(),
    JobStatus.FAILED:    set(),
}


def transition(current: JobStatus, next_status: JobStatus) -> JobStatus:
    if next_status not in VALID_TRANSITIONS[current]:
        raise ValueError(
            f"Invalid transition: {current.value} -> {next_status.value}"
        )
    return next_status


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    source_url: Mapped[str] = mapped_column(Text)
    domain: Mapped[str | None] = mapped_column(String(256), nullable=True, index=True)
    tenant_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)

    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus), default=JobStatus.PENDING, index=True
    )
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    last_attempt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    api_key_hash: Mapped[str] = mapped_column(String(64), index=True)
    result_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    pii_found: Mapped[int] = mapped_column(Integer, default=0)
    security_event: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)