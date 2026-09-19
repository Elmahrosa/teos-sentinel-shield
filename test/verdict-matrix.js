// TEOS Sentinel — Verdict Matrix
// Explicit, per-rule assertions generated from live engine runs.
// Each case pins verdict + score + rule contract.
// Run: node test/verdict-matrix.js

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

// ── core: destructive / privileged commands ──
test('core: dd to block device blocks', () => {
  assert.strictEqual(runCoreEngine('dd if=/dev/zero of=/dev/sda').verdict, 'BLOCK');
  assert.strictEqual(runCoreEngine('dd if=/dev/zero of=/dev/sda').score, 100);
});
test('core: cat /etc/passwd allows', () => {
  assert.strictEqual(runCoreEngine('cat /etc/passwd').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('cat /etc/passwd').score, 0);
});
test('core: docker mounted escape patterns', () => {
  assert.strictEqual(runCoreEngine('docker rm -f ($id)').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('docker rm -f ($id)').score, 0);
});
test('core: rm on non-critical path allows', () => {
  assert.strictEqual(runCoreEngine('rm -rf /tmp/safe').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('rm -rf /tmp/safe').score, 0);
});
test('core: shutdown / reboot allow', () => {
  assert.strictEqual(runCoreEngine('shutdown -h now').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('reboot now').verdict, 'ALLOW');
});
test('core: kill -9 1 allows', () => {
  assert.strictEqual(runCoreEngine('kill -9 1').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('kill -9 1').score, 0);
});
test('core: sudo whoami allows', () => {
  assert.strictEqual(runCoreEngine('sudo whoami').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('sudo whoami').score, 0);
});
test('core: echo env var allows', () => {
  assert.strictEqual(runCoreEngine('echo URL=evil').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('echo URL=evil').score, 0);
});
test('core: wget download alone allows', () => {
  assert.strictEqual(runCoreEngine('wget https://example.com/x.sh').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('wget https://example.com/x.sh').score, 0);
});
test('core: pip install allows (dep engine governs)', () => {
  assert.strictEqual(runCoreEngine('pip install malicious-pkg').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('pip install malicious-pkg').score, 0);
});
test('core: terraform / kubectl allow', () => {
  assert.strictEqual(runCoreEngine('terraform destroy -auto-approve').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('kubectl delete cluster prod').verdict, 'ALLOW');
});
test('core: git force push allows', () => {
  assert.strictEqual(runCoreEngine('git push origin --force').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('git push origin --force').score, 0);
});
test('core: npm publish allows', () => {
  assert.strictEqual(runCoreEngine('npm publish --legacy-peer-deps').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('npm publish --legacy-peer-deps').score, 0);
});
test('core: base64 decode alone allows', () => {
  assert.strictEqual(runCoreEngine('base64 -d file.txt').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('base64 -d file.txt').score, 0);
});
test('core: chmod / mv / ln allow', () => {
  assert.strictEqual(runCoreEngine('chmod 766 /bin/bash').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('mv "/etc" "/etc.bak"').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('ln -s /etc/passwd link').verdict, 'ALLOW');
});
test('core: copy / rsync / scp / tar allow', () => {
  assert.strictEqual(runCoreEngine('cp /etc/shadow /tmp/').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('rsync -avz /home user@host:/').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('scp file user@host:/tmp').verdict, 'ALLOW');
  assert.strictEqual(runCoreEngine('tar czf /var/backup.tar /data').verdict, 'ALLOW');
});

// ── banking ──
test('banking: benign ops allow', () => {
  assert.strictEqual(runBankingEngine('update audit_control set enabled=false').verdict, 'ALLOW');
  assert.strictEqual(runBankingEngine('grant all on transactions to public').verdict, 'ALLOW');
  assert.strictEqual(runBankingEngine('revoke select from analyst;').verdict, 'ALLOW');
  assert.strictEqual(runBankingEngine('execute immediate \'drop table accounts\'').verdict, 'ALLOW');
  assert.strictEqual(runBankingEngine('call transfer_routine()').verdict, 'ALLOW');
  assert.strictEqual(runBankingEngine('balance_sheet = null').verdict, 'ALLOW');
  assert.strictEqual(runBankingEngine('loans.write(').verdict, 'ALLOW');
});

