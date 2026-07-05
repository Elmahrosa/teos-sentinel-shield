# System Architecture: Deployment Segregation

To maintain strict operational sovereignty, lower attack surfaces, and optimize response times, the TEOS Sovereign Security Stack utilizes a hybrid-host topology.

---

## 1. Edge Presentation Layer (Hostinger)

| Attribute | Value |
|-----------|-------|
| **Domain** | `sentinel.teosegypt.com` |
| **Role** | Public marketing, bilingual documentation (EN/AR), and beta onboarding portal |
| **Security Profile** | Static assets only. No access to the core execution pipeline or PII scrubbing engines. Completely decoupled from the internal runtime environment. |

## 2. Operational Core & Guardrail Pipeline (Railway Container Mesh)

The operational core consists of six green services running in an isolated Railway project, coordinating via Railway's internal private networking mesh (service-to-service communication over the project's internal overlay — no public routing between services).

| Service | Role |
|---------|------|
| **teos-sentinel-shield** | Central API backend, telemetry ingestion gateway, and secure Command Center Dashboard. Processes incoming requests from consumers (`dashboard.html`, Desktop clients, and the `teos.js` CLI). |
| **teoslinker-bot** | Telegram interface and workflow orchestration. Handles user authentication, deep-linking, and quick-action triggers. |
| **agent-code-risk-mcp** | Model Context Protocol (MCP) compliant execution guardrail. Implements the 103 security rules and issues the 4 critical verdicts: **BLOCK**, **WARN**, **REVIEW**, **ALLOW**. |
| **activation-service** | Lifecycle, credit ledger management, and licensing verification (enforcing the June 30 hard freeze). |
| **Redis (×2)** | Dual-instance in-memory caching and message brokerage. Segregates real-time rate limiting and state tracking from asynchronous risk evaluation queues. |

### Active Deployments (Railway — production)

| Service | Status | URL | Region |
|---------|--------|-----|--------|
| teoslinker-bot | ● Online | `https://sentinel.teosegypt.com` | US West |
| agent-code-risk-mcp | ● Online | `https://sentinel.teosegypt.com` | EU West |
| activation-service | ● Online | `https://sentinel.teosegypt.com` | EU West |
| teos-sentinel-shield | ● Online | `https://sentinel.teosegypt.com` | EU West |
| Redis | ● Online | (internal — no public URL) | EU West |
| Redis-RwCF | ● Online | (internal — no public URL) | EU West |

---

## Data Flow Overview

```
[Public Consumer / CLI / Desktop]
              │
              ▼ (Authenticated API Requests)
   [teos-sentinel-shield (API Gateway)]
              │
              ├─── (Async Queue) ───► [Redis Broker] ◄───► [agent-code-risk-mcp (MCP Engine)]
              │
              └─── (State/Licensing) ───► [activation-service] ◄───► [teoslinker-bot]
```

### Detailed Linkages

| Linkage | Direction | Protocol | Purpose |
|---------|-----------|----------|---------|
| Dual scan | Bot → Shield | HTTP POST `/scan` | Second-opinion scan on every input |
| Ingest | Bot → Shield | HTTP POST `/ingest` | Fire-and-forget scan results to SOC dashboard |
| Shared Redis | Bot ↔ Shield | Redis `teos:sentinel:events` | Shared event store for live telemetry |
| WebSocket | Shield → Dashboard | WS | Live broadcast to dashboard clients |
| Health check | Bot → Risk Engine | HTTP GET `/health` | Dependency monitoring |
| Credits | Bot → Activation | HTTP | Credit consumption and tier verification |

---

## Segregation Benefits

| Concern | Edge (Hostinger) | Core (Railway) |
|---------|------------------|----------------|
| Attack surface | Static HTML/CSS/JS only | Authenticated API endpoints |
| Data exposure | Zero PII, zero secrets | Encrypted traffic, redacted logs |
| Blast radius | Compromise = defaced landing page | Compromise = no lateral movement to edge |
| Deployment cadence | Manual upload to Hostinger | Railway auto-deploy on `git push` |
| Cost | Shared hosting ~$3/mo | 4 containers + 2 Redis ~$13/mo |

---

## 4 Critical Verdicts

The risk engine issues exactly four verdicts, forming a traffic-light enforcement system with a human-in-the-loop tier:

| Verdict | Signal | Action | Enterprise Impact |
|---------|--------|--------|-------------------|
| **BLOCK** | 🔴 Red | Instant denial — no execution | Prevents unacceptable-risk actions |
| **WARN** | 🟡 Yellow | Execute with logged warning | Transparency for limited-risk actions |
| **REVIEW** | 🟠 Orange | Hold for human approval | Mandatory for high-risk (EU AI Act High tier) |
| **ALLOW** | 🟢 Green | Execute immediately | Zero-friction for safe operations |

---

## Railway Project Reference

| Property | Value |
|----------|-------|
| Project Name | The Teos Bot🛡 |
| Project ID | `0b0b2a98-5400-4d70-bba6-74f693592479` |
| Environment | `production` |
| Deployment | All services via `git push` → GitHub Actions → `railway up --ci` |
