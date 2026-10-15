const { logger } = require('../../logger.cjs');
const { append: audit } = require('./audit');

const AMBIGUITY_THRESHOLD = 0.65;
const MAX_SESSION_CONTEXT = 50;
const criticalEvents = ['BLOCK', 'CONFLICTED', 'ESCALATION', 'POLICY_VIOLATION'];
let sessionContext = [];
let escalationLog = [];

function pushContext(event) {
  sessionContext.push({
    ...event,
    _ts: Date.now(),
  });
  if (sessionContext.length > MAX_SESSION_CONTEXT) {
    sessionContext = sessionContext.slice(-Math.floor(MAX_SESSION_CONTEXT / 2));
  }
}

function getContext(limit = 20) {
  return sessionContext.slice(-limit);
}

function clearContext() {
  sessionContext = [];
  escalationLog = [];
}

function getEscalationLog() {
  return escalationLog;
}

function ambiguityScore(semanticExplanation, adjudicatedResult) {
  let score = 0;
  let factors = [];

  if (!semanticExplanation || !adjudicatedResult) {
    return { score: 1.0, factors: ["no_data"], threshold: AMBIGUITY_THRESHOLD, escalate: true };
  }

  if (adjudicatedResult.epistemic === "CONFLICTED") {
    score += 0.4;
    factors.push("engine_conflict");
  }

  if (adjudicatedResult.epistemic === "UNKNOWN") {
    score += 0.5;
    factors.push("no_engines");
  }

  if (adjudicatedResult.epistemic === "INSUFFICIENT_CONTEXT") {
    score += 0.3;
    factors.push("insufficient_context");
  }

  if (adjudicatedResult.confidence?.level === "low") {
    score += 0.2;
    factors.push("low_confidence");
  }

  if (adjudicatedResult.confidence?.level === "none") {
    score += 0.35;
    factors.push("no_confidence");
  }

  if (adjudicatedResult.consensus === "split") {
    score += 0.15;
    factors.push("split_consensus");
  }

  if (adjudicatedResult.uncertainty?.source === "consensus") {
    score += 0.1;
    factors.push("uncertain_consensus");
  }

  if (!adjudicatedResult.semantic || !adjudicatedResult.semantic.root_cause) {
    score += 0.25;
    factors.push("missing_semantic_root_cause");
  }

  const finalScore = Math.min(score, 1.0);
  return {
    score: finalScore,
    factors,
    threshold: AMBIGUITY_THRESHOLD,
    escalate: finalScore >= AMBIGUITY_THRESHOLD,
  };
}

function shouldEscalate(semanticExplanation, adjudicatedResult) {
  const ambig = ambiguityScore(semanticExplanation, adjudicatedResult);
  return ambig.escalate;
}

function escalate(semanticExplanation, adjudicatedResult, context) {
  const ambig = ambiguityScore(semanticExplanation, adjudicatedResult);
  const escalation = {
    timestamp: new Date().toISOString(),
    decision: adjudicatedResult?.verdict || "UNKNOWN",
    ambiguity_score: ambig.score,
    ambiguity_factors: ambig.factors,
    epistemic: adjudicatedResult?.epistemic,
    semantic_reason: semanticExplanation?.semantic_reason || "N/A",
    root_cause: semanticExplanation?.root_cause || "N/A",
    context: context || {},
  };

  escalationLog.push(escalation);
  if (escalationLog.length > 20) {
    escalationLog = escalationLog.slice(-10);
  }

  audit({
    eventType: "ESCALATION",
    verdict: adjudicatedResult?.verdict,
    ambiguity_score: ambig.score,
    ambiguity_factors: ambig.factors,
    epistemic: adjudicatedResult?.epistemic,
    source: "semantic_layer",
  });

  logger.warn({ escalation }, "Semantic ambiguity threshold exceeded — human escalation triggered");
  return escalation;
}

function preserveCritical(info) {
  pushContext({
    eventType: "CRITICAL_PRESERVED",
    decision: info.verdict,
    semantic_reason: info.semantic_reason,
    root_cause: info.root_cause,
    fingerprint: info.fingerprint,
  });

  audit({
    eventType: "CRITICAL_PRESERVED",
    verdict: info.verdict,
    source: "semantic_layer",
  });
}

module.exports = {
  pushContext,
  getContext,
  clearContext,
  getEscalationLog,
  ambiguityScore,
  shouldEscalate,
  escalate,
  preserveCritical,
  AMBIGUITY_THRESHOLD,
  MAX_SESSION_CONTEXT,
};
