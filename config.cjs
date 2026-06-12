const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: ["REDIS_URL", "SUPABASE_SERVICE_ROLE_KEY", "DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY", "TEOS_API_KEYS", "GITHUB_TOKEN", "ACTIVATION_AUTH_TOKEN"],
    censor: "[REDACTED]",
  },
});

function validateSecrets() {
  const errors = [];

  if (!process.env.REDIS_URL) {
    errors.push("REDIS_URL — Redis required for event store and rate limiting");
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY — Postgres required for persistent audit logs");
  }
  if (!process.env.TEOS_API_KEYS) {
    errors.push("TEOS_API_KEYS — at least one API key required for authentication");
  }

  if (errors.length > 0) {
    for (const err of errors) {
      logger.warn({ missing: err }, "Recommended secret not configured");
    }
  }

  logger.info(`Secret validation complete — ${errors.length > 0 ? `${errors.length} warnings` : "all configured"}`);
}

function getConfig() {
  return {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "production",
    logLevel: process.env.LOG_LEVEL || "info",
    maxEvents: parseInt(process.env.MAX_EVENTS || "500", 10),
    maxPayloadKb: parseInt(process.env.MAX_PAYLOAD_KB || "64", 10),
    corsOrigin: process.env.CORS_ORIGIN || "*",
    rateLimitWin: parseInt(process.env.RATE_LIMIT_WIN || "60", 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "120", 10),
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",").filter(Boolean),
    trustProxy: parseInt(process.env.TRUST_PROXY || "1", 10),
  };
}

module.exports = { validateSecrets, getConfig };
