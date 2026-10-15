const logger = require('../../logger.cjs').logger;

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
    redis.on('error', (err) => logger.warn({ err }, 'analytics redis error'));
    redis.connect().catch(() => { redis = null; });
  }
} catch (e) {
  logger.warn({ err: e }, 'analytics redis init failed');
}

const STATE = {
  scans: {
    total: 0,
    daily: {},
    weekly: {},
    byType: {},
    byUser: {},
  },
  verdicts: {
    ALLOW: 0,
    WARN: 0,
    REVIEW: 0,
    BLOCK: 0,
  },
  feedback: {
    total: 0,
    fp: 0,
    fn: 0,
    open: 0,
    resolved: 0,
    entries: [],
  },
  activations: {
    total: 0,
    byTier: {},
  },
  credits: {
    totalConsumed: 0,
  },
  failedScans: {
    total: 0,
    byType: {},
  },
  upgradeClicks: 0,
  commandCounts: {},
  activeUsers: new Set(),
  startTime: Date.now(),
};

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekKey() {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

async function persistToRedis(key, value) {
  if (!redis) return;
  try {
    await redis.set(`teos:analytics:${key}`, JSON.stringify(value), { ex: 86400 });
  } catch (err) {
    logger.warn({ err }, 'analytics persist failed');
  }
}

async function recordScan(userId, type, verdict, score) {
  STATE.scans.total++;
  STATE.activeUsers.add(userId);

  const day = getDateKey();
  STATE.scans.daily[day] = (STATE.scans.daily[day] || 0) + 1;

  const week = getWeekKey();
  STATE.scans.weekly[week] = (STATE.scans.weekly[week] || 0) + 1;

  STATE.scans.byType[type] = (STATE.scans.byType[type] || 0) + 1;

  STATE.scans.byUser[userId] = STATE.scans.byUser[userId] || { count: 0, types: {}, scores: [] };
  STATE.scans.byUser[userId].count++;
  STATE.scans.byUser[userId].types[type] = (STATE.scans.byUser[userId].types[type] || 0) + 1;
  STATE.scans.byUser[userId].scores.push(score);

  if (verdict && STATE.verdicts[verdict] !== undefined) {
    STATE.verdicts[verdict]++;
  }

  persistToRedis('scans', { total: STATE.scans.total, daily: STATE.scans.daily, byType: STATE.scans.byType });
  persistToRedis('verdicts', STATE.verdicts);

  logger.info({ userId, type, verdict, score }, 'scan recorded');
}

async function recordFeedback(feedback) {
  STATE.feedback.total++;
  if (feedback.isFalsePositive) STATE.feedback.fp++;
  if (feedback.isFalseNegative) STATE.feedback.fn++;
  STATE.feedback.open++;

  const entry = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...feedback,
    timestamp: new Date().toISOString(),
    status: 'open',
  };
  STATE.feedback.entries.push(entry);

  if (STATE.feedback.entries.length > 1000) {
    STATE.feedback.entries = STATE.feedback.entries.slice(-500);
  }

  persistToRedis('feedback', { total: STATE.feedback.total, fp: STATE.feedback.fp, fn: STATE.feedback.fn, open: STATE.feedback.open });

  logger.info({ feedbackId: entry.id }, 'feedback recorded');
}

function resolveFeedback(feedbackId) {
  const entry = STATE.feedback.entries.find(e => e.id === feedbackId);
  if (entry) {
    entry.status = 'resolved';
    STATE.feedback.open--;
    STATE.feedback.resolved++;
    logger.info({ feedbackId }, 'feedback resolved');
  }
}

function getStats() {
  const now = Date.now();
  const uptime = Math.floor((now - STATE.startTime) / 1000);

  return {
    scans: {
      total: STATE.scans.total,
      today: STATE.scans.daily[getDateKey()] || 0,
      thisWeek: STATE.scans.weekly[getWeekKey()] || 0,
      byType: { ...STATE.scans.byType },
      uniqueUsers: STATE.activeUsers.size,
    },
    verdicts: { ...STATE.verdicts },
    feedback: {
      total: STATE.feedback.total,
      falsePositives: STATE.feedback.fp,
      falseNegatives: STATE.feedback.fn,
      open: STATE.feedback.open,
      resolved: STATE.feedback.resolved,
    },
    uptime,
    startedAt: new Date(STATE.startTime).toISOString(),
  };
}

