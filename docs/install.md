# TEOS Sentinel — Installation Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TEOS Sovereign Security Stack             │
├─────────────────────────────────────────────────────────────┤
│  Telegram ──► teoslinker-bot ──► agent-code-risk-mcp        │
│  CLI                                                        │
│  Desktop              teos-sentinel-shield                    │
│  Browser Ext                                                │
│  VS Code Ext          teos-activation-service                │
│  REST API            safe-ingestion-engine                   │
│                        redis                                │
└─────────────────────────────────────────────────────────────┘
```

5 services communicate over an internal Docker network:
- **teoslinker-bot** (Telegram bot, port 8082)
- **agent-code-risk-mcp** (risk engine, port 8090)
- **teos-activation-service** (billing/auth, port 8080)
- **teos-sentinel-shield** (API gateway, port 3000)
- **safe-ingestion-engine** (audit store, port 8000)
- **redis** (cache/queue, port 6379, internal only)

## Requirements

### Minimum
- Node.js 22+
- npm 10+
- Git
- 2 GB RAM, 5 GB disk

### Docker Deployment
- Docker Engine 24+
- Docker Compose v2+

### Railway Deployment
- GitHub account
- Railway account (railway.app)

### Optional
- Redis 7+ (managed or Docker)
- PostgreSQL 15+ (for production activation service)

## Quick Start (Docker)

```bash
# Clone the orchestrator
git clone https://github.com/Elmahrosa/teos-sovereign-security-stack.git
cd teos-sovereign-security-stack

# Clone service repos
git clone https://github.com/Elmahrosa/teoslinker-bot.git services/teoslinker-bot
git clone https://github.com/Elmahrosa/agent-code-risk-mcp.git services/agent-code-risk-mcp
git clone https://github.com/Elmahrosa/teos-activation-service.git services/teos-activation-service
git clone https://github.com/Elmahrosa/teos-sentinel-shield.git services/teos-sentinel-shield
git clone https://github.com/Elmahrosa/safe-ingestion-engine.git services/safe-ingestion-engine

# Create secrets
mkdir -p secrets
echo -n "$(openssl rand -hex 32)" > secrets/redis_password.txt
echo -n "$(openssl rand -hex 32)" > secrets/activation_auth_token.txt
echo -n "$(openssl rand -hex 32)" > secrets/jwt_secret.txt

# Create .env files for each service
cp .env.example services/teoslinker-bot/.env
cp .env.example services/agent-code-risk-mcp/.env
cp .env.example services/teos-activation-service/.env
cp .env.example services/teos-sentinel-shield/.env
cp .env.example services/safe-ingestion-engine/.env

# Edit .env files with your secrets (see Environment Variables below)

# Start all services
docker compose up -d

# Check health
curl http://localhost:8082/health
curl http://localhost:8090/health
curl http://localhost:8080/health
```

## Railway Deployment

### Prerequisites
- Railway CLI installed and logged in
- GitHub repos cloned to Elmahrosa organization

### Deploy

```bash
# Each service deploys independently from its repo
cd services/teoslinker-bot
railway up

cd ../agent-code-risk-mcp
railway up

cd ../teos-activation-service
railway up

