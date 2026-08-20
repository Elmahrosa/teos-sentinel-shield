const { RULES, runEngine } = require('../src/engine/scanner.js');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

const R26 = RULES.find(r => r.id === 'R26');
const R27 = RULES.find(r => r.id === 'R27');
const R28 = RULES.find(r => r.id === 'R28');
const R29 = RULES.find(r => r.id === 'R29');
const R30 = RULES.find(r => r.id === 'R30');

assert(R26, 'R26 must exist');
assert(R27, 'R27 must exist');
assert(R28, 'R28 must exist');
assert(R29, 'R29 must exist');
assert(R30, 'R30 must exist');

console.log("\nBanking Rules — R26 LEDGER_MANIPULATION:");

test("[POS] update balance without transaction", () => {
  assert.strictEqual(R26.test('UPDATE balance SET amount = 1000000 without transaction'), true);
});

test("[NEG] update balance with transaction (safe)", () => {
  assert.strictEqual(R26.test('UPDATE balance SET amount = 1000; COMMIT;'), false);
});

console.log("\nBanking Rules — R27 SWIFT_UNENCRYPTED:");

test("[POS] ISO20022 over http://", () => {
  assert.strictEqual(R27.test('send(ISO20022, "http://bank.com/clearing")'), true);
});

test("[POS] SWIFT_MT over ws://", () => {
  assert.strictEqual(R27.test('connect("ws://swift.bank.com", SWIFT_MT)'), true);
});

test("[NEG] ISO20022 over https:// (TLS)", () => {
  assert.strictEqual(R27.test('send(ISO20022, "https://bank.com/clearing")'), false);
});

test("[NEG] ws:// without SWIFT context", () => {
  assert.strictEqual(R27.test('const ws = new WebSocket("ws://localhost:8080")'), false);
});

console.log("\nBanking Rules — R28 FIX_CLEARTEXT:");

test("[POS] FIX login with Password=", () => {
  assert.strictEqual(R28.test('BeginString=FIX.4.4|35=A|Password=secret123|'), true);
});

test("[POS] FIX login with RawData=", () => {
  assert.strictEqual(R28.test('BeginString=FIX.4.2|35=A|RawData=abc456|'), true);
});

test("[NEG] FIX order (35=D, not login)", () => {
  assert.strictEqual(R28.test('BeginString=FIX.4.4|35=D|OrderQty=100|'), false);
});

console.log("\nBanking Rules — R29 FRONT_RUNNING:");

test("[POS] front_run detected", () => {
  assert.strictEqual(R29.test('function front_run(orders) { }'), true);
});

test("[POS] slippage_manipulation", () => {
  assert.strictEqual(R29.test('const slippage_manipulation = true'), true);
});

test("[NEG] normal trading code", () => {
  assert.strictEqual(R29.test('function executeOrder(order) { }'), false);
});

console.log("\nBanking Rules — R30 RESERVE_LEAK:");

test("[POS] console.log(vault_master_key)", () => {
  assert.strictEqual(R30.test('console.log("key:", vault_master_key)'), true);
});

test("[POS] return treasury_signing_key", () => {
  assert.strictEqual(R30.test('function getKey() { return treasury_signing_key; }'), true);
});

test("[NEG] if (mint_authority == null) — conditional check", () => {
  assert.strictEqual(R30.test('if (mint_authority == null) throw new Error()'), false);
});

test("[NEG] const key = vault_master_key — assignment", () => {
  assert.strictEqual(R30.test('const key = vault_master_key;'), false);
});

const R31 = RULES.find(r => r.id === 'R31');
assert(R31, 'R31 must exist');

console.log("\nBanking Rules — R31 CROSS_IDENTITY_SILENT_TRUST (PDPL 2026):");

test("[POS] transfer_pii_to_fra_cloud without minimization", () => {
  assert.strictEqual(R31.test('transfer_pii_to_fra_cloud(customer_data)'), true);
});

