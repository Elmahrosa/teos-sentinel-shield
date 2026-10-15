const { scoreBar } = require("../utils/scoring");
const { safeTest } = require("../security/safe-regex");

function classifySeverity(score) {
  if (score >= 80) return { label: 'CRITICAL', color: '#e74c3c', badge: '\u{1F6D1}' };
  if (score >= 60) return { label: 'HIGH',     color: '#e67e22', badge: '\u26A0\uFE0F' };
  if (score >= 40) return { label: 'MEDIUM',   color: '#f1c40f', badge: '\u26A0\uFE0F' };
  if (score >= 20) return { label: 'LOW',      color: '#27ae60', badge: '\u2139\uFE0F' };
  return { label: 'INFO', color: '#3498db', badge: '\u2139\uFE0F' };
}

const FINDING_TYPES = [
  { type: 'Secret Leak', re: /secret|key|token|password|credential|api.?key/i },
  { type: 'Supply Chain Risk', re: /package|dependency|lockfile|supply.?chain|malicious|compromised/i },
  { type: 'Destructive Command', re: /destructive|rm.?-.?rf|delete|wipe|drop|format|damage/i },
  { type: 'Destructive Command', re: /exec|shell|command|injection|system/i },
  { type: 'Binary Risk', re: /binary|artifact|executable/i },
  { type: 'Trusted Infrastructure', re: /trusted|infrastructure|admin/i },
  { type: 'Solana Security', re: /SOLANA|solana/i },
  { type: 'EVM Security', re: /\[EVM\]|EVM-/i },
];

const IMPACT_PATTERNS = [
  { re: /rm.?-.?rf|delete|wipe|destructive|damage|drop/i, impact: 'Full or partial system data loss' },
  { re: /secret|key|token|password|credential/i, impact: 'Unauthorized access to services or infrastructure' },
  { re: /exec|shell|command|injection|system/i, impact: 'Remote code execution or command injection' },
  { re: /network|exfil|dns|curl|wget|exfiltrat/i, impact: 'Data exfiltration to external servers' },
  { re: /install|postinstall|preinstall|script/i, impact: 'Supply chain compromise via package installation' },
  { re: /malicious|compromised|backdoor/i, impact: 'Backdoor or trojan execution in build pipeline' },
  { re: /token|api.?key/i, impact: 'Credential theft and unauthorized API access' },
];

const RULE_CATEGORY_PREFIX = [
  { prefixes: ['SECRET.', 'HARDCODED_SECRET', 'KEY_EXFIL', 'BASE64_EXEC'], category: 'Secret Leak' },
  { prefixes: ['DESTRUCTIVE_', 'SHELL.', 'INJECTION.', 'ESCAPE.', 'EXFIL.', 'OBFUSCATION.'], category: 'Destructive Command' },
  { prefixes: ['SUPPLY_CHAIN_'], category: 'Supply Chain Risk' },
  { prefixes: ['CRYPTO.'], category: 'Crypto Mining' },
  { prefixes: ['AUTH.', 'NET.', 'CONFIG.', 'DESER.'], category: 'Privilege Escalation' },
];

const CATEGORY_RECOMMENDATIONS = {
  'Secret Leak': [
    'Rotate exposed credentials immediately',
    'Move secrets to environment variables or a secrets vault',
    'Remove hardcoded secrets from source control and commit history',
  ],
  'Destructive Command': [
    'Require manual approval before executing destructive operations',
    'Restrict execution scope to specific paths and users',
    'Review automation scripts for safer alternatives',
  ],
  'Supply Chain Risk': [
    'Pin dependency versions in package manifest',
    'Verify package signatures against official sources',
    'Review dependency source and maintain an SBOM',
  ],
  'Crypto Mining': [
    'Use cryptographically secure random generators (crypto.randomBytes)',
    'Upgrade weak hash functions to SHA-256 or Argon2',
    'Audit all cryptographic implementations for compliance',
  ],
  'Privilege Escalation': [
    'Apply least-privilege principle across all services',
    'Review authentication and authorization logic',
    'Restrict network access and validate all user inputs',
  ],
  'Binary Risk': [
    'Do not execute untrusted binaries in production',
    'Verify checksums against official distribution sources',
    'Maintain a binary allowlist for execution environments',
  ],
  'Trusted Infrastructure': [
    'Verify infrastructure configurations follow security baselines',
    'Restrict CORS, TLS, and security headers to production-ready values',
    'Audit CI/CD pipeline for secret exposure risks',
  ],
  'Security Risk': [
    'Review the flagged pattern for potential security impact',
    'Apply principle of least privilege',
    'Document the security rationale if the pattern is intentional',
  ],
};

