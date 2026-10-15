"""
TEOS Audit Logger
PostgreSQL-backed audit log for all Sentinel verdicts.
Never stores raw payload content - only SHA-256 hash.
"""
import os
import hashlib
import logging
from typing import Optional

import asyncpg

logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://teos:teos@localhost:5432/teos")

CREATE_AUDIT_TABLE = """
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    rule_triggered VARCHAR(255),
    verdict VARCHAR(20) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_verdict ON audit_log (verdict);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log (created_at);
"""


class AuditLogger:
    def __init__(self) -> None:
        self._pool: Optional[asyncpg.Pool] = None

    async def connect(self) -> None:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=1,
                max_size=10,
                command_timeout=30,
            )
            async with self._pool.acquire() as conn:
                await conn.execute(CREATE_AUDIT_TABLE)
            logger.info("Audit logger connected and schema ensured")

    async def disconnect(self) -> None:
        if self._pool:
            await self._pool.close()
            self._pool = None

    def _hash_payload(self, payload: str) -> str:
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    async def log_verdict(
        self,
        user_id: str,
        payload: str,
        verdict: str,
        rule_triggered: Optional[str] = None,
        session_id: Optional[str] = None,
        action: str = "analyze",
    ) -> None:
        payload_hash = self._hash_payload(payload)
        query = """
        INSERT INTO audit_log (user_id, session_id, action, rule_triggered, verdict, payload_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
        """
        conn = await self._pool.acquire()
        try:
            await conn.execute(query, user_id, session_id, action, rule_triggered, verdict, payload_hash)
        finally:
            await self._pool.release(conn)

    async def get_recent(
        self,
        limit: int = 100,
        offset: int = 0,
        user_id: Optional[str] = None,
        verdict: Optional[str] = None,
    ) -> list[dict]:
        conditions = []
        params: list = []
        param_idx = 1

        if user_id:
            conditions.append(f"user_id = ${param_idx}")
            params.append(user_id)
            param_idx += 1
        if verdict:
            conditions.append(f"verdict = ${param_idx}")
            params.append(verdict)
            param_idx += 1

        where = ""
        if conditions:
            where = "WHERE " + " AND ".join(conditions)

        query = f"""
        SELECT id, timestamp, user_id, session_id, action, rule_triggered, verdict, payload_hash, created_at
        FROM audit_log
        {where}
        ORDER BY created_at DESC
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])

        conn = await self._pool.acquire()
        try:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
        finally:
            await self._pool.release(conn)

    async def count_blocked(self, user_id: Optional[str] = None) -> int:
        if user_id:
            query = "SELECT COUNT(*) FROM audit_log WHERE verdict = 'BLOCK' AND user_id = $1"
            conn = await self._pool.acquire()
            try:
                row = await conn.fetchval(query, user_id)
            finally:
                await self._pool.release(conn)
        else:
            query = "SELECT COUNT(*) FROM audit_log WHERE verdict = 'BLOCK'"
            conn = await self._pool.acquire()
            try:
                row = await conn.fetchval(query)
            finally:
                await self._pool.release(conn)
        return row or 0
