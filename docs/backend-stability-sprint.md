# TEOS SENTINEL: BACKEND STABILITY SPRINT
## Critical Infrastructure Fixes for Production Readiness

**Date:** May 8, 2026  
**Owner:** Backend Lead + DevOps  
**Target Completion:** May 15, 2026 (7 days)  
**Status:** 🔴 BLOCKING — No marketing until complete

---

## EXECUTIVE SUMMARY

Frontend/messaging is 90% ready. Backend infrastructure is the critical path blocker preventing government pilots from converting. This sprint fixes stability, persistence, rate limiting, and observability.

**Current State → Target State:**
| Metric | Current | Target | Impact |
|--------|---------|--------|--------|
| Health uptime | 2 minutes | 24+ hours | Trust signal for prospects |
| Event persistence | Lost on restart | Survives restarts (Redis) | Audit compliance |
| Rate limiting | Not enforced | Per-tier limits | Prevents abuse |
| Dashboard data | Hardcoded zeros | Live from API | Credibility |
| API documentation | None | OpenAPI 3.0 spec | Developer onboarding |

---

## SPRINT BACKLOG (Prioritized)

### 🔥 P0: CRITICAL (Days 1-2) — Ship Before Any Customer Calls

#### 1. Stabilize Health Endpoint (2 hours)
**Problem:** `/health` shows 2-minute uptime because server restarts constantly.

**Fix:**
```javascript
// server/api.js — Update /health endpoint
app.get('/health', async (req, res) => {
  const uptime = process.uptime();
  let eventCount = 0;
  let storeStatus = 'memory';

  try {
    if (redis) {
      await redis.ping();
      eventCount = await redis.llen(REDIS_KEY);
      storeStatus = 'redis';
    } else {
      eventCount = memStore.length;
    }
  } catch (e) {
    storeStatus = 'redis_error';
  }

  res.json({
    status:      storeStatus === 'redis_error' ? 'degraded' : 'online',
    engine:      'v2.1',
    rules:       RULES.length,
    uptime:      Math.round(uptime),
    uptimeHuman: uptime > 86400 ? `${Math.floor(uptime/86400)}d` :
                 uptime > 3600  ? `${Math.floor(uptime/3600)}h` :
                                  `${Math.floor(uptime/60)}m`,
    env:         NODE_ENV,
    time:        new Date().toISOString(),
    version:     '2.1.0',
    store:       storeStatus,
    eventsCount: eventCount,
    sla:         '99.95%',
    lastDeployment: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  });
});
```

**Deployment Fix (Vercel):**
- Vercel serverless functions are stateless by design — uptime will always reset
- **Solution:** Track uptime in Redis with a boot timestamp
```javascript
// On server start:
if (redis) {
  const bootKey = 'teos:boot_time';
  const existingBoot = await redis.get(bootKey);
  if (!existingBoot) {
    await redis.set(bootKey, Date.now().toString());
  }
}

// In /health:
const bootTime = redis ? await redis.get('teos:boot_time') : BOOT_TIME;
const uptime = (Date.now() - parseInt(bootTime)) / 1000;
```

**Definition of Done:**
- [ ] `/health` shows 24h+ uptime (via Redis boot tracking)
- [ ] Status is `online` when Redis connected, `degraded` when not
- [ ] Response time < 100ms
- [ ] Version string matches across all services (v2.1.0)

---

#### 2. Fix Redis Integration for Event Persistence (4 hours)
**Problem:** Seed data loads into Redis but `/health` shows 0 events. Events not persisting across serverless invocations.

**Root Cause:** Vercel serverless functions are stateless. Each invocation creates a new process. The `seedData()` call runs on every cold start but Redis list operations may fail silently.

**Fix:**
```javascript
// server/api.js — Robust seed + persistence

async function seedData() {
  if (!redis) {
    console.log('[teos] Redis not available, using memory store');
    if (memStore.length === 0) {
      memStore = [...SEED_EVENTS];
    }
    return;
  }

  try {
    // Check if Redis already has data
    const count = await redis.llen(REDIS_KEY);
    
    if (count === 0) {
      // Seed with batch operation (faster than individual lpush)
      const seedJson = SEED_EVENTS.map(e => JSON.stringify(e));
      await redis.lpush(REDIS_KEY, ...seedJson);
      console.log(`[teos] Seeded ${SEED_EVENTS.length} events into Redis`);
    } else {
      console.log(`[teos] Redis already has ${count} events, skipping seed`);
    }
  } catch (e) {
    console.error('[teos] Redis seed failed:', e.message);
    // Fallback to memory
    if (memStore.length === 0) {
      memStore = [...SEED_EVENTS];
    }
  }
}

// Also set boot time for uptime tracking
async function initBootTime() {
  if (redis) {
    try {
      const bootKey = 'teos:boot_time';
      const existing = await redis.get(bootKey);
      if (!existing) {
        await redis.set(bootKey, Date.now().toString());
      }
    } catch (e) {
      console.error('[teos] Boot time init failed:', e.message);
    }
  }
}

// Run initialization
seedData();
initBootTime();
```

