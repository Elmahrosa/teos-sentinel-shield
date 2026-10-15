# TEOS Activation Service

Licensing, payment activation, and entitlement control for TEOS Sentinel Shield.
Part of the [TEOS Sovereign Security Stack](https://github.com/Elmahrosa/teos-sovereign-security-stack).

## Overview

Bridges Dodo Payments webhooks to scan credit entitlements. When a user pays, Dodo fires a signed webhook here. The service verifies the signature, maps the product ID to a plan, and grants credits in SQLite. The Telegram bot calls `/consume` before each scan.
## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Healthcheck |
| GET | `/credits/:userId` | User plan + remaining credits |
| POST | `/api/dodo-webhook` | Dodo payment webhook (HMAC-verified) |
| POST | `/consume` | Deduct 1 scan credit |
| POST | `/grant` | Manual plan grant (admin) |

## Tiers

| Plan | Price | Scans/mo | Dodo Product ID |
|---|---|---|---|
| Free | $0 | 5 | default |
| Starter | $9 | 50 | pdt_0NdeKSOjqmjBk7aK7iXKR |
| Builder | $39 | 400 | pdt_0NdeKSS2a8XLh0bboc7D9 |
| Pro | $99 | 1000 | pdt_0NdjovMrD2e79VHGXwncS |

## Environment

```env
PORT=8080
DODO_WEBHOOK_SECRET=whsec_...
```

## Webhook Setup (Dodo Dashboard)

1. Add endpoint: `https://your-url/api/dodo-webhook`
2. Event: `payment.succeeded`
3. Set `DODO_WEBHOOK_SECRET` from the signing secret shown

Checkout links must pass `metadata.telegram_id` so the service knows which user to credit.

## Bot Integration

```js
// Before each scan
const r = await fetch(`${ACTIVATION_URL}/consume`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: telegramId })
});
if (r.status === 402) return ctx.reply("No credits. Upgrade at sentinel.teosegypt.com");
```

## Notes

- Webhook events are deduplicated by event_id — safe to retry
- Solana/USDC deprecated May 2026. Dodo Payments only.
- `/grant` has no auth in v1 — add ADMIN_SECRET header before public exposure

---
*Elmahrosa International — ayman@teosegypt.com*
