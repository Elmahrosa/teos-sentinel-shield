// =============================================================================
// TEOS Sentinel Guard v2.0 — Sovereign Pre-Execution Firewall
//
// TEOS Sentinel Shield — Sovereign AI Execution Firewall
//
// Default firewall for Claude Code / Claude Agent SDK. Intercepts every tool
// call, scans through MCP Risk Engine, and ALLOWs/BLOCKs/WARNs pre-execution.
//
// Features:
//   - Redis-backed caching (cross-process, with in-memory fallback)
//   - Token bucket rate limiting per session
//   - Circuit breaker pattern (auto fail-closed when MCP is down)
//   - SHA3-256 chained audit trail (AES-256-GCM optional encryption)
//   - Session-aware tracking with escalation
//   - MENA data residency (configurable endpoint)
//   - Sub-800ms P95 latency (cached + parallel check)
// =============================================================================

const crypto = require('crypto');
const { createClient } = require('ioredis');
const axios = require('axios');

const logger = {
  info: (msg) => process.stdout.write(`[SentinelGuard] ${msg}\n`),
  warn: (msg) => process.stderr.write(`[SentinelGuard] WARN: ${msg}\n`),
  error: (msg, err) => process.stderr.write(`[SentinelGuard] ERROR: ${msg}${err ? ` — ${err.message}` : ''}\n`),
};

// ── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_MCP_API             = process.env.MCP_API || process.env.MCP_ENGINE_URL || '';
const DEFAULT_TIMEOUT             = parseInt(process.env.SENTINEL_TIMEOUT || '600', 10);
const DEFAULT_RETRY               = parseInt(process.env.SENTINEL_RETRY || '2', 10);
const DEFAULT_CACHE_TTL           = parseInt(process.env.SENTINEL_CACHE_TTL || '300', 10);
const DEFAULT_RATE_LIMIT_MAX      = parseInt(process.env.SENTINEL_RATE_LIMIT || '60', 10);
const DEFAULT_RATE_WINDOW_MS      = parseInt(process.env.SENTINEL_RATE_WINDOW || '60000', 10);
const DEFAULT_CB_THRESHOLD        = parseInt(process.env.SENTINEL_CB_THRESHOLD || '3', 10);
const DEFAULT_CB_RESET_MS         = parseInt(process.env.SENTINEL_CB_RESET || '30000', 10);
const MAX_INPUT_LENGTH            = 100 * 1024;
const AUDIT_ALGORITHM             = 'sha3-256';
const REASONS_BLOCK_THRESHOLD     = 3;

// ── Crypto Helpers ─────────────────────────────────────────────────────────
function sha3_256(data) {
  return crypto.createHash(AUDIT_ALGORITHM).update(data).digest('hex');
}

function encryptAuditEntry(entry, key) {
  if (!key) return { ...entry, hash: sha3_256(JSON.stringify(entry)) };
  const cipher = crypto.createCipheriv('aes-256-gcm',
    crypto.createHash('sha256').update(key).digest(),
    Buffer.alloc(16, 0)
  );
  let encrypted = cipher.update(JSON.stringify(entry), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  const hash = sha3_256(encrypted + authTag);
  return { encrypted, authTag, hash, algorithm: 'aes-256-gcm' };
}

// ── Token Bucket Rate Limiter ──────────────────────────────────────────────
class TokenBucket {
  constructor(maxTokens = DEFAULT_RATE_LIMIT_MAX, windowMs = DEFAULT_RATE_WINDOW_MS) {
    this._maxTokens = maxTokens;
    this._windowMs = windowMs;
    this._buckets = new Map();
  }

  consume(key, tokens = 1) {
    const now = Date.now();
    let bucket = this._buckets.get(key);
    if (!bucket || now - bucket.resetAt > this._windowMs) {
      bucket = { tokens: this._maxTokens, resetAt: now + this._windowMs };
      this._buckets.set(key, bucket);
    }
    if (bucket.tokens < tokens) {
      const retryAfter = bucket.resetAt - now;
      return { allowed: false, retryAfter };
    }
    bucket.tokens -= tokens;
    this._buckets.set(key, bucket);
    return { allowed: true };
  }

  getState(key) {
    const bucket = this._buckets.get(key);
    if (!bucket) return { remaining: this._maxTokens, resetIn: 0 };
    return {
      remaining: Math.max(0, bucket.tokens),
      resetIn: Math.max(0, bucket.resetAt - Date.now()),
    };
  }

  get size() { return this._buckets.size; }
}

// ── In-Memory Cache ────────────────────────────────────────────────────────
class MemoryCache {
  constructor(ttlMs = DEFAULT_CACHE_TTL * 1000) {
    this._store = new Map();
    this._ttl = ttlMs;
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this._ttl) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) { this._store.set(key, { value, ts: Date.now() }); }

  delete(key) { this._store.delete(key); }

  clear() { this._store.clear(); }

  get size() { return this._store.size; }
}