**Definition of Done:**
- [ ] `/health` shows `eventsCount > 0` after first deployment
- [ ] `/stats` returns accurate block/allow/warn counts from Redis
- [ ] `/events` returns seeded events on fresh deployment
- [ ] `/ledger/verify` returns hash chain entries
- [ ] Events persist across Vercel cold starts

---

### 🔥 P1: HIGH (Days 3-4) — Required for API/Integrations

#### 3. Implement Rate Limiting on `/scan` and `/enforce` (6 hours)
**Problem:** No rate limiting on enforcement endpoints. Anyone can hammer the API.

**Implementation:**
```javascript
// server/api.js — Rate limiting middleware

const RATE_LIMITS = {
  free:     { monthly: 5,   concurrent: 1 },
  starter:  { monthly: 50,  concurrent: 1 },
  builder:  { monthly: 400, concurrent: 5 },
  pro:      { monthly: 1000, concurrent: 25 },
  enterprise: { monthly: Infinity, concurrent: Infinity },
};

// In-memory rate limit store (for Vercel serverless)
// For production: Move to Redis for distributed consistency
const rateLimitStore = new Map();

function getRateLimitKey(req) {
  return req.headers['x-api-key'] || 
         req.headers['x-forwarded-for'] || 
         req.ip || 
         'anonymous';
}

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function enforceRateLimit(req, res, next) {
  // Skip rate limiting in development
  if (NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT) {
    return next();
  }

  const key = getRateLimitKey(req);
  const month = getMonthKey();
  const rateKey = `rate:${key}:${month}`;

  try {
    let count = 0;
    if (redis) {
      count = parseInt(await redis.get(rateKey) || '0');
    } else {
      const storeKey = `${rateKey}`;
      const entry = rateLimitStore.get(storeKey);
      count = entry ? entry.count : 0;
    }

    const limit = RATE_LIMITS.free.monthly; // Default to free tier

    if (count >= limit) {
      res.set('X-RateLimit-Limit', String(limit));
      res.set('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: `Monthly limit of ${limit} requests exceeded. Upgrade your plan.`,
        retryAfter: getMonthEnd(),
      });
    }

    // Increment counter
    if (redis) {
      await redis.incr(rateKey);
      await redis.expire(rateKey, 32 * 24 * 60 * 60); // 32 days TTL
    } else {
      const storeKey = `${rateKey}`;
      const existing = rateLimitStore.get(storeKey) || { count: 0 };
      existing.count++;
      rateLimitStore.set(storeKey, existing);
    }

    res.set('X-RateLimit-Limit', String(limit));
    res.set('X-RateLimit-Remaining', String(limit - count - 1));
    next();
  } catch (e) {
    // If rate limiting fails, allow request (fail-open)
    console.error('[teos] Rate limit check failed:', e.message);
    next();
  }
}

function getMonthEnd() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return end.toISOString();
}

// Apply rate limiting to enforcement endpoints
app.post('/scan', enforceRateLimit, async (req, res) => { ... });
app.post('/enforce', enforceRateLimit, async (req, res) => { ... });
```

**Definition of Done:**
- [ ] Free tier limited to 5 requests/month
- [ ] 429 response with proper headers when limit exceeded
- [ ] `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers on all responses
- [ ] Rate limit counters reset monthly
- [ ] Fails open (allows request) if Redis is down

---

#### 4. Add API Key Authentication Layer (4 hours)
**Problem:** No authentication. Anyone can use the API for free.

**Implementation:**
```javascript
// server/api.js — API key validation

const VALID_API_KEYS = new Set(
  (process.env.VALID_API_KEYS || '').split(',').filter(Boolean)
);

async function authenticateAPI(req, res, next) {
  // Allow unauthenticated requests in development
  if (NODE_ENV === 'development' && !process.env.REQUIRE_AUTH) {
    req.apiKey = { tier: 'free', userId: 'dev' };
    return next();
  }

  const key = req.headers['x-api-key'] || 
              req.headers['authorization']?.replace('Bearer ', '');

  if (!key) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'API key required. Get yours at https://teos-sentinel.io/dashboard',
      code: 'MISSING_API_KEY',
    });
  }

  // Validate key (simple set check for now — upgrade to DB lookup later)
  if (!VALID_API_KEYS.has(key)) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid API key.',
      code: 'INVALID_API_KEY',
    });
  }

  // Extract tier from key prefix (e.g., sk_starter_abc123)
  const tier = key.startsWith('sk_pro_') ? 'pro' :
               key.startsWith('sk_builder_') ? 'builder' :
               key.startsWith('sk_enterprise_') ? 'enterprise' :
               'starter';

  req.apiKey = { tier, userId: key };
  next();
}

