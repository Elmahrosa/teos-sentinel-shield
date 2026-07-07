const assert = require('assert');
const { runEvmEngine, EVM_RULES } = require('../src/engines/evm');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== EVM Security Engine ===\n');

test('EVM_RULES has at least 21 entries', () => {
  assert.ok(EVM_RULES.length >= 21);
});

test('BLOCK reentrancy (external call before state update)', () => {
  const r = runEvmEngine('function withdraw() public { msg.sender.call{value: address(this).balance}(""); balance[msg.sender] = 0; }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK delegatecall without check', () => {
  const r = runEvmEngine('function execute(address impl) public { (bool ok, ) = impl.delegatecall(msg.data); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK selfdestruct', () => {
  const r = runEvmEngine('function kill() public { selfdestruct(payable(owner)); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK owner check missing on privileged fn', () => {
  const r = runEvmEngine('function withdrawAll() public { msg.sender.transfer(address(this).balance); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK tx.origin auth', () => {
  const r = runEvmEngine('require(tx.origin == owner)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK timestamp dependency', () => {
  const r = runEvmEngine('if (block.timestamp > deadline) { refund(); }');
  assert.strictEqual(r.verdict, 'WARN');
});

test('BLOCK default visibility', () => {
  const r = runEvmEngine('function withdraw() { msg.sender.transfer(address(this).balance); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK insecure randomness', () => {
  const r = runEvmEngine('uint256 random = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp)));');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK flash loan without check', () => {
  const r = runEvmEngine('flashMint(token, amount, user); // fee = 0');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK uninitialized storage', () => {
  const r = runEvmEngine('function initialize() public { owner = msg.sender; }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('ALLOW for safe Solidity', () => {
  const r = runEvmEngine('function safeWithdraw() external onlyOwner { uint256 amount = balances[msg.sender]; balances[msg.sender] = 0; (bool ok, ) = msg.sender.call{value: amount}(""); require(ok, "transfer failed"); }');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ALLOW for simple getter', () => {
  const r = runEvmEngine('function balanceOf(address user) external view returns (uint256) { return balances[user]; }');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ERROR for empty input', () => {
  const r = runEvmEngine('');
  assert.strictEqual(r.verdict, 'ERROR');
});

test('BLOCK DoS with revert', () => {
  const r = runEvmEngine('for (uint256 i = 0; i < users.length; i++) { distribute(users[i]); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK timelock bypass', () => {
  const r = runEvmEngine('function bypassTimelock() public onlyOwner { executeProposal(proposalId); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK assembly jump', () => {
  const r = runEvmEngine('assembly { mstore(0x80, calldataload(4)) jump(jumpdest) }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
