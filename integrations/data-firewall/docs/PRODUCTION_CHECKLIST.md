# Production Deployment Checklist

## Pre-Deployment
- [ ] PII_SALT set (≥32 chars, random)
- [ ] API_KEY_SALT set (≥32 chars, random)
- [ ] DASHBOARD_ADMIN_PASSWORD set (≥12 chars)
- [ ] DATABASE_URL points to PostgreSQL (not SQLite)
- [ ] REDIS_URL configured with TLS for production
- [ ] CORS_ORIGINS restricted to allowed domains
- [ ] Rate limits configured per tier

## Security Verification
- [ ] Run `bandit -r . -ll` → no HIGH/CRITICAL
- [ ] Run `pip-audit` → no unpatched CVEs
- [ ] Run `trivy fs .` → no critical container issues
- [ ] Verify SSRF guard blocks 10.0.0.0/8 and 192.168.0.0/16
- [ ] Test ReDoS patterns with fuzzing script

## Operational Readiness
- [ ] Health endpoint responds: `curl /health`
- [ ] Metrics endpoint exposed: `curl /metrics`
- [ ] Audit logs writing to configured destination
- [ ] Alerting configured for SSRF blocks and PII scrub count spikes
- [ ] Backup strategy documented for audit database

## Post-Deployment
- [ ] Smoke test: submit test ingestion job
- [ ] Verify job completes and audit entry created
- [ ] Monitor error rates for 1 hour
- [ ] Confirm no unexpected PII in stored excerpts
