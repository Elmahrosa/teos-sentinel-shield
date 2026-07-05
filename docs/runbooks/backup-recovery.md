# TEOS Backup & Recovery Runbook

## Data Locations

| Data | Location | Service | Backup Method |
|------|----------|---------|---------------|
| User credits | `services/teos-activation-service/activation.db` | Activation | SQLite dump |
| Audit logs | Supabase Postgres (or `ingestion.db`) | Sentinel / Safe Ingestion | Supabase export |
| Scan events | Upstash Redis | Bot/Sentinel | Ephemeral (rebuilt) |
| Docker volumes | `./data/` | Orchestrator | File copy |

## Backup Commands

### SQLite Backup (Activation Service)

```bash
# Create backup
docker exec $(docker ps --filter name=activation --format '{{.ID}}') \
  sqlite3 /app/activation.db ".backup /tmp/activation-backup.db"

# Copy to host
docker cp $(docker ps --filter name=activation --format '{{.ID}}'):/tmp/activation-backup.db \
  ./data/backups/activation-$(date +%Y%m%d-%H%M).db

# Verify backup
sqlite3 ./data/backups/activation-*.db "SELECT count(*) as users FROM users;"
```

### Docker Volumes

```bash
# Backup data directory
tar -czf ./data/backups/teos-data-$(date +%Y%m%d-%H%M).tar.gz \
  ./data/ \
  --exclude=./data/logs
```

### Log Archives

```bash
# Export and compress logs
bash scripts/export-logs.sh
# Archives go to: ./data/logs/teos-logs-*.tar.gz
```

## Automated Backup (cron)

Add to crontab for daily backups:

```crontab
# TEOS Daily Backup — 2 AM
0 2 * * * /path/to/teos/scripts/backup.sh

# TEOS Log Archival — midnight
0 0 * * * /path/to/teos/scripts/export-logs.sh
```

Create `scripts/backup.sh`:

```bash
#!/bin/bash
set -euo pipefail
BACKUP_DIR="./data/backups"
mkdir -p "$BACKUP_DIR"

# SQLite
CID=$(docker ps --filter name=activation --format '{{.ID}}' | head -1)
if [ -n "$CID" ]; then
  docker exec "$CID" sqlite3 /app/activation.db ".backup /tmp/activation-backup.db"
  docker cp "$CID":/tmp/activation-backup.db "$BACKUP_DIR/activation-$(date +%Y%m%d).db"
  echo "[backup] Activation DB saved"
fi

# Data directory
tar -czf "$BACKUP_DIR/teos-data-$(date +%Y%m%d).tar.gz" \
  ./data/ --exclude=./data/logs --exclude=./data/backups 2>/dev/null || true
echo "[backup] Data directory archived"

# Prune backups older than 30 days
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
echo "[backup] Pruned backups older than 30 days"
```

## Recovery Scenarios

### Loss of activation.db

```bash
# 1. Stop activation service
docker compose stop activation-service

# 2. Restore from backup
docker cp ./data/backups/activation-20250101.db \
  $(docker ps --filter name=activation --format '{{.ID}}'):/app/activation.db

# 3. Restart
docker compose start activation-service

# 4. Verify
curl -s localhost:8080/health | jq .
```

### Loss of .env files

```bash
# 1. Restore from .env.example
cp .env.example .env

# 2. Regenerate all secrets
openssl rand -hex 32  # for each MUST SET value

# 3. Check all .env files are present
ls -la services/*/.env

# 4. Restart services
make down && make up
```
