#!/usr/bin/env node

const https = require('https');
const http  = require('http');
const { spawn } = require('child_process');
const crypto    = require('crypto');
const fs        = require('fs');
const path      = require('path');

const VERSION  = '5.0.0';
const API_URL  = process.env.TEOS_API_URL || 'https://sentinel.teosegypt.com';
const API_KEY  = process.env.TEOS_API_KEY || process.env.X_API_KEY || '';
const LOG_FILE = path.join(process.env.TEOS_LOG_DIR || process.cwd(), '.teos-enforcement.log');
const FAIL_OPEN = process.env.TEOS_FAIL_OPEN === '1'; // default fail-closed

// ── HELPERS ──────────────────────────────────────────────────

function postJSON(url, body, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'X-Request-ID': crypto.randomUUID().slice(0, 16),
      'User-Agent': `teos-cli/${VERSION}`,
    };
    if (API_KEY) headers['X-API-Key'] = API_KEY;

    const req = (url.startsWith('https') ? https : http).request(url, {
      method: 'POST',
      headers,
      timeout,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          parsed._status = res.statusCode;
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Invalid JSON response: HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeout}ms`));
    });

    req.write(payload);
    req.end();
  });
}

function appendLog(entry) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch (_) { /* non-fatal */ }
}

function createHashEntry(verdict, command, ruleId, score) {
  const id = Date.now();
  const hashInput = `${id}-${Date.now()}-${verdict}-${ruleId}`;
  return {
    id,
    timestamp: new Date().toISOString(),
    verdict,
    command,
    ruleId,
    score,
    hash: crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 16),
  };
}

function printHelp() {
  console.log(`TEOS Sentinel Shield v${VERSION} — Deterministic Execution Control`);
  console.log('');
  console.log('Usage:');
  console.log('  teos run <command>    Gate execution through enforcement engine');
  console.log('');
  console.log('Environment:');
  console.log('  TEOS_API_URL          API base (default: https://sentinel.teosegypt.com)');
  console.log('  TEOS_API_KEY          X-API-Key for /enforce (required in production)');
  console.log('  TEOS_LOG_DIR          Log directory (default: cwd)');
  console.log('  TEOS_FAIL_OPEN=1      Allow execution if engine unreachable (default: fail-closed)');
  console.log('');
  console.log('Examples:');
  console.log('  teos run "npm install"');
  console.log('  teos run "rm -rf /tmp/build"');
  console.log('');
}

// ── CLI ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] !== 'run') {
    printHelp();
    process.exit(0);
  }

  // Preserve command as a single string; pass to shell as one argument list via shell:false where possible
  const command = args.slice(1).join(' ');

  if (!command.trim()) {
    console.error('Error: No command provided');
    console.error('Usage: teos run <command>');
    process.exit(1);
  }

  if (!API_KEY) {
    console.error('[TEOS] Warning: TEOS_API_KEY not set — /enforce will return 401 on protected servers');
  }

  try {
    const response = await postJSON(`${API_URL.replace(/\/$/, '')}/enforce`, {
      agentId: 'cli',
      action: command,
    });

    if (response._status === 401 || response._status === 403) {
      console.error(`[TEOS] Auth failed (${response._status}): ${response.message || response.error || 'check TEOS_API_KEY'}`);
      process.exit(1);
    }

    const verdict = response.verdict || 'BLOCK';
    const ruleId = response.ruleId || response.rule || 'R00';
    const score = response.riskScore ?? response.score ?? 0;
    const reasons = Array.isArray(response.reasons) ? response.reasons : [];

    const hashEntry = createHashEntry(verdict, command, ruleId, score);
    appendLog(hashEntry);

    if (verdict === 'BLOCK') {
      console.error(`[TEOS BLOCK] Execution denied`);
      console.error(`  Rule:    ${ruleId}`);
      console.error(`  Score:   ${score}/100`);
      console.error(`  Reasons:`);
      for (const reason of reasons) {
        console.error(`    • ${reason}`);
      }
      console.error(`  Command: ${command}`);
      console.error(`  Hash:    ${hashEntry.hash}`);
      process.exit(1);
    }

    if (verdict === 'WARN') {
      console.error(`[TEOS WARN] Execution risk detected — proceeding with caution`);
      console.error(`  Rule:    ${ruleId}`);
      console.error(`  Score:   ${score}/100`);
      console.error(`  Reasons:`);
      for (const reason of reasons) {
        console.error(`    • ${reason}`);
      }
      console.error(`  Hash:    ${hashEntry.hash}`);
    } else {
      console.error(`[TEOS ALLOW] Execution cleared`);
      console.error(`  Hash:    ${hashEntry.hash}`);
    }

    // Execute: use shell so quoted multi-arg commands work; command already gated by engine
    const child = spawn(command, {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });

    child.on('error', (err) => {
      console.error(`[TEOS] Failed to execute: ${err.message}`);
      process.exit(1);
    });

    child.on('exit', (code, signal) => {
      process.exit(code ?? (signal ? 1 : 0));
    });

  } catch (err) {
    console.error(`[TEOS] Enforcement engine unreachable: ${err.message}`);
    if (FAIL_OPEN) {
      console.error('[TEOS] TEOS_FAIL_OPEN=1 — allowing execution (not recommended)');
      const child = spawn(command, { stdio: 'inherit', shell: true, env: process.env });
      child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
      child.on('error', (e) => { console.error(e.message); process.exit(1); });
      return;
    }
    console.error('[TEOS] Defaulting to BLOCK — fail-secure policy');
    process.exit(1);
  }
}

main();
