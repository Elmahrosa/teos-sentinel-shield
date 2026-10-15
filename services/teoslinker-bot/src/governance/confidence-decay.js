const { Redis } = require("@upstash/redis");

const DECAY_LAMBDA = 0.05;
const DRIFT_WEIGHTS = {
  false_positive: 0.4,
  reversal: 0.3,
  override: 0.2,
  disagreement: 0.1,
};
const MIN_CONFIDENCE = 0.15;

let redis = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (e) {
  console.warn("[confidence-decay] Redis init failed — drift detection disabled:", e?.message);
}

async function getRuleDrift(ruleId) {
  if (!redis) return 0;
  try {
    const data = await redis.hgetall(`teos:decay:${ruleId}`);
    if (!data) return 0;
    let drift = 0;
    for (const [key, val] of Object.entries(data)) {
      const weight = DRIFT_WEIGHTS[key] || 0.1;
      drift += (Number(val) || 0) * weight;
    }
    return drift;
  } catch (e) {
    console.warn("[confidence-decay] Redis hgetall failed:", e?.message);
    return 0;
  }
}

function decayConfidence(baseConfidence, drift) {
  if (baseConfidence <= 0) return 0;
  const decayed = baseConfidence * Math.exp(-DECAY_LAMBDA * drift);
  return Math.max(decayed, MIN_CONFIDENCE);
}

async function recordDriftEvent(ruleId, eventType) {
  if (!redis || !DRIFT_WEIGHTS[eventType]) return;
  try {
    await redis.hincrby(`teos:decay:${ruleId}`, eventType, 1);
  } catch (e) {
    console.warn("[confidence-decay] Redis hincrby failed:", e?.message);
  }
}

async function getEffectiveConfidence(ruleId, baseConfidence) {
  const drift = await getRuleDrift(ruleId);
  return decayConfidence(baseConfidence, drift);
}

function confidenceLabel(score) {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  if (score >= 0.25) return "low";
  return "very_low";
}

module.exports = { getRuleDrift, decayConfidence, recordDriftEvent, getEffectiveConfidence, confidenceLabel, DECAY_LAMBDA, MIN_CONFIDENCE };