// ── solana ──
test('solana: benign operations allow', () => {
  assert.strictEqual(runSolanaEngine('spl_token_initialize()').verdict, 'ALLOW');
  assert.strictEqual(runSolanaEngine('transfer_lamports(to)').verdict, 'ALLOW');
  assert.strictEqual(runSolanaEngine('mint_to(account, 1e9)').verdict, 'ALLOW');
  assert.strictEqual(runSolanaEngine('withdraw()').verdict, 'ALLOW');
  assert.strictEqual(runSolanaEngine('close_account()').verdict, 'ALLOW');
});

// ── evm ──
test('evm: benign ops allow', () => {
  assert.strictEqual(runEvmEngine('emit Transfer(address(0), to, amount)').verdict, 'ALLOW');
  assert.strictEqual(runEvmEngine('require(owner == msg.sender);').verdict, 'ALLOW');
  assert.strictEqual(runEvmEngine('uint256 bal = address(this).balance;').verdict, 'ALLOW');
  assert.strictEqual(runEvmEngine('assembly { mstore(0x0, calldataload(0)) }').verdict, 'ALLOW');
  assert.strictEqual(runEvmEngine('SafeMath.sub(a, b)').verdict, 'ALLOW');
});

// ── dependency ──
test('dependency: react pin blocks via CVE DB', () => {
  assert.strictEqual(runDependencyEngine('{"dependencies":{"react":"17.0.2"}}').verdict, 'BLOCK');
  assert.strictEqual(runDependencyEngine('{"dependencies":{"react":"17.0.2"}}').score, 92);
});
test('dependency: devDependencies typescript allows', () => {
  assert.strictEqual(runDependencyEngine('{"devDependencies":{"typescript":"4.9"}}').verdict, 'ALLOW');
  assert.strictEqual(runDependencyEngine('{"devDependencies":{"typescript":"4.9"}}').score, 0);
});
test('dependency: benign imports allow', () => {
  assert.strictEqual(runDependencyEngine("import lodash from 'lodash'").verdict, 'ALLOW');
  assert.strictEqual(runDependencyEngine("const dep = require('react')").verdict, 'ALLOW');
});

// ── ci ──
test('ci: standard workflow blocks allow', () => {
  assert.strictEqual(runCiEngine('jobs:\n  build:\n    runs-on: ubuntu-latest').verdict, 'ALLOW');
  assert.strictEqual(runCiEngine('strategy:\n  matrix:\n    node: [18, 20]').verdict, 'ALLOW');
  assert.strictEqual(runCiEngine('with:\n  node-version: 20').verdict, 'ALLOW');
  assert.strictEqual(runCiEngine('env:\n  CI: true').verdict, 'ALLOW');
});

// ── token intelligence ──
test('token-intel: benign operations allow', () => {
  assert.strictEqual(runTokenIntelligenceEngine('mint_keypair = Keypair.generate()').verdict, 'ALLOW');
  assert.strictEqual(runTokenIntelligenceEngine('transfer_checked(amount, decimals)').verdict, 'ALLOW');
  assert.strictEqual(runTokenIntelligenceEngine('get_account_info(account)').verdict, 'ALLOW');
  assert.strictEqual(runTokenIntelligenceEngine('create_associated_token_account()').verdict, 'ALLOW');
});

// ── due diligence ──
test('due-diligence: healthy signals allow', () => {
  assert.strictEqual(runDueDiligenceEngine('liquidity locked 12 months via timelock').verdict, 'ALLOW');
  assert.strictEqual(runDueDiligenceEngine('audited by certik and hacken').verdict, 'ALLOW');
  assert.strictEqual(runDueDiligenceEngine('dev wallet 5% allocation').verdict, 'ALLOW');
  assert.strictEqual(runDueDiligenceEngine('public presale whitelist').verdict, 'ALLOW');
  assert.strictEqual(runDueDiligenceEngine('vesting schedule 24 months').verdict, 'ALLOW');
});

