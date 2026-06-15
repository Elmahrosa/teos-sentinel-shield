#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SECRET_PATTERNS = [
  { id: 'S01', name: 'AWS_ACCESS_KEY', severity: 'critical', pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/g },
  { id: 'S02', name: 'AWS_SECRET_KEY', severity: 'critical', pattern: /(?i)aws.{0,20}(?:secret|access).{0,20}['\"][A-Za-z0-9\/+=]{40}['\"]/g },
  { id: 'S03', name: 'GITHUB_TOKEN', severity: 'critical', pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/g },
  { id: 'S04', name: 'GITLAB_TOKEN', severity: 'critical', pattern: /glpat-[A-Za-z0-9\-_]{20,}/g },
  { id: 'S05', name: 'SLACK_TOKEN', severity: 'high', pattern: /xox[baprs]-[A-Za-z0-9\-]{10,}/g },
  { id: 'S06', name: 'JWT_TOKEN', severity: 'high', pattern: /eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g },
  { id: 'S07', name: 'PRIVATE_KEY', severity: 'critical', pattern: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)\s+PRIVATE\s+KEY-----/g },
  { id: 'S08', name: 'CONNECTION_STRING', severity: 'high', pattern: /(?:mongodb|postgresql|mysql|redis)://[^\s'"]{8,}@/gi },
  { id: 'S09', name: 'PASSWORD_IN_CODE', severity: 'high', pattern: /(?:password|passwd|pwd)\s*[:=]\s*['\"][^'\"]{6,}['\"]/gi },
  { id: 'S10', name: 'API_KEY_IN_CODE', severity: 'high', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['\"][A-Za-z0-9_\-]{16,}['\"]/gi },
  { id: 'S11', name: 'SECRET_IN_ENV', severity: 'medium', pattern: /(?:SECRET|TOKEN|PASSWORD|CREDENTIALS)\s*=\s*['\"][^'\"]+['\"]/g },
  { id: 'S12', name: 'NPM_TOKEN', severity: 'critical', pattern: /\/\/registry\.npmjs\.org\/:_authToken=[A-Za-z0-9\-]{36,}/g },
  { id: 'S13', name: 'HEROKU_API_KEY', severity: 'high', pattern: /heroku.{0,10}[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}/gi },
  { id: 'S14', name: 'GOOGLE_SERVICE_JSON', severity: 'high', pattern: /"type":\s*"service_account"/g },
  { id: 'S15', name: 'DOCKER_CONFIG_AUTH', severity: 'high', pattern: /"auth":\s*"[A-Za-z0-9+\/=]{20,}"/g },
  { id: 'S16', name: 'STRIPE_API_KEY', severity: 'critical', pattern: /(?:sk_live|pk_live|sk_test|pk_test)_[A-Za-z0-9]{24,}/g },
  { id: 'S17', name: 'TELEGRAM_BOT_TOKEN', severity: 'critical', pattern: /[1-9]\d{8,10}:AA[A-Za-z0-9_\-]{33,35}/g },
  { id: 'S18', name: 'SLACK_WEBHOOK', severity: 'high', pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9\/]{40,}/g },
  { id: 'S19', name: 'GENERIC_BEARER', severity: 'medium', pattern: /(?i)(?:bearer|token)\s+[A-Za-z0-9_\-\.]{20,}/g },
];

function collectFiles(target) {
  const files = [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (!entry.name.startsWith('.') && entry.name !== 'node_modules') walk(p); }
      else if (!entry.name.startsWith('.')) files.push(p);
    }
  }
  walk(target);
  return files;
}

function scanFile(filePath) {
  const findings = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  for (const rule of SECRET_PATTERNS) {
    const matches = content.match(rule.pattern);
    if (matches) {
      const matchCount = matches.length;
      const firstLine = lines.findIndex(l => rule.pattern.test(l)) + 1;
      findings.push({
        rule: rule.id,
        name: rule.name,
        severity: rule.severity,
        count: matchCount,
        line: firstLine,
        snippet: String(matches[0]).slice(0, 60),
      });
    }
  }
  return findings;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--json') ? 'json' : 'text';
  const target = args.find(a => !a.startsWith('--')) || '.';
  const failOn = args.includes('--fail-on-warn') ? 'WARN' : 'BLOCK';

  if (!fs.existsSync(target)) {
    console.error(`Error: path "${target}" does not exist`);
    process.exit(1);
  }

  const files = collectFiles(target);
  let allFindings = [];
  let maxSeverity = 'none';

  for (const file of files) {
    try {
      const f = scanFile(file);
      if (f.length > 0) {
        allFindings.push({ file, secrets: f });
        for (const s of f) {
          const ord = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
          if (ord[s.severity] > ord[maxSeverity]) maxSeverity = s.severity;
        }
      }
    } catch (e) {
      if (mode === 'json') allFindings.push({ file, error: e.message });
    }
  }

  if (mode === 'json') {
    console.log(JSON.stringify({
      verdict: maxSeverity === 'critical' ? 'BLOCK' : maxSeverity === 'high' ? 'WARN' : 'ALLOW',
      maxSeverity,
      filesScanned: files.length,
      secretsFound: allFindings.length,
      findings: allFindings,
    }, null, 2));
  } else {
    console.log(`\nTEOS Secret Scan`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Files scanned: ${files.length}`);
    console.log(`Secrets found: ${allFindings.length}`);
    for (const entry of allFindings) {
      console.log(`\n  ${entry.file}`);
      for (const s of entry.secrets) {
        const badge = s.severity === 'critical' ? '\u{1F6D1}' : s.severity === 'high' ? '\u26A0\uFE0F' : '\u26A0';
        console.log(`    ${badge} ${s.rule}.${s.name} (${s.severity}) — line ${s.line}`);
        console.log(`           ${s.snippet}${s.count > 1 ? ` (+${s.count - 1} more)` : ''}`);
      }
    }
    console.log(`${'='.repeat(50)}`);
    console.log(`Max severity: ${maxSeverity}`);
    console.log(`Verdict: ${maxSeverity === 'critical' ? 'BLOCK' : maxSeverity === 'high' ? 'WARN' : 'ALLOW'}\n`);
  }

  if (maxSeverity === 'critical') process.exit(2);
  if (maxSeverity === 'high' && failOn === 'WARN') process.exit(1);
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
