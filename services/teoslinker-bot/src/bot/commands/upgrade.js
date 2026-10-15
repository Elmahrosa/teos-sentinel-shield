const { D } = require("../../utils/formatting");
const { planLinks } = require("../../utils/checkout");
const { upgradeMenu } = require("../menus");
const { logger } = require("../../../logger.cjs");

const BETA_USER_LIMIT = 100;

let redis = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } else if (process.env.REDIS_URL) {
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (t) => Math.min(t * 200, 3000),
      lazyConnect: true,
    });
    redis.on('error', (err) => logger.warn({ err }, 'upgrade redis error'));
    redis.connect().catch(() => { redis = null; });
  }
} catch (e) {
  logger.warn({ err: e }, 'upgrade Redis init failed');
}

async function getBetaRedemptionCount() {
  if (!redis) return 0;
  try {
    const count = await redis.get('beta:redemptions:count');
    return Number(count) || 0;
  } catch (err) {
    logger.warn({ err }, 'getBetaRedemptionCount failed');
    return 0;
  }
}

async function trackBetaRedemption(userId) {
  if (!redis) return { status: 'unavailable', message: 'Tracking unavailable' };
  try {
    const count = await redis.incr('beta:redemptions:count');
    if (count > BETA_USER_LIMIT) {
      return {
        status: 'limit_exceeded',
        count,
        message: '\u{1F6AB} Beta offer limit reached. Promo closed.'
      };
    }
    await redis.sadd('beta:redeemed:users', String(userId));
    await redis.hset('beta:user', String(userId), {
      timestamp: String(Date.now()),
      bonus_credits: '200',
      tier: 'PRO'
    });
    return { status: 'success', bonus_credits: 200, count };
  } catch (err) {
    logger.warn({ err, userId }, 'trackBetaRedemption failed');
    return { status: 'error', message: 'Tracking failed' };
  }
}

async function upgradeCommand(ctx) {
  const userId = String(ctx.from.id);
  require("../../services/analytics.service").recordUpgradeClick(userId).catch(err => { logger.warn({ err, userId }, "recordUpgradeClick failed"); });

  const L = planLinks(userId);
  const betaCount = await getBetaRedemptionCount();
  const betaFull = betaCount >= BETA_USER_LIMIT;

  const promoLine = betaFull
    ? `\u{1F6AB} Beta promo closed \u2014 100/100 users claimed`
    : `\u{1F381} Beta: +200 bonus credits \u2014 ${betaCount}/100 users claimed`;

  await ctx.reply(
`\u{1F680} Upgrade TEOS Sentinel
${D}
${promoLine}
${D}
\u{1F7E2} PRO \u2014 $69/mo
\u2514\u2500 1,000 credits/month
\u2514\u2500 Bonus +200 credits (first 100 users only)
\u2514\u2500 ${L.proMonthly}
${D}
\u{1F7E2} PRO ANNUAL \u2014 $690/yr
\u2514\u2500 1,000 credits/month
\u2514\u2500 Bonus +200 credits (first 100 users only)
\u2514\u2500 ${L.proAnnual}
${D}
\u{1F9FF} TEAM \u2014 $199/mo
\u2514\u2500 10,000 credits/month
\u2514\u2500 ${L.teamMonthly}  |  Yearly: ${L.teamAnnual}
${D}
\u{1F451} Enterprise / air-gapped?   \u{1F4E7} ayman@teosegypt.com
${D}
Valid 7 days or until used. Refunds per Dodo Payments rules.`,
    upgradeMenu(userId)
  );
}

module.exports = { upgradeCommand, trackBetaRedemption, getBetaRedemptionCount, BETA_USER_LIMIT };
