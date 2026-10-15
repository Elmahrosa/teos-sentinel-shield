"""
TEOS Core Orchestrator
Coordinates agents, memory, reasoning, tools, RAG, MCP, webhooks, and security.
All requests pass through Sentinel Shield before execution.
Fail-closed: any Sentinel error defaults to BLOCK.
Production-hardened: non-blocking audit, defensive shutdown, RAG contamination shield.
"""
import os
import asyncio
import logging
from typing import Any, Optional

from anthropic import Anthropic

from src.security.sentinel import SentinelClient
from src.memory.store import MemoryStore
from src.reasoning.chain import ReasoningChain
from src.agents.registry import AgentRegistry
from src.tools.registry import ToolRegistry
from src.database.audit import AuditLogger
from src.rag.vector_store import VectorStore
from src.webhooks.sender import dispatch_webhook
from src.analytics.tracker import UsageTracker
from src.mcp.client import MCPManager
from src.mcp.bridge import register_mcp_tools
from src.mcp.sentinel_wrapper import SentinelMCPWrapper
from src.memory.skill_forge import SkillForge
from src.core.patrols import PatrolRunner
from src.core.message_queue import MessageQueue
from src.database.redis_pool import RedisPool

logger = logging.getLogger(__name__)


class TEOSOrchestrator:
    """
    Central orchestrator for TEOS Superintelligence.
    All requests pass through Sentinel Shield before execution.
    Fail-closed: any Sentinel error defaults to BLOCK.
    """

    def __init__(self):
        self.client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        self.sentinel = SentinelClient()
        self.memory = MemoryStore()
        self.reasoning = ReasoningChain(self.client)
        self.agents = AgentRegistry()
        self.tools = ToolRegistry()
        self.audit = AuditLogger()
        self.vector_store = VectorStore()
        self.usage_tracker = UsageTracker()
        self.mcp_manager = MCPManager()
        self.mcp_sentinel = SentinelMCPWrapper(self.sentinel, self.audit, self.mcp_manager)
        self.skill_forge = SkillForge(self.agents, self.vector_store, self.audit, self.memory)
        self.patrol_runner = PatrolRunner(self.sentinel, self.audit, self.mcp_manager, self.memory)
        self.message_queue = MessageQueue(self.sentinel, self.audit)
        self.model = "claude-sonnet-4-6"
        self.agents.init(self.client)

    async def startup(self) -> None:
        await RedisPool().connect()
        await self.memory.connect()
        try:
            await self.audit.connect()
        except Exception as e:
            logger.warning("Audit DB unavailable (degraded mode): %s", e)
        await self.mcp_manager.startup()
        await self.message_queue.connect()
        mcp_count = register_mcp_tools(self.mcp_manager, self.tools)
        logger.info("TEOS Orchestrator started (MCP tools registered: %d)", mcp_count)

    async def shutdown(self) -> None:
        self.patrol_runner.stop()
        for name, cleanup in [
            ("mcp_manager", lambda: self.mcp_manager.shutdown()),
            ("audit", lambda: self.audit.disconnect()),
            ("memory", lambda: self.memory.disconnect()),
            ("message_queue", lambda: self.message_queue.disconnect()),
            ("usage_tracker", lambda: self.usage_tracker.disconnect()),
            ("sentinel", lambda: self.sentinel.close()),
            ("redis_pool", lambda: RedisPool().disconnect()),
        ]:
            try:
                await cleanup()
            except Exception as e:
                logger.warning("Shutdown %s failed (non-fatal): %s", name, e)
        logger.info("TEOS Orchestrator stopped")

    async def _safe_audit(
        self,
        user_id: str,
        payload: str,
        verdict: str,
        rule_triggered: Optional[str] = None,
        session_id: Optional[str] = None,
        action: str = "analyze",
    ) -> None:
        """Non-blocking audit log. Never crashes the caller."""
        try:
            await self.audit.log_verdict(
                user_id=user_id,
                payload=payload,
                verdict=verdict,
                rule_triggered=rule_triggered,
                session_id=session_id,
                action=action,
            )
        except Exception as e:
            logger.warning("Audit log failed (non-fatal): %s", e)

    async def process(
        self,
        query: str,
        session_id: str,
        user_id: str,
        agent_name: Optional[str] = None,
        callback_url: Optional[str] = None,
        images: list[dict] | None = None,
        search_rag: bool = False,
        webhook_secret: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Main entrypoint. Steps:
        1. Sentinel pre-flight check
        2. Audit log the verdict (non-blocking)
        3. Load memory context + RAG context (filtered for active only)
        4. Route to agent or direct reasoning (with optional images)
        5. Track usage
        6. Sentinel post-flight check on response
        7. Audit log the post-flight verdict (non-blocking)
        8. Persist to memory + agent memory
        9. Dispatch webhook if callback_url provided
        10. Return result
        """
        # 1. Pre-flight security check
        verdict = await self.sentinel.check(query, user_id=user_id)
        await self._safe_audit(
            user_id=user_id,
            payload=query,
            verdict=verdict["action"],
            rule_triggered=verdict.get("rule"),
            session_id=session_id,
            action="pre_check",
        )

        if verdict["action"] != "ALLOW":
            logger.warning(
                f"Sentinel {verdict['action']} | user={user_id} | rule={verdict.get('rule')}"
            )
            result = {
                "status": "blocked",
                "action": verdict["action"],
                "rule": verdict.get("rule"),
                "message": verdict.get(
                    "message", "Request blocked by TEOS Sentinel Shield."
                ),
            }
            await self._post_process(session_id, user_id, result, callback_url, webhook_secret)
            return result

        # 2. Memory context
        context = await self.memory.get_context(session_id, limit=10)

        # 3. RAG context — contamination shield: only active docs
        rag_context = []
        if search_rag:
            try:
                rag_context = self.vector_store.search(query, n_results=3)
                if rag_context:
                    context.append({
                        "role": "user",
                        "content": "[RAG Context]:\n" + "\n---\n".join(
                            d["content"] for d in rag_context
                        ),
                    })
            except Exception as e:
                logger.warning("RAG search failed: %s", e)

        # 4. Route
        if agent_name:
            agent = self.agents.get(agent_name)
            if not agent:
                result = {
                    "status": "error",
                    "message": f"Agent '{agent_name}' not found. Available: {', '.join(a['name'] for a in self.agents.list_agents())}",
                }
                await self._post_process(session_id, user_id, result, callback_url, webhook_secret)
                return result
            result_data = await agent.run(query, context=context)
        else:
            result_data = await self.reasoning.think(query, context=context, images=images)

        content = result_data.get("content", "")
        input_tokens = result_data.get("input_tokens", 0)
        output_tokens = result_data.get("output_tokens", 0)

        # 5. Track usage
        try:
            await self.usage_tracker.log_usage(
                user_id=user_id,
                session_id=session_id,
                agent=agent_name or "default",
                model=result_data.get("model", self.model),
                input_tokens=input_tokens,
                output_tokens=output_tokens,
            )
        except Exception as e:
            logger.warning("Usage tracking failed (non-fatal): %s", e)

        # 6. Post-flight check on response content
        post_verdict = await self.sentinel.check(content, user_id=user_id)
        await self._safe_audit(
            user_id=user_id,
            payload=content,
            verdict=post_verdict["action"],
            rule_triggered=post_verdict.get("rule"),
            session_id=session_id,
            action="post_check",
        )

        if post_verdict["action"] == "BLOCK":
            logger.error(f"Sentinel BLOCK on response | user={user_id}")
            result = {
                "status": "blocked",
                "action": "BLOCK",
                "rule": post_verdict.get("rule"),
                "message": "Response blocked by safety layer.",
            }
            await self._post_process(session_id, user_id, result, callback_url, webhook_secret)
            return result

        # 7. Persist to memory
        try:
            await self.memory.save(session_id, role="user", content=query)
            await self.memory.save(session_id, role="assistant", content=content)
        except Exception as e:
            logger.warning("Memory save failed (non-fatal): %s", e)

        # 8. Save agent memory if agent used
        if agent_name:
            try:
                await self.memory.save_agent_memory(
                    agent_name, session_id, "last_query", query
                )
                await self.memory.save_agent_memory(
                    agent_name, session_id, "last_response", content
                )
            except Exception as e:
                logger.warning("Agent memory save failed (non-fatal): %s", e)

        result = {
            "status": "ok",
            "result": content,
            "agent": agent_name or "default",
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "rag_sources": len(rag_context) if rag_context else 0,
        }

        asyncio.ensure_future(
            self._trigger_skill_forge(query, content, session_id, user_id)
        )

        await self._post_process(session_id, user_id, result, callback_url, webhook_secret)
        return result

    async def _trigger_skill_forge(
        self,
        task_context: str,
        task_result: str,
        session_id: str,
        user_id: str,
    ) -> None:
        """Fire-and-forget: generate SOP from completed task context."""
        try:
            forge_result = await self.skill_forge.forge(
                task_context=task_context,
                task_result=task_result,
                session_id=session_id,
                user_id=user_id,
            )
            if forge_result.get("status") == "embedded":
                logger.info(
                    "Skill Forge: SOP embedded (%s)", forge_result.get("embed", {}).get("doc_id")
                )
        except Exception as e:
            logger.warning("Skill Forge trigger failed: %s", e)

    async def _post_process(
        self,
        session_id: str,
        user_id: str,
        result: dict,
        callback_url: Optional[str] = None,
        webhook_secret: Optional[str] = None,
    ) -> None:
        if callback_url:
            asyncio.ensure_future(
                dispatch_webhook(callback_url, result, webhook_secret)
            )
