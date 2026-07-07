const assert = require('assert');
const { executeEngine, getEngineInfo, generateAuditId } = require('../src/engines/index');
const { runCoreEngine } = require('../src/engines/core');
const { runBankingEngine } = require('../src/engines/banking');
const { runSolanaEngine } = require('../src/engines/solana');
const { runEvmEngine } = require('../src/engines/evm');
const { runDependencyEngine } = require('../src/engines/dependency');
const { runCiEngine } = require('../src/engines/ci');
const { runTokenIntelligenceEngine } = require('../src/engines/token-intelligence');
const { runDueDiligenceEngine } = require('../src/engines/due-diligence');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== Integration Tests ===\n');

test('executeEngine routes to correct engine', () => {
  const r = executeEngine('core', 'rm -rf /');
  assert.strictEqual(r.engine, 'Core Security Engine');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('executeEngine returns audit ID', () => {
  const r = executeEngine('core', 'echo hello');
  assert.ok(r.auditId);
  assert.ok(r.auditId.startsWith('TOS-'));
});

test('executeEngine banking returns correct engine name', () => {
  const r = executeEngine('banking', 'AML bypass');
  assert.strictEqual(r.engine, 'Banking Compliance Engine');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('executeEngine solana returns correct engine name', () => {
  const r = executeEngine('solana', 'use anchor_lang;');
  assert.strictEqual(r.engine, 'Solana Security Engine');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('executeEngine evm returns correct engine name', () => {
  const r = executeEngine('evm', 'selfdestruct(payable(msg.sender))');
  assert.strictEqual(r.engine, 'EVM Security Engine');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('executeEngine dependency returns correct engine name', () => {
  const r = executeEngine('dependency', '{}');
  assert.strictEqual(r.engine, 'Dependency Engine');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('executeEngine ci returns correct engine name', () => {
  const r = executeEngine('ci', 'name: test');
  assert.strictEqual(r.engine, 'CI/CD Pipeline Engine');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('executeEngine tokenIntel returns correct engine name', () => {
  const r = executeEngine('tokenIntel', 'mintAuthority = null');
  assert.strictEqual(r.engine, 'Token Intelligence Engine');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('executeEngine dueDiligence returns correct engine name', () => {
  const r = executeEngine('dueDiligence', 'anonymous team');
  assert.strictEqual(r.engine, 'Due Diligence Engine');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('executeEngine unknown engine returns error', () => {
  const r = executeEngine('nonexistent', 'test');
  assert.strictEqual(r.verdict, 'ERROR');
  assert.ok(r.error);
});

test('getEngineInfo returns all engines', () => {
  const info = getEngineInfo();
  assert.ok(info.core);
  assert.ok(info.banking);
  assert.ok(info.solana);
  assert.ok(info.evm);
  assert.ok(info.dependency);
  assert.ok(info.ci);
  assert.ok(info.tokenIntel);
  assert.ok(info.dueDiligence);
});

test('generateAuditId produces unique IDs', () => {
  const id1 = generateAuditId();
  const id2 = generateAuditId();
  assert.notStrictEqual(id1, id2);
  assert.ok(id1.startsWith('TOS-'));
});

// Cross-engine consistency
test('Each engine produces timestamp', () => {
  const engines = [runCoreEngine, runBankingEngine, runSolanaEngine, runEvmEngine, runDependencyEngine, runCiEngine, runTokenIntelligenceEngine, runDueDiligenceEngine];
  for (const engine of engines) {
    const r = engine('test');
    if (r.verdict !== 'ERROR') {
      assert.ok(r.timestamp, `Engine missing timestamp`);
    }
  }
});

test('Each engine returns findings array', () => {
  const engines = [runCoreEngine, runBankingEngine, runSolanaEngine, runEvmEngine, runDependencyEngine, runCiEngine, runTokenIntelligenceEngine, runDueDiligenceEngine];
  for (const engine of engines) {
    const r = engine('test');
    assert.ok(Array.isArray(r.findings), `Engine missing findings array`);
  }
});

// Edge Cases
test('All engines handle very long input', () => {
  const longStr = 'A'.repeat(10000);
  const results = [runCoreEngine(longStr), runBankingEngine(longStr), runSolanaEngine(longStr), runEvmEngine(longStr), runDependencyEngine(longStr), runCiEngine(longStr), runTokenIntelligenceEngine(longStr), runDueDiligenceEngine(longStr)];
  for (const r of results) {
    assert.ok(r.verdict === 'ALLOW' || r.verdict === 'ERROR' || r.verdict === 'WARN', `Unexpected verdict: ${r.verdict}`);
  }
});

test('All engines handle special characters', () => {
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\n\\t';
  const results = [runCoreEngine(special), runBankingEngine(special), runSolanaEngine(special), runEvmEngine(special), runDependencyEngine(special), runCiEngine(special), runTokenIntelligenceEngine(special), runDueDiligenceEngine(special)];
  for (const r of results) {
    assert.ok(r.verdict, 'Should not throw');
  }
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
