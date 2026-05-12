# TEOS Sentinel Shield

**Execution Control Infrastructure for Autonomous AI Systems**

Deterministic pre-execution security middleware that sits between AI-generated actions and runtime — inspecting, scoring, blocking, and auditing every command before it executes.

```
INPUT → 27 deterministic rules → BLOCK / WARN / ALLOW → PERSIST + STREAM
```

[![Engine](https://img.shields.io/badge/Engine-v2.2.0-brightgreen?style=flat-square)](https://agent-code-risk-mcp-production.up.railway.app/health)
[![Rules](https://img.shields.io/badge/Rules-27_Active-gold?style=flat-square)](https://teos-sentinel-shield.vercel.app/rules.json)
[![Tests](https://img.shields.io/badge/Tests-39_Passing-brightgreen?style=flat-square)](https://teos-sentinel-shield.vercel.app/test-cases.json)
[![License](https://img.shields.io/badge/License-TESL_v2.0-red?style=flat-square)](https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution/blob/main/LICENSE-TESL.md)
[![Governance](https://img.shields.io/badge/Governance-ICBC_Constitution-gold?style=flat-square)](https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution)

---

## Live Endpoints

| Surface | URL |
|---|---|
| Command Center | https://teos-sentinel-shield.vercel.app |
| Product Landing | https://teos-sentinel-shield.vercel.app/sentinel.html |
| Forensic Replay | https://teos-sentinel-shield.vercel.app/replay.html |
| Transparency Hub | https://teos-sentinel-shield.vercel.app/transparency.html |
| Engine Health | https://agent-code-risk-mcp-production.up.railway.app/health |
| Telegram Bot | https://t.me/teoslinker_bot |
| Company | https://teosegypt.com |

---

## What This Is

- **Infrastructure middleware** — not a dashboard, not a SaaS wrapper
- **Deterministic rule engine** — no ML inference, no probabilistic verdicts, no black box
- **Pre-execution enforcement** — command is evaluated before it reaches any runtime
- **Audit-first architecture** — every decision logged, HMAC-signed, publicly inspectable

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEOS Sovereign Security Mesh                 │
│                                                                 │
│  Trigger Sources                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Telegram │  │  REST    │  │  CI/CD   │  │  Web UI  │       │
│  │   Bot    │  │  /scan   │  │ Pipeline │  │  Scanner │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       └─────────────┴─────────────┴──────────────┘             │
│                              │                                  │
│                              ▼                                  │
│              ┌───────────────────────────┐                      │
│              │   Layer 4 — Gateway       │                      │
│              │   teoslinker-bot          │                      │
│              └──────────────┬────────────┘                      │
│                             │  POST /scan                       │
│                             ▼                                   │
│              ┌───────────────────────────┐                      │
│              │   Layer 5 — Risk Engine   │  ← Railway           │
│              │   agent-code-risk-mcp     │                      │
│              │   27 rules · 39 tests     │                      │
│              └──────┬──────────┬─────────┘                      │
│                     │          │                                 │
│              ┌──────▼──┐  ┌────▼──────┐                        │
│              │  BLOCK  │  │   WARN    │  ALLOW → Execute        │
│              │  Alert  │  │  Review   │                         │
│              └──────┬──┘  └────┬──────┘                        │
│                     └────┬─────┘                                │
│                          ▼                                      │
│              ┌───────────────────────────┐                      │
│              │   Audit Trail             │                      │
│              │   HMAC-signed · /audit    │                      │
│              └───────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment

| Target | Role | Status |
|---|---|---|
| **Vercel** | Static frontend + Command Center | ✅ Live |
| **Railway** | Risk engine API (`/scan`, `/audit`, `/stats`, `/health`) | ✅ Live |
| **Docker** | Air-gapped sovereign deployment | See below |
| **Local** | `npm start` | Express on port 3000 |

### Vercel (Frontend)

```bash
vercel --prod
```

Serves `public/` as static files. Command Center connects to Railway engine via `API_BASE`.

### Railway (Engine)

```bash
npm install
npm start
```

Engine endpoints: `/scan`, `/stats`, `/audit`, `/health`, `/analyze`, `/scan-dependencies`

Set `PORT` (default: 3000), `TEOS_MODE=test` (disables payment gate).

### Docker (Air-Gapped / Sovereign)

```bash
# Pull and run
docker run -d \
  --name teos-sentinel \
  -p 8080:8080 \
  -e TEOS_MODE=test \
  elmahrosa/teos-sentinel:latest

# Or full stack with compose
docker compose up -d
```

See [`docker/`](docker/) for full setup including compose, Nginx config, and air-gap instructions.

---

## API Reference

### POST /scan

```bash
curl -X POST https://agent-code-risk-mcp-production.up.railway.app/scan \
  -H "Content-Type: application/json" \
  -d '{"command": "rm -rf /"}'
```

Response:

```json
{
  "verdict": "BLOCK",
  "score": 100,
  "findings": [{ "ruleId": "R01", "ruleName": "DESTRUCTIVE_SHELL", "severity": "critical" }],
  "explanation": "Wiper pattern detected. Permanent filesystem destruction.",
  "ts": "2026-05-12T06:00:00.000Z"
}
```

### GET /stats

```json
{
  "engine": "2.2.0",
  "rules": 27,
  "tests_passing": 39,
  "usage": { "total_requests": 142, "blocked_decisions": 19 },
  "last_24h": { "requests": 142, "blocked": 19 }
}
```

### GET /audit

Returns last 100 scan events. Query params: `?limit=50&verdict=BLOCK`

### GET /health

```json
{ "status": "ok", "service": "agent-code-risk-mcp", "engine": "2.2.0", "rules": 27, "tests": 39 }
```

---

## Rule Engine — 27 Deterministic Rules

| ID | Name | Severity | Score | Category |
|---|---|---|---|---|
| R01 | DESTRUCTIVE_SHELL | critical | 100 | shell |
| R02 | CHMOD_ESCALATION | critical | 90 | shell |
| R03 | CURL_EXEC_CHAIN | critical | 95 | shell |
| R04 | SECRET_ECHO | critical | 90 | secret |
| R05 | ENV_EXFIL | critical | 95 | secret |
| R06 | FORK_BOMB | critical | 100 | dos |
| R07 | HARDCODED_SECRET | critical | 90 | secret |
| R08 | SUDO_SHELL | critical | 88 | shell |
| R09 | CHMOD_SUID | critical | 85 | shell |
| R10 | CRYPTOMINER | critical | 92 | malware |
| R11 | PRINTENV_SECRET | high | 80 | secret |
| R12 | CI_SECRET_TEMPLATE | critical | 92 | ci |
| R13 | SQL_DESTRUCTION | high | 75 | sql |
| R14 | CMD_INJECTION | high | 78 | injection |
| R15 | HARDCODED_SECRET_SRC | high | 82 | secret |
| R16 | DATA_EXFIL_CURL | critical | 88 | exfiltration |
| R17 | MALICIOUS_NPM | high | 85 | supply-chain |
| R18 | PRIVILEGED_CONTAINER | critical | 88 | ci |
| R19 | ENV_EXFILTRATION | critical | 90 | secret |
| R20 | STRING_CONCAT_EVASION | high | 72 | obfuscation |
| R21 | SSRF_ATTEMPT | critical | 90 | network |
| R22 | KEY_EXFIL | critical | 95 | exfiltration |
| R23 | SQL_INJECTION | high | 68 | sql |
| R24 | PATH_TRAVERSAL | high | 65 | traversal |
| R25 | PROMPT_INJECTION | high | 60 | ai |
| R26 | BASE64_EXEC | critical | 88 | obfuscation |
| R27 | XXE_INJECTION | high | 80 | xml |

Full machine-readable definitions: [`public/rules.json`](public/rules.json)  
39 test cases: [`public/test-cases.json`](public/test-cases.json)

---

## Verdict Model

| Verdict | Score | Action |
|---|---|---|
| **BLOCK** | ≥ 80 | Execution denied. Audit entry written. Alert fired. |
| **WARN** | 40–79 | Human review required. Flagged for approval. |
| **ALLOW** | 0–39 | Safe to execute. Clean audit entry logged. |

---

## UI Interfaces

| File | Purpose |
|---|---|
| `public/index.html` | Command Center — live stats, event feed, scan tab |
| `public/sentinel.html` | Product landing page with pricing |
| `public/replay.html` | Forensic Replay — 25-event timeline player |
| `public/transparency.html` | Transparency Hub — audit docs |
| `public/dashboard.html` | SOC Dashboard — real-time telemetry |

---

## Compliance Guarantees

- **Deterministic** — same input always produces the same output. No randomness. No model drift.
- **Publicly Inspectable** — all 27 rules, 39 test cases, and audit schemas are static JSON.
- **HMAC-Signed** — every audit entry cryptographically signed.
- **Export Ready** — CSV and JSON. SIEM-compatible.
- **No ML Dependency** — pure regex pattern matching.
- **Air-Gap Capable** — Docker image runs with zero internet.
- **ICBC Governed** — constitutional authority above technical capability.

---

## Project Structure

```
├── server/api.js              # Express API + rule engine (Vercel serverless)
├── ws-server/index.js         # Unified server: API + WS + static (Railway)
├── docker/
│   ├── Dockerfile             # Production image
│   ├── docker-compose.yml     # Full stack compose
│   └── README.md              # Air-gap deployment guide
├── public/
│   ├── index.html             # Command Center SPA
│   ├── sentinel.html          # Product landing + pricing
│   ├── replay.html            # Forensic Replay
│   ├── transparency.html      # Transparency Hub
│   ├── dashboard.html         # SOC Dashboard
│   ├── rules.json             # 27 rule definitions (machine-readable)
│   ├── test-cases.json        # 39 attack simulation cases
│   └── audit-example.json     # Audit schema + samples
├── vercel.json                # Vercel routing
├── package.json
└── README.md
```

---

## Government & Enterprise Pilots

4-week air-gapped deployment inside your infrastructure.

| Package | Investment | Includes |
|---|---|---|
| Fast Pilot (4 weeks) | $12,000–$18,000 | Deployment + custom rules + 24/7 support |
| Year 1 Sovereign License | $25,000–$35,000 | Unlimited scans + managed support |
| Regional (3 countries) | $46,000/year | Egypt + UAE + Saudi, 15% discount |

**Contact:** ayman@teosegypt.com · [Request Pilot →](mailto:ayman@teosegypt.com?subject=Pilot%20Request%20%E2%80%94%20TEOS%20Sentinel)

---

## License

**TESL v2.0** — TEOS Sovereign License, governed by the ICBC Constitution.

Not MIT. Not Apache. Designed for government, institutional, and constitution-bound deployment.

- Permitted: Governments, regulators, approved institutions
- Required: Audit manifests in all deployments
- Prohibited: Unauthorized forking or re-licensing

[ICBC Constitution](https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution/blob/main/CONSTITUTION.md) · [TESL v2.0](https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution/blob/main/LICENSE-TESL.md)

---

**Part of the [TEOS Sovereign Security Stack](https://github.com/Elmahrosa/teos-sovereign-security-stack)**  
© 2026 Elmahrosa International · teosegypt.com · Alexandria, Egypt  
*Law governs execution.*
