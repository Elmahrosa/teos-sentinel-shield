const pino = require("pino");
const pinoHttp = require("pino-http");
const crypto = require("crypto");

const level = process.env.LOG_LEVEL || "info";

const logger = pino({
  level,
  transport: process.env.NODE_ENV !== "production" && process.stdout.isTTY
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
    : undefined,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "req.headers['x-service-token']", "req.headers['x-api-key']", "req.headers['x-internal-key']", "req.headers['x-internal-secret']", "BOT_TOKEN", "GITHUB_TOKEN", "MCP_AUTH_TOKEN", "ACTIVATION_AUTH_TOKEN", "INTERNAL_API_KEY", "SENTINEL_API_KEY"],
    censor: "[REDACTED]",
  },
});

const httpLogger = pinoHttp({
  logger,
  genReqId: () => crypto.randomBytes(4).toString("hex"),
  autoLogging: {
    ignore: (req) => ["/health", "/live", "/ready", "/ping"].includes(req.url || ""),
  },
  customLogLevel: (res, err) => {
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});

module.exports = { logger, httpLogger };
