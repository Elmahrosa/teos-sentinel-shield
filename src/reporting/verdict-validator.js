function validateVerdict(report) {
  if (!report || !report.verdict) {
    return { valid: false, warnings: ['No verdict present'], messages: [] };
  }

  const warnings = [];
  const messages = [];

  if (report.verdict === 'ALLOW' && report.dataConfidence < 80) {
    warnings.push('LOW_CONFIDENCE_ALLOW');
    const missing = report.missingDataSources || [];
    if (missing.length > 0) {
      messages.push(
        `Security rules indicate Low Risk, however ${missing.length} data source(s) are incomplete (${missing.join(', ')}). Manual verification recommended.`
      );
    } else {
      messages.push(
        'Security rules indicate Low Risk, however external data confidence is reduced. Manual verification recommended.'
      );
    }
  }

  if (report.verdict === 'ALLOW' && (!report.findings || report.findings.length === 0) && report.dataConfidence < 50) {
    warnings.push('LOW_CONFIDENCE_NO_FINDINGS');
    if (!messages.length) {
      messages.push(
        'No security issues detected, but data confidence is too low to draw conclusions. Manual verification strongly recommended.'
      );
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
    messages,
    verdict: report.verdict,
    score: report.score,
  };
}

function buildVerdictMessaging(validation) {
  if (validation.valid || validation.messages.length === 0) {
    return null;
  }
  return validation.messages[0];
}

const CONTRADICTION_RULES = [];

module.exports = { validateVerdict, buildVerdictMessaging, CONTRADICTION_RULES };
