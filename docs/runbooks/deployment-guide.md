# Deployment Guide — TEOS Sentinel Shield

**Classification:** INTERNAL
**Last Updated:** 2026-06-18

---

## Overview

TEOS Sentinel Shield is deployed via Git push → GitHub Actions → Railway auto-deploy.
All services are containerized and deployed to Railway's infrastructure.

## Architecture

```
git push origin main
       │
       ▼
GitHub Actions (stack-ci.yml)
  ├── Validate docker-compose
  ├── Shellcheck scripts
  ├── Secret scan (gitleaks)
  ├── Validate configs
  └── Build Docker images
       │
       ▼
GitHub Actions (deploy.yml)
  ├── Pre-deploy gate
  │   ├── REDIS_URL check
  │   ├── Hardcoded secrets scan
  │   └── Sentinel API reachability
  ├── Deploy activation-service
  ├── Deploy teoslinker-bot
  ├── Deploy agent-code-risk-mcp
  └── Post-deploy verification
```

## Prerequisites

- GitHub repository with `RAILWAY_TOKEN` and `GH_PAT` secrets configured
- Railway project initialized (ID: `0b0b2a98-5400-4d70-bba6-74f693592479`)
- All 4 service repos cloned and building

## Railway Project Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link 0b0b2a98-5400-4d70-bba6-74f693592479

# Set environment variables
railway variables set BOT_TOKEN=<value>
railway variables set ACTIVATION_AUTH_TOKEN=<value>
# ... (see SECRET_INVENTORY.md for full list)
```

## CI/CD Pipeline

### stack-ci.yml (Pull Request Validation)
Triggers on: push to `main`, PR to `main`

1. Validate docker-compose.yml compiles
2. Validate Makefile syntax
3. Run shellcheck on all scripts
4. Validate `.version.json` structure
5. Build all 3 service Docker images
6. Run secret scan

### teos-ci.yml (Branch Integrity)
Triggers on: push to `main`, PR to `main`

1. Check branch is not behind origin/main
2. Scan for forbidden UI fallback patterns
3. Validate access_state state contract
4. Verify bot uses /status API
5. Run state contract validator

### deploy.yml (Production Deployment)
Triggers on: push to `main`

1. Pre-deploy gate (blocks if REDIS_URL in scripts, hardcoded secrets)
2. Deploy activation-service to Railway
3. Deploy teoslinker-bot to Railway
4. Deploy agent-code-risk-mcp to Railway
5. Post-deploy health verification

## Environment Variables

All secrets are stored in Railway environment variables.
See `SECRET_INVENTORY.md` for complete inventory.

### Required Variables per Service

**Bot (`teoslinker-bot`):**
- `BOT_TOKEN`
- `ACTIVATION_AUTH_TOKEN`
- `MCP_API` (internal URL)
- `ACTIVATION_API` (internal URL)

**Risk Engine (`agent-code-risk-mcp`):**
- `PORT=8090`
- `REDIS_URL`

**Activation Service (`teos-activation-service`):**
- `ACTIVATION_AUTH_TOKEN`
- `DODO_WEBHOOK_SECRET`

**Shield (`teos-sentinel-shield`):**
- `TEOS_API_KEYS`
- `SENTINEL_API_KEY`
- `CORS_ORIGIN`

## Verification

### After Deployment

```bash
# Check bot
curl -sf https://teoslinker-bot-production.up.railway.app/health

# Check risk engine
curl -sf https://agent-code-risk-mcp-production-b97d.up.railway.app/health

# Check activation service
curl -sf https://activation-service-production-4228.up.railway.app/live

# Test scan
curl -X POST https://agent-code-risk-mcp-production-b97d.up.railway.app/scan \
  -H "Content-Type: application/json" \
  -d '{"command":"ls"}'
```

## Rollback

See `ROLLBACK_PROCEDURE.md` for detailed rollback instructions.
