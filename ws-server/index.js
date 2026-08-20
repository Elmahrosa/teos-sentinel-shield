const api          = require('../server/api');
const app          = api;
const runEngine    = api.runEngine;
const loadEventsFn = api.loadEvents; // async Redis-aware
const { getTotalRuleCount } = require('../lib/ruleRegistry');
const WebSocket    = require('ws');
const http         = require('http');
const path         = require('path');
const fs           = require('fs');

/*
  TEOS Sentinel Shield v5.0.0 — Unified Server (Railway / Fly.io / Local)
  Express API + WebSocket telemetry + static file serving in one process.

  All /api surface is delegated to Express (no path whitelist gaps).
  Static assets served from public/ for non-API GET requests.
*/

// ── CONFIG ──────────────────────────────────────────────────
const PORT          = parseInt(process.env.PORT) || 3000;
const WS_POLL_MS    = parseInt(process.env.WS_POLL_MS)       || 5000;
const WS_HEARTBEAT  = parseInt(process.env.WS_HEARTBEAT_MS)  || 30000;
const MAX_WS_PEERS  = parseInt(process.env.MAX_WS_PEERS)     || 100;
const PUBLIC_DIR    = path.resolve(path.join(__dirname, '..', 'public'));
const NODE_ENV      = process.env.NODE_ENV || 'production';
const VERSION       = api.VERSION || '4.0.0';

// API prefixes handled by Express (everything else may be static)
const API_PREFIXES = [
  '/scan', '/stats', '/events', '/audit', '/health', '/enforce',
  '/ledger', '/metrics', '/webhook', '/billing', '/openapi',
];

function isApiRequest(urlPath) {
  if (urlPath === '/') return false; // static landing; Express root is Accept: json only
  return API_PREFIXES.some(p => urlPath === p || urlPath.startsWith(p + '/') || urlPath.startsWith(p + '?'));
}

// ── STATIC FILE SERVER ──────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain',
  '.yaml': 'text/yaml',
  '.yml':  'text/yaml',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
};

function serveStatic(req, res) {
  let filePath = req.url.split('?')[0];
  if (filePath === '/' || filePath === '/index.html') {
    filePath = '/index.html';
  }

  // OpenAPI spec from docs/
  if (filePath === '/openapi-spec.yaml' || filePath === '/openapi.yaml') {
    const specPath = path.resolve(path.join(__dirname, '..', 'docs', 'openapi-spec.yaml'));
    return fs.readFile(specPath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/yaml; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
      res.end(data);
    });
  }

  const fullPath = path.resolve(path.join(PUBLIC_DIR, filePath));
  const ext      = path.extname(fullPath).toLowerCase();
  const mime     = MIME_TYPES[ext] || 'application/octet-stream';

  // Path traversal guard (resolve + prefix check)
  if (!fullPath.startsWith(PUBLIC_DIR + path.sep) && fullPath !== PUBLIC_DIR) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (filePath !== '/index.html') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, html) => {
          if (err2) { res.writeHead(404); res.end('Not found'); return; }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
        });
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const cacheControl = NODE_ENV === 'production' ? 'public, max-age=3600' : 'no-cache';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cacheControl });
    res.end(data);
  });
}

// ── HTTP SERVER ─────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  // JSON root → Express service metadata
  if (urlPath === '/' && req.method === 'GET' && req.headers.accept && req.headers.accept.includes('json')) {
    app(req, res);
    return;
  }

  // All API routes → Express
  if (isApiRequest(urlPath)) {
    app(req, res);
    return;
  }

  // Static for GET/HEAD; 404 for other methods on non-API paths
  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
    return;
  }

  // POST/PUT etc. on unknown paths still try Express (future routes)
  app(req, res);
});

// ── WEBSOCKET SERVER ────────────────────────────────────────
const wss = new WebSocket.Server({ server });
let lastEventCount = 0;
let peers          = new Map();
let totalConns     = 0;
let totalDisc      = 0;

