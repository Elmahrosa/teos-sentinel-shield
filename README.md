 # TEOS Sentinel Shield

**v5.0.0 GA — Execution Control Infrastructure for Autonomous Systems**

Deterministic AI runtime security middleware that sits between AI-generated actions and execution — providing inspection, risk scoring, policy enforcement, blocking, auditability, and compliance visibility before commands, code, scripts, and agent actions are executed.

**Production API:** `https://teos-sentinel-shield-production-7f0d.up.railway.app`

**Engine:** `v5.0.0`
**Rules:** `258`
**Persistence:** Redis
**Rate limiting:** Redis-backed tiered rate limiting
**Authentication:** `x-api-key`

---

## Version Architecture

- **Core engine:** v5.0.0 GA (258 rules, hosted scan API)
- **GitHub Action:** v5.1.0 (zero-dependency node24 wrapper)

## What This Is

TEOS Sentinel Shield is execution-control infrastructure for autonomous AI systems.

It is designed to inspect an action **before execution** and produce a deterministic security decision.

* **Infrastructure middleware** — not merely a dashboard or landing page
* **Deterministic rule engine** — reproducible policy decisions
* **Runtime enforcement layer** — pre-execution security control for AI agents and automated systems
* **Audit-first architecture** — security decisions are recorded for inspection and compliance
* **Multi-engine security analysis** — multiple specialized detection engines operate within the v5 security pipeline
* **API-first** — designed to integrate with autonomous agents, CI/CD systems, MCP workflows, and other execution environments

### Core flow

```text
INPUT
  ↓
Security Analysis
  ↓
258 Deterministic Rules
  ↓
Risk / Policy Evaluation
  ↓
ALLOW / WARN / REVIEW / BLOCK
  ↓
Audit + Persistence
```

---

# Production Status

The verified production release baseline is:

```text
Version:       v5.0.0
Engine:        v5.0.0
Rules:         258
Environment:   production
Store:         Redis
Authentication: x-api-key
Rate limiting: Redis-backed tiered
Audit store:   Redis fallback
PostgreSQL:    Not configured
Release:       976235e28562610f917d8eb51d56ab054b838795
```

Production health reports the engine as online and identifies the deployed release with commit:

```text
976235e28562610f917d8eb51d56ab054b838795
```

---

# Who It's For

TEOS Sentinel Shield is designed for systems that allow AI or automation to generate actions that may affect real infrastructure.

Typical integration targets include:

* Autonomous AI agent platforms
* MCP-based agent workflows
* CI/CD security gates
* DevSecOps automation
* Cloud operations
* Code-generation pipelines
* Shell and command execution systems
* Enterprise autonomous systems
* Sovereign AI environments
* Security research and validation environments

---

# Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     TEOS SENTINEL SHIELD                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   AI / Agent / MCP / CI / Automation Input                 │
│                         │                                   │
│                         ▼                                   │
│              ┌──────────────────────┐                       │
│              │ Security Inspection  │                       │
│              └──────────┬───────────┘                       │
│                         │                                   │
│                         ▼                                   │
│              ┌──────────────────────┐                       │
│              │  Multi-Engine Scan   │                       │
│              │   258 Security Rules │                       │
│              └──────────┬───────────┘                       │
│                         │                                   │
│                         ▼                                   │
│              ┌──────────────────────┐                       │
│              │ Policy / Risk Engine │                       │
│              └──────────┬───────────┘                       │
│                         │                                   │
│             ┌───────────┼────────────┐                      │
│             ▼           ▼            ▼                      │
│          ALLOW        WARN        REVIEW / BLOCK             │
│             │           │            │                      │
│             └───────────┼────────────┘                      │
│                         ▼                                   │
│              ┌──────────────────────┐                       │
│              │ Redis Audit / State  │                       │
│              └──────────┬───────────┘                       │
│                         │                                   │
│                         ▼                                   │
│                  API / Integration                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Security Engines

The v5 engine uses multiple specialized analysis engines rather than relying on a single pattern set.

The production release contains:

```text
258 total security rules
6 security analysis engines
```

The engines are designed to identify different classes of execution and application security risk.

The authoritative rule catalog in the repository is the source of truth for the exact current rule definitions.

Do not treat historical rule counts from earlier releases as current v5 production counts.

---

# Verdict Model

TEOS Sentinel Shield uses explicit security verdicts rather than probabilistic model output.

```text
ALLOW
WARN
REVIEW
BLOCK
```

The exact verdict is determined by the configured v5 policy and security engines.

A verdict is accompanied by security analysis information that can include:

* rule identification
* severity
* risk information
* detection reason
* input classification
* engine information
* timestamp
* audit information

The system is designed so that security decisions can be inspected and reproduced from the same input and rule configuration.

---

# Production API

## Health

```http
GET /health
```

Production endpoint:

```text
https://teos-sentinel-shield-production-7f0d.up.railway.app/health
```

The health response exposes production engine information including:

* service status
* engine version
* rule count
* environment
* release/deployment identifier
* authentication mode
* rate-limiting mode
* audit-store status
* dependency health

---

## Scan

The scan API evaluates an input before execution.

```http
POST /scan
```

Authentication is controlled through the configured API-key mechanism.

Example:

```bash
curl -X POST \
  https://teos-sentinel-shield-production-7f0d.up.railway.app/scan \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"command":"rm -rf /"}'
```

A scan response contains the security decision and associated analysis metadata.

---

# Authentication

Production API authentication uses:

```text
x-api-key
```

Private credentials must remain outside client-side bundles and must be supplied through secure server-side configuration.

