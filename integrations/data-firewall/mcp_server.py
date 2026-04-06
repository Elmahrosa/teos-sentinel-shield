"""
Safe Ingestion Engine — MCP Server
Exposes compliance ingestion as an MCP tool for Claude, Cursor, Windsurf.

Setup:
    pip install mcp httpx

Claude Desktop config:
    {
      "mcpServers": {
        "safe-ingestion": {
          "command": "python",
          "args": ["mcp_server.py"],
          "env": {"SAFE_API_KEY": "sk-your-key", "SAFE_API_BASE": "https://safe.teosegypt.com"}
        }
      }
    }
"""
from __future__ import annotations
import asyncio, os, time
import httpx
import mcp.server.stdio
import mcp.types as types
from mcp.server import NotificationOptions, Server
from mcp.server.models import InitializationOptions

API_KEY  = os.environ.get("SAFE_API_KEY", "")
API_BASE = os.environ.get("SAFE_API_BASE", "https://safe.teosegypt.com")
server   = Server("safe-ingestion-engine")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="ingest_url",
            description=(
                "Fetch a URL through the Safe Ingestion Engine compliance pipeline. "
                "Auto-redacts PII (email, phone, SSN, IPv4, credit card), enforces robots.txt, "
                "blocks SSRF. Returns clean content safe for RAG or agent context. "
                "Blocked requests cost 0 credits."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "Public HTTPS URL to ingest."},
                    "idempotency_key": {"type": "string", "description": "Optional dedup key."},
                },
                "required": ["url"],
            },
        ),
        types.Tool(
            name="check_account",
            description="Check Safe Ingestion Engine credits and plan.",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        types.Tool(
            name="get_job",
            description="Poll the status of a submitted ingestion job.",
            inputSchema={
                "type": "object",
                "properties": {"job_id": {"type": "string"}},
                "required": ["job_id"],
            },
        ),
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if not API_KEY:
        return [types.TextContent(type="text",
            text="Error: SAFE_API_KEY not set. Get a key at https://safe.teosegypt.com")]

    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

    async with httpx.AsyncClient(base_url=API_BASE, headers=headers, timeout=30.0) as client:

        if name == "ingest_url":
            url = arguments.get("url", "")
            if not url:
                return [types.TextContent(type="text", text="Error: url required")]
            payload = {"url": url}
            if k := arguments.get("idempotency_key"):
                payload["idempotency_key"] = k
            r = await client.post("/v1/ingest_async", json=payload)
            if r.status_code == 402:
                return [types.TextContent(type="text", text="No credits. Top up at https://safe.teosegypt.com")]
            if r.status_code != 200:
                return [types.TextContent(type="text", text=f"Error {r.status_code}: {r.text}")]
            job_id = r.json()["job_id"]
            deadline = time.monotonic() + 60
            while time.monotonic() < deadline:
                await asyncio.sleep(2)
                poll = await client.get(f"/v1/jobs/{job_id}")
                if poll.status_code != 200:
                    continue
                job = poll.json()
                if job["status"] == "completed":
                    return [types.TextContent(type="text", text=(
                        f"Ingestion complete | Job: {job_id} | PII redacted: {job.get('pii_found',0)}\n\n"
                        f"{job.get('result_excerpt','')}"
                    ))]
                if job["status"] == "failed":
                    return [types.TextContent(type="text", text=f"Failed: {job.get('error_message')}")]
            return [types.TextContent(type="text", text=f"Timeout. Poll manually: get_job(job_id='{job_id}')")]

        elif name == "check_account":
            r = await client.get("/v1/account")
            if r.status_code != 200:
                return [types.TextContent(type="text", text=f"Error {r.status_code}")]
            i = r.json()
            return [types.TextContent(type="text", text=(
                f"Plan: {i.get('plan')} | Credits: {i.get('credits')} | Key: {i.get('hash_preview')}..."
            ))]

        elif name == "get_job":
            job_id = arguments.get("job_id", "")
            r = await client.get(f"/v1/jobs/{job_id}")
            if r.status_code == 404:
                return [types.TextContent(type="text", text=f"Job {job_id} not found")]
            job = r.json()
            return [types.TextContent(type="text", text=(
                f"Job: {job_id} | Status: {job.get('status')} | PII: {job.get('pii_found',0)}\n"
                f"{job.get('result_excerpt','') or job.get('error_message','')}"
            ))]

    return [types.TextContent(type="text", text=f"Unknown tool: {name}")]

async def main():
    async with mcp.server.stdio.stdio_server() as (read, write):
        await server.run(read, write, InitializationOptions(
            server_name="safe-ingestion-engine", server_version="2.1.0",
            capabilities=server.get_capabilities(
                notification_options=NotificationOptions(), experimental_capabilities={}),
        ))

if __name__ == "__main__":
    asyncio.run(main())
