#!/usr/bin/env bash
# =============================================================================
# TEOS Enterprise — Health Probes
# =============================================================================
# Readiness and liveness probes for all TEOS services.
# Returns JSON-formatted status for integration with monitoring systems.
#
# Usage:  bash monitoring/probes.sh             (all probes)
#         bash monitoring/probes.sh --liveness   (liveness only)
#         bash monitoring/probes.sh --readiness  (readiness only)
# =============================================================================
set -euo pipefail

MODE="${1:-all}"

# Service definitions: name:url:health_endpoint:readiness_endpoint
SERVICES=(
  "bot:https://teoslinker-bot-production.up.railway.app:/live:/ready"
  "risk-engine:https://agent-code-risk-mcp-production-b97d.up.railway.app:/live:/ready"
  "activation:https://activation-service-production-4228.up.railway.app:/live:/ready"
  "shield:https://teos-sentinel-shield-production-ef7a.up.railway.app:/health:/health"
)

RESULTS='[]'
FIRST=true

for entry in "${SERVICES[@]}"; do
  IFS=':' read -r name base_url live_path ready_path <<< "$entry"
  result="{\"service\":\"$name\""

  if [[ "$MODE" == "all" || "$MODE" == "--liveness" ]]; then
    live_code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 5 "${base_url}${live_path}" 2>/dev/null || echo "000")
    result="$result,\"liveness\":\"$live_code\""
  fi

  if [[ "$MODE" == "all" || "$MODE" == "--readiness" ]]; then
    ready_code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 5 "${base_url}${ready_path}" 2>/dev/null || echo "000")
    result="$result,\"readiness\":\"$ready_code\""
  fi

  # Dependency health
  if [[ "$MODE" == "all" ]]; then
    dep_status="unknown"
    if [ "$name" == "bot" ]; then
      dep_check=$(curl -sf --max-time 5 "${base_url}/health" 2>/dev/null || echo "")
      if echo "$dep_status" | python3 -c "import sys,json; sys.exit(0 if 'redis' in json.loads(sys.stdin.read()) else 1)" 2>/dev/null; then
        dep_status="connected"
      fi
    fi
    result="$result,\"dependencies\":\"$dep_status\""
  fi

  result="$result}"
  if $FIRST; then
    RESULTS="[$result"
    FIRST=false
  else
    RESULTS="${RESULTS},${result}"
  fi
done

RESULTS="${RESULTS}]"

# Output JSON
echo "$RESULTS" | python3 -m json.tool 2>/dev/null || echo "$RESULTS"

# Exit with status
if echo "$RESULTS" | python3 -c "
import sys, json
data = json.loads(sys.stdin.read())
failed = [s['service'] for s in data if s.get('liveness','') != '200' or s.get('readiness','') != '200']
sys.exit(0 if not failed else 1)
" 2>/dev/null; then
  exit 0
else
  exit 1
fi
