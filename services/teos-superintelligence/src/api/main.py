"""
TEOS Superintelligence - FastAPI Application
Sovereign AI Infrastructure by Elmahrosa International
"""
import os
import hmac
import logging
from contextlib import asynccontextmanager
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, status, Request, Query, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from jinja2 import Environment, FileSystemLoader

from src.core.orchestrator import TEOSOrchestrator
from src.auth.jwt import (
    verify_token,
    create_token,
    TokenPayload,
    TokenResponse,
)
from src.middleware.rate_limit import RateLimitMiddleware
from src.api.stream import router as stream_router
from src.api.admin import router as admin_router, is_halted

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

_template_dir = Path(__file__).parent.parent / "templates"
_jinja_env = Environment(loader=FileSystemLoader(str(_template_dir)), autoescape=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    orchestrator = TEOSOrchestrator()
    await orchestrator.startup()
    app.state.orchestrator = orchestrator
    logger.info("TEOS Superintelligence online")
    yield
    await orchestrator.shutdown()
    logger.info("TEOS shutdown")


app = FastAPI(
    title="TEOS Superintelligence API",
    version="1.0.0",
    description="Sovereign AI Infrastructure by Elmahrosa International. "
    "Deterministic. Auditable. Fail-closed. Built on Claude by Anthropic.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "Elmahrosa International",
        "url": "https://elmahrosa.org",
    },
    license_info={
        "name": "Proprietary - Elmahrosa International",
        "url": "https://elmahrosa.org/license",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Emergency-Halt-Key", "X-Admin-Veto-Key"],
)

app.add_middleware(RateLimitMiddleware)

app.include_router(stream_router, tags=["Streaming"])
app.include_router(admin_router)


@app.middleware("http")
async def sovereign_halt_middleware(request: Request, call_next):
    path = request.url.path.rstrip("/")
    admin_paths = {"/admin", "/admin/halt", "/admin/resume", "/admin/halt-status"}
    if await is_halted() and path not in admin_paths:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={
                "status": "halted",
                "message": "TEOS engine is halted. POST /admin/resume to restore.",
            },
        )
    return await call_next(request)


class AuthTokenRequest(BaseModel):
    username: str = Field(..., description="Elmahrosa username")
    api_key: str = Field(..., description="API key for authentication")


class QueryRequest(BaseModel):
    query: str = Field(..., description="User input query")
    session_id: str = Field(..., description="Unique session identifier")
    agent: Optional[str] = Field(None, description="Agent name to route to")
    images: Optional[list[dict]] = Field(None, description="Base64-encoded images (multi-modal)")
    search_rag: bool = Field(False, description="Whether to search RAG vector store")
    callback_url: Optional[str] = Field(None, description="Webhook callback URL for async delivery")


class QueryResponse(BaseModel):
    status: str = Field(..., description="Response status: ok, blocked, or error")
    result: Optional[str] = Field(None, description="Response content")
    agent: Optional[str] = Field(None, description="Agent that handled the request")
    action: Optional[str] = Field(None, description="Sentinel action if blocked")
    rule: Optional[str] = Field(None, description="Sentinel rule triggered if blocked")
    message: Optional[str] = Field(None, description="Human-readable message")
    input_tokens: Optional[int] = Field(None, description="Input token count")
    output_tokens: Optional[int] = Field(None, description="Output token count")
    rag_sources: Optional[int] = Field(None, description="Number of RAG sources used")


class SessionInfo(BaseModel):
    session_id: str
    message_count: int
    ttl_seconds: int


class HealthResponse(BaseModel):
    status: str
    version: str
    sentinel: str
    redis: str
    db: str


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="System health check",
    description="Returns the health status of all system components.",
)
async def health(request: Request):
    orch = request.app.state.orchestrator
    sentinel_ok = await orch.sentinel.health()
    try:
        redis_conn = await orch.memory._get_redis()
        await redis_conn.ping()
        redis_status = "ok"
    except Exception:
        redis_status = "degraded"
    try:
        await orch.audit.connect()
        db_status = "ok"
    except Exception:
        db_status = "degraded"
    return HealthResponse(
        status="ok",
        version="1.0.0",
        sentinel="ok" if sentinel_ok else "degraded",
        redis=redis_status,
        db=db_status,
    )


