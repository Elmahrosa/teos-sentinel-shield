const { RULES, runEngine } = require('../src/engine/scanner.js');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

const R11 = RULES.find(r => r.id === 'R11');
assert(R11, 'R11 rule must exist');

console.log("\nPath Traversal — Benign (should NOT match):");

test("[NEG] variable assignment with path", () => {
  assert.strictEqual(R11.test('SRC_DIR="$DIR/../../../.."'), false);
});

test("[NEG] local with readlink path", () => {
  assert.strictEqual(R11.test('local CHROME_SRC="$(readlink -f \\"${SCRIPT_DIR}/../../\\")"'), false);
});

test("[NEG] realpath in assignment", () => {
  assert.strictEqual(R11.test('ffmpeg_dir=$(realpath ../../../../../../third_party/ffmpeg)'), false);
});

test("[NEG] cd traversal", () => {
  assert.strictEqual(R11.test('cd ../../..'), false);
});

test("[NEG] echo with path", () => {
  assert.strictEqual(R11.test('echo "Build dir is ../../out"'), false);
});

test("[NEG] makefile var expansion", () => {
  assert.strictEqual(R11.test('OUT_DIR := $(BUILD_DIR)/../../dist'), false);
});

test("[NEG] single ../ requires 2+", () => {
  assert.strictEqual(R11.test('cd ..'), false);
});

test("[NEG] console.log with path", () => {
  assert.strictEqual(R11.test('console.log("path: ../../config")'), false);
});

console.log("\nPath Traversal — Malicious (SHOULD match):");

test("[POS] cat /etc/passwd", () => {
  assert.strictEqual(R11.test('cat ../../../etc/passwd'), true);
});

test("[POS] traversal to shadow", () => {
  assert.strictEqual(R11.test('cat ../../../../etc/shadow'), true);
});

test("[POS] file write traversal", () => {
  assert.strictEqual(R11.test('cp ../../../etc/passwd /tmp/out'), true);
});

test("[POS] encoded traversal", () => {
  assert.strictEqual(R11.test('cat %2e%2e/etc/passwd'), true);
});

test("[POS] deep traversal", () => {
  assert.strictEqual(R11.test('../../../../../../etc/hosts'), true);
});

console.log("\nRunEngine integration — shouldn't block benign build paths:");

test("[NEG] runEngine readlink path returns ALLOW", () => {
  const res = runEngine('local CHROME_SRC="$(readlink -f \\"${SCRIPT_DIR}/../../\\")"');
  assert.strictEqual(res.verdict, 'ALLOW');
});

test("[POS] runEngine cat /etc/passwd returns WARN (score 78 < 80)", () => {
  const res = runEngine('cat ../../../etc/passwd');
  assert.strictEqual(res.verdict, 'WARN');
  assert.strictEqual(res.ruleId, 'R11');
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
