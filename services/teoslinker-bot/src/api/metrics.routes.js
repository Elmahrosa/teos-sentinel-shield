function registerMetricsRoutes(app) {
  app.get('/metrics-lite', (req, res) => {
    const mem = process.memoryUsage();
    res.json({
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      },
      pid: process.pid,
      nodeVersion: process.version,
    });
  });
}

module.exports = { registerMetricsRoutes };
