# UptimeRobot Setup Guide — Free Tier (TEOS Sovereign)

For the price of one cup of coffee (free), you get 5-minute monitoring of all public TEOS services with Slack/Email alerts. This guide is specific to the TEOS stack — not a general UptimeRobot tutorial.

---

## Step 1: Create Account

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up with Google or Email (free tier: 50 monitors, 5-min checks)
3. Verify your email

## Step 2: Add Monitors

Click **+ Add Monitor** and create these **5 monitors**:

| # | Friendly Name | URL | Type | Interval |
|---|---|---|---|---|
| 1 | TEOS Sentinel Dashboard | `https://sentinel.teos.dev/` | HTTPS | 5 min |
| 2 | TEOS Safe Ingestion API | `https://api.teos.dev/health` | HTTPS | 5 min |
| 3 | TEOS Risk Engine (MCP) | `https://mcp.teos.dev/live` | HTTPS | 5 min |
| 4 | TEOS Activation Service | `https://activation.teos.dev/live` | HTTPS | 5 min |
| 5 | TEOS Linker Bot | `https://bot.teos.dev/health` | HTTPS | 5 min |

Settings per monitor:
- **Timeout:** 30 seconds
- **Alert if down:** 1 occurrence (immediate alert)
- **Keywords:** leave empty
- **SSL monitoring:** ✅ Checked

## Step 3: Configure Alert Contacts

1. Go to **My Settings** → **Alert Contacts**
2. Add contacts:
   - **Email** (default — free)
   - **Slack** (free via UptimeRobot → Slack App integration)
   - **Telegram** (free — requires bot token)
3. Select **Send alerts to all contacts** under each monitor

## Step 4: Set Up Status Page (Optional, Free)

1. Go to **My Settings** → **Status Pages**
2. Click **+ Add Status Page**
3. Name: `TEOS Sovereign Status`
4. Select all 5 monitors
5. Custom domain (optional): `status.teos.dev` (CNAME to UptimeRobot)
6. Share URL with beta testers: `https://stats.uptimerobot.com/your-id`

## Step 5: Set Up Keyword Alerts (Advanced)

For the Safe Ingestion API monitor, add these **keyword checks**:
- **Alert when keyword EXISTS:** `"status": "ok"` (if missing = unhealthy)
- **Alert when keyword NOT EXISTS:** `"error"` (if present = error state)

## Maintenance Window

When deploying updates:
1. Go to **Monitors** → click the monitor name
2. Set a **Maintenance Window** for the expected downtime
3. Prevents false alerts during deployments

## Verification

After setup, verify by:
1. Temporarily stop one service: `docker stop risk-engine`
2. Confirm you receive an alert via email/Slack within 5 minutes
3. Restart: `docker start risk-engine`
4. Confirm you receive an "Up" notification

## Troubleshooting

| Symptom | Fix |
|---|---|
| Monitors show "pending" | Wait 5 min for first check |
| False SSL alerts | Ensure your domain has a valid cert |
| Wrong status code | Check the exact URL path (/live vs /health) |
