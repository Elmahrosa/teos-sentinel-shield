# TEOS Sovereign Sentinel

## Deterministic Execution Governance for Autonomous AI Systems

**Tagline:** Law Over Code  
**Version:** v3.0.0  
**Classification:** Public  
**Author:** Elmahrosa International

---

## 1. Executive Summary

TEOS Sovereign Sentinel is an execution governance layer designed to sit between AI systems and their operational targets. It provides deterministic pre-execution scanning, policy enforcement, and tamper-evident audit capabilities. The platform addresses a structural gap in current AI deployment patterns: the absence of enforceable governance between AI generation and real-world execution.

As organizations deploy AI agents with increasing autonomy—writing code, executing commands, making API calls, modifying infrastructure—the need for a governance layer that enforces policy at execution time becomes relevant across regulated industries. TEOS applies a rule-based evaluation engine, a fail-closed security model, and an append-only audit chain to this problem space.

The platform is modular by design, deployable as SaaS (Railway), on-premise (Docker), or air-gapped (offline). It integrates with Claude Code, CI/CD pipelines, Telegram, and REST APIs.

---

## 2. Problem Statement

### AI Execution Without Governance

Modern AI systems can generate sequences of actions—shell commands, code changes, database queries, API calls—but the infrastructure that executes these actions typically lacks a governance layer that enforces policy at the point of execution. The gap between "generation" and "execution" is where risk accumulates.

Common failure modes include:

- **Prompt injection** — An attacker manipulates an AI agent into executing unsafe operations
- **Supply chain compromise** — AI-generated code introduces malicious packages or patterns
- **Privilege escalation** — An agent with excessive permissions executes destructive commands
- **Data exfiltration** — AI agents access or transmit data outside authorized channels
- **Configuration drift** — AI agents modify infrastructure without governance approval

Existing approaches—post-hoc auditing, monitoring, manual review—detect these events but do not prevent them.

---

## 3. Current AI Security Challenges

### 3.1 Lack of Deterministic Controls

Current AI security infrastructure is predominantly reactive. Monitoring tools, log analysis, and anomaly detection can identify that an incident occurred, but they operate after the fact. Deterministic pre-execution controls—where a policy engine evaluates each action before it executes—remain uncommon in AI deployments.

### 3.2 The Black Box Problem

ML-based security classifiers introduce uncertainty. A model that scores risk probabilistically cannot guarantee that a given action is safe. In regulated environments, probabilistic security is insufficient. Deterministic evaluation provides auditable, reproducible results that can be verified independently.

### 3.3 Audit Integrity

Standard database-backed audit trails can be modified after the fact. Without cryptographic integrity guarantees, audit logs are insufficient for compliance, forensic investigation, or legal proceedings. Append-only storage with hash chaining addresses this limitation.

### 3.4 Deployment Fragmentation

Organizations deploying AI agents typically manage multiple integrations—CI/CD pipelines, chat interfaces, API gateways—each with different security postures. A unified governance layer that enforces consistent policy across all entry points reduces the risk of policy gaps.

---

## 4. The Execution Governance Gap

The execution governance gap describes the absence of policy enforcement at the point where AI-generated actions translate into real-world effects.

```
AI SYSTEM ──generates──▶ ACTION ──???──▶ EXECUTION
                               ▲
                               │
                    NO GOVERNANCE LAYER
                    (current state)

AI SYSTEM ──generates──▶ POLICY CHECK ──▶ EXECUTION
                               │
                    GOVERNANCE LAYER
                    (TEOS approach)
```

Bridging this gap requires:

1. **Deterministic evaluation** — Every action is scored against a known rule set
2. **Fail-closed behavior** — Errors result in denial, not permission
3. **Tamper-evident audit** — Every decision is recorded immutably
4. **Policy consistency** — Same rules apply regardless of entry point

---

## 5. Deterministic Rule Evaluation

### 5.1 Engine Architecture

