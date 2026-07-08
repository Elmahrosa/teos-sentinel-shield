# TEOS Sentinel — Threat Model

**Version:** 4.2.2
**Last Updated:** 2026-06-29
**Classification:** Internal — Enterprise Evaluation

---

## 1. Document Overview

### 1.1 Purpose
This threat model identifies and documents security threats to the TEOS Sovereign Security Stack. It follows the STRIDE methodology per OWASP ASVS V1 (Architecture) and aligns with NIST CSF ID.RA (Risk Assessment).

### 1.2 Scope
All 5 TEOS services deployed on Railway, their APIs, inter-service communication, data stores, and integrations (Telegram, GitHub, Dodo Payments).

### 1.3 Assumptions
- Railway provides physical security, network segregation, and availability SLA
- Secrets are stored in Railway environment variables (not in code)
- External dependencies (npm packages) are vetted via Dependabot
- TLS is provided by Railway's edge (external) and Docker network (internal)
- Database backups are the operator's responsibility

---

## 2. Architecture Overview

```
                    ┌──────────────┐
                    │   Telegram   │
                    │  (External)  │
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────┐
                    │ teoslinker-bot│
                    │   (8082)     │
                    └──────┬───────┘
                           │ HTTP (internal)
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐ ┌─────▼─────┐ ┌────▼──────────┐
     │agent-code- │ │teos-      │ │teos-activation│
     │risk-mcp   │ │sentinel-  │ │-service      │
     │(8090)     │ │shield    │ │(8080)        │
     └──────┬─────┘ │(3000)    │ └───────┬───────┘
            │       └──────────┘         │
            │                            │
     ┌──────▼─────┐              ┌───────▼───────┐
     │safe-       │              │   redis       │
     │ingestion   │              │   (6379)      │
     │(8000)      │              └───────────────┘
     └────────────┘
```

### Data Flow
1. User sends code/command via Telegram, CLI, API, or extension
2. Bot validates credits → forwards to Risk Engine (MCP)
3. MCP runs 258 governance controls + heuristic suspicion engine
4. Result returned with governance metadata, audit trail entry written
5. BLOCK/WARN/REVIEW/ALLOW verdict delivered to user
6. Audit log stored in activation service (SQLite/PostgreSQL)
7. PDF reports generated on-demand via Puppeteer (bot service)

### Trust Boundaries
- **Boundary A:** External → TEOS (HTTPS with TLS, API key / bot token auth)
- **Boundary B:** Inter-service (Docker internal network, HTTP, service token auth)
- **Boundary C:** Service → Database (SQLite/PostgreSQL, local or TLS)
- **Boundary D:** Service → Redis (Docker internal network, password auth)
- **Boundary E:** Service → External APIs (GitHub API, Dodo Payments, Solana/EVM RPC)

---

## 3. Assets

| Asset ID | Description | Classification | Owner |
|----------|-------------|----------------|-------|
| A-001 | Bot token (`BOT_TOKEN`) | Critical | teoslinker-bot |
| A-002 | Activation auth token (`ACTIVATION_AUTH_TOKEN`) | Critical | teos-activation-service |
| A-003 | Admin secret (`ADMIN_SECRET`) | Critical | teos-activation-service |
| A-004 | Dodo webhook secret (`DODO_WEBHOOK_SECRET`) | Critical | teos-activation-service |
| A-005 | GitHub PAT (`GITHUB_TOKEN`) | High | teoslinker-bot |
| A-006 | API keys (user `teos_*` keys) | High | teos-sentinel-shield |
| A-007 | Alpha/beta activation secrets | High | teos-activation-service |
| A-008 | User PII (email addresses) | Medium | teos-activation-service |
| A-009 | Scan results and findings | Medium | All services |
| A-010 | Audit logs | Medium | teos-activation-service |
| A-011 | Redis passwords / JWT secrets | Critical | All services |
| A-012 | Solana/EVM RPC keys | Low | agent-code-risk-mcp |
| A-013 | PDF reports | Low | teoslinker-bot |
| A-014 | AI API keys (Anthropic, Groq) | High | teoslinker-bot |
| A-015 | Dodo Payments API key | High | teos-activation-service |

