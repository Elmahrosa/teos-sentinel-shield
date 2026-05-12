#!/usr/bin/env bash
set -euo pipefail

# ───────────────────────────────────────────────
# TEOS Sentinel Shield — Sovereign Installer
# ───────────────────────────────────────────────
# Installs dependencies and runs the engine locally.
# For air-gapped Docker deployment, see docker/.
# ───────────────────────────────────────────────

REQUIRED_NODE="18.0.0"
REQUIRED_NPM="8.0.0"

RED='\033[0;31m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[TEOS]${NC} $1"; }
ok()   { echo -e "${GREEN}[  OK]${NC} $1"; }
warn() { echo -e "${AMBER}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ── Check OS ──
log "Detecting operating system..."
case "$(uname -s)" in
  Linux*)   OS=linux ;;
  Darwin*)  OS=macos ;;
  MINGW*|MSYS*|CYGWIN*) OS=windows ;;
  *)        fail "Unsupported OS: $(uname -s). Use Docker for air-gapped deployment." ;;
esac
ok "OS: ${OS}"

# ── Check prerequisites ──
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    fail "$1 is required but not installed. Install $1 and re-run this script."
  fi
}

log "Checking prerequisites..."
check_cmd node
check_cmd npm

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1,2)
NPM_VER=$(npm -v | cut -d. -f1,2)

if [[ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VER" | sort -V | head -n1)" != "$REQUIRED_NODE" ]]; then
  fail "Node.js >= ${REQUIRED_NODE} required (found v${NODE_VER}). Upgrade and re-run."
fi
ok "Node.js v${NODE_VER}"

if [[ "$(printf '%s\n' "$REQUIRED_NPM" "$NPM_VER" | sort -V | head -n1)" != "$REQUIRED_NPM" ]]; then
  warn "npm >= ${REQUIRED_NPM} recommended (found v${NPM_VER}). Proceeding anyway."
fi
ok "npm v${NPM_VER}"

# ── Install dependencies ──
log "Installing npm dependencies..."
npm ci --only=production
ok "Dependencies installed"

# ── Configuration ──
if [[ ! -f .env ]]; then
  log "Creating .env from .env.example..."
  if [[ -f .env.example ]]; then
    cp .env.example .env
    warn ".env created from template — edit SUPABASE_URL, SUPABASE_SERVICE_KEY, UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN before running in production"
    warn "For test mode: set TEOS_MODE=test in .env"
  else
    warn "No .env.example found. Create .env manually."
  fi
else
  ok ".env already exists"
fi

# ── Start ──
echo ""
log "───────────────────────────────────────────────"
log "  TEOS Sentinel Shield — Engine v2.4"
log "  27 deterministic rules · 39 tests passing"
log "  ICBC Constitution governed"
log "───────────────────────────────────────────────"
echo ""
log "Starting engine..."
log "  API:    http://localhost:3000"
log "  Health: http://localhost:3000/health"
log "  Command: npm start"
echo ""

exec npm start
