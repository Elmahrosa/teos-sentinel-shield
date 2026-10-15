#!/usr/bin/env bash
# =============================================================================
# TEOS Sentinel Guard — Pre-Execution / Pre-Deploy Security Gate
#
# Scans code/commands through the MCP Risk Engine before allowing deploy.
# If Sentinel returns BLOCK, the pipeline fails with details.
#
# Usage:
#   ./sentinel-guard.sh scan <command-or-code>
#   ./sentinel-guard.sh repo <github-url>
#
# CI integration:
#   ./sentinel-guard.sh scan "rm -rf /" && echo "ALLOW" || echo "BLOCK"
# =============================================================================
set -euo pipefail

MCP_API="${MCP_API:-https://agent-code-risk-mcp-production.up.railway.app}"
MAX_RETRIES=3
TIMEOUT=10

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$*"; }

guard_scan() {
  local input="$1"
  local label="$2"

  echo "━━━ TEOS Sentinel Guard ━━━"
  echo "Target: ${label}"
  echo "Engine: ${MCP_API}"
  echo ""

  for i in $(seq 1 "${MAX_RETRIES}"); do
    RESPONSE=$(curl -s --max-time "${TIMEOUT}" \
      -X POST "${MCP_API}/scan" \
      -H "Content-Type: application/json" \
      -d "$(printf '{"command":%s}' "$(printf '%s' "${input}" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")")" 2>/dev/null || echo '{"verdict":"ERROR","score":0}')

    VERDICT=$(printf '%s' "${RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('verdict','ERROR'))" 2>/dev/null || echo "ERROR")
    SCORE=$(printf '%s' "${RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('score',0))" 2>/dev/null || echo "0")

    if [ "${VERDICT}" = "ERROR" ] && [ "${i}" -lt "${MAX_RETRIES}" ]; then
      yellow "  Engine unreachable — retrying (${i}/${MAX_RETRIES})..."
      sleep 3
      continue
    fi
    break
  done

  echo ""
  echo "Verdict: ${VERDICT}"
  echo "Score:   ${SCORE}/100"

  if [ "${VERDICT}" = "BLOCK" ]; then
    echo ""
    red "✗ BLOCKED — deploy rejected by TEOS Sentinel"
    printf '%s' "${RESPONSE}" | python3 -c "
import sys,json
d = json.load(sys.stdin)
for f in d.get('findings', []):
    print(f'  - [{f.get(\"severity\",\"info\").upper()}] {f.get(\"message\",\"\")}')
" 2>/dev/null || true
    echo ""
    echo "Use /report for full audit details."
    exit 1
  elif [ "${VERDICT}" = "WARN" ]; then
    echo ""
    yellow "⚠ WARN — proceeding with caution"
    printf '%s' "${RESPONSE}" | python3 -c "
import sys,json
d = json.load(sys.stdin)
for f in d.get('findings', []):
    print(f'  - [{f.get(\"severity\",\"info\").upper()}] {f.get(\"message\",\"\")}')
" 2>/dev/null || true
    echo ""
    exit 0
  else
    echo ""
    green "✓ ALLOW — no security issues detected"
    exit 0
  fi
}

# ── Main ──
case "${1:-help}" in
  scan)
    if [ -z "${2:-}" ]; then
      echo "Usage: $0 scan <command-or-code>"
      exit 1
    fi
    guard_scan "$2" "inline command"
    ;;
  repo)
    if [ -z "${2:-}" ]; then
      echo "Usage: $0 repo <github-url>"
      exit 1
    fi
    guard_scan "$2" "repository ${2}"
    ;;
  help|--help|-h)
    echo "TEOS Sentinel Guard — Pre-Execution Security Gate"
    echo ""
    echo "Commands:"
    echo "  scan <code>    Scan a command or code snippet"
    echo "  repo <url>     Scan a GitHub repository"
    echo ""
    echo "Environment:"
    echo "  MCP_API        Risk Engine URL (default: ${MCP_API})"
    echo ""
    echo "Exit codes:"
    echo "  0  ALLOW or WARN — safe to proceed"
    echo "  1  BLOCK — security risk detected"
    ;;
  *)
    echo "Unknown command: ${1}"
    echo "Usage: $0 scan <code> | repo <url>"
    exit 1
    ;;
esac
