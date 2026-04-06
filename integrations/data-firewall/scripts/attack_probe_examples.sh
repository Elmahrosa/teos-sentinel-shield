#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:8000}"
KEY="${2:-sk-safe-TESTKEY000}"

payloads=(
  'http://127.0.0.1/'
  'http://127.1/'
  'http://0.0.0.0/'
  'http://169.254.169.254/latest/meta-data/'
  'http://[::1]/'
  'http://localhost/'
  'javascript:alert(1)'
)

for url in "${payloads[@]}"; do
  echo "== Testing $url"
  curl -sS -X POST "$BASE/v1/ingest_async" \
    -H "X-API-Key: $KEY" \
    -H 'Content-Type: application/json' \
    -d "{\"url\":\"$url\"}" || true
  echo
  echo
  sleep 1
done
