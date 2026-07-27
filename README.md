# TEOS Sentinel Shield

**v4.0.0 GA — Execution Control Infrastructure for Autonomous Systems**

Deterministic AI runtime security middleware that sits between AI-generated actions and execution — providing inspection, scoring, blocking, auditability, and compliance visibility before commands, code, or scripts are executed.

**Production site:** Railway (API) + Vercel (HTTP)

```
INPUT  →  31 deterministic rules  →  BLOCK / WARN / ALLOW  →  PERSIST + STREAM
```

## What This Is

- **Infrastructure middleware** — not a dashboard, not a SaaS, not a landing page
- **Deterministic rule engine** — no ML inference, no probabilistic verdicts, no black box
- **Runtime enforcement layer** — pre-execution security gate for AI agents, CI/CD pipelines, shell commands, and cloud operations
- **Audit-first architecture** — every decision logged, every rule publicly inspectable, every verdict reproducible

## Who It's For

- AI agent platforms that need pre-execution validation
- CI/CD pipelines requiring policy enforcement gates
- DevSecOps teams building autonomous deployment pipelines
- Sovereign AI environments (government, enterprise) requiring compliance-grade governance
- Security researchers validating AI-generated code before execution

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TEOS Sentinel Shield                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  INPUT   │───→│  Rule Engine │───→│   Verdict Engine  │   │
│  │ Command  │    │  (25 rules)  │    │  BLOCK/WARN/ALLOW │   │
│  │ /Code    │    │  Regex scan  │    │   Score 0-100     │   │
│  └──────────┘    └──────────────┘    └────────┬─────────┘   │
│                                                │             │
│                    ┌───────────────────────────┼───────────┐ │
│                    │                           │           │ │
│              ┌─────▼─────┐  ┌──────────┐  ┌───▼───────┐   │ │
│              │  Persist  │  │   WS     │  │  HTTP API │   │ │
│              │  events   │  │  Stream  │  │  /scan    │   │ │
│              │  .json    │  │  Live    │  │  /stats   │   │ │
│              └───────────┘  └──────────┘  │  /events  │   │ │
│                                           │  /audit   │   │ │
│                                           │  /health  │   │ │
│                                           └───────────┘   │ │
└───────────────────────────────────────────────────────────┘│
```

## Deployment

| Target | Role | Command |
|--------|------|---------|
| **Vercel** | HTTP API + static UI | `vercel --prod` |
| **Railway** | Unified server (API + WS + static) | Auto-deploy from `main` |
| **Local dev** | Express API only | `npm run dev` |
| **Local full** | API + WS + static | `npm start` |

### Vercel (HTTP API)

```bash
vercel --prod
```

Vercel serves static files (`public/`) and routes API calls to `server/api.js` as serverless functions.

### Railway (Unified Server)

```bash
npm install
npm start
```

`ws-server/index.js` hosts everything in one process:
- Express API (`/scan`, `/stats`, `/events`, `/audit`, `/health`)
- WebSocket telemetry (`ws://`)
- Static file server (`/index.html`, `/dashboard.html`, etc.)

Set `PORT` (default: `3000`) and optionally `MAX_WS_PEERS` (default: `100`).

### Local Development

```bash
npm install
npm run dev        # Express API on port 3000
npm start          # Full unified server on port 3000
```

## API Endpoints

### POST /scan

Scan a command or code snippet against the rule engine.

```bash
curl -X POST https://teos-sentinel-shield.vercel.app/scan \
  -H "Content-Type: application/json" \
  -d '{"command": "rm -rf /"}'
```

Response:

```json
{
  "verdict": "BLOCK",
  "score": 100,
  "rule": "R01.DESTRUCTIVE_SHELL",
  "ruleId": "R01",
  "severity": "critical",
  "reasons": [
    "rm -rf permanently destroys all filesystem data",
    "Wiper malware signature detected"
  ],
  "command": "rm -rf /",
  "timestamp": "2026-05-07T03:14:22.000Z",
  "type": "shell"
}
```

### GET /stats

Aggregated scan counters.

```json
{
  "total": 142,
  "blocked": 19,
  "warned": 31,
  "allowed": 92,
  "blockRate": "13.4",
  "topRules": [
    { "id": "R01", "count": 5 },
    { "id": "R03", "count": 3 }
  ],
  "rulesActive": 25
}
```

### GET /events

Paginated event log with optional filters.

```
GET /events?page=1&limit=50&verdict=block&ruleId=R01
```

### GET /audit

Compliance export — last 200 events, reversed, with engine metadata.

### GET /health

Engine health check with uptime, version, and rule count.

## Rule Engine — 25 Deterministic Rules

