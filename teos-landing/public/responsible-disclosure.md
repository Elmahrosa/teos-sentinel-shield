# Responsible Disclosure Policy

**Effective Date:** May 8, 2026

## Overview

TEOS Sovereign values the security research community and welcomes responsible disclosure of vulnerabilities in our products and services.

## Scope

This policy covers:
- TEOS Sentinel Shield API (`https://teos-sentinel-shield.vercel.app`)
- TEOS Landing Page (`https://teos-landing-seven.vercel.app`)
- TEOS CLI (`teos` command)
- Telegram Bot (`@teoslinker_bot`)
- Open-source rule engine and test cases

## What We Consider Vulnerabilities

- Remote code execution
- Authentication/authorization bypass
- Data exposure of other users' enforcement logs
- Rate limiting bypass
- Supply chain compromise (rule injection, test case manipulation)
- Denial of service affecting enforcement availability
- Cryptographic weaknesses in audit hash chain

## What Is NOT Covered

- Social engineering attacks against staff
- Physical security issues
- Attacks requiring physical access
- Issues in third-party services (Telegram, Vercel, Upstash)
- Denial of service via volumetric attacks (DDoS)
- Missing security headers without demonstrated exploit

## Reporting Process

1. **Do NOT** publicly disclose the vulnerability
2. **Do NOT** exploit the vulnerability beyond demonstration
3. **Do NOT** access, modify, or delete other users' data
4. Email your findings to: **security@teos-sentinel.io**

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested remediation (optional)

## Response Timeline

| Stage | Timeline |
|-------|----------|
| Initial acknowledgment | Within 48 hours |
| Triage and validation | Within 7 days |
| Status update to researcher | Every 14 days |
| Fix deployment | Within 30 days (critical: 7 days) |
| Public disclosure | After fix, with researcher consent |

## Safe Harbor

If you follow this policy, we will:
- Not pursue legal action against you
- Not report you to law enforcement
- Not send cease-and-desist letters
- Acknowledge your contribution (with your permission)

## Recognition

With your consent, we will recognize security researchers in our Hall of Fame page and release notes.

## Questions?

Contact: security@teos-sentinel.io  
PGP Key: Available at `/pgp-key.txt`

---

**Document Version:** 1.0  
**Last Updated:** May 8, 2026