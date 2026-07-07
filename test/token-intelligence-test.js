const assert = require('assert');
const { runTokenIntelligenceEngine, TOKEN_INTELLIGENCE_RULES } = require('../src/engines/token-intelligence');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== Token Intelligence Engine ===\n');

test('TOKEN_INTELLIGENCE_RULES has at least 25 entries', () => {
  assert.ok(TOKEN_INTELLIGENCE_RULES.length >= 25);
});

test('BLOCK unlimited mint', () => {
  const r = runTokenIntelligenceEngine('mintAuthority = null; function _mint(to, amount) unlimited { }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK renounce ownership to zero', () => {
  const r = runTokenIntelligenceEngine('renounceOwnership(0x0000000000000000000000000000000000000000)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK liquidity removal without delay', () => {
  const r = runTokenIntelligenceEngine('function removeLiquidity() public { withdraw_all(); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK honeypot sell restriction', () => {
  const r = runTokenIntelligenceEngine('if (msg.sender != owner) revert("only owner can sell")');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK proxy upgrade unrestricted', () => {
  const r = runTokenIntelligenceEngine('function upgradeTo(address impl) public { _upgradeTo(impl); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK blacklist all holders', () => {
  const r = runTokenIntelligenceEngine('function blacklistAll() public onlyOwner { blacklist.add(all_holders); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('ALLOW for safe token', () => {
  const r = runTokenIntelligenceEngine('function transfer(address to, uint256 amount) external returns (bool) { _transfer(msg.sender, to, amount); return true; }');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ALLOW for openzeppelin template', () => {
  const r = runTokenIntelligenceEngine('import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; contract MyToken is ERC20 { constructor() ERC20("Token", "TKN") {} }');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ERROR for empty input', () => {
  const r = runTokenIntelligenceEngine('');
  assert.strictEqual(r.verdict, 'ERROR');
});

test('BLOCK supply manipulation', () => {
  const r = runTokenIntelligenceEngine('totalSupply = totalSupply - 1000000');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK swap min output zero', () => {
  const r = runTokenIntelligenceEngine('swapExactTokensForTokens(amountIn, 0, path, to, deadline)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK pause unrestricted', () => {
  const r = runTokenIntelligenceEngine('function pause() public { _pause(); }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
