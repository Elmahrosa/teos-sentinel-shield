"""
TEOS Ephemeral Sentinel Patrols
Background scheduled audits that pull data via MCP, inspect it through
Sentinel Shield, and log to PostgreSQL. Patrol memory is isolated and
flushed after each execution cycle.
"""
import os
import asyncio
import time
import logging
import hashlib
from typing import Any, Optional

logger = logging.getLogger(__name__)

PATROL_INTERVAL = int(os.environ.get("PATROL_INTERVAL_SECONDS", "3600"))
PATROL_TIMEOUT = int(os.environ.get("PATROL_TIMEOUT_SECONDS", "300"))


class PatrolMemory:
    """Isolated, ephemeral memory for a single patrol cycle. Flushed after execution."""

    def __init__(self):
        self._data: dict[str, Any] = {}

    def store(self, key: str, value: Any) -> None:
        self._data[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def all(self) -> dict[str, Any]:
        return dict(self._data)

    def flush(self) -> None:
        self._data.clear()


class PatrolRunner:
    def __init__(self, sentinel, audit, mcp_manager, memory):
        self.sentinel = sentinel
        self.audit = audit
        self.mcp = mcp_manager
        self.memory = memory
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._patrol_count = 0

    async def run_patrol(
        self,
        patrol_id: str,
        server_name: str,
        tool_name: str,
        arguments: dict[str, Any],
        user_id: str = "patrol_system",
    ) -> dict[str, Any]:
        """
        Execute a single patrol cycle:
        1. Create isolated memory context
        2. Pull data via MCP (Sentinel-wrapped)
        3. Inspect payload through Sentinel
        4. Log result to PostgreSQL audit
        5. Flush patrol memory
        """
        patrol_mem = PatrolMemory()
        start_time = time.time()

        try:
            conn = self.mcp.get_connection(server_name)
            if not conn or not conn.is_connected:
                return {
                    "patrol_id": patrol_id,
                    "status": "skipped",
                    "reason": f"MCP server '{server_name}' not connected",
                    "duration_ms": 0,
                }

            patrol_mem.store("server", server_name)
            patrol_mem.store("tool", tool_name)

            result = await asyncio.wait_for(
                self.mcp.call_tool(server_name, tool_name, arguments),
                timeout=PATROL_TIMEOUT,
            )

            if result.get("is_error"):
                return {
                    "patrol_id": patrol_id,
                    "status": "error",
                    "error": result.get("error", "MCP call failed"),
                    "duration_ms": int((time.time() - start_time) * 1000),
                }

            content = result.get("content", "")
            patrol_mem.store("raw_content", content[:5000])

            verdict = await self.sentinel.check(
                f"PATROL_RESULT:{patrol_id}:{content[:2000]}",
                user_id=user_id,
            )

            verdict_action = verdict.get("action", "BLOCK")
            patrol_mem.store("verdict", verdict_action)

            content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

            await self.audit.log_verdict(
                user_id=user_id,
                payload=f"PATROL:{patrol_id}:{server_name}:{tool_name}",
                verdict=verdict_action,
                rule_triggered=verdict.get("rule"),
                session_id=patrol_id,
                action="patrol_audit",
            )

            duration_ms = int((time.time() - start_time) * 1000)

            logger.info(
                "Patrol %s complete: verdict=%s duration=%dms",
                patrol_id, verdict_action, duration_ms,
            )

            return {
                "patrol_id": patrol_id,
                "status": "completed",
                "verdict": verdict_action,
                "rule": verdict.get("rule"),
                "content_hash": content_hash,
                "duration_ms": duration_ms,
            }

        except asyncio.TimeoutError:
            logger.warning("Patrol %s timed out after %ds", patrol_id, PATROL_TIMEOUT)
            return {
                "patrol_id": patrol_id,
                "status": "timeout",
                "duration_ms": PATROL_TIMEOUT * 1000,
            }

        except Exception as e:
            logger.error("Patrol %s failed: %s", patrol_id, e)
            return {
                "patrol_id": patrol_id,
                "status": "error",
                "error": str(e),
                "duration_ms": int((time.time() - start_time) * 1000),
            }

        finally:
            patrol_mem.flush()

    async def run_scheduled_patrols(
        self,
        patrols: list[dict[str, Any]],
        interval: int = PATROL_INTERVAL,
    ) -> None:
        """
        Continuously run a list of patrol definitions on a schedule.
        Each patrol dict: {"id": str, "server": str, "tool": str, "args": dict}
        """
        self._running = True
        logger.info(
            "Scheduled patrol loop started: %d patrols, interval=%ds",
            len(patrols), interval,
        )

        while self._running:
            results = []
            for patrol in patrols:
                result = await self.run_patrol(
                    patrol_id=patrol["id"],
                    server_name=patrol["server"],
                    tool_name=patrol["tool"],
                    arguments=patrol.get("args", {}),
                )
                results.append(result)
                self._patrol_count += 1

            blocked = sum(1 for r in results if r.get("verdict") == "BLOCK")
            if blocked:
                logger.warning(
                    "Patrol cycle: %d/%d patrols flagged BLOCK",
                    blocked, len(results),
                )

            try:
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break

        logger.info("Patrol loop stopped after %d total patrols", self._patrol_count)

    def start(self, patrols: list[dict[str, Any]], interval: int = PATROL_INTERVAL) -> None:
        """Start the patrol loop as a background task."""
        if self._task and not self._task.done():
            logger.warning("Patrol loop already running")
            return
        self._task = asyncio.create_task(
            self.run_scheduled_patrols(patrols, interval)
        )
        logger.info("Patrol background task launched")

    def stop(self) -> None:
        """Signal the patrol loop to stop."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            logger.info("Patrol stop requested")

    @property
    def is_running(self) -> bool:
        return self._running and self._task is not None and not self._task.done()

    @property
    def patrol_count(self) -> int:
        return self._patrol_count

    def status(self) -> dict[str, Any]:
        return {
            "running": self.is_running,
            "total_patrols": self._patrol_count,
        }