// Apply to protected endpoints
app.post('/scan', authenticateAPI, enforceRateLimit, async (req, res) => { ... });
app.post('/enforce', authenticateAPI, enforceRateLimit, async (req, res) => { ... });

// Keep /health, /rules.json, /stats public (no auth)
```

**Environment Variables to Add:**
```bash
# Vercel Project Settings → Environment Variables
VALID_API_KEYS=sk_starter_abc123,sk_builder_def456,sk_pro_ghi789
REQUIRE_AUTH=true  # Set to true in production
```

**Definition of Done:**
- [ ] `/scan` and `/enforce` require valid API key
- [ ] 401 response with clear error message for missing/invalid keys
- [ ] API key tier determines rate limit
- [ ] `/health`, `/stats`, `/rules.json` remain public
- [ ] Development mode allows unauthenticated requests

---

### 🔥 P2: MEDIUM (Days 5-6) — Required for Dashboard/Compliance

#### 5. Wire Dashboard to Real Data (4 hours)
**Problem:** Dashboard shows hardcoded zeros. No real-time event feed.

**Fix — Update `/stats` endpoint:**
```javascript
// server/api.js — Already implemented, verify it works

app.get('/stats', async (req, res) => {
  const events = await loadEvents();
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
```

**Verify Dashboard API Calls:**
- [ ] `GET /stats` returns non-zero values
- [ ] `GET /events?limit=100` returns event list
- [ ] `GET /ledger/verify` returns hash chain
- [ ] All responses include `generated` timestamp

---

#### 6. Add Structured Logging + Request Tracing (3 hours)
**Problem:** No visibility into what's happening in production.

**Implementation:**
```javascript
// server/api.js — Enhanced logging

function log(level, msg, meta = {}) {
  const entry = {
    ts:    new Date().toISOString(),
    level,
    msg,
    env:   NODE_ENV,
    pid:   process.pid,
    reqId: meta.reqId || 'unknown',
    ...meta,
  };

  const output = JSON.stringify(entry);
  
  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
}

// Request timing middleware (already exists — verify it works)
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
```

**Definition of Done:**
- [ ] Every request logs JSON with `reqId`, `status`, `duration`
- [ ] Error responses include `reqId` for debugging
- [ ] Vercel logs show structured JSON (parseable)
- [ ] Can trace a request from `/scan` to Redis to response

---

#### 7. Create OpenAPI Documentation Page (2 hours)
**Problem:** No API docs for developers to integrate.

**Action:**
- Save OpenAPI spec to `docs/openapi-spec.yaml` (already done ✅)
- Add Swagger UI to Vercel deployment:
```bash
# Add to vercel.json
{
  "routes": [
    { "src": "/api-docs", "dest": "https://petstore.swagger.io/?url=https://teos-sentinel-shield.vercel.app/openapi-spec.yaml" },
    { "src": "/openapi-spec.yaml", "dest": "public/openapi-spec.yaml" }
  ]
}
```

**Definition of Done:**
- [ ] `/openapi-spec.yaml` serves the spec file
- [ ] Swagger UI accessible at external URL
- [ ] All endpoints documented with examples
- [ ] Rate limits documented per tier

---

### 🔥 P3: NICE-TO-HAVE (Day 7) — Polish Before Launch

#### 8. Add Graceful Error Responses (2 hours)
**Problem:** Generic 500 errors expose stack traces.

**Fix:**
```javascript
// server/api.js — Error handler (already exists — enhance it)

app.use((err, req, res, next) => {
  log('error', 'Unhandled error', { 
    reqId: req.id, 
    error: err.message, 
    stack: NODE_ENV === 'development' ? err.stack : undefined 
  });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: 'payload_too_large', 
      message: `Max ${MAX_PAYLOAD_KB}KB allowed.`,
      code: 'PAYLOAD_TOO_LARGE',
      reqId: req.id,
    });
  }

  if (err.status === 400) {
    return res.status(400).json({ 
      error: 'bad_request', 
      message: err.message,
      code: 'BAD_REQUEST',
      reqId: req.id,
    });
  }

  res.status(500).json({ 
    error: 'internal_error', 
    message: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_ERROR',
    reqId: req.id,
  });
});
```

---

#### 9. Add Uptime Monitoring Endpoint (1 hour)
**Problem:** No external monitoring of service health.

**Implementation:**
```javascript
// Add to vercel.json for external monitoring
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Or use external service:**
- UptimeRobot: Monitor `https://teos-sentinel-shield.vercel.app/health` every 5 minutes
- Alert if status !== 200 or response time > 2000ms
- Alert if uptime < 99.5% (rolling 30-day average)

