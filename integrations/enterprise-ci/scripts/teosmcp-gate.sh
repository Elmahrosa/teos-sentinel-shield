#!/usr/bin/env bash
set -euo pipefail

DIFF_PATH="${1:-}"
if [[ -z "$DIFF_PATH" || ! -f "$DIFF_PATH" ]]; then
  echo "Missing diff file path"
  exit 2
fi

: "${TEOSMCP_URL:?Set TEOSMCP_URL in GitHub Secrets}"
: "${TEOSMCP_API_KEY:?Set TEOSMCP_API_KEY in GitHub Secrets}"

DIFF_CONTENT="$(cat "$DIFF_PATH" | sed 's/\r$//')"

echo "Sending diff to TeosMCP..."
RESP="$(curl -sS -X POST "${TEOSMCP_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TEOSMCP_API_KEY}" \
  -d "$(jq -n --arg diff "$DIFF_CONTENT" '{diff: $diff, mode:"ci"}')")"

echo "Response: $RESP"

VERDICT="$(echo "$RESP" | jq -r '.verdict // .decision // empty')"
REASON="$(echo "$RESP" | jq -r '.reason // .message // empty')"

if [[ -z "$VERDICT" ]]; then
  echo "TeosMCP returned no verdict field. Update jq path to match your API response."
  exit 3
fi

echo "TeosMCP verdict: $VERDICT"
if [[ -n "$REASON" ]]; then
  echo "Reason: $REASON"
fi

if [[ "$VERDICT" == "BLOCK" ]]; then
  echo "❌ BLOCKED by TeosMCP"
  exit 1
fi

echo "✅ Allowed by TeosMCP"
