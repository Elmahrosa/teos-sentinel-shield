# TEOS Superintelligence

> **Sovereign AI Infrastructure by Elmahrosa International**
> Deterministic. Auditable. Fail-closed.

[![CI](https://github.com/Elmahrosa/teos-superintelligence/actions/workflows/ci.yml/badge.svg)](https://github.com/Elmahrosa/teos-superintelligence/actions)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-closed--alpha-orange.svg)]()
[![CPN](https://img.shields.io/badge/Anthropic-CPN%20Member-blue.svg)](https://elmahrosa.org)

---

## Overview

TEOS Superintelligence is a sovereign multi-agent AI orchestration platform built on Claude by Anthropic. It combines deterministic safety enforcement (Sentinel Shield), advanced reasoning chains, persistent memory, and tool orchestration into a unified sovereign AI stack for MENA government and enterprise deployments.

**Stack:** Python 3.11+ · FastAPI · Redis · PostgreSQL · Railway · Claude API (Anthropic)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  TEOS Superintelligence              │
├──────────────┬──────────────┬───────────────────────┤
│  Reasoning   │   Memory     │    Agent Orchestrator  │
│  Engine      │   Layer      │    (Multi-Agent)       │
├──────────────┴──────────────┴───────────────────────┤
│              Sentinel Shield (Security Firewall)     │
│              40+ Deterministic Rules · Fail-Closed   │
├─────────────────────────────────────────────────────┤
│              Claude API  (claude-sonnet-4-6)         │
└─────────────────────────────────────────────────────┘
```

---

## API Endpoints

All endpoints documented via OpenAPI at `/openapi.json`, `/docs`, `/redoc`.

### System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | System health check (Sentinel, Redis, DB) |
| `POST` | `/auth/token` | No | Issue JWT token (username + api_key) |
| `POST` | `/query` | JWT | Main inference endpoint |
| `POST` | `/stream` | JWT | SSE streaming inference |
| `GET` | `/agents` | JWT | List available agents |
| `GET` | `/session/{id}` | JWT | Get session info |
| `DELETE` | `/session/{id}` | JWT | Clear session |
| `GET` | `/audit` | JWT | Audit log entries (dev only) |

### Tools & RAG

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/tools` | JWT | List available tools |
| `POST` | `/tools/run` | JWT | Run a tool directly |
| `POST` | `/rag/ingest-repo` | JWT | Ingest whitelisted repos into RAG |
| `GET` | `/rag/search` | JWT | Semantic search over ingested docs |
| `POST` | `/rag/ingest` | JWT | Ingest a single document |

### MCP

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/mcp/servers` | JWT | List connected MCP servers |
| `GET` | `/mcp/tools` | JWT | List MCP-discovered tools |
| `POST` | `/mcp/call` | JWT | Call MCP tool (Sentinel-wrapped) |
| `GET` | `/mcp/health` | JWT | MCP server health status |
| `POST` | `/mcp/identity-verify` | JWT | Verify DID identity via MCP |

### Memory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/memory/agent/{agent_name}/{session_id}` | JWT | Get agent-specific persistent memory |
| `DELETE` | `/memory/agent/{agent_name}/{session_id}` | JWT | Clear agent-specific memory |

### Skill Forge & Patrols

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/forge/sop` | JWT | Generate and verify an SOP via Constitutional Skill Forge |
| `POST` | `/patrols/start` | JWT | Start ephemeral Sentinel patrol loop |
| `POST` | `/patrols/stop` | JWT | Stop patrol loop |
| `GET` | `/patrols/status` | JWT | Get patrol loop status |

### Queue

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/queue/enqueue` | JWT | Enqueue a message for Sentinel inspection |
| `POST` | `/queue/dequeue` | JWT | Dequeue and inspect messages |
| `GET` | `/queue/status` | JWT | Queue health and length |
| `GET` | `/queue/dlq` | JWT | View dead letter queue |

### Admin (JWT-auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/admin/usage` | JWT | Usage and cost analytics |
| `GET` | `/admin/user-usage/{user_id}` | JWT | Usage summary for a specific user |
| `GET` | `/admin/dashboard` | JWT | Admin dashboard (HTML, dev only) |

### Admin Control Plane (Dual-Key)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/admin/halt` | `X-Emergency-Halt-Key` | Emergency kill-switch |
| `POST` | `/admin/resume` | `X-Emergency-Halt-Key` | Resume engine after halt |
| `GET` | `/admin/halt-status` | `X-Emergency-Halt-Key` | Check halt state |
| `DELETE` | `/admin/skills/veto/{skill_id}` | `X-Admin-Veto-Key` | Veto and delete a sovereign skill |
| `POST` | `/admin/genesis-sync` | `X-Admin-Veto-Key` | Remote knowledge ingestion into ChromaDB |

---

## Agents

| Agent | Description |
|-------|-------------|
| `security_analyst` | MITRE ATT&CK threat analysis and mapping |
| `governance` | ISO 42001 / NIST AI RMF compliance |
| `research` | Multi-source citation synthesis |
| `translate` | Sovereign AR↔EN translation (no external APIs) |
| `summarize` | Key point extraction from documents |

---

## Tools

| Tool | Description |
|------|-------------|
| `calculator` | Safe AST-based math evaluation |
| `web_search` | DuckDuckGo web search |
| `document_parser` | PDF text extraction (PyPDF2) |
| `rag_search` | Semantic search over ingested repository docs |

All tools pass input AND output through Sentinel Shield before execution.

---

## Test Suite

```
Unit:        173/173 passing
Integration:   4/4 passing
E2E:           5 passing (with Docker Compose)
Ruff:        0 errors
```

Run tests: `pytest tests/ -v` (all) or `pytest tests/unit/ -v` (unit only)
E2E tests require Docker Compose; set `SKIP_E2E=true` to skip them.
Lint: `ruff check .`

---

## New Features (v1.2.0)

| Feature | Module | Description |
|---------|--------|-------------|
| MCP Client Integration | `src/mcp/` | Connect to external MCP servers (agent-code-risk-mcp, teos-labs-due-diligence-mcp) |
| MCP Sentinel Wrapper | `src/mcp/sentinel_wrapper.py` | Pre/post-flight Sentinel checks on ALL MCP tool calls (fail-closed) |
| RAG Ingestion Pipeline | `src/rag/ingest.py` | Whitelist-enforced repo ingestion with chunking and deduplication |
| RAG Vector Store | `src/rag/` | ChromaDB-based document ingestion and semantic search |
| Webhooks | `src/webhooks/` | Async callback delivery with HMAC-SHA256 signatures |
| Cost Tracking | `src/analytics/` | Per-request token/cost logging to Redis with daily summaries |
| Agent Memory | `src/memory/store.py` | Persistent per-agent namespaces beyond conversation context |
| Multi-modal | `src/reasoning/chain.py` | Image input via base64 through Claude vision API |
| Sentinel Sidecar | `docker/sentinel/` | Self-hosted 25-rule deterministic safety shield |
| Admin Dashboard | `GET /admin/dashboard` | Live HTML dashboard with usage stats |
| Load Testing | `scripts/load_test.py` | Concurrent user simulation with latency reports |
| Admin Control Plane | `src/api/admin.py` | Dual-key emergency halt, skill veto, and genesis-sync |

---

## Quick Start

```bash
# Clone
git clone https://github.com/Elmahrosa/teos-superintelligence.git
cd teos-superintelligence

# Environment
cp .env.example .env
# Edit .env — add ANTHROPIC_API_KEY

# Install
pip install -r requirements.txt

# Run
uvicorn src.api.main:app --reload --port 8000
```

---

## Docker

```bash
docker compose -f docker/docker-compose.yml up --build
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `REDIS_URL` | ✅ | Redis connection string |
| `DATABASE_URL` | ✅ | PostgreSQL DSN |
| `SENTINEL_URL` | ✅ | TEOS Sentinel Shield endpoint |
| `JWT_SECRET` | ✅ | API auth secret (min 32 bytes for HS256) |
| `ENV` | ✅ | `development` / `production` |
| `EMERGENCY_HALT_KEY` | ✅ | Dual-key for halt/resume/status operations |
| `ADMIN_VETO_KEY` | ✅ | Dual-key for skill veto and genesis-sync operations |
| `GITHUB_PAT` | ✅ | GitHub token for genesis-sync repo scanning |
| `MCP_CODE_RISK_URL` | | MCP server URL for code risk analysis |
| `MCP_DUE_DILIGENCE_URL` | | MCP server URL for due diligence |
| `TEOS_WHITELISTED_REPOS` | | Comma-separated active repos for RAG ingestion |
| `TEOS_DEPRECATED_REPOS` | | Comma-separated deprecated repos to skip |
| `TEOS_RAG_ALLOWED_DIRS` | � ✅ | Comma-separated absolute paths allowed for RAG ingestion (e.g., "/home/user/projects,/data/repos"). Attempts to ingest from paths outside these directories are blocked with 403 Forbidden. |

---

## License

Proprietary — © 2026 Elmahrosa International. All rights reserved.

> Registered Member of the Claude Partner Network by Anthropic — denotes program membership only, not endorsement or investment by Anthropic.