function getAnalytics() {
  const stats = getStats();
  const totalScans = stats.scans.total;
  const verdictTotal = Object.values(stats.verdicts).reduce((a, b) => a + b, 0);

  return {
    ...stats,
    rates: {
      scansPerDay: totalScans > 0 ? (totalScans / (stats.uptime / 86400)).toFixed(1) : 0,
      blockRate: verdictTotal > 0 ? ((stats.verdicts.BLOCK / verdictTotal) * 100).toFixed(1) : 0,
      warnRate: verdictTotal > 0 ? ((stats.verdicts.WARN / verdictTotal) * 100).toFixed(1) : 0,
      reviewRate: verdictTotal > 0 ? ((stats.verdicts.REVIEW / verdictTotal) * 100).toFixed(1) : 0,
      fpRate: stats.feedback.total > 0 ? ((stats.feedback.falsePositives / stats.feedback.total) * 100).toFixed(1) : 0,
      fnRate: stats.feedback.total > 0 ? ((stats.feedback.falseNegatives / stats.feedback.total) * 100).toFixed(1) : 0,
    },
    topUsers: Object.entries(STATE.scans.byUser)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({ userId: id, scans: data.count, types: Object.keys(data.types).length })),
    recentFeedback: STATE.feedback.entries.slice(-20).map(e => ({
      id: e.id,
      scanType: e.scanType,
      expectedVerdict: e.expectedVerdict,
      actualVerdict: e.actualVerdict,
      status: e.status,
      timestamp: e.timestamp,
    })),
  };
}

async function recordActivation(userId, tier) {
  STATE.activations.total++;
  STATE.activations.byTier[tier] = (STATE.activations.byTier[tier] || 0) + 1;
  STATE.activeUsers.add(userId);
  persistToRedis('activations', { total: STATE.activations.total, byTier: STATE.activations.byTier });
  logger.info({ userId, tier }, 'activation recorded');
}

async function recordCreditsUsed(userId, amount, action) {
  STATE.credits.totalConsumed += amount;
  persistToRedis('credits', { totalConsumed: STATE.credits.totalConsumed });
}

async function recordFailedScan(userId, type) {
  STATE.failedScans.total++;
  STATE.failedScans.byType[type] = (STATE.failedScans.byType[type] || 0) + 1;
  persistToRedis('failedScans', { total: STATE.failedScans.total, byType: STATE.failedScans.byType });
  logger.info({ userId, type }, 'failed scan recorded');
}

async function recordCommand(userId, command) {
  if (!STATE.commandCounts[command]) STATE.commandCounts[command] = 0;
  STATE.commandCounts[command]++;
}

async function recordUpgradeClick(userId) {
  STATE.upgradeClicks++;
  persistToRedis('upgrades', { total: STATE.upgradeClicks });
}

function getAdminReport() {
  const now = Date.now();
  const uptime = Math.floor((now - STATE.startTime) / 1000);
  const daysSinceStart = uptime / 86400;

  const topCommands = Object.entries(STATE.commandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([cmd, count]) => ({ command: cmd, count }));

  const topUsers = Object.entries(STATE.scans.byUser)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, data]) => ({
      userId: id.slice(0, 12),
      scans: data.count,
      topType: Object.entries(data.types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
    }));

  return {
    summary: {
      uptime: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h`,
      activeUsers: STATE.activeUsers.size,
      totalScans: STATE.scans.total,
      scansPerDay: daysSinceStart > 0 ? (STATE.scans.total / daysSinceStart).toFixed(1) : 0,
    },
    activations: {
      total: STATE.activations.total,
      byTier: { ...STATE.activations.byTier },
    },
    scans: {
      total: STATE.scans.total,
      today: STATE.scans.daily[getDateKey()] || 0,
      thisWeek: STATE.scans.weekly[getWeekKey()] || 0,
      byType: { ...STATE.scans.byType },
    },
    verdicts: { ...STATE.verdicts },
    failedScans: {
      total: STATE.failedScans.total,
      byType: { ...STATE.failedScans.byType },
    },
    credits: {
      totalConsumed: STATE.credits.totalConsumed,
    },
    engagement: {
      upgradeClicks: STATE.upgradeClicks,
      feedbackSubmitted: STATE.feedback.total,
      topCommands,
      topUsers,
    },
    feedback: {
      total: STATE.feedback.total,
      falsePositives: STATE.feedback.fp,
      falseNegatives: STATE.feedback.fn,
      open: STATE.feedback.open,
      resolved: STATE.feedback.resolved,
    },
  };
}

function reset() {
  STATE.scans = { total: 0, daily: {}, weekly: {}, byType: {}, byUser: {} };
  STATE.verdicts = { ALLOW: 0, WARN: 0, REVIEW: 0, BLOCK: 0 };
  STATE.feedback = { total: 0, fp: 0, fn: 0, open: 0, resolved: 0, entries: [] };
  STATE.activations = { total: 0, byTier: {} };
  STATE.credits = { totalConsumed: 0 };
  STATE.failedScans = { total: 0, byType: {} };
  STATE.upgradeClicks = 0;
  STATE.commandCounts = {};
  STATE.activeUsers.clear();
  STATE.startTime = Date.now();
  logger.info('analytics state reset');
}

module.exports = {
  recordScan,
  recordFeedback,
  resolveFeedback,
  recordActivation,
  recordCreditsUsed,
  recordFailedScan,
  recordCommand,
  recordUpgradeClick,
  getStats,
  getAnalytics,
  getAdminReport,
  reset,
};
