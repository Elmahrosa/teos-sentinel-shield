#!/usr/bin/env bash
#
# TEOS Sentinel Shield — one-shot backend installer
#
# Target: Ubuntu 22.04 / 24.04 (Oracle Cloud Always Free, Google Cloud e2-micro
#         free tier, or any VPS with a public IP).
#
# Usage:
#   sudo SITE_ADDRESS=api.teosegypt.com bash deploy/setup-vm.sh
#
# SITE_ADDRESS may be:
#   - a domain you control (point its A record at this VM's public IP), or
#   - a sslip.io name for instant TLS with no domain, e.g. 203.0.113.9.sslip.io
#
# After it finishes: open deploy/.env, fill in TEOS_API_KEYS / Upstash / Dodo,
# then re-run:  docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d
#
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Elmahrosa/teos-sentinel-shield.git}"
APP_DIR="${APP_DIR:-/opt/teos-sentinel-shield}"
SITE_ADDRESS="${SITE_ADDRESS:-}"

log() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run as root (use sudo)."
[ -n "${SITE_ADDRESS}" ] || die "Set SITE_ADDRESS, e.g. sudo SITE_ADDRESS=api.example.com bash deploy/setup-vm.sh"

export DEBIAN_FRONTEND=noninteractive

log "Installing base packages"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git ufw

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker Engine + Compose plugin"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  log "Docker already installed"
fi

log "Configuring host firewall (22, 80, 443)"
ufw allow 22/tcp  || true
ufw allow 80/tcp  || true
ufw allow 443/tcp || true
ufw --force enable || true

# Oracle Cloud Ubuntu images carry iptables rules that block 80/443 even after
# the VCN security list is opened. Insert accept rules and persist them.
if [ -d /etc/iptables ]; then
  log "Opening 80/443 in iptables (Oracle Cloud images)"
  iptables -I INPUT 1 -p tcp --dport 80  -j ACCEPT || true
  iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT || true
  if command -v netfilter-persistent >/dev/null 2>&1; then netfilter-persistent save || true; fi
fi

log "Fetching code into ${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" pull --ff-only
else
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone --depth 1 "${REPO_URL}" "${APP_DIR}"
fi

ENV_FILE="${APP_DIR}/deploy/.env"
if [ ! -f "${ENV_FILE}" ]; then
  log "Creating ${ENV_FILE} from .env.example — you must edit it"
  cp "${APP_DIR}/.env.example" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
fi

if grep -q '^SITE_ADDRESS=' "${ENV_FILE}"; then
  sed -i "s|^SITE_ADDRESS=.*|SITE_ADDRESS=${SITE_ADDRESS}|" "${ENV_FILE}"
else
  printf '\n# Public hostname Caddy serves with automatic HTTPS\nSITE_ADDRESS=%s\n' "${SITE_ADDRESS}" >> "${ENV_FILE}"
fi

log "Starting the stack"
cd "${APP_DIR}"
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build

log "Done."
printf '\nNext steps:\n'
printf '  1. Edit %s and set TEOS_API_KEYS (+ Upstash / Dodo secrets).\n' "${ENV_FILE}"
printf '  2. Re-apply: cd %s && docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d\n' "${APP_DIR}"
printf '  3. Verify:   curl https://%s/health\n\n' "${SITE_ADDRESS}"
