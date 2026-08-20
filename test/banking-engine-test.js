const assert = require('assert');
const { runBankingEngine, BANKING_RULES } = require('../src/engines/banking');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== Banking Compliance Engine ===\n');

test('BANKING_RULES has at least 32 entries', () => {
  assert.ok(BANKING_RULES.length >= 32);
});

test('BLOCK ledger direct mutation', () => {
  const r = runBankingEngine('db.balance.updateOne({}, { $set: { amount: 999999 } }, { bypassHooks: true })');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK reserve bypass', () => {
  const r = runBankingEngine('set_reserve(minimum, bypass_regulatory)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK double spend logic disabled', () => {
  const r = runBankingEngine('double_spend_protection = false');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK SWIFT unencrypted', () => {
  const r = runBankingEngine('new SWIFTMessage({ transport: "ws://swift.example.com" })');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK FIX cleartext login', () => {
  const r = runBankingEngine('BeginString=FIX.4.4\\n35=A\\nPassword=cleartext!');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK AML screening bypass', () => {
  const r = runBankingEngine('aml_check = false; transfer(amount, user)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK PCI card data storage', () => {
  const r = runBankingEngine('store_credit_card(pan, cvv)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK PCI track data', () => {
  const r = runBankingEngine('INSERT INTO card_data (track1, track2) VALUES (...)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK rounding attack', () => {
  const r = runBankingEngine('round(amount * 0.001) accumulated += fraction');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK segregation of duties violation', () => {
  const r = runBankingEngine('same_user = create_and_approve_payment');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK audit log tampering', () => {
  const r = runBankingEngine('DELETE FROM audit_log WHERE 1=1');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK ledger fabrication', () => {
  const r = runBankingEngine('backdate_transaction(timestamp, entry)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK PII cross boundary', () => {
  const r = runBankingEngine('sync_pii_cbe_to_fra(customerDb)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK SAR filing bypass', () => {
  const r = runBankingEngine('dont_file_sar_for(transaction)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK KYC document forgery', () => {
  const r = runBankingEngine('kyc_upload.auto_approve = true');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK sanctions list manipulation', () => {
  const r = runBankingEngine('DELETE FROM sanctions_list WHERE id > 0');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK fee manipulation', () => {
  const r = runBankingEngine('fee = amount * 2.5; round(fee); pool_fees += fee');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK recurring payment fraud', () => {
  const r = runBankingEngine('autopay.charge_without_consent = true');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('ALLOW for safe banking code', () => {
  const r = runBankingEngine('process_payment_with_validation(user, amount)');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ALLOW for normal transaction', () => {
  const r = runBankingEngine('INSERT INTO transactions (amount, user_id) VALUES ($1, $2)');
  assert.strictEqual(r.verdict, 'ALLOW');
});

test('ERROR for empty input', () => {
  const r = runBankingEngine('');
  assert.strictEqual(r.verdict, 'ERROR');
});

test('BLOCK regulatory report manipulation', () => {
  const r = runBankingEngine('reg_report.modify_reserve_numbers(hide_deficit)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK IBAN validation bypass', () => {
  const r = runBankingEngine('iban_validation = skip; process_payment(to, amount)');
  assert.strictEqual(r.verdict, 'BLOCK');
});

test('BLOCK BIC code manipulation', () => {
  const r = runBankingEngine('override_bic = "FAKEBANKXXX"');
  assert.strictEqual(r.verdict, 'BLOCK');
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
