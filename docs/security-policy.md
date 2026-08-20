# Security Policy

## Reporting Vulnerabilities

Report all security vulnerabilities privately to:

**ayman@teosegypt.com**

Do not disclose security issues publicly before coordinated remediation.

## Scope

This policy applies to all repositories in the TEOS Sovereign Security Stack:

- teos-sovereign-security-stack
- agent-code-risk-mcp
- teos-sentinel-shield
- teoslinker-bot
- teos-activation-service
- teosmcp-ci-example
- safe-ingestion-engine
- teos-civic-mixer
- Teos-International-Civic-Blockchain-Constitution

## Rules

1. **No secrets in code** — Never commit tokens, keys, webhook secrets, or `.env` files.
2. **No hardcoded credentials** — All secrets must use environment variables or a secrets vault.
3. **Principle of least privilege** — Every component has only the permissions it needs.
4. **Append-only audit** — All security-relevant events are logged immutably.
5. **Human-in-the-loop** — High-impact decisions require human approval per ICBC governance.

## Response SLA

| Severity | Response | Remediation |
|----------|----------|-------------|
| Critical | < 4 hours | < 24 hours |
| High     | < 24 hours | < 72 hours |
| Medium   | < 72 hours | < 2 weeks |
| Low      | < 1 week  | Next release |

## Disclosure

We follow coordinated disclosure. Reporters receive credit in our security hall of fame upon request.
