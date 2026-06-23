# TEOS Sentinel Shield — Environment Setup

## Quick Start

```bash
# 1. Copy the template
cp .env.example .env

# 2. Generate a secure API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# → paste the output as TEOS_API_KEYS in .env

# 3. Start the server
node ws-server/index.js
# → http://localhost:3000
```

---

## Required Variables

These must be set for the server to start and accept requests.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port. Railway sets this automatically. |
| `NODE_ENV` | `production` | `development` for local, `production` for Railway. Controls error verbosity, CORS, and pino-pretty formatting. |
| `TEOS_API_KEYS` | *(none)* | **Comma-separated list of API keys.** At least one key required for auth. Generate with `crypto.randomBytes(32).toString('hex')`. |
| `CORS_ORIGIN` | `http://localhost:3000` | CORS allowed origin for the Express middlewares. Must match your dashboard domain. |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins for the config-based validation layer. |

## Optional Variables

These have safe defaults or are only needed for specific features.

### Server & Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Pino log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. pino-pretty auto-enables in dev mode. |
| `MAX_PAYLOAD_KB` | `64` | Max request body size in KB. Scans larger than this return 413. |
| `MAX_EVENTS` | `500` | Max scan events kept in store. Oldest are pruned on insert when exceeded. |
| `TRUST_PROXY` | `1` | Number of reverse proxy hops. Set `1` on Railway, `0` for direct local access. |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WIN` | `60` | Rate limit window in seconds. |
| `RATE_LIMIT_MAX` | `120` | Max requests per window per IP. |

### WebSocket Telemetry

| Variable | Default | Description |
|----------|---------|-------------|
| `WS_POLL_MS` | `5000` | Event poll interval in milliseconds. How often the WS server checks for new events. |
| `WS_HEARTBEAT_MS` | `30000` | Heartbeat interval. Silent connections are terminated after this. |
| `MAX_WS_PEERS` | `100` | Maximum simultaneous WebSocket connections. |

### Redis (Persistent Store)

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | *(unset)* | Redis connection string. Falls back to in-memory store when unset. Memory store resets on deploy — acceptable for alpha. |

Example:
```
REDIS_URL=redis://default:your-password@your-host.upstash.io:6379
```

### Deploy Tracking

| Variable | Default | Description |
|----------|---------|-------------|
| `RAILWAY_GIT_COMMIT_SHA` | *(auto)* | Set automatically by Railway. Shows deploy commit in `/health`. |
| `GIT_COMMIT_SHA` | `unknown` | Fallback for non-Railway deploys. Set in CI/CD pipeline. |

### CLI & CI Scripts

| Variable | Default | Description |
|----------|---------|-------------|
| `TEOS_API_URL` | *(production Railway URL)* | Base URL for CLI/CI scripts. Used by `scripts/sentinel.js` and `cli/teos.js`. |
| `TEOS_API_KEY` | *(none)* | API key for CLI/CI auth. Must match a key in `TEOS_API_KEYS`. |
| `TEOS_LOG_DIR` | *(cwd)* | Directory for CLI enforcement log files. |

### AI Feedback Loop

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(none)* | Anthropic API key for the AI-powered feedback loop in `core-engine/teos-feedback-loop.js`. Only needed if feedback engine is enabled. |

### Next.js Landing Page (`teos-landing/`)

These are client-side env vars (prefixed with `NEXT_PUBLIC_`) for the demo and dashboard UI.

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SHIELD_API_URL` | *(empty)* | API URL for the InteractiveProof demo component. Set to your shield deployment URL. |
| `NEXT_PUBLIC_DEMO_API_KEY` | *(empty)* | Demo API key for the InteractiveProof component. Must match a key in `TEOS_API_KEYS`. Leave empty to disable demo. |
| `NEXT_PUBLIC_ALPHA_ACTIVATION_SECRET` | *(empty)* | Optional — displayed in dashboard UI for tester deep-link reference. |

### Supabase (Deprecated)

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | *(unset)* | Supabase was removed in Session 14. These vars still appear in `config.cjs` validation but are NOT required for operation. |
| `SUPABASE_SERVICE_ROLE_KEY` | *(unset)* | Same as above. Left for backward compatibility only. |