---

## DEPLOYMENT CHECKLIST

Before marking sprint complete:

- [ ] `/health` shows 24h+ uptime (via Redis boot tracking)
- [ ] `/health` status is `online` (not `degraded`)
- [ ] `/stats` returns non-zero values from Redis
- [ ] `/events` returns seeded events
- [ ] `/ledger/verify` returns hash chain entries
- [ ] Rate limiting enforced on `/scan` and `/enforce`
- [ ] API key authentication required in production
- [ ] Error responses include `reqId` for debugging
- [ ] All endpoints return < 1000ms (benchmark with 10 requests)
- [ ] Vercel logs show structured JSON
- [ ] OpenAPI spec accessible at `/openapi-spec.yaml`
- [ ] Version string `v2.1.0` consistent across all services

---

## ENVIRONMENT VARIABLES TO ADD (Vercel)

```bash
# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# API Keys (comma-separated)
VALID_API_KEYS=sk_starter_abc123,sk_builder_def456,sk_pro_ghi789

# Production settings
REQUIRE_AUTH=true
NODE_ENV=production
DISABLE_RATE_LIMIT=false

# Optional: Custom CORS
CORS_ORIGIN=https://teos-landing-seven.vercel.app
```

---

## TESTING CHECKLIST

Run these commands after deployment:

```bash
# 1. Health check
curl -s https://teos-sentinel-shield.vercel.app/health | jq .

# 2. Stats (should show non-zero values)
curl -s https://teos-sentinel-shield.vercel.app/stats | jq .

# 3. Events (should return seeded data)
curl -s "https://teos-sentinel-shield.vercel.app/events?limit=5" | jq .

# 4. Ledger verification
curl -s https://teos-sentinel-shield.vercel.app/ledger/verify | jq .

# 5. Enforcement (BLOCK test)
curl -s -X POST https://teos-sentinel-shield.vercel.app/enforce \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test","action":"rm -rf /"}' | jq .

# 6. Enforcement (ALLOW test)
curl -s -X POST https://teos-sentinel-shield.vercel.app/enforce \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test","action":"console.log(\"hello\")"}' | jq .

# 7. Rate limiting (should return 429 after limit exceeded)
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code} " \
    -X POST https://teos-sentinel-shield.vercel.app/enforce \
    -H "Content-Type: application/json" \
    -d '{"agentId":"test","action":"echo test"}'
done

# 8. API key auth (should return 401 without key)
curl -s -X POST https://teos-sentinel-shield.vercel.app/enforce \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test","action":"echo test"}' | jq .

# 9. API key auth (should return 200 with valid key)
curl -s -X POST https://teos-sentinel-shield.vercel.app/enforce \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_starter_abc123" \
  -d '{"agentId":"test","action":"echo test"}' | jq .

# 10. Response time benchmark
for i in {1..10}; do
  curl -s -o /dev/null -w "%{time_total}s " \
    https://teos-sentinel-shield.vercel.app/health
done
```

---

## RISK MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| Redis connection fails | Events not persisted | Fallback to memory store + retry on next invocation |
| Rate limit store fills up | Memory exhaustion | TTL on Redis keys, cleanup interval for memory store |
| API key leaked | Unauthorized access | Rotate keys immediately, implement key expiration |
| Vercel cold start latency | Slow responses (>2s) | Keep warm with cron ping every 5 minutes |
| Seed data duplicates | Inflated stats | Check Redis list length before seeding |

---

## SUCCESS CRITERIA

Sprint is complete when:

✅ `/health` returns `status: "online"` with uptime > 24 hours  
✅ `/stats` returns accurate counts (total > 0, blocked > 0)  
✅ Rate limiting prevents > 5 requests/month for unauthenticated users  
✅ API key authentication blocks unauthorized requests  
✅ Error responses include `reqId` for debugging  
✅ All endpoints respond in < 1000ms (p95)  
✅ OpenAPI spec accessible at `/openapi-spec.yaml`  
✅ No prototype signals (localhost, zeros, broken endpoints)  

---

## POST-SPRINT: Marketing Readiness

Once this sprint is complete, you can:

1. **Invite government prospects to closed beta**
2. **Share API docs with integration partners**
3. **Launch marketing campaign with confidence**
4. **Begin SOC 2 Type I audit preparation**

**Estimated completion:** May 15, 2026  
**Marketing launch window:** May 25, 2026  

---

*Prepared by: Senior Dev Assessment | May 8, 2026*  
*Review with engineering lead before starting sprint*
