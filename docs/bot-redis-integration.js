// ── Telegram Bot Redis Integration ──────────────────────────
// Add this to your @teoslinker_bot scan handler.
// Pushes every scan verdict to the same Redis key as the REST API.
// Both sources share one event stream → /events, /stats, /audit all work.

const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const REDIS_KEY = 'teos:sentinel:events';
const MAX_EVENTS = 500;

// After you get the scan verdict from your risk engine, push it to Redis:
async function logScanToRedis(result, ctx) {
  const event = {
    id:        Date.now(),
    source:    'telegram',
    userId:    ctx?.from?.id,
    username:  ctx?.from?.username,
    verdict:   result.verdict,
    score:     result.score,
    rule:      result.rule,
    ruleId:    result.ruleId,
    severity:  result.severity,
    command:   result.command || ctx?.message?.text || '',
    timestamp: new Date().toISOString(),
  };

  try {
    await redis.lpush(REDIS_KEY, JSON.stringify(event));
    await redis.ltrim(REDIS_KEY, 0, MAX_EVENTS - 1);
  } catch (e) {
    console.error('[bot] Redis write failed:', e.message);
  }
}

// Usage in your scan handler:
//   const result = runEngine(input);
//   await logScanToRedis(result, ctx);
//   ctx.reply(formatVerdict(result));

module.exports = { logScanToRedis, redis, REDIS_KEY };
