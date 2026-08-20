# Operations Runbook — TEOS Sentinel Shield

**Classification:** INTERNAL — Operations Team Only
**Last Updated:** 2026-06-18

---

## 1. Service Overview

| Service | Endpoint | Health Check |
|---------|----------|-------------|
| Bot (Telegram Gateway) | `https://teoslinker-bot-production.up.railway.app` | `/health` |
| Risk Engine (MCP) | `https://agent-code-risk-mcp-production-b97d.up.railway.app` | `/live`, `/health` |
| Activation Service | `https://activation-service-production-4228.up.railway.app` | `/live` |
| Sentinel Shield | `https://teos-sentinel-shield-production-ef7a.up.railway.app` | `/health` |

## 2. Daily Operations

### Morning Check

```bash
make health
```

Expected: All services show HTTP 200.

### Monitor Logs

```bash
docker compose logs --tail=50 -f <service-name>
```

### Check Backup Status

```bash
ls -lh ../teos-backups/
bash scripts/backup.sh --dry-run
```

## 3. Health Verification

### Quick Health

```bash
bash monitoring/probes.sh
```

Returns JSON with liveness and readiness for each service.

### Full Verification

```bash
make health          # Docker services
bash healthcheck.sh  # All services + BetterStack heartbeats
```

## 4. Deployment

### Standard Deployment

Push to `main` triggers automatic Railway deployment via GitHub Actions.

### Manual Trigger

```bash
# Via GitHub UI:
#   Actions → TEOS Deploy → Run workflow
```

### Verify Deployment

```bash
bash monitoring/probes.sh --readiness
```

## 5. Incident Response

See `INCIDENT_RESPONSE.md` for severity classification and response procedures.
See `ROLLBACK_PROCEDURE.md` for deployment rollback steps.

## 6. Backup and Recovery

### Daily Backup

```bash
bash scripts/backup.sh
```

### List Backups

```bash
bash scripts/restore.sh --list
```

### Full Restore

```bash
bash scripts/restore.sh <backup-file>
```

## 7. Secrets Management

- All secrets stored in Railway environment variables
- Never commit `.env` files
- All `.env` files are gitignored
- Rotate secrets per schedule in `SECRET_INVENTORY.md`
