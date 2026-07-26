# Privacy Policy

**Effective Date:** May 8, 2026  
**Last Updated:** July 26, 2026

## 1. Data Controller

TEOS Sovereign ("we", "us", "our")  
Alexandria, Egypt  
Contact: privacy@teos-sentinel.io

## 2. Data We Collect

### 2.1 Enforcement Logs
When you submit commands for evaluation via our API, CLI, or Telegram bot, we collect:
- The command or action submitted
- Enforcement verdict (BLOCK/WARN/ALLOW)
- Rule ID that triggered the verdict
- Risk score (0–100)
- Timestamp of evaluation
- Agent identifier (if provided)
- Request ID (auto-generated)

### 2.2 Technical Metadata
- IP address (rate limiting only, not stored beyond 60s window)
- User-Agent header (truncated to 120 characters)
- API key identifier (if authenticated)

### 2.3 What We Do NOT Collect
- File contents or source code beyond the command string
- Credentials, tokens, or secrets (we actively block attempts to echo these)
- Personal identifiable information (PII)
- Biometric data, health data, or financial data

## 3. Purpose of Processing

We process data solely for:
- Providing deterministic execution control enforcement
- Generating audit trails for compliance
- Improving rule detection accuracy
- Rate limiting and abuse prevention
- Security incident investigation

## 4. Data Retention

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| Enforcement events | 90 days (default), up to 1 year (Enterprise) | Legitimate interest |
| Rate limit counters | 60 seconds | Legitimate interest |
| Audit logs | Per customer agreement (minimum 1 year) | Contractual obligation |
| Anonymized statistics | Indefinite | Legitimate interest |

## 5. Data Residency

- **Default:** Data processed through Upstash Redis (global edge network)
- **Enterprise/Government:** Data can be restricted to specific regions (Egypt, UAE, Saudi Arabia) upon request
- **Self-hosted deployments:** Data never leaves your infrastructure

## 6. Third-Party Processors

| Processor | Purpose | Data Shared |
|-----------|---------|-------------|
| Upstash | Redis data store | Enforcement events only |
| Railway / Hostinger | Application hosting | Encrypted in transit |
| Telegram Bot API | Command submission interface | Commands only (Telegram privacy applies) |

## 7. Your Rights

### 7.1 Under GDPR (EU/EEA users)
- Right to access your data
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to data portability
- Right to object to processing
- Right to withdraw consent

### 7.2 Under Egyptian Data Protection Law (Law No. 151/2020)
- Right to know how your data is processed
- Right to request correction or deletion
- Right to object to processing

### 7.3 Exercising Your Rights
Contact: privacy@teos-sentinel.io  
Response time: Within 30 days

## 8. Security Measures

- All data encrypted in transit (TLS 1.3)
- Deterministic rule engine (no ML/AI model training on your data)
- No cross-customer data sharing
- SHA-256 hash chain for audit log integrity
- Rate limiting to prevent abuse
- Input sanitization and payload size limits (64KB max)

## 9. Children's Privacy

Our service is not directed to individuals under 16. We do not knowingly collect data from children.

## 10. Changes to This Policy

We will notify users of material changes via:
- Email to registered accounts
- Telegram bot announcement
- Updated effective date on this page

## 11. Contact

For privacy inquiries:
- Email: privacy@teos-sentinel.io
- Telegram: @teoslinker_bot
- Mail: TEOS Sovereign, Alexandria, Egypt

## 12. Governing Law

This policy is governed by Egyptian law. Disputes shall be resolved in Alexandria courts unless otherwise agreed.

---

**Document Version:** 1.1 (GA v4.0.0)  
**Review Cycle:** Annual or upon material change
