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
    const bot = require('../gateway-bot/bot');
    assert.ok(bot.bot);
    assert.ok(bot.users);
    assert.ok(bot.auditLog);
  });
});

test('Bot exports have expected properties', () => {
  const bot = require('../gateway-bot/bot');
  assert.ok(typeof bot.startBot === 'function');
  assert.ok(typeof bot.bot !== 'undefined');
  assert.ok(Array.isArray(bot.auditLog));
  assert.ok(typeof bot.users === 'object');
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
