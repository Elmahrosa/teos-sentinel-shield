# 🛡️ TEOS Sentinel Shield

## Execution Control Infrastructure for Autonomous AI

**Generate → Validate → Execute**

[![CI](https://github.com/Elmahrosa/teos-sentinel-shield/actions/workflows/ci.yml/badge.svg)](https://github.com/Elmahrosa/teos-sentinel-shield/actions/workflows/ci.yml)
[![License: TESL](https://img.shields.io/badge/License-TESL-gold)](./LICENSE)
[![Live](https://img.shields.io/badge/Live-teos--sentinel--shield.vercel.app-blue)](https://teos-sentinel-shield.vercel.app)

> Deterministic execution control for autonomous systems.

TEOS Sentinel Shield validates AI-generated code, dependencies, and CI workflows **before execution**, returning policy-driven:

- ✅ ALLOW  
- ⚠️ WARN  
- 🚫 BLOCK

verdicts to reduce runtime, supply-chain, and autonomous agent risk.

Unlike prompt safety filters or post-deployment scanners, TEOS sits at the missing control point:

**Generate → Validate → Execute**

Built by **Elmahrosa International** as part of the **TEOS Sovereign Security Stack**.

---

# The Problem

Most AI systems still operate as:

```text
Generate → Execute
```

That leaves a dangerous gap between generation and action.

Prompt safety does not stop dangerous execution.

Traditional AppSec does not validate AI-generated actions at runtime.

TEOS inserts an execution control layer in that gap.

---

# Core Verdict Model

| Verdict | Action | Meaning |
|--------|--------|---------|
| ✅ ALLOW | Proceed | Safe against policy rules |
| ⚠️ WARN | Review | Elevated risk requires inspection |
| 🚫 BLOCK | Halt | Dangerous pattern prevented |

Deterministic verdicts.

Policy-driven.

Auditable.

No probabilistic guesswork.

---

# Live Capabilities

## Code Risk Validation
Detects patterns including:

- eval / exec abuse
- child_process risks
- destructive commands
- secret exposure
- unsafe permissions
- remote command download behavior

Command:

```bash
/scan <code>
```

---

## Dependency Risk Scanning

Checks:

- floating versions
- known supply-chain risks
- external GitHub/URL dependencies
- suspicious local package references

Command:

```bash
/deps {"dependencies":{"express":"latest"}}
```

---

## CI/CD Workflow Audit

Checks:

- unpinned GitHub Actions
- workflow supply-chain risk
- secrets exposure patterns
- risky CI behaviors

Command:

```bash
/ci uses: actions/checkout@v4
```

---

# Architecture

```text
AI Agent / LLM
      ↓
Generate
      ↓
TEOS Sentinel Shield
  (Validate)
      ↓
ALLOW / WARN / BLOCK
      ↓
Execution
```

Components:

- Sentinel Dashboard (Control Plane)
- Telegram Security Gateway
- Activation / Credits Service
- Risk Policy Engine
- CI Audit Layer

---

# Pricing

| Tier | Price | Included |
|------|-------|----------|
| Free | 5 scans | Trial access |
| Starter | $9/mo | 50 scans |
| Builder | $49/mo | 500 scans + dependency audit |
| Pro | $99/mo | 1000 scans + dependency + CI audit |

---

# Why TEOS

- Execution control, not just detection
- Runtime protection for autonomous code
- Supply-chain aware dependency checks
- CI workflow risk inspection
- Sovereign-first security architecture

---

# Quick Start

```bash
git clone https://github.com/Elmahrosa/teos-sentinel-shield
cd teos-sentinel-shield
npm install
npm run dev
```

---

# Documentation

- Architecture
- Roadmap
- Pricing
- Security Policy

---

# Security

Report vulnerabilities privately:

ayman@teosegypt.com

See SECURITY.md.

---

# License

TESL — TEOS Enterprise Source License

Commercial licensing available.

---

## Core Thesis

```text
Generate → Validate → Execute
```

TEOS Sentinel Shield is execution control infrastructure for autonomous AI.
