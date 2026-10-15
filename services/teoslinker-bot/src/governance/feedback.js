const { recordDriftEvent, getEffectiveConfidence, decayConfidence } = require('./confidence-decay');
const { append: auditAppend } = require('./audit');

const FEEDBACK_TYPES = {
  TRUE_POSITIVE: "true_positive",
  FALSE_POSITIVE: "false_positive",
  UNCLEAR: "unclear",
  OVERRIDE_ALLOW: "override_allow",
  OVERRIDE_BLOCK: "override_block",
};

const MAX_CONFIDENCE_ADJUSTMENT = 0.3;
const ADVERSARIAL_THRESHOLD = 5;
const OPERATOR_WEIGHT = 1.0;
const USER_WEIGHT = 0.3;

const feedbackCounts = {};

function isAdversarial(userId) {
  if (!feedbackCounts[userId]) return false;
  if (feedbackCounts[userId].length < 20) return false;
  const recent = feedbackCounts[userId].slice(-20);
  const falsePositives = recent.filter(f => f === FEEDBACK_TYPES.FALSE_POSITIVE).length;
  return falsePositives >= ADVERSARIAL_THRESHOLD;
}

function isOperator(userId) {
  const operators = (process.env.OPERATOR_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
  return userId && operators.includes(userId);
}

function getWeight(userId) {
  if (!userId) return USER_WEIGHT;
  if (isOperator(userId)) return OPERATOR_WEIGHT;
  return USER_WEIGHT;
}

function trackFeedback(userId, type) {
  if (!feedbackCounts[userId]) feedbackCounts[userId] = [];
  feedbackCounts[userId].push(type);
  if (feedbackCounts[userId].length > 50) feedbackCounts[userId] = feedbackCounts[userId].slice(-50);
}

async function recordFeedback({ userId, ruleId, verdict, feedbackType, comment }) {
  if (!ruleId) return;

  if (isAdversarial(userId)) return;

  const weight = getWeight(userId);
  trackFeedback(userId, feedbackType);

  if (feedbackType === FEEDBACK_TYPES.FALSE_POSITIVE) {
    const adjustedDrift = 0.4 * weight; // drift weight * user trust weight
    await recordDriftEvent(ruleId, "false_positive");
  }
  if (feedbackType === FEEDBACK_TYPES.OVERRIDE_ALLOW || feedbackType === FEEDBACK_TYPES.OVERRIDE_BLOCK) {
    await recordDriftEvent(ruleId, "override");
  }

  await auditAppend({
    eventType: "FEEDBACK",
    verdict,
    score: null,
    confidence: null,
    consensus: null,
    userId,
    decisiveRule: ruleId,
    source: "feedback",
    weight,
  });
}

async function checkConfidenceDegradation(ruleIds) {
  const results = [];
  for (const ruleId of ruleIds || []) {
    const eff = await getEffectiveConfidence(ruleId, 1.0);
    results.push({ ruleId, effectiveConfidence: eff });
  }
  return results;
}

module.exports = { recordFeedback, checkConfidenceDegradation, FEEDBACK_TYPES, isAdversarial, isOperator };