const SECRET_RULE_IDS = new Set([
  'openai-api-key', 'anthropic-api-key', 'github-pat', 'aws-access-key',
  'aws-secret-key', 'azure-connection-string', 'azure-tenant', 'gcp-api-key',
  'heroku-api-key', 'stripe-api-key', 'twilio-credentials', 'discord-token',
  'npm-token', 'telegram-bot-token', 'private-rsa-key', 'pem-certificate',
  'database-url', 'jwt-secret', 'slack-token', 'HARDCODED_SECRET',
  'hardcoded-secret', 'KEY_EXFIL', 'credential-exfil', 'high-value-secret',
  'SECRET.API_KEY', 'SECRET.PRIVATE_KEY', 'SECRET.TOKEN', 'SECRET.ENV_FILE',
  'SECRET.HIGH_ENTROPY', 'SECRET.AWS_KEY', 'SECRET.HIGH_VALUE',
]);

const DESTRUCTIVE_RULE_IDS = new Set([
  'destructive-shell-cmd', 'no-eval', 'no-new-function', 'no-shell-exec',
  'sql-injection', 'no-innerhtml', 'no-document-write', 'unsafe-deserialization',
  'reverse-shell', 'obfuscation-base64-pipe', 'docker-escape', 'kubectl-abuse',
  'xxe-injection', 'path-traversal', 'ssrf-user-controlled-url-fetch',
  'ssrf-user-controlled-url-axios', 'ssrf-user-controlled-url-http',
  'ssrf-user-controlled-url-got', 'DESTRUCTIVE_RM_RF', 'DESTRUCTIVE_MKFS',
  'DESTRUCTIVE_DD', 'DESTRUCTIVE_CHMOD', 'DESTRUCTIVE_CHOWN',
  'DESTRUCTIVE_FORK_BOMB', 'DESTRUCTIVE_CURL_PIPE_SH', 'DESTRUCTIVE_SUDO_RM',
  'DESTRUCTIVE_DOCKER_PRUNE', 'DESTRUCTIVE_KUBERNETES_DELETE',
  'SHELL.DESTRUCTIVE_CMD', 'SHELL.REVERSE', 'INJECTION.EVAL',
  'INJECTION.FUNCTION_CTOR', 'INJECTION.EXEC', 'INJECTION.SQL',
  'INJECTION.TEMPLATE_CMD', 'OBFUSCATION.BASE64_PIPE', 'ESCAPE.DOCKER_SOCKET',
  'ESCAPE.KUBECTL_ABUSE', 'EXFIL.NETWORK_TOOL', 'DESER.PICKLE',
  'DESER.YAML_UNSAFE', 'DESER.UNSERIALIZE', 'BASE64_EXEC',
]);

const SUPPLY_CHAIN_RULE_IDS = new Set([
  'SUPPLY_CHAIN_MALICIOUS', 'SUPPLY_CHAIN_INSTALL_SCRIPT', 'SUPPLY_CHAIN_LOCKFILE',
]);

const CRYPTO_RULE_IDS = new Set([
  'CRYPTO.MD5', 'CRYPTO.SHA1', 'CRYPTO.MATH_RANDOM', 'CRYPTO.HARDCODED_SALT',
  'insecure-random',
]);

const PRIVILEGE_RULE_IDS = new Set([
  'AUTH.BYPASS', 'AUTH.PERMISSIVE_ACL', 'prototype-pollution',
  'NET.SSRF', 'NET.OPEN_REDIRECT', 'CONFIG.CORS_STAR', 'CONFIG.TLS_REJECT',
  'CONFIG.SECURITY_HEADER_OFF', 'CONFIG.CI_SECRET_EXPOSURE',
  'no-cors-wildcard', 'http-no-tls', 'lint-suppression',
]);

function expectedCategoryForRule(ruleId) {
  if (!ruleId) return null;
  if (SECRET_RULE_IDS.has(ruleId)) return 'Secret Leak';
  if (DESTRUCTIVE_RULE_IDS.has(ruleId)) return 'Destructive Command';
  if (SUPPLY_CHAIN_RULE_IDS.has(ruleId)) return 'Supply Chain Risk';
  if (CRYPTO_RULE_IDS.has(ruleId)) return 'Crypto Mining';
  if (PRIVILEGE_RULE_IDS.has(ruleId)) return 'Privilege Escalation';
  for (const group of RULE_CATEGORY_PREFIX) {
    if (group.prefixes.some(p => ruleId.startsWith(p))) return group.category;
  }
  return null;
}

