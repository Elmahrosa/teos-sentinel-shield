# BetterStack Configuration — TEOS Sovereign Security Stack
# https://betterstack.com/uptime

## 1. Create Resources

| Resource | URL | Check Interval | Regions |
|---|---|---|---|
| TEOS Risk Engine (MCP) | `https://mcp.teos.dev/live` | 60s | us-east, eu-west, ap-southeast |
| TEOS Activation Service | `https://activation.teos.dev/live` | 60s | us-east, eu-west |
| TEOS Linker Bot | `https://bot.teos.dev/health` | 60s | us-east |
| Sentinel Shield | `https://sentinel.teos.dev/` | 60s | us-east, eu-west, ap-southeast |
| Safe Ingestion API | `https://api.teos.dev/health` | 60s | us-east, eu-west |

## 2. Status Page

Create a public status page at `status.teos.dev` with:
- **Group**: TEOS Core
  - Risk Engine, Activation, Bot, Sentinel, Safe Ingestion
- **Custom domain**: `status.teos.dev`
- **Brand**: Dark theme (#0a0a0f background, #ffd700 accent)

## 3. Alert Integrations

| Channel | Setup | Incident routing |
|---|---|---|
| Slack | BetterStack → Integrations → Slack → `#teos-alerts` | Maintainer on-call |
| Email | devops@teos.dev (default) | All incidents |
| Webhook | POST to `https://hooks.teos.dev/incident` | Automated remediation |

## 4. Heartbeat API (for cron/healthcheck.sh)

Configure heartbeat URLs per service so the `healthcheck.sh` cron script can send liveness pings:

```bash
# Add to .env:
BETTERSTACK_HEARTBEAT_RISK="https://uptime.betterstack.com/api/v1/heartbeat/XXXX"
BETTERSTACK_HEARTBEAT_ACTIVATION="https://uptime.betterstack.com/api/v1/heartbeat/YYYY"
BETTERSTACK_HEARTBEAT_BOT="https://uptime.betterstack.com/api/v1/heartbeat/ZZZZ"
BETTERSTACK_HEARTBEAT_SENTINEL="https://uptime.betterstack.com/api/v1/heartbeat/WWWW"
BETTERSTACK_HEARTBEAT_INGESTION="https://uptime.betterstack.com/api/v1/heartbeat/VVVV"
```

Then add to `healthcheck.sh` (see root `healthcheck.sh` for existing alert logic).

## 5. Incident Templates

```json
{
  "incident_template": {
    "name": "TEOS Service Degraded",
    "summary": "{{resource.name}} returned non-200 at {{occurred_at}}",
    "details": "Region: {{region}}\nStatus: {{status_code}}\nResponse: {{response_body_preview}}"
  }
}
```
