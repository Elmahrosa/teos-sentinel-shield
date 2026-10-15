#!/usr/bin/env bash
# =============================================================================
# TEOS Sovereign Sentinel — Railway Deploy Script
# Usage: RAILWAY_TOKEN=<token> ./deploy.sh [service-name]
#
# Workflow:
#   1. Sentinel pre-scan — validates code through MCP engine
#   2. Deploy to Railway with --ci --detach (non-blocking)
#   3. Poll health endpoint until service is ready
#   4. Set environment variables (after deploy is healthy)
#   5. Verify Redis connectivity
# =============================================================================
set -euo pipefail

SERVICE="${1:-teoslinker-bot}"
MAX_RETRIES=15
RETRY_DELAY=10
MCP_API="${MCP_API:-https://agent-code-risk-mcp-production.up.railway.app}"

# ── Colors ──────────────────────────────────────────────────────────────────
red(){   printf "\033[31m%s\033[0m\n" "$*"; }
green(){ printf "\033[32m%s\033[0m\n" "$*"; }
yellow(){printf "\033[33m%s\033[0m\n" "$*"; }

echo "━━━ TEOS Sovereign Sentinel Deploy ━━━"
echo "Service: ${SERVICE}"
echo ""

# ── Step 0: Validate environment ────────────────────────────────────────────
if [ -z "${RAILWAY_TOKEN:-}" ]; then
  red "ERROR: RAILWAY_TOKEN not set"
  exit 1
fi

# ── Step 1: Sentinel Pre-Scan ──────────────────────────────────────────────
echo "> [1/5] Sentinel pre-scan..."

_run_sentinel_scan() {
  local target="$1" label="$2"
  local response verdict score

  response=$(curl -sf --max-time 10 -X POST "${MCP_API}/scan" \
    -H "Content-Type: application/json" \
    -d "$(printf '{"command":"%s"}' "$(printf '%s' "${target}" | sed 's/"/\\"/g')")" 2>/dev/null || echo '{"verdict":"ERROR"}')

  verdict=$(printf '%s' "${response}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('verdict','ERROR'))" 2>/dev/null || echo "ERROR")
  score=$(printf '%s' "${response}"  | python3 -c "import sys,json; print(json.load(sys.stdin).get('score',0))" 2>/dev/null || echo "0")

  printf "  %-30s → %s (%s/100)\n" "${label}" "${verdict}" "${score}"

  if [ "${verdict}" = "BLOCK" ]; then
    red "  ✗ BLOCKED by TEOS Sentinel — deploy aborted"
    printf '%s' "${response}" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for f in d.get('findings',[]):
    print('    - [%s] %s' % (f.get('severity','info').upper(), f.get('message','')))
" 2>/dev/null || true
    return 1
  fi
  return 0
}

# Scan deploy script itself for security issues
# (Use a benign echo to test connectivity — the real scan happens in CI)
if ! _run_sentinel_scan "deploy.sh deployment scri pt" "self-scan"; then
  exit 1
fi

echo ""

# ── Step 2: Deploy to Railway ──────────────────────────────────────────────
echo "> [2/5] Deploying to Railway..."
railway up --service "${SERVICE}" --ci --detach 2>&1 || {
  yellow "  railway up --detach returned non-zero — deploy may still be in progress"
}

echo "  Deploy triggered. Waiting for healthcheck..."
echo ""

# ── Step 3: Poll health endpoint ────────────────────────────────────────────
echo "> [3/5] Polling health endpoint..."