function validateFindingClassification(finding) {
  const ruleId = finding.rule_id || finding.rule;
  if (!ruleId) return { valid: true, actual: null, expected: null };
  const expected = expectedCategoryForRule(ruleId);
  if (!expected) return { valid: true, actual: null, expected: null };
  const reasons = finding.reasons || [];
  const actual = classifyFindingType(reasons, finding);
  if (actual !== expected) {
    return { valid: false, actual, expected, ruleId };
  }
  return { valid: true, actual, expected };
}

function validateCounterIntegrity(data) {
  const ds = data.detectionSummary;
  if (!ds) return { valid: false, reason: 'No detection summary available' };
  const totalDetections = (ds.secrets || 0) + (ds.supplyChain || 0) + (ds.destructive || 0);
  const issuesFound = (data.blockingCount || 0) + (data.warnCount || 0);
  const untracked = (ds.totalFindings || 0) - totalDetections;
  if (totalDetections > issuesFound) {
    return { valid: false, reason: `Counter mismatch: categorized detections (${totalDetections}) exceeds total issues (${issuesFound})` };
  }
  if (issuesFound > 0 && totalDetections === 0 && ds.totalFindings === 0) {
    return { valid: false, reason: `Counter mismatch: ${issuesFound} issues reported but no findings in summary` };
  }
  if (untracked < 0) {
    return { valid: false, reason: `Counter mismatch: totalFindings (${ds.totalFindings}) less than categorized (${totalDetections})` };
  }
  return { valid: true };
}

function classifyFindingType(reasons, finding) {
  if (finding && finding.package_name) {
    const associatedType = expectedCategoryForRule(finding.rule_id || finding.rule);
    if (associatedType) return associatedType;
    return 'Supply Chain Risk';
  }
  if (finding && finding.findings && finding.findings.length > 0) {
    const associatedType = expectedCategoryForRule(finding.rule_id || finding.rule);
    if (associatedType) return associatedType;
    const innerType = classifyFindingType(finding.reasons || [], finding.findings[0]);
    return innerType;
  }
  const ruleId = finding && (finding.rule_id || finding.rule);
  if (ruleId) {
    const associatedType = expectedCategoryForRule(ruleId);
    if (associatedType) return associatedType;
  }
  const reasonText = (reasons || []).join(' ').toLowerCase();
  for (const ft of FINDING_TYPES) {
    if (safeTest(ft.re, reasonText)) return ft.type;
  }
  return 'Security Risk';
}

function findingImpact(reasons) {
  const text = (reasons || []).join(' ');
  const impacts = [];
  for (const ip of IMPACT_PATTERNS) {
    if (safeTest(ip.re, text)) impacts.push(ip.impact);
  }
  if (impacts.length === 0) impacts.push('Security policy violation');
  return [...new Set(impacts)];
}

function findingRecommendation(type) {
  const actions = CATEGORY_RECOMMENDATIONS[type] || CATEGORY_RECOMMENDATIONS['Security Risk'];
  return actions.join(' | ');
}

function riskBreakdown(findings) {
  let secrets = 0, supplyChain = 0, execution = 0, binary = 0;
  for (const f of (findings || [])) {
    const reasons = f.reasons || [];
    const type = classifyFindingType(reasons, f);
    const score = Math.min(f.score || 0, 100);
    if (type === 'Secret Leak') secrets = Math.min(secrets + score, 100);
    else if (type === 'Supply Chain Risk') supplyChain = Math.min(supplyChain + score, 100);
    else if (type === 'Destructive Command') execution = Math.min(execution + score, 100);
    else if (type === 'Binary Risk') binary = Math.min(binary + score, 100);
    else execution = Math.min(execution + score, 100);
  }
  return {
    secretsExposure: secrets,
    supplyChain,
    execution,
    binaryRisk: binary,
  };
}

function detectionSummary(findings, skippedBinaries, totalFiles) {
  const all = (findings || []);
  const isInline = !totalFiles || totalFiles === 0;
  const safeFiles = isInline
    ? (all.length === 0 ? 1 : 0)
    : Math.max(0, (totalFiles || 0) - all.length - (skippedBinaries || []).length);
  return {
    secrets: all.filter(f => classifyFindingType(f.reasons, f) === 'Secret Leak').length,
    supplyChain: all.filter(f => classifyFindingType(f.reasons, f) === 'Supply Chain Risk').length,
    destructive: all.filter(f => classifyFindingType(f.reasons, f) === 'Destructive Command').length,
    binariesSkipped: (skippedBinaries || []).length,
    safeFiles,
    totalFindings: all.length,
  };
}

