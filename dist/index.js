#!/usr/bin/env node
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 982:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 896:
/***/ ((module) => {

module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};


/*
  TEOS Sentinel Shield — GitHub Action entrypoint

  Reads GitHub Actions inputs from INPUT_* environment variables, POSTs the
  scan target to the TEOS Sentinel Shield API, and fails the workflow run
  (exit 1) on a BLOCK (or unreachable-engine) verdict.

  Verdict model: ALLOW | WARN | REVIEW | BLOCK | ERROR
    ALLOW  -> pass
    WARN   -> pass with warning annotation
    REVIEW -> pass with notice annotation
    BLOCK  -> fail the run (exit 1)
    ERROR  -> fail the run (exit 1) — treat engine error as blocked
    unknown -> fail-closed (exit 1) — a security gate must not pass unseen
*/

const fs      = __nccwpck_require__(896);
const crypto  = __nccwpck_require__(982);

const VERSION = '5.2.0';

const DEFAULT_API_URL = 'https://teos-sentinel-shield-production-7f0d.up.railway.app';

// Verdicts accepted FROM the API. The action itself may additionally emit
// UNVERIFIED as an output when fail-open skipped the scan (never from the API).
const KNOWN_VERDICTS = new Set(['ALLOW', 'WARN', 'REVIEW', 'BLOCK', 'ERROR']);

const DEFAULT_TIMEOUT_S = 15;
const MIN_TIMEOUT_S     = 10;
const MAX_TIMEOUT_S     = 60;

// Statuses that mean "the backend is down / not answering", as opposed to
// "the backend answered and said no".
const BACKEND_DOWN_STATUSES = new Set([502, 503, 504]);

// ── Secret guard ────────────────────────────────────────────────────────────
// scan-target is transmitted to the API. Refuse to send anything that looks
// like a credential (e.g. a secrets.* value interpolated into the target).
const SECRET_PATTERNS = [
  ['GitHub token',            /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{22,})\b/],
  ['AWS access key id',       /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['Anthropic/OpenAI-style key', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['Slack token',             /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['Google API key',          /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Bearer credential',       /\bBearer\s+[A-Za-z0-9._~+\/=-]{20,}/i],
  ['Private key block',       /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
  ['JSON Web Token',          /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/],
  ['GitLab token',            /\bglpat-[A-Za-z0-9_-]{16,}/],
  ['npm token',               /\bnpm_[A-Za-z0-9]{30,}\b/],
  ['Stripe key',              /\b[sr]k_(?:live|test)_[A-Za-z0-9]{16,}/],
];

function shannonEntropy(str) {
  const freq = new Map();
  for (const ch of str) freq.set(ch, (freq.get(ch) || 0) + 1);
  let h = 0;
  for (const n of freq.values()) {
    const p = n / str.length;
    h -= p * Math.log2(p);
  }
  return h;
}

// Returns the *name* of the first thing that looks like a secret, or null.
// Never returns the matched value, so it is safe to log.
function findSecretLike(target, apiKey) {
  if (apiKey && apiKey.length >= 8 && target.includes(apiKey)) return 'the api-key input itself';
  for (const [name, re] of SECRET_PATTERNS) {
    if (re.test(target)) return name;
  }
  // Best-effort entropy check. Pure hex (git SHAs, hashes) tops out near 4.0
  // bits/char and is deliberately not flagged.
  for (const tok of target.split(/[\s"'`=:,;()\[\]{}<>]+/)) {
    if (tok.length >= 32 && /^[A-Za-z0-9+\/_=-]+$/.test(tok)) {
      const classes = [/[a-z]/, /[A-Z]/, /[0-9]/].filter((re) => re.test(tok)).length;
      if (classes >= 2 && shannonEntropy(tok) >= 4.5) return 'high-entropy string';
    }
  }
  return null;
}

// ── API URL / path validation ───────────────────────────────────────────────
// Only the default endpoint (or an origin listed in TEOS_APPROVED_API_URLS,
// comma-separated, ideally set at org level) may receive the scan payload.
function validateApiUrl(apiUrl) {
  let u;
  try { u = new URL(apiUrl); } catch (_) { return 'api-url is not a valid URL'; }

  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && loopback)) {
    return 'api-url must use https (http is only accepted for loopback hosts)';
  }
  if (u.username || u.password) return 'api-url must not contain credentials';

  const allowed = new Set([new URL(DEFAULT_API_URL).origin]);
  for (const raw of String(process.env['TEOS_APPROVED_API_URLS'] || '').split(',')) {
    const entry = raw.trim();
    if (!entry) continue;
    try { allowed.add(new URL(entry).origin); } catch (_) { /* ignore bad entry */ }
  }
  if (!allowed.has(u.origin)) {
    return `api-url origin "${u.origin}" is not approved. Add it to TEOS_APPROVED_API_URLS to allow it, or omit api-url to use the default.`;
  }
  return null;
}

function validateApiPath(apiPath) {
  if (!/^\/[A-Za-z0-9._\-\/]*$/.test(apiPath) || apiPath.includes('..') || apiPath.includes('//')) {
    return 'api-path must be a plain path such as /scan';
  }
  return null;
}

function clampTimeoutSeconds(raw) {
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return DEFAULT_TIMEOUT_S;
  return Math.min(MAX_TIMEOUT_S, Math.max(MIN_TIMEOUT_S, n));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readInput(name, fallback) {
  const value = process.env[`INPUT_${name}`];
  return value === undefined || value === null ? fallback : value;
}

// Anything that came from outside this process (scan-target, API response) is
// untrusted. GitHub parses log lines that start with "::" as workflow commands,
// so untrusted text must never be able to introduce a newline or control char.
function safeText(value, max = 300) {
  const flat = String(value ?? '')
    .replace(/[\u0000-\u001f\u007f\u0085\u2028\u2029]+/g, ' ')
    .trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

function log(msg) {
  console.log(`[TEOS] ${safeText(msg, 1000)}`);
}

function fail(msg) {
  console.error(`[TEOS] ${safeText(msg, 1000)}`);
}

function setOutput(name, value) {
  const file = process.env['GITHUB_OUTPUT'];
  if (!file) return;
  // Multiline-safe form with a random delimiter: a value can never terminate
  // the block or smuggle in extra "name=value" lines.
  const delim = `TEOS_${crypto.randomUUID()}`;
  try {
    fs.appendFileSync(file, `${name}<<${delim}\n${safeText(value, 200)}\n${delim}\n`, 'utf8');
  } catch (_) { /* non-fatal */ }
}

function annotate(level, title, detail) {
  // Escape rules per GitHub workflow-command spec: data escapes % \r \n;
  // property values (title) additionally escape ":" and ",".
  const data = safeText(detail, 1000)
    .replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  const prop = safeText(title, 200)
    .replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
    .replace(/:/g, '%3A').replace(/,/g, '%2C');
  if (process.env['GITHUB_ACTIONS']) {
    console.log(`::${level} title=${prop}::${data}`);
  }
}

function appendSummary(lines) {
  const file = process.env['GITHUB_STEP_SUMMARY'];
  if (!file) return;
  try {
    fs.appendFileSync(file, lines.map((l) => safeText(l, 500).replace(/`{2,}/g, "'")).join('\n') + '\n', 'utf8');
  } catch (_) { /* non-fatal */ }
}

function buildPayload(target) {
  const payload = {
    agentId: 'github-action',
    source:  'github-action',
    action:  target,
    command: target,
  };

  // Enrich with GitHub context when present (additive; ignored by the engine
  // if the endpoint does not understand it).
  if (process.env['GITHUB_REPOSITORY']) payload.repository = process.env['GITHUB_REPOSITORY'];
  if (process.env['GITHUB_SHA'])        payload.sha        = process.env['GITHUB_SHA'];
  if (process.env['GITHUB_REF'])        payload.ref        = process.env['GITHUB_REF'];
  if (process.env['GITHUB_WORKFLOW'])   payload.workflow   = process.env['GITHUB_WORKFLOW'];
  if (process.env['GITHUB_ACTOR'])      payload.actor      = process.env['GITHUB_ACTOR'];
  if (process.env['RUNNER_OS'])         payload.runnerOs   = process.env['RUNNER_OS'];

  return payload;
}

const RULE_ID_RE = /^[A-Za-z0-9._:-]{1,64}$/;

function extractResult(json) {
  // A response that breaks the contract is an ENGINE/CONTRACT error, not a
  // genuine BLOCK decision — report it as ERROR so audit trails stay honest.
  const invalid = (why) => ({ verdict: 'ERROR', ruleId: 'R00', score: 0, severity: 'none', reasons: [why] });

  if (!json || typeof json !== 'object') return invalid('Empty or invalid response from scan API');

  // Contract: { verdict, score, ruleId | rule, reasons }. Anything else fails
  // closed so a future API change can never be read as ALLOW.
  if (typeof json.verdict !== 'string') return invalid('Scan API response has no "verdict" field');
  const verdict = json.verdict.trim().toUpperCase();
  if (!KNOWN_VERDICTS.has(verdict)) return invalid('Scan API returned an unrecognised verdict');

  // Every field below ends up in logs, annotations or step outputs, so it is
  // validated/sanitised here rather than trusted.
  const ruleRaw = json.ruleId ?? json.rule ?? 'R00';
  if (typeof ruleRaw !== 'string' || !RULE_ID_RE.test(ruleRaw)) {
    return invalid('Scan API returned a malformed rule id');
  }

  const scoreNum = Number(json.score ?? json.riskScore ?? 0);
  const score = Number.isFinite(scoreNum) ? Math.min(100, Math.max(0, Math.round(scoreNum))) : 0;

  const reasons = (Array.isArray(json.reasons) ? json.reasons : [])
    .slice(0, 20)
    .map((r) => safeText(r, 300))
    .filter(Boolean);

  return { verdict, ruleId: ruleRaw, score, severity: safeText(json.severity || 'none', 20), reasons };
}

async function scanOnce(apiUrl, apiPath, apiKey, target, timeoutMs, requestId) {
  const url = `${apiUrl.replace(/\/+$/, '')}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Request-ID': requestId,
        'User-Agent': `teos-github-action/${VERSION}`,
      },
      body: JSON.stringify(buildPayload(target)),
      signal: controller.signal,
    });

    let json = {};
    try {
      json = await res.json();
    } catch (_) {
      json = { error: `non-json_response`, message: `HTTP ${res.status}` };
    }

    return { httpStatus: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

// One retry (with backoff) on network errors and 502/503/504, so a transient
// cold start does not block a pipeline. Security-relevant answers (2xx/4xx)
// are never retried. The retry never weakens fail-closed behaviour.
async function scan(apiUrl, apiPath, apiKey, target, timeoutMs) {
  const delayRaw = Number(process.env['TEOS_RETRY_DELAY_MS'] ?? 1500);
  const retryDelay = Number.isFinite(delayRaw) ? Math.min(5000, Math.max(0, delayRaw)) : 1500;
  // One id for both attempts so the backend can de-duplicate a retried request.
  const requestId = crypto.randomUUID().slice(0, 16);
  let firstError = null;
  try {
    const first = await scanOnce(apiUrl, apiPath, apiKey, target, timeoutMs, requestId);
    if (!BACKEND_DOWN_STATUSES.has(first.httpStatus)) return first;
    firstError = new Error(`HTTP ${first.httpStatus}`);
  } catch (err) {
    firstError = err;
  }
  log(`Scan API did not answer (${firstError.name === 'AbortError' ? 'timeout' : firstError.message}); retrying once in ${retryDelay}ms.`);
  await sleep(retryDelay + Math.floor(Math.random() * 250));
  return scanOnce(apiUrl, apiPath, apiKey, target, timeoutMs, requestId);
}

// Called when the scan could not be performed because the backend is down.
function handleBackendUnavailable(reason, failOpen) {
  fail(`Scan API unavailable: ${reason}`);

  const protectedRef = process.env['GITHUB_REF_PROTECTED'] === 'true';
  if (failOpen && protectedRef) {
    annotate('error', 'TEOS FAIL-OPEN REFUSED',
      'fail-open is ignored on protected branches. The scan could not run, so this step is failing closed.');
    fail('fail-open is not honoured on protected refs — failing closed.');
    process.exit(1);
  }

  if (failOpen) {
    setOutput('verdict', 'UNVERIFIED');
    annotate('error', 'TEOS FAIL-OPEN ACTIVE — SCAN NOT PERFORMED',
      `The scan API was unavailable (${reason}) and fail-open is enabled, so this step passed WITHOUT a security verdict.`);
    appendSummary([
      `### ⚠️ TEOS Sentinel Shield — scan NOT performed (fail-open)`,
      ``,
      `The scan API was unavailable (${reason}). This step passed **without** a security verdict.`,
      `Do not use \`fail-open\` on protected branches.`,
      ``,
    ]);
    fail('fail-open=true — allowing the run WITHOUT a verdict (not recommended).');
    process.exit(0);
  }

  fail('Defaulting to BLOCK — fail-secure policy.');
  process.exit(1);
}

async function main() {
  const apiKey    = readInput('API-KEY', '');
  const target    = readInput('SCAN-TARGET', '.');
  const apiUrl    = readInput('API-URL', DEFAULT_API_URL);
  const apiPath   = readInput('API-PATH', '/scan');
  const failOpen  = readInput('FAIL-OPEN', 'false').toLowerCase() === 'true';
  const timeoutMs = clampTimeoutSeconds(readInput('TIMEOUT-SECONDS', String(DEFAULT_TIMEOUT_S))) * 1000;

  if (!apiKey) {
    fail('No API key provided. Set the required "api-key" input.');
    process.exit(1);
  }

  if (!target.trim()) {
    fail('Empty scan-target. Provide a command, file, script, or directory to inspect.');
    process.exit(1);
  }

  const urlProblem = validateApiUrl(apiUrl) || validateApiPath(apiPath);
  if (urlProblem) {
    fail(`Refusing to send scan payload: ${urlProblem}`);
    process.exit(1);
  }

  const secretKind = findSecretLike(target, apiKey);
  if (secretKind) {
    fail(`Refusing to send scan-target: it appears to contain a secret (${secretKind}).`);
    fail('scan-target is transmitted to the scan API. Do not interpolate secrets into it.');
    annotate('error', 'TEOS SECRET GUARD', `scan-target looks like it contains a secret (${secretKind}); nothing was sent.`);
    process.exit(1);
  }

  log(`Scanning "${target}" against ${apiUrl}${apiPath}`);

  let response;
  try {
    response = await scan(apiUrl, apiPath, apiKey, target, timeoutMs);
  } catch (err) {
    handleBackendUnavailable(err.name === 'AbortError' ? 'request timed out' : err.message, failOpen);
  }

  const { httpStatus, json } = response;

  if (BACKEND_DOWN_STATUSES.has(httpStatus)) {
    handleBackendUnavailable(`HTTP ${httpStatus} from ${apiUrl}`, failOpen);
  }

  if (httpStatus === 401 || httpStatus === 403) {
    fail(`Authentication failed (HTTP ${httpStatus}): ${json.message || json.error || 'check the api-key input.'}`);
    process.exit(1);
  }

  if (httpStatus === 429) {
    const isQuota = (json.error || '').includes('day')
      || /(day|quota)/i.test(String(json.message || ''));
    if (isQuota) {
      fail(`Daily request limit reached (HTTP 429): ${json.message || 'daily request quota exceeded.'}`);
      fail('Free tier allows 100 requests/day; upgrade your plan for higher limits.');
    } else {
      fail(`Rate limited (HTTP 429): ${json.message || 'request quota exceeded.'} - retry shortly.`);
    }
    process.exit(1);
  }

  if (httpStatus < 200 || httpStatus >= 300) {
    fail(`Scan API error (HTTP ${httpStatus}): ${json.message || json.error || 'unexpected response.'}`);
    process.exit(1);
  }

  const result = extractResult(json);

  if (result.verdict === 'BLOCK') {
    setOutput('verdict', result.verdict);
    setOutput('risk-score', result.score);
    setOutput('rule-id', result.ruleId);
    fail(`BLOCK — execution denied.`);
    fail(`  Rule:   ${result.ruleId}`);
    fail(`  Score:  ${result.score}/100`);
    fail(`  Target: ${target}`);
    for (const reason of result.reasons) fail(`    • ${reason}`);
    appendSummary([
      `### 🛑 TEOS Sentinel Shield — BLOCK`,
      ``,
      `| Field | Value |`,
      `| --- | --- |`,
      `| Rule | \`${result.ruleId}\` |`,
      `| Score | ${result.score}/100 |`,
      `| Target | \`${target}\` |`,
      ``,
    ]);
    process.exit(1);
  }

  if (result.verdict === 'ERROR') {
    setOutput('verdict', result.verdict);
    fail(`ERROR from engine — treated as BLOCK (fail-secure).`);
    fail(`  Rule:   ${result.ruleId}`);
    for (const reason of result.reasons) fail(`    • ${reason}`);
    process.exit(1);
  }

  if (result.verdict === 'WARN') {
    setOutput('verdict', result.verdict);
    setOutput('risk-score', result.score);
    setOutput('rule-id', result.ruleId);
    log(`WARN — risk detected, proceeding.`);
    log(`  Rule:   ${result.ruleId}`);
    log(`  Score:  ${result.score}/100`);
    for (const reason of result.reasons) log(`    • ${reason}`);
    annotate('warning', `TEOS WARN ${result.ruleId}`, `Score ${result.score}/100 | ${result.reasons.join('; ')}`);
    process.exit(0);
  }

  if (result.verdict === 'REVIEW') {
    setOutput('verdict', result.verdict);
    setOutput('risk-score', result.score);
    setOutput('rule-id', result.ruleId);
    log(`REVIEW — human review recommended, proceeding.`);
    log(`  Rule:   ${result.ruleId}`);
    log(`  Score:  ${result.score}/100`);
    for (const reason of result.reasons) log(`    • ${reason}`);
    annotate('notice', `TEOS REVIEW ${result.ruleId}`, `Score ${result.score}/100 | ${result.reasons.join('; ')}`);
    process.exit(0);
  }

  if (result.verdict === 'ALLOW') {
    setOutput('verdict', result.verdict);
    setOutput('risk-score', result.score);
    setOutput('rule-id', result.ruleId);
    log(`ALLOW — execution cleared.`);
    process.exit(0);
  }

  // Unknown verdict — fail closed.
  setOutput('verdict', result.verdict);
  fail(`Unknown verdict "${result.verdict}" — failing closed.`);
  process.exit(1);
}

main().catch((err) => {
  fail(`Unexpected error: ${err && err.stack ? err.stack : String(err)}`);
  process.exit(1);
});
module.exports = __webpack_exports__;
/******/ })()
;