@app.post(
    "/auth/token",
    response_model=TokenResponse,
    tags=["Authentication"],
    summary="Issue JWT token",
)
async def issue_token(req: AuthTokenRequest):
    if not req.username or not req.api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and API key are required",
        )
    expected_key = os.environ.get("API_KEY", "")
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API_KEY not configured on server",
        )
    if not hmac.compare_digest(req.api_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    token = create_token(user_id=req.username, username=req.username)
    return TokenResponse(access_token=token)


@app.post(
    "/query",
    response_model=QueryResponse,
    tags=["Inference"],
    summary="Main inference endpoint",
    description="Send a query to TEOS. Supports multi-modal images, RAG, and webhooks.",
)
async def query(
    req: QueryRequest,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    result = await orch.process(
        query=req.query,
        session_id=req.session_id,
        user_id=token_payload.user_id,
        agent_name=req.agent,
        images=req.images,
        search_rag=req.search_rag,
        callback_url=req.callback_url,
    )
    return QueryResponse(**result)


@app.get(
    "/agents",
    tags=["Agents"],
    summary="List available agents",
)
async def list_agents(
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    return {"agents": orch.agents.list_agents()}


@app.get(
    "/session/{session_id}",
    response_model=SessionInfo,
    tags=["Session"],
    summary="Get session history",
)
async def get_session(
    session_id: str,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    info = await orch.memory.get_session_info(session_id)
    return SessionInfo(**info)


@app.delete(
    "/session/{session_id}",
    tags=["Session"],
    summary="Clear session",
)
async def clear_session(
    session_id: str,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    await orch.memory.clear(session_id)
    return {"status": "cleared", "session_id": session_id}


@app.get(
    "/audit",
    tags=["Admin"],
    summary="Audit log (admin only)",
    description="Returns recent audit log entries. Only in development mode.",
)
async def get_audit_log(
    request: Request,
    limit: int = 100,
    offset: int = 0,
    user_id: Optional[str] = None,
    verdict: Optional[str] = None,
    token_payload: TokenPayload = Depends(verify_token),
):
    if os.environ.get("ENV", "development") == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Audit log access restricted in production",
        )
    orch = request.app.state.orchestrator
    entries = await orch.audit.get_recent(
        limit=limit, offset=offset, user_id=user_id, verdict=verdict
    )
    return {"entries": entries, "total": len(entries)}


@app.get(
    "/tools",
    tags=["Tools"],
    summary="List available tools",
)
async def list_tools(
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    return {"tools": orch.tools.list_tools()}


@app.post(
    "/tools/run",
    tags=["Tools"],
    summary="Run a tool directly",
)
async def run_tool(
    request: Request,
    tool_name: str = Form(...),
    token_payload: TokenPayload = Depends(verify_token),
    **kwargs,
):
    orch = request.app.state.orchestrator
    result = await orch.tools.run_tool(tool_name, **kwargs)
    return result


@app.post(
    "/rag/ingest",
    tags=["RAG"],
    summary="Ingest documents into RAG vector store",
)
async def rag_ingest(
    request: Request,
    file: UploadFile = File(...),
    token_payload: TokenPayload = Depends(verify_token),
):
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    orch = request.app.state.orchestrator
    doc_id = orch.vector_store.add_document(
        content=text,
        metadata={"filename": file.filename, "user_id": token_payload.user_id},
    )
    return {"status": "ingested", "doc_id": doc_id, "filename": file.filename, "size": len(text)}


@app.get(
    "/rag/search",
    tags=["RAG"],
    summary="Search RAG vector store",
)
async def rag_search(
    request: Request,
    query: str = Query(...),
    n_results: int = 5,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    results = orch.vector_store.search(query, n_results=n_results)
    return {"results": results, "total": len(results)}


@app.get(
    "/admin/usage",
    tags=["Admin"],
    summary="Usage and cost analytics",
)
async def get_usage(
    request: Request,
    date: Optional[str] = None,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    records = await orch.usage_tracker.get_daily_usage(date)
    total_cost = sum(r.get("total_cost", 0) for r in records)
    total_tokens = sum(r.get("total_tokens", 0) for r in records)
    return {
        "records": records,
        "summary": {
            "total_requests": len(records),
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 6),
        },
    }


@app.get(
    "/admin/user-usage/{user_id}",
    tags=["Admin"],
    summary="Usage summary for a specific user",
)
async def get_user_usage(
    user_id: str,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    summary = await orch.usage_tracker.get_user_summary(user_id)
    return summary


@app.get(
    "/memory/agent/{agent_name}/{session_id}",
    tags=["Memory"],
    summary="Get agent-specific persistent memory",
)
async def get_agent_memory(
    agent_name: str,
    session_id: str,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    memory = await orch.memory.get_all_agent_memory(agent_name, session_id)
    return {"agent": agent_name, "session_id": session_id, "memory": memory}


@app.delete(
    "/memory/agent/{agent_name}/{session_id}",
    tags=["Memory"],
    summary="Clear agent-specific memory",
)
async def clear_agent_memory(
    agent_name: str,
    session_id: str,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    await orch.memory.clear_agent_memory(agent_name, session_id)
    return {"status": "cleared", "agent": agent_name, "session_id": session_id}


@app.get(
    "/admin/dashboard",
    tags=["Admin"],
    summary="Admin dashboard (HTML)",
    response_class=HTMLResponse,
)
async def admin_dashboard(
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    if os.environ.get("ENV", "development") == "production":
        raise HTTPException(status_code=403, detail="Dashboard restricted in production")
    orch = request.app.state.orchestrator
    usage = await orch.usage_tracker.get_daily_usage()
    total_cost = sum(r.get("total_cost", 0) for r in usage)
    total_tokens = sum(r.get("total_tokens", 0) for r in usage)
    agents = orch.agents.list_agents()
    tools = orch.tools.list_tools()

    template = _jinja_env.get_template("dashboard.html")
    html = template.render(
        request_count=len(usage),
        total_tokens=total_tokens,
        total_cost=total_cost,
        agent_count=len(agents),
        tool_count=len(tools),
        agents=agents,
        tools=tools,
        usage=usage,
    )
    return HTMLResponse(content=html)


class MCPCallRequest(BaseModel):
    server_name: str = Field(..., description="MCP server name")
    tool_name: str = Field(..., description="Tool name on the MCP server")
    arguments: dict = Field(default_factory=dict, description="Tool arguments")
    session_id: str = Field(default="", description="Session ID for audit")


@app.get(
    "/mcp/servers",
    tags=["MCP"],
    summary="List connected MCP servers",
)
async def list_mcp_servers(
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    return {"servers": orch.mcp_manager.list_servers()}


@app.get(
    "/mcp/tools",
    tags=["MCP"],
    summary="List all MCP-discovered tools",
)
async def list_mcp_tools(
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    return {"tools": orch.mcp_manager.list_all_tools()}


@app.post(
    "/mcp/call",
    tags=["MCP"],
    summary="Call an MCP tool (Sentinel-wrapped)",
    description="Executes an MCP tool call through the Sentinel Shield. Pre-flight check on arguments, post-flight check on results. Fail-closed.",
)
async def mcp_call(
    req: MCPCallRequest,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    result = await orch.mcp_sentinel.call_tool(
        server_name=req.server_name,
        tool_name=req.tool_name,
        arguments=req.arguments,
        user_id=token_payload.user_id,
        session_id=req.session_id,
    )
    return result


@app.get(
    "/mcp/health",
    tags=["MCP"],
    summary="MCP server health status",
)
async def mcp_health(
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    return await orch.mcp_sentinel.health()


class IdentityVerifyRequest(BaseModel):
    did: str = Field(..., description="Decentralized Identifier (DID)")
    document: Optional[str] = Field(None, description="Document or claim to verify")
    session_id: str = Field(default="identity-verify", description="Session ID for audit trail")


class IdentityVerifyResponse(BaseModel):
    status: str
    did: str
    verified_by: Optional[str] = None
    governance_verdict: Optional[str] = None
    security_verdict: Optional[str] = None
    message: str


@app.post(
    "/mcp/identity-verify",
    tags=["MCP", "Identity Gateway"],
    summary="Identity verification endpoint (Pillar 1 prep)",
    description=(
        "Placeholder ingestion point for the Teos-Pharaoh-Portal DID system. "
        "Routes the verification request through Governance and Security agents for consensus."
    ),
    response_model=IdentityVerifyResponse,
)
async def identity_verify(
    req: IdentityVerifyRequest,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator

    governance = orch.agents.get("governance")
    security = orch.agents.get("security_analyst")

    governance_verdict = None
    security_verdict = None

    verify_context = f"DID: {req.did}"
    if req.document:
        verify_context += f"\nDocument: {req.document}"

    if governance:
        gov_result = await governance.run(
            f"Verify the identity claim for this DID. Assess compliance with ISO 42001 and civic identity standards.\n\n{verify_context}",
            context=[],
        )
        governance_verdict = gov_result.get("content", "unavailable")

    if security:
        sec_result = await security.run(
            f"Perform security assessment on this identity verification request. Check for spoofing, replay, or delegation attacks.\n\n{verify_context}",
            context=[],
        )
        security_verdict = sec_result.get("content", "unavailable")

    all_pass = bool(governance_verdict and security_verdict)

    return IdentityVerifyResponse(
        status="verified" if all_pass else "pending_review",
        did=req.did,
        verified_by="dual_agent_consensus" if all_pass else "incomplete",
        governance_verdict=governance_verdict,
        security_verdict=security_verdict,
        message=(
            "Identity verified by Governance + Security dual-agent consensus."
            if all_pass
            else "Identity verification requires both agents to complete review."
        ),
    )


@app.post(
    "/rag/ingest-repo",
    tags=["RAG"],
    summary="Ingest whitelisted repos into RAG vector store",
    description="Scans a directory for whitelisted TEOS repos, chunks documents, deduplicates, and ingests into ChromaDB.",
)
async def rag_ingest_repo(
    request: Request,
    repo_dir: str = Form(..., description="Path to directory containing repos"),
    token_payload: TokenPayload = Depends(verify_token),
):
    from src.rag.ingest import ingest_all

    path = Path(repo_dir).resolve()
    allowed_bases = [
        Path(b).resolve()
        for b in os.environ.get("TEOS_RAG_ALLOWED_DIRS", "").split(",")
        if b.strip()
    ]
    if not allowed_bases:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TEOS_RAG_ALLOWED_DIRS not configured. RAG repo ingestion is disabled.",
        )
    if not any(
        path == base or base in path.parents for base in allowed_bases
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Directory not within allowed ingestion paths",
        )
    if not path.exists():
        raise HTTPException(status_code=400, detail=f"Directory not found: {repo_dir}")

    orch = request.app.state.orchestrator
    results = ingest_all(path, orch.vector_store)
    return results


class ForgeSOPRequest(BaseModel):
    task_context: str = Field(..., description="Context of the completed task")
    task_result: str = Field(..., description="Result of the completed task")
    session_id: str = Field(..., description="Session ID for audit trail")


@app.post(
    "/forge/sop",
    tags=["Skill Forge"],
    summary="Generate and verify an SOP via Constitutional Skill Forge",
    description="Runs the full pipeline: generate SOP proposal → Governance + Security dual verification → sign and embed if consensus.",
)
async def forge_sop(
    req: ForgeSOPRequest,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    result = await orch.skill_forge.forge(
        task_context=req.task_context,
        task_result=req.task_result,
        session_id=req.session_id,
        user_id=token_payload.user_id,
    )
    return result


class PatrolStartRequest(BaseModel):
    patrols: list[dict] = Field(..., description="List of patrol definitions")
    interval: int = Field(3600, description="Interval between patrol cycles in seconds")


@app.post(
    "/patrols/start",
    tags=["Patrols"],
    summary="Start ephemeral Sentinel patrol loop",
    description="Launches background patrol audits. Each patrol pulls data via MCP, inspects through Sentinel, logs to audit.",
)
async def start_patrols(
    req: PatrolStartRequest,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    orch.patrol_runner.start(req.patrols, interval=req.interval)
    return {"status": "started", "patrol_count": len(req.patrols), "interval": req.interval}


@app.post(
    "/patrols/stop",
    tags=["Patrols"],
    summary="Stop patrol loop",
)
async def stop_patrols(
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    orch.patrol_runner.stop()
    return {"status": "stopped"}


@app.get(
    "/patrols/status",
    tags=["Patrols"],
    summary="Get patrol loop status",
)
async def patrol_status(
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    return orch.patrol_runner.status()


class QueueEnqueueRequest(BaseModel):
    payload: dict = Field(..., description="Message payload")
    source: str = Field("external", description="Source identifier")
    priority: int = Field(0, description="Priority level")


@app.post(
    "/queue/enqueue",
    tags=["Queue"],
    summary="Enqueue a message for Sentinel inspection",
    description="Writes a message to the air-gapped queue. Sentinel inspects before Orchestrator reads.",
)
async def queue_enqueue(
    req: QueueEnqueueRequest,
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    result = await orch.message_queue.enqueue(
        payload=req.payload,
        source=req.source,
        priority=req.priority,
    )
    return result


@app.post(
    "/queue/dequeue",
    tags=["Queue"],
    summary="Dequeue and inspect messages",
    description="Pulls messages from queue, runs each through Sentinel Shield. ALLOW returns to caller, BLOCK goes to DLQ.",
)
async def queue_dequeue(
    request: Request,
    batch_size: int = Query(10, description="Max messages to process"),
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    messages = await orch.message_queue.inspect_and_dequeue(
        batch_size=batch_size,
        user_id=token_payload.user_id,
    )
    return {"messages": messages, "count": len(messages)}


@app.get(
    "/queue/status",
    tags=["Queue"],
    summary="Queue health and length",
)
async def queue_status(
    request: Request,
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    return await orch.message_queue.health()


@app.get(
    "/queue/dlq",
    tags=["Queue"],
    summary="View dead letter queue",
)
async def queue_dlq(
    request: Request,
    count: int = Query(5, description="Number of DLQ messages to return"),
    token_payload: TokenPayload = Depends(verify_token),
):
    orch = request.app.state.orchestrator
    messages = await orch.message_queue.peek_dlq(count=count)
    return {"messages": messages, "count": len(messages)}