test("[POS] sync_pii_cbe_to_fra without sha256 or zk_proof", () => {
  assert.strictEqual(R31.test('sync_pii_cbe_to_fra(user_records)'), true);
});

test("[POS] pii_cross_boundary without pdpl compliance", () => {
  assert.strictEqual(R31.test('pii_cross_boundary(raw_data, fra_env)'), true);
});

test("[NEG] sync_pii_cbe_to_fra WITH sha256(national_id + salt) (safe)", () => {
  assert.strictEqual(R31.test('sync_pii_cbe_to_fra(sha256(national_id + salt))'), false);
});

test("[NEG] export_customer_pii WITH zk_proof (safe)", () => {
  assert.strictEqual(R31.test('export_customer_pii(data, zk_proof)'), false);
});

test("[NEG] pii_cross_boundary WITH pdpl_compliant_2026 (safe)", () => {
  assert.strictEqual(R31.test('pii_cross_boundary(data, pdpl_compliant_2026)'), false);
});

const R32 = RULES.find(r => r.id === 'R32');
assert(R32, 'R32 must exist');

console.log("\nBanking Rules — R32 UNASSIGNED_DISPUTE_ESCALATION (Pre-Sign Atomic Split):");

test("[POS] split_payment_transaction without deterministic IDs", () => {
  assert.strictEqual(R32.test('split_payment_transaction(total, card_alloc, bnpl_alloc)'), true);
});

test("[POS] fractional_split_payment without CBE/FRA routing", () => {
  assert.strictEqual(R32.test('fractional_split_payment(amount, parts)'), true);
});

test("[POS] mixed_payment_split without pre-sign IDs", () => {
  assert.strictEqual(R32.test('mixed_payment_split(cbe_card, fra_bnpl)'), true);
});

test("[NEG] split_payment_transaction WITH generate_deterministic_id for CBE and FRA (safe)", () => {
  assert.strictEqual(R32.test('split_payment_transaction(total, card_alloc, bnpl_alloc, generate_deterministic_id(meta, CBE), generate_deterministic_id(meta, FRA))'), false);
});

const R33 = RULES.find(r => r.id === 'R33');
assert(R33, 'R33 must exist');

console.log("\nBanking Rules — R33 FEDERATED_HSM_CLAIMS:");

test("[POS] verify_card_access_authority without bank HSM ticket", () => {
  assert.strictEqual(R33.test('verify_card_access_authority(payload)'), true);
});

test("[POS] process_card_payload without federated bank ticket", () => {
  assert.strictEqual(R33.test('process_card_payload(txn_data)'), true);
});

test("[NEG] verify_card_access_authority WITH federated_bank_ticket and PUBLIC_KEY_CBE_CUSTODIAN_BANK (safe)", () => {
  assert.strictEqual(R33.test('verify_card_access_authority(payload, federated_bank_ticket, PUBLIC_KEY_CBE_CUSTODIAN_BANK)'), false);
});

test("[NEG] process_card_payload WITH bank HSM handshake (safe)", () => {
  assert.strictEqual(R33.test('process_card_payload(data) federated_bank_ticket PUBLIC_KEY_CBE_CUSTODIAN_BANK'), false);
});

console.log("\nRunEngine integration:");

test("[POS] ledger manipulation returns BLOCK", () => {
  const res = runEngine('UPDATE balance SET amount = 1000000 without transaction');
  assert.strictEqual(res.verdict, 'BLOCK');
  assert.strictEqual(res.ruleId, 'R26');
});

test("[POS] FIX cleartext returns BLOCK", () => {
  const res = runEngine('BeginString=FIX.4.4|35=A|Password=secret123|');
  assert.strictEqual(res.verdict, 'BLOCK');
});

test("[POS] front_running returns WARN (score 65 < 80)", () => {
  const res = runEngine('function front_run(orders) { }');
  assert.strictEqual(res.verdict, 'WARN');
});

test("[NEG] normal banking code returns ALLOW", () => {
  const res = runEngine('function executeOrder(order) { return submit(order); }');
  assert.strictEqual(res.verdict, 'ALLOW');
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