| ID | Name | Severity | Score | Category |
|----|------|----------|-------|----------|
| R01 | DESTRUCTIVE_SHELL | critical | 100 | shell |
| R02 | CHMOD_ESCALATION | critical | 90 | shell |
| R03 | CURL_EXEC_CHAIN | critical | 95 | shell |
| R04 | SECRET_ECHO | critical | 90 | secret |
| R05 | ENV_EXFIL | critical | 95 | secret |
| R06 | FORK_BOMB | critical | 100 | dos |
| R07 | BASE64_EXEC | high | 88 | obfuscation |
| R08 | REVERSE_SHELL | critical | 100 | shell |
| R09 | SQL_DESTRUCTION | high | 85 | sql |
| R10 | SQL_INJECTION | high | 75 | sql |
| R11 | PATH_TRAVERSAL | high | 78 | traversal |
| R12 | COMMAND_INJECTION | critical | 92 | injection |
| R13 | PRIVILEGE_ESCALATION | critical | 90 | shell |
| R14 | MALICIOUS_PACKAGE | high | 85 | supply-chain |
| R15 | TYPOSQUAT_PACKAGE | high | 70 | supply-chain |
| R16 | UNSAFE_PERMISSIONS | medium | 65 | ci |
| R17 | CURL_BASH_CI | critical | 95 | ci |
| R18 | PRIVILEGED_CONTAINER | high | 80 | ci |
| R19 | HARDCODED_SECRET | critical | 92 | secret |
| R20 | PROMPT_INJECTION | high | 80 | ai |
| R21 | SSRF_ATTEMPT | high | 82 | network |
| R22 | XXE_INJECTION | high | 80 | xml |
| R23 | CRYPTO_MINER | critical | 95 | malware |
| R24 | DATA_EXFIL_CURL | high | 88 | exfiltration |
| R25 | CI_SECRETS_DUMP | critical | 90 | ci |

Full machine-readable definitions: [`public/rules.json`](public/rules.json)
37 test cases: [`public/test-cases.json`](public/test-cases.json)

## Verdict Model

| Verdict | Score Range | Action |
|---------|-------------|--------|
| **BLOCK** | ≥ 80 | Execution denied. Critical/high risk detected. |
| **WARN** | 40–79 | Review required. Medium risk detected. |
| **ALLOW** | 0–39 | Safe to execute. No threat patterns matched. |

## UI Interfaces

| File | Purpose | URL |
|------|---------|-----|
| `public/index.html` | Command Center — 5-tab dashboard | `/` |
| `public/dashboard.html` | SOC Dashboard — real-time telemetry | `/dashboard.html` |
| `public/replay.html` | Forensic Replay — timeline scrubber | `/replay.html` |
| `public/transparency.html` | Transparency Hub — audit docs | `/transparency.html` |

## Compliance Guarantees

- **Deterministic** — same input always produces the same output. No randomness. No model drift.
- **Publicly Inspectable** — all 25 rules, 37 test cases, and audit schemas are available as static JSON.
- **Event Persisted** — every scan decision is logged with timestamp, rule, score, and verdict.
- **Export Ready** — audit logs exportable as CSV or JSON. SIEM-compatible.
- **No ML Dependency** — zero ML inference. Pure pattern matching with regex.
- **Versioned Engine** — engine version reported in every endpoint.

## WebSocket Telemetry

The unified server (`ws-server/index.js`) provides a WebSocket stream for real-time SOC dashboards.

Connect to `ws://your-railway-url:3000` to receive:

- **Snapshot** — initial 50 most recent events on connect
- **Live events** — real-time broadcast of new scan verdicts
- **Heartbeat** — ping/pong keepalive

### Protocol

```json
// Snapshot on connect
{"type": "snapshot", "count": 50, "events": [...], "serverTime": "..."}

// Live event broadcast
{"type": "scan", "verdict": "block", "score": 100, "rule": "R01.DESTRUCTIVE_SHELL", "command": "rm -rf /", "timestamp": "..."}

// Periodic event batch
{"type": "events", "count": 10, "events": [...], "time": "..."}

// Ping (client → server)
{"type": "ping"}

// Pong (server → client)
{"type": "pong", "time": 1746618862000}
```

## Project Structure

```
├── server/api.js          # Express API + rule engine (Vercel + Railway)
├── ws-server/index.js     # Unified server: API + WS + static (Railway)
├── public/
│   ├── index.html         # Command Center SPA
│   ├── dashboard.html     # SOC Dashboard
│   ├── replay.html        # Forensic Replay
│   ├── transparency.html  # Transparency Hub
│   ├── rules.json         # Machine-readable rule definitions
│   ├── test-cases.json    # 37 attack simulation test cases
│   └── audit-example.json # Schema documentation + samples
├── data/events.json       # Rotating event store (gitignored)
├── vercel.json            # Vercel routing configuration
├── package.json
└── README.md
```

## License

**TESL v2.0** (TEOS Sovereign License) — governed by the ICBC Constitution.

Not MIT. Not Apache. This is a sovereign license designed for government, institutional, and constitution-bound deployment.

- Permitted: Use by governments, regulators, approved institutions
- Required: Audit manifests in all deployments
- Prohibited: Unauthorized forking or re-licensing

[ICBC Constitution](https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution/blob/main/CONSTITUTION.md) · [TESL v2.0](https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution/blob/main/LICENSE-TESL.md)

© 2026 Elmahrosa International
