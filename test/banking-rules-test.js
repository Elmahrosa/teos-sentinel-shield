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

console.log("\nBanking Rules — R31 CROSS_IDENTITY_SILENT_TRUST:");

test("[POS] bind_identity without attestation", () => {
  assert.strictEqual(R31.test('bind_identity(cbe_uid, fra_uid)'), true);
});

test("[POS] map_user_identities without attestation", () => {
  assert.strictEqual(R31.test('map_user_identities(bank_kyc, finance_onboarding)'), true);
});

test("[NEG] bind_identity WITH attestation (safe)", () => {
  assert.strictEqual(R31.test('bind_identity(cbe_uid, fra_uid); create_tamper_evident_correlation(event)'), false);
});

const R32 = RULES.find(r => r.id === 'R32');
assert(R32, 'R32 must exist');

console.log("\nBanking Rules — R32 UNASSIGNED_DISPUTE_ESCALATION:");

test("[POS] initiate_installment without dispute owner", () => {
  assert.strictEqual(R32.test('initiate_installment(account, amount)'), true);
});

test("[POS] create_bnpl_flow without dispute owner", () => {
  assert.strictEqual(R32.test('create_bnpl_flow(user, merchant, 1000)'), true);
});

test("[NEG] initiate_installment WITH dispute owner (safe)", () => {
  assert.strictEqual(R32.test('initiate_installment(account, amount); assign_deterministic_dispute_owner(team)'), false);
});

const R33 = RULES.find(r => r.id === 'R33');
assert(R33, 'R33 must exist');

console.log("\nBanking Rules — R33 PCI_FRA_DATA_CONTAMINATION:");

test("[POS] merge_data_environments", () => {
  assert.strictEqual(R33.test('merge_data_environments(pci_env, fra_env)'), true);
});

test("[POS] pull_raw_pci_data", () => {
  assert.strictEqual(R33.test('pull_raw_pci_data(production_db)'), true);
});

test("[POS] sync_cde_to_fra", () => {
  assert.strictEqual(R33.test('sync_cde_to_fra(card_data, fra_ledger)'), true);
});

test("[NEG] normal data sync (no contamination)", () => {
  assert.strictEqual(R33.test('sync_users(prod, staging)'), false);
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
