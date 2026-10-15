const rateLimit = require('express-rate-limit');

function createLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/live' || req.path === '/ready' || req.path === '/health',
    handler: (req, res, next, options) => {
      try {
        const { emit } = require('../services/telemetry.service');
        emit("security", { event: "rate_limit_trigger", path: req.path, ip: req.ip });
      } catch (err) {
        console.error("RateLimit: telemetry emit failed", err?.message);
      }
      res.status(options.statusCode || 429).json({ error: 'rate_limited', semantic_tag: 'rate_limited', retry_after: Math.ceil((options.windowMs || 900000) / 1000) });
    },
  });
}
module.exports = { createLimiter };
