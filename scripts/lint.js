#!/usr/bin/env node
// TEOS Sentinel — Basic linter
// Checks for common issues: missing fields, version consistency, etc.
// Run: node scripts/lint.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = [];
let warnings = [];

function error(msg) { errors.push(msg); console.error(`  ❌ ${msg}`); }
function warn(msg) { warnings.push(msg); console.warn(`  ⚠️  ${msg}`); }
function ok(msg) { console.log(`  ✅ ${msg}`); }

console.log('\n🔍 TEOS Sentinel — Lint\n');

// 1. Check package.json version consistency
console.log('📋 Version checks...');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
ok(`package.json version: ${pkg.version}`);

// 2. Check version files align
const versionFiles = ['.version.json', 'lib/version.js'];
for (const vf of versionFiles) {
  const vfp = path.join(ROOT, vf);
  if (!fs.existsSync(vfp)) {
    warn(`${vf} not found`);
    continue;
  }
  const content = fs.readFileSync(vfp, 'utf-8');
  if (!content.includes(pkg.version)) {
    warn(`${vf} does not reference version ${pkg.version}`);
  } else {
    ok(`${vf} references ${pkg.version}`);
  }
}

// 3. Check SCORING_POLICY.md references
console.log('\n📋 Policy doc checks...');
const policyPath = path.join(ROOT, 'SCORING_POLICY.md');
if (!fs.existsSync(policyPath)) {
  error('SCORING_POLICY.md not found');
} else {
  const policy = fs.readFileSync(policyPath, 'utf-8');
  if (!policy.includes('policy-1.0')) warn('SCORING_POLICY.md missing policy version reference');
  if (!policy.includes('Strict Determinism')) warn('SCORING_POLICY.md missing determinism section');
  if (!policy.includes('matchedPattern')) warn('SCORING_POLICY.md missing matchedPattern requirement');
  ok('SCORING_POLICY.md present');
}

// 4. Check all engine files have finding-utils import
console.log('\n📋 Engine file checks...');
const engineDir = path.join(ROOT, 'src/engines');
const engineFiles = fs.readdirSync(engineDir).filter(f => f.endsWith('.js') && f !== 'finding-utils.js' && f !== 'index.js');
for (const ef of engineFiles) {
  const content = fs.readFileSync(path.join(engineDir, ef), 'utf-8');
  if (!content.includes('./finding-utils')) {
    warn(`${ef} missing finding-utils import`);
  } else {
    ok(`${ef} uses finding-utils`);
  }
}

// 5. Check that engine index exports version metadata
console.log('\n📋 Orchestrator checks...');
const engIdx = fs.readFileSync(path.join(ROOT, 'src/engines/index.js'), 'utf-8');
if (engIdx.includes('ENGINE_VERSION')) ok('ENGINE_VERSION constant defined');
else error('ENGINE_VERSION missing from orchestrator');
if (engIdx.includes('engineVersion')) ok('engineVersion in response');
else error('engineVersion missing from orchestrator response');
if (engIdx.includes('highestRule')) ok('highestRule in response');
else error('highestRule missing from orchestrator response');

// 6. Check determinism tests exist
console.log('\n📋 Test checks...');
const detPath = path.join(ROOT, 'test/determinism-test.js');
if (fs.existsSync(detPath)) {
  const detContent = fs.readFileSync(detPath, 'utf-8');
  if (detContent.includes('1000')) ok('Determinism test: 1000 iterations');
  else warn('Determinism test exists but may not run 1000 iterations');
} else {
  warn('test/determinism-test.js not found');
}

// 7. Check validate-policy script
const valPath = path.join(ROOT, 'scripts/validate-policy.js');
if (fs.existsSync(valPath)) ok('scripts/validate-policy.js exists');
else warn('scripts/validate-policy.js not found');

// Summary
console.log(`\n═══════════════════════════════════════`);
console.log(`  Errors: ${errors.length}`);
console.log(`  Warnings: ${warnings.length}`);
console.log(`═══════════════════════════════════════\n`);

if (errors.length > 0) {
  process.exit(1);
}
process.exit(0);
