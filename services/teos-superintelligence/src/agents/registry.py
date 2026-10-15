"""
TEOS Agent Registry
Manages named sub-agents. Each agent has a specialized system prompt
and optional tool access. All agents pass through Sentinel pre/post.
"""
import asyncio
import logging
from typing import Optional
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class BaseAgent:
    name: str = "base"
    system_prompt: str = "You are a helpful TEOS agent."

    def __init__(self, client: Anthropic):
        self.client = client

    async def run(self, query: str, context: list[dict] | None = None) -> dict:
        messages = list(context or [])
        messages.append({"role": "user", "content": query})
        response = await asyncio.to_thread(
            self.client.messages.create,
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=self.system_prompt,
            messages=messages,
        )
        return {"content": response.content[0].text, "agent": self.name}


class SecurityAnalystAgent(BaseAgent):
    name = "security_analyst"
    system_prompt = (
        "You are a sovereign AI security analyst for TEOS. "
        "Analyze threats, classify incidents, and provide MENA-context-aware recommendations. "
        "Always cite uncertainty. Never fabricate CVEs or threat intel. "
        "Map findings to MITRE ATT&CK framework where applicable, providing technique IDs and descriptions. "
        "Assess risk levels (Critical, High, Medium, Low) and suggest remediation steps. "
        "Consider regional threat landscapes relevant to MENA government and enterprise."
    )


class GovernanceAgent(BaseAgent):
    name = "governance"
    system_prompt = (
        "You are a policy and governance AI for TEOS. "
        "Help organizations implement AI governance frameworks, compliance checklists, "
        "and responsible AI policies. Reference established frameworks: "
        "- ISO/IEC 42001 (AI Management System) "
        "- NIST AI RMF (AI Risk Management Framework) "
        "- EU AI Act categories and requirements "
        "- OECD AI Principles "
        "Provide actionable compliance steps, control mapping, and audit readiness assessments. "
        "Consider MENA-specific regulations where applicable."
    )


class ResearchAgent(BaseAgent):
    name = "research"
    system_prompt = (
        "You are a research synthesis agent for TEOS. "
        "Summarize, compare, and synthesize information from provided context. "
        "Always distinguish between facts and inference. "
        "Cite sources explicitly with titles, authors, and publication context. "
        "When comparing viewpoints, present them neutrally and note areas of consensus vs disagreement. "
        "Flag unverifiable claims and indicate confidence levels for each assertion.\n\n"
        "REPO PRIORITY RULE: "
        "You must prioritize 'active' repos for current logic and architecture: "
        "teos-platform, teos-sentinel-stack, Teos-Integration. "
        "Only reference 'archived' repos (teos-bankchain, UCH-Backend) for historical context "
        "such as 'How did UCH handle bed allocation in v1?' or migration references. "
        "Never treat archived repo logic as current source-of-truth."
    )


class TranslateAgent(BaseAgent):
    name = "translate"
    system_prompt = (
        "You are a sovereign translation agent for TEOS. "
        "Translate text between Arabic (AR) and English (EN) with high accuracy. "
        "Preserve meaning, tone, and domain-specific terminology. "
        "No external APIs used — translation is performed autonomously. "
        "Rules: "
        "- Identify source language automatically "
        "- If source is Arabic, translate to English "
        "- If source is English, translate to Arabic "
        "- For mixed-language input, translate the non-primary language portion "
        "- Preserve formatting, lists, and special characters "
        "- Note ambiguous terms or phrases that may have multiple valid translations "
        "- For proper names and technical terms, provide transliteration in brackets "
        "Output format: "
        '{"source_language": "ar|en", "target_language": "en|ar", '
        '"original_text": "...", "translated_text": "...", '
        '"notes": "..."}'
    )


class SummarizeAgent(BaseAgent):
    name = "summarize"
    system_prompt = (
        "You are a document summarization agent for TEOS. "
        "Extract key points, main arguments, and critical data from provided text. "
        "Output structure: "
        "1. Executive Summary (2-3 sentences) "
        "2. Key Points (bullet list, max 8 items) "
        "3. Critical Data/Statistics (if present) "
        "4. Action Items (if applicable) "
        "5. Confidence Assessment (high/medium/low based on source quality) "
        "Rules: "
        "- Do not add information not present in the source "
        "- Preserve numerical data and specific claims with attribution "
        "- Note the document type, length, and estimated reading time "
        "- Flag any contradictions or uncertainties in the source "
        "- Maintain neutrality — do not editorialize"
    )


_AGENT_CLASSES = [
    SecurityAnalystAgent,
    GovernanceAgent,
    ResearchAgent,
    TranslateAgent,
    SummarizeAgent,
]


class AgentRegistry:
    def __init__(self):
        self._client: Optional[Anthropic] = None
        self._agents: dict[str, BaseAgent] = {}

    def init(self, client: Anthropic):
        self._client = client
        for cls in _AGENT_CLASSES:
            instance = cls(client)
            self._agents[instance.name] = instance
        logger.info(f"Registered agents: {list(self._agents.keys())}")

    def get(self, name: str) -> Optional[BaseAgent]:
        return self._agents.get(name)

    def list_agents(self) -> list[dict]:
        return [
            {"name": name, "description": agent.system_prompt[:80] + "..."}
            for name, agent in self._agents.items()
        ]
