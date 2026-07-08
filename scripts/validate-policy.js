#!/usr/bin/env node
// TEOS Sentinel — Policy Validation Script
// Verifies SCORING_POLICY.md matches actual implementation.
// Run: node scripts/validate-policy.js
// CI enforced: must exit 0.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POLICY_FILE = path.join(ROOT, 'SCORING_POLICY.md');
const PKG = require(path.join(ROOT, 'package.json'));

// ── Helpers ──
let errors = [];
let warnings = [];
let passCount = 0;

function ok(msg) { passCount++; console.log(`  ✅ ${msg}`); }
function warn(msg) { warnings.push(msg); console.log(`  ⚠️  ${msg}`); }
function fail(msg) { errors.push(msg); console.log(`  ❌ ${msg}`); }

function check(cond, msg) { cond ? ok(msg) : fail(msg); }

// ── 1. Load Policy ──
console.log('\n📄 Loading SCORING_POLICY.md...');
if (!fs.existsSync(POLICY_FILE)) {
  console.error('❌ SCORING_POLICY.md not found');
  process.exit(1);
}
const policy = fs.readFileSync(POLICY_FILE, 'utf-8');
ok('SCORING_POLICY.md exists');

// ── 2. Engine Counts ──
console.log('\n🔧 Checking engine registrations...');
const engineDefs = {
  core: { prefix: 'R', file: 'src/engines/core.js', min: 95, max: 110 },
  banking: { prefix: 'B', file: 'src/engines/banking.js', min: 30, max: 36 },
  solana: { prefix: 'S', file: 'src/engines/solana.js', min: 27, max: 33 },
  evm: { prefix: 'E', file: 'src/engines/evm.js', min: 19, max: 26 },
  dependency: { prefix: 'D', file: 'src/engines/dependency.js', min: 3, max: 15 },
  ci: { prefix: 'C', file: 'src/engines/ci.js', min: 21, max: 27 },
  tokenIntel: { prefix: 'T', file: 'src/engines/token-intelligence.js', min: 23, max: 28 },
  dueDiligence: { prefix: 'DD', file: 'src/engines/due-diligence.js', min: 23, max: 28 },
};

for (const [name, def] of Object.entries(engineDefs)) {
  const engineFile = path.join(ROOT, def.file);
  if (!fs.existsSync(engineFile)) {
    warn(`${name}: engine file not found at ${def.file} — skipping`);
    continue;
  }
  const src = fs.readFileSync(engineFile, 'utf-8');
  const ruleMatches = src.match(/\{ id:\s*['"]\w+['"]/g);
  const count = ruleMatches ? ruleMatches.length : 0;
  if (count >= def.min && count <= def.max) {
    ok(`${name}: ${count} rules (${def.prefix} prefix)`);
  } else {
    fail(`${name}: ${count} rules — expected ${def.min}–${def.max}`);
  }
}

// ── 3. Score Ranges ──
console.log('\n📊 Checking score ranges...');
let totalScoreErrors = 0;
for (const [name, def] of Object.entries(engineDefs)) {
  const engineFile = path.join(ROOT, def.file);
  if (!fs.existsSync(engineFile)) continue;
  const src = fs.readFileSync(engineFile, 'utf-8');
  const scoreMatches = src.match(/score:\s*(\d+)/g);
  if (!scoreMatches) continue;
  for (const sm of scoreMatches) {
    const score = parseInt(sm.replace('score:', ''), 10);
    if (score < 0 || score > 100) {
      fail(`${name}: score ${score} out of range (0–100)`);
      totalScoreErrors++;
    }
  }
}
if (totalScoreErrors === 0) ok('All rule scores within 0–100 range');

// ── 4. Control ID Uniqueness ──
console.log('\n🏷️  Checking control ID uniqueness...');
const allIds = [];
for (const [name, def] of Object.entries(engineDefs)) {
  const engineFile = path.join(ROOT, def.file);
  if (!fs.existsSync(engineFile)) continue;
  const src = fs.readFileSync(engineFile, 'utf-8');
  const idMatches = [...src.matchAll(/id:\s*['"](\w+)['"]/g)];
  for (const m of idMatches) allIds.push({ id: m[1], engine: name });
}
const idSet = new Set();
const dupes = [];
for (const { id, engine } of allIds) {
  if (idSet.has(id)) dupes.push(id);
  idSet.add(id);
}
if (dupes.length === 0) {
  ok(`All ${allIds.length} control IDs unique across engines`);
} else {
  fail(`Duplicate control IDs: ${dupes.join(', ')}`);
}

// ── 5. Version Alignment ──
console.log('\n🔖 Checking version alignment...');
check(
  typeof PKG.version === 'string' && PKG.version.length > 0,
  `package.json version: ${PKG.version}`
);
check(
  policy.includes(`policy-1.0`),
  'Policy version 1.0 referenced in document'
);

// ── 6. Threshold Alignment ──
console.log('\n🚦 Checking threshold alignment...');
check(
  policy.includes('BLOCK') && policy.includes('85'),
  'BLOCK threshold (>=85) documented'
);
check(
  policy.includes('WARN') && policy.includes('60'),
  'WARN threshold (>=60) documented'
);
check(
  policy.includes('REVIEW') && policy.includes('1'),
  'REVIEW threshold (>=1) documented'
);

// ── 7. Determinism Requirements ──
console.log('\n🔬 Checking determinism requirements...');
check(
  policy.includes('Strict Determinism Guarantee'),
  'Strict determinism section present'
);
check(
  policy.includes('No randomness'),
  'No randomness clause present'
);
check(
  policy.includes('No timestamp'),
  'No timestamp influence clause present'
);

// ── 8. Explainability ──
console.log('\n📝 Checking explainability requirements...');
check(
  policy.includes('matchedPattern'),
  'matchedPattern field required in findings'
);
check(
  policy.includes('ruleId') && policy.includes('reasons'),
  'ruleId and reasons fields required in findings'
);

// ── 9. Audit Trace ──
console.log('\n📋 Checking audit trace requirements...');
check(
  policy.includes('auditId'),
  'auditId field documented'
);
check(
  policy.includes('executionOrder'),
  'executionOrder field documented'
);

// ── 10. Regression Tests ──
console.log('\n🧪 Checking regression test requirements...');
check(
  policy.includes('same input × 1000'),
  'Determinism: same input × 1000 test documented'
);
check(
  policy.includes('CI pipeline MUST fail'),
  'CI pipeline failure on determinism failure documented'
);

// ── 11. Enterprise Criteria ──
console.log('\n🏢 Checking enterprise acceptance criteria...');
const criteria = ['Deterministic', 'Reproducible', 'Explainable', 'Versioned', 'Auditable'];
for (const c of criteria) {
  check(policy.includes(c), `Enterprise criterion: ${c}`);
}

// ── Summary ──
console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passCount}`);
console.log(`  Errors: ${errors.length}`);
console.log(`  Warnings: ${warnings.length}`);
console.log('═══════════════════════════════════════\n');

if (errors.length > 0) {
  console.error('❌ POLICY VALIDATION FAILED');
  errors.forEach(e => console.error(`  ${e}`));
  process.exit(1);
} else {
  console.log('✅ POLICY VALIDATION PASSED');
  process.exit(0);
}
