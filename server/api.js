/*
  TEOS Sentinel v2.0 — Hardened API Engine
  Deployment: Vercel serverless (primary) + Railway (via ws-server)
  Data store: Upstash Redis (serverless) or in-memory fallback

  Hardening layers:
    1. Structured JSON logging with request IDs
    2. In-memory rate limiting per IP
    3. Input validation + sanitization
    4. Payload size limits
    5. Security headers
    6. Request timing metrics
    7. Graceful error handling
*/

const express = require('express');
const crypto  = require('crypto');
const fs      = require('fs');
const path    = require('path');
const app     = express();

// ── CONFIG ──────────────────────────────────────────────────
const PORT            = process.env.PORT || 3000;
const MAX_EVENTS      = parseInt(process.env.MAX_EVENTS)        || 500;
const RATE_LIMIT_WIN  = parseInt(process.env.RATE_LIMIT_WIN)    || 60;
const RATE_LIMIT_MAX  = parseInt(process.env.RATE_LIMIT_MAX)    || 120;
const MAX_PAYLOAD_KB  = parseInt(process.env.MAX_PAYLOAD_KB)    || 64;
const NODE_ENV        = process.env.NODE_ENV                    || 'development';
const BOOT_TIME       = Date.now();
const REDIS_KEY       = 'teos:sentinel:events';

// ── REDIS (Upstash) — shared store across bot + API + WS ────
let redis = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('[teos] Upstash Redis connected');
  }
} catch (e) {
  console.warn('[teos] Redis init failed, falling back to memory:', e.message);
}

// ── STRUCTURED LOGGER ───────────────────────────────────────
function log(level, msg, meta = {}) {
  const entry = {
    ts:   new Date().toISOString(),
    level,
    msg,
    env:  NODE_ENV,
    pid:  process.pid,
    ...meta,
  };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

// ── SECURITY MIDDLEWARE ─────────────────────────────────────
app.use(express.json({ limit: MAX_PAYLOAD_KB + 'kb' }));
app.use(express.urlencoded({ extended: false, limit: MAX_PAYLOAD_KB + 'kb' }));

// Security headers on every response
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options',    'nosniff');
  res.setHeader('X-Frame-Options',           'DENY');
  res.setHeader('X-XSS-Protection',          '0');
  res.setHeader('Cache-Control',             'no-store, no-cache, must-revalidate');
  res.setHeader('X-Request-ID',             req.id || crypto.randomUUID());
  next();
});

// CORS
app.use((req, res, next) => {
  const allowed = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin',  allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Request ID + timing
app.use((req, res, next) => {
  req.id   = req.headers['x-request-id'] || crypto.randomUUID().slice(0, 16);
  req._t0  = process.hrtime.bigint();
  res.on('finish', () => {
    const elapsed = Number(process.hrtime.bigint() - req._t0) / 1e6;
    log('info', `${req.method} ${req.path}`, {
      reqId:    req.id,
      status:   res.statusCode,
      duration: Math.round(elapsed),
      ip:       req.ip || req.socket.remoteAddress,
      ua:       req.headers['user-agent']?.slice(0, 120) || '-',
    });
  });
  next();
});

// ── RATE LIMITER (in-memory, per-IP) ────────────────────────
const rateStore = new Map();

function rateLimiter(req, res, next) {
  if (NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT) return next();

  const ip   = req.ip || req.socket.remoteAddress || 'unknown';
  const now  = Math.floor(Date.now() / 1000);
  const key  = `rl:${ip}`;

  let entry = rateStore.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WIN) {
    entry = { windowStart: now, count: 0 };
    rateStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset',     String(entry.windowStart + RATE_LIMIT_WIN));
    return res.status(429).json({
      error:   'rate_limit_exceeded',
      message: `Max ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WIN}s window`,
      retryAfter: entry.windowStart + RATE_LIMIT_WIN - now,
    });
  }

  res.setHeader('X-RateLimit-Remaining', String(RATE_LIMIT_MAX - entry.count));
  res.setHeader('X-RateLimit-Limit',     String(RATE_LIMIT_MAX));
  next();
}

app.use(rateLimiter);

// Rate limit cleanup
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, entry] of rateStore) {
    if (now - entry.windowStart > RATE_LIMIT_WIN * 2) rateStore.delete(key);
  }
}, 5 * 60 * 1000);

// ── DATA STORE (Redis primary, memory fallback) ─────────────
let memStore = [];

