# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **do not open a public GitHub issue**.

Report it privately by emailing:

**ayman@teosegypt.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your suggested fix (optional)

We will acknowledge receipt within 48 hours and aim to release a fix within 14 days of confirmation.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main) | ✅ |
| Older releases | Contact us |

## Security Practices

- No secrets are committed to this repository
- Environment variables are managed via `.env` locally and deployment secrets in production
- Dependencies are audited in CI via `npm audit --audit-level=high`
- Push protection and secret scanning are enabled on this repository

## Disclosure Policy

We follow coordinated disclosure. We ask that you give us reasonable time to remediate before publishing details of any vulnerability.

Thank you for helping keep TEOS and its users safe.

— Ayman Seif, Elmahrosa International
