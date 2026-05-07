const { app, RULES, runEngine, loadEvents } = require('../server/api');
const WebSocket = require('ws');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');

/*
  TEOS Sentinel — Unified Server (Railway / Fly.io / Local)
  
  Combines Express API + WebSocket telemetry + static file serving
  into a single process. Designed for Railway one-click deploy.

  Endpoints:
    POST /scan          run risk engine, return verdict
    GET  /stats         aggregated counters
    GET  /events        paginated event log
    GET  /audit         compliance export
    GET  /health        engine + WS status
    WS   /               live event stream
    GET  /               static index.html
*/

// ── CONFIG ──────────────────────────────────────────────────
const PORT          = parseInt(process.env.PORT) || 3000;
const WS_POLL_MS    = parseInt(process.env.WS_POLL_MS)       || 5000;
const WS_HEARTBEAT  = parseInt(process.env.WS_HEARTBEAT_MS)  || 30000;
const MAX_WS_PEERS  = parseInt(process.env.MAX_WS_PEERS)     || 100;
const PUBLIC_DIR    = path.join(__dirname, '..', 'public');
const NODE_ENV      = process.env.NODE_ENV || 'production';

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
};

function serveStatic(req, res) {
  let filePath = req.url.split('?')[0];
  if (filePath === '/' || filePath === '/index.html') {
    filePath = '/index.html';
  }

  const fullPath = path.join(PUBLIC_DIR, filePath);
  const ext      = path.extname(fullPath).toLowerCase();
  const mime     = MIME_TYPES[ext] || 'application/octet-stream';

  // Security: prevent directory traversal
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // Try serving index.html for SPA routes
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
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': cacheControl,
    });
    res.end(data);
  });
}

// ── HTTP SERVER ─────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // Let Express handle API routes
  if (req.url.startsWith('/scan') || req.url.startsWith('/stats') ||
      req.url.startsWith('/events') || req.url.startsWith('/audit') ||
      req.url.startsWith('/health')) {
    app(req, res);
    return;
  }

  // Root API info
  if (req.url === '/' && req.method === 'GET' && req.headers.accept?.includes('json')) {
    app(req, res);
    return;
  }

  // Static files
  serveStatic(req, res);
});

// ── WEBSOCKET SERVER ────────────────────────────────────────
const wss = new WebSocket.Server({ server });
let lastEventCount = 0;
let peers          = new Map();
let totalConns     = 0;
let totalDisc      = 0;
let bootTime       = Date.now();

// Global hook: Express scans notify WS server
global.emitScanEvent = function(result) {
  if (peers.size === 0) return;
  const payload = JSON.stringify({
    type:    'scan',
    verdict: result.verdict.toLowerCase(),
    score:   result.score,
    rule:    result.rule,
    ruleId:  result.ruleId,
    severity:result.severity,
    command: result.command,
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

  const peerId = ++totalConns;
  peers.set(ws, { id: peerId, connectedAt: Date.now() });
  ws.isAlive = true;

  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
    } catch (_) {}
  });
  ws.on('close', () => { peers.delete(ws); totalDisc++; });

  // Send snapshot
  try {
    const events = loadEvents();
    lastEventCount = events.length;
    ws.send(JSON.stringify({
      type:      'snapshot',
      count:     events.length,
      events:    events.slice(-50),
      serverTime: new Date().toISOString(),
    }));
  } catch (_) {}
});

// ── POLLING ─────────────────────────────────────────────────
async function pollEvents() {
  try {
    const events = loadEvents();
    if (events.length > lastEventCount) {
      const newCount = events.length - lastEventCount;
      lastEventCount = events.length;
      const tail = events.slice(-Math.min(newCount + 10, 50));
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
  } catch (_) {}
}

function heartbeatCheck() {
  for (const [ws, meta] of peers) {
    if (!ws.isAlive) { ws.terminate(); peers.delete(ws); totalDisc++; continue; }
    ws.isAlive = false;
    ws.ping();
  }
}

setInterval(pollEvents,    WS_POLL_MS);
setInterval(heartbeatCheck, WS_HEARTBEAT);

// ── ENHANCED /health (includes WS stats) ────────────────────
const origHealth = server; // just intercept via the Express app

// ── START ───────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({
    ts:      new Date().toISOString(),
    level:   'info',
    msg:     'TEOS Sentinel v2.0 started',
    port:    PORT,
    env:     NODE_ENV,
    mode:    'unified (Express + WS + Static)',
    rules:   RULES.length,
    maxPeers: MAX_WS_PEERS,
  }));
});

module.exports = { server, wss };
