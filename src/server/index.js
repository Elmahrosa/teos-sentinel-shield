const express = require('express');
const helmet = require('helmet');
const { requestContext } = require('../../lib/request-context');
const { printStartupBanner } = require('../../lib/version');
const { log } = require('../services/logger');
const { initBootTime } = require('../services/cache');
const { seedData } = require('../engine/scanner');
const { apiKeyAuth } = require('./middleware/auth');
const { redisRateLimiter } = require('./middleware/rateLimit');
const { errorHandler } = require('./middleware/errorHandler');
const { mountRoutes } = require('./routes');

try {
  const { validateSecrets } = require('../../config.cjs');
  validateSecrets();
} catch (e) {
  log('warn', 'Config validation skipped', { error: e.message });
}

printStartupBanner();

const PORT = process.env.PORT || 3000;
const MAX_PAYLOAD_KB = parseInt(process.env.MAX_PAYLOAD_KB) || 64;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

app.use(express.json({ limit: MAX_PAYLOAD_KB + 'kb' }));
app.use(express.urlencoded({ extended: false, limit: MAX_PAYLOAD_KB + 'kb' }));
app.use(requestContext({ logFn: (e) => log('info', `${e.method} ${e.path}`, e) }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID,X-API-Key');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(apiKeyAuth);
app.use(redisRateLimiter);

mountRoutes(app);

app.use(errorHandler);

seedData().catch(e => log('warn', 'Seed data failed', { error: e.message }));
initBootTime().catch(e => log('warn', 'Boot time init failed', { error: e.message }));

if (require.main === module) {
  app.listen(PORT, () => {
    log('info', 'TEOS Sentinel Engine v4.0 started', { port: PORT, env: NODE_ENV, store: process.env.REDIS_URL ? 'redis' : 'memory' });
  });
}

module.exports = app;