// ── Redis Cache (with memory fallback) ─────────────────────────────────────
class RedisCache {
  constructor(redisClient, ttlSeconds = DEFAULT_CACHE_TTL) {
    this._redis = redisClient;
    this._ttl = ttlSeconds;
    this._memory = new MemoryCache(5000);
  }

  async get(key) {
    const mem = this._memory.get(key);
    if (mem) return mem;
    if (!this._redis) return null;
    try {
      const raw = await this._redis.get(`sentinel:cache:${key}`);
      if (raw) {
        const val = JSON.parse(raw);
        this._memory.set(key, val);
        return val;
      }
    } catch (err) {
      logger.warn(`Redis cache get failed: ${err.message}`);
    }
    return null;
  }

  async set(key, value) {
    this._memory.set(key, value);
    if (!this._redis) return;
    try {
      await this._redis.setex(`sentinel:cache:${key}`, this._ttl, JSON.stringify(value));
    } catch (err) {
      logger.warn(`Redis cache set failed: ${err.message}`);
    }
  }

  async invalidate(key) {
    this._memory.delete(key);
    if (!this._redis) return;
    try { await this._redis.del(`sentinel:cache:${key}`); }
    catch (err) { logger.warn(`Redis cache invalidate failed: ${err.message}`); }
  }

  async clear() {
    this._memory.clear();
    if (!this._redis) return;
    try {
      const keys = await this._redis.keys('sentinel:cache:*');
      if (keys.length) await this._redis.del(...keys);
    } catch (err) {
      logger.warn(`Redis cache clear failed: ${err.message}`);
    }
  }

  get size() { return this._memory.size; }
}

// ── Circuit Breaker ────────────────────────────────────────────────────────
class CircuitBreaker {
  constructor(threshold = DEFAULT_CB_THRESHOLD, resetMs = DEFAULT_CB_RESET_MS) {
    this._threshold = threshold;
    this._resetMs = resetMs;
    this._state = 'CLOSED';
    this._failureCount = 0;
    this._lastFailureAt = 0;
    this._lastProbeAt = 0;
  }

  get state() { return this._state; }

  get isOpen() { return this._state === 'OPEN'; }

  async call(fn) {
    if (this._state === 'OPEN') {
      if (Date.now() - this._lastFailureAt > this._resetMs) {
        this._state = 'HALF_OPEN';
      } else {
        return { error: new Error('Circuit breaker OPEN — MCP engine unreachable') };
      }
    }

    try {
      const result = await fn();
      if (this._state === 'HALF_OPEN') {
        this._state = 'CLOSED';
        this._failureCount = 0;
      }
      return { result };
    } catch (err) {
      this._failureCount++;
      this._lastFailureAt = Date.now();
      if (this._failureCount >= this._threshold) {
        this._state = 'OPEN';
      }
      return { error: err };
    }
  }

  reset() {
    this._state = 'CLOSED';
    this._failureCount = 0;
    this._lastFailureAt = 0;
  }

  getMetrics() {
    return {
      state: this._state,
      failures: this._failureCount,
      threshold: this._threshold,
      lastFailureAt: this._lastFailureAt,
      resetMs: this._resetMs,
    };
  }
}

// ── Session Tracker ────────────────────────────────────────────────────────
class SessionTracker {
  constructor() {
    this._sessions = new Map();
  }

  record(sessionId, decision) {
    if (!sessionId) return;
    let s = this._sessions.get(sessionId);
    if (!s) {
      s = { consecutiveBlocks: 0, totalChecks: 0, lastDecision: null, createdAt: Date.now() };
      this._sessions.set(sessionId, s);
    }
    s.totalChecks++;
    if (decision === 'BLOCK') {
      s.consecutiveBlocks++;
    } else {
      s.consecutiveBlocks = 0;
    }
    s.lastDecision = decision;
  }

