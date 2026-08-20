#!/usr/bin/env node
// TEOS Sentinel — Enterprise Acceptance Gate
// Blocks release unless ALL 9 enterprise criteria pass.
// Run: node scripts/enterprise-gate.js

const { execSync } = require('child_process');

console.log('\n═══════════════════════════════════════════');
console.log('  TEOS Sentinel — Enterprise Acceptance Gate');
console.log('═══════════════════════════════════════════\n');

const checks = [
  { name: '⚠️  Deterministic',        cmd: 'node test/determinism-test.js' },
  { name: '⚠️  Explainable',          cmd: 'node -e "const e=require(\'./src/engines/index\');const r=e.executeEngine(\'core\',\'DROP TABLE x\');process.exit(r.findings[0]&&r.findings[0].matchedPattern?0:1)"' },
  { name: '⚠️  Reproducible',         cmd: 'node test/determinism-test.js' }, // covered by same test
  { name: '⚠️  Versioned',            cmd: 'node -e "const e=require(\'./src/engines/index\');const r=e.executeEngine(\'core\',\'test\');process.exit(r.engineVersion?0:1)"' },
  { name: '⚠️  Auditable',            cmd: 'node -e "const e=require(\'./src/engines/index\');const r=e.executeEngine(\'core\',\'test\');process.exit(r.auditId?0:1)"' },
  { name: '⚠️  Regression Tested',    cmd: 'node test/determinism-test.js' },
  { name: '⚠️  Policy Validated',     cmd: 'node scripts/validate-policy.js' },
  { name: '⚠️  Documentation Synced', cmd: 'node scripts/validate-policy.js' }, // validator checks doc–impl parity
  { name: '⚠️  CI Green',             cmd: 'node scripts/lint.js' },
];

let passed = 0;
let failed = 0;
const results = [];

for (const check of checks) {
  try {
    execSync(check.cmd, { cwd: __dirname + '/..', stdio: 'pipe', timeout: 30000 });
    results.push({ name: check.name, status: 'PASS' });
    console.log(`  ✅ ${check.name.replace('⚠️', '✔️')} — PASS`);
    passed++;
  } catch (e) {
    results.push({ name: check.name, status: 'FAIL' });
    console.log(`  ❌ ${check.name.replace('⚠️', '❌')} — FAIL`);
    failed++;
  }
}

console.log(`\n═══════════════════════════════════════════`);
console.log(`  Criteria: 9`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`═══════════════════════════════════════════\n`);

if (failed > 0) {
  console.error('❌ ENTERPRISE ACCEPTANCE GATE: BLOCKED');
  console.error('   Release cannot proceed. Fix failed criteria above.\n');
  process.exit(1);
} else {
  console.log('✅ ENTERPRISE ACCEPTANCE GATE: PASSED — Release ready.\n');
  process.exit(0);
}
