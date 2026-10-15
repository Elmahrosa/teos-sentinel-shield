"""
TEOS Reasoning Engine
Multi-step Chain-of-Thought via Claude claude-sonnet-4-6.
Supports multi-modal (image) input through Anthropic's vision API.
"""
import asyncio
import logging

from anthropic import Anthropic

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are TEOS — a Sovereign AI assistant built on Claude by Anthropic.
You operate under strict deterministic safety rules enforced by TEOS Sentinel Shield.
You reason carefully, cite uncertainty, and never fabricate facts.
You serve government and enterprise users across MENA and Africa.
Language: respond in the same language the user writes in (Arabic or English)."""


class ReasoningChain:
    def __init__(self, client: Anthropic):
        self.client = client
        self.model = "claude-sonnet-4-6"

    async def think(
        self,
        query: str,
        context: list[dict] = None,
        images: list[dict] | None = None,
    ) -> dict:
        messages = list(context or [])

        content_blocks = []
        if images:
            for img in images:
                content_blocks.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": img.get("media_type", "image/png"),
                        "data": img["data"],
                    },
                })
        content_blocks.append({"type": "text", "text": query})

        messages.append({"role": "user", "content": content_blocks})

        response = await asyncio.to_thread(
            self.client.messages.create,
            model=self.model,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        content = response.content[0].text
        return {
            "content": content,
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "model": self.model,
        }