  getContext(sessionId) {
    return this._sessions.get(sessionId) || { consecutiveBlocks: 0, totalChecks: 0, lastDecision: null, createdAt: Date.now() };
  }

  shouldEscalate(sessionId) {
    const ctx = this.getContext(sessionId);
    return ctx.consecutiveBlocks >= REASONS_BLOCK_THRESHOLD;
  }
}

// ── Local Pattern Check (fallback when remote MCP is unavailable or returns 0) ──
const _LOCAL_DANGEROUS_PATTERNS = [
  { pattern: /rm\s+(-\w*\s+)*-?\w*r\w*f\w*\s+\/(?!tmp)/i, score: 95, rule: 'LOCAL_RM_RF_ROOT', reason: 'Recursive delete from root' },
  { pattern: /rm\s+(-\w*\s+)*--no-preserve-root/i, score: 98, rule: 'LOCAL_RM_NO_PRESERVE', reason: 'rm --no-preserve-root detected' },
  { pattern: /:\(\)\s*\{\s*:\|:\&\s*\}\s*;:/, score: 95, rule: 'LOCAL_FORK_BOMB', reason: 'Fork bomb detected' },
  { pattern: /dd\s+.*of=\/dev\/(sd|vd|nvme)/i, score: 95, rule: 'LOCAL_DD_WRITE', reason: 'Direct disk write via dd' },
  { pattern: /mkfs\.\w+\s+\/dev\//i, score: 95, rule: 'LOCAL_MKFS', reason: 'Filesystem format on device' },
  { pattern: /chmod\s+(-\w*\s+)*(-R\s+)?777\s+\//i, score: 92, rule: 'LOCAL_CHMOD_777', reason: 'Recursive chmod 777 on root path' },
  { pattern: /sudo\s+rm\s+.*\//i, score: 90, rule: 'LOCAL_SUDO_RM', reason: 'sudo rm on system path' },
  { pattern: /curl\s+.*\|\s*(ba)?sh/i, score: 92, rule: 'LOCAL_CURL_PIPE_BASH', reason: 'Remote code execution via curl pipe' },
  { pattern: /wget\s+.*\|\s*(ba)?sh/i, score: 92, rule: 'LOCAL_WGET_PIPE_BASH', reason: 'Remote code execution via wget pipe' },
  { pattern: /echo\s+["']?[A-Za-z0-9+/=]{8,}["']?\s*\|\s*base64\s+-d\s*\|\s*(ba)?sh/i, score: 88, rule: 'LOCAL_BASE64_EXEC', reason: 'Obfuscated command execution via base64' },
  { pattern: /docker\s+run.*--privileged/i, score: 80, rule: 'LOCAL_DOCKER_PRIV', reason: 'Privileged Docker container' },
  { pattern: /docker\s+run.*nicehash|miner/i, score: 85, rule: 'LOCAL_CRYPTO_MINER', reason: 'Crypto miner container detected' },
  { pattern: /curl\s+.*\?\s*(token|key|secret|api_key)=\$\{?\w+/i, score: 80, rule: 'LOCAL_SECRET_EXFIL', reason: 'Potential secret exfiltration via curl' },
  { pattern: /\bexec\s*\(\s*["']\s*(?:eval|system|passthru|shell_exec|popen)\b/i, score: 82, rule: 'LOCAL_PHP_EXEC', reason: 'Dangerous PHP function call' },
  { pattern: /\b(EVAL|EXEC)\b\s*\(.*\b(BASE64_DECODE|FROM_HEX)\b/i, score: 85, rule: 'LOCAL_OBFUSCATED_EXEC', reason: 'Obfuscated code execution' },
];

function _localPatternCheck(input) {
  if (!input || typeof input !== 'string') return null;
  for (const p of _LOCAL_DANGEROUS_PATTERNS) {
    if (p.pattern.test(input)) {
      return { score: p.score, rule: p.rule, reason: p.reason };
    }
  }
  return null;
}

// ── MCP Client ─────────────────────────────────────────────────────────────
class McpClient {
  constructor(config = {}) {
    this.apiEndpoint = config.apiEndpoint || DEFAULT_MCP_API;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.retry = config.retry || DEFAULT_RETRY;
    this.authToken = config.authToken || process.env.MCP_AUTH_TOKEN || '';
    this.internalKey = config.internalKey || process.env.INTERNAL_API_KEY || '';
    this._circuitBreaker = new CircuitBreaker(
      config.circuitBreakerThreshold,
      config.circuitBreakerResetMs,
    );
  }

  get circuitBreaker() { return this._circuitBreaker; }

  async scan(input) {
    if (!input || input.trim().length < 3) {
      return {
        verdict: 'ALLOW', score: 0, findings: [],
        explanation: 'Input too short — insufficient context',
      };
    }

    const payload = typeof input === 'string'
      ? { command: input }
      : { command: JSON.stringify(input) };

    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
      headers['X-API-Key'] = this.authToken;
    }
    if (this.internalKey) {
      headers['X-Internal-Key'] = this.internalKey;
    }

    const executeWithRetry = async () => {
      let lastError;
      for (let attempt = 0; attempt <= this.retry; attempt++) {
        try {
          return await axios.post(`${this.apiEndpoint}/scan`, payload, {
            timeout: this.timeout,
            headers,
          });
        } catch (err) {
          lastError = err;
          if (attempt < this.retry) {
            await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
          }
        }
      }
      throw lastError;
    };

    const { result, error } = await this._circuitBreaker.call(executeWithRetry);
    if (error) throw error;
    return result.data;
  }
}

// ── Main SentinelGuard Class ───────────────────────────────────────────────
class SentinelGuard {
  constructor(config = {}) {
    this.config = {
      failClosed: config.failClosed !== undefined ? config.failClosed : true,
      enableCache: config.enableCache !== undefined ? config.enableCache : true,
      enableRedisCache: config.enableRedisCache !== undefined ? config.enableRedisCache : true,
      enableAudit: config.enableAudit !== undefined ? config.enableAudit : true,
      enableRateLimiting: config.enableRateLimiting !== undefined ? config.enableRateLimiting : true,
      enableSessionTracking: config.enableSessionTracking !== undefined ? config.enableSessionTracking : true,
      enableCircuitBreaker: config.enableCircuitBreaker !== undefined ? config.enableCircuitBreaker : true,
      auditEncryptionKey: config.auditEncryptionKey || process.env.SENTINEL_AUDIT_KEY || '',
      menaEndpoint: config.menaEndpoint || process.env.SENTINEL_MENA_ENDPOINT || '',
      dataResidency: config.dataResidency || process.env.SENTINEL_DATA_RESIDENCY || 'auto',
    };

    const mcpConfig = {
      ...config.mcpConfig,
      circuitBreakerThreshold: config.circuitBreakerThreshold,
      circuitBreakerResetMs: config.circuitBreakerResetMs,
    };
    this._mcp = new McpClient(mcpConfig);
    this._rateLimiter = this.config.enableRateLimiting ? new TokenBucket() : null;
    this._sessions = this.config.enableSessionTracking ? new SessionTracker() : null;
    this._auditChain = [];
    this._lastAuditHash = '';
    this._startedAt = Date.now();
    this._redisClient = null;

    this._cache = null;
    this._metrics = { totalChecks: 0, allowed: 0, blocked: 0, warned: 0, errors: 0, rateLimited: 0, cacheHits: 0 };
  }

  // ── Public API ──────────────────────────────────────────────────────────

  async check(toolInput, options = {}) {
    const sessionId = options.sessionId || 'default';
    const inputStr = typeof toolInput === 'string' ? toolInput : JSON.stringify(toolInput);

    if (inputStr.length > MAX_INPUT_LENGTH) {
      throw new Error(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} bytes`);
    }

    const startedAt = Date.now();
    this._metrics.totalChecks++;

    // ══ Rate limiting ══════════════════════════════════════════════════════
    if (this._rateLimiter) {
      const rateCheck = this._rateLimiter.consume(sessionId);
      if (!rateCheck.allowed) {
        this._metrics.rateLimited++;
        return {
          decision: 'WARN',
          reasons: [`Rate limited — retry in ${Math.ceil(rateCheck.retryAfter / 1000)}s`],
          riskScore: 0,
          auditHash: '',
          latency: Date.now() - startedAt,
          source: 'rate_limiter',
          retryAfter: rateCheck.retryAfter,
          rateLimitState: this._rateLimiter.getState(sessionId),
        };
      }
    }

    // ══ Circuit breaker check ═════════════════════════════════════════════
    const cbState = this._mcp.circuitBreaker;
    if (cbState.isOpen && !this.config.failClosed) {
      const cached = this._cache ? await this._cache.get(inputStr) : null;
      if (cached) {
        cached.source = 'cache_circuit_breaker';
        cached.latency = Date.now() - startedAt;
        return cached;
      }
    }

    // ══ Cache lookup ══════════════════════════════════════════════════════
    if (this._cache) {
      const cached = await this._cache.get(inputStr);
      if (cached) {
        this._metrics.cacheHits++;
        cached.source = 'cache';
        cached.latency = Date.now() - startedAt;
        return cached;
      }
    }

    // ══ Session context ═══════════════════════════════════════════════════
    const sessionCtx = this._sessions?.getContext(sessionId) || null;
    if (sessionCtx && this._sessions?.shouldEscalate(sessionId)) {
      return await this._blockWithReason('ESCALATION: Multiple consecutive BLOCKs detected', startedAt, sessionId);
    }

    // ══ Local pattern fallback ═══════════════════════════════════════════
    const localHit = _localPatternCheck(inputStr);

    // ══ MCP scan ══════════════════════════════════════════════════════════
    try {
      const mcpResult = await this._mcp.scan(inputStr);

      // If local patterns matched and scored higher than remote, use local score
      if (localHit && localHit.score > (mcpResult.score || 0)) {
        mcpResult.score = localHit.score;
        mcpResult.findings = mcpResult.findings?.length
          ? mcpResult.findings
          : [{ message: localHit.reason, severity: 'critical', rule: localHit.rule, score: localHit.score }];
        mcpResult.explanation = localHit.reason;
      }

      const decision = this._classify(mcpResult);
      const result = {
        decision: decision.verdict,
        reasons: mcpResult.findings?.map(f => f.message) || [mcpResult.explanation || 'No risks'],
        riskScore: mcpResult.score || 0,
        auditHash: '',
        latency: Date.now() - startedAt,
        source: 'mcp',
        findings: mcpResult.findings || [],
        explanation: mcpResult.explanation || '',
        sessionContext: this._sessions?.getContext(sessionId) || null,
        circuitBreakerState: cbState.state,
      };

      // Contradiction check: risk ≥ 80 must have findings
      if (result.riskScore >= 80 && (!result.findings || result.findings.length === 0)) {
        result.findings = [{
          message: 'Critical risk pattern detected — audit required',
          severity: 'critical',
          rule: 'CONTRADICTION_FIX',
          score: result.riskScore,
        }];
        if (!result.reasons.includes('Critical risk pattern detected')) {
          result.reasons.unshift('Critical risk pattern detected — audit required');
        }
      }

      // Contradiction check: risk = 0 → ALLOW only
      if (result.riskScore === 0 && result.decision !== 'ALLOW') {
        result.decision = 'ALLOW';
        result.reasons.unshift('Risk score is 0 — verdict downgraded to ALLOW');
      }

      // Decision must match risk thresholds exactly
      if (result.riskScore >= 80 && result.decision !== 'BLOCK') {
        result.decision = 'BLOCK';
        result.reasons.unshift('Risk score ≥ 80 — verdict escalated to BLOCK');
      } else if (result.riskScore >= 60 && result.decision === 'ALLOW') {
        result.decision = 'WARN';
        result.reasons.unshift('Risk score ≥ 60 — verdict escalated to WARN');
      } else if (result.riskScore < 60 && result.riskScore > 0 && result.decision === 'BLOCK') {
        result.decision = 'WARN';
        result.reasons.unshift('Risk score < 60 — verdict downgraded to WARN');
      }

      // Session tracking
      if (this._sessions) {
        this._sessions.record(sessionId, decision.verdict);
        result.sessionContext = this._sessions.getContext(sessionId);
      }

      // Audit trail
      if (this.config.enableAudit) {
        result.auditHash = await this._appendAudit({
          decision: decision.verdict,
          riskScore: result.riskScore,
          reasons: result.reasons,
          sessionId,
          latency: result.latency,
          timestamp: new Date().toISOString(),
        });
      }

      // Persist audit to Redis
      if (this._redisClient) {
        await this._persistAuditToRedis().catch((err) => {
          logger.warn(`Audit persist to Redis failed: ${err.message}`);
        });
      }

      // Cache result
      if (this._cache && decision.verdict !== 'ERROR') {
        await this._cache.set(inputStr, result);
      }

      // Metrics
      switch (decision.verdict) {
        case 'BLOCK': this._metrics.blocked++; break;
        case 'WARN':  this._metrics.warned++; break;
        case 'ALLOW': this._metrics.allowed++; break;
        default:      this._metrics.errors++; break;
      }

      return result;
    } catch (err) {
      this._metrics.errors++;

      // Try cache as fallback
      if (this._cache) {
        const cached = await this._cache.get(inputStr);
        if (cached) {
          cached.source = 'cache_fallback';
          cached.latency = Date.now() - startedAt;
          return cached;
        }
      }

      const fallback = {
        decision: this.config.failClosed ? 'BLOCK' : (localHit ? 'BLOCK' : 'ALLOW'),
        reasons: localHit
          ? [localHit.reason, `Sentinel unreachable: ${err.message}`]
          : [`Sentinel unreachable: ${err.message}`],
        riskScore: localHit ? localHit.score : 0,
        auditHash: '',
        latency: Date.now() - startedAt,
        source: localHit ? 'local_pattern' : 'fallback',
        error: err.message,
        circuitBreakerState: cbState.state,
      };

      if (fallback.decision === 'BLOCK') this._metrics.blocked++;
      else if (fallback.decision === 'WARN') this._metrics.warned++;
      else this._metrics.allowed++;

      if (this.config.enableAudit) {
        fallback.auditHash = await this._appendAudit({
          decision: fallback.decision,
          riskScore: fallback.riskScore,
          reasons: fallback.reasons,
          sessionId,
          latency: fallback.latency,
          timestamp: new Date().toISOString(),
          error: err.message,
        });
      }

      return fallback;
    }
  }

  // ── Middleware / Hook Generator ─────────────────────────────────────────

  createBeforeToolHook() {
    return async (toolCall) => {
      const result = await this.check(toolCall.input, {
        sessionId: toolCall.sessionId || toolCall.conversationId,
      });

      if (result.decision === 'BLOCK') {
        const error = new Error(`TEOS Sentinel: ${result.reasons.join('; ')}`);
        error.code = 'TEOS_BLOCKED';
        error.sentinelResult = result;
        error.retry = formatBlockFeedback(result.reasons, result.riskScore, result.findings);
        throw error;
      }

      if (result.decision === 'WARN') {
        result.warning = true;
      }

      return result;
    };
  }

  // ── Circuit Breaker ─────────────────────────────────────────────────────

  getCircuitBreakerMetrics() {
    return this._mcp.circuitBreaker.getMetrics();
  }

  resetCircuitBreaker() {
    this._mcp.circuitBreaker.reset();
  }

  // ── Audit Chain ─────────────────────────────────────────────────────────

  async _appendAudit(entry) {
    const chainEntry = {
      index: this._auditChain.length,
      prevHash: this._lastAuditHash || 'GENESIS',
      ...entry,
      ts: Date.now(),
    };

    if (this.config.auditEncryptionKey) {
      const key = this.config.auditEncryptionKey;
      const cipher = crypto.createCipheriv('aes-256-gcm',
        crypto.createHash('sha256').update(key).digest(),
        Buffer.alloc(16, 0)
      );
      let encrypted = cipher.update(JSON.stringify(chainEntry), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      const hash = sha3_256(encrypted + authTag);
      this._auditChain.push({ encrypted, authTag, hash, algorithm: 'aes-256-gcm' });
      this._lastAuditHash = hash;
      return hash;
    }

    const hash = sha3_256(JSON.stringify(chainEntry));
    chainEntry.hash = hash;
    this._auditChain.push(chainEntry);
    this._lastAuditHash = hash;
    return hash;
  }

  async _persistAuditToRedis() {
    if (!this._redisClient) return;
    const lastEntry = this._auditChain[this._auditChain.length - 1];
    if (!lastEntry) return;
    await this._redisClient.setex(
      `sentinel:audit:${this._lastAuditHash.slice(0, 16)}`,
      86400,
      JSON.stringify(lastEntry),
    );
  }

  // ── Redis Persistence ───────────────────────────────────────────────────

  async connectRedis(redisUrl) {
    if (this._redisClient) return;
    const url = redisUrl || process.env.REDIS_URL;
    if (!url) return;
    this._redisClient = createClient(url);
    this._redisClient.on('error', (err) => {
      logger.error(`Redis connection error, falling back to memory cache`, err);
      this._redisClient = null;
    });
    this._redisClient.on('connect', () => {
      logger.info('Redis connected — distributed cache + audit persistence enabled');
    });
    await this._redisClient.set('sentinel:guard:init', Date.now().toString());

    // Initialize Redis-backed cache
    if (this.config.enableRedisCache) {
      this._cache = new RedisCache(this._redisClient, this.config.cacheTtl || DEFAULT_CACHE_TTL);
    }
  }

  // ── Metrics ─────────────────────────────────────────────────────────────

  async getMetrics() {
    return {
      ...this._metrics,
      uptime: Date.now() - this._startedAt,
      cacheSize: this._cache?.size || 0,
      auditChainLength: this._auditChain.length,
      circuitBreaker: this._mcp.circuitBreaker.getMetrics(),
      rateLimiter: {
        activeBuckets: this._rateLimiter?.size || 0,
        maxTokens: DEFAULT_RATE_LIMIT_MAX,
        windowMs: DEFAULT_RATE_WINDOW_MS,
      },
      activeSessions: this._sessions?._sessions.size || 0,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Private ─────────────────────────────────────────────────────────────

  _classify(mcpResult) {
    if (!mcpResult || !mcpResult.verdict) {
      return { verdict: 'ALLOW', severity: 'info' };
    }
    const v = mcpResult.verdict.toUpperCase();
    if (v === 'BLOCK' || v === 'DENY' || v === 'REJECT') {
      return { verdict: 'BLOCK', severity: 'critical' };
    }
    if (v === 'WARN' || v === 'WARNING') {
      return { verdict: 'WARN', severity: 'medium' };
    }
    return { verdict: 'ALLOW', severity: 'none' };
  }

  async _blockWithReason(reason, startedAt, sessionId) {
    const latency = Date.now() - startedAt;
    this._metrics.blocked++;
    const result = {
      decision: 'BLOCK',
      reasons: [reason],
      riskScore: 100,
      auditHash: '',
      latency,
      source: 'session_escalation',
      sessionContext: this._sessions?.getContext(sessionId) || null,
    };
    if (this.config.enableAudit) {
      result.auditHash = await this._appendAudit({
        decision: 'BLOCK',
        riskScore: 100,
        reasons: [reason],
        sessionId,
        latency,
        timestamp: new Date().toISOString(),
      });
    }
    return result;
  }

  // ── Static Factory ──────────────────────────────────────────────────────

  static async create(config = {}) {
    const guard = new SentinelGuard(config);

    // Initialize in-memory cache by default
    if (config.enableCache !== false) {
      guard._cache = new MemoryCache(
        (config.cacheTtl || DEFAULT_CACHE_TTL) * 1000,
      );
    }

    // Connect to Redis if URL available (upgrades to Redis cache)
    const redisUrl = config.redisUrl || process.env.REDIS_URL;
    if (redisUrl) {
      try { await guard.connectRedis(redisUrl); }
      catch (err) { logger.warn(`Redis connection failed, using memory cache only: ${err.message}`); }
    }

    return guard;
  }
}

// ── Standard Return Format ─────────────────────────────────────────────────
// Matches Anthropic SDK PreToolUse spec: { decision, reason, updatedInput?, auditHash }

function formatBlockFeedback(reasons, riskScore, findings) {
  const topReason = reasons?.[0] || 'Unknown security risk';
  const topFinding = findings?.[0];
  const rule = topFinding?.rule || 'UNKNOWN_RULE';
  const findingDetail = topFinding?.message || topReason;
  return {
    action: 'retry',
    feedback: [
      `TEOS SENTINEL BLOCKED: ${topReason}`,
      `Rule violated: ${rule}`,
      `Risk score: ${riskScore}/100`,
      `Rewrite the command to avoid: ${findingDetail}`,
    ].join('\n'),
    rule,
    riskScore,
    findingDetail,
  };
}

function toSentinelResult(verdict, reasons, auditHash, riskScore, findings) {
  const map = { ALLOW: 'allow', BLOCK: 'deny', WARN: 'ask' };
  const result = {
    decision: map[verdict] || verdict?.toLowerCase() || 'allow',
    reason: reasons?.join('; ') || 'No risks detected',
    auditHash: auditHash || '',
    riskScore: riskScore || 0,
  };
  if (verdict === 'BLOCK') {
    result.retry = formatBlockFeedback(reasons, riskScore, findings);
  }
  return result;
}

// ── HookMatcher — filters which tool calls the hook applies to ─────────────
//
// Usage:
//   const { HookMatcher, sentinelPreToolHook } = require('./src/governance/sentinel-guard');
//   const agent = new Anthropic.Agent({
//     hooks: {
//       PreToolUse: [
//         HookMatcher({
//           matcher: /Bash|Write|Edit|Delete/,
//           hooks: [sentinelPreToolHook({ failClosed: true })],
//         }),
//       ],
//     },
//   });
//

function HookMatcher(config = {}) {
  const pattern = typeof config.matcher === 'string'
    ? new RegExp(config.matcher, 'i')
    : config.matcher || /.*/;
  const hooks = config.hooks || [];

  return async (toolUse, session) => {
    const toolName = toolUse?.name || toolUse?.function?.name || '';
    if (!pattern.test(toolName)) return toolUse;
    for (const hook of hooks) {
      const result = await hook(toolUse, session);
      if (result?.decision === 'deny') return result;
      if (result?.modified) toolUse = result;
    }
    return toolUse;
  };
}

// ── Standalone Sentinel Guard ──────────────────────────────────────────────
// Main PreToolUse function. Returns SDK-compatible { decision, reason, auditHash }.
// Signature: (preToolUseInput, sessionId, context)

async function sentinelGuard(preToolUseInput, sessionId, context) {
  const input = typeof preToolUseInput === 'string'
    ? preToolUseInput
    : preToolUseInput?.command || preToolUseInput?.input || JSON.stringify(preToolUseInput || '');

  const config = {
    failClosed: context?.failClosed !== undefined ? context.failClosed : true,
    enableCache: true,
    enableRateLimiting: true,
    enableCircuitBreaker: true,
    enableSessionTracking: true,
    enableAudit: true,
    mcpConfig: {
      apiEndpoint: context?.mcpApi || process.env.MCP_API || process.env.MCP_ENGINE_URL || '',
      timeout: context?.timeout || parseInt(process.env.SENTINEL_TIMEOUT || '600', 10),
      retry: 2,
    },
  };

  const guard = await SentinelGuard.create(config);
  const result = await guard.check(input, { sessionId: sessionId || 'default' });

  return toSentinelResult(result.decision, result.reasons, result.auditHash, result.riskScore, result.findings);
}

// ── PreToolUse Hook Factory ─────────────────────────────────────────────────
// Returns a hook function for Anthropic Agent SDK's PreToolUse array.
// When deny is returned, the agent SDK rejects the tool call before execution.
// When ask is returned, the agent SDK prompts the user for confirmation.

function sentinelPreToolHook(options = {}) {
  return async (toolUse, session) => {
    const input = toolUse?.input?.command || toolUse?.input?.input || JSON.stringify(toolUse?.input || '');
    const result = await sentinelGuard(input, session?.id, options);

    if (result.decision === 'deny') {
      return {
        ...toolUse,
        decision: 'deny',
        reason: result.reason,
        auditHash: result.auditHash,
        retry: result.retry || { action: 'retry', feedback: result.reason },
      };
    }

    if (result.decision === 'ask') {
      return {
        ...toolUse,
        decision: 'ask',
        reason: result.reason,
        auditHash: result.auditHash,
      };
    }

    return toolUse;
  };
}

// ── Create Hook for Direct Import ──────────────────────────────────────────
async function createGuardHook(config = {}) {
  const guard = await SentinelGuard.create(config);
  return guard.createBeforeToolHook();
}

module.exports = {
  SentinelGuard,
  sentinelGuard,
  sentinelPreToolHook,
  HookMatcher,
  toSentinelResult,
  formatBlockFeedback,
  createGuardHook,
  createSentinelAgent: async (options = {}) => {
    const guard = await SentinelGuard.create({
      enableCache: true,
      enableRateLimiting: true,
      enableCircuitBreaker: true,
      enableSessionTracking: true,
      enableAudit: true,
      failClosed: options.failClosed !== undefined ? options.failClosed : true,
      mcpConfig: {
        apiEndpoint: options.mcpApi || process.env.MCP_API || '',
        timeout: options.timeout || parseInt(process.env.SENTINEL_TIMEOUT || '600', 10),
        retry: 2,
      },
    });
    return { guard, sentinelGuard: (input, sessionId) => guard.check(input, { sessionId }) };
  },
  SessionTracker,
  MemoryCache,
  RedisCache,
  McpClient,
  TokenBucket,
  CircuitBreaker,
};
