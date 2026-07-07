const assert = require('assert');
const { runDueDiligenceEngine, DUE_DILIGENCE_RULES } = require('../src/engines/due-diligence');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== Due Diligence Engine ===\n');

test('DUE_DILIGENCE_RULES has at least 25 entries', () => {
  assert.ok(DUE_DILIGENCE_RULES.length >= 25);
});

test('BLOCK anonymous team', () => {
  const r = runDueDiligenceEngine('Team: anonymous');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK unlocked liquidity', () => {
  const r = runDueDiligenceEngine('Liquidity: unlocked');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK unrestricted upgrade', () => {
  const r = runDueDiligenceEngine('upgradeable contract with single-key upgrade');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK unlimited mint authority', () => {
  const r = runDueDiligenceEngine('mint authority held by single account without cap');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK honeypot sell block', () => {
  const r = runDueDiligenceEngine('if (from != owner) revert("Cannot sell")');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK mass blacklist', () => {
  const r = runDueDiligenceEngine('function freezeAllHolders() public onlyOwner');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK impersonation', () => {
  const r = runDueDiligenceEngine('Fake Uniswap token — impersonating Uniswap brand');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK fabricated audit', () => {
  const r = runDueDiligenceEngine('Custom fabricated audit report for token');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK past rug check', () => {
  const r = runDueDiligenceEngine('Team associated with previous rug_pull project');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK cloned project', () => {
  const r = runDueDiligenceEngine('Fork of another project without improvement');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('ALLOW for well-structured project', () => {
  const r = runDueDiligenceEngine('KYC-verified team, liquidity locked 12 months, audited by Certik, vesting schedule, max wallet 2%');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ERROR for empty input', () => {
  const r = runDueDiligenceEngine('');
  assert.strictEqual(r.verdict, 'ERROR');
});

test('BLOCK unfair allocation', () => {
  const r = runDueDiligenceEngine('Team allocation: 40%, no vesting');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK no audit', () => {
  const r = runDueDiligenceEngine('No security audit has been performed');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK no KYC team', () => {
  const r = runDueDiligenceEngine('No KYC verification for team members');
  assert.strictEqual(r.verdict, 'BLOCK');
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
