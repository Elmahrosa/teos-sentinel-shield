import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: ["DODO_WEBHOOK_SECRET", "ADMIN_SECRET"],
    censor: "[REDACTED]",
  },
});

const REQUIRED = ["DODO_WEBHOOK_SECRET", "ADMIN_SECRET", "ACTIVATION_AUTH_TOKEN"];

const WEAK_PATTERNS = [/^dev-/i, /^changeme/i, /^placeholder/i, /^your-/i];

function isWeakSecret(val) {
  return WEAK_PATTERNS.some((p) => p.test(val)) || val.length < 16;
}

export function validateSecrets() {
  const missing = REQUIRED.filter(
    (key) => !process.env[key] || process.env[key]?.trim().length === 0
  );
  if (missing.length > 0) {
    logger.error({ missing }, "Missing required secrets");
    logger.error(`Set these in .env or environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  const weak = REQUIRED.filter((key) => isWeakSecret(process.env[key]));
  if (weak.length > 0) {
    logger.warn({ weak }, "Weak/placeholder secrets detected — generate with openssl rand -hex 32");
  }

  logger.info(`All ${REQUIRED.length} required secrets validated`);
}

export function getConfig() {
  return {
    port: parseInt(process.env.PORT || "8080", 10),
    dodoWebhookSecret: process.env.DODO_WEBHOOK_SECRET,
    adminSecret: process.env.ADMIN_SECRET,
    nodeEnv: process.env.NODE_ENV || "production",
    logLevel: process.env.LOG_LEVEL || "info",
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",").filter(Boolean),
    trustProxy: parseInt(process.env.TRUST_PROXY || "1", 10),
  };
}