Sentinel Shield is not designed to expose provider credentials or private API keys to browsers.

---

# Rate Limiting

Production rate limiting is:

```text
Redis-backed tiered rate limiting
```

Redis provides the shared state required for production request controls.

This prevents rate-limit state from depending solely on process-local memory.

---

# Audit and Persistence

The production release uses Redis for persistent runtime state and audit-related storage.

Production health currently reports:

```text
Store: Redis
Audit store: Redis fallback
PostgreSQL: Not configured
```

The architecture is therefore not dependent on a local JSON event file as its production persistence mechanism.

---

# Production Deployment

The verified production deployment runs on Railway.

Production service:

```text
teos-sentinel-shield-production-7f0d.up.railway.app
```

The production deployment is tied to the verified release commit:

```text
976235e28562610f917d8eb51d56ab054b838795
```

### Production environment

The production service reports:

```text
env: production
engine: v5.0.0
rules: 258
store: redis
auth: x-api-key
rateLimiting: redis-backed-tiered
```

---

# Local Development

Local development should use the repository's configured development scripts and environment configuration.

Production credentials must never be committed to the repository.

Local development configuration must not be confused with the production deployment configuration.

---

# Security Principles

## Deterministic Enforcement

Security decisions are produced through explicit rules and policy logic rather than relying on probabilistic LLM output.

## Pre-Execution Control

Sentinel Shield is intended to evaluate an action **before** it reaches the execution layer.

## Defense in Depth

Multiple security engines and rule classes provide layered inspection rather than relying on one detection mechanism.

## Auditability

Security decisions are designed to produce structured information suitable for audit and compliance workflows.

## Server-Side Secret Handling

Private API credentials and security-sensitive configuration remain server-side.

## Production State

Production state is backed by Redis rather than relying on a developer's local filesystem.

## Explicit Verdicts

The engine communicates an explicit security outcome:

```text
ALLOW
WARN
REVIEW
BLOCK
```

---

# Repository Structure

The repository contains the Sentinel Shield application, security engines, configuration, tests, documentation, and deployment assets.

The exact current production rule catalog and implementation are authoritative over historical README examples.

For the current release, use the repository's machine-readable rule catalog and automated test suite as the source of truth.

---

# Release Baseline

The frozen v5.0.0 production baseline is:

```text
Commit:
976235e28562610f917d8eb51d56ab054b838795

Version:
5.0.0

Engine:
v5.0.0

Rules:
258

ioredis:
5.11.1
```

This release is the verified production baseline for TEOS Sentinel Shield.

---

# Compliance and Governance

TEOS Sentinel Shield is designed as security and execution-control infrastructure for environments where autonomous systems require explicit governance controls.

The system provides technical enforcement mechanisms including:

* pre-execution inspection
* deterministic rule evaluation
* explicit verdicts
* authentication
* authorization boundaries
* rate limiting
* audit persistence
* security telemetry
* versioned engine metadata

Compliance claims must be evaluated against the actual deployment configuration, applicable jurisdiction, and governing institutional requirements.

Technical enforcement should not be interpreted as a claim of automatic regulatory certification.

---

# GitHub Action

TEOS Sentinel Shield ships as a zero-dependency JavaScript GitHub Action
(`node24`) so CI/CD pipelines can gate any step on a deterministic verdict
before it executes.

```yaml
- name: Gate step with TEOS Sentinel Shield
  uses: Elmahrosa/teos-sentinel-shield@v5.1.0
  with:
    api-key: ${{ secrets.TEOS_API_KEY }}
    scan-target: 'npm run build'
```

The run fails (exit 1) whenever the engine returns a `BLOCK` verdict or when
the scan API is unreachable (fail-closed by default) — the step after it never
executes.

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `api-key` | yes | — | `x-api-key` for the TEOS Sentinel Shield API. |
| `scan-target` | yes | `.` | Command, code file, script, or directory to inspect. |
| `api-url` | no | `https://teos-sentinel-shield-production-7f0d.up.railway.app` | Base URL of the scan API. |
| `api-path` | no | `/scan` | Endpoint path that accepts the scan payload (POST). |
| `fail-open` | no | `false` | `true` = pass when the API is unreachable (not recommended). |

## Outputs

| Output | Description |
| --- | --- |
| `verdict` | `ALLOW`, `WARN`, `REVIEW`, or `BLOCK`. |
| `risk-score` | Risk score (0–100) from the engine. |
| `rule-id` | Highest-severity rule that matched. |

## Verdict behavior

| Verdict | Action run |
| --- | --- |
| `ALLOW` | Pass. |
| `WARN` | Pass, with a warning annotation. |
| `REVIEW` | Pass, with a notice annotation. |
| `BLOCK` | Fail (`exit 1`) — downstream steps are skipped. |
| `ERROR` / unknown / API unreachable | Fail closed (`exit 1`) unless `fail-open: 'true'`. |

## Building

```bash
npm run build:action   # ncc bundles src/action.js -> dist/index.js
```

The compiled `dist/index.js` is committed so the action runs natively on the
GitHub Actions runner with no dependency install at execution time.

---

# License

**TESL v2.0 — TEOS Sovereign License**

TEOS Sentinel Shield is governed by the applicable TEOS Sovereign License and associated constitutional governance framework.

It is not released under MIT or Apache licensing.

See the repository's authoritative license files for the current legal terms.

---

# Product Position

**TEOS Sentinel Shield**

> **Execution Firewall for Autonomous AI Agents**

Built by **Elmahrosa International**.

**Law Over Code.**

```text
Inspect.
Decide.
Enforce.
Audit.
```

© 2026 Elmahrosa International