The TEOS risk engine evaluates input against 103 rules (64 core + 29 Solana + 10 EVM) organized by priority. Rules are pattern-matching checks that operate on the input string, its context, and metadata.

| Component | Description |
|-----------|-------------|
| Rule definitions | 28 patterns with configurable severity |
| Priority ordering | Rules evaluated in priority sequence |
| Pattern matching | Regex and string-based pattern detection |
| Context analysis | Input source, session history, rate context |
| Decision aggregation | Single verdict from all evaluated rules |

### 5.2 Rule Categories

| Category | Examples | Count |
|----------|----------|-------|
| Destructive operations | `rm -rf /`, disk wipe, fork bomb | 6 |
| Secret exfiltration | Key export, token theft, credential access | 5 |
| Supply chain risk | Pipe-to-shell, curl-bash patterns | 4 |
| Code injection | Base64 execution, eval injection | 4 |
| Permission escalation | sudo abuse, chmod 777 | 3 |
| Network abuse | Crypto mining, botnet C2 | 3 |
| System modification | mkfs, dd, fdisk | 3 |

### 5.3 Verdict Model

| Verdict | Meaning | Action |
|---------|---------|--------|
| ALLOW | No rules triggered | Execute normally |
| WARN | Low-to-medium risk detected | Flag for human review |
| BLOCK | High risk detected | Execution prevented |

### 5.4 Fail-Closed

The engine defaults to BLOCK on any error condition: unreachable service, evaluation failure, malformed input, or timeout. This follows the principle that denial is safer than permission when certainty is unavailable.

### 5.5 Test Coverage

596 tests validate the rule engine across:
- Known safe inputs (ALLOW)
- Known risky inputs (WARN)
- Known malicious inputs (BLOCK)
- Edge cases (empty input, Unicode, extremely long input)

---

## 6. TEOS Sentinel Architecture

### 6.1 Overview

```
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│  INPUT SOURCES   │  │  GATEWAY     │  │  RULE ENGINE │
│                  │  │  LAYER       │  │  v3.0.0      │
│  ┌────────────┐  │  │              │  │              │
│  │ Telegram   │──┼──▶│  Auth       │──▶│  103 rules   │
│  └────────────┘  │  │  Rate limit │  │  Priority    │
│  ┌────────────┐  │  │  Validation │  │  ordering    │
│  │ REST API   │──┼──▶│  Sanitize   │  │  Pattern     │
│  └────────────┘  │  └──────────────┘  │  matching    │
│  ┌────────────┐  │                    └──────┬───────┘
│  │ CI/CD      │──┼▶                          │
│  └────────────┘  │                    ┌──────▼───────┐
│  ┌────────────┐  │                    │  DECISION    │
│  │ Claude     │──┼▶                   │  ENGINE      │
│  └────────────┘  │                    │  ALLOW/WARN/ │
└──────────────────┘                    │  BLOCK       │
                                        └──────┬───────┘
                                               │
                    ┌──────────────────────────┼──────────┐
                    ▼                          ▼          ▼
            ┌──────────────┐         ┌──────────────────┐
            │  EXECUTION   │         │  AUDIT STORE     │
            │  (if ALLOW)  │         │  SHA3-256 chain  │
            └──────────────┘         │  Append-only     │
                                     │  HMAC signed     │
                                     └──────────────────┘
```

### 6.2 Components

#### Gateway Layer (teoslinker-bot)

The gateway is the entry point for all execution requests. It handles authentication, rate limiting, input validation, and request routing. Currently implemented as a Telegram bot (`@teoslinker_bot`), a REST API, a Claude Code hook, and CI/CD integration.

| Function | Implementation |
|----------|---------------|
| Authentication | `x-service-token`, `x-api-key`, bot token |
| Rate limiting | Token bucket, 60/min per session |
| Input validation | Size limits, JSON validation, sanitization |
| Request routing | Forwards to risk engine for evaluation |

#### Rule Engine (agent-code-risk-mcp)

