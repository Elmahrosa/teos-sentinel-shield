# TEOS Sovereign Sentinel — MCP Architecture

**Engine:** v4.1.0  
**Updated:** 2026-06-26  
**Protocol:** Model Context Protocol (JSON-RPC 2.0)  
**Transport:** HTTP POST + Server-Sent Events (SSE) + stdio  

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [MCP Server](#2-mcp-server)
3. [Agent Communication Flow](#3-agent-communication-flow)
4. [Decision Pipeline](#4-decision-pipeline)
5. [Trust Boundaries](#5-trust-boundaries)
6. [Runtime Governance Checkpoints](#6-runtime-governance-checkpoints)
7. [Failure Handling](#7-failure-handling)
8. [Claude Code Integration](#8-claude-code-integration)
9. [Key Metrics](#9-key-metrics)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Actors                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Telegram  │  │  Claude  │  │   VS     │  │   Browser Ext    │ │
│  │   Bot    │  │  Code    │  │  Code    │  │   (Chrome/Edge)   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼──────────────┼──────────────────┼──────────┘
        │             │              │                  │
        │         ┌───┴───┐         │                  │
        │         │opencode│         │                  │
        │         │ hooks │         │                  │
        │         └───┬───┘         │                  │
        │             │             │                  │
        ▼             ▼             ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                    TEOS Gateway (teoslinker-bot)                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  Service Orchestrator                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │    │
│  │  │ Activation │  │   MCP    │  │ Sentinel │  │ Report │  │    │
│  │  │  Service  │  │  Service │  │  Shield  │  │ Gen.   │  │    │
│  │  └──────────┘  └────┬─────┘  └──────────┘  └────────┘  │    │
│  └──────────────────────────┬───────────────────────────────┘    │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              MCP Transport Layer (JSON-RPC 2.0)                   │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐ │
│  │  HTTP POST   │  │  SSE Stream    │  │  stdio (subprocess) │ │
│  │  /mcp        │  │  /mcp (SSE)    │  │  direct pipe        │ │
│  └──────┬───────┘  └───────┬────────┘  └──────────┬───────────┘ │
└─────────┼──────────────────┼───────────────────────┼─────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   TEOS Risk Engine (MCP Server)                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    Agent Code Risk MCP                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │    │
│  │  │Determin. │  │Heuristic │  │ Token    │  │Supply  │  │    │
│  │  │  Engine  │  │Suspicion │  │Analysis  │  │Chain   │  │    │
│  │  │ 258 rules│  │77 regex  │  │SPL/ERC20 │  │Scan    │  │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬───┘  │    │
│  │       │              │              │              │       │    │
│  │       └──────────────┴──────────────┴──────────────┘       │    │
│  │                      │                                      │    │
│  │                      ▼                                      │    │
│  │           ┌──────────────────────┐                         │    │
│  │           │  Final Verdict      │                         │    │
│  │           │  ALLOW/WARN/REVIEW/ │                         │    │
│  │           │  BLOCK              │                         │    │
│  │           └──────────────────────┘                         │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. MCP Server

### 2.1 Server Configuration

**Location:** `agent-code-risk-mcp/src/http/app.ts`  
**Transport:** Express.js with dual MCP transport (HTTP + stdio)

| Property | Value |
|----------|-------|
| Port | 8090 (internal), 8000 (env override) |
| CORS | Origin allowlist from `ALLOWED_ORIGINS` env |
| Rate Limit | 100 req / 15 min window |
| Auth | `x-api-key` / `Authorization: Bearer` via `x402PaymentGate` |
| Health | `/live`, `/ready`, `/health`, `/version`, `/metrics` |

### 2.2 MCP Tools Exposed

| Tool | Registry Name | Description |
|------|--------------|-------------|
| `scan_code` | `scan-code` | Full deterministic scan (258 rules) |
| `scan_solana` | `scan-solana` | Solana program-specific scan (29 rules) |
| `scan_evm` | `scan-evm` | EVM contract scan (10 rules) |
| `eval_suspicion` | `eval-suspicion` | Heuristic suspicion analysis (77 patterns) |
| `deps_analysis` | `deps-analysis` | Dependency vulnerability scanning |
| `github_scan` | `github-scan` | Full GitHub repository scanning |

### 2.3 MCP Protocol Details

- **Transport:** JSON-RPC 2.0 over HTTP POST (`/mcp`) and SSE (`/mcp` GET)
- **Handshake:** Client sends `initialize` request → Server responds with capabilities
- **Tool Call:** Client sends `tools/call` with `{name, arguments}` → Server returns `{content: [{type, text}]}`
- **Resources:** Accessible via `teos://` URI scheme (health, version, rules, tier)

#### Example MCP Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "scan_code",
    "arguments": {
      "code": "print('hello')",
      "language": "python"
    }
  }
}
```

#### Example MCP Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"verdict\":\"ALLOW\",\"score\":5,\"findings\":[],\"engineVersion\":\"4.0.0\"}"
      }
    ]
  }
}
```

### 2.4 MCP Resources

| Resource URI | Description | Response |
|-------------|-------------|----------|
| `teos://health` | Engine health | `{"status":"ok","version": "4.1.0"}` |
| `teos://version` | Version info | `{"version": "4.1.0","engine":"4.1","rules":258,"tests":1325}` |
| `teos://rules` | Rules summary | `{"total":258,"categories":{"core":95,"banking":32,"solana":29,"evm":21,"dependency":8,"cicd":23,"tokenIntel":25,"dueDiligence":25}}` |
| `teos://tier/{userId}` | User tier | `{"tier":"free","credits":0}` |

---

## 3. Agent Communication Flow

### 3.1 Standard Scan Flow

```
User → Telegram Bot → Activation Service → MCP Server → Response → User
```

1. **User sends** code via `/scan` command to `@teoslinker_bot`
2. **Bot extracts** code/text from Telegram message
3. **Bot queries** Activation Service (`/api/tier/:userId`) for credit check
4. **Bot consumes** credits via Activation Service (`/consume`)
5. **Bot calls** MCP Server (`POST /scan`) with code payload
6. **MCP Server** runs deterministic engine (258 rules) + heuristic suspicion (77 patterns)
7. **MCP Server** returns `{verdict, findings, score}` to bot
8. **Bot formats** response and sends to user via Telegram
9. **Bot sends** audit event to Sentinel Shield (`/ingest`)

### 3.2 GitHub Scan Flow

```
User → Telegram Bot → Git Clone → MCP Scan → Per-file Results → User
```

1. User sends GitHub URL via `/github` or `/scan <url>`
2. Bot detects GitHub URL format
3. Bot clones repo (public or private via `GITHUB_TOKEN`)
4. Bot scans each file through MCP Server
5. Results aggregated per-file with verdict badge
6. Supply-chain analysis if `package.json`/`requirements.txt` detected
7. Formatted response sent to user

### 3.3 Claude Code Flow

```
Claude Code → opencode.json hooks → SentinelGuard → MCP Server → Result → Claude
```

1. Claude Code prepares to execute a tool
2. `before_tool_execution` hooks fire in `opencode.json`
3. `SentinelGuard` intercepts: validates command against MCP risk engine
4. If command is BLOCK/WARN: Claude Code is prevented from executing
5. If ALLOW: execution proceeds normally
6. Result is returned to Claude Code session

---

## 4. Decision Pipeline

### 4.1 Layer 1 — Input Classification

```
Input
  ├── Code snippet → scan_code
  ├── Solana program → scan_solana
  ├── EVM contract → scan_evm
  ├── GitHub URL → github_scan
  ├── Dependency manifest → deps_analysis
  └── Unknown → auto_classify → scan_code
```

### 4.2 Layer 2 — Deterministic Engine

**258 Rules across 8 categories:**

| Category | Count | Examples |
|----------|-------|---------|
| Core Security | 95 | R01 DESTRUCTIVE_SHELL, R07 HARDCODED_SECRET, R22 KEY_EXFIL |
| Banking | 32 | Ledger Manipulation, SWIFT Unencrypted, Reserve Key Leak |
| Solana | 29 | SOL-REENTRANCY, SOL-ARBITRARY-CPI, SOL-OWNER-CHECK |
| EVM | 21 | EVM-REENTRANCY, EVM-UNCHECKED-CALL, EVM-TX-ORIGIN |
| Dependency | 8 | Malicious packages, typosquatting |
| CI/CD | 23 | Destructive shell, pipeline injection |
| Token Intelligence | 25 | SPL/ERC20 analysis, honeypot detection |
| Due Diligence | 25 | Compliance checks, policy enforcement |

Each rule produces: `{rule, severity, message, line, snippet, category}`

### 4.3 Layer 3 — Heuristic Suspicion Engine

**7 Signal Families (77 regex patterns total):**

| Family | Patterns | Max Score | Signals |
|--------|----------|-----------|---------|
| Encoding Signals | 7 | 20 | base64, hex, charCode, escape/unescape |
| Obfuscation Signals | 10 | 25 | eval chains, Function() ctor, string splitting |
| Multi-Stage Signals | 10 | 30 | curl+wget chains, install+execute |
| Hidden Execution Signals | 13 | 35 | eval(), exec(), spawn, Invoke-Expression |
| Tool Chaining Signals | 10 | 30 | curl|bash, nc -e, tee pipe, mkfifo |
| Suspicious URL Signals | 9 | 25 | raw IPs, pastebin, .onion, short URLs |
| Prompt Manipulation | 12 | 35 | jailbreak, ignore prev, roleplay |

**Thresholds:**
| Score | Classification |
|-------|---------------|
| 0-39 | ALLOW (no suspicion) |
| 40-79 | REVIEW (human validation required) |
| 80-100 | WARN (highly suspicious) |

### 4.4 Layer 4 — Final Decision Matrix

| Deterministic | Heuristic | Final |
|---------------|-----------|-------|
| BLOCK | Any | BLOCK |
| WARN | Any | WARN |
| ALLOW | 80-100 | WARN |
| ALLOW | 40-79 | REVIEW |
| ALLOW | 0-39 | ALLOW |

### 4.5 Audit Trail

Every decision is recorded in the audit store with:
- Scan ID (UUID)
- Timestamp
- Input hash (SHA-256)
- Deterministic findings
- Heuristic suspicion score
- Final verdict
- Engine version fingerprint
- Source (telegram/api/cli)

---

## 5. Trust Boundaries

### Boundary 1: User → Bot (Telegram)
- **Trust:** Low (unauthenticated Telegram users)
- **Control:** Credit system, rate limiting
- **Risk:** Abuse via automated Telegram scripts

### Boundary 2: Bot → Activation Service
- **Trust:** Medium (shared `ACTIVATION_AUTH_TOKEN`)
- **Control:** `X-Service-Token` header, constant-time comparison
- **Risk:** Token leakage → unauthorized credit manipulation

### Boundary 3: Bot → MCP Server
- **Trust:** Medium (internal service-to-service)
- **Control:** `x-api-key`, network isolation (internal Docker network)
- **Risk:** Header-based auth bypass documented (3 internal-only bypass headers)

### Boundary 4: MCP Server → External (scan targets)
- **Trust:** Low (arbitrary code/repos being scanned)
- **Control:** Sandboxed container, `--no-sandbox` disabled, non-root user
- **Risk:** SSRF via GitHub clone, ReDoS via crafted patterns

### Boundary 5: Bot → Sentinel Shield
- **Trust:** Medium (bot pushes audit events)
- **Control:** Optional `SENTINEL_API_KEY`
- **Risk:** Data leak if shield is compromised

---

## 6. Runtime Governance Checkpoints

### Checkpoint 1 — Input Validation (Bot Layer)
- GitHub URL detection and validation
- Code extraction from message
- Binary detection for GitHub repos
- Language auto-detection

### Checkpoint 2 — Access Control (Activation Layer)
- Credit balance check (`credits > 0`)
- Tier-based access (`free`/`tester`/`pro`/`team`/`enterprise`)
- Rate limiting (5 req/min for admin commands)

### Checkpoint 3 — Deterministic Analysis (MCP Layer)
- 258 rules executed against input
- Pattern matching with context awareness
- Language-specific rule filtering
- False-positive mitigation filters (7 skip functions)

### Checkpoint 4 — Heuristic Analysis (MCP Layer)
- 77 regex patterns across 7 signal families
- Suspicion score calculation (0-100)
- Multi-stage attack chain detection

### Checkpoint 5 — Decision Adjudication (MCP Layer)
- Final verdict computation via decision matrix
- Confidence score calculation
- Audit hash generation (SHA-256)

### Checkpoint 6 — Response Formatting (Bot Layer)
- Verdict badge (green/yellow/orange/red)
- Severity-tagged findings
- Recommendations section
- Credit display

### Checkpoint 7 — Audit Logging (Shield Layer)
- Immutable audit trail append
- Decision fingerprinting
- PDF report generation (for `/report` command)

---

## 7. Failure Handling

| Failure Mode | Detection | Action | User Impact |
|-------------|-----------|--------|-------------|
| MCP Server down | Health check failure | Retry (3x, exponential backoff) | "Scan temporarily unavailable" message |
| Activation Service down | Credit check failure | Fallback: assume insufficient credits | "Please try again later" |
| GitHub clone failure | Git process error | Fall back to Contents API | Partial results |
| Redis unavailable | Connection error | Degraded mode (in-memory only) | Reduced audit persistence |
| Rate limit exceeded | Counter check | 60s cooldown | "Rate limited, retry in 60s" |
| Invalid input | Parse error | Graceful error message | "No scanable content found" |
| Payment required | 402 response | Tier upgrade prompt | "Insufficient credits" |
| Timeout | 30s timer | Abort scan, return partial results | "Scan timed out" |

### Circuit Breaker (opencode integration)

| Property | Value |
|----------|-------|
| Failure threshold | 3 |
| Cooldown period | 30s |
| Max concurrent | 1 (serialized) |
| Timeout | 600ms |

---

## 8. Claude Code Integration

### 8.1 opencode.json Configuration

```json
{
  "hooks": {
    "before_tool_execution": [
      {
        "matcher": {
          "type": "any",
          "patterns": ["bash", "write", "edit", "replace", "search", "notify"]
        },
        "action": {
          "type": "http",
          "url": "https://agent-code-risk-mcp-production-b97d.up.railway.app/scan",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": {
            "code": "{command}",
            "language": "auto",
            "source": "opencode-hook"
          },
          "timeout": 600,
          "circuit_breaker": {
            "failure_threshold": 3,
            "cooldown_ms": 30000
          },
          "rate_limit": {
            "max_per_minute": 60
          }
        }
      }
    ]
  }
}
```

### 8.2 SentinelGuard Module

**Location:** `teoslinker-bot/src/governance/sentinel-guard.js`

SentinelGuard is a standalone governance module that:
- Intercepts tool execution in Claude Code sessions
- Validates commands against TEOS policy
- Spawns sub-agents for complex validation
- Provides pre-execution policy enforcement
- Rate-limits and circuit-breaks external calls

### 8.3 Decision Flow for Claude Code

```
Claude Code tool call
  → opencode.json hook fires
  → HTTP POST to MCP /scan with command
  → MCP returns verdict
  → If BLOCK: error returned, tool not executed
  → If WARN: warning displayed, execution continues
  → If REVIEW: human approval prompted
  → If ALLOW: execution continues normally
```

---

## 9. Key Metrics

| Metric | Value |
|--------|-------|
| Engine Version | v4.1.0 |
| Total Rules | 258 (95 Core + 32 Banking + 29 Solana + 21 EVM + 8 Dependency + 23 CI/CD + 25 Token Intelligence + 25 Due Diligence) |
| Validation Tests | 1325 |
| Verdict Tiers | 4 (ALLOW / WARN / REVIEW / BLOCK) |
| Heuristic Signal Families | 7 |
| Heuristic Regex Patterns | 77 |
| MCP Tools | 6 (scan_code, scan_solana, scan_evm, eval_suspicion, deps_analysis, github_scan) |
| MCP Resources | 4 (health, version, rules, tier) |
| Transport Protocols | 3 (HTTP, SSE, stdio) |
| Trust Boundaries | 5 |
| Governance Checkpoints | 7 |
| Failure Modes Handled | 9 |
