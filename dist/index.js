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

const VERSION = '5.1.0';

const DEFAULT_API_URL = 'https://teos-sentinel-shield-production-7f0d.up.railway.app';

function readInput(name, fallback) {
  const value = process.env[`INPUT_${name}`];
  return value === undefined || value === null ? fallback : value;
}

function log(msg) {
  console.log(`[TEOS] ${msg}`);
}

function fail(msg) {
  console.error(`[TEOS] ${msg}`);
}

function setOutput(name, value) {
  const file = process.env['GITHUB_OUTPUT'];
  if (!file) return;
  try {
    fs.appendFileSync(file, `${name}=${String(value)}\n`, 'utf8');
  } catch (_) { /* non-fatal */ }
}

function annotate(level, title, detail) {
  const clean = String(detail || '')
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
  if (process.env['GITHUB_ACTIONS']) {
    console.log(`::${level} title=${String(title).replace(/%/g, '%25')}::${clean}`);
  }
}

function appendSummary(lines) {
  const file = process.env['GITHUB_STEP_SUMMARY'];
  if (!file) return;
  try {
    fs.appendFileSync(file, lines.join('\n') + '\n', 'utf8');
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

function extractResult(json) {
  if (!json || typeof json !== 'object') {
    return { verdict: 'BLOCK', ruleId: 'R00', score: 0, severity: 'none', reasons: ['Empty or invalid response from scan API'] };
  }

  const verdictRaw = json.verdict || json.decision || json.result || json.risk?.verdict || json.status;
  const verdict = String(verdictRaw || 'BLOCK').toUpperCase();

  return {
    verdict,
    ruleId: json.ruleId || json.rule || json.highestRule || 'R00',
    score:  json.riskScore ?? json.score ?? 0,
    severity: json.severity || 'none',
    reasons: Array.isArray(json.reasons) ? json.reasons : [],
  };
}

async function scan(apiUrl, apiPath, apiKey, target) {
  const url = `${apiUrl.replace(/\/+$/, '')}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Request-ID': crypto.randomUUID().slice(0, 16),
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

async function main() {
  const apiKey    = readInput('API-KEY', '');
  const target    = readInput('SCAN-TARGET', '.');
  const apiUrl    = readInput('API-URL', DEFAULT_API_URL);
  const apiPath   = readInput('API-PATH', '/scan');
  const failOpen  = readInput('FAIL-OPEN', 'false').toLowerCase() === 'true';

  if (!apiKey) {
    fail('No API key provided. Set the required "api-key" input.');
    process.exit(1);
  }

  if (!target.trim()) {
    fail('Empty scan-target. Provide a command, file, script, or directory to inspect.');
    process.exit(1);
  }

  log(`Scanning "${target}" against ${apiUrl}${apiPath}`);

  let response;
  try {
    response = await scan(apiUrl, apiPath, apiKey, target);
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'request timed out' : err.message;
    fail(`Scan API unreachable: ${reason}`);
    if (failOpen) {
      fail('TEOS_FAIL_OPEN=true — allowing the run (not recommended).');
      process.exit(0);
    }
    fail('Defaulting to BLOCK — fail-secure policy.');
    process.exit(1);
  }

  const { httpStatus, json } = response;

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