---

## 4. Threat Actors

| Actor ID | Description | Motivation | Capability |
|----------|-------------|------------|------------|
| TA-01 | External attacker | Unauthorized access, data theft, service abuse | Low–High |
| TA-02 | Malicious insider (operator) | Data exfiltration, privilege abuse | High |
| TA-03 | Compromised dependency | Supply chain attack | Medium |
| TA-04 | Malicious user (scanner) | Abuse scan credits, bypass gates | Low |
| TA-05 | Dodo Payments attacker | Webhook forgery, free credits | Medium |
| TA-06 | GitHub API abuse | Exceed rate limits, data harvesting | Low |
| TA-07 | Telegram API abuse | Bot spam, command injection | Low |
| TA-08 | Network attacker (MITM) | Intercept inter-service traffic | Medium (external) / Low (internal) |

---

## 5. Threat Analysis (STRIDE)

### 5.1 Spoofing

| ID | Threat | Asset | Risk | Mitigation |
|----|--------|-------|------|------------|
| S-01 | Attacker forges Dodo webhook to grant free credits | A-004 | **High** | Webhook signature verification via `standardwebhooks` SDK; replay protection via event ID dedup |
| S-02 | Attacker forges inter-service requests | A-002 | **High** | `x-service-token` header with constant-time comparison (`crypto.timingSafeEqual`); all mutation endpoints gated |
| S-03 | Attacker forges admin requests | A-003 | **Critical** | `x-admin-secret` header with constant-time comparison; rate-limited (5/min grant, 2/min purge) |
| S-04 | Attacker spoofs API key | A-006 | **High** | API keys validated against env-configured list; no wildcard fallback |
| S-05 | Attacker registers with fake email | — | **Low** | Email format validated but no verification; free tier only (5 credits) — limited blast radius |

### 5.2 Tampering

| ID | Threat | Asset | Risk | Mitigation |
|----|--------|-------|------|------------|
| T-01 | Attacker modifies scan results in transit (inter-service) | A-009 | **Medium** | Internal Docker network (not routable from outside); no TLS needed within trust boundary |
| T-02 | Attacker modifies audit logs | A-010 | **Medium** | Audit logs append-only (INSERT only); no UPDATE/DELETE exposed; `safe-ingestion-engine` uses append-only NDJSON |
| T-03 | Attacker modifies user credit balance | A-002 | **Critical** | Only `/consume` and webhook handlers modify credits; both gated with service auth; founder bypass skips debit |
| T-04 | Attacker tampers with PDF report generation | A-013 | **Low** | All user fields HTML-escaped before rendering; Puppeteer runs in sandboxed container |
| T-05 | Attacker modifies governance metadata | — | **Low** | Governance map is server-side code; no user input reaches rule definitions |

### 5.3 Repudiation

| ID | Threat | Asset | Risk | Mitigation |
|----|--------|-------|------|------------|
| R-01 | User denies sending scan request | A-010 | **Low** | Every scan produces audit log entry with timestamp, user ID, action, verdict, score |
| R-02 | Admin denies granting credits | A-010 | **Medium** | `/grant` logged with admin IP, target user, plan, amount; audit queryable via `/audit/:userId` |
| R-03 | Operator denies system changes | — | **Medium** | Git history for code changes; Railway deploy logs; Docker container immutability |
| R-04 | Payment dispute (user claims not charged) | A-010 | **Low** | Billing transactions table records all payment events; webhook events deduplicated |

### 5.4 Information Disclosure

| ID | Threat | Asset | Risk | Mitigation |
|----|--------|-------|------|------------|
| I-01 | Secret leaked via log output | A-001–A-007 | **Critical** | Pino logger with redact config covering all secret patterns (`BOT_TOKEN`, `ACTIVATION_AUTH_TOKEN`, `GITHUB_TOKEN`, `DODO_WEBHOOK_SECRET`, etc.) |
| I-02 | API key leaked via query parameter | A-006 | **High** | Query parameter `apiKey` fallback removed; header-only auth |
| I-03 | CORS misconfiguration exposes API | — | **Medium** | CORS default rejects wildcard; explicit origin validation |
| I-04 | Error message leaks internal details | — | **Low** | Generic error messages; stack traces logged server-side only (Pino) |
| I-05 | Scan results visible to unauthorized users | A-009 | **Medium** | `/audit` endpoint requires `AUDIT_API_KEY`; bot responses are per-user in Telegram |
| I-06 | PII leaked in scan findings | A-008 | **Medium** | `PII_SALT` configured for hashing; R31 (CROSS_IDENTITY_SILENT_TRUST) detects PII in code |

