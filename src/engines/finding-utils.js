// Shared utilities for enhanced finding generation

function extractMatch(input, rule) {
  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 5) {
      return trimmed.length > 200 ? trimmed.substring(0, 200) + '...' : trimmed;
    }
  }
  return input.length > 100 ? input.substring(0, 100) + '...' : input;
}

function toRecommendation(reasons, severity) {
  const primary = reasons && reasons.length > 0 ? reasons[0] : 'No specific recommendation';
  const prefix = severity === 'critical' ? 'Immediate action: '
    : severity === 'high' ? 'Required action: '
    : severity === 'medium' ? 'Recommended: '
    : 'Review: ';
  return prefix + primary;
}

function buildFindings(input, rules, triggered, ruleMap) {
  return triggered.map(t => ({
    ruleId: t.id,
    name: t.name,
    severity: t.sev,
    score: t.score,
    reasons: t.reasons,
    matchedPattern: extractMatch(input, t),
    recommendation: toRecommendation(t.reasons, t.sev),
  }));
}

module.exports = { extractMatch, toRecommendation, buildFindings };
