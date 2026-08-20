# Administrator Guide — TEOS Sentinel Shield

**Classification:** INTERNAL — Admin Use Only
**Last Updated:** 2026-06-18

---

## 1. System Architecture

TEOS Sentinel Shield consists of 4 Railway-deployed microservices:

| Service | Port | Language | Repository |
|---------|------|----------|------------|
| Bot Gateway | 8082 | Node.js | `Elmahrosa/teoslinker-bot` |
| Risk Engine | 8090 | TypeScript | `Elmahrosa/agent-code-risk-mcp` |
| Activation Service | 8080 | Node.js | `Elmahrosa/teos-activation-service` |
| Sentinel Shield | 3000 | Node.js | `Elmahrosa/teos-sentinel-shield` |

## 2. Initial Setup

### Prerequisites
- Docker Desktop 24+
- Node.js 22+
- Railway CLI (`npm install -g @railway/cli`)

### Clone and Bootstrap

```bash
git clone https://github.com/Elmahrosa/teos-sovereign-security-stack.git
cd teos-sovereign-security-stack
bash bootstrap.sh
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with real secrets
```

### Start Locally

```bash
make up
```

### Check Health

```bash
make health
bash healthcheck.sh
```

## 3. Production Administration

### Deploying Changes

Automatic:
```bash
git push origin main
# → GitHub Actions → Railway auto-deploy
```

Manual (if CI fails):
```bash
railway up --service <service-name> --ci
```

### Monitoring

```bash
# Quick health check
curl -sf https://teoslinker-bot-production.up.railway.app/health

# All services
bash monitoring/probes.sh

# Uptime dashboard
open monitoring/dashboard.html
```

### Managing Users

**Grant credits:**
```
/grant <telegram_id> <amount> (admin only)
```

**View user status:**
```
/status (by user)
```

**Purge alpha testers:**
```bash
curl -X POST https://activation-service-production-4228.up.railway.app/purge-testers \
  -H "x-admin-secret: $ADMIN_SECRET"
```

## 4. Secrets Administration

See `SECRET_INVENTORY.md` for complete secret inventory.

### Rotating Secrets

```bash
# Generate new secrets
bash scripts/generate-secrets.sh

# Update Railway
railway variables set KEY=VALUE

# Update local .env
# Verify no .env files tracked
bash scripts/secret-scan.sh
```

## 5. Backup Administration

### Daily Backup (automated via cron)

```bash
0 2 * * * /path/to/teos-stack/scripts/backup.sh
```

### Manual Backup

```bash
bash scripts/backup.sh
```

### Restore

```bash
bash scripts/restore.sh --list
bash scripts/restore.sh <backup-file>
```

## 6. Scaling

Services are deployed on Railway with auto-scaling:
- **Bot**: 256MB RAM, scales based on message volume
- **Risk Engine**: 512MB RAM, scales based on scan requests
- **Activation**: 256MB RAM, low traffic volume
- **Shield**: 256MB RAM, dashboard traffic

To scale via Railway:
1. Navigate to Railway dashboard → Service → Settings
2. Adjust CPU/memory limits
3. Changes apply on next deployment

## 7. Troubleshooting

### Bot Not Responding

```bash
# Check bot health
curl -sf https://teoslinker-bot-production.up.railway.app/health

# Check activation connectivity
curl -sf https://activation-service-production-4228.up.railway.app/live

# Verify webhook/polling mode
# Railway uses polling: BOT_USE_WEBHOOK=false
```

### Scans Failing

```bash
# Check risk engine
curl -sf https://agent-code-risk-mcp-production-b97d.up.railway.app/health

# Test scan
curl -X POST https://agent-code-risk-mcp-production-b97d.up.railway.app/scan \
  -H "Content-Type: application/json" \
  -d '{"command":"test"}'
```

### Activation Issues

```bash
# Check activation service
curl -sf https://activation-service-production-4228.up.railway.app/live

# Test credits endpoint
curl -s https://activation-service-production-4228.up.railway.app/credits/123 \
  -H "x-service-token: $ACTIVATION_AUTH_TOKEN"
```

## 8. Security Procedures

### Daily
- [ ] Verify all services healthy (`make health`)
- [ ] Check for failed CI runs

### Weekly
- [ ] Review error rates and latency
- [ ] Check backup integrity
- [ ] Review Railway resource usage

### Monthly
- [ ] Rotate secrets per schedule
- [ ] Run `bash scripts/secret-scan.sh`
- [ ] Review and update documentation
- [ ] Check for dependency updates

### Quarterly
- [ ] Full security audit
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Emergency contact list verification
