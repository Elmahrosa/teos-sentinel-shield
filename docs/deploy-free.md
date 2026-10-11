# Running the backend for free (always-on)

The whole platform — the Marketplace Action in remote mode, the website
(`public/config.js`, `public/proxy.php`), the bot, and Dodo Payments webhooks —
talks to **one** endpoint: `ws-server/index.js` (Express API + WebSocket live
feed + static front-end, in a single Node process). Railway was only the host.

**Free tiers that sleep are not good enough for paying customers.** Render's
free service sleeps after 15 min; Koyeb's free service scales to zero after 1 h.
The best free option is a **real always-on VM**. This repo ships a Docker +
Caddy kit that runs on any of them.

| Host | Free? | Always on? | Card needed? |
|---|---|---|---|
| **Oracle Cloud Always Free** | yes, forever | **yes** | yes (verification only) |
| **Google Cloud e2-micro** | yes (free tier) | **yes** | yes (verification only) |
| Koyeb free | yes | no — scales to 0 after 1 h | no |
| Render free | yes | no — sleeps after 15 min | no |

---

## Oracle Cloud Always Free (recommended)

Oracle's Always Free tier gives a permanent, always-on VM at no cost. As of the
June 2026 change the Arm (Ampere A1) allowance is 2 OCPU / 12 GB — far more than
this app needs — and the AMD micro instances are also always free.

1. Create an Oracle Cloud account (card for identity verification; nothing is
   charged) → **Compute → Instances → Create**.
2. Image **Ubuntu 22.04** (or 24.04), shape **VM.Standard.A1.Flex** (Arm) with
   1 OCPU / 6 GB is plenty. Attach your SSH key.
3. In the VCN **security list**, add ingress rules for TCP **80** and **443**
   from `0.0.0.0/0`.
4. SSH in and run the installer:
   ```bash
   sudo SITE_ADDRESS=api.teosegypt.com \
     bash /opt/teos-sentinel-shield/deploy/setup-vm.sh
   ```
   (First clone once: `git clone https://github.com/Elmahrosa/teos-sentinel-shield /opt/teos-sentinel-shield`.)
   No domain yet? Use the VM's public IP: `sudo SITE_ADDRESS=203.0.113.9.sslip.io …`
   — sslip.io resolves `<ip>.sslip.io` to `<ip>`, so Caddy still gets valid TLS.
5. Edit `/opt/teos-sentinel-shield/deploy/.env` and set at least
   `TEOS_API_KEYS` (e.g. `sk_live_xxx-pro,sk_live_yyy-team`), plus Upstash and
   Dodo values. Then:
   ```bash
   cd /opt/teos-sentinel-shield
   docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d
   ```
6. Verify:
   ```bash
   curl https://api.teosegypt.com/health
   curl -H "X-API-Key: sk_live_xxx-pro" https://api.teosegypt.com/engines
   ```

Caddy provisions the Let's Encrypt certificate automatically and proxies
WebSocket upgrades transparently — no extra config.

---

## Google Cloud free e2-micro (alternative)

Same kit, different VM:

1. `gcloud compute instances create teos-sentinel \
      --machine-type=e2-micro --zone=us-central1-a \
      --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud`
   (e2-micro is free **only** in `us-central1`, `us-west1`, `us-east1`.)
2. Allow HTTP/HTTPS in the firewall:
   `gcloud compute firewall-rules create teos-web --allow tcp:80,tcp:443`
3. Reserve a static IP, point your domain's A record at it, SSH in, run
   `deploy/setup-vm.sh` as above.

---

## No credit card? Koyeb free (accepts a sleep)

If you cannot put a card on file, Koyeb's free tier needs none. It scales to
zero after 1 h idle and wakes in a few seconds. Limitations: 512 MB / 0.1 vCPU
and one free service per org, in Frankfurt or Washington, D.C.

- Create a **Web Service** from this repo.
- Build: Dockerfile (already included) — or Node buildpack.
- Run command: `npm start` · Port: `3000` · Health: `/health`.
- Add the same env vars as above.
- The trade-off is the cold start; acceptable for launch, not for paying users.

---

## Repoint the four "railway" references

Once the endpoint is live, change every hard-coded Railway host:

| File | Line | Change |
|---|---|---|
| `src/action.js` | 25 | `DEFAULT_API_URL` → new URL, then rebuild `dist/` |
| `action.yml` | 42 | `api-url` default → new URL |
| `public/config.js` | 12 | `RAILWAY_WS` → `wss://<your-host>` |
| `public/proxy.php` | 20 | `$BACKEND` → new URL |

After editing `src/action.js` you **must** rebuild and cut a new Marketplace
release, or the published Action still points at the dead host:

```bash
npx --yes @vercel/ncc@0.38.3 build src/action.js -o dist
```

---

## Dodo Payments

Set the Dodo webhook endpoint to `https://<your-host>/webhook/dodo`. The handler
verifies the HMAC signature and is idempotent (`server/api.js`), so retries are
safe.