The core evaluation engine implements 103 detection rules (64 core + 29 Solana + 10 EVM). It receives input, evaluates against all applicable rules, and returns an ALLOW/WARN/BLOCK verdict with supporting reasons.

| Attribute | Value |
|-----------|-------|
| Runtime | Node.js |
| Version | v3.0.0 |
| Rules | 103 (64 core + 29 Solana + 10 EVM) |
| Tests | 596 |
| Architecture | MCP server |
| Deployment | Railway / Docker |

#### Audit Store (safe-ingestion-engine)

The audit store provides append-only NDJSON logging with SHA3-256 hash chaining and HMAC signing. It is designed for compliance and forensic use cases.

| Attribute | Value |
|-----------|-------|
| Storage format | NDJSON (append-only) |
| Hash algorithm | SHA3-256 |
| Signing | HMAC-SHA256 |
| Encryption (optional) | AES-256-GCM |
| Query endpoint | `/audit` |

#### Activation & Billing (teos-activation-service)

Manages entitlements, credits, and payment processing via Dodo Payments webhooks.

| Attribute | Value |
|-----------|-------|
| Entitlements | Credits per tier |
| Tiers | ALPHA, PRO, TEAM, ENTERPRISE, FOUNDER |
| Payment | Dodo Payments webhooks |
| Auth | `x-service-token` |

#### Sentinel Dashboard (teos-sentinel-shield)

Web-based UI providing policy visibility and audit access. Served via Nginx in the Docker deployment.

| Attribute | Value |
|-----------|-------|
| Framework | Static HTML/JS |
| Deployment | Nginx (Docker) / Railway |
| Role | Visibility, audit access |

---

## 7. Security Model

### 7.1 Defense in Depth

| Layer | Controls |
|-------|----------|
| Network | TLS 1.3, internal Docker network, Cloudflare WAF |
| Application | Input validation, rate limiting, request size limits |
| Authentication | Service tokens, API keys, HMAC verification |
| Execution | Pre-scanning, fail-closed, circuit breaker |
| Audit | SHA3-256 chain, HMAC signed, append-only |

### 7.2 Least Privilege

- Services run as non-root user in containers
- Each service has its own set of credentials
- Internal services bind to 127.0.0.1 only
- No container runs with `privileged: true`

### 7.3 Fail-Closed Defaults

| Component | Failure Mode | Default |
|-----------|-------------|---------|
| Rule engine | Unreachable | BLOCK |
| Credit service | Unreachable | 0 credits (free tier, blocked) |
| Rule evaluation | Error | BLOCK |
| Rate limit | Exceeded | 429 (blocked) |
| Auth token | Missing | 401 (blocked) |

### 7.4 Secure by Default

- No hardcoded credentials in source
- Pino log redaction configured for all sensitive fields
- CORS rejects unconfigured origins
- Redis on internal network only
- Docker healthchecks on all services

---

## 8. Governance Framework

### 8.1 Policy-Driven Execution

All execution requests pass through the same policy engine regardless of entry point. Policy is defined by the 28-rule set, with consistent evaluation rules across Telegram, API, CI/CD, and Claude Code integrations.

### 8.2 Verdict Classification

| Verdict | Threshold | Human Review | Logged |
|---------|-----------|--------------|--------|
| ALLOW | Risk score 0 | No | Yes |
| WARN | Risk score 1–79 | Required | Yes |
| BLOCK | Risk score 80–100 | N/A (prevented) | Yes |

### 8.3 Human-in-the-Loop

WARN verdicts require human approval before execution proceeds. This ensures that ambiguous or moderately risky actions receive human oversight. The BLOCK verdict prevents execution entirely—no override is available at the automated level.

### 8.4 Policy Consistency

By routing all execution through a single rule engine, TEOS ensures consistent policy enforcement. A command that would be BLOCKed via the Telegram bot is also BLOCKed via CI/CD or Claude Code. This eliminates the policy drift that occurs when different entry points have different security postures.