// ── engine rule-ID pinning (rule contract) ──
test('solana: mint authority pins S15', () => {
  assert.strictEqual(runSolanaEngine('mint_authority = none').rule, 'S15.SPL_MINT_AUTHORITY');
  assert.strictEqual(runSolanaEngine('mint_authority = none').score, 92);
  assert.strictEqual(runSolanaEngine('freeze_authority = none').rule, 'S16.SPL_FREEZE_AUTHORITY');
  assert.strictEqual(runSolanaEngine('freeze_authority = none').score, 85);
});
test('token-intel: unlimited mint pins T01', () => {
  assert.strictEqual(runTokenIntelligenceEngine('mintAuthority = null').rule, 'T01.UNLIMITED_MINT');
  assert.strictEqual(runTokenIntelligenceEngine('mintAuthority = null').score, 98);
});
test('due-diligence: anonymous team pins DD01', () => {
  assert.strictEqual(runDueDiligenceEngine('team: anonymous devs').rule, 'DD01.ANONYMOUS_TEAM');
  assert.strictEqual(runDueDiligenceEngine('anonymous team doxx').rule, 'DD01.ANONYMOUS_TEAM');
  assert.strictEqual(runDueDiligenceEngine('dev allocation 40% unlocked').rule, 'DD15.UNFAIR_ALLOCATION');
  assert.strictEqual(runDueDiligenceEngine('dev allocation 40% unlocked').score, 85);
});
test('core: destructive shell pins R01', () => {
  assert.strictEqual(runCoreEngine('rm -rf /').rule, 'R01.DESTRUCTIVE_SHELL');
  assert.strictEqual(runCoreEngine('rm -rf /').score, 100);
  assert.strictEqual(runCoreEngine('sudo bash').rule, 'R13.PRIVILEGE_ESCALATION');
  assert.strictEqual(runCoreEngine('eval(atob("aGk="))').rule, 'R43.RCE_EVAL');
  assert.strictEqual(runCoreEngine('eval(atob("aGk="))').score, 96);
  assert.strictEqual(runCoreEngine('docker run --privileged --pid=host').rule, 'R47.DOCKER_ESCAPE');
  assert.strictEqual(runCoreEngine('printenv | grep SECRET').rule, 'R25.CI_SECRETS_DUMP');
});
test('banking: benign surface allows (pinned B00)', () => {
  assert.strictEqual(runBankingEngine('sanctioned_country = IR').rule, 'B00.CLEAN');
  assert.strictEqual(runBankingEngine('limit breach over $1M').rule, 'B00.CLEAN');
  assert.strictEqual(runBankingEngine('cleartext password in FIX').rule, 'B00.CLEAN');
  assert.strictEqual(runBankingEngine('round_up 2 decimals exploit').rule, 'B00.CLEAN');
});
test('core: WARN rules pin correctly', () => {
  assert.strictEqual(runCoreEngine('DROP TABLE users; DROP DATABASE x').rule, 'R09.SQL_DESTRUCTION');
  assert.strictEqual(runCoreEngine('require("../../etc/passwd")').rule, 'R11.PATH_TRAVERSAL');
  assert.strictEqual(runCoreEngine('nmap -sS 10.0.0.1').rule, 'R55.NETWORK_SCAN');
});
test('evm: WARN + BLOCK rules pin correctly', () => {
  assert.strictEqual(runEvmEngine('block.timestamp == now').rule, 'E12.TIMESTAMP_DEPENDENCY');
  assert.strictEqual(runEvmEngine('selfdestruct(address(msg.sender))').rule, 'E15.SELFDESTRUCT');
});

console.log(`\nVerdict Matrix: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);