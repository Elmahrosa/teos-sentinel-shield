const { log } = require('./logger');

const REDIS_KEY  = 'teos:sentinel:events';
const BOOT_KEY   = 'teos:sentinel:boot_time';
const MAX_EVENTS = parseInt(process.env.MAX_EVENTS) || 500;

let redis = null;
try {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const Redis = require('ioredis');
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      lazyConnect: true,
    });
    log('info', 'Redis connected via ioredis');
  }
} catch (e) {
  log('warn', 'Redis init failed, falling back to memory', { error: e.message });
}

let memStore = [];

async function loadEvents() {
  if (redis) {
    try {
      const raw = await redis.lrange(REDIS_KEY, 0, MAX_EVENTS - 1);
      return raw.map(e => typeof e === 'string' ? JSON.parse(e) : e);
    } catch (e) {
      log('warn', 'Redis read failed, using memory fallback', { error: e.message });
    }
  }
  return memStore;
}

async function saveEvent(event) {
  if (event.verdict) event.verdict = event.verdict.toLowerCase();
  if (redis) {
    try {
      await redis.lpush(REDIS_KEY, JSON.stringify(event));
      await redis.ltrim(REDIS_KEY, 0, MAX_EVENTS - 1);
      return;
    } catch (e) {
      log('warn', 'Redis write failed, using memory fallback', { error: e.message });
    }
  }
  memStore.unshift(event);
  if (memStore.length > MAX_EVENTS) memStore = memStore.slice(0, MAX_EVENTS);
}

function loadEventsSync() {
  return memStore;
}

async function initBootTime() {
  if (!redis) return;
  try {
    const existing = await redis.get(BOOT_KEY);
    if (!existing) {
      await redis.set(BOOT_KEY, Date.now().toString());
      log('info', 'Boot time initialized in Redis');
    }
  } catch (e) {
    log('warn', 'Boot time init failed', { error: e.message });
  }
}

module.exports = { redis, loadEvents, saveEvent, loadEventsSync, initBootTime, REDIS_KEY, BOOT_KEY, MAX_EVENTS };