---

## 9. Audit Integrity

### 9.1 Append-Only NDJSON

Audit entries are written in NDJSON format (newline-delimited JSON) with append-only semantics. No existing entry can be modified or deleted. Each entry is appended to the end of the file.

### 9.2 SHA3-256 Hash Chain

Each audit entry contains the SHA3-256 hash of the previous entry, forming a chain:

```
Entry[N-1].hash = SHA3-256(Entry[N-1])
Entry[N].prevHash = Entry[N-1].hash
Entry[N].hash = SHA3-256(Entry[N])
```

Any modification to an entry breaks the chain for all subsequent entries, providing tamper evidence.

### 9.3 HMAC Signing

Each entry is signed with HMAC-SHA256 using a shared secret. This provides:
- Authentication of the entry origin
- Integrity verification (any modification changes the HMAC)
- Non-repudiation (the signer cannot deny having produced the entry)

### 9.4 Optional Encryption

Audit entries can be encrypted with AES-256-GCM using a customer-provided key (`SENTINEL_AUDIT_KEY`). This provides confidentiality for audit data in compliance-sensitive deployments.

### 9.5 Verification

```bash
# Audit chain verification procedure
# (requires HMAC key matching signing key)

# Output: OK if chain intact
#         FAIL with index of first corrupted entry
```

---

## 10. Deployment Models

### 10.1 Railway SaaS

| Attribute | Detail |
|-----------|--------|
| Management | Railway-managed infrastructure |
| Entry point | `https://sentinel.teosegypt.com` |
| Uptime | Railway SLA |
| Data residency | US/EU (Railway regions) |
| Best for | Teams wanting zero-ops deployment |

### 10.2 Docker On-Premise

| Attribute | Detail |
|-----------|--------|
| Management | Customer-managed Docker host |
| Deploy | `docker compose up -d` |
| Services | 5 Docker containers |
| Ports | All bound to 127.0.0.1 |
| Best for | Regulated industries with data sovereignty requirements |

### 10.3 Air-Gapped

| Attribute | Detail |
|-----------|--------|
| Internet | None — fully isolated |
| Install | Pre-bundled Docker images via physical transfer |
| Updates | Manual image bundle distribution |
| Telemetry | None |
| Best for | Defense, classified infrastructure |

---

## 11. Future Roadmap

### Short-Term (Q3 2026)

| Feature | Status |
|---------|--------|
| Python SDK (`pip install teos-sentinel`) | 🟡 IN DEVELOPMENT |
| Public API documentation portal | 🟡 PLANNED |
| Custom rule configuration UI | 🟡 PLANNED |
| Audit log export (CSV/JSON) | 🟡 PLANNED |

### Medium-Term (Q4 2026 – Q1 2027)

| Feature | Status |
|---------|--------|
| Federated governance (multi-org policy) | 🔵 RESEARCH |
| SOC 2 Type I certification | 🟡 PLANNED |
| EU AI Act compliance tooling | 🟡 PLANNED |
| Go SDK | 🟡 PLANNED |
| SIEM integration (Splunk, ELK) | 🟡 PLANNED |
| On-chain verification (Merkle root on blockchain) | 🔵 RESEARCH |

### Long-Term (2027+)

| Feature | Status |
|---------|--------|
| ISO 27001 certification | 🟡 PLANNED |
| Federated audit (multi-party verification) | 🔵 RESEARCH |
| Real-time policy propagation | 🔵 RESEARCH |
| AI-assisted rule suggestion (opt-in, auditable) | 🔵 RESEARCH |

---

## 12. Appendices

### Appendix A: Rule Reference