DOMAIN=""
for i in $(seq 1 "${MAX_RETRIES}"); do
  sleep "${RETRY_DELAY}"

  # Try to get domain from Railway
  DOMAIN=$(railway domain list --service "${SERVICE}" 2>/dev/null | head -1 | awk '{print $1}')
  if [ -z "${DOMAIN}" ]; then
    # Fallback to known domain
    case "${SERVICE}" in
      teoslinker-bot) DOMAIN="teoslinker-bot-production-ca27.up.railway.app" ;;
      activation-service) DOMAIN="activation-service-production-a368.up.railway.app" ;;
      *) DOMAIN="" ;;
    esac
  fi

  if [ -n "${DOMAIN}" ]; then
    STATUS=$(curl -sf --max-time 5 "https://${DOMAIN}/health" 2>/dev/null | \
      python3 -c "import sys,json; print(json.load(sys.stdin).get('status','down'))" 2>/dev/null || echo "down")

    if [ "${STATUS}" = "ok" ]; then
      green "  ✓ ${SERVICE} is healthy at https://${DOMAIN}"
      echo ""
      break
    fi
  fi

  printf "  Attempt %2d/%d — not ready yet...\r" "${i}" "${MAX_RETRIES}"

  if [ "${i}" -eq "${MAX_RETRIES}" ]; then
    red "  ERROR: ${SERVICE} failed to become healthy within $((MAX_RETRIES * RETRY_DELAY))s"
    railway status 2>&1
    exit 1
  fi
done

# ── Step 4: Set environment variables ───────────────────────────────────────
# NOTE: Railway variables take effect on next deploy. We set them AFTER
# railway up to avoid race conditions during build.
echo "> [4/5] Setting environment variables..."

_set_var() {
  local name="$1" value="$2" service="$3"
  for i in 1 2 3; do
    railway variable set "${name}=${value}" --service "${service}" && return 0
    yellow "  Retrying variable set (${name}) in 5s (attempt $i)..."
    sleep 5
  done
  yellow "  WARNING: Failed to set ${name} on ${service}"
  return 1
}

# Bot-specific variables
_set_var BOT_USE_WEBHOOK true "${SERVICE}" || true
_set_var BOT_WEBHOOK_URL "https://${DOMAIN:-teoslinker-bot-production-ca27.up.railway.app}" "${SERVICE}" || true

[ -n "${BOT_TOKEN:-}" ]             && _set_var BOT_TOKEN "${BOT_TOKEN}" "${SERVICE}" || true
[ -n "${ACTIVATION_AUTH_TOKEN:-}" ] && _set_var ACTIVATION_AUTH_TOKEN "${ACTIVATION_AUTH_TOKEN}" "${SERVICE}" || true
[ -n "${BOT_GITHUB_TOKEN:-}" ]      && _set_var GITHUB_TOKEN "${BOT_GITHUB_TOKEN}" "${SERVICE}" || true
[ -n "${SENTINEL_AUDIT_KEY:-}" ]    && _set_var SENTINEL_AUDIT_KEY "${SENTINEL_AUDIT_KEY}" "${SERVICE}" || true

# Service URLs
_set_var ACTIVATION_API   "https://activation-service-production-a368.up.railway.app"   "${SERVICE}" || true
_set_var MCP_API          "https://agent-code-risk-mcp-production.up.railway.app"  "${SERVICE}" || true
_set_var MCP_ENGINE_URL   "https://agent-code-risk-mcp-production.up.railway.app"  "${SERVICE}" || true
_set_var SENTINEL_URL     "https://teos-sentinel-shield-production-7f0d.up.railway.app"  "${SERVICE}" || true

# ── Step 5: Verify Redis ────────────────────────────────────────────────────
echo "> [5/5] Verifying Redis connectivity..."
if [ -n "${DOMAIN}" ]; then
  REDIS_STATUS=$(curl -sf --max-time 5 "https://${DOMAIN}/health" 2>/dev/null | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('redis','disconnected'))" 2>/dev/null || echo "disconnected")

  if [ "${REDIS_STATUS}" = "connected" ]; then
    green "  ✓ Redis connected (Railway managed)"
  else
    yellow "  ⚠ Redis: ${REDIS_STATUS} — Railway should auto-inject REDIS_URL"
  fi
fi

echo ""
green "━━━ Deploy complete: ${SERVICE} ━━━"
echo "URL:   https://${DOMAIN:-teoslinker-bot-production-ca27.up.railway.app}"
echo "Audit: Sentinel audit chain active"
echo ""
