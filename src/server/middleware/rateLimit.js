const { redis: r } = require('../../services/cache');
const { log } = require('../../services/logger');

const RATE_LIMIT_WIN = parseInt(process.env.RATE_LIMIT_WIN) || 60;
const RL_PREFIX = 'teos:rl:';

const TIERS = {
  free:       { rpm: 5,    rpd: 100,   label: 'Free' },
  starter:    { rpm: 30,   rpd: 5000,  label: 'Starter' },
  team:       { rpm: 150,  rpd: 50000, label: 'Team' },
  enterprise: { rpm: 600,  rpd: -1,    label: 'Enterprise' },
  sovereign:  { rpm: -1,   rpd: -1,    label: 'Sovereign' },
  founder:    { rpm: -1,   rpd: -1,    label: 'Founder' },
};

const rateStore = new Map();

setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, entry] of rateStore) {
    if (now - entry.windowStart > RATE_LIMIT_WIN * 2) rateStore.delete(key);
  }
}, 5 * 60 * 1000);

async function redisRateLimiter(req, res, next) {
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT) return next();

  const tier = req.apiTier || 'free';
  const limits = TIERS[tier] || TIERS.free;
  const identifier = req.apiKey ? `key:${req.apiKey}` : (req.ip || req.socket.remoteAddress || 'unknown');

  const now = Math.floor(Date.now() / 1000);
  const minuteKey = `${RL_PREFIX}${identifier}:m:${Math.floor(now / 60)}`;
  const dayKey = `${RL_PREFIX}${identifier}:d:${Math.floor(now / 86400)}`;

  if (r) {
    try {
      const [minuteCount, dayCount] = await Promise.all([
        r.incr(minuteKey),
        r.incr(dayKey),
      ]);
      await r.expire(minuteKey, 120);
      await r.expire(dayKey, 172800);

      const remainingMinute = Math.max(0, limits.rpm - minuteCount);
      const remainingDay = Math.max(0, limits.rpd - dayCount);

      res.setHeader('X-RateLimit-Limit-Minute', String(limits.rpm));
      res.setHeader('X-RateLimit-Limit-Day', String(limits.rpd));
      res.setHeader('X-RateLimit-Remaining-Minute', String(remainingMinute));
      res.setHeader('X-RateLimit-Remaining-Day', String(remainingDay));
      res.setHeader('X-RateLimit-Tier', tier);

      if (minuteCount > limits.rpm) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
          error: 'rate_limit_minute_exceeded',
          message: `Max ${limits.rpm} requests/minute for ${TIERS[tier].label} tier`,
          retryAfter: 60, tier,
        });
      }
      if (dayCount > limits.rpd) {
        res.setHeader('Retry-After', String(86400 - (now % 86400)));
        return res.status(429).json({
          error: 'rate_limit_day_exceeded',
          message: `Max ${limits.rpd} requests/day for ${TIERS[tier].label} tier`,
          retryAfter: 86400 - (now % 86400), tier,
        });
      }
      return next();
    } catch (e) {
      log('warn', 'Redis rate limiter failed, falling back to memory', { error: e.message });
    }
  }

  const key = `rl:${identifier}`;
  let entry = rateStore.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WIN) {
    entry = { windowStart: now, count: 0 };
    rateStore.set(key, entry);
  }
  entry.count++;
  if (entry.count > limits.rpm) {
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(entry.windowStart + RATE_LIMIT_WIN));
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `Max ${limits.rpm} requests per ${RATE_LIMIT_WIN}s window (${TIERS[tier].label} tier, memory fallback)`,
      retryAfter: entry.windowStart + RATE_LIMIT_WIN - now, tier,
    });
  }
  res.setHeader('X-RateLimit-Remaining', String(limits.rpm - entry.count));
  res.setHeader('X-RateLimit-Limit', String(limits.rpm));
  res.setHeader('X-RateLimit-Tier', tier);
  next();
}

module.exports = { redisRateLimiter };