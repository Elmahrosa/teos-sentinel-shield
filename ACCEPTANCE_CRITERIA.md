# TEOS Sentinel Shield v4.0.0 Acceptance Criteria

## Sprint / GA Gates

1. Version string is **4.0.0** across package.json, health, root, CLI, metrics
2. Rate limiter treats rpm/rpd `-1` as unlimited (enterprise day, sovereign both)
3. Suspended/cancelled API keys return HTTP 403
4. `/events`, `/events/stream`, `/audit`, `/audit/summary`, `/ledger/verify`, `/metrics` require API key
5. `/health` and `/stats` remain public (stats = aggregates only)
6. WebSocket uses async Redis-aware `loadEvents`
7. Railway unified server proxies all API prefixes (scan, enforce, billing, webhook, …)
8. CLI sends `X-API-Key`, defaults API URL to `https://sentinel.teosegypt.com`, fail-closed
9. Engine has ≥ 31 rules including Windows/PowerShell/K8s/cloud (R26–R31)
10. `npm run test:engine` exits 0
11. `npm audit` reports 0 vulnerabilities
12. OpenAPI available at `/openapi-spec.yaml` on unified server
13. Dodo webhook verifies HMAC + timestamp window
14. No production secrets committed; `.env.production` gitignored
15. ARCHITECTURE.md matches actual repo layout
16. Hostinger target documented: `sentinel.teosegypt.com`
