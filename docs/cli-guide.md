# TEOS Sentinel — CLI Manual

## Overview

The `teos` CLI provides terminal-based access to the TEOS Sovereign Security Stack. It wraps the Risk Engine (MCP) API for code scanning, service health monitoring, and account management.

```bash
teos <command> [options]
```

## Installation

```bash
# Global install from npm
npm install -g teos-stack

# Or run directly from the orchestrator repo
node teos.js <command>

# Windows: teos.cmd wrapper included
teos scan myscript.py
```

## Configuration

Config stored at `~/.teos/config.json` (created on first use, permissions locked to `0600`):

```json
{
  "deviceId": "uuid",
  "apiKey": "teos_...",
  "createdAt": "ISO8601"
}
```

Set API key via:
- `teos login <email>` (register new free tier)
- `teos login <api-key>` (save existing key)
- `TEOS_API_KEY=<key>` env var (one-time override)

## Commands

### `teos scan <file|"code">`

Scan a file or code snippet through the TEOS Bridge (Risk Engine). Accepts piped input.

```bash
# Scan a file
teos scan deploy.sh

# Scan inline code
teos scan "rm -rf /etc"

# Pipe from stdin
cat docker-compose.yml | teos scan

# Scan with inline API key
TEOS_API_KEY=teos_abc123 teos scan payload.py
```

**Output:**
```
🔒  BLOCK  (risk: 100/100)

Findings:
  • destructive-shell-cmd: Destructive shell command detected — system damage risk

  258 governance controls evaluated
```

### `teos health`

Check health of all TEOS services.

```bash
teos health
```

**Output:**
```
TEOS Service Health

  ✅  TEOS Bridge           UP (200)
  ✅  Identity              UP (200)
  ✅  TEOS Bot              UP (200)
  ✅  Risk Engine           UP (200)
  ✅  Sentinel Shield       UP (200)

✅  All services healthy
```

### `teos status`

Show account details, API key status, tier, credits, and service health.

```bash
teos status
```

**Output:**
```
TEOS Sovereign Security Stack
Version: 4.2.1
Engine:  v4.1 | 258 Active Governance Controls | 1325 tests

  ✅  API Key: teos_abc123...
  ✅  Tier: Free | Credits: 5 (5/day)

Device: a1b2c3d4...

Pricing may change after beta — early founders locked in at current terms.

  ✅  TEOS Bridge           UP (200)
  ...
```

### `teos credits`

Show current credit balance and tier.

```bash
teos credits
```

**Output:**
```
✅  Authenticated
  Tier:    Free
  Credits: 5
  Daily:   5/day
```

### `teos login <email|key>`

Register a new free-tier account or save an existing API key.

```bash
# Register new account (email)
teos login user@example.com

# Save existing API key
teos login teos_abc123def456...
```

### `teos logout`

Remove saved API key from local config.

```bash
teos logout
```

### `teos version`

Display version and engine information.

```bash
teos version
```

**Output:**
```
TEOS Sovereign Security Stack
Version: 4.2.1
Engine:  v4.0
Rules:   258 (95 Core + 32 Banking + 29 Solana + 21 EVM + 8 Dependency + 23 CI/CD + 25 Token Intelligence + 25 Due Diligence)
Tests:   1325
Services: Bridge, Identity, Bot, Risk Engine, Shield
Runtime: Railway (production)
```

### `teos deploy`

Show deployment pipeline instructions.

```bash
teos deploy
```

**Output:**
```
TEOS Deployment

  git push → GitHub Actions → Railway auto-deploy
  No manual steps required.
  ...
```

### `teos ci [--secret] <directory>`

Run the CI scanner against a local directory. Uses Sentinel Shield's CI scripts.

```bash
# Standard CI scan
teos ci ./src

# Secret scan mode
teos ci --secret ./config
```

### `teos help`

Display all commands and usage information.

```bash
teos help
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (scan failure, auth failure, unknown command) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TEOS_API_KEY` | API key override (takes precedence over config) |
| `TEOS_IDENTITY_URL` | Identity service URL (default: activation service) |
| `TEOS_BRIDGE_URL` | Bridge/Risk Engine URL (default: MCP production) |

## Tiers

| Tier | Daily Limit | Monthly Credits | Price |
|------|-------------|-----------------|-------|
| Free | 5 scans | — | $0 |
| Pro | Unlimited | 1,000 | $49/mo |
| Team | Unlimited | 10,000 | $199/mo |
| Enterprise | Unlimited | Unlimited | $25K/yr |

## Security

- API keys stored in `~/.teos/config.json` with `0600` permissions
- Keys never logged or transmitted in query parameters
- Device ID generated as random UUID for anonymous usage tracking
- Config directory created with `0700` permissions
