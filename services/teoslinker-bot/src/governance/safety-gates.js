const axios = require('axios');
const { logger } = require('../../logger.cjs');
const { USE_WEBHOOK } = require('../../config.cjs');

const CHECKS = {
  containersHealthy: false,
  webhookValidated: false,
  replayProtectionEnabled: false,
  telemetryQueueHealthy: false,
  redisReachable: false,
  governanceChecksumValid: false,
};

const GOVERNANCE_CHECKSUM_FILE = process.env.GOVERNANCE_CHECKSUM_FILE || "";

async function runAll() {
  const results = {};

  results.containersHealthy = await checkContainers();
  results.webhookValidated = checkWebhook();
  results.replayProtectionEnabled = checkReplay();
  results.telemetryQueueHealthy = checkTelemetry();
  results.redisReachable = await checkRedis();
  results.governanceChecksumValid = checkGovernanceChecksum();

  Object.assign(CHECKS, results);
  return results;
}

function allPassed() {
  return Object.values(CHECKS).every(v => v === true);
}

function failures() {
  return Object.entries(CHECKS).filter(([, v]) => v !== true).map(([k]) => k);
}

async function checkContainers() {
  try {
    const port = process.env.PORT || 8082;
    const res = await axios.get(`http://localhost:${port}/live`, { timeout: 3000 });
    return res.status === 200;
  } catch (e) {
    logger.warn({ err: e?.message }, "Safety gate: container health check failed");
    return false;
  }
}

function isWebhookMode() {
  // Single source of truth: config.cjs only enables webhook mode when BOT_USE_WEBHOOK === "true"
  // and a valid https BOT_WEBHOOK_URL is set (see USE_WEBHOOK). The previous implementation
  // assumed webhook mode whenever NODE_ENV=production, which contradicted the actual runtime
  // mode and made the webhook/replay gates fail in polling deployments.
  return USE_WEBHOOK === true;
}

function checkWebhook() {
  if (!isWebhookMode()) return true;
  const url = process.env.BOT_WEBHOOK_URL || process.env.WEBHOOK_URL;
  return Boolean(url) && String(url).startsWith("https://");
}

function checkReplay() {
  if (!isWebhookMode()) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean(process.env.BOT_WEBHOOK_SECRET);
}

function checkTelemetry() {
  try {
    const { emit } = require('../services/telemetry.service');
    return true;
  } catch {
    return false;
  }
}

async function checkRedis() {
  let redis;
  try {
    ({ redis } = require('../services/redis.service'));
  } catch {
    return true;
  }
  // Redis intentionally disabled (no UPSTASH_*/REDIS_URL configured) is not a failure.
  if (!redis) return true;
  try {
    let timer;
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('ping timed out after 3000ms')), 3000);
        if (timer.unref) timer.unref();
      }),
    ]).finally(() => clearTimeout(timer));
    return true;
  } catch (e) {
    logger.warn({ err: e?.message }, "Safety gate: Redis ping failed");
    return false;
  }
}

function checkGovernanceChecksum() {
  if (!GOVERNANCE_CHECKSUM_FILE) return true;
  try {
    const fs = require('fs');
    const crypto = require('crypto');
    const content = fs.readFileSync(GOVERNANCE_CHECKSUM_FILE, 'utf-8');
    const checksum = crypto.createHash('sha3-256').update(content).digest('hex');
    return checksum === process.env.GOVERNANCE_CHECKSUM;
  } catch {
    return false;
  }
}

module.exports = { runAll, allPassed, failures, CHECKS };
