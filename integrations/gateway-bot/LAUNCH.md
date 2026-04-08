# 🚀 TEOS Gateway Bot — Launch in 5 Steps

## Step 1 — Copy files into your repo

Replace these files in `integrations/gateway-bot/`:
- `src/server.ts` ← single entry point, replaces both old server.ts + bot.ts
- `src/config.ts`
- `src/solana.ts`
- `prisma/schema.prisma`
- `prisma/migrations/` ← delete old migrations folder, use this one
- `package.json`
- `tsconfig.json`
- `Dockerfile`
- `.env.example`

For the dashboard, copy `tailwind.config.js` into `dashboard/`.

Delete these files (they caused the double-launch crash):
- `src/bot.ts`
- `src/bot.js`
- `src/routes/activation.ts` (replaced by server.ts route)
- `src/routes/activation.js`
- All compiled `.js` duplicates in `src/` — only keep `.ts` source files

## Step 2 — Set up Neon PostgreSQL (free tier)

1. Go to https://neon.tech → New Project → name it `teos-vault`
2. Copy the connection string
3. Create your `.env` from `.env.example` and paste it as `DATABASE_URL`

## Step 3 — Fill your .env

```bash
cp .env.example .env
```

Fill in:
- `GATEWAY_BOT_TOKEN` — from @BotFather on Telegram
- `TREASURY_WALLET` and `SOLANA_RECEIVER_WALLET` — your Solana wallet address (same value)
- `BOT_SHARED_SECRET` — run: `openssl rand -hex 32`
- `LICENSE_SIGNING_SECRET` — run: `openssl rand -hex 32`
- `DATABASE_URL` — from Neon
- Keep `SOLANA_RPC_URL` as mainnet-beta for now (upgrade to Helius later)

## Step 4 — Run database migration

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

Verify tables exist:
```bash
npx prisma studio
```

## Step 5 — Launch

**Local dev:**
```bash
npm run dev
```

**Production (Railway / Render / VPS):**
```bash
npm run build
npm start
```

**Docker:**
```bash
docker build -t teos-gateway .
docker run --env-file .env -p 8080:8080 teos-gateway
```

## Verify it's working

```bash
curl http://localhost:8080/health
# → {"status":"ok","node":"Alexandria","ts":"..."}
```

Send any message to your Telegram bot → it should reply with instructions.

## What changed from original

| Bug | Fix |
|-----|-----|
| Double bot.launch() crash | Single server.ts, bot.ts deleted |
| ESM/CJS module conflict | All files ESM, package.json type:module |
| SQLite migration on PostgreSQL | New migration.sql with correct Postgres types |
| telegramUserId missing from License schema | Added to schema.prisma |
| txHash not unique in schema | @unique added |
| activation route bypassed Solana | Route deleted, server.ts route is the only one |
| TREASURY_WALLET missing from .env | Added to .env.example and config.ts |
| Empty Dockerfile | Real multi-stage Docker build |
| gold-500 not in Tailwind | tailwind.config.js with gold color scale |
| All text treated as tx hash | Bot only processes 60-100 char strings |