cd ../teos-sentinel-shield
railway up
```

### CI/CD (Automatic)

Push to `main` on any service repo triggers Railway auto-deploy:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railway/railway-action@v3
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

### Railway TOML

Each service has a `railway.toml`:

```toml
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "<entrypoint>"
restartPolicyType = "on_failure"
healthcheckPath = "/health"
healthcheckTimeout = 30
```

## Hostinger Deployment

For air-gapped / on-prem deployments:

1. Provision a VPS (4 vCPU, 8 GB RAM, 40 GB SSD)
2. Install Docker Engine + Docker Compose
3. Clone the orchestrator and all service repos
4. Set `SAFE_HOST=127.0.0.1` in `.env` files
5. Bind ports to `127.0.0.1` (already configured in `docker-compose.yml`)
6. Set up reverse proxy (Caddy / Nginx) with TLS termination
7. Configure firewall: allow only ports 80/443 from public, all others internal

```bash
# Example Nginx reverse proxy
server {
    listen 443 ssl;
    server_name sentinel.yourdomain.com;
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Variables

### teoslinker-bot

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BOT_TOKEN` | Yes | — | Telegram Bot Token from @BotFather |
| `BOT_USE_WEBHOOK` | No | `false` | Enable webhook mode (Railway) |
| `BOT_WEBHOOK_URL` | If webhook | — | Public HTTPS URL for webhook |
| `MCP_API` | Yes | — | Risk engine URL (e.g. `http://risk-engine:8090`) |
| `MCP_ENGINE_URL` | No | Same as MCP_API | Alternative risk engine URL |
| `ACTIVATION_API` | Yes | — | Activation service URL |
| `ACTIVATION_AUTH_TOKEN` | Yes | — | Service-to-service auth token |
| `ALPHA_ACTIVATION_SECRET` | No | — | Secret for alpha deep-link activation |
| `BETA_ACTIVATION_SECRET` | No | — | Secret for beta deep-link activation |
| `GITHUB_TOKEN` | No | — | GitHub PAT for private repo scanning |
| `ANTHROPIC_API_KEY` | No | — | Claude AI integration |
| `GROQ_API_KEY` | No | — | Groq AI integration |
| `REDIS_URL` | No | — | Redis connection string |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `PORT` | No | `8082` | HTTP server port |

### agent-code-risk-mcp

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8090` | HTTP server port |
| `NODE_ENV` | No | `production` | Environment |
| `REDIS_URL` | No | — | Redis connection string |
| `SOLANA_RPC_URL` | No | — | Solana RPC endpoint |
| `SOLANA_WS_URL` | No | — | Solana WebSocket endpoint |
| `ETH_RPC_URL` | No | — | Ethereum RPC endpoint |
| `USDC_MINT_ADDRESS` | No | — | USDC mint for token scans |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `AUDIT_API_KEY` | No | — | Key for /audit and /stats endpoints |

### teos-activation-service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | HTTP server port |
| `NODE_ENV` | No | `production` | Environment |
| `DATABASE_URL` | No | `sqlite:///./data/users.db` | PostgreSQL URL or SQLite |
| `DODO_WEBHOOK_SECRET` | For payments | — | Dodo Payments webhook signing secret |
| `DODO_PAYMENTS_API_KEY` | No | — | Dodo Payments API key |
| `ADMIN_SECRET` | Yes | — | Secret for /grant and /purge-testers |
| `ACTIVATION_AUTH_TOKEN` | Yes | — | Service-to-service auth for /credits, /consume |
| `ALPHA_ACTIVATION_SECRET` | No | — | Secret for alpha tester activation |
| `BETA_ACTIVATION_SECRET` | No | — | Secret for beta tester activation |
| `FOUNDER_USER_ID` | No | — | Telegram user ID for founder row |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS origins |
| `REQUEST_SIZE_LIMIT` | No | `10kb` | Max request body size |
| `TRUST_PROXY` | No | `1` | Trust proxy count |
| `LOG_LEVEL` | No | `info` | Pino log level |

### teos-sentinel-shield

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | `production` | Environment |
| `TEOS_API_KEYS` | Yes | — | Comma-separated valid API keys |
| `SENTINEL_API_KEY` | No | — | Sentinel-specific API key |
| `SUPABASE_URL` | No | — | Supabase project URL (optional) |
| `SUPABASE_KEY` | No | — | Supabase service key (optional) |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `AUDIT_API_KEY` | No | — | Key for /audit access |
| `RATE_LIMIT_WINDOW` | No | `900000` | Rate limit window in ms |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `LOG_LEVEL` | No | `info` | Pino log level |

### safe-ingestion-engine

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8000` | HTTP server port |
| `NODE_ENV` | No | `production` | Environment |
| `DATABASE_URL` | No | `sqlite:///./data/jobs.db` | Database connection |
| `SAFE_HOST` | No | `0.0.0.0` | Bind address |
| `PII_SALT` | Yes | — | Salt for PII hashing |
| `API_KEY_SALT` | Yes | — | Salt for API key hashing |
| `GAS_WEBHOOK_SECRET` | No | — | Webhook secret for gas station |
| `LOG_LEVEL` | No | `info` | Pino log level |

## Production Checklist

- [ ] All secrets rotated from defaults
- [ ] `ADMIN_SECRET` set to strong random value (min 32 hex chars)
- [ ] `ACTIVATION_AUTH_TOKEN` matches between bot and activation service
- [ ] `DODO_WEBHOOK_SECRET` matches Dodo Payments dashboard
- [ ] `GITHUB_TOKEN` has only `contents:read` and `metadata:read` scopes
- [ ] Redis bound to internal Docker network only (`127.0.0.1` or `redis` hostname)
- [ ] No service port exposed to public internet except reverse proxy
- [ ] TLS termination configured at reverse proxy level
- [ ] Rate limiting enabled (defaults: 100 req/15 min)
- [ ] Health check endpoints configured for orchestration
- [ ] `LOG_LEVEL` set to `info` or `warn` (not `debug`)
- [ ] Pino log redaction configured for sensitive fields
- [ ] Docker containers run as non-root user (UID 1000)
- [ ] Container filesystems set to `read_only: true`
- [ ] All `CAP_DROP: ALL` and `no-new-privileges: true` set
- [ ] Monitoring endpoints (`/metrics`, `/health`) not exposed publicly
- [ ] Database backups configured (SQLite auto-backup or PostgreSQL WAL)
- [ ] CI/CD pipeline triggers only on push to `main`
- [ ] `RAILWAY_TOKEN` stored as GitHub secret, never in code
- [ ] Secrets never logged — verified via `grep -r` for secret patterns

## Service Health Endpoints

| Service | URL | Expected |
|---------|-----|----------|
| Bot | `/live` | `{"status":"ok"}` |
| Risk Engine | `/live` | `{"status":"ok"}` |
| Activation | `/live` | `{"status":"ok"}` |
| Shield | `/live` | `{"status":"ok"}` |
| Ingestion | `/health` | `{"status":"healthy"}` |

## Updating

```bash
# Docker
docker compose pull
docker compose up -d --force-recreate

# Railway
git push origin main  # auto-deploys

# Manual Railway
railway up --service teoslinker-bot
railway up --service agent-code-risk-mcp
railway up --service teos-activation-service
railway up --service teos-sentinel-shield
```
