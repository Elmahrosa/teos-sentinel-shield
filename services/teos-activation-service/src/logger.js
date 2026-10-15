import pino from "pino";
import pinoHttp from "pino-http";
import { randomBytes } from "crypto";

const level = process.env.LOG_LEVEL || "info";

export const logger = pino({
  level,
  transport: process.env.NODE_ENV !== "production" && process.stdout.isTTY
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
    : undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["x-service-token"]',
      'req.headers["x-api-key"]',
      'req.headers["x-admin-secret"]',
      'req.headers["webhook-signature"]',
      'req.headers["x-webhook-signature"]',
      "DODO_WEBHOOK_SECRET",
      "ADMIN_SECRET",
      "ACTIVATION_AUTH_TOKEN",
    ],
    censor: "[REDACTED]",
  },
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: () => randomBytes(4).toString("hex"),
  autoLogging: {
    ignore: (req) => ["/health", "/live", "/ready", "/ping"].includes(req.url || ""),
  },
  customLogLevel: (res, err) => {
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});
