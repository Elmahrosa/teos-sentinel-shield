# Rollback Procedure — TEOS Sentinel Shield

**Classification:** INTERNAL
**Last Updated:** 2026-06-18

---

## Rollback Types

| Type | Method | Time |
|------|--------|------|
| **Code Rollback** | Revert commit + `git push` | 5 minutes |
| **Railway Rollback** | Railway Dashboard → Deployments → Rollback | 2 minutes |
| **Full Stack** | Revert + restore backup | 15 minutes |

---

## Quick Rollback (Code)

```bash
# 1. Identify the problematic commit
git log --oneline -10

# 2. Revert to previous working commit
git revert HEAD --no-edit
git push origin main

# 3. Verify deployment
sleep 30
bash monitoring/probes.sh --readiness
```

## Railway Dashboard Rollback

1. Navigate to `https://railway.app/project/0b0b2a98-5400-4d70-bba6-74f693592479`
2. Select the affected service
3. Click **Deployments** tab
4. Find the last known-good deployment
5. Click **"..."** → **"Redeploy"**
6. Verify health:
   ```bash
   curl -sf https://teoslinker-bot-production.up.railway.app/health
   ```

## Service-Specific Rollbacks

### Bot Only

```bash
# Revert bot changes only
cd /tmp
git clone --depth 5 https://github.com/Elmahrosa/teoslinker-bot.git
cd teoslinker-bot
git revert HEAD --no-edit
git push origin main
```

### Risk Engine Only

```bash
cd /tmp
git clone --depth 5 https://github.com/Elmahrosa/agent-code-risk-mcp.git
cd agent-code-risk-mcp
git revert HEAD --no-edit
git push origin main
```

### Activation Service Only

```bash
cd /tmp
git clone --depth 5 https://github.com/Elmahrosa/teos-activation-service.git
cd teos-activation-service
git revert HEAD --no-edit
git push origin main
```

## Full Stack Rollback (Backup)

```bash
# 1. List available backups
bash scripts/restore.sh --list

# 2. Restore from backup
bash scripts/restore.sh <backup-file>

# 3. Redeploy all services
git push origin main --force
```

## Verification After Rollback

```bash
# Check all service health
bash healthcheck.sh

# Run integration tests
node --experimental-vm-modules node_modules/.bin/jest test/integration/health.test.js

# Verify probes
bash monitoring/probes.sh
```

## Prevention

- Always verify deployments with `bash monitoring/probes.sh --readiness`
- Use the pre-deploy gate in CI (validates secrets, API reachability)
- Deploy services independently to minimize blast radius
- Run integration tests before deploying to production
