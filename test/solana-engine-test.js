const assert = require('assert');
const { runSolanaEngine, SOLANA_RULES } = require('../src/engines/solana');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== Solana Security Engine ===\n');

test('SOLANA_RULES has at least 29 entries', () => {
  assert.ok(SOLANA_RULES.length >= 29);
});

test('BLOCK unchecked account', () => {
  const r = runSolanaEngine('let account: AccountInfo<MyAccount> = AccountInfo::new(&data)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK missing authority check', () => {
  const r = runSolanaEngine('authority = user.key; update_state(authority, data)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK CPI without signed seeds', () => {
  const r = runSolanaEngine('invoke(&ix, &account_infos)?');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK mint authority unset', () => {
  const r = runSolanaEngine('mint_authority = pubkey::default()');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK account reinit', () => {
  const r = runSolanaEngine('close_account_and_reinitialize(state)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK PDA ownership missing', () => {
  const r = runSolanaEngine('pda_derived.owner = skip_check');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK program upgrade authority unset', () => {
  const r = runSolanaEngine('upgrade_authority = null');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK system program abuse', () => {
  const r = runSolanaEngine('invoke(&system_program::transfer(&from, &to, amount), &accounts)?');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK lamport manipulation', () => {
  const r = runSolanaEngine('account.lamports.sub(amount)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('ALLOW for safe Anchor code', () => {
  const r = runSolanaEngine('use anchor_lang::prelude::*; #[program] pub mod my_program { pub fn initialize(ctx: Context<Initialize>) -> Result<()> { Ok(()) } }');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ALLOW for safe solana instruction', () => {
  const r = runSolanaEngine('let ix = Instruction { program_id, accounts, data };');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ERROR for empty input', () => {
  const r = runSolanaEngine('');
  assert.strictEqual(r.verdict, 'ERROR');
});

test('BLOCK account data mutation without check', () => {
  const r = runSolanaEngine('account.data.borrow_mut().set(new_data); // no validation');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK freeze authority unset', () => {
  const r = runSolanaEngine('freeze_authority = none');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK clock dependency without buffer', () => {
  const r = runSolanaEngine('if Clock::get()?.unix_timestamp > deadline { process_expired() }');
  assert.strictEqual(r.verdict, 'BLOCK');
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