function formatFinding(f, index) {
  const reasons = f.reasons || [];
  const validation = validateFindingClassification(f);
  const type = validation.valid ? (validation.actual || classifyFindingType(reasons, f)) : validation.expected;
  const sev = classifySeverity(f.score || 50);
  const impacts = findingImpact(reasons);
  const rec = findingRecommendation(type);
  const evidenceSnippet = f.evidence_snippet || f.matched_pattern || reasons.join(', ');
  return {
    index: index + 1,
    severity: sev.label,
    type,
    description: reasons.length > 0 ? reasons[0] : 'No description available',
    location: f.file || f.rule || 'unknown',
    impact: impacts.join('; '),
    evidence: evidenceSnippet,
    recommendation: rec,
    rule_id: f.rule_id || f.rule || null,
    line_number: f.line_number || null,
    matched_pattern: f.matched_pattern || null,
    evidence_snippet: evidenceSnippet.length > 120 ? evidenceSnippet.slice(0, 120) + '...' : evidenceSnippet,
    classification_valid: validation.valid,
  };
}

function formatTelegramReport(result, left, tierIcon, tierName) {
  const verdict = String(result.verdict || 'ALLOW').toUpperCase();
  const score = Number(result.score ?? 0);
  const sev = classifySeverity(score);
  const D = '\u2501'.repeat(19);
  const findings = result.gitHub?.findings || result.findings || [];
  const isGitHub = !!result.gitHub;
  const summary = detectionSummary(findings, result.skippedBinaries, result.filesScanned);
  const breakdown = riskBreakdown(findings);
  const blockingFindings = findings.filter(f => f.verdict === 'BLOCK');
  const heuristic = result.heuristic;

  const decisionBadge = verdict === 'REVIEW' ? '\u{1F50D}' : sev.badge;

  let msg =
`\u{1F6E1}\uFE0F TEOS SENTINEL REPORT
${D}
${isGitHub ? `Repo: ${result.gitHub?.owner}/${result.gitHub?.repo}` : 'Scan: Inline Code'}
Risk: ${score}/100 (${verdict === 'REVIEW' ? 'REVIEW' : sev.label})
Decision: ${verdict} ${decisionBadge}
${D}`;

  if (result.reviewReason) {
    msg += `\u{1F50D} ${result.reviewReason}\n${D}\n`;
  }

  if (verdict === 'REVIEW' && heuristic) {
    const signals = [];
    for (const [key, val] of Object.entries(heuristic.signals || {})) {
      if (val > 0) signals.push(`${key.replace(/([A-Z])/g, ' $1').trim()}: ${val}/20`);
    }
    if (signals.length > 0) {
      msg += `\u{1F9D0} Suspicion Signals (${heuristic.suspicionScore}/100)\n`;
      signals.forEach(s => { msg += `  \u{1F50D} ${s}\n`; });
      msg += `${D}\n`;
    }
  }

  if (result.semantic) {
    msg += `\u{1F9D0} ${result.semantic.semantic_reason}\n${D}\n`;
  }

  if (blockingFindings.length > 0) {
    msg += `\u{1F525} ${blockingFindings.length} Critical Finding(s) Found\n`;
  } else if (findings.filter(f => f.verdict === 'WARN' || !f.verdict).length > 0) {
    msg += `\u26A0\uFE0F ${findings.filter(f => f.verdict === 'WARN' || !f.verdict).length} Warning(s)\n`;
  } else {
    msg += `\u2705 No security issues detected\n`;
  }

  if (blockingFindings.length > 0) {
    msg += `${D}\n`;
    for (const f of blockingFindings.slice(0, 3)) {
      const reasons = f.reasons || [];
      const type = classifyFindingType(reasons, f);
      const impacts = findingImpact(reasons);
      const ruleId = f.rule_id || f.rule || '';

      const explained = (result.findings_explained || []).find(e => e.reason === reasons[0]);
      const semanticLine = explained?.semantic
        ? `  \u{1F4A1} ${explained.semantic.root_cause}\n`
        : "";
      const ruleLine = ruleId ? `  \u{1F3F7} Rule: ${ruleId}\n` : '';

      msg += `\u{1F4DD} ${type}\n${ruleLine}  ${reasons[0] || 'No details'}\n${semanticLine}  ${impacts[0] || ''}\n\n`;
    }
    if (blockingFindings.length > 3) {
      msg += `...and ${blockingFindings.length - 3} more finding(s). Use /report for full audit.\n`;
    }
  }

  if (summary.secrets > 0 || summary.supplyChain > 0) {
    msg += `${D}\u{1F50D} Detection Summary\n`;
    if (summary.secrets > 0) msg += `\u{1F510} Secrets: ${summary.secrets}\n`;
    if (summary.supplyChain > 0) msg += `\u{1F4E6} Supply Chain: ${summary.supplyChain}\n`;
    if (summary.destructive > 0) msg += `\u{1F4A5} Destructive: ${summary.destructive}\n`;
  }

  msg += `${D}\u{1F4A1} Recommended Action\n`;
  if (result.semantic?.recovery_suggestion) {
    msg += `${result.semantic.recovery_suggestion}\n`;
  } else if (verdict === 'BLOCK') {
    msg += `Do not deploy. Review ${blockingFindings.length} critical finding(s). Use /report for full audit.\n`;
  } else if (verdict === 'WARN') {
    msg += `Review flagged patterns before deployment. Use /report for detailed analysis.\n`;
  } else if (verdict === 'REVIEW') {
    msg += `Manual human review required. Heuristic engine detected suspicious patterns but no deterministic rule matched.\n`;
  } else {
    msg += `No action required. Code appears safe.\n`;
  }

  const commitSha = result.commitSha;
  if (commitSha || result.fingerprint?.fingerprint) {
    const auditId = String(commitSha || result.fingerprint?.fingerprint || '').slice(0, 12);
    msg += `${D}\u{1F517} Audit: ${auditId}\n`;
  }

  msg += `${D}Credits: ${left} (${tierIcon} ${tierName})`;
  return msg;
}

