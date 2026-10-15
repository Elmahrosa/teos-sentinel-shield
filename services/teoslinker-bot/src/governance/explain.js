const { getRule } = require('../rules/registry');
const { getEffectiveConfidence, confidenceLabel } = require('./confidence-decay');

function humanExplanation(adjudicationResult, input) {
  const { verdict, epistemic, score, confidence, consensus, provenanceAnalysis, riskLevel } = adjudicationResult;
  const parts = [];

  const verdictLabels = { ALLOW: "allowed", WARN: "flagged", BLOCK: "blocked", UNKNOWN: "unknown" };
  parts.push(`This action was ${verdictLabels[verdict] || verdict} (risk score: ${score}/100).`);

  if (epistemic === "CONFIDENT") parts.push("The system is confident in this determination — both engines agreed.");
  else if (epistemic === "PROVISIONAL") parts.push("This determination is provisional — only one engine contributed.");
  else if (epistemic === "LOW_CONFIDENCE") parts.push("Confidence is low — the verdict was downgraded from a stricter outcome.");
  else if (epistemic === "CONFLICTED") parts.push("Engines gave conflicting assessments — this requires human review.");
  else if (epistemic === "INSUFFICIENT_CONTEXT") parts.push("The input was too short for meaningful analysis.");
  else if (epistemic === "UNKNOWN") parts.push("No engines were reachable to evaluate this action.");

  if (confidence && confidence.level && confidence.level !== "none") {
    parts.push(`Confidence: ${confidence.label}.`);
  }

  if (provenanceAnalysis) {
    const { decisionType, decisiveEngine, decisiveRule, signalWeights } = provenanceAnalysis;
    if (decisionType) {
      const typeLabels = {
        consensus: "Reached by consensus across all engines.",
        heuristic: "Based on a single engine assessment (heuristic).",
        strictest: "Using the strictest engine assessment.",
        downgraded: "Downgraded from a stricter verdict due to low confidence.",
        insufficient_context: "Insufficient context to evaluate.",
        no_data: "No data available.",
      };
      parts.push(typeLabels[decisionType] || "");
    }
    if (decisiveEngine) parts.push(`Primary source: ${decisiveEngine}.`);
    if (decisiveRule) parts.push(`Triggering finding: ${decisiveRule}.`);
    if (signalWeights && Object.keys(signalWeights).length > 0) {
      const weights = Object.entries(signalWeights)
        .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
        .join(", ");
      parts.push(`Signal distribution: ${weights}.`);
    }
  }

  if (riskLevel && riskLevel !== "info") {
    parts.push(`Risk classification: ${riskLevel.toUpperCase()}.`);
  }

  const result = adjudicationResult.reasons || [];
  if (result.length > 0) {
    const unique = [...new Set(result)];
    parts.push(`Findings (${unique.length}): ${unique.slice(0, 5).join("; ")}${unique.length > 5 ? ` +${unique.length - 5} more` : ""}.`);
  }

  return parts.filter(Boolean).join(" ");
}

function machineExplanation(adjudicationResult) {
  const { verdict, epistemic, score, confidence, consensus, provenanceAnalysis, riskLevel, reasons } = adjudicationResult;
  return {
    verdict,
    epistemic,
    score,
    confidenceLevel: confidence?.level || "unknown",
    consensus: consensus || "no_data",
    decisionType: provenanceAnalysis?.decisionType || "unknown",
    decisiveEngine: provenanceAnalysis?.decisiveEngine || null,
    decisiveRule: provenanceAnalysis?.decisiveRule || null,
    signalWeights: provenanceAnalysis?.signalWeights || {},
    riskLevel: riskLevel || "unknown",
    ruleCount: (reasons || []).length,
    uncertainty: adjudicationResult.uncertainty || null,
  };
}

module.exports = { humanExplanation, machineExplanation };
