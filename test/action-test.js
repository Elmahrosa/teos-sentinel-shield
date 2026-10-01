'use strict';
// Offline tests for src/action.js — uses a local mock API, no network or hosted backend needed.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ACTION = path.join(__dirname, '..', 'src', 'action.js');
let hits = 0;
let mode = 'allow';
let flaky = 0;
const reqIds = [];

const server = http.createServer((req, res) => {
  hits++;
  reqIds.push(req.headers['x-request-id']);
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (mode === 'down')      return send(503, { error: 'unavailable' });
    if (mode === 'flaky')     return flaky++ === 0 ? send(502, {}) : send(200, { verdict: 'ALLOW', score: 0, ruleId: 'R00' });
    if (mode === 'block')     return send(200, { verdict: 'BLOCK', score: 100, ruleId: 'R01', reasons: ['x'] });
    if (mode === 'weird')     return send(200, { decision: 'ALLOW' });          // old alt-shape must NOT pass
    if (mode === 'unknown')   return send(200, { verdict: 'PROCEED' });
    if (mode === 'inject')    return send(200, { verdict: 'WARN', score: 999999, ruleId: 'R09', reasons: ['a\n::error::fake-from-reason', 'b'] });
    if (mode === 'badrule')   return send(200, { verdict: 'WARN', score: 5, ruleId: 'R09\n::add-mask::sk-live\n::notice title=pwned::x' });
    if (mode === 'highscore') return send(200, { verdict: 'ALLOW', score: 999999, ruleId: 'R01' });
    if (mode === 'forbidden') return send(403, { error: 'bad key' });
    return send(200, { verdict: 'ALLOW', score: 3, ruleId: 'R00' });
  });
});

