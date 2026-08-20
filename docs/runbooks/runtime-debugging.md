# TEOS Runtime Debugging Runbook

## Quick Commands

```bash
# Service status
make ps           # all container states
make health       # all health endpoints
make logs         # live log tail

# Container details
docker stats --no-stream           # CPU/Memory per container
docker inspect <name> | jq '.State'  # full state

# Resource usage
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
```

## Log Investigation

### By time range
```bash
docker compose logs --since=10m        # last 10 minutes
docker compose logs --since="2025-01-01T12:00:00"  # since timestamp
docker compose logs --until=30m        # up to 30 min ago
```

### By severity
```bash
# Pino-structured logs (JSON)
docker compose logs risk-engine | grep '"level":50'     # error
docker compose logs risk-engine | grep '"level":40'     # warn
docker compose logs risk-engine | grep '"level":30'     # info
docker compose logs activation-service | grep '"level":50'
```

### By correlation ID
```bash
# After finding a request ID in an error response:
CID="abc123"
for s in risk-engine activation-service teoslinker-bot; do
  echo "=== $s ==="
  docker compose logs $s | grep "$CID" || echo "(not found)"
done
```

### Common log patterns to watch for
```bash
# Look for these signals across all services:
docker compose logs --since=1h | grep -E "
  (error|Error|ERROR)|
  (uncaught|unhandled)|
  (crash|panic|fatal)|
  (timeout|refused|reset)|
  (OOM|killed|exit)"
```

## Debugging Specific Issues

### Memory leak
```bash
# Monitor memory over time
watch -n 5 'docker stats --no-stream --format "{{.Name}} {{.MemUsage}}"'

# Check heap growth (for Node.js services)
curl -s localhost:8090/metrics-lite | jq .memory
curl -s localhost:3000/metrics-lite | jq .memory

# Enable Node.js heap dump (if needed)
docker exec <container> node -e "process.kill(process.pid, 'SIGUSR2')"
```

### High CPU
```bash
# Identify which container
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}"

# Profile Node.js service
docker exec <container> node -e "
  const v8 = require('v8');
  console.log(JSON.stringify(v8.getHeapStatistics()));
"

# Check for event loop lag
docker exec <container> node -e "
  const start = Date.now();
  setImmediate(() => console.log('Event loop lag:', Date.now() - start, 'ms'));
"
```

### Network issues
```bash
# Check inter-service connectivity
docker exec $(docker ps --filter name=bot --format '{{.ID}}') \
  curl -s -o /dev/null -w "%{http_code}" http://activation-service:8080/health

# Check DNS resolution
docker exec $(docker ps --filter name=bot --format '{{.ID}}') \
  nslookup activation-service 2>/dev/null || echo "no nslookup"

# Verify port binding
netstat -tlnp 2>/dev/null | grep -E "(8090|8080|8082|8081|8000)" || ss -tlnp | grep -E "(8090|8080|8082|8081|8000)"
```

### Database issues (Activation SQLite)
```bash
# Verify database integrity
CID=$(docker ps --filter name=activation --format '{{.ID}}')
docker exec "$CID" sqlite3 /app/activation.db "PRAGMA integrity_check;"

# Check database size
docker exec "$CID" ls -lh /app/activation.db

# Query user count
docker exec "$CID" sqlite3 /app/activation.db "SELECT plan, count(*) FROM users GROUP BY plan;"
```

## Service-Specific Debugging

### Risk Engine (MCP)
```bash
# Check rule set
curl -s localhost:8090/health | jq '.checks'

# Test scan
curl -s -X POST localhost:8090/scan \
  -H 'Content-Type: application/json' \
  -d '{"code":"rm -rf /"}' | jq .

# Check metrics
curl -s localhost:8090/metrics | grep -E "teos_|http_"
```

### Bot
```bash
# Check bot health (port 8082 is Docker-internal)
docker compose logs --tail=20 teoslinker-bot | grep -i "error\|warn\|redis\|token"

# Verify token format
docker exec $(docker ps --filter name=bot --format '{{.ID}}') \
  node -e "console.log(process.env.BOT_TOKEN ? 'set' : 'missing')"
```

### Sentinel Shield
```bash
# Verify rate limiting
curl -s -D - localhost:3000/scan \
  -H 'Content-Type: application/json' \
  -d '{"command":"ls"}' 2>/dev/null | grep -i "rate-limit\|x-request-id"

# Check engine version
curl -s localhost:3000/ | jq .version
```

## Restart Counters

```bash
# Check how many times each container has restarted
docker ps -a --format "{{.Names}} restarted {{.RestartCount}} times"

# Watch for restart loops
watch -n 10 'docker ps -a --format "{{.Names}} restarted {{.RestartCount}} times"'
```

## Common Failure Scenarios

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Container exits immediately | Missing .env or invalid config | Check `docker compose logs <name>` for startup errors |
| All services show 000 in healthcheck | Docker daemon not running | `systemctl start docker` or `open -a Docker` |
| Only one service unhealthy | Service-specific crash | Restart service, check logs for OOM or exception |
| Intermittent 503s | Rate limiting | Check `RateLimit-Remaining` headers; consider increasing limits |
| Redis errors | Redis not started or misconfigured | `docker compose up -d redis`; check REDIS_URL |
| SQLite errors (activation) | Corrupt DB or permission issue | Run `PRAGMA integrity_check`; check `chown` in Dockerfile |
| Bot not responding to commands | Invalid BOT_TOKEN | Regenerate from @BotFather; check for spaces/quotes in .env |
