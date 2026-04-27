# TEOS Sentinel Shield

**Runtime Security for Autonomous Systems**

[![CI](https://github.com/Elmahrosa/teos-sentinel-shield/actions/workflows/ci.yml/badge.svg)](https://github.com/Elmahrosa/teos-sentinel-shield/actions/workflows/ci.yml)
[![License: TESL](https://img.shields.io/badge/License-TESL-gold)](./LICENSE)
[![Live](https://img.shields.io/badge/Live-teos--sentinel--shield.vercel.app-blue)](https://teos-sentinel-shield.vercel.app)

> Generate → Validate → Execute

TEOS Sentinel Shield is a deterministic AI execution firewall. It intercepts AI-generated code and tool calls before they reach production runtime, returning an instant **ALLOW / WARN / BLOCK** verdict. No probabilistic scoring. No guesswork. Policy-driven and fully auditable.

Part of the [TEOS Sovereign Security Stack](https://github.com/Elmahrosa) by Elmahrosa International.

---

## The Problem

Most AI stacks go: **Generate → Execute**

LLM safety tools cover prompts and outputs. AppSec tools cover static code and post-deployment scans. Neither validates AI-generated outputs **at the moment of execution**.

TEOS inserts the missing layer:

**Generate → Validate → Execute**

---

## Core Verdicts

| Verdict | Meaning |
|---------|---------|
| ✅ ALLOW | Code matches safe policy. Execution proceeds. |
| ⚠️ WARN | Elevated risk detected. Flagged for human review. |
| 🚫 BLOCK | Dangerous pattern identified. Execution halted. Incident logged. |

Verdicts are deterministic — driven by a configurable policy engine, not probabilistic AI scoring.

---

## Stack Architecture

```
AI Agent / LLM
      ↓
Sentinel Shield  ← You are here
      ↓
Policy Engine
      ↓
Runtime Execution (safe code only)
```

**Infrastructure:**
- **Dashboard** (`/dashboard`) — Next.js 15 control plane, TypeScript
- **Integrations** (`/integrations`) — CI/CD hooks, GitHub Actions gate
- **Activation Service** — Solana payment verification, tier-based licensing
- **Telegram Gateway** — Live bot interface with Arabic UX support

**Deployed on:** Fly.io + Neon PostgreSQL

---

## Pricing

| Tier | Price | Scans/day |
|------|-------|-----------|
| Starter | $9.99/mo | 3 |
| Pioneer | $29/mo | 50 |
| Builder ⭐ | $49/mo | 500 |
| Sovereign | Custom | Unlimited |

[View full pricing →](./PRICING.md)

---

## Quick Start

```bash
git clone https://github.com/Elmahrosa/teos-sentinel-shield
cd teos-sentinel-shield
cp .env.example .env
npm install
npm run dev
```

Configure your `.env` with your Solana RPC endpoint and Telegram bot token. See [Architecture →](./ARCHITECTURE.md) for full environment variable reference.

---

## Documentation

- [Architecture](./ARCHITECTURE.md) — stack design, data flow, environment variables
- [Roadmap](./ROADMAP.md) — current phase, next milestones
- [Pricing](./PRICING.md) — tier breakdown and enterprise options
- [Security Policy](./SECURITY.md) — vulnerability reporting

---

## Security

Report vulnerabilities privately to **ayman@teosegypt.com**. Do not open public issues for security matters. See [SECURITY.md](./SECURITY.md).

---

## License

TEOS Enterprise Source License (TESL). See [LICENSE](./LICENSE).

Commercial use requires a paid license. Contact ayman@teosegypt.com.

---

## About

**Elmahrosa International** | Alexandria, Egypt

CEO & Founder: Ayman Seif — [LinkedIn](https://linkedin.com/in/aymanseif) | [ayman@teosegypt.com](mailto:ayman@teosegypt.com)

Telegram Community (75+ countries): [t.me/Elmahrosapi](https://t.me/Elmahrosapi)

## Part of TEOS Sovereign Security Stack

Canonical stack repo:
https://github.com/Elmahrosa/teos-sovereign-security-stack

Core thesis:
Generate → Validate → Execute

TEOS Sentinel Shield is the runtime execution firewall for autonomous AI agents.
