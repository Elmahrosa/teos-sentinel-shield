const assert = require('assert');
const { runCoreEngine } = require('../src/engines/core');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== Secret Regex Hyphen Bug — R19 v4.0.1 Hotfix ===\n');
console.log('Bug: regex [a-zA-Z0-9]{20,} rejects hyphens inside token body.\n');
console.log('Affected: standalone tokens where body chunks are <20 consecutive alphanumeric chars.\n');

test('R19: OpenAI sk-proj format with UUID-style chunks (sk-proj-XXXX-YYYY-ZZZZ)', () => {
  const r = runCoreEngine('sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz-0123456789-abcdefgh');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('R19: OpenAI key with short hyphenated segments', () => {
  const r = runCoreEngine('sk-abc123-def456-ghi789-jkl012');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('R19: API key with hyphens in quoted value', () => {
  const r = runCoreEngine('api_key = "sk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('R19: GitHub classic token with hyphens in body', () => {
  const r = runCoreEngine('ghp_abcDefGhIjKlMnOpQrStUvWx-123456789012345');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('R19: GitHub fine-grained token with hyphens', () => {
  const r = runCoreEngine('gho_xxYyZz-123456-abcdef-789012-345678');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('R19: Slack bot token with extra hyphens', () => {
  const r = runCoreEngine('xoxb-FakeTok3n-abcdefghijklmno');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('R19: Existing test must still pass — simple sk-proj', () => {
  const r = runCoreEngine('sk-proj-abcdefghijklmnopqrstuvwxyz12345678901234');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('R19: Existing test must still pass — api_key = quoted', () => {
  const r = runCoreEngine('api_key = "sk-1234567890abcdef123456"');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('R19: Existing test must still pass — ghp_ underscore only', () => {
  const r = runCoreEngine('const token = "ghp_1234567890abcdef1234567890abcdef123456"');
  assert.strictEqual(r.verdict, 'BLOCK');
});

console.log(`\n---\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