---

## Local Development Setup

### Minimal (in-memory store, no Redis)

```bash
# .env
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
TEOS_API_KEYS=dev-local-key-001
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
TRUST_PROXY=0
```

```bash
# Start
node ws-server/index.js
# → http://localhost:3000/health
```

### Full (with Redis, landing page demo)

```bash
# .env
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
TEOS_API_KEYS=dev-local-key-001
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
TRUST_PROXY=0
REDIS_URL=redis://localhost:6379
MAX_EVENTS=1000
NEXT_PUBLIC_SHIELD_API_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_API_KEY=dev-local-key-001
```

```bash
# Terminal 1: Start Redis (if using Docker)
docker run -p 6379:6379 redis:7-alpine

# Terminal 2: Start shield
node ws-server/index.js

# Terminal 3: Start landing page (separate process)
cd teos-landing
npm run dev
```

### Testing the setup

```bash
# Health check
curl http://localhost:3000/health

# Submit a scan event
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-local-key-001" \
  -d '{"verdict":"ALLOW","ruleId":"R01","severity":"low","reasons":["test"],"riskScore":10}'

# View events
curl http://localhost:3000/events \
  -H "X-API-Key: dev-local-key-001"

# View dashboard
open http://localhost:3000/dashboard.html
```

---

## Railway Deployment Setup

### Step 1 — Create Railway service

```
Railway Dashboard → New Project → Deploy from GitHub repo
→ Select: Elmahrosa/teos-sentinel-shield
```

### Step 2 — Set environment variables in Railway Dashboard

In your Railway service → Variables tab, set:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `TEOS_API_KEYS` | *(generate with `crypto.randomBytes(32).toString('hex')`)* |
| `CORS_ORIGIN` | `https://sentinel.teosegypt.com` |
| `ALLOWED_ORIGINS` | `https://sentinel.teosegypt.com` |
| `TRUST_PROXY` | `1` |
| `REDIS_URL` | *(Railway Redis plugin connection string)* |
| `NEXT_PUBLIC_SHIELD_API_URL` | `https://teos-sentinel-shield-production-ef7a.up.railway.app` |
| `NEXT_PUBLIC_DEMO_API_KEY` | *(same value as TEOS_API_KEYS, or a dedicated demo key)* |
| `LOG_LEVEL` | `info` |

Railway automatically sets `PORT` and `RAILWAY_GIT_COMMIT_SHA`.

### Step 3 — Verify deployment

```bash
# Health endpoint
curl https://your-service.up.railway.app/health

# Should return:
# {
#   "status": "ok",
#   "engine": "v3.0.0",
#   "environment": "production",
#   "eventCount": 0,
#   "store": "redis" | "memory"
# }
```

---

## Entry Points

| Entry Point | Purpose | When to Use |
|-------------|---------|-------------|
| `ws-server/index.js` | **Production** — Express API + WebSocket + static files | Railway, production deploys |
| `src/server/index.js` | **Modular** — Express API only (no WS) | Testing, modular deployments |
| `server/api.js` | **API module** — Core routes, auth, event store | Imported by both entry points |

**Default (Railway):** `ws-server/index.js` — set as `startCommand` in `railway.toml`.

---

## Secret Generation Reference

```bash
# API key (32 bytes = 64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Redis password (16 bytes = 32 hex chars)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `401 Unauthorized` on every request | `TEOS_API_KEYS` not set or mismatch | Check `.env` has a valid key; pass it as `X-API-Key` header |
| `CORS` errors in browser | `CORS_ORIGIN` doesn't match dashboard domain | Set `CORS_ORIGIN` to match the exact dashboard URL |
| Events reset after deploy | No `REDIS_URL` — using memory store | Add Redis connection string or document as expected for alpha |
| WebSocket disconnects | `WS_HEARTBEAT_MS` too low or proxy timeout | Increase `WS_HEARTBEAT_MS` or check proxy idle timeouts |
| `413 Payload Too Large` | Scan exceeds `MAX_PAYLOAD_KB` | Increase `MAX_PAYLOAD_KB` or reduce scan input size |
