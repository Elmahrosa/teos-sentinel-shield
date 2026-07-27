# TEOS Sentinel Shield — Architecture (v4.0.0 GA)

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TEOS Sovereign Stack                      │
│                                                             │
│  AI Agent / LLM Output / CI / CLI                           │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────┐                                        │
│  │  Sentinel Shield │  ← Execution Firewall (this repo)     │
│  │  Validate →      │                                        │
│  │  ALLOW/WARN/BLOCK│                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  Audit (Supabase) + Cache (Upstash Redis) + Billing (Dodo)  │
└─────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
teos-sentinel-shield/
├── server/api.js           Express engine (scan, enforce, audit, billing)
├── ws-server/index.js      Unified process: Express + WebSocket + static
├── cli/teos.js             Local enforcement CLI (teos run)
├── public/                 Static marketing / dashboards
├── teos-landing/           Next.js marketing site (optional deploy)
├── docs/                   OpenAPI + integration notes
├── migrations/             Supabase SQL (audit_logs, billing)
├── test/engine-test.js     Deterministic engine tests
├── vercel.json             Vercel routes → server/api.js + public/
├── railway.toml            Railway start: node ws-server/index.js
└── package.json            version 4.0.0
```

## Data Flow

1. **Input** — Agent/CLI/CI submits command to `POST /scan` or `POST /enforce`
2. **Auth** — `X-API-Key` resolves tier (env map → Redis → Supabase hash)
3. **Rate limit** — Tiered RPM/RPD; `-1` means unlimited
4. **Policy** — 31 deterministic regex rules → highest score wins
5. **Verdict** — ALLOW / WARN / BLOCK (+ score, ruleId, reasons)
6. **Persist** — Redis event ring + Supabase `audit_logs`
7. **Stream** — SSE `/events/stream` (auth) + WebSocket telemetry

## Public vs Protected Routes

| Route | Auth |
|-------|------|
| `GET /health` | Public |
| `GET /stats` | Public (counts only, no commands) |
| `GET /billing/pricing` | Public |
| `POST /webhook/dodo` | HMAC signature (not API key) |
| `POST /billing/checkout` | Public (IP rate-limited as free) |
| `POST /scan`, `/enforce` | API key |
| `GET /events`, `/audit`, `/metrics`, `/ledger/verify` | API key |
| `GET /events/stream` | API key |

## Environment Variables

See `.env.example`. Required for production:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TEOS_API_KEYS=sk-prod-starter-...,sk-prod-enterprise-...
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_RETURN_URL=https://sentinel.teosegypt.com
CORS_ORIGIN=https://sentinel.teosegypt.com
NODE_ENV=production
```

## Deployment Targets

| Target | Role | Entry |
|--------|------|--------|
| **Railway** | API + WS unified | `npm start` → `ws-server/index.js` |
| **Vercel** | HTTP API + static | `vercel.json` → `server/api.js` |
| **Local** | Dev | `npm run dev` or `npm start` |

## Scan Tier Limits

| Tier | RPM | RPD | Scans |
|------|-----|-----|-------|
| Free | 5 | 100 | 50 |
| Starter | 30 | 5000 | 5000 |
| Team | 150 | 50000 | 50000 |
| Enterprise | 600 | unlimited | unlimited |
| Sovereign | unlimited | unlimited | unlimited |

## Rule Engine

- Deterministic regex rules (R01–R31)
- Score ≥ 80 → BLOCK; else WARN; no hit → ALLOW
- Covers shell, SQL, CI, containers, secrets, PowerShell, Windows, K8s, cloud transfer
