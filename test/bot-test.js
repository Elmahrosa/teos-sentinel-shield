const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n=== Bot Module Tests ===\n');

test('Bot module loads without error', () => {
  assert.doesNotThrow(() => {
    const m = require('../gateway-bot/bot');
    assert.ok(typeof m.users === 'object');
    assert.ok(Array.isArray(m.auditLog));
  });
});

test('Bot exports have expected properties', () => {
  const m = require('../gateway-bot/bot');
  assert.ok(typeof m.startBot === 'function');
  assert.ok(typeof m.users === 'object');
  assert.ok(Array.isArray(m.auditLog));
});

test('Bot users map supports credit operations', () => {
  const bot = require('../gateway-bot/bot');
  const userId = 999999;
  bot.users[userId] = { credits: 100, tier: 'tester', activated: true };
  assert.strictEqual(bot.users[userId].credits, 100);
  assert.strictEqual(bot.users[userId].tier, 'tester');
  bot.users[userId].credits -= 5;
  assert.strictEqual(bot.users[userId].credits, 95);
});

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
