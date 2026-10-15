const MAX_HEAP_MB = 200;
const MAX_RSS_MB = 256;

function memoryGuard(req, res, next) {
  const mem = process.memoryUsage();
  const rssMB = mem.rss / 1024 / 1024;
  const heapMB = mem.heapUsed / 1024 / 1024;
  if (heapMB > MAX_HEAP_MB || rssMB > MAX_RSS_MB) {
    return res.status(503).json({ error: "service_unavailable", semantic_tag: "memory_pressure", reason: "memory_pressure" });
  }
  next();
}

module.exports = { memoryGuard };
