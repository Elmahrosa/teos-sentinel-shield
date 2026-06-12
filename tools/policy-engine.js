#!/usr/bin/env node
/**
 * TEOS Policy Engine CLI — validates policy definitions and scans for violations
 * Usage: node tools/policy-engine.js validate [<path>]
 *
 * Exit codes:
 *   0 — policy valid, no violations
 *   1 — policy warnings
 *   2 — policy violations found
 */

const fs = require('fs');
const path = require('path');
const { analyzeCode } = require('../services/ast-engine');
const { getPolicy, getSeverity, getReason } = require('../services/policy-engine');

const cmd = process.argv[2];
const target = process.argv[3] || '.';

if (cmd !== 'validate') {
  console.error('Usage: node tools/policy-engine.js validate [<path>]');
  process.exit(1);
}

const policy = getPolicy();

console.log('── Policy Engine Validation ──');

// Validate policy structure
const requiredKeys = ['blockedFunctions', 'blockedNewExpressions', 'dangerousModules', 'dangerousImports', 'blockedAssignments'];
let policyValid = true;
for (const key of requiredKeys) {
  if (!Array.isArray(policy[key])) {
    console.error(`[FAIL] Missing or invalid policy key: ${key}`);
    policyValid = false;
  } else {
    console.log(`[ OK ] ${key}: ${policy[key].length} entries`);
  }
}

if (!policyValid) {
  console.log('\nPolicy validation FAILED');
  process.exit(2);
}

// If target is a file or directory, scan for policy violations
const stat = fs.statSync(target);
const violations = [];
const scannedFiles = [];

function scanFile(fp) {
  try {
    const code = fs.readFileSync(fp, 'utf8');
    const result = analyzeCode(code, policy);
    if (!result) return;
    scannedFiles.push(fp);
    if (result.violations.length > 0) {
      for (const v of result.violations) {
        violations.push({ file: fp, ...v });
      }
    }
  } catch (e) { /* skip */ }
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

if (stat.isFile()) {
  scanFile(target);
} else if (stat.isDirectory()) {
  walkDir(target);
}

if (violations.length > 0) {
  console.log(`\n── Policy Violations (${violations.length}) ──`);
  for (const v of violations) {
    const loc = v.loc ? `:${v.loc.line}` : '';
    const reason = getReason(v.name);
    console.log(`  ${v.severity.toUpperCase()}  ${v.file}${loc}`);
    console.log(`       ${v.type}: ${v.name}`);
    console.log(`       ${reason}`);
  }

  const critical = violations.filter(v => v.severity === 'critical').length;
  const high = violations.filter(v => v.severity === 'high').length;

  if (critical > 0) {
    console.log(`\n${critical} critical, ${high} high violations — BLOCK`);
    process.exit(2);
  }
  if (high > 0) {
    console.log(`\n${high} high violations — WARN`);
    process.exit(1);
  }
} else {
  console.log('\nNo policy violations found — ALLOW');
}

process.exit(0);