| ID | Name | Category | Severity | Description |
|----|------|----------|----------|-------------|
| R01 | DESTRUCTIVE_RM | Destructive | HIGH | Recursive forced delete (`rm -rf /`) |
| R02 | DESTRUCTIVE_DD | Destructive | HIGH | Block device overwrite |
| R03 | DESTRUCTIVE_MKFS | Destructive | HIGH | Filesystem format |
| R04 | DESTRUCTIVE_FORK_BOMB | Destructive | HIGH | Fork bomb pattern |
| R05 | DESTRUCTIVE_REBOOT | Destructive | MEDIUM | System reboot/shutdown |
| R06 | DESTRUCTIVE_DISK_WIPE | Destructive | HIGH | Disk wipe patterns |
| R07 | HARDCODED_SECRET | Exfiltration | HIGH | Secret in code |
| R08 | KEY_EXFIL | Exfiltration | HIGH | Key exfiltration |
| R09 | CREDENTIAL_ACCESS | Exfiltration | HIGH | Credential theft |
| R10 | TOKEN_THEFT | Exfiltration | HIGH | Token theft |
| R11 | ENV_LEAK | Exfiltration | MEDIUM | Environment variable leak |
| R12 | CURL_BASH | Supply Chain | MEDIUM | Pipe curl to shell |
| R13 | UNTRUSTED_SOURCE | Supply Chain | MEDIUM | Download from untrusted source |
| R14 | PACKAGE_MANAGER_ABUSE | Supply Chain | MEDIUM | Package manager abuse |
| R15 | REMOTE_EXECUTION | Supply Chain | HIGH | Remote code execution |
| R16 | BASE64_EXEC | Injection | HIGH | Base64-encoded execution |
| R17 | EVAL_INJECTION | Injection | HIGH | eval() with user input |
| R18 | SQL_INJECTION | Injection | HIGH | SQL injection |
| R19 | CODE_INJECTION | Injection | HIGH | General code injection |
| R20 | SUDO_ABUSE | Escalation | MEDIUM | Unauthorized sudo |
| R21 | CHMOD_777 | Escalation | MEDIUM | Permission escalation |
| R22 | PRIVILEGE_ESCALATION | Escalation | HIGH | General escalation |
| R23 | CRYPTO_MINING | Network | MEDIUM | Cryptocurrency mining |
| R24 | BOTNET_C2 | Network | HIGH | Botnet command/control |
| R25 | DATA_EXFIL | Network | HIGH | Network data exfiltration |
| R26 | BASE64_EXEC | Injection | HIGH | Base64 execution (variant) |
| R27 | XXE_INJECTION | Injection | HIGH | XML external entity |
| R28 | DNS_TUNNEL | Network | MEDIUM | DNS tunneling |

### Appendix B: Glossary

| Term | Definition |
|------|-----------|
| ALLOW | Verdict indicating safe input, execution permitted |
| WARN | Verdict indicating moderate risk, human review required |
| BLOCK | Verdict indicating high risk, execution prevented |
| Deterministic | Output fully determined by input and rules |
| Fail-closed | Security posture that denies on error |
| NDJSON | Newline-delimited JSON format |
| SHA3-256 | SHA-3 family hash algorithm, 256-bit output |
| HMAC | Hash-based message authentication code |
| MCP | Model Context Protocol |
| Circuit breaker | Pattern that stops requests after repeated failures |
| Token bucket | Rate limiting algorithm |
| Air-gapped | System with no network connectivity |

### Appendix C: References

| Reference | URL |
|-----------|-----|
| TEOS Repository | `github.com/Elmahrosa/teos-sovereign-security-stack` |
| Telegram Bot | `t.me/teoslinker_bot` |
| Risk Engine Health | `sentinel.teosegypt.com/health` |
| ICBC Constitution | `github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution` |
| NIST SP 800-53 | `csrc.nist.gov/publications/detail/sp/800-53/rev-5/final` |
| EU AI Act | `artificialintelligenceact.eu` |

---

*TEOS Sovereign Sentinel — Law Over Code*  
*Engine v4.0.0 · 111 rules (64 core + 29 Solana + 10 EVM + 8 banking) · 596 tests*  
*© Elmahrosa International*