async function loadEvents() {
  if (redis) {
    try {
      const raw = await redis.lrange(REDIS_KEY, 0, MAX_EVENTS - 1);
      return raw.map(e => typeof e === 'string' ? JSON.parse(e) : e);
    } catch (e) {
      log('warn', 'Redis read failed, using memory fallback', { error: e.message });
    }
  }
  return memStore;
}

async function saveEvent(event) {
  if (redis) {
    try {
      await redis.lpush(REDIS_KEY, JSON.stringify(event));
      await redis.ltrim(REDIS_KEY, 0, MAX_EVENTS - 1);
      return;
    } catch (e) {
      log('warn', 'Redis write failed, using memory fallback', { error: e.message });
    }
  }
  memStore.unshift(event);
  if (memStore.length > MAX_EVENTS) memStore = memStore.slice(0, MAX_EVENTS);
}

// Backward-compatible sync wrappers for existing route code
function loadEventsSync() {
  return memStore;
}

function saveEventsSync(events) {
  memStore = events.slice(-MAX_EVENTS);
  return memStore;
}

// ── RISK ENGINE (25 deterministic rules) ────────────────────
const RULES = [
  { id:'R01', name:'DESTRUCTIVE_SHELL',    sev:'critical', score:100,
    test: c => /rm\s+-rf|format\s+[a-z]:|deltree/i.test(c),
    reasons: ['rm -rf permanently destroys all filesystem data','Wiper malware signature detected'] },

  { id:'R02', name:'CHMOD_ESCALATION',     sev:'critical', score:90,
    test: c => /chmod\s+[0-7]*7{2,}.*\/etc|777.*passwd/i.test(c),
    reasons: ['chmod 777 on sensitive system files escalates privileges'] },

  { id:'R03', name:'CURL_EXEC_CHAIN',      sev:'critical', score:95,
    test: c => /curl.+\|\s*(bash|sh)|wget.+\|\s*(bash|sh)/i.test(c),
    reasons: ['curl/wget piped to shell executes untrusted remote code'] },

  { id:'R04', name:'SECRET_ECHO',          sev:'critical', score:90,
    test: c => /echo\s+\$[A-Z_]*(KEY|TOKEN|SECRET|PASS|PWD)/i.test(c),
    reasons: ['Echoing secret environment variable — potential exfiltration'] },

  { id:'R05', name:'ENV_EXFIL',            sev:'critical', score:95,
    test: c => /\$[A-Z_]*(KEY|SECRET|TOKEN).*(curl|wget|http)/i.test(c),
    reasons: ['Sending environment secret to external host'] },

  { id:'R06', name:'FORK_BOMB',            sev:'critical', score:100,
    test: c => /(\:\(\)\{|:\(\))\s*\{.*:\|:/i.test(c),
    reasons: ['Fork bomb detected — denial of service pattern'] },

  { id:'R07', name:'BASE64_EXEC',          sev:'high',     score:88,
    test: c => /eval\s*\(\s*atob|base64\s+--decode.*(sh|bash|exec)/i.test(c),
    reasons: ['Base64-encoded payload executed via eval','Obfuscated execution bypass'] },

  { id:'R08', name:'REVERSE_SHELL',        sev:'critical', score:100,
    test: c => /nc\s+(-e|--exec)|bash\s+-i\s+>&\s*\/dev\/tcp/i.test(c),
    reasons: ['Reverse shell connection attempt detected'] },

  { id:'R09', name:'SQL_DESTRUCTION',      sev:'high',     score:85,
    test: c => /DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE/i.test(c),
    reasons: ['SQL DROP command permanently destroys data'] },

  { id:'R10', name:'SQL_INJECTION',        sev:'high',     score:75,
    test: c => /'\s*(OR|AND)\s+\d=\d|UNION\s+SELECT|1=1/i.test(c),
    reasons: ['Classic SQL injection pattern detected'] },

  { id:'R11', name:'PATH_TRAVERSAL',       sev:'high',     score:78,
    test: c => /(\.\.\/){2,}|%2e%2e/i.test(c),
    reasons: ['Directory traversal detected in file path'] },

  { id:'R12', name:'COMMAND_INJECTION',    sev:'critical', score:92,
    test: c => /[;&|`]\s*(ls|cat|id|whoami|uname)/i.test(c),
    reasons: ['OS command injection via user-controlled input'] },

  { id:'R13', name:'PRIVILEGE_ESCALATION', sev:'critical', score:90,
    test: c => /sudo\s+(su|bash|sh|python|perl)|chmod\s+u\+s/i.test(c),
    reasons: ['Privilege escalation via sudo or SUID abuse'] },

  { id:'R14', name:'MALICIOUS_PACKAGE',    sev:'high',     score:85,
    test: c => /event-stream@3\.3\.6|flatmap-stream|ua-parser-js@0\.7\.2[89]/i.test(c),
    reasons: ['Known malicious npm package version detected'] },

  { id:'R15', name:'TYPOSQUAT_PACKAGE',    sev:'high',     score:70,
    test: c => /require\s*\(\s*['"](\slodash|recat|expres|mongoos)['"]\s*\)/i.test(c),
    reasons: ['Typosquatted package name detected'] },

  { id:'R16', name:'UNSAFE_PERMISSIONS',   sev:'medium',   score:65,
    test: c => /permissions:\s*write-all/i.test(c),
    reasons: ['GitHub Actions write-all permissions overly broad'] },

  { id:'R17', name:'CURL_BASH_CI',         sev:'critical', score:95,
    test: c => /run:\s*curl.+\|\s*bash/i.test(c),
    reasons: ['curl|bash in CI/CD pipeline step — remote code execution risk'] },

  { id:'R18', name:'PRIVILEGED_CONTAINER', sev:'high',     score:80,
    test: c => /--privileged|securityContext:\s*privileged:\s*true/i.test(c),
    reasons: ['Privileged container flag breaks container isolation'] },

  { id:'R19', name:'HARDCODED_SECRET',     sev:'critical', score:92,
    test: c => /(api_key|apikey|secret_key|password)\s*=\s*['"][a-z0-9]{12,}['"]/i.test(c),
    reasons: ['Hardcoded secret in source code detected'] },

  { id:'R20', name:'PROMPT_INJECTION',     sev:'high',     score:80,
    test: c => /ignore previous instructions|disregard your system prompt|jailbreak/i.test(c),
    reasons: ['LLM prompt injection attempt detected'] },

  { id:'R21', name:'SSRF_ATTEMPT',         sev:'high',     score:82,
    test: c => /https?:\/\/(169\.254|10\.|192\.168|172\.(1[6-9]|2\d|3[01]))/i.test(c),
    reasons: ['SSRF attempt targeting internal/metadata IP range'] },

  { id:'R22', name:'XXE_INJECTION',        sev:'high',     score:80,
    test: c => /<!ENTITY\s+\w+\s+SYSTEM/i.test(c),
    reasons: ['XML External Entity injection pattern detected'] },

  { id:'R23', name:'CRYPTO_MINER',         sev:'critical', score:95,
    test: c => /stratum\+tcp|xmrig|minerd|ethminer/i.test(c),
    reasons: ['Cryptomining binary or pool connection detected'] },

  { id:'R24', name:'DATA_EXFIL_CURL',      sev:'high',     score:88,
    test: c => /curl.+(-d|--data).+\/etc\/(passwd|shadow|hosts)/i.test(c),
    reasons: ['Exfiltrating sensitive system files via curl'] },

  { id:'R25', name:'CI_SECRETS_DUMP',      sev:'critical', score:90,
    test: c => /printenv|env\s*\|\s*grep|\$\{\{\s*secrets\s*\}\}/i.test(c),
    reasons: ['CI secrets or environment dump detected'] },
];

function runEngine(command) {
  if (!command || typeof command !== 'string') {
    return { verdict:'ERROR', score:0, rule:'R00.CLEAN', reasons:['No command provided'] };
  }

  const cmd = command.trim();
  if (cmd.length > 10000) {
    return { verdict:'ERROR', score:0, rule:'R00.CLEAN', reasons:['Input exceeds 10KB limit'] };
  }

  let topHit = null;

  for (const rule of RULES) {
    if (rule.test(cmd)) {
      if (!topHit || rule.score > topHit.score) {
        topHit = { rule, score: rule.score };
      }
    }
  }

  if (topHit) {
    const verdict = topHit.score >= 80 ? 'BLOCK' : 'WARN';
    return {
      verdict,
      score:    topHit.score,
      rule:     `${topHit.rule.id}.${topHit.rule.name}`,
      ruleId:   topHit.rule.id,
      severity: topHit.rule.sev,
      reasons:  topHit.rule.reasons,
      command:  cmd,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    verdict:   'ALLOW',
    score:     0,
    rule:      'R00.CLEAN',
    ruleId:    'R00',
    severity:  'none',
    reasons:   ['No threat patterns detected across 25 rules','Safe to execute'],
    command:   cmd,
    timestamp: new Date().toISOString(),
  };
}

// ── ROUTES ──────────────────────────────────────────────────

// GET /health
app.get('/health', async (req, res) => {
  const uptime = process.uptime();
  let eventCount = 0;
  try {
    if (redis) {
      eventCount = await redis.llen(REDIS_KEY);
    } else {
      eventCount = memStore.length;
    }
  } catch (_) {}

  res.json({
    status:      'online',
    engine:      'v2.0',
    rules:       RULES.length,
    uptime:      Math.round(uptime),
    uptimeHuman: uptime > 3600 ? Math.floor(uptime/3600)+'h' : Math.floor(uptime/60)+'m',
    env:         NODE_ENV,
    time:        new Date().toISOString(),
    version:     '2.0.0',
    store:       redis ? 'redis' : 'memory',
    eventsCount: eventCount,
  });
});

// GET / (root)
app.get('/', (req, res) => {
  res.json({
    service: 'TEOS Sentinel Shield',
    version: 'v2.0',
    engine:  'deterministic',
    rules:   RULES.length,
    endpoints: ['/scan','/stats','/events','/audit','/health','/rules.json','/test-cases.json'],
  });
});

// POST /scan
app.post('/scan', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'invalid_request', message: 'JSON body required' });
  }

  const input = (body.command || body.cmd || '').toString();
  const type  = (body.type || 'shell').toString().slice(0, 32);

  if (!input.trim()) {
    return res.status(400).json({
      error: 'missing_command',
      message: 'Provide a "command" or "cmd" field in the request body',
    });
  }

  const result = runEngine(input);
  result.type  = type;
  result.reqId = req.id;

  // Persist to Redis (or memory)
  await saveEvent({ id: Date.now(), ...result });

  // Broadcast via event emitter if ws-server is hosting
  if (typeof global.emitScanEvent === 'function') {
    global.emitScanEvent(result);
  }

  res.json(result);
});

// GET /stats
app.get('/stats', async (req, res) => {
  const events  = await loadEvents();
  const total   = events.length;
  const blocked = events.filter(e => e.verdict === 'BLOCK').length;
  const warned  = events.filter(e => e.verdict === 'WARN').length;
  const allowed = events.filter(e => e.verdict === 'ALLOW').length;
  const blockRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0';

  const ruleCounts = {};
  events.forEach(e => {
    if (e.ruleId) ruleCounts[e.ruleId] = (ruleCounts[e.ruleId] || 0) + 1;
  });
  const topRules = Object.entries(ruleCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  res.json({
    total,
    blocked,
    warned,
    allowed,
    blockRate,
    topRules,
    rulesActive: RULES.length,
    generated: new Date().toISOString(),
  });
});

// GET /events
app.get('/events', async (req, res) => {
  const events = await loadEvents();
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
  const verdict = req.query.verdict;
  const ruleId  = req.query.ruleId;

  let filtered = events;
  if (verdict) filtered = filtered.filter(e => e.verdict?.toLowerCase() === verdict.toLowerCase());
  if (ruleId)  filtered = filtered.filter(e => e.ruleId === ruleId.toUpperCase());

  const total  = filtered.length;
  const sorted = [...filtered].reverse();
  const sliced = sorted.slice((page-1)*limit, page*limit);

  res.json({ total, page, limit, events: sliced });
});

// GET /audit
app.get('/audit', async (req, res) => {
  const events = await loadEvents();
  res.json({
    generated:   new Date().toISOString(),
    engine:      'TEOS Sentinel v2.0',
    version:     '2.0.0',
    rulesActive: RULES.length,
    totalEvents: events.length,
    events:      events.slice(-200).reverse(),
  });
});

// ── ERROR HANDLER ───────────────────────────────────────────
app.use((err, req, res, next) => {
  log('error', 'Unhandled error', { reqId: req.id, error: err.message, stack: err.stack });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'payload_too_large', message: `Max ${MAX_PAYLOAD_KB}KB` });
  }
  if (err.status === 400) {
    return res.status(400).json({ error: 'bad_request', message: err.message });
  }

  res.status(500).json({ error: 'internal_error', reqId: req.id });
});

// ── EXPORT (Vercel serverless + Railway) ──────────────────────
module.exports         = app;
module.exports.RULES   = RULES;
module.exports.runEngine = runEngine;
module.exports.loadEvents = loadEventsSync;
module.exports.saveEvent = saveEvent;
module.exports.redis = redis;

// ── START (local dev / Railway) ─────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    log('info', 'TEOS Sentinel Engine v2.0 started', { port: PORT, env: NODE_ENV, store: redis ? 'redis' : 'memory' });
  });
}
