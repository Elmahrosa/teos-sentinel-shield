const { logger } = require('../../logger.cjs');
const MAX_CODE_SIZE = 512 * 1024;

const SECRET_PATTERNS = [
  { rule: 'openai-api-key', severity: 'critical', pattern: /(?:sk-proj-|sk-)(?!example[-_]|test[-_]|dummy[-_]|placeholder[-_]|xxx)[a-zA-Z0-9-]{20,}(?:T3BlbkFJ|T3Blb?kFJ)?[a-zA-Z0-9-]{0,20}/g },
  { rule: 'anthropic-api-key', severity: 'critical', pattern: /sk-ant-[a-zA-Z0-9-]{20,}/g },
  { rule: 'github-pat', severity: 'critical', pattern: /(?:ghp_|gho_|ghu_|ghs_|ghr_)[a-zA-Z0-9]{36,}/g },
  { rule: 'aws-access-key', severity: 'critical', pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/g },
  { rule: 'aws-secret-key', severity: 'critical', pattern: /aws[\s:=_'"]*(?:secret[\s:=_'"]+)?access[\s:=_'"]*key[\s:=_'"]+[a-zA-Z0-9\/+]{35,50}/gi },
  { rule: 'azure-connection-string', severity: 'high', pattern: /(?:AccountName|AccountKey|DefaultEndpointsProtocol)=[^;\s&]{10,}/gi },
  { rule: 'azure-tenant', severity: 'high', pattern: /azure[\s:=_'"]*tenant[\s:=_'"]*id[\s:=_'"]+[a-f0-9\-]{36}/gi },
  { rule: 'gcp-api-key', severity: 'high', pattern: /AIza[0-9A-Za-z\-_]{35}/g },
  { rule: 'heroku-api-key', severity: 'high', pattern: /heroku[\s:=_'"]*api[\s:=_'"]*key[\s:=_'"]+[a-f0-9\-]{36}/gi },
  { rule: 'stripe-api-key', severity: 'critical', pattern: /(?:rk|sk)_(?:test|live)_[a-zA-Z0-9]{20,}/g },
  { rule: 'twilio-credentials', severity: 'high', pattern: /(?:account_sid|auth_token)[\s:=_'"]+[a-zA-Z0-9]{32,}/gi },
  { rule: 'discord-token', severity: 'high', pattern: /[a-zA-Z0-9_-]{24}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{26,28}/g },
  { rule: 'npm-token', severity: 'high', pattern: /npm_[a-zA-Z0-9]{36,}/g },
  { rule: 'telegram-bot-token', severity: 'critical', pattern: /[0-9]{8,10}:[a-zA-Z0-9_-]{35,}/g },
  { rule: 'private-rsa-key', severity: 'critical', pattern: /-----BEGIN\s*(?:RSA\s*)?PRIVATE\s*KEY-----/g },
  { rule: 'pem-certificate', severity: 'high', pattern: /-----BEGIN\s*(?:[A-Z\s]+\s*)?CERTIFICATE-----/g },
  { rule: 'database-url', severity: 'high', pattern: /(?:postgres|mysql|mariadb|mongodb(?:\+srv)?):\/\/[^\s:]+:[^\s@]+@[^\s"']+/gi },
  { rule: 'jwt-secret', severity: 'high', pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g },
  { rule: 'slack-token', severity: 'high', pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9_-]{22,26}/g },
];

const MIN_LINE_LENGTH = 3;
const MAX_LINES_TO_CHECK_PER_FILE = 500;

const GITHUB_ACTIONS_SECRET_REF = /\$\{\{\s*secrets\./i;

function isGitHubActionsSecretRef(line) {
  return GITHUB_ACTIONS_SECRET_REF.test(line);
}

function toRe2Safe(pattern) {
  const src = pattern.source;
  try {
    return { re: new RegExp(src, pattern.flags), ok: true };
  } catch {
    return { re: null, ok: false };
  }
}

function scanForSecrets(code, filename) {
  if (!code || typeof code !== 'string') return [];

  const truncated = code.length > MAX_CODE_SIZE ? code.slice(0, MAX_CODE_SIZE) : code;
  const findings = [];
  const lines = truncated.split('\n').slice(0, MAX_LINES_TO_CHECK_PER_FILE);

  const MAX_MATCHES_PER_FILE = 50;
  for (const secret of SECRET_PATTERNS) {
    const { re, ok } = toRe2Safe(secret.pattern);
    if (!ok || !re) {
      logger.warn({ rule: secret.rule }, "Pattern not supported, skipping");
      continue;
    }
    re.lastIndex = 0;
    let match;
    let matchCount = 0;
    while ((match = re.exec(truncated)) !== null && matchCount < MAX_MATCHES_PER_FILE) {
      const snippet = match[0];
      const lineNum = findLineNumber(lines, snippet) + 1;
      const lineContent = lines[lineNum - 1] || '';
      if (isGitHubActionsSecretRef(lineContent)) {
        if (re.lastIndex === match.index) re.lastIndex = match.index + match[0].length || 1;
        continue;
      }
      findings.push({
        rule: secret.rule,
        severity: secret.severity,
        line: lineNum,
        message: `Hardcoded credential detected: ${secret.rule}`,
        snippet: snippet.length > 80 ? snippet.slice(0, 77) + '...' : snippet,
        matched_pattern: snippet.length > 120 ? snippet.slice(0, 117) + '...' : snippet,
        evidence_snippet: lineContent.length > 200 ? lineContent.slice(0, 197) + '...' : lineContent,
      });
      matchCount++;
      if (re.lastIndex === match.index) re.lastIndex = match.index + match[0].length || 1;
    }
  }
  return findings;
}

function findLineNumber(lines, snippet) {
  const normalizedSnippet = snippet.slice(0, 60);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(normalizedSnippet.slice(0, 20))) return i;
  }
  return 0;
}

module.exports = { scanForSecrets, SECRET_PATTERNS, isGitHubActionsSecretRef };
