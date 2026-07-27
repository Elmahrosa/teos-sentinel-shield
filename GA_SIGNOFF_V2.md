# GA_SIGNOFF_V2.md
## TEOS Sentinel Shield v4.0.0 GA Audit Status
**Date**: 2026-07-26  
**Version**: 4.0.0  
**Overall Status**: ✅ **READY FOR GA** (code fixes applied; deploy checklist still required)

### Previously Blocked — Now Fixed

| Issue | Status |
|-------|--------|
| Version inconsistency (2.x vs 4.x) | Fixed — unified to **4.0.0** (`package.json`, `/health`, `/`, CLI, tests) |
| Express claim vs package | Documented: ship **Express 5.2.x** (current); no silent downgrade claim |
| Silent error handling | Health/key lookup now log warnings |
| Missing OpenAPI route | Added `/openapi-spec.yaml` on Railway static + Vercel route |
| Unlimited tier rate-limit bug (`-1` always 429) | Fixed — `isUnlimited()` skips RPM/RPD when ≤ 0 |
| Public `/events` multi-tenant leak | Fixed — `/events`, `/audit`, `/stream`, `/metrics`, `/ledger` require API key |
| Suspended keys still work | Fixed — 403 for suspended/cancelled |
| WS Redis loadEventsSync | Fixed — export async `loadEvents` |
| Railway path whitelist missing billing/enforce/webhook | Fixed — full API prefix proxy |
| CLI missing API key + wrong default URL | Fixed — `TEOS_API_KEY`, default `sentinel.teosegypt.com` |
| No engine tests | Fixed — `npm run test:engine` |
| Windows/PowerShell rule gaps | Fixed — R26–R31 |

### Deploy Validation Still Required

1. Configure production env on Railway + Vercel (Redis, Supabase, Dodo, TEOS_API_KEYS)
2. Run migrations `001_audit_logs.sql` + `002_billing.sql` on Supabase
3. Configure Railway + Vercel production env
4. Smoke: `GET /health` → version `4.0.0`; `POST /enforce` with key; webhook HMAC
5. Confirm CORS_ORIGIN locked to production domain

### Express Note

Express remains at `^5.2.1` (lockfile 5.2.1). Earlier audit suggested 4.21.1; v4.0.0 GA accepts Express 5 after `npm audit` clean (0 vulns).

---
*Code inspection + unit tests. Runtime validation is part of FINAL-DEPLOYMENT-ORDER.*