### 5.5 Denial of Service

| ID | Threat | Asset | Risk | Mitigation |
|----|--------|-------|------|------------|
| D-01 | Rate limit exhaustion | — | **Medium** | Tiered rate limiting: free=5rpm, starter=30, team=150, enterprise=600, sovereign=unlimited |
| D-02 | Concurrent scan flood | — | **Medium** | 20 concurrent scans tested no errors; `express-rate-limit` at global level (100/15min for MCP) |
| D-03 | ReDoS via crafted input | — | **Medium** | 22+ regex patterns identifyable; all patterns use single-line `[^\n]*?` instead of `[\s\S]*?`; 20KB input limit enforced |
| D-04 | Large repository scan memory exhaustion | — | **Low** | 50KB OpenSSL C file handled in <200ms; file-level scanning (not whole-repo in memory) |
| D-05 | Redis connection exhaustion | — | **Medium** | Stale `REDIS_URL` with auth removed to prevent infinite connect/reject cycles; connection pool configured |
| D-06 | Unbounded Set growth (unique IPs) | — | **Low** | `uniqueIps` Set pruned at 10K entries |

### 5.6 Elevation of Privilege

| ID | Threat | Asset | Risk | Mitigation |
|----|--------|-------|------|------------|
| E-01 | Free user bypasses credit gate | A-002 | **Critical** | `/consume` returns 404 for unknown users; `getCredits` returns 0 on error; `tier==="free" && credits===0` blocks all scan commands |
| E-02 | Tester account persists past expiry | — | **High** | `subscription_expires` checked in `/consume`; expired returns 403; tester accounts expired June 30, 2026 |
| E-03 | Container escape via Puppeteer | — | **Medium** | `--no-sandbox` mitigated by container isolation; container runs as non-root user (UID 1000) |
| E-04 | Admin path bypass in GitHub scanning | — | **Low** | `scripts/`, `deploy/` directories scanned (no bypass); all files scanned regardless of path |
| E-05 | Redis zero-config access | — | **Medium** | Redis bound to Docker network only; password required; port not exposed to host (`127.0.0.1:6379` removed in Session 8) |

---

## 6. Attack Surface

| Component | Exposed Ports | Attack Surface |
|-----------|---------------|----------------|
| teoslinker-bot | 8082 (internal) | `/health`, `/live`, `/ready`, `/api-docs.json` — no mutation endpoints |
| agent-code-risk-mcp | 8090 (internal) | `/scan`, `/analyze`, `/scan-dependencies`, `/scan-token`, `/analyze-token` — payment-gated |
| teos-activation-service | 8080 (internal) | `/register`, `/activate-tester`, `/grant`, `/consume`, `/credits/:userId` — mutation endpoints gated |
| teos-sentinel-shield | 3000 (internal) | `/scan`, `/ingest`, `/events` — API key gated |
| safe-ingestion-engine | 8000 (internal) | Append-only ingestion endpoints |
| redis | 6379 (internal only) | Password-protected, internal network only |
| Railway edge | 443 (external) | TLS termination; forwards to internal services |

### Not Exposed (by design)
- No service is directly internet-facing except through Railway edge
- All ports bound to `127.0.0.1` in Docker Compose
- No SSH access to containers
- No debug endpoints in production

---

## 7. Known Risks (Deferred)

These risks are accepted for alpha/beta and documented for enterprise evaluation:

