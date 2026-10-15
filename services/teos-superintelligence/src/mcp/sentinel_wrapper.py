"""
TEOS Sentinel Shield — MCP Wrapper
Wraps ALL MCP tool calls with pre-flight and post-flight Sentinel checks.
Fail-closed: if Sentinel is unreachable, MCP call is BLOCKED.
Never executes an MCP tool call or streams output without passing deterministic checks.
"""
import hashlib
import logging
from typing import Any

from src.security.sentinel import SentinelClient
from src.database.audit import AuditLogger
from src.mcp.client import MCPManager

logger = logging.getLogger(__name__)


class SentinelMCPWrapper:
    def __init__(self, sentinel: SentinelClient, audit: AuditLogger, mcp_manager: MCPManager):
        self.sentinel = sentinel
        self.audit = audit
        self.mcp = mcp_manager

    def _hash_payload(self, payload: str) -> str:
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    async def call_tool(
        self,
        server_name: str,
        tool_name: str,
        arguments: dict[str, Any],
        user_id: str = "system",
        session_id: str = "",
    ) -> dict[str, Any]:
        args_str = str(arguments)

        pre_verdict = await self.sentinel.check(
            f"MCP_CALL:{server_name}:{tool_name}:{args_str}",
            user_id=user_id,
        )

        await self.audit.log_verdict(
            user_id=user_id,
            payload=f"MCP:{server_name}:{tool_name}",
            verdict=pre_verdict["action"],
            rule_triggered=pre_verdict.get("rule"),
            session_id=session_id,
            action="mcp_pre_check",
        )

        if pre_verdict["action"] != "ALLOW":
            logger.warning(
                "Sentinel %s on MCP pre-call: %s::%s | user=%s | rule=%s",
                pre_verdict["action"], server_name, tool_name,
                user_id, pre_verdict.get("rule"),
            )
            return {
                "error": "MCP call blocked by Sentinel Shield",
                "action": pre_verdict["action"],
                "rule": pre_verdict.get("rule"),
                "message": pre_verdict.get("message", "Request blocked by TEOS Sentinel Shield."),
                "is_error": True,
            }

        result = await self.mcp.call_tool(server_name, tool_name, arguments)

        result_content = result.get("content", "")
        post_verdict = await self.sentinel.check(
            f"MCP_RESULT:{server_name}:{tool_name}:{result_content[:2000]}",
            user_id=user_id,
        )

        await self.audit.log_verdict(
            user_id=user_id,
            payload=f"MCP_RESULT:{server_name}:{tool_name}",
            verdict=post_verdict["action"],
            rule_triggered=post_verdict.get("rule"),
            session_id=session_id,
            action="mcp_post_check",
        )

        if post_verdict["action"] == "BLOCK":
            logger.error(
                "Sentinel BLOCK on MCP post-call: %s::%s | user=%s | rule=%s",
                server_name, tool_name, user_id, post_verdict.get("rule"),
            )
            return {
                "error": "MCP response blocked by Sentinel Shield",
                "action": "BLOCK",
                "rule": post_verdict.get("rule"),
                "message": "Response blocked by safety layer.",
                "is_error": True,
            }

        return result

    async def call_tool_stream(
        self,
        server_name: str,
        tool_name: str,
        arguments: dict[str, Any],
        user_id: str = "system",
        session_id: str = "",
    ):
        result = await self.call_tool(server_name, tool_name, arguments, user_id, session_id)
        if result.get("is_error"):
            yield {"event": "error", "data": result}
            return

        content = result.get("content", "")
        chunk_size = 100
        for i in range(0, len(content), chunk_size):
            chunk = content[i : i + chunk_size]

            mid_verdict = await self.sentinel.check(
                f"MCP_CHUNK:{server_name}:{tool_name}:{chunk}",
                user_id=user_id,
            )

            if mid_verdict["action"] == "BLOCK":
                logger.error(
                    "Sentinel BLOCK on MCP stream chunk: %s::%s | user=%s",
                    server_name, tool_name, user_id,
                )
                yield {"event": "error", "data": {
                    "error": "Stream blocked by Sentinel Shield mid-delivery",
                    "rule": mid_verdict.get("rule"),
                }}
                return

            yield {"event": "token", "data": {"text": chunk}}

        yield {"event": "done", "data": {"status": "complete"}}

    async def health(self) -> dict:
        return await self.mcp.health()
