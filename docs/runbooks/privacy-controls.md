# Privacy Controls — TEOS Sentinel Shield

**Classification:** INTERNAL — Compliance
**Last Updated:** 2026-06-18

---

## Data Collected

| Data Type | Collected | Purpose | Storage | Sharing |
|-----------|-----------|---------|---------|---------|
| Telegram User ID | Yes | User identification, credit tracking | Activation Service DB | Never |
| Telegram Username | Yes | Bot interaction | Logged temporarily | Never |
| Scan Code/Content | Yes | Security analysis | Risk Engine (processed in-memory) | Never |
| Scan Results | Yes | Security findings, audit trail | Shield dashboard, logs | Never |
| Payment Info | No | Handled by Dodo Payments | Dodo Payments servers | Via Dodo API |
| IP Address | No | Not collected | N/A | N/A |
| Session Data | Yes | Rate limiting | Redis (expires 24h) | Never |

## Data Processing

### Code Scanning

When a user submits code for scanning:
1. Code is sent to Risk Engine via HTTPS
2. Risk Engine processes code in-memory with 103 rules
3. Verdict and findings returned — raw code not persisted by default
4. Results stored in audit trail (90-day retention)

### Credit Management

User credit data is stored in the Activation Service:
- Telegram ID (required for identification)
- Credit balance (numeric)
- Plan tier (string)
- Expiration date (timestamp)

## User Rights

### Right to Access

Users can see their data via:
- `/status` command — shows plan, credits, expiration
- Dashboard — shows scan history, credit usage

### Right to Deletion

To request deletion:
1. User contacts admin via Telegram
2. Admin executes deletion procedure (see `DATA_RETENTION.md`)
3. User data removed within 30 days

### Right to Rectification

Users can correct data by:
- Re-activating with correct secret (resets tier)
- Contacting admin for manual correction

## Data Minimization

- Only Telegram ID and username are stored — no email, phone, or IP
- Scan code is processed in-memory, not persisted unless explicitly saved
- No tracking cookies, analytics scripts, or third-party tracking
- Payment data is never handled directly — processed by Dodo Payments

## Security Controls

- All data in transit: TLS 1.3 (HTTPS)
- All stored secrets: encrypted (PII_SALT, API_KEY_SALT for hashing)
- Access: service-to-service auth via `ACTIVATION_AUTH_TOKEN`
- Audit: all admin actions logged in audit trail
