#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.TEOS_API_URL || 'https://sentinel.teosegypt.com';
const API_KEY = process.env.TEOS_API_KEY || '';

function postJSON(url, body, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) };
    if (API_KEY) headers['X-API-Key'] = API_KEY;
    const req = lib.request(url, { method: 'POST', headers, timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Invalid JSON (${res.statusCode}): ${data.slice(0,200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout after ${timeout}ms`)); });
    req.write(payload);
    req.end();
  });
}

function collectFiles(target) {
  const files = [];
  const stat = fs.statSync(target);
  if (stat.isFile()) { return [target]; }
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (!entry.name.startsWith('.') && entry.name !== 'node_modules') walk(p); }
      else if (/\.(js|ts|jsx|tsx|py|rs|go|sh|bash|yaml|yml|json|tf|cjs|mjs)$/.test(entry.name)) files.push(p);
    }
  }
  walk(target);
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--json') ? 'json' : 'text';
  const target = args.find(a => !a.startsWith('--')) || '.';

  if (!fs.existsSync(target)) {
    console.error(`Error: path "${target}" does not exist`);
    process.exit(1);
  }

  const files = collectFiles(target);
  if (files.length === 0) {
    if (mode === 'json') console.log(JSON.stringify({ verdict: 'ALLOW', score: 0, filesScanned: 0 }));
    else console.log('No scanable files found — ALLOW');
    process.exit(0);
  }

  let totalScore = 0;
  let maxVerdict = 'ALLOW';
  const findings = [];

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    try {
      const res = await postJSON(`${API_URL}/scan`, { command: code, type: 'file' });
      if (res.verdict) {
        const ord = { BLOCK: 3, WARN: 2, REVIEW: 1, ALLOW: 0 };
        if (ord[res.verdict] > ord[maxVerdict]) maxVerdict = res.verdict;
        if (res.score > totalScore) totalScore = res.score;
        if (res.verdict !== 'ALLOW') {
          findings.push({ file, verdict: res.verdict, score: res.score, reasons: res.reasons || [] });
        }
      }
    } catch (e) {
      if (mode === 'json') findings.push({ file, error: e.message });
      else console.error(`  [!] ${file}: API error — ${e.message}`);
    }
  }

  if (mode === 'json') {
    console.log(JSON.stringify({ verdict: maxVerdict, score: totalScore, filesScanned: files.length, findings }, null, 2));
  } else {
    console.log(`\nTEOS Sentinel CI Scan`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Files scanned: ${files.length}`);
    for (const f of findings) {
      const badge = f.verdict === 'BLOCK' ? '\u{1F6D1}' : f.verdict === 'WARN' ? '\u26A0\uFE0F' : '\u2705';
      console.log(`  ${badge} ${f.file} — ${f.verdict} (${f.score}/100)`);
      for (const r of f.reasons) console.log(`       ${r}`);
    }
    console.log(`${'='.repeat(50)}`);
    console.log(`Verdict: ${maxVerdict} | Max score: ${totalScore}/100\n`);
  }

  if (maxVerdict === 'BLOCK') process.exit(2);
  if (maxVerdict === 'WARN') process.exit(1);
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
