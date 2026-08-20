# Data Retention Policy — TEOS Sentinel Shield

**Classification:** INTERNAL — Compliance
**Last Updated:** 2026-06-18

---

## Data Categories

| Category | Examples | Retention Period | Deletion Method |
|----------|----------|-----------------|-----------------|
| **Scan Results** | Code snippets, scan verdicts, findings | 90 days | Automated purge |
| **User Data** | Telegram ID, username, plan, credits | Until account deletion | Manual deletion |
| **Billing Data** | Payment records, webhook receipts | 7 years (legal) | Immutable archive |
| **Logs** | Access logs, error logs | 90 days | Log rotation |
| **Audit Logs** | Security events, admin actions | 1 year | Immutable archive |
| **Session Data** | Rate limit counters, temporary caches | 24 hours | Redis TTL |
| **Backup Archives** | Full orchestrator backups | 30 days | Automated rotation |
| **Git History** | Commits, code changes | Perpetual | N/A |

## Retention Enforcement

### Automated

| Mechanism | Applied To | Schedule |
|-----------|------------|----------|
| Docker log rotation (10MB × 3) | All service logs | Continuous |
| Redis key TTL (24h) | Session data | Continuous |
| Backup rotation (7 daily, 4 weekly, 3 monthly) | Backup archives | Daily |
| Git history | Code | Never |

### Manual

| Action | Frequency | Owner |
|--------|-----------|-------|
| Audit log archive | Quarterly | DevOps |
| User data review | Monthly | Admin |
| Billing record export | Monthly | Finance |
| Stale data cleanup | Quarterly | Engineering |

## Data Deletion

### User Deletion Request

```bash
# 1. Deactivate user in activation service
curl -X POST https://activation-service-production-4228.up.railway.app/deactivate \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -d '{"telegram_id": "<id>"}'

# 2. Verify deletion
curl -s https://activation-service-production-4228.up.railway.app/credits/<id> \
  -H "x-service-token: $ACTIVATION_AUTH_TOKEN"

# 3. Document the deletion in compliance records
```

## Compliance Frameworks

| Requirement | Status | Notes |
|-------------|--------|-------|
| GDPR Right to Erasure | Partial | Manual deletion available |
| GDPR Data Portability | Not implemented | User data export is manual |
| SOC 2 Type II | Not certified | Audit logging framework in place |
| EU AI Act Compliance | In progress | Risk engine documentation completed |
