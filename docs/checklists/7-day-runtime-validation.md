# TEOS — 7-Day Runtime Validation

Run this validation daily during the first week of closed beta. Each day adds new checks.

## Day 1 — Deployment Integrity

```bash
# Architecture verification
make ps                          # all 6 containers running
make health                      # all 5 services healthy
docker compose logs --since=1h | grep -c "error\|Error\|ERROR"  # zero errors expected

# Version verification
curl -s localhost:8090/version  | jq .
curl -s localhost:8080/version  | jq .
curl -s localhost:3000/version  | jq .

# Security verification
curl -s -I localhost:8090/live  | grep -i x-content-type-options  # nosniff
curl -s -I localhost:8090/live  | grep -i x-request-id            # correlation header

# Logging verification
curl -s localhost:8090/version 2>/dev/null && docker compose logs --since=1m risk-engine | tail -3 | python -c "import sys,json;json.loads(sys.stdin.read());print('JSON logs OK')"

# Correlation ID verification
CID=$(curl -s -I localhost:3000/ 2>&1 | grep -i x-request-id | tr -d '\r' | awk '{print $2}')
echo "X-Request-ID: $CID"
```

## Day 2 — Load & Performance

```bash
# Quick load test (sequential, not destructive)
for i in $(seq 1 50); do
  curl -s -X POST localhost:8090/scan \
    -H 'Content-Type: application/json' \
    -d '{"code":"ls -la"}' > /dev/null 2>&1
done
echo "50 scans completed"

# Check for errors
docker compose logs --since=10m | grep -c "error\|Error\|ERROR"

# Response times from logs
docker compose logs --since=10m risk-engine | grep '"duration":' | head -5

# Memory check
docker stats --no-stream --format "table {{.Name}}\t{{.MemPerc}}\t{{.MemUsage}}"
# Expect: each service < 200MB RSS
```

## Day 3 — Resilience

```bash
# Restart each service and verify recovery
bash scripts/runtime-validation/01-container-restart.sh

# Check for data loss
curl -s localhost:8080/health | jq .version  # version should be consistent
```

## Day 4 — Monitoring

```bash
# Verify healthcheck.sh alerts (dry run)
bash healthcheck.sh ; echo "Exit code: $?"

# Check downtime log
cat data/downtime.log | tail -5

# Check UptimeRobot status (manual — log into dashboard)
# All 5 monitors should show 99%+ uptime
```

## Day 5 — Security Re-Check

```bash
# No placeholder secrets
grep -r "changeme\|placeholder" services/*/.env 2>/dev/null || echo "No placeholder secrets"

# Verify auth
TOKEN=$(grep ACTIVATION_AUTH_TOKEN services/teos-activation-service/.env | cut -d= -f2)
curl -s -o /dev/null -w "%{http_code}" -X POST localhost:8080/consume   # 401 (no token)
curl -s -o /dev/null -w "%{http_code}" -X POST localhost:8080/consume -H "x-service-token: $TOKEN" -d '{"userId":"t","amount":1}'  # 200

# Test BLOCK still works
curl -s -X POST localhost:8090/scan -H 'Content-Type: application/json' -d '{"code":"rm -rf /"}' | jq .decision  # "BLOCK"
```

## Day 6 — Recovery Validation

```bash
# Simulate Redis outage (non-destructive)
bash scripts/runtime-validation/02-redis-outage.sh

# Full dependency recovery test
bash scripts/runtime-validation/03-dependency-recovery.sh

# Healthcheck recovery test
bash scripts/runtime-validation/04-healthcheck-recovery.sh
```

## Day 7 — Stability Certification

```bash
# Uptime calculation
TOTAL_SEC=$(docker inspect $(docker ps --filter name=risk-engine --format '{{.ID}}') | jq '.[0].State.StartedAt' | xargs -I{} date -d {} +%s)
NOW=$(date +%s)
UPTIME=$((NOW - TOTAL_SEC))
echo "Risk Engine uptime: $((UPTIME / 86400)) days $(((UPTIME % 86400) / 3600)) hours"

# Error rate
TOTAL_REQS=$(curl -s localhost:8090/metrics | grep http_requests_total | grep -v "^#" | awk '{print $2}' | paste -sd+ | bc)
ERROR_REQS=$(curl -s localhost:8090/metrics | grep http_errors_total | grep -v "^#" | awk '{print $2}' | paste -sd+ | bc)
if [ -n "$TOTAL_REQS" ] && [ "$TOTAL_REQS" -gt 0 ]; then
  RATE=$(echo "scale=4; $ERROR_REQS / $TOTAL_REQS * 100" | bc)
  echo "Error rate: ${RATE}%"
fi

# Log growth
du -sh data/logs/ 2>/dev/null || echo "No log archive yet"

# Final health
make health
```

## Pass/Fail Criteria

| Metric | Pass | Fail | Action |
|--------|------|------|--------|
| All services healthy | 5/5 | <5/5 | Investigate and restart |
| 24h error count | <10 errors | >10 errors | Review logs for patterns |
| Memory per service | <200MB RSS | >300MB RSS | Investigate leak |
| Restart count | <3 per service | >5 per service | Investigate crash loop |
| Healthcheck alert count | <3 | >5 | Review alert configuration |
| Log growth | <50MB/day | >100MB/day | Increase log rotation limits |

## Sign-off

After Day 7 passes all criteria, the system is certified stable for closed beta.
