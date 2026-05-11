#!/usr/bin/env node

const https = require('https');
const http  = require('http');
const { spawn } = require('child_process');
const crypto    = require('crypto');
const fs        = require('fs');
const path      = require('path');

const API_URL  = process.env.TEOS_API_URL || 'https://teos-sentinel-shield.vercel.app';
const LOG_FILE = path.join(process.env.TEOS_LOG_DIR || process.cwd(), '.teos-enforcement.log');

// ── HELPERS ──────────────────────────────────────────────────

function postJSON(url, body, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);

    const req = lib.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Request-ID': crypto.randomUUID().slice(0, 16),
      },
      timeout,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${res.statusCode}`));
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
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(LOG_FILE, line, 'utf8');
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

// ── CLI ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] !== 'run') {
    console.log('TEOS Sentinel Shield v2.1 — Deterministic Execution Control');
    console.log('');
    console.log('Usage:');
    console.log('  teos run <command>    Gate execution through enforcement engine');
    console.log('');
    console.log('Environment:');
    console.log('  TEOS_API_URL          Override API endpoint (default: https://teos-sentinel-shield.vercel.app)');
    console.log('  TEOS_LOG_DIR          Override log directory (default: cwd)');
    console.log('');
    console.log('Examples:');
    console.log('  teos run "npm install"');
    console.log('  teos run "rm -rf /tmp/build"');
    console.log('');
    process.exit(0);
  }

  const command = args.slice(1).join(' ');

  if (!command.trim()) {
    console.error('Error: No command provided');
    console.error('Usage: teos run <command>');
    process.exit(1);
  }

  try {
    const response = await postJSON(`${API_URL}/enforce`, {
      agentId: 'cli',
      action: command,
    });

    const hashEntry = createHashEntry(response.verdict, command, response.ruleId, response.riskScore);
    appendLog(hashEntry);

    if (response.verdict === 'BLOCK') {
      console.error(`[TEOS BLOCK] Execution denied`);
      console.error(`  Rule:    ${response.ruleId}`);
      console.error(`  Score:   ${response.riskScore}/100`);
      console.error(`  Reasons:`);
      for (const reason of response.reasons) {
        console.error(`    • ${reason}`);
      }
      console.error(`  Command: ${command}`);
      console.error(`  Hash:    ${hashEntry.hash}`);
      process.exit(1);
    }

    if (response.verdict === 'WARN') {
      console.error(`[TEOS WARN] Execution risk detected — proceeding with caution`);
      console.error(`  Rule:    ${response.ruleId}`);
      console.error(`  Score:   ${response.riskScore}/100`);
      console.error(`  Reasons:`);
      for (const reason of response.reasons) {
        console.error(`    • ${reason}`);
      }
      console.error(`  Hash:    ${hashEntry.hash}`);
    } else {
      console.error(`[TEOS ALLOW] Execution cleared`);
      console.error(`  Hash:    ${hashEntry.hash}`);
    }

    // Spawn the actual command
    const [cmd, ...cmdArgs] = command.split(' ');
    const child = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true });

    child.on('error', (err) => {
      console.error(`[TEOS] Failed to execute: ${err.message}`);
      process.exit(1);
    });

    child.on('exit', (code, signal) => {
      process.exit(code ?? (signal ? 1 : 0));
    });

  } catch (err) {
    console.error(`[TEOS] Enforcement engine unreachable: ${err.message}`);
    console.error('[TEOS] Defaulting to BLOCK — fail-secure policy');
    process.exit(1);
  }
}

main();