// Global hook: Express scans notify WS server
global.emitScanEvent = function(result) {
  if (peers.size === 0) return;
  const payload = JSON.stringify({
    type:      'scan',
    verdict:   (result.verdict || '').toLowerCase(),
    score:     result.score,
    rule:      result.rule,
    ruleId:    result.ruleId,
    severity:  result.severity,
    // Do not broadcast full command text over open WS
    command:   result.command ? String(result.command).slice(0, 120) : undefined,
    timestamp: result.timestamp,
  });
  for (const ws of peers.keys()) {
    if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 512 * 1024) {
      ws.send(payload);
    }
  }
};

wss.on('connection', (ws, req) => {
  if (peers.size >= MAX_WS_PEERS) {
    ws.close(1013, 'Max connections reached');
    return;
  }

  // Optional WS auth: if TEOS_WS_REQUIRE_AUTH=1, require ?apiKey= or Sec-WebSocket-Protocol
  if (process.env.TEOS_WS_REQUIRE_AUTH === '1') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const key = url.searchParams.get('apiKey') || (req.headers['sec-websocket-protocol'] || '').split(',')[0].trim();
    if (!key) {
      ws.close(1008, 'API key required');
      return;
    }
  }

  const peerId = ++totalConns;
  peers.set(ws, { id: peerId, connectedAt: Date.now() });
  ws.isAlive = true;

  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('error', (err) => {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', msg: 'ws error', peerId, err: err.message }));
    peers.delete(ws);
  });
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
    } catch (_) { /* ignore non-JSON */ }
  });
  ws.on('close', () => { peers.delete(ws); totalDisc++; });

  // Send snapshot from Redis (async loadEvents)
  Promise.resolve(loadEventsFn())
    .then(events => {
      const list = Array.isArray(events) ? events : [];
      lastEventCount = list.length;
      if (ws.readyState === WebSocket.OPEN) {
        // Redact command bodies in snapshot for unauthenticated WS peers
        const safe = list.slice(-50).map(e => ({
          ...e,
          command: e.command ? String(e.command).slice(0, 120) : e.command,
        }));
        ws.send(JSON.stringify({
          type:       'snapshot',
          count:      list.length,
          events:     safe,
          serverTime: new Date().toISOString(),
          version:    VERSION,
        }));
      }
    })
    .catch((err) => {
      console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'warn', msg: 'ws snapshot failed', err: err.message }));
    });
});

// ── POLLING (syncs with Redis via shared loadEvents) ────────
async function pollEvents() {
  try {
    const events = await loadEventsFn();
    const list = Array.isArray(events) ? events : [];
    if (list.length > lastEventCount) {
      const newCount = list.length - lastEventCount;
      lastEventCount = list.length;
      const tail = list.slice(-Math.min(newCount + 10, 50)).map(e => ({
        ...e,
        command: e.command ? String(e.command).slice(0, 120) : e.command,
      }));
      const payload = JSON.stringify({
        type:   'events',
        count:  tail.length,
        events: tail,
        time:   new Date().toISOString(),
      });
      for (const ws of peers.keys()) {
        if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 1024 * 1024) {
          ws.send(payload);
        }
      }
    }
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'warn', msg: 'ws poll failed', err: err.message }));
  }
}

function heartbeatCheck() {
  for (const [ws] of peers) {
    if (!ws.isAlive) { ws.terminate(); peers.delete(ws); totalDisc++; continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch (_) { ws.terminate(); peers.delete(ws); totalDisc++; }
  }
}

setInterval(pollEvents,     WS_POLL_MS);
setInterval(heartbeatCheck, WS_HEARTBEAT);

// ── START ───────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'fatal', msg: 'uncaughtException', err: err.message, stack: err.stack }));
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', msg: 'unhandledRejection', reason: String(reason) }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({
    ts:      new Date().toISOString(),
    level:   'info',
    msg:     'TEOS Sentinel unified server started',
    version: VERSION,
    port:    PORT,
    rules:   getTotalRuleCount(),
    env:     NODE_ENV,
    ws:      true,
    bind:    '0.0.0.0',
  }));
});

module.exports = { server, wss, runEngine };
