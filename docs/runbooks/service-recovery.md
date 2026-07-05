# TEOS Service Recovery Runbook

## Recovery Checklist

For each service that needs recovery:

```bash
# 1. Check current state
make ps
docker compose logs --tail=20 <service-name>

# 2. Restart service
docker compose restart <service-name>

# 3. Wait for health (up to 30s)
for i in $(seq 1 15); do
  sleep 2
  make health 2>/dev/null && break
done

# 4. Verify after recovery
curl -s http://localhost:<port>/health | jq .
```

## Per-Service Recovery

### Risk Engine (MCP) — port 8090

Symptoms: `/scan` returns 5xx, `/live` returns non-200

```bash
# Check
curl -s localhost:8090/live | jq .
docker compose logs --tail=30 risk-engine

# Restart
docker compose restart risk-engine

# Verify
curl -s -X POST localhost:8090/scan \
  -H 'Content-Type: application/json' \
  -d '{"code":"ls -la"}' | jq .decision
# Should return: "ALLOW"
```

### Activation Service — port 8080

Symptoms: `/consume` fails, `/health` non-200, SQLite errors

```bash
# Check
curl -s localhost:8080/health | jq .
docker compose logs --tail=30 activation-service

# Verify SQLite (inside container)
docker exec -it $(docker ps --filter name=activation --format '{{.ID}}') \
  sqlite3 /app/activation.db "SELECT count(*) FROM users;"

# Restart
docker compose restart activation-service

# Verify auth
TOKEN=$(grep ACTIVATION_AUTH_TOKEN services/teos-activation-service/.env | cut -d= -f2)
curl -s -X POST localhost:8080/consume \
  -H "Content-Type: application/json" \
  -H "x-service-token: $TOKEN" \
  -d '{"userId":"test","amount":1}' | jq .
```

### Telegram Bot — port 8082 (internal)

Symptoms: Bot not responding to commands, `/health` non-200

```bash
# Check
curl -s localhost:8082/health 2>/dev/null || echo "port not published"
docker compose logs --tail=30 teoslinker-bot

# Restart
docker compose restart teoslinker-bot

# Test via Telegram
# Send /health to @teoslinker_bot — should respond with status
```

### Sentinel Shield — port 8081

Symptoms: Dashboard unreachable, `/health` non-200

```bash
# Check
curl -s https://teos-sentinel-shield-production-ef7a.up.railway.app/health | jq .

# For local deployment
docker compose restart sentinel-shield
```

### Safe Ingestion — port 8000

Symptoms: Ingestion fails, `/health` non-200

```bash
# Check
curl -s localhost:8000/health | jq .
docker compose logs --tail=30 safe-ingestion

# Restart
docker compose restart safe-ingestion

# Verify
curl -s localhost:8000/health | jq .status
```

### Redis — port 6379

Symptoms: All services logging Redis errors, degraded performance

```bash
# Check
docker compose ps redis
docker compose logs --tail=10 redis

# Restart
docker compose restart redis

# Verify reconnection (check any dependent service)
docker compose logs --since=30s teoslinker-bot | grep -i redis
```

## Full Stack Recovery

If all services are down or inconsistent:

```bash
# 1. Full stop
make down

# 2. Clean volumes (if needed — WARNING: destroys SQLite data)
# docker compose down -v

# 3. Rebuild (if code changed)
make build

# 4. Start fresh
make up

# 5. Wait for all healthy (up to 60s)
sleep 10
make health

# 6. End-to-end test
curl -s localhost:8090/live | jq .
curl -s localhost:8080/live | jq .
curl -s localhost:8000/health | jq .
```

## Expected Recovery Times

| Service | Cold Start | Restart | Crash Recovery |
|---------|-----------|---------|----------------|
| Risk Engine | 5-8s | 2-4s | <10s |
| Activation | 3-5s | 1-3s | <8s |
| Bot | 4-6s | 2-3s | <8s |
| Sentinel | 8-12s | 3-5s | <15s |
| Safe Ingestion | 6-10s | 3-5s | <12s |
| Redis | 1-2s | 0.5-1s | <3s |
