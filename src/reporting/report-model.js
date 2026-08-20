const { DataField, RetrievalStatus } = require('./data-integrity');
const { calculateDataConfidence } = require('./confidence');
const { validateVerdict, buildVerdictMessaging } = require('./verdict-validator');

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'informational'];

function buildEmptyDataSources() {
  return {
    holders: DataField.NOT_FOUND('holders'),
    liquidity: DataField.NOT_FOUND('liquidity'),
    metadata: DataField.NOT_FOUND('metadata'),
    authorities: DataField.NOT_FOUND('authorities'),
    dexData: DataField.NOT_FOUND('dexData'),
    marketData: DataField.NOT_FOUND('marketData'),
  };
}

function buildReport(engineResult, dataSources) {
  const sources = dataSources || buildEmptyDataSources();
  const confidence = calculateDataConfidence(sources);

  const findings = (engineResult.findings || []).map(f => ({
    ruleId: f.ruleId,
    name: f.name,
    severity: f.severity || 'informational',
    score: f.score || 0,
    reasons: f.reasons || [],
    matchedPattern: f.matchedPattern || '',
    recommendation: f.recommendation || '',
  }));

  const groupedFindings = {};
  for (const f of findings) {
    const sev = f.severity;
    if (!groupedFindings[sev]) groupedFindings[sev] = [];
    groupedFindings[sev].push(f);
  }

  const findingsSummary = {};
  for (const sev of SEVERITY_ORDER) {
    findingsSummary[sev] = (groupedFindings[sev] || []).length;
  }
  findingsSummary.total = findings.length;

  const report = {
    securityScore: engineResult.score ?? 0,
    verdict: engineResult.verdict || 'ALLOW',
    dataConfidence: confidence.percentage,
    dataConfidenceLevel: confidence.level,
    dataConfidenceWeighted: confidence.weightedScore,
    missingDataSources: confidence.missingSources,
    findings,
    findingsSummary,
    dataSources: sources,
    tokenName: engineResult.tokenName || null,
    mintAddress: engineResult.mintAddress || null,
    auditId: engineResult.auditId || null,
    timestamp: engineResult.timestamp || new Date().toISOString(),
    engineVersion: engineResult.engineVersion || 'unknown',
    rulePackVersion: engineResult.rulePackVersion || 'unknown',
    policyVersion: engineResult.policyVersion || 'unknown',
    engine: engineResult.engine || 'unknown',
  };

  const validation = validateVerdict(report);
  report.verdictValidation = validation;
  report.verdictMessage = buildVerdictMessaging(validation);

  return report;
}

function getSeverityColor(severity) {
  const map = {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#EAB308',
    low: '#22C55E',
    informational: '#3B82F6',
  };
  return map[severity] || '#71717A';
}

function getSeverityIcon(severity) {
  const icons = {
    critical: '!',
    high: '\u25B2',
    medium: '\u25C6',
    low: '\u25BC',
    informational: 'i',
  };
  return icons[severity] || '?';
}

module.exports = {
  buildReport,
  getSeverityColor,
  getSeverityIcon,
  SEVERITY_ORDER,
  buildEmptyDataSources,
};
