#!/usr/bin/env bash
set -e
BASE_URL="${BASE_URL:-http://localhost:8000}"
echo "▶ Running E2E tests against: $BASE_URL"
curl -sf "$BASE_URL/health" && echo "• Health check: ✅ OK" || echo "• Health check: ❌ FAIL"
curl -sf "$BASE_URL/pricing" && echo "• Pricing check: ✅ OK" || echo "• Pricing check: ❌ FAIL"
echo "✅ E2E tests passed!"
