"""
TEOS Streaming Endpoint
SSE-based streaming for claude-sonnet-4-6 responses.
Sentinel pre-check before stream starts; mid-stream BLOCK closes stream.
"""
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from src.auth.jwt import verify_token, TokenPayload
from src.security.sentinel import SentinelClient

logger = logging.getLogger(__name__)

router = APIRouter()
sentinel = SentinelClient()


class StreamRequest(BaseModel):
    query: str
    session_id: str
    agent: Optional[str] = None


@router.post("/stream")
async def stream_inference(
    req: StreamRequest,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    verdict = await sentinel.check(req.query, user_id=token_payload.user_id)
    if verdict["action"] != "ALLOW":
        logger.warning(f"Sentinel BLOCK on stream start | user={token_payload.user_id}")
        raise HTTPException(
            status_code=403,
            detail={
                "type": "https://teos.elmahrosa.org/errors/sentinel-block",
                "title": "Request Blocked by Sentinel",
                "status": 403,
                "detail": verdict.get("message", "Request blocked by TEOS Sentinel Shield."),
                "rule": verdict.get("rule"),
            },
        )

    orch = request.app.state.orchestrator
    return EventSourceResponse(
        _stream_events(request, orch, req, token_payload),
        media_type="text/event-stream",
    )


async def _stream_events(
    request: Request,
    orch,
    req: StreamRequest,
    token_payload: TokenPayload,
):
    try:
        client = orch.client
        context = await orch.memory.get_context(req.session_id, limit=10)

        system_prompt = orch.reasoning.SYSTEM_PROMPT
        if req.agent:
            agent = orch.agents.get(req.agent)
            if agent:
                system_prompt = agent.system_prompt

        messages = list(context or [])
        messages.append({"role": "user", "content": req.query})

        async with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=system_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                if await request.is_disconnected():
                    break

                mid_verdict = await sentinel.check(text, user_id=token_payload.user_id)
                if mid_verdict["action"] == "BLOCK":
                    logger.error(f"Sentinel BLOCK mid-stream | user={token_payload.user_id}")
                    yield {"event": "error", "data": json.dumps({
                        "type": "https://teos.elmahrosa.org/errors/sentinel-block",
                        "title": "Stream Blocked by Sentinel",
                        "status": 403,
                        "detail": "Response stream interrupted by safety layer.",
                    })}
                    break

                yield {"event": "token", "data": json.dumps({"text": text})}

        yield {"event": "done", "data": json.dumps({"status": "complete"})}

    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield {"event": "error", "data": json.dumps({
            "type": "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            "title": "Stream Error",
            "status": 500,
            "detail": "An internal error occurred during streaming.",
        })}
