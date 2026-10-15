const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "BOT_TOKEN",
      "MCP_AUTH_TOKEN",
      "GITHUB_TOKEN",
      "ACTIVATION_AUTH_TOKEN",
      "SENTINEL_AUDIT_KEY",
      "x-service-token",
      "x-teos-owner-id",
      "x-teos-bot-key",
      "x-payment",
      "x-admin-secret",
      "x-internal-key",
      "ALPHA_ACTIVATION_SECRET",
      "BETA_ACTIVATION_SECRET",
      "DODO_WEBHOOK_SECRET",
      "DODO_PAYMENTS_API_KEY",
      "redisUrl",
      "REDIS_URL",
    ],
    censor: "[REDACTED]",
  },
});

const REQUIRED = ["BOT_TOKEN"];
const NODE_ENV = process.env.NODE_ENV || "production";
const USE_WEBHOOK = process.env.BOT_USE_WEBHOOK === "true" && process.env.BOT_WEBHOOK_URL && process.env.BOT_WEBHOOK_URL.startsWith("https://");

const WEAK_PATTERNS = [/^dev-/i, /^changeme/i, /^placeholder/i, /^your-/i];

function isWeakSecret(val) {
  return WEAK_PATTERNS.some((p) => p.test(val)) || val.length < 16;
}

function validateSecrets() {
  const missing = REQUIRED.filter(
    (key) => !process.env[key] || process.env[key]?.trim().length === 0
  );
  if (missing.length > 0) {
    logger.warn({ missing }, "Missing required secrets — bot will be unavailable until set");
  }

  const toCheck = ["BOT_TOKEN", "ACTIVATION_AUTH_TOKEN", "MCP_AUTH_TOKEN"].filter((k) => process.env[k]);
  const weak = toCheck.filter((k) => isWeakSecret(process.env[k]));
  if (weak.length > 0) {
    logger.warn({ weak }, "Weak/placeholder secrets detected — generate with openssl rand -hex 32");
  }

  logger.info(`All ${REQUIRED.length} required secrets validated`);
}

function getConfig() {
  return {
    port: parseInt(process.env.PORT || "8082", 10),
    botToken: process.env.BOT_TOKEN,
    activationApi: process.env.ACTIVATION_API || "http://localhost:8080",
    mcpApi: process.env.MCP_API || process.env.MCP_ENGINE_URL || "http://localhost:8090",
    mcpAuthToken: process.env.MCP_AUTH_TOKEN || "",
    nodeEnv: process.env.NODE_ENV || "production",
    logLevel: process.env.LOG_LEVEL || "info",
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",").filter(Boolean),
    trustProxy: parseInt(process.env.TRUST_PROXY || "1", 10),
    useWebhook: USE_WEBHOOK,
    webhookUrl: process.env.BOT_WEBHOOK_URL || "",
    webhookSecret: process.env.BOT_WEBHOOK_SECRET || "",
  };
}

module.exports = { validateSecrets, getConfig, USE_WEBHOOK };
