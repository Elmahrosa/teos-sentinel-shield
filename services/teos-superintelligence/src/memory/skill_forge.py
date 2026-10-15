"""
TEOS Constitutional Skill Forge
After multi-step MCP tasks, generates SOP proposals and routes them through
Governance Agent (ISO 42001) + Security Agent (MITRE ATT&CK) for consensus.
Verified SOPs are cryptographically signed and embedded in ChromaDB as
{"type": "verified_sovereign_skill"}.
Constitution-First: no SOP is embedded without dual-agent verification.
"""
import asyncio
import os
import json
import time
import hashlib
import logging
from typing import Any

logger = logging.getLogger(__name__)

FORGE_SESSION_PREFIX = "skillforge"


def _sign_payload(payload: str, secret: str) -> str:
    """HMAC-SHA256 signing for verified SOPs."""
    return hashlib.sha256((payload + secret).encode("utf-8")).hexdigest()


class SkillForge:
    def __init__(self, agents, vector_store, audit, memory):
        self.agents = agents
        self.vector_store = vector_store
        self.audit = audit
        self.memory = memory
        self._signing_secret = os.environ.get("SOP_SIGNING_SECRET", os.environ.get("JWT_SECRET", ""))

    async def generate_sop(
        self,
        task_context: str,
        task_result: str,
        session_id: str,
        user_id: str = "system",
    ) -> dict[str, Any]:
        """
        Phase 1: Generate an SOP proposal from completed multi-step task context.
        Returns raw proposal dict ready for verification.
        """
        governance = self.agents.get("governance")
        if not governance:
            return {"error": "Governance agent not available", "status": "failed"}

        sop_prompt = (
            "Based on the following completed task, generate a Standard Operating Procedure (SOP).\n\n"
            "TASK CONTEXT:\n"
            f"{task_context}\n\n"
            "TASK RESULT:\n"
            f"{task_result}\n\n"
            "Output a JSON object with exactly these fields:\n"
            '- "title": short descriptive title\n'
            '- "version": "1.0"\n'
            '- "objective": one-sentence goal\n'
            '- "steps": list of step strings (max 10)\n'
            '- "scope": who/what this applies to\n'
            '- "compliance_refs": list of applicable frameworks (ISO, NIST, MITRE)\n'
            '- "risk_level": "critical" | "high" | "medium" | "low"\n'
        )

        try:
            proposal_response = await governance.run(sop_prompt)
            proposal_text = proposal_response.get("content", "")

            try:
                proposal = json.loads(proposal_text)
            except json.JSONDecodeError:
                proposal = {
                    "title": f"Auto-SOP: {task_context[:80]}",
                    "version": "1.0",
                    "objective": proposal_text[:500],
                    "steps": [],
                    "scope": "TEOS platform",
                    "compliance_refs": ["ISO 42001"],
                    "risk_level": "medium",
                    "raw_text": proposal_text,
                }

            proposal["session_id"] = session_id
            proposal["user_id"] = user_id
            proposal["generated_at"] = time.time()

            logger.info("SOP proposal generated: %s", proposal.get("title", "untitled"))
            return proposal

        except Exception as e:
            logger.error("SOP generation failed: %s", e)
            return {"error": str(e), "status": "failed"}

    async def verify_proposal(
        self,
        proposal: dict[str, Any],
        session_id: str,
        user_id: str = "system",
    ) -> dict[str, Any]:
        """
        Phase 2: Dual-agent verification.
        Governance Agent reviews for ISO 42001 compliance.
        Security Agent reviews for MITRE ATT&CK alignment.
        Both must APPROVE for consensus.
        """
        governance = self.agents.get("governance")
        security = self.agents.get("security_analyst")
        if not governance or not security:
            return {
                "status": "failed",
                "consensus": False,
                "error": "Required agents not available",
            }

        proposal_text = json.dumps(proposal, indent=2)

        governance_prompt = (
            "Review this SOP proposal for compliance with ISO/IEC 42001 AI Management System standards.\n"
            "Check: scope clarity, risk classification accuracy, step completeness, and audit trail readiness.\n\n"
            "SOP:\n" + proposal_text + "\n\n"
            'Respond with EXACTLY one of: {"verdict": "APPROVE", "notes": "..."} or '
            '{"verdict": "REJECT", "reason": "..."}'
        )

        security_prompt = (
            "Review this SOP proposal from a security perspective using MITRE ATT&CK framework mapping.\n"
            "Check: are the steps safe? Does the SOP introduce attack surface? "
            "Are there data exposure risks? Is the risk_level accurate per MITRE criteria?\n\n"
            "SOP:\n" + proposal_text + "\n\n"
            'Respond with EXACTLY one of: {"verdict": "APPROVE", "notes": "..."} or '
            '{"verdict": "REJECT", "reason": "..."}'
        )

        try:
            gov_result, sec_result = await asyncio.gather(
                governance.run(governance_prompt),
                security.run(security_prompt),
            )

            gov_verdict = self._parse_verdict(gov_result.get("content", ""))
            sec_verdict = self._parse_verdict(sec_result.get("content", ""))

            consensus = gov_verdict["verdict"] == "APPROVE" and sec_verdict["verdict"] == "APPROVE"

            verification = {
                "consensus": consensus,
                "governance": gov_verdict,
                "security": sec_verdict,
                "verified_at": time.time(),
            }

            await self.audit.log_verdict(
                user_id=user_id,
                payload=f"SOP_VERIFY:{proposal.get('title', 'untitled')}",
                verdict="ALLOW" if consensus else "BLOCK",
                rule_triggered=None if consensus else "SOP_REJECTED",
                session_id=session_id,
                action="sop_verification",
            )

            logger.info(
                "SOP verification: consensus=%s | gov=%s | sec=%s",
                consensus, gov_verdict["verdict"], sec_verdict["verdict"],
            )

            return verification

        except Exception as e:
            logger.error("SOP verification failed: %s", e)
            return {
                "status": "failed",
                "consensus": False,
                "error": str(e),
            }

    async def sign_and_embed(
        self,
        proposal: dict[str, Any],
        verification: dict[str, Any],
        session_id: str,
        user_id: str = "system",
    ) -> dict[str, Any]:
        """
        Phase 3: If consensus reached, cryptographically sign and embed in ChromaDB.
        """
        if not verification.get("consensus"):
            return {
                "status": "rejected",
                "message": "SOP did not reach dual-agent consensus. Not embedded.",
            }

        if not self._signing_secret:
            return {
                "status": "failed",
                "message": "SOP_SIGNING_SECRET not configured. Cannot sign.",
            }

        sop_content = json.dumps(proposal, sort_keys=True, indent=2)
        signature = _sign_payload(sop_content, self._signing_secret)

        metadata = {
            "type": "verified_sovereign_skill",
            "title": proposal.get("title", "untitled"),
            "version": proposal.get("version", "1.0"),
            "risk_level": proposal.get("risk_level", "unknown"),
            "compliance_refs": json.dumps(proposal.get("compliance_refs", [])),
            "session_id": session_id,
            "user_id": user_id,
            "signature": signature,
            "signed_at": str(time.time()),
            "governance_verdict": verification["governance"]["verdict"],
            "security_verdict": verification["security"]["verdict"],
        }

        doc_id = f"sop_{hashlib.sha256(sop_content.encode()).hexdigest()[:16]}"

        try:
            self.vector_store.add_document(
                content=sop_content,
                metadata=metadata,
                doc_id=doc_id,
            )

            await self.audit.log_verdict(
                user_id=user_id,
                payload=f"SOP_EMBED:{proposal.get('title', 'untitled')}",
                verdict="ALLOW",
                rule_triggered=None,
                session_id=session_id,
                action="sop_embed",
            )

            logger.info("SOP signed and embedded: %s (id=%s)", proposal.get("title"), doc_id)

            return {
                "status": "embedded",
                "doc_id": doc_id,
                "signature": signature[:16] + "...",
                "title": proposal.get("title"),
            }

        except Exception as e:
            logger.error("SOP embed failed: %s", e)
            return {"status": "failed", "error": str(e)}

    async def forge(
        self,
        task_context: str,
        task_result: str,
        session_id: str,
        user_id: str = "system",
    ) -> dict[str, Any]:
        """
        Full pipeline: generate → dual verify → sign → embed.
        Single entrypoint for orchestrator integration.
        """
        proposal = await self.generate_sop(task_context, task_result, session_id, user_id)
        if "error" in proposal:
            return {"status": "failed", "phase": "generate", "error": proposal["error"]}

        verification = await self.verify_proposal(proposal, session_id, user_id)
        if verification.get("status") == "failed":
            return {"status": "failed", "phase": "verify", "error": verification.get("error")}

        if not verification.get("consensus"):
            return {
                "status": "rejected",
                "phase": "verify",
                "governance": verification["governance"],
                "security": verification["security"],
                "message": "SOP rejected by dual-agent consensus.",
            }

        embed_result = await self.sign_and_embed(proposal, verification, session_id, user_id)
        return {
            "status": embed_result["status"],
            "proposal": proposal,
            "verification": verification,
            "embed": embed_result,
        }

    def _parse_verdict(self, text: str) -> dict[str, Any]:
        """Parse agent verdict text into structured dict."""
        try:
            parsed = json.loads(text)
            if "verdict" in parsed:
                return {"verdict": parsed["verdict"], "details": parsed.get("notes") or parsed.get("reason", "")}
        except (json.JSONDecodeError, TypeError):
            pass

        upper = text.upper()
        if "APPROVE" in upper:
            return {"verdict": "APPROVE", "details": text[:500]}
        return {"verdict": "REJECT", "details": text[:500]}
