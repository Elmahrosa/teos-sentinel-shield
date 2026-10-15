const { append: audit, recent: recentAudit, isCritical } = require('./audit');
const { recordFeedback, checkConfidenceDegradation, FEEDBACK_TYPES } = require('./feedback');
const { getRuleDrift, decayConfidence, recordDriftEvent, getEffectiveConfidence, confidenceLabel, DECAY_LAMBDA, MIN_CONFIDENCE } = require('./confidence-decay');
const { buildProvenance } = require('./provenance');
const { buildSemanticExplanation, explainEachFinding, enrichAdjudication } = require('./semantic-layer');
const { classifyFinding, rootCauseForFinding, recoveryForFinding, semanticForFinding, RULE_MAP, SECRET_TYPE_MAP, SUPPLY_CHAIN_MAP } = require('./semantic-mapper');
const { shouldEscalate, escalate, ambiguityScore, pushContext, getContext, getEscalationLog, preserveCritical, clearContext, AMBIGUITY_THRESHOLD } = require('./context-manager');

module.exports = {
  audit,
  recentAudit,
  isCritical,
  recordFeedback,
  checkConfidenceDegradation,
  FEEDBACK_TYPES,
  getRuleDrift,
  decayConfidence,
  recordDriftEvent,
  getEffectiveConfidence,
  confidenceLabel,
  DECAY_LAMBDA,
  MIN_CONFIDENCE,
  buildProvenance,
  buildSemanticExplanation,
  explainEachFinding,
  enrichAdjudication,
  classifyFinding,
  rootCauseForFinding,
  recoveryForFinding,
  semanticForFinding,
  RULE_MAP,
  SECRET_TYPE_MAP,
  SUPPLY_CHAIN_MAP,
  shouldEscalate,
  escalate,
  ambiguityScore,
  pushContext,
  getContext,
  getEscalationLog,
  preserveCritical,
  clearContext,
  AMBIGUITY_THRESHOLD,
};
