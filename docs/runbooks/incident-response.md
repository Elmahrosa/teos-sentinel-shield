# Incident Response Playbook — TEOS Sentinel Shield

**Classification:** INTERNAL
**Last Updated:** 2026-06-18

---

## Severity Classification

| Severity | Definition | Response Time |
|----------|-----------|---------------|
| **P0 — Critical** | Complete service outage, data loss, security breach | Immediate |
| **P1 — High** | Partial outage, degraded performance, payment issues | 15 minutes |
| **P2 — Medium** | Non-critical bugs, elevated error rates, minor latency | 1 hour |
| **P3 — Low** | Cosmetic issues, documentation errors, feature requests | Next sprint |

---

## P0 — Bot Down

### Symptoms
- `/health` returns non-200
- Users report bot not responding
- UptimeRobot alert fires

### Response Steps
1. Verify service status:
   ```bash
   curl -sf https://teoslinker-bot-production.up.railway.app/health
   ```
2. Check Railway dashboard for service logs
3. Verify Redis connectivity (if applicable)
4. Check for recent deployments that may have introduced issues
5. If deployment-related: execute rollback (see `ROLLBACK_PROCEDURE.md`)
6. If resource-related: scale up via Railway dashboard
7. If code-related: identify commit, fix, and redeploy

### Resolution Criteria
- `/health` returns 200
- Bot responds to `/start` command
- All downstream services reachable

---

## P0 — Security Breach

### Symptoms
- Unauthorized access detected
- Secret rotation alert
- Suspicious activity in audit logs

### Response Steps
1. **IMMEDIATE** — Rotate ALL secrets:
   - `BOT_TOKEN`, `ACTIVATION_AUTH_TOKEN`, `GITHUB_TOKEN`
   - `RAILWAY_TOKEN`, `GH_PAT`
   - `DODO_WEBHOOK_SECRET`, `ADMIN_SECRET`
2. Revoke and regenerate Railway tokens
3. Audit GitHub access logs
4. Check Railway deployment history for unauthorized changes
5. Notify security team via PagerDuty
6. Document incident in post-mortem

### Resolution Criteria
- All secrets rotated
- Attack vector identified and closed
- Incident report filed

---

## P1 — Risk Engine Degraded

### Symptoms
- `/scan` endpoint latency > 5s
- Error rate > 5%
- Partial responses

### Response Steps
1. Check risk engine health:
   ```bash
   curl -sf https://agent-code-risk-mcp-production-b97d.up.railway.app/health
   ```
2. Review scan logs for error patterns
3. Check Redis connection status
4. Verify rate limiting is not overly restrictive
5. Scale up if resource-constrained

---

## P1 — Activation Service Failure

### Symptoms
- Users cannot activate credits
- `/credits` endpoint returning errors
- Dodo Payments webhook failures

### Response Steps
1. Check activation service health
2. Verify Dodo Payments connectivity
3. Check for webhook signature mismatches
4. Verify `ACTIVATION_AUTH_TOKEN` matches between bot and activation services
5. Check database connectivity

---

## P2 — Elevated Error Rate

### Symptoms
- Error rate > 5% for 10+ minutes
- User reports of scan failures

### Response Steps
1. Identify error pattern from logs
2. Check for upstream API failures
3. Verify GitHub token rate limits (for `/github` scans)
4. Check Redis connection pool

---

## Post-Mortem Process

1. **Timeline**: Document all events with timestamps
2. **Root Cause**: Identify the underlying cause
3. **Impact**: Quantify user/customer impact
4. **Action Items**: Create remediation tasks
5. **Prevention**: Implement safeguards to prevent recurrence
6. **Review**: Present findings at engineering retrospective

---

## Communication Templates

### Status Update (Internal)

```
Status: [INVESTIGATING / MITIGATED / RESOLVED]
Severity: P[0-3]
Service: [Bot / Risk Engine / Activation / Shield]
Time: [UTC timestamp]
Impact: [What users experience]
Action: [What we are doing]
ETA: [Estimated resolution time]
```

### User Communication (Telegram)

```
⚠️ TEOS is currently experiencing [issue description].
We are working on a fix. Scan functionality may be intermittent.
Updates will be posted here. Thank you for your patience.
```
