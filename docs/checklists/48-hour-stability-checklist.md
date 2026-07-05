# 48-Hour Stability Checklist

Run this **2 days before** inviting the first closed beta user. Complete all checks before sending invitations.

## Pre-Check (2 min)

```bash
make health     # all 5 services "ok"
make ps         # all 7 containers running
make logs       # no ERROR or CRASH in last 5 min
```

## Hour 0 — Deploy & Sanity

- [ ] `make build` completes without errors
- [ ] `make up` — all containers start within 30 seconds
- [ ] `curl -s localhost:8090/live | jq .status` → `"ok"`
- [ ] `curl -s localhost:8080/live | jq .alive` → `true`
- [ ] `curl -s localhost:8082/health | jq .service` → `"teoslinker-bot"`
- [ ] `curl -s localhost:8000/health` returns 200
- [ ] `curl -s localhost:3000/` returns 200 (sentinel-shield, if local)
- [ ] All 5 UptimeRobot monitors show **"Up"** within 5 minutes

## Hour 1 — Auth & Security

- [ ] `POST /consume` without `x-service-token` → `401`
- [ ] `POST /consume` with wrong `x-service-token` → `401`
- [ ] `POST /consume` with valid `x-service-token` → `200`
- [ ] Helmet headers present on all responses: `x-content-type-options: nosniff`
- [ ] Rate-limit headers present: `RateLimit-Limit`, `RateLimit-Remaining`
- [ ] 150 rapid requests trigger `429` on at least 1 response
- [ ] `POST /scan` with `rm -rf /` → `BLOCK` decision
- [ ] `POST /scan` with `ls -la` → `ALLOW` decision
- [ ] `POST /api/ci/scan` without token → `401`

## Hour 2 — Performance

- [ ] Cold start response time < 500ms on each service
- [ ] Sustained load (100 requests/min) — no 503 or 500 errors
- [ ] Memory: each container < 200MB RSS
- [ ] Error rate < 1% over 500 requests
- [ ] P99 latency < 2 seconds

## Hour 6 — Resilience

- [ ] Kill and restart each container — recovers without manual intervention
- [ ] `docker restart redis` — other services reconnect without crash
- [ ] `docker stop risk-engine` — healthcheck catches it within 30s
- [ ] `docker start risk-engine` — auto-rejoins the mesh, services recover

## Hour 12 — Logging & Monitoring

- [ ] All service logs are structured JSON (pino format)
- [ ] No stack traces or error leaks in log output
- [ ] `healthcheck.sh` runs without false positives
- [ ] UptimeRobot SSL expiration dates are > 7 days

## Hour 24 — Security Re-Check

- [ ] `npm test` passes in MCP (11 tests), Activation (18), Bot (15)
- [ ] `node test/engine-test.js` passes all 20 engine tests
- [ ] No placeholder secrets remain in `.env` (run `grep -i changeme .env`)
- [ ] `ACTIVATION_AUTH_TOKEN` is identical in bot and activation `.env`
- [ ] All `.env` files are in `.gitignore`
- [ ] Supabase/Redis credentials are valid (if applicable)

## Hour 48 — Final Readiness

- [ ] UptimeRobot shows 99%+ uptime over 48 hours
- [ ] No repeated error logs in any service
- [ ] Redis memory usage is stable (< 100MB)
- [ ] SQLite database size is reasonable (< 10MB)
- [ ] Bot responds to `/start`, `/help`, `/token`, `/scan` commands
- [ ] PDF report generation completes without timeout (if configured)
- [ ] All `MUST SET` markers in `.env.production` have real values
- [ ] Main contact is on-call for the first 24 hours of beta

## Quick Script

Copy-paste this to run the key checks:

```bash
echo "=== Health ==="
for p in 8090/live 8080/live 8082/health 8000/health; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "localhost/$p" 2>/dev/null || echo "000")
  echo "  :$p → $status"
done

echo "=== Auth ==="
echo "  No token: $(curl -s -o /dev/null -w "%{http_code}" -X POST localhost:8080/consume)"
echo "  Wrong token: $(curl -s -o /dev/null -w "%{http_code}" -X POST -H 'x-service-token: wrong' localhost:8080/consume)"

echo "=== Security ==="
echo "  X-CT-Options: $(curl -s -I localhost:8090/live | grep -i x-content-type-options | tr -d '\r')"

echo "=== Engine ==="
curl -s -X POST localhost:8090/scan \
  -H 'Content-Type: application/json' \
  -d '{"code":"rm -rf /"}' | jq '.decision'
```

Mark all items as `[x]` before opening invites.
