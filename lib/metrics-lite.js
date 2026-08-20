const os = require("os");

let requestCount = 0;
let errorCount = 0;
let totalDurationMs = 0;
const bootTime = Date.now();

function trackRequest(durationMs, statusCode) {
  requestCount++;
  totalDurationMs += durationMs;
  if (statusCode >= 500) errorCount++;
}

function getMetrics() {
  const uptime = Math.floor((Date.now() - bootTime) / 1000);
  const mem = process.memoryUsage();
  const avgDuration = requestCount > 0 ? Math.round(totalDurationMs / requestCount) : 0;
  return {
    uptime,
    uptimeHuman: formatDuration(uptime),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024) + "MB",
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + "MB",
      external: Math.round(mem.external / 1024 / 1024) + "MB",
    },
    requests: {
      total: requestCount,
      errors: errorCount,
      errorRate: requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) + "%" : "0%",
      avgResponseTime: avgDuration + "ms",
    },
    loadAvg: os.loadavg().slice(0, 3).map((v) => v.toFixed(2)),
    cpuCores: os.cpus().length,
    pid: process.pid,
    nodeVersion: process.version,
    bootTime: new Date(bootTime).toISOString(),
  };
}

function formatDuration(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (d) parts.push(d + "d");
  if (h) parts.push(h + "h");
  if (m) parts.push(m + "m");
  if (s || parts.length === 0) parts.push(s + "s");
  return parts.join(" ");
}

function metricsLiteHandler(req, res) {
  res.json(getMetrics());
}

function requestTrackerMiddleware(req, res, next) {
  const t0 = Date.now();
  res.on("finish", () => {
    trackRequest(Date.now() - t0, res.statusCode);
  });
  next();
}

module.exports = { metricsLiteHandler, requestTrackerMiddleware, getMetrics };
