const { classifyFinding, semanticForFinding, rootCauseForFinding, recoveryForFinding } = require('./semantic-mapper');
const { logger } = require('../../logger.cjs');

function buildSemanticExplanation(adjudicatedResult) {
  const { verdict, epistemic, score, riskLevel, reasons, provenance, confidence, consensus, uncertainty } = adjudicatedResult;

  if (!adjudicatedResult || !verdict) {
    return {
      decision: "UNKNOWN",
      semantic_reason: "No decision data available to analyze",
      root_cause: "Adjudication returned empty or invalid result",
      recovery_suggestion: "Check engine connectivity and retry the scan",
    };
  }

  const allFindings = (provenance || []).flatMap(p => {
    if (!p.reasons || p.reasons.length === 0) return [];
    const ruleId = Array.isArray(p.ruleIds) && p.ruleIds.length > 0 ? p.ruleIds[0] : null;
    return p.reasons.map(r => ({ reasons: [r], source: p.source, verdict: p.verdict, rule: ruleId }));
  });

  const blockingFindings = allFindings.filter(f => f.verdict === "BLOCK");
  const warnFindings = allFindings.filter(f => f.verdict === "WARN" || !f.verdict);
  const primaryFinding = blockingFindings.length > 0 ? blockingFindings[0]
    : warnFindings.length > 0 ? warnFindings[0]
    : allFindings.length > 0 ? allFindings[0]
    : null;

  let rootCause = "";
  if (verdict === "BLOCK") {
    if (primaryFinding) {
      rootCause = rootCauseForFinding(primaryFinding);
    } else {
      rootCause = "One or more rules triggered a BLOCK decision based on deterministic pattern matching";
    }
  } else if (verdict === "WARN") {
    if (primaryFinding) {
      rootCause = rootCauseForFinding(primaryFinding);
    } else if (epistemic === "LOW_CONFIDENCE") {
      rootCause = "Confidence was low due to engine disagreement or single-source coverage — verdict downgraded from BLOCK";
    } else {
      rootCause = "Findings below BLOCK threshold but above ALLOW baseline — advisory flags raised";
    }
  } else if (verdict === "ALLOW") {
    if (epistemic === "INSUFFICIENT_CONTEXT") {
      rootCause = "Input was too short for meaningful analysis — less than 3 characters";
    } else if (uncertainty?.source === "coverage") {
      rootCause = "Only one engine was reachable — coverage gap may mask risks";
    } else {
      rootCause = "No deterministic rule violations detected across all engines";
    }
  } else {
    rootCause = "Engine infrastructure issue prevented adjudication";
  }

  let semanticReason = "";
  if (verdict === "BLOCK") {
    const count = blockingFindings.length;
    const reasons_ = [...new Set(blockingFindings.map(f => f.reasons?.[0] || "").filter(Boolean))];
    if (reasons_.length === 1) {
      semanticReason = semanticForFinding(primaryFinding);
    } else if (reasons_.length <= 3) {
      semanticReason = `${reasons_.length} blocking violations found: ${reasons_.join("; ")}`;
    } else {
      semanticReason = `${count} blocking violations found — ${reasons_.slice(0, 3).join("; ")} and ${reasons_.length - 3} more`;
    }
  } else if (verdict === "WARN") {
    const warnCount = warnFindings.length;
    if (epistemic === "LOW_CONFIDENCE" && primaryFinding) {
      semanticReason = `Confidence too low to BLOCK — verdict downgraded to WARN. Trigger: ${semanticForFinding(primaryFinding)}`;
    } else if (warnCount > 0) {
      const reasons_ = [...new Set(warnFindings.map(f => f.reasons?.[0] || "").filter(Boolean))];
      semanticReason = `${warnCount} advisory finding(s) raised — no direct block but review recommended`;
    } else {
      semanticReason = "Provisional WARN based on partial coverage — no blocking findings";
    }
  } else if (verdict === "ALLOW") {
    if (epistemic === "INSUFFICIENT_CONTEXT") {
      semanticReason = "Input too short for confidence — allowed by default";
    } else if (allFindings.length === 0) {
      semanticReason = "Clean scan — no deterministic rule violations detected";
    } else {
      semanticReason = "No blocking or warning patterns found — operation is safe";
    }
  } else {
    semanticReason = "Unable to evaluate — engine infrastructure unavailable";
  }

  let recoverySuggestion = "";
  if (verdict === "BLOCK") {
    if (primaryFinding) {
      recoverySuggestion = recoveryForFinding(primaryFinding);
    } else {
      recoverySuggestion = "Review each blocked finding. Fix violations before re-deploying. Use /report for full audit.";
    }
  } else if (verdict === "WARN") {
    if (epistemic === "LOW_CONFIDENCE" && primaryFinding) {
      recoverySuggestion = `Address the triggering finding: ${recoveryForFinding(primaryFinding)}`;
    } else if (warnFindings.length > 0) {
      recoverySuggestion = "Review flagged patterns before production deployment. Use /report for detailed analysis.";
    } else {
      recoverySuggestion = "Improve engine coverage. Verify both local MCP and cloud Sentinel are reachable.";
    }
  } else if (verdict === "ALLOW") {
    if (epistemic === "INSUFFICIENT_CONTEXT") {
      recoverySuggestion = "Provide longer input for meaningful analysis. Minimum 3 characters required.";
    } else if (uncertainty?.source === "coverage") {
      recoverySuggestion = "Verify cloud Sentinel is reachable for multi-engine coverage on critical scans.";
    } else {
      recoverySuggestion = "No action required. Continue with normal operations.";
    }
  } else {
    recoverySuggestion = "Check engine status. Verify MCP and Sentinel API endpoints are healthy.";
  }

  const semanticExplanation = {
    decision: verdict,
    semantic_reason: semanticReason,
    root_cause: rootCause,
    recovery_suggestion: recoverySuggestion,
  };

  if (epistemic) semanticExplanation.epistemic_state = epistemic;
  if (confidence) semanticExplanation.confidence = confidence;
  if (consensus) semanticExplanation.consensus = consensus;
  if (riskLevel) semanticExplanation.risk_level = riskLevel;

  return semanticExplanation;
}

function explainEachFinding(adjudicatedResult) {
  const { provenance } = adjudicatedResult;
  if (!provenance || provenance.length === 0) return [];

  const enriched = [];
  const seen = new Set();

  for (const p of provenance) {
    if (!p.reasons || p.reasons.length === 0) continue;
    for (const r of p.reasons) {
      if (seen.has(r)) continue;
      seen.add(r);
      const ruleId = Array.isArray(p.ruleIds) && p.ruleIds.length > 0 ? p.ruleIds[0] : null;
      const finding = { reasons: [r], source: p.source, verdict: p.verdict, rule: ruleId };
      const classified = classifyFinding(r, finding);
      enriched.push({
        reason: r,
        verdict: p.verdict,
        source: p.source,
        semantic: classified ? {
          semantic_reason: classified.mapping.semantic_reason,
          root_cause: classified.mapping.root_cause,
          recovery_suggestion: classified.mapping.recovery_suggestion,
          rule_id: classified.key,
        } : null,
      });
    }
  }

  return enriched;
}

function enrichAdjudication(adjudicatedResult) {
  if (!adjudicatedResult) return null;

  const semantic = buildSemanticExplanation(adjudicatedResult);
  const findingExplanations = explainEachFinding(adjudicatedResult);

  return {
    ...adjudicatedResult,
    semantic,
    findings_explained: findingExplanations,
  };
}

module.exports = {
  buildSemanticExplanation,
  explainEachFinding,
  enrichAdjudication,
};
