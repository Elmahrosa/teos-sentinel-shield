#!/usr/bin/env node
'use strict';

/**
 * Point every hard-coded backend host at a new endpoint, in one command.
 *
 *   node scripts/set-endpoint.js https://your-app.up.railway.app
 *
 * Updates:
 *   - src/action.js     DEFAULT_API_URL   (rebuild dist/ afterwards!)
 *   - action.yml        api-url default
 *   - public/config.js  RAILWAY_WS        (https -> wss)
 *   - public/proxy.php  $BACKEND
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const arg = process.argv[2];

if (!arg) {
  console.error('Usage: node scripts/set-endpoint.js https://your-app.up.railway.app');
  process.exit(1);
}

let url;
try {
  url = new URL(arg);
} catch {
  console.error(`Invalid URL: ${arg}`);
  process.exit(1);
}
if (!/^https?:$/.test(url.protocol)) {
  console.error('URL must be http(s).');
  process.exit(1);
}

const base = `${url.protocol}//${url.host}`;
const ws = base.replace(/^http/, 'ws');

function patch(rel, label, re, replacement) {
  const p = path.join(root, rel);
  const src = fs.readFileSync(p, 'utf8');
  if (!re.test(src)) {
    console.error(`  x ${label}: pattern not found in ${rel}`);
    return false;
  }
  fs.writeFileSync(p, src.replace(re, replacement));
  console.log(`  ok ${label} -> ${rel}`);
  return true;
}

console.log(`Setting endpoint to ${base}\n`);

const all = [
  patch('src/action.js', 'DEFAULT_API_URL', /const DEFAULT_API_URL = '[^']*';/, `const DEFAULT_API_URL = '${base}';`),
  patch('action.yml', 'api-url default', /(^  api-url:[\s\S]*?\n    default: ')[^']*(')/m, `$1${base}$2`),
  patch('public/config.js', 'RAILWAY_WS', /var RAILWAY_WS = '[^']*';/, `var RAILWAY_WS = '${ws}';`),
  patch('public/proxy.php', '$BACKEND', /\$BACKEND = '[^']*';/, `$BACKEND = '${base}';`),
].every(Boolean);

if (!all) {
  console.error('\nOne or more files were not updated. Nothing else was changed.');
  process.exit(1);
}

console.log('\nDone. Now rebuild the bundled action:');
console.log('  npx --yes @vercel/ncc@0.38.3 build src/action.js -o dist\n');
