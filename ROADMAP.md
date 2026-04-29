# TEOS Sentinel Shield — Roadmap

## Current Phase: SaaS Runtime (Live)

- [x] Telegram bot with Arabic UX
- [x] ALLOW / WARN / BLOCK verdict system
- [x] Solana payment verification (SOL/USDC)
- [x] Tier-based scan limits (Starter / Pioneer / Builder / Sovereign)
- [x] Fly.io deployment + Neon PostgreSQL
- [x] Vercel dashboard
- [x] CI pipeline (TypeScript + lint + audit)

## Phase 2: Security API (Q3 2026)

- [ ] REST API: `POST /api/scan`, `GET /api/verdict/:id`
- [ ] OpenAPI 3.0 documentation
- [ ] API key management per license tier
- [ ] Webhook support for verdict callbacks
- [ ] PayPal payment option

## Phase 3: CI/CD Enforcement (Q4 2026)

- [ ] GitHub Actions native action: `teos-sentinel-shield/action`
- [ ] Jenkins plugin
- [ ] GitLab CI integration
- [ ] PR blocking on BLOCK verdicts
- [ ] Team policy configuration UI

## Phase 4: Enterprise Governance (Q1 2027)

- [ ] SOC 2 Type II audit preparation
- [ ] ISO 27001 alignment
- [ ] Custom policy rule editor
- [ ] Multi-tenant organization accounts
- [ ] Audit log export (CSV, JSON, SIEM)

## Phase 5: Sovereign Infrastructure (Q2 2027)

- [ ] On-premise deployment (Docker / Kubernetes)
- [ ] Air-gapped runtime support
- [ ] Custom model integration
- [ ] Sovereign license for government and regulated industries