function run(env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [ACTION], {
      env: {
        PATH: process.env.PATH,
        TEOS_RETRY_DELAY_MS: '10',
        GITHUB_ACTIONS: 'true',
        ...env,
      },
    });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ code, out }));
  });
}

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log(`  ok   ${name}`);
  else { failures++; console.log(`  FAIL ${name}${extra ? '\n' + extra : ''}`); }
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}`;
  const base = {
    'INPUT_API-KEY': 'test-key-12345678',
    'INPUT_SCAN-TARGET': 'npm run build',
    'INPUT_API-URL': url,
    TEOS_APPROVED_API_URLS: url,
  };
  let r;

  mode = 'allow';  r = await run(base);
  check('ALLOW passes', r.code === 0, r.out);

  mode = 'block';  r = await run(base);
  check('BLOCK fails', r.code === 1, r.out);

  mode = 'weird';  r = await run(base);
  check('non-contract response shape fails closed', r.code === 1, r.out);

  mode = 'unknown'; r = await run(base);
  check('unknown verdict fails closed', r.code === 1, r.out);

  mode = 'forbidden'; r = await run(base);
  check('403 fails', r.code === 1, r.out);

  // api-url allowlist
  mode = 'allow'; hits = 0;
  r = await run({ ...base, TEOS_APPROVED_API_URLS: '' });
  check('unapproved api-url is refused and nothing is sent', r.code === 1 && hits === 0, r.out);
  r = await run({ ...base, 'INPUT_API-URL': 'http://evil.example.com', TEOS_APPROVED_API_URLS: 'http://evil.example.com' });
  check('non-https non-loopback api-url is refused', r.code === 1 && hits === 0, r.out);
  r = await run({ ...base, 'INPUT_API-PATH': '//evil.example.com/x' });
  check('malformed api-path is refused', r.code === 1 && hits === 0, r.out);

  // secret guard — nothing must reach the server
  const secrets = [
    'deploy --token ghp_' + 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8',
    'aws --key AKIA' + 'ABCDEFGHIJKLMNOP',
    'curl -H "Authorization: Bearer ' + 'abcdEFGH1234567890abcdEFGH12"',
    'echo sk-ant-' + 'api03-abcdefghijklmnopqrstuvwx',
    'run ' + 'test-key-12345678',
    'x ' + 'q8Zr3LmW9vTb2XkP7nYc4HdF6sJg1AeU',
    'curl -H x eyJhbGciOiJSUzI1NiJ9' + '.eyJzdWIiOiIxMjM0NTY3ODkwIn0' + '.abcdefghijklmnopqrstuvwx',
    'x Zm9vYmFyYmF6cXV4L3F1dXhj' + 'b3JnZS9ncmF1bHQvZ2FycGx5',
    'x qwertyuiopasdfghjkl' + 'zxcvbnmqwertyuiop0123',
    'x glpat' + '-abcdefghij1234567890',
  ];
  for (const t of secrets) {
    hits = 0;
    r = await run({ ...base, 'INPUT_SCAN-TARGET': t });
    check(`secret guard blocks fixture #${secrets.indexOf(t) + 1}`, r.code === 1 && hits === 0 && !r.out.includes(t.split(' ').pop()) , r.out);
  }
  hits = 0;
  r = await run({ ...base, 'INPUT_SCAN-TARGET': 'git checkout 976235e28562610f917d8eb51d56ab054b838795' });
  check('git SHA is not flagged as a secret', r.code === 0 && hits === 1, r.out);

  // ── injection hardening ──
  const outFile = path.join(os.tmpdir(), `teos-out-${process.pid}.txt`);
  const injected = (o) => o.split('\n').filter((l) => /^::(add-mask|notice title=pwned|error::fake)/.test(l));

  mode = 'badrule'; fs.writeFileSync(outFile, '');
  r = await run({ ...base, GITHUB_OUTPUT: outFile });
  check('malformed ruleId is rejected as ERROR, no injected commands',
    r.code === 1 && injected(r.out).length === 0 && !fs.readFileSync(outFile, 'utf8').includes('pwned'), r.out);

  mode = 'inject'; fs.writeFileSync(outFile, '');
  r = await run({ ...base, GITHUB_OUTPUT: outFile });
  const outTxt = fs.readFileSync(outFile, 'utf8');
  check('newline in reasons cannot inject workflow commands', r.code === 0 && injected(r.out).length === 0, r.out);
  check('score is clamped to 0-100 in outputs', /risk-score<<[^\n]+\n100\n/.test(outTxt), outTxt);

  mode = 'allow'; fs.writeFileSync(outFile, '');
  r = await run({ ...base, GITHUB_OUTPUT: outFile, 'INPUT_SCAN-TARGET': 'echo hi\n::add-mask::from-target' });
  check('newline in scan-target cannot inject workflow commands', injected(r.out).length === 0 && !/^::add-mask::from-target/m.test(r.out), r.out);

  // ── request id is stable across a retry ──
  mode = 'flaky'; flaky = 0; reqIds.length = 0;
  await run(base);
  check('retry re-uses the same X-Request-ID', reqIds.length === 2 && reqIds[0] === reqIds[1], String(reqIds));

  // ── garbage retry delay must not mean zero backoff ──
  mode = 'down'; const t0 = Date.now();
  await run({ ...base, TEOS_RETRY_DELAY_MS: 'abc' });
  check('non-numeric TEOS_RETRY_DELAY_MS falls back to a real backoff', Date.now() - t0 >= 1400, String(Date.now() - t0));
  mode = 'allow';

  // retry
  mode = 'flaky'; flaky = 0; hits = 0;
  r = await run(base);
  check('one retry recovers from a transient 502', r.code === 0 && hits === 2, r.out);

  // backend down
  mode = 'down'; hits = 0;
  r = await run(base);
  check('backend down fails closed (after 1 retry)', r.code === 1 && hits === 2, r.out);

  r = await run({ ...base, 'INPUT_FAIL-OPEN': 'true' });
  check('fail-open passes with a loud ::error:: annotation',
    r.code === 0 && r.out.includes('::error title=TEOS FAIL-OPEN ACTIVE'), r.out);

  r = await run({ ...base, 'INPUT_FAIL-OPEN': 'true', GITHUB_REF_PROTECTED: 'true' });
  check('fail-open is refused on protected refs', r.code === 1, r.out);

  // timeout clamp: absurd values must not crash
  mode = 'allow';
  r = await run({ ...base, 'INPUT_TIMEOUT-SECONDS': '99999' });
  check('timeout-seconds is clamped, not crashing', r.code === 0, r.out);
  r = await run({ ...base, 'INPUT_TIMEOUT-SECONDS': 'abc' });
  check('non-numeric timeout-seconds falls back to default', r.code === 0, r.out);

  server.close();
  console.log(failures ? `\n${failures} FAILED` : '\nall action tests passed');
  process.exit(failures ? 1 : 0);
})();
