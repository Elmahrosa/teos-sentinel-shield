const REDIS_KEY = "teos:sentinel:events";
const MAX_EVENTS = 500;

let redis = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = require("@upstash/redis");
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("🔗 Upstash Redis connected — shared event store");
  } else if (process.env.REDIS_URL) {
    const Redis = require("ioredis");
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 3000);
      },
      lazyConnect: true,
    });
    redis.on("error", (err) => console.error("[redis] ioredis error:", err.message));
    redis.on("connect", () => console.log("🔗 Local Redis connected via ioredis"));
    redis.connect().catch((err) => {
      console.error("[redis] ioredis connect failed:", err.message);
      redis = null;
    });
  } else {
    console.warn("⚠️ Redis env vars missing — events will not be persisted");
  }
} catch (e) {
  console.warn("⚠️ Redis init failed:", e.message);
}

let _buffer = [];
let _flushTimer = null;

async function flushRedisBuffer() {
  if (!redis || _buffer.length === 0) return;
  const batch = _buffer.splice(0, _buffer.length);
  try {
    const pipeline = redis.pipeline();
    batch.forEach(e => pipeline.lpush(REDIS_KEY, JSON.stringify(e)));
    pipeline.ltrim(REDIS_KEY, 0, MAX_EVENTS - 1);
    await pipeline.exec();
    console.log(`[redis] flushed ${batch.length} events`);
  } catch (err) {
    console.error("[redis] flush error:", err.message);
    _buffer.unshift(...batch);
  }
}

function startFlushTimer() {
  if (_flushTimer) return;
  _flushTimer = setInterval(flushRedisBuffer, 30000);
  if (_flushTimer.unref) _flushTimer.unref();
}

async function logScanToRedis(eventObj, ctx) {
  if (!redis) return;
  try {
    startFlushTimer();
    const entry = {
      id: Date.now(),
      source: "telegram",
      userId: ctx?.from?.id?.toString() || "unknown",
      username: ctx?.from?.username || "anon",
      timestamp: new Date().toISOString(),
      ...eventObj,
    };
    _buffer.push(entry);
    if (_buffer.length >= 10) await flushRedisBuffer();
  } catch (e) {
    console.error("[redis] push error:", e.message);
  }
}

async function shutdownRedis() {
  await flushRedisBuffer();
}

module.exports = { redis, logScanToRedis, flushRedisBuffer, shutdownRedis };
