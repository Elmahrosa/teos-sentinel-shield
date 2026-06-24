const router = require('express').Router();
const { redis, loadEventsSync, REDIS_KEY, BOOT_KEY } = require('../../services/cache');
const { RULES } = require('../../engine/scanner');

router.get('/health', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  let uptime = process.uptime();
  let eventCount = 0;
  let storeStatus = redis ? 'redis' : 'memory';
  const NODE_ENV = process.env.NODE_ENV || 'development';

  try {
    if (redis) {
      await redis.ping();
      eventCount = await redis.llen(REDIS_KEY);
      const bootTime = await redis.get(BOOT_KEY);
      if (bootTime) {
        uptime = (Date.now() - parseInt(bootTime)) / 1000;
      }
    } else {
      eventCount = loadEventsSync().length;
    }
  } catch (e) {
    storeStatus = 'redis_error';
    eventCount = loadEventsSync().length;
  }

  res.json({
    status: storeStatus !== 'redis_error' ? 'online' : 'critical',
    engine: 'v4.0',
    rules: RULES.length,
    uptime: Math.round(uptime),
    uptimeHuman: uptime > 86400 ? `${Math.floor(uptime / 86400)}d` :
      uptime > 3600 ? `${Math.floor(uptime / 3600)}h` :
      `${Math.floor(uptime / 60)}m`,
    env: NODE_ENV,
    time: new Date().toISOString(),
    version: '2.4.0',
    store: storeStatus,
    eventsCount: eventCount,
    sla: '99.95%',
    lastDeployment: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'unknown',
    auth: 'x-api-key',
    rateLimiting: 'redis-backed-tiered',
    dependencies: {
      redis: storeStatus !== 'redis_error' ? 'healthy' : 'unhealthy',
      env: process.env.REDIS_URL ? 'redis_url_set' : 'redis_url_missing',
    },
  });
});

module.exports = router;