| Risk ID | Description | Severity | Rationale | Planned Fix |
|---------|-------------|----------|-----------|-------------|
| K-01 | Unicode homoglyph bypass (Cyrillic `е`, fullwidth, RTL override) | Critical | NFKC normalization not applied before regex matching | Add NFKC normalization preprocessor in Phase D |
| K-02 | Static pages (root, replay.html) lack HSTS/CSP/X-Frame headers | Medium | Static file serving doesn't apply Helmet | Apply security headers to static routes |
| K-03 | No on-chain payment verification | Medium | Stub implementation; returns success without verification | Phase 3 |
| K-04 | No database encryption at rest | Medium | Railway-managed; operator responsibility for encrypted volumes | Document in deployment checklist |
| K-05 | No rate limiting on `/scan` success path (only network level) | Low | x402PaymentGate handles credit gating; 100/15min network limit active | Production hardening |
| K-06 | Audit logs not cryptographically chained | Low | Append-only SQL ensures immutability; no cryptographic chain yet | Phase 3 (safe-ingestion-engine) |

---

## 8. Mitigation Summary

| Category | Total Threats | Mitigated | Accepted | Mitigation Rate |
|----------|---------------|-----------|----------|-----------------|
| Spoofing | 5 | 5 | 0 | 100% |
| Tampering | 5 | 5 | 0 | 100% |
| Repudiation | 4 | 4 | 0 | 100% |
| Information Disclosure | 6 | 5 | 1 | 83% |
| Denial of Service | 6 | 5 | 1 | 83% |
| Elevation of Privilege | 5 | 5 | 0 | 100% |
| **Total** | **31** | **29** | **2** | **94%** |

---

## 9. Residual Risk Assessment

| Threat | Likelihood | Impact | Risk Level | Monitoring |
|--------|------------|--------|------------|------------|
| Unicode homoglyph bypass | Medium | High | **High** | Pending NFKC normalization implementation |
| Container escape via npm dependency | Low | Critical | **Medium** | Dependabot weekly scan; `CAP_DROP: ALL` |
| Webhook secret brute force | Low | Critical | **Medium** | Rate limiting; constant-time comparison; 32 hex entropy |
| Credit exhaustion attack | Medium | Medium | **Medium** | Daily reset; max per-consume capped by credit balance |
| Database corruption | Low | High | **Medium** | Append-only audit; separate ingestion engine for immutable store |

---

## 10. Security Controls Map

| Control | Category | Coverage | Verification |
|---------|----------|----------|-------------|
| Docker `CAP_DROP: ALL` + `no-new-privileges` | Infrastructure | All containers | docker-compose.yml |
| Non-root container user (UID 1000) | Infrastructure | All containers | Dockerfile USER directive |
| `read_only: true` filesystem | Infrastructure | All containers | docker-compose.yml |
| TLS termination | Network | External traffic | Railway edge config |
| API key auth | Access Control | Shield endpoints | Middleware |
| Service token auth | Access Control | Activation endpoints | Middleware |
| Constant-time secret comparison | Access Control | Activation endpoints | `crypto.timingSafeEqual` |
| Rate limiting | DoS Protection | All services | `express-rate-limit` |
| Pino log redaction | Data Protection | All services | Logger config |
| Helmets security headers | Application | All services | `helmet` middleware |
| CORS validation | Application | All services | `cors` middleware |
| Input size limits | Application | Activation service | `express.json({limit: '10kb'})` |
| SQL parameterization | Database | All DB queries | Prepared statements |
| Audit logging | Monitoring | Activation service | Audit log table |
| Prometheus metrics | Monitoring | MCP + Activation | `/metrics` endpoint |
| Health endpoints | Monitoring | All services | `/health`, `/live`, `/ready` |
| Dependabot | Supply Chain | All npm packages | `.github/dependabot.yml` |
| Docker healthchecks | Orchestration | All containers | HEALTHCHECK directives |
| NDJSON append-only audit | Data Integrity | safe-ingestion-engine | Append-only file writes |

---

## 11. Review Cycle

| Review Type | Frequency | Owner |
|-------------|-----------|-------|
| Dependency audit | Weekly | Dependabot + CI |
| Secret rotation | Per CLAUDE.md schedule | `scripts/secret-rotate.sh` |
| Threat model review | Quarterly | Security team |
| Penetration test | Pre-GA + annually | External firm |
| Red team exercise | Pre-release | Internal security |
| Bug bounty | Continuous | Tester program |
