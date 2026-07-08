# TEOS Sovereign Sentinel — API Reference

> Engine v4.1.0 · 258 Rules · 1325 Tests · 7 Framework Mappings

---

## Table of Contents

1. [MCP Risk Engine](#1-mcp-risk-engine-agent-code-risk-mcp)
2. [Sentinel Shield](#2-sentinel-shield-teos-sentinel-shield)
3. [Activation Service](#3-activation-service-teos-activation-service)
4. [Bot](#4-bot-teoslinker-bot)
5. [Authentication](#5-authentication)
6. [Rate Limiting](#6-rate-limiting)
7. [Credit Costs](#7-credit-costs)
8. [Common Errors](#8-common-errors)

---

## 1. MCP Risk Engine (agent-code-risk-mcp)

The core security analysis engine. Performs deterministic rule matching (258 rules) and heuristic suspicion scoring on code, dependencies, and Solana/EVM tokens.

**Base URLs**

| Environment | URL |
|-------------|-----|
| Production | `https://sentinel.teosegypt.com` |
| Local | `http://localhost:8090` |

### 1.1 Liveness Probe

```
GET /live
```

**Headers:** None

**Response `200`:**

```json
{
  "status": "ok",
  "alive": true,
  "uptime": 84321,
  "bootTime": "2026-06-29T00:00:00.000Z"
}
```

### 1.2 Readiness Probe

```
GET /ready
```

**Headers:** None

**Response `200`:**

```json
{
  "status": "ok",
  "ready": true,
  "checks": {
    "redis": "ok",
    "engine": "ok"
  }
}
```

### 1.3 Health

```
GET /health
```

**Headers:** None

**Response `200`:**

```json
{
  "status": "ok",
  "version": "4.1.0",
  "rules": 258,
  "tests": 1325,
  "governance": true,
  "heuristicEngine": true,
  "suspicionSignals": 7,
  "verdicts": {
    "ALLOW": true,
    "WARN": true,
    "BLOCK": true,
    "REVIEW": true
  },
  "uptime": 84321
}
```

### 1.4 Version

```
GET /version
```

**Headers:** None

**Response `200`:**

```json
{
  "version": "4.1.0",
  "engine": "4.1",
  "rules": 258,
  "tests": 1325
}
```

### 1.5 Metrics

```
GET /metrics
```

**Headers:** None

**Response `200`:** Prometheus-formatted metrics (text/plain).

### 1.6 Pricing

```
GET /pricing
```

**Headers:** None

**Response `200`:**

```json
{
  "free": { "daily": 5 },
  "pro": { "monthly": 1000, "price": 49 },
  "team": { "monthly": 10000, "price": 199 },
  "enterprise": { "monthly": 999999, "price": 25000 },
  "founder": { "monthly": 999999, "price": 0 },
  "credits": {
    "scan": 1,
    "deps": 1,
    "ci": 1,
    "report": 2,
    "github": 15
  }
}
```

### 1.7 Tier

```
GET /tier
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-teos-api-key` | `<api_key>` | Yes (or `authorization`) |
| `authorization` | `Bearer <api_key>` | Yes (or `x-teos-api-key`) |

**Response `200`:**

```json
{
  "tier": "free",
  "credits": 5,
  "dailyLimit": 5,
  "label": "Free Tier"
}
```

### 1.8 Stats (Auth Required)

```
GET /stats
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-api-key` | `<audit_key>` | Yes (or `authorization`) |
| `authorization` | `Bearer <audit_key>` | Yes (or `x-api-key`) |

**Response `200`:**

```json
{
  "totalScans": 1283,
  "blockedDecisions": 47,
  "warnDecisions": 212,
  "allowDecisions": 1002,
  "reviewDecisions": 22
}
```

### 1.9 Audit Log (Auth Required)

```
GET /audit
```

**Query Parameters:**

| Param | Type | Default | Max |
|-------|------|---------|-----|
| `limit` | integer | 100 | 500 |

**Headers:** Same as `/stats`.

**Response `200`:**

```json
[
  {
    "verdict": "ALLOW",
    "score": 12,
    "rule": "none",
    "input": "<redacted>",
    "ts": "2026-06-29T12:00:00.000Z"
  }
]
```

### 1.10 Root

```
GET /
```

**Headers:** None

**Response `200`:** Root info object with available route paths.

### 1.11 Scan Code

```
POST /scan
```

**Headers:** None (paid endpoint — gate enforced server-side).

**Request Body:**

```json
{
  "command": "rm -rf /etc",
  "context": { "source": "telegram", "userId": "12345" }
}
```

Fields: `command`, `cmd`, or `code` (one required). `context` optional.

**Response `200` (ALLOW):**

```json
{
  "verdict": "ALLOW",
  "score": 5,
  "findings": [],
  "explanation": "No security issues detected.",
  "governance": {
    "verdict": "ALLOW",
    "riskScore": 5,
    "engines": ["deterministic", "heuristic"],
    "confidence": "high",
    "evidenceCount": 0,
    "frameworks": ["nist-csf", "owasp-asvs"]
  },
  "ts": "2026-06-29T12:00:00.000Z"
}
```

**Response `200` (BLOCK):**

```json
{
  "verdict": "BLOCK",
  "score": 92,
  "findings": [
    {
      "rule": "destructive-shell-cmd",
      "severity": "critical",
      "line": 1,
      "message": "Destructive shell command detected: rm -rf on system-critical path",
      "snippet": "rm -rf /etc",
      "governance": {
        "framework": "owasp-asvs",
        "confidence": "high",
        "governanceEngine": "deterministic",
        "suggestedFix": "Remove or disable destructive commands; use safe alternatives."
      }
    }
  ],
  "explanation": "Command blocked by 1 critical rule: destructive-shell-cmd",
  "governance": {
    "verdict": "BLOCK",
    "riskScore": 92,
    "engines": ["deterministic"],
    "confidence": "high",
    "evidenceCount": 1,
    "frameworks": ["nist-csf", "owasp-asvs"]
  },
  "ts": "2026-06-29T12:00:00.000Z"
}
```

**Response `200` (REVIEW):**

```json
{
  "verdict": "REVIEW",
  "score": 65,
  "findings": [
    {
      "rule": "heuristic-suspicion",
      "severity": "medium",
      "line": 1,
      "message": "Suspicious encoding pattern detected",
      "snippet": "eval(atob('...'))",
      "governance": {
        "framework": "nist-csf",
        "confidence": "medium",
        "governanceEngine": "heuristic",
        "suggestedFix": "Review and simplify encoded logic."
      }
    }
  ],
  "explanation": "No deterministic rules matched, but heuristic analysis found suspicious patterns. Human review required.",
  "governance": {
    "verdict": "REVIEW",
    "riskScore": 65,
    "engines": ["deterministic", "heuristic"],
    "confidence": "medium",
    "evidenceCount": 1,
    "frameworks": ["nist-csf"]
  },
  "ts": "2026-06-29T12:00:00.000Z"
}
```

### 1.12 Analyze Code

```
POST /analyze
```

**Headers:** None.

**Request Body:**

```json
{
  "code": "contract FlashLoan { ... }",
  "language": "solidity",
  "context": {},
  "mode": "premium"
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `code` | string | yes | — |
| `language` | string | no | `auto` |
| `context` | object | no | `{}` |
| `mode` | string | no | `basic` |

**Response `200`:** Same structure as `/scan` plus:

```json
{
  "language": "solidity",
  "mode": "premium"
}
```

### 1.13 Scan Dependencies

```
POST /scan-dependencies
```

**Headers:** None.

**Request Body:**

```json
{
  "manifest": "{\n  \"name\": \"my-app\",\n  \"dependencies\": {\n    \"lodash\": \"^4.17.20\"\n  }\n}",
  "lockfile": "{\n  \"packages\": { ... }\n}"
}
```

| Field | Type | Required |
|-------|------|----------|
| `manifest` | string | yes |
| `lockfile` | string | no |

**Response `200`:**

```json
{
  "verdict": "WARN",
  "score": 45,
  "findings": [
    {
      "rule": "vulnerable-dep",
      "severity": "high",
      "message": "lodash@4.17.20: CVE-2020-8203 — Prototype Pollution"
    }
  ],
  "summary": "lodash@4.17.20: CVE-2020-8203 — Prototype Pollution"
}
```

### 1.14 Scan Token

```
POST /scan-token
```

**Headers:** None.

**Request Body:**

```json
{
  "address": "So11111111111111111111111111111111111111112",
  "mode": "basic"
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `address` | string | yes | — |
| `mode` | string | no | `basic` |

**Response `200`:**

```json
{
  "verdict": "ALLOW",
  "score": 15,
  "token": {
    "name": "Wrapped SOL",
    "symbol": "wSOL",
    "decimals": 9,
    "totalSupply": "1000000000000000000"
  },
  "ownership": {
    "holderCount": 15234,
    "topHolders": [
      { "address": "...", "percentage": 3.2 }
    ]
  },
  "authority": {
    "mintAuthority": null,
    "freezeAuthority": null
  },
  "concentration": {
    "top10": 18.5,
    "top20": 26.1,
    "top50": 38.7,
    "giniCoefficient": 0.72
  },
  "liquidity": {
    "poolDepth": "1250000 SOL",
    "price": "$185.42",
    "dex": "Raydium"
  },
  "rugPullIndicators": {
    "flags": [],
    "score": 8,
    "level": "low"
  },
  "findings": []
}
```

### 1.15 Analyze Token

```
POST /analyze-token
```

**Headers:** None.

**Request Body:**

```json
{
  "address": "So11111111111111111111111111111111111111112"
}
```

**Response `200`:** Deep token analysis — extended version of `/scan-token` response with additional forensic data (historical holder churn, simulated sell pressure, deployer cluster analysis).

### 1.16 MCP Protocol

#### SSE Stream

```
GET /mcp
```

**Headers:** None.

**Response `200`:** Server-Sent Events stream.

```
event: endpoint
data: {"postUrl": "/mcp?sessionId=550e8400-e29b-41d4-a716-446655440000"}

event: message
data: {"jsonrpc":"2.0","id":1,"result":{...}}
```

#### JSON-RPC

```
POST /mcp?sessionId=550e8400-e29b-41d4-a716-446655440000
```

**Headers:**

| Header | Value |
|--------|-------|
| `content-type` | `application/json` |

**Request Body:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "scan",
  "params": {
    "command": "console.log('hello')"
  }
}
```

**Response:** Delivered over the SSE stream opened by the prior `GET /mcp` call.

---

## 2. Sentinel Shield (teos-sentinel-shield)

Web dashboard and REST API gateway. Mirrors MCP scan logic with 37 rules for shell, Solidity, and Solana scanning.

**Base URLs**

| Environment | URL |
|-------------|-----|
| Production | `https://sentinel.teosegypt.com` |
| Local | `http://localhost:3000` |

### 2.1 Root

```
GET /
```

**Headers:** None.

**Response `200`:** HTML landing page.

### 2.2 Liveness Probe

```
GET /live
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok"
}
```

### 2.3 Readiness Probe

```
GET /ready
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok",
  "ready": true
}
```

### 2.4 Health

```
GET /health
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok",
  "version": "4.1.0",
  "engine": "4.1",
  "rules": 37,
  "governance": true,
  "scanners": ["shell", "solidity", "solana"]
}
```

### 2.5 Version

```
GET /api/version
```

**Headers:** None.

**Response `200`:** Version info.

### 2.6 Detailed Health

```
GET /api/health
```

**Headers:** None.

**Response `200`:** Detailed health status.

### 2.7 Stats

```
GET /stats
```

**Headers:** None.

**Response `200`:** Scan statistics object.

### 2.8 Events

```
GET /events?limit=200
```

**Query Parameters:**

| Param | Type | Default | Max |
|-------|------|---------|-----|
| `limit` | integer | 200 | 500 |

**Headers:** None.

**Response `200`:** Array of recent scan events.

### 2.9 Ingest

```
POST /ingest
```

**Headers:** None.

**Request Body:**

```json
{
  "verdict": "ALLOW",
  "score": 0,
  "reasons": ["clean input"],
  "ruleIds": [],
  "riskLevel": "none",
  "command": "ls -la",
  "source": "manual"
}
```

**Response `200`:** Confirmation of ingestion.

### 2.10 Scan (Auth Required)

```
POST /scan
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `X-API-Key` | `<api_key>` | Yes |

**Request Body:**

```json
{
  "command": "rm -rf /etc",
  "type": "shell"
}
```

| Field | Type | Required |
|-------|------|----------|
| `command` | string | yes |
| `cmd` | string | yes (alias) |
| `type` | string | no |

**Response `200`:** Same finding/verdict structure as MCP `/scan`.

---

## 3. Activation Service (teos-activation-service)

Manages user tiers, credits, billing, and tester activation.

**Base URLs**

| Environment | URL |
|-------------|-----|
| Production | `https://sentinel.teosegypt.com` |
| Local | `http://localhost:8080` |

### 3.1 Root

```
GET /
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok",
  "service": "teos-activation-service",
  "alive": true,
  "uptime": 84321
}
```

### 3.2 Liveness Probe

```
GET /live
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok",
  "alive": true,
  "uptime": 84321,
  "bootTime": "2026-06-29T00:00:00.000Z"
}
```

### 3.3 Readiness Probe

```
GET /ready
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok",
  "ready": true,
  "checks": {
    "database": "ok",
    "secrets_configured": true
  }
}
```

### 3.4 Version

```
GET /version
```

**Headers:** None.

**Response `200`:** Version info.

### 3.5 Health

```
GET /health
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok",
  "version": "3.1.0",
  "uptime": 84321,
  "users": 42,
  "memory": { "rss": 49152000, "heapTotal": 37748736, "heapUsed": 25165824 }
}
```

### 3.6 Metrics

```
GET /metrics
```

**Headers:** None.

**Response `200`:** Prometheus-formatted metrics.

### 3.7 Register

```
POST /register
```

**Headers:** None.

**Rate Limit:** 5 requests per minute.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response `200`:**

```json
{
  "api_key": "teos_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p",
  "tier": "free",
  "credits_remaining": 5,
  "email": "user@example.com"
}
```

### 3.8 Get Credits

```
GET /credits/:userId
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `userId` | string | 5-20 digit Telegram ID |

**Response `200`:**

```json
{
  "userId": "123456789",
  "credits": 5
}
```

**Response `200` (unknown user):** Returns `0` credits.

### 3.9 Consume Credits

```
POST /consume
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Request Body:**

```json
{
  "userId": "123456789",
  "amount": 1
}
```

**Response `200`:**

```json
{
  "success": true,
  "credits": 4
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| `402` | `{"error":"no credits"}` |
| `403` | `{"error":"access expired"}` |
| `404` | `{"error":"user not found"}` |

### 3.10 Get Tier

```
GET /api/tier/:userId
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Response `200`:**

```json
{
  "tier": "free",
  "credits": 5
}
```

### 3.11 Status

```
GET /status/:userId
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Response `200`:**

```json
{
  "entitlement_state": "none",
  "billing_state": "none",
  "access_state": "restricted"
}
```

| Field | Possible Values |
|-------|----------------|
| `entitlement_state` | `none`, `beta_granted`, `premium_granted` |
| `billing_state` | `none`, `active`, `past_due`, `canceled`, `suspended` |
| `access_state` | `restricted`, `active`, `expired`, `suspended` |

### 3.12 Billing History

```
GET /api/billing/:userId
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Response `200`:** Array of last 50 billing transactions.

### 3.13 Usage History

```
GET /api/usage/:userId
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Response `200`:** Array of last 100 credit usage entries.

### 3.14 Refill Credits

```
POST /refill
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Request Body:**

```json
{
  "userId": "123456789",
  "amount": 50
}
```

**Response `200`:**

```json
{
  "success": true,
  "credits": 55
}
```

### 3.15 Audit Log

```
POST /audit
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Request Body:**

```json
{
  "userId": "123456789",
  "action": "scan",
  "target": "rm -rf /etc",
  "verdict": "BLOCK",
  "score": 92,
  "credits_used": 1,
  "credits_remaining": 4
}
```

**Response `200`:** Confirmation.

### 3.16 Query Audit Log

```
GET /audit/:userId?limit=50&offset=0
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| `limit` | integer | 50 |
| `offset` | integer | 0 |

**Response `200`:** Paginated array of audit entries.

### 3.17 Activate Tester

```
POST /activate-tester
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-service-token` | `<service_token>` | Yes |

**Rate Limit:** 5 requests per minute.

**Request Body:**

```json
{
  "telegram_id": "7815071893",
  "secret": "<activation_secret>"
}
```

**Response `200`:**

```json
{
  "success": true,
  "plan": "tester",
  "credits": 500,
  "expires": "2026-06-30T23:59:59.000Z"
}
```

### 3.18 Grant (Admin)

```
POST /grant
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-admin-secret` | `<admin_secret>` | Yes |

**Rate Limit:** 5 requests per minute.

**Request Body:**

```json
{
  "userId": "7815071893",
  "plan": "tester",
  "expires_in_hours": 720
}
```

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | 5-20 digit Telegram ID |
| `plan` | string | `free`, `pro`, `team`, `enterprise`, `founder`, `tester`, `beta_tester` |
| `expires_in_hours` | integer | Number of hours until expiry |

**Response `200`:**

```json
{
  "success": true,
  "plan": "tester",
  "credits": 500,
  "expires": "2026-07-29T12:00:00.000Z"
}
```

### 3.19 Purge Testers (Admin)

```
POST /purge-testers
```

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `x-admin-secret` | `<admin_secret>` | Yes |

**Rate Limit:** 2 requests per minute.

**Response `200`:**

```json
{
  "success": true,
  "deleted": 5
}
```

### 3.20 Dodo Webhook

```
POST /api/dodo-webhook
```

**Headers (webhook signature):**

| Header | Description |
|--------|-------------|
| `webhook-id` | Unique webhook event ID |
| `webhook-signature` | Base64-encoded HMAC-SHA256 |
| `webhook-timestamp` | Unix timestamp of the event |

**Request Body:** Raw JSON payload from Dodo Payments. Verified using `DODO_WEBHOOK_SECRET` via the Dodo Webhooks SDK.

**Response `200`:**

```json
{
  "success": true
}
```

---

## 4. Bot (teoslinker-bot)

Telegram bot with REST endpoints for health and API documentation.

**Base URLs**

| Environment | URL |
|-------------|-----|
| Production | `https://sentinel.teosegypt.com` |
| Local | `http://localhost:8082` |

### 4.1 Liveness Probe

```
GET /live
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok"
}
```

### 4.2 Readiness Probe

```
GET /ready
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok"
}
```

### 4.3 Health

```
GET /health
```

**Headers:** None.

**Response `200`:**

```json
{
  "status": "ok",
  "engine": "4.1",
  "version": "4.1.0",
  "bot": "online",
  "activation": "online",
  "mcp": "online"
}
```

### 4.4 API Docs

```
GET /api-docs.json
```

**Headers:** None.

**Response `200`:** OpenAPI 3.0 specification (JSON).

---

## 5. Authentication

### API Key (Shield)

```
X-API-Key: teos_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p
```

Configured via the `TEOS_API_KEYS` environment variable (comma-separated list).

### Service Token (Activation)

```
X-Service-Token: tok_abc123def456
```

Must match the `ACTIVATION_AUTH_TOKEN` environment variable on both the bot and activation service.

### Admin Secret (Activation)

```
X-Admin-Secret: sec_xyz789...
```

Must match the `ADMIN_SECRET` environment variable.

### Audit Key (MCP)

```
X-Api-Key: audit_key_value
Authorization: Bearer audit_key_value
```

Must match the `AUDIT_API_KEY` environment variable.

### Webhook Signature (Dodo)

| Header | Description |
|--------|-------------|
| `webhook-id` | Unique event identifier |
| `webhook-signature` | Base64 HMAC-SHA256 signature |
| `webhook-timestamp` | Unix timestamp |

Verified using the Dodo Webhooks SDK with `DODO_WEBHOOK_SECRET`.

---

## 6. Rate Limiting

| Service | Endpoint | Limit | Window |
|---------|----------|-------|--------|
| MCP | `/scan` | 100 | 15 minutes |
| Activation | `/register` | 5 | 1 minute |
| Activation | `/activate-tester` | 5 | 1 minute |
| Activation | `/grant` | 5 | 1 minute |
| Activation | `/purge-testers` | 2 | 1 minute |
| Shield (free) | All | 5 | 1 minute |
| Shield (pro) | All | 30 | 1 minute |
| Shield (team) | All | 150 | 1 minute |
| Shield (enterprise) | All | 600 | 1 minute |

All rate limits return `429 Too Many Requests` with body:

```json
{
  "error": "rate_limit_exceeded",
  "retry_after_seconds": 60
}
```

---

## 7. Credit Costs

| Action | Cost |
|--------|------|
| `/scan` | 1 |
| `/scan-solana` / `/solana` | 1 |
| `/evm` | 1 |
| `/deps` | 1 |
| `/ci` | 1 |
| `/github` | 15 |
| `/report` (code) | 2 |
| `/report` (repo) | 15 |
| `/solanatoken` | 5 |
| `/diligence` | 15 |
| `/fullreport` | 20 |
| `/chat` | 1-3 |
| `/claude` | 5 |

---

## 8. Common Errors

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | `invalid_input` | Missing or invalid request body |
| 400 | `missing_userId` | `userId` parameter required |
| 400 | `invalid_userId_format` | `userId` must be 5-20 digits |
| 401 | `unauthorized` | Missing or invalid auth token |
| 402 | `no_credits` | Insufficient credits |
| 403 | `access_expired` | Subscription has expired |
| 404 | `user_not_found` | User not registered |
| 413 | `payload_too_large` | Request body exceeds size limit |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_error` | Unexpected server error |

**Standard error body:**

```json
{
  "error": "<code>",
  "message": "Human-readable description."
}
```

---

> **Trust Through Verification.** — TEOS Sovereign Sentinel v4.1.0