function buildReportData(scanResult, code) {
  const verdict = String(scanResult.verdict || 'ALLOW').toUpperCase();
  const score = Number(scanResult.score ?? 0);
  const sev = classifySeverity(score);
  const findings = scanResult.gitHub?.findings || scanResult.findings || [];
  const isGitHub = !!scanResult.gitHub;
  const summary = detectionSummary(findings, scanResult.skippedBinaries, scanResult.filesScanned);
  const breakdown = riskBreakdown(findings);
  const blockingFindings = findings.filter(f => f.verdict === 'BLOCK');
  const warnFindings = findings.filter(f => f.verdict === 'WARN' || !f.verdict);

  const semantic = scanResult.semantic || null;
  const findingExplanations = scanResult.findings_explained || [];

  const formattedFindings = findings.map((f, i) => formatFinding(f, i));

  const counterCheck = validateCounterIntegrity({
    detectionSummary: summary,
    blockingCount: blockingFindings.length,
    warnCount: warnFindings.length,
  });

  return {
    verdict,
    score,
    severity: sev,
    isGitHub,
    repo: isGitHub ? `${scanResult.gitHub.owner}/${scanResult.gitHub.repo}` : null,
    owner: scanResult.gitHub?.owner,
    repoName: scanResult.gitHub?.repo,
    branch: scanResult.gitHub?.branch,
    filesScanned: scanResult.filesScanned || 0,
    commitSha: scanResult.commitSha ? String(scanResult.commitSha).slice(0, 12) : null,
    defaultBranch: scanResult.defaultBranch,
    findings: formattedFindings,
    findings_explained: findingExplanations,
    blockingCount: blockingFindings.length,
    warnCount: warnFindings.length,
    skippedBinaries: scanResult.skippedBinaries || [],
    detectionSummary: summary,
    riskBreakdown: breakdown,
    scannedInput: code || null,
    auditId: scanResult.fingerprint?.fingerprint?.slice(0, 16) || scanResult.commitSha?.slice(0, 16) || `teos-${Date.now().toString(36)}`,
    engineVersion: scanResult.engine?.engineVersion || '5.1.0',
    ruleSet: scanResult.engine?.rulePackVersion
      ? `${scanResult.engine.rulePackVersion} (${scanResult.engine.totalRules ?? '?'} core rules)`
      : 'rules-258 (95 core + 163 specialized)',
    timestamp: new Date().toISOString(),
    semantic: semantic ? {
      decision: semantic.decision,
      semantic_reason: semantic.semantic_reason,
      root_cause: semantic.root_cause,
      recovery_suggestion: semantic.recovery_suggestion,
      epistemic_state: semantic.epistemic_state,
      risk_level: semantic.risk_level,
    } : null,
    counterIntegrity: counterCheck,
  };
}

module.exports = {
  classifySeverity,
  classifyFindingType,
  findingImpact,
  findingRecommendation,
  riskBreakdown,
  detectionSummary,
  formatFinding,
  formatTelegramReport,
  buildReportData,
  validateFindingClassification,
  validateCounterIntegrity,
  expectedCategoryForRule,
};

