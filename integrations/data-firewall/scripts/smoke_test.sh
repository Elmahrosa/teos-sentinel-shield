#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:8000}"
SECRET="${GAS_WEBHOOK_SECRET:-}"
TEST_KEY="sk-smoke-test-$(date +%s)"

pass() { echo "✓ $1"; }
fail() { echo "✗ $1"; exit 1; }
info() { echo "→ $1"; }

info "Health check"
HEALTH=$(curl -fsS "$BASE/health")
echo "$HEALTH" | grep -q '"ok"' && pass "health endpoint OK" || fail "health failed: $HEALTH"

info "Metrics endpoint"
curl -fsS "$BASE/metrics" | grep -q "ingestion_requests_total" && pass "metrics OK" || fail "metrics endpoint failed"

if [ -z "$SECRET" ]; then
  echo "GAS_WEBHOOK_SECRET not set — skipping billing bridge smoke test"
  exit 0
fi

info "Register trial key"
REG=$(curl -fsS -X POST "$BASE/internal/register-key" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $SECRET" \
  -d "{\"api_key\":\"$TEST_KEY\",\"plan\":\"trial\",\"tx_hash\":\"0xSMOKETEST\"}")
python3 - <<'PY' <<< "$REG"
import json,sys
assert json.load(sys.stdin)["registered"] is True
PY
pass "key registered"

info "Account balance"
ACCT=$(curl -fsS "$BASE/v1/account" -H "X-API-Key: $TEST_KEY")
python3 - <<'PY' <<< "$ACCT"
import json,sys
assert json.load(sys.stdin)["credits"] == 5
PY
pass "credits correct"

info "Submit ingest job"
JOB=$(curl -fsS -X POST "$BASE/v1/ingest_async" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $TEST_KEY" \
  -d '{"url":"https://example.com"}')
JOB_ID=$(python3 -c "import sys,json; print(json.load(sys.stdin)['job_id'])" <<< "$JOB")
pass "job queued: $JOB_ID"

info "Poll job result"
for i in $(seq 1 15); do
  sleep 1
  STATUS_RESP=$(curl -fsS "$BASE/v1/jobs/$JOB_ID" -H "X-API-Key: $TEST_KEY")
  JOB_STATUS=$(python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" <<< "$STATUS_RESP")
  if [ "$JOB_STATUS" = "completed" ] || [ "$JOB_STATUS" = "failed" ]; then
    pass "job resolved: $JOB_STATUS"
    break
  fi
done

info "Credit deduction"
ACCT2=$(curl -fsS "$BASE/v1/account" -H "X-API-Key: $TEST_KEY")
python3 - <<'PY' <<< "$ACCT2"
import json,sys
assert json.load(sys.stdin)["credits"] == 4
PY
pass "credit deducted"
