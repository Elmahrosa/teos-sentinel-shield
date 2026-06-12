#!/usr/bin/env node
/**
 * TEOS CodeGuard CLI — AST-based code security scanner
 * Usage: node tools/codeguard-cli.js scan <path|file>
 *
 * Exit codes:
 *   0 — clean
 *   1 — warnings found
 *   2 — blocking violations found
 */

const fs = require('fs');
const path = require('path');
const { analyzeCode } = require('../services/ast-engine');
const { getPolicy } = require('../services/policy-engine');

const cmd = process.argv[2];
const target = process.argv[3] || '.';

if (cmd !== 'scan') {
  console.error('Usage: node tools/codeguard-cli.js scan <path|file>');
  process.exit(1);
}

const policy = getPolicy();
let totalViolations = 0;
let totalFiles = 0;
let maxSeverity = 'none';

function scanFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const result = analyzeCode(code, policy);
    if (!result) return;
    totalFiles++;

    if (result.violations.length > 0) {
      totalViolations += result.violations.length;
      totalFiles++;
      const sevs = result.violations.map(v => v.severity);
      if (sevs.includes('critical')) maxSeverity = 'critical';
      else if (sevs.includes('high') && maxSeverity !== 'critical') maxSeverity = 'high';
      else if (sevs.includes('medium') && maxSeverity === 'none') maxSeverity = 'medium';

      console.log(`\n[!] ${filePath} — ${result.verdict.verdict.toUpperCase()} (${result.verdict.score}/100)`);
      for (const v of result.violations) {
        const loc = v.loc ? `:${v.loc.line}` : '';
        console.log(`    ${v.severity.toUpperCase()}  ${v.type}  ${v.name}${loc}`);
      }
    }
  } catch (e) {
    // skip unreadable or non-JS files
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath);
      }
    } else if (/\.(js|mjs|cjs|jsx|ts|tsx)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  }
}

const stat = fs.statSync(target);
if (stat.isFile()) {
  scanFile(target);
} else if (stat.isDirectory()) {
  walkDir(target);
}

console.log(`\n── CodeGuard Summary ──`);
console.log(`Files scanned:    ${totalFiles}`);
console.log(`Violations found: ${totalViolations}`);
console.log(`Max severity:     ${maxSeverity}`);
console.log(`Verdict:          ${maxSeverity === 'critical' ? 'BLOCK' : maxSeverity === 'high' ? 'WARN' : 'ALLOW'}`);

if (maxSeverity === 'critical') process.exit(2);
if (maxSeverity === 'high') process.exit(1);
process.exit(0);
