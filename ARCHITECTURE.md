# TEOS Sentinel Shield — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TEOS Sovereign Stack                      │
│                                                             │
│  AI Agent / LLM Output                                      │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────┐                                        │
│  │  Sentinel Shield │  ← Execution Firewall (this repo)     │
│  │  Validate →      │                                        │
│  │  ALLOW/WARN/BLOCK│                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐     ┌──────────────────┐               │
│  │  Policy Engine   │     │  Activation Svc  │               │
│  │  Rules + Config  │     │  License + Pay   │               │
│  └─────────────────┘     └──────────────────┘               │
│           │                                                  │
│           ▼                                                  │
│  Runtime Execution (safe code only)                          │
└─────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
teos-sentinel-shield/
├── dashboard/              Next.js 15 control plane
│   ├── app/                App Router pages + API routes
│   ├── components/         UI components
│   └── lib/                Shared utilities
├── integrations/           CI/CD and external hooks
│   └── github-actions/     GitHub Actions enforcement gate
├── .github/workflows/      CI pipeline
├── .env.example            Environment variable template
├── docker-compose.yml      Local development stack
├── package.json
└── README.md
```

## Data Flow

1. **Input** — AI agent submits code/command to the Sentinel API
2. **Parse** — Payload is normalized and fingerprinted
3. **Policy check** — Verdict engine applies rule set (configurable per tier)
4. **Verdict issued** — ALLOW / WARN / BLOCK returned with audit record
5. **Activation** — Tier entitlements checked against license DB (Neon PostgreSQL)
6. **Logging** — All verdicts written to audit log with timestamp, payload hash, verdict, policy version

## Environment Variables

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta        # or devnet for testing
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Telegram bot
TELEGRAM_BOT_TOKEN=

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...

# App
NEXTAUTH_SECRET=                               # 32+ char random string
NEXTAUTH_URL=https://teos-sentinel-shield.vercel.app
```

## Deployment

**Production:** Fly.io (bot) + Vercel (dashboard) + Neon (database)

**Local:**
```bash
docker-compose up      # starts Postgres + app
npm run dev            # Next.js dev server
```

## Scan Tier Limits

| Tier | Scans/day | Policy Engine | CI Integration |
|------|-----------|--------------|----------------|
| Starter | 3 | Basic | No |
| Pioneer | 50 | Standard | No |
| Builder | 500 | Advanced | Yes |
| Sovereign | Unlimited | Custom | Yes |
