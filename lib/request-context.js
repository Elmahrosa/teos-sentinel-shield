const crypto = require("crypto");

/**
 * Minimal request correlation middleware.
 * - Preserves inbound X-Request-ID or generates one
 * - Preserves/injects X-Correlation-ID
 * - Sets response headers
 * - Tracks timing and emits structured log via callback
 */
function requestContext(opts = {}) {
  const { exposeHeader = true, logFn = null } = opts;

  return function middleware(req, res, next) {
    const incoming = req.headers["x-request-id"] || "";
    req.id = incoming || crypto.randomUUID().slice(0, 16);

    const corr = req.headers["x-correlation-id"] || req.headers["x-request-id"] || req.id;
    req.correlationId = corr;

    if (exposeHeader) {
      res.setHeader("X-Request-ID", req.id);
      res.setHeader("X-Correlation-ID", corr);
    }

    req._t0 = process.hrtime.bigint();

    res.on("finish", () => {
      const elapsed = Number(process.hrtime.bigint() - req._t0) / 1e6;
      if (logFn) {
        logFn({
          reqId: req.id,
          correlationId: corr,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: Math.round(elapsed),
        });
      }
    });

    next();
  };
}

/**
 * Build forwarding headers for inter-service HTTP calls.
 * Pass the current request's id and any extra headers.
 */
function forwardHeaders(req, extra = {}) {
  return {
    ...extra,
    "X-Request-ID": req?.id || crypto.randomUUID().slice(0, 16),
    "X-Correlation-ID": req?.correlationId || req?.id || "",
  };
}

module.exports = { requestContext, forwardHeaders };
