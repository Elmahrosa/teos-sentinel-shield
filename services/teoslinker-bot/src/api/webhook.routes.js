const { logger } = require('../../logger.cjs');
const TELEGRAM_TIMESTAMP_HEADER = 'X-Telegram-Bot-Api-Timestamp';
const NONCE_TTL_MS = 300000;
const nonces = new Map();
const nonceTimers = new Map();

function expireNonce(key) {
  nonces.delete(key);
  nonceTimers.delete(key);
}

function registerWebhookRoutes(app, bot, CFG, USE_WEBHOOK) {
  function replayGuard(req, res, next) {
    if (CFG.webhookSecret) {
      const token = req.headers['x-telegram-bot-api-secret-token'];
      if (!token || token !== CFG.webhookSecret) {
        try { const { emit } = require('../services/telemetry.service'); emit("security", { event: "webhook_auth_failure", detail: "invalid_secret_token", ip: req.ip }); } catch (e) { logger.warn({ err: e }, "Telemetry emit failed — webhook auth failure"); }
        return res.status(403).json({ error: 'forbidden', reason: 'invalid_secret_token' });
      }
    }
    const ts = req.headers[TELEGRAM_TIMESTAMP_HEADER.toLowerCase()];
    if (ts) {
      const now = Math.floor(Date.now() / 1000);
      const then = parseInt(ts, 10);
      if (then && Math.abs(now - then) > 300) {
        try { const { emit } = require('../services/telemetry.service'); emit("security", { event: "webhook_replay_attempt", detail: "stale_timestamp", ip: req.ip }); } catch (e) { logger.warn({ err: e }, "Telemetry emit failed — stale timestamp"); }
        return res.status(403).json({ error: 'forbidden', reason: 'stale_request' });
      }
    }
    const updateId = req.body?.update_id;
    if (updateId != null) {
      const nonceKey = `tg:${updateId}`;
      if (nonces.has(nonceKey)) {
        try { const { emit } = require('../services/telemetry.service'); emit("security", { event: "webhook_replay_attempt", detail: "duplicate_update_id", updateId, ip: req.ip }); } catch (e) { logger.warn({ err: e }, "Telemetry emit failed — duplicate update_id"); }
        return res.status(403).json({ error: 'forbidden', reason: 'duplicate_update' });
      }
      nonces.set(nonceKey, true);
      const timer = setTimeout(() => expireNonce(nonceKey), NONCE_TTL_MS);
      timer.unref();
      nonceTimers.set(nonceKey, timer);
    }
    next();
  }

  const tokenPart = CFG.botToken ? CFG.botToken.split(":")[1] : "bot";
  const webhookPath = `${tokenPart}`;
  const whOpts = {};
  if (CFG.webhookSecret) whOpts.secretToken = CFG.webhookSecret;
  logger.info({ path: `/webhook/${webhookPath}`, hasToken: !!CFG.botToken }, "Registering webhook route");
  try {
    app.post(`/webhook/${webhookPath}`, replayGuard, bot.webhookCallback(`/webhook/${webhookPath}`, whOpts));
    logger.info("Webhook route registered successfully");
  } catch (err) {
    logger.error({ err, path: `/webhook/${webhookPath}` }, "Failed to register webhook route");
  }

  function requireServiceAuth(req, res, next) {
    const token = process.env.ACTIVATION_AUTH_TOKEN;
    if (!token) {
      logger.warn("ACTIVATION_AUTH_TOKEN not set — webhook management endpoints disabled");
      return res.status(503).json({ error: "service_unavailable", message: "Auth token not configured" });
    }
    const provided = req.headers["x-service-token"];
    if (!provided || provided !== token) {
      logger.warn({ ip: req.ip }, "Unauthorized webhook management attempt");
      return res.status(401).json({ error: "unauthorized", message: "Valid x-service-token header required" });
    }
    next();
  }

  app.post("/webhook-register", requireServiceAuth, async (req, res) => {
    if (!USE_WEBHOOK) return res.status(400).json({ error: "Webhook mode not enabled" });
    const secret = req.body?.secret || CFG.webhookSecret;
    try {
      const tokenPart = CFG.botToken ? CFG.botToken.split(":")[1] : "bot";
      await bot.telegram.setWebhook(`${CFG.webhookUrl}/webhook/${tokenPart}`, {
        secret_token: secret || undefined,
        drop_pending_updates: true,
      });
      res.json({ ok: true, webhookUrl: `${CFG.webhookUrl}/webhook/${tokenPart}` });
    } catch (err) {
      const detail = err?.message || err?.description || String(err);
      logger.error({ err: detail }, "Webhook registration failed");
      res.status(500).json({ error: "Webhook registration failed", detail });
    }
  });

  app.post("/webhook-unregister", requireServiceAuth, async (req, res) => {
    try {
      await bot.telegram.deleteWebhook();
      res.json({ ok: true });
    } catch (err) {
      const detail = err?.message || err?.description || String(err);
      logger.error({ err: detail }, "Webhook unregistration failed");
      res.status(500).json({ error: "Failed to delete webhook", detail });
    }
  });

  app.get("/webhook-status", requireServiceAuth, (req, res) => {
    res.json({
      botTokenSet: !!CFG.botToken,
      useWebhook: USE_WEBHOOK,
      webhookUrl: CFG.webhookUrl ? "(set)" : "(not set)",
      webhookSecretSet: !!CFG.webhookSecret,
    });
  });

  // ── Dodo Payments Webhook (DISABLED — use the activation service) ────────────
  // Payments are handled by the activation service ONLY (single webhook target,
  // signature-verified). This route had NO signature check and could be abused to
  // self-grant beta credits, so it is permanently closed with 410 Gone.
  app.post("/webhook/dodo", (req, res) => {
    logger.warn("Rejected POST /webhook/dodo — payment webhooks are handled by the activation service");
    res.status(410).json({
      error: "gone",
      message: "Disabled. Configure Dodo to POST /api/dodo-webhook on the activation service.",
    });
  });
}

module.exports = { registerWebhookRoutes };
