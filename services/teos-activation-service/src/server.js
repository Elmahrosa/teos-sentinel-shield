import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import dotenv from "dotenv";
import os from "os";
import http from "http";
import Database from "better-sqlite3";
import { Webhook } from "standardwebhooks";
import promClient from "prom-client";
import { logger, httpLogger } from "./logger.js";
import { validateSecrets } from "./config.js";
import { requestContext } from "./request-context.js";
import { getVersion, printStartupBanner, versionRouter } from "./version.js";

promClient.collectDefaultMetrics({ prefix: "teos_" });

dotenv.config();
validateSecrets();

const app = express();
const server = http.createServer(app);
const bootTime = Date.now();
printStartupBanner();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/live' || req.path === '/ready' || req.path === '/api/dodo-webhook' || req.path === '/webhook/dodo',
});
app.use(limiter);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
}));

app.use(httpLogger);
app.use(requestContext({ logFn: (e) => logger.info({ ...e }, "request") }));
// Dodo webhooks need the RAW request body for signature verification
// (standardwebhooks HMACs the exact bytes). Skip body parsing on those routes so
// the route-level express.raw() receives the untouched Buffer instead of an object.
// Both the canonical path and the legacy `/webhook/dodo` alias are honoured so it
// does not matter which URL Dodo's dashboard is configured with.
const DODO_WEBHOOK_PATHS = new Set(['/api/dodo-webhook', '/webhook/dodo']);
const jsonBody = express.json({ limit: (process.env.REQUEST_SIZE_LIMIT || '10kb') });
const urlencodedBody = express.urlencoded({ limit: (process.env.REQUEST_SIZE_LIMIT || '10kb'), extended: false });
app.use((req, res, next) => (DODO_WEBHOOK_PATHS.has(req.path) ? next() : jsonBody(req, res, next)));
app.use((req, res, next) => (DODO_WEBHOOK_PATHS.has(req.path) ? next() : urlencodedBody(req, res, next)));
app.set('trust proxy', parseInt(process.env.TRUST_PROXY || '1'));

const PORT = Number(process.env.PORT || 8080);
const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const ACTIVATION_AUTH_TOKEN = process.env.ACTIVATION_AUTH_TOKEN || "";

const db = new Database("./data/activation.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
 user_id TEXT PRIMARY KEY,
 plan TEXT DEFAULT 'free',
 credits INTEGER DEFAULT 5,
 subscription_status TEXT DEFAULT NULL,
 subscription_expires TEXT DEFAULT NULL,
 monthly_credits INTEGER DEFAULT 0,
 credit_balance INTEGER DEFAULT 5,
 last_credit_reset TEXT DEFAULT NULL,
 tier TEXT DEFAULT 'free'
);
`);

const existingCols = db.prepare(`PRAGMA table_info(users)`).all().map(c=>c.name);
const missingCols = {
 subscription_status: "TEXT DEFAULT NULL",
 tier: "TEXT DEFAULT 'free'",
 subscription_expires: "TEXT DEFAULT NULL",
 monthly_credits: "INTEGER DEFAULT 0",
 credit_balance: "INTEGER DEFAULT 5",
 last_credit_reset: "TEXT DEFAULT NULL"
};
for(const [col,def] of Object.entries(missingCols)){
 if(!existingCols.includes(col)){
  db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
 }
}

db.exec(`
CREATE TABLE IF NOT EXISTS webhook_events (
 event_id TEXT PRIMARY KEY,
 event_type TEXT,
 user_id TEXT,
 plan TEXT,
 credits INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_transactions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT,
 event_type TEXT,
 plan TEXT,
 amount INTEGER,
 currency TEXT DEFAULT 'usd',
 status TEXT DEFAULT 'completed',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_usage (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT,
 action TEXT,
 credits_before INTEGER,
 credits_after INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_user ON billing_transactions(user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  verdict TEXT,
  score INTEGER,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Beta promo ledger: +200 credits once per user, capped at 100 grants.
CREATE TABLE IF NOT EXISTS beta_grants (
  user_id TEXT PRIMARY KEY,
  granted_credits INTEGER DEFAULT 200,
  granted_at TEXT DEFAULT (datetime('now'))
);

UPDATE users SET subscription_expires=datetime('now','+90 days') WHERE plan='tester' AND subscription_status='active' AND (subscription_expires IS NULL OR datetime(subscription_expires) < datetime('now'));
`);

function planFromProductId(id=""){
 // ── LIVE products (verified HTTP 200 on checkout.dodopayments.com/buy/<id>,
 //    these are what the bot's public payment links actually sell) ──
 if(id==="pdt_0NiubmCxvCi9MJbVfnJAT") return "pro";       // Pro / Starter Monthly (live)
 if(id==="pdt_0NiubmDStYOWzNVUkcFC8") return "pro";       // Pro / Starter Annual (live)
 if(id==="pdt_0NiubmE6vERG5onrMT21p") return "team";      // Team Monthly (live)
 if(id==="pdt_0NiubmEpW4Oi0kzhoFZIC") return "team";      // Team Annual (live)
 if(id==="pdt_0NiubvVZXt5nf0baIbV1x") return "team";      // Team Setup add-on (live)
 // ── Legacy ids (returned 404 on live + test checkout; kept as historical
 //    fallback only — they will never appear in a real webhook) ──
 if(id==="pdt_0NdjovMrD2e79VHGXwncS") return "pro";       // old Pro Monthly
 if(id==="pdt_0NdeKSS2a8XLh0bboc7D9") return "team";      // old Team Monthly
 if(id==="pdt_0NdeKSOjqmjBk7aK7iXKR") return "pro";       // old Starter -> Pro fallback
 if(id==="pdt_0NftATG1GENGRQ7Xs3Fl7") return "pro";       // old Pro Annual
 if(id==="pdt_0NftATUamuXBvzqOanWZB") return "team";      // old Team Annual
 if(id==="pdt_0NftATisCsXfJghNRuCvw") return "enterprise";
 return null;
}

function creditsForPlan(plan=""){
 if(plan==="free") return 5;
 if(plan==="tester") return 500;
 if(plan==="pro") return 1000;
 if(plan==="team") return 10000;
 if(plan==="enterprise") return 999999;
 if(plan==="founder") return 999999;
 return 0;
}

function grantCredits(userId, plan, expiresInHours){
 const credits=creditsForPlan(plan);
 const tier = plan;
 let expires;
 if (plan === "tester") {
   expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
 } else if (expiresInHours) {
   expires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
 } else {
   expires = plan === "founder" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
 }

 db.prepare(`
 INSERT INTO users (user_id,plan,credits,subscription_status,subscription_expires,tier)
 VALUES(?,?,?,'active',?,?)
 ON CONFLICT(user_id)
 DO UPDATE SET
 plan=excluded.plan,
 credits=users.credits+excluded.credits,
 subscription_status='active',
 subscription_expires=excluded.subscription_expires,
 tier=excluded.tier
 `).run(userId,plan,credits,expires,tier);

 return db.prepare(`
 SELECT * FROM users WHERE user_id=?
 `).get(userId);
}

// Beta promo: +200 credits once per user, on first pro purchase only,
// capped at 100 total grants. Considered "first purchase" if the user was
// not already pro before this webhook.
const BETA_GRANT_LIMIT = 100;
const BETA_GRANT_CREDITS = 200;
function applyBetaBonus(userId, plan, priorTier){
 if(plan !== "pro") return null;
 if(priorTier === "pro") return null;
 const already = db.prepare(`SELECT 1 FROM beta_grants WHERE user_id=?`).get(userId);
 if(already) return null;
 const { c } = db.prepare(`SELECT COUNT(*) as c FROM beta_grants`).get();
 if(c >= BETA_GRANT_LIMIT) return { granted: false, reason: "limit_reached", used: c, limit: BETA_GRANT_LIMIT };
 db.prepare(`INSERT INTO beta_grants (user_id, granted_credits) VALUES (?, ?)`).run(userId, BETA_GRANT_CREDITS);
 db.prepare(`UPDATE users SET credits = credits + ? WHERE user_id=?`).run(BETA_GRANT_CREDITS, userId);
 logger.info({ userId, granted: BETA_GRANT_CREDITS, used: c + 1, limit: BETA_GRANT_LIMIT }, "Beta promo applied");
 return { granted: true, credits: BETA_GRANT_CREDITS, used: c + 1, remaining: BETA_GRANT_LIMIT - (c + 1) };
}

// Monthly credit reset — runs hourly, resets free/pro/team to plan amount
const RESET_INTERVAL_MS = 60 * 60 * 1000;
function resetMonthlyCredits() {
  const users = db.prepare(`
    SELECT user_id, plan FROM users
    WHERE plan IN ('free','pro','team')
      AND (last_credit_reset IS NULL OR datetime(last_credit_reset) < datetime('now', '-30 days'))
  `).all();
  for (const u of users) {
    const amount = creditsForPlan(u.plan);
    db.prepare(`UPDATE users SET credits = ?, last_credit_reset = datetime('now') WHERE user_id = ?`).run(amount, u.user_id);
    logger.info({ userId: u.user_id, plan: u.plan, credits: amount }, "Monthly credits reset");
  }
}
setInterval(resetMonthlyCredits, RESET_INTERVAL_MS);
resetMonthlyCredits();

// Force-reset founder row on every boot — never decays from founder
(function ensureFounderRow() {
  const founderId = process.env.FOUNDER_USER_ID || "7815071893";
  if (!founderId) return;
  const existing = db.prepare(`SELECT user_id FROM users WHERE user_id=?`).get(founderId);
  if (!existing) {
    db.prepare(`INSERT INTO users (user_id,plan,credits,subscription_status,subscription_expires,tier) VALUES(?,?,?,'active',?,?)`)
      .run(founderId, "founder", 999999, null, "founder");
  } else {
    db.prepare(`UPDATE users SET plan='founder', credits=999999, subscription_status='active', subscription_expires=NULL, tier='founder' WHERE user_id=?`)
      .run(founderId);
  }
  logger.info({ userId: founderId }, "Founder row ensured on boot");
})();

/* ---------------- ROOT ---------------- */

app.get("/",(_req,res)=>{
 res.json({ status:"ok", service:"teos-activation-service", alive:true, uptime:process.uptime(), bootTime:new Date(bootTime).toISOString() });
});
app.get("/version", versionRouter());

app.get("/metrics",async(_req,res)=>{
  res.setHeader("Content-Type",promClient.register.contentType);
  res.send(await promClient.register.metrics());
});

app.get("/live",(_req,res)=>{
 res.json({ status:"ok", alive:true, uptime:process.uptime(), bootTime:new Date(bootTime).toISOString() });
});

app.get("/ready",(_req,res)=>{
 const checks = {};
 let allReady = true;

 try {
  db.prepare("SELECT 1").get();
  checks.database = "ok";
 } catch {
  checks.database = "unreachable";
  allReady = false;
 }

 checks.webhookSecret = DODO_WEBHOOK_SECRET ? "ok" : "missing";
 checks.adminSecret = ADMIN_SECRET ? "ok" : "missing";

 const mem = process.memoryUsage();
 res.status(allReady ? 200 : 503).json({
  status: allReady ? "ok" : "degraded",
  ready: allReady,
  checks,
  uptime: process.uptime(),
  timestamp: new Date().toISOString()
 });
});

app.get("/health",(_req,res)=>{
 const mem = process.memoryUsage();
 const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
 res.json({
   status:"ok",
   version:"3.1.0",
   uptime:process.uptime(),
   bootTime:new Date(bootTime).toISOString(),
   active_tokens:1,
   users: userCount.count,
   memory:{
    rss: Math.round(mem.rss/1024/1024)+"MB",
    heapUsed: Math.round(mem.heapUsed/1024/1024)+"MB"
   },
   hostname: os.hostname(),
   pid: process.pid,
   nodeVersion: process.version,
   timestamp:new Date().toISOString()
 });
});


/* ------------ WEBHOOK ------------ */

app.post(
["/api/dodo-webhook", "/webhook/dodo"],
express.raw({type:"application/json"}),
(req,res)=>{
try{

 if(!DODO_WEBHOOK_SECRET){
  return res.status(500).json({
   error:"webhook secret missing"
  });
 }

 const webhook=new Webhook(DODO_WEBHOOK_SECRET);

 const event=webhook.verify(
  req.body,
 {
 "webhook-id":req.header("webhook-id"),
 "webhook-signature":req.header("webhook-signature"),
 "webhook-timestamp":req.header("webhook-timestamp")
 });

 const eventId=
 event?.id || req.header("webhook-id");

 const already=db.prepare(
 `SELECT event_id FROM webhook_events WHERE event_id=?`
 ).get(eventId);

 if(already){
  return res.json({
   ok:true,
   duplicate:true
  });
 }

  const eventType =
  event?.type || event?.data?.type || "payment.succeeded";

  const meta = event?.data?.metadata || {};
  const customerMeta = event?.data?.customer?.metadata || {};
  const userId=
  String(
  meta.telegram_id ||
  meta.telegramId ||
  meta.userId ||
  customerMeta.telegram_id ||
  customerMeta.userId ||
  ""
  ).trim();

  if (eventType === "payment.cancelled" || eventType === "subscription.cancelled" || eventType === "subscription.expired") {
    if (userId) {
      db.prepare(`UPDATE users SET subscription_status='cancelled' WHERE user_id=?`).run(userId);
    }
    db.prepare(`INSERT INTO webhook_events (event_id,event_type,user_id,plan,credits) VALUES(?,?,?,?,0)`).run(eventId, eventType, userId, "");
    return res.json({ ok: true, status: "cancelled" });
  }

  if (eventType === "payment.refunded" || eventType === "chargeback") {
    if (userId) {
      db.prepare(`UPDATE users SET subscription_status='suspended' WHERE user_id=?`).run(userId);
    }
    db.prepare(`INSERT INTO webhook_events (event_id,event_type,user_id,plan,credits) VALUES(?,?,?,?,0)`).run(eventId, eventType, userId, "");
    return res.json({ ok: true, status: "suspended" });
  }

  // ONLY these event types may GRANT credits. Anything else (payment.failed,
  // payment.processing, subscription.failed, …) is acknowledged but must not
  // credit, otherwise failed payments would hand out free plans.
  const CREDITABLE_EVENTS = [
    "payment.succeeded",
    "payment.success",
    "checkout.completed",
    "subscription.active",
    "subscription.renewed",
  ];
  if (!CREDITABLE_EVENTS.includes(eventType)) {
    db.prepare(`INSERT INTO webhook_events (event_id,event_type,user_id,plan,credits) VALUES(?,?,?,?,0)`).run(eventId, eventType, userId, "");
    return res.json({ ok: true, status: "ignored", eventType });
  }

  // Dodo puts the purchased product in data.product_cart[] (an array), not
  // data.product_id. Support both shapes for safety.
  const cart = Array.isArray(event?.data?.product_cart) ? event.data.product_cart : [];
  const productId=
  event?.data?.product_id ||
  event?.data?.productId ||
  (cart[0] && (cart[0].product_id || cart[0].productId)) ||
  "";

 const plan=planFromProductId(productId);

 if(!plan){
   return res.status(400).json({
    error:"unknown product"
   });
 }

 if(!userId){
  return res.status(400).json({
   error:"missing telegram id"
  });
 }

 const priorTier = db.prepare(`SELECT tier FROM users WHERE user_id=?`).get(userId)?.tier || null;

 const user=grantCredits(userId,plan);

 const beta = applyBetaBonus(userId, plan, priorTier);

 db.prepare(`
 INSERT INTO webhook_events
 (event_id,event_type,user_id,plan,credits)
 VALUES(?,?,?,?,?)
 `).run(
 eventId,
 "payment.succeeded",
 userId,
 plan,
 creditsForPlan(plan)
 );

  console.log("credits granted",userId,plan);

  db.prepare(`
  INSERT INTO billing_transactions (user_id, event_type, plan, amount, status)
  VALUES (?, 'payment.succeeded', ?, ?, 'completed')
  `).run(userId, plan, creditsForPlan(plan));

  const subscriptionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
  UPDATE users SET subscription_status='active', subscription_expires=?, tier=?
  WHERE user_id=?
  `).run(subscriptionExpires, plan, userId);

  const finalUser = db.prepare(`SELECT * FROM users WHERE user_id=?`).get(userId);

  res.json({
   ok:true,
   user: { ...finalUser, subscription_status: "active", subscription_expires: subscriptionExpires },
   beta
  });

}catch(e){
 console.error(e);
 res.status(400).json({
  error:"webhook failed"
 });
}
});


/* ------------ SERVICE AUTH MIDDLEWARE ------------ */

function requireServiceAuth(req, res, next) {
  const token = req.headers["x-service-token"] || "";
  if (!ACTIVATION_AUTH_TOKEN) {
    return res.status(500).json({ error: "server misconfigured: ACTIVATION_AUTH_TOKEN not set" });
  }
  if (token === ACTIVATION_AUTH_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: "unauthorized" });
}

/* ------------ INPUT VALIDATION ------------ */

function validateUserId(req, res, next) {
  const userId =
    String(
      req.params?.userId ||
      req.body?.userId ||
      req.body?.telegram_id ||
      ""
    ).trim();
  if (!userId) {
    return res.status(400).json({ error: "missing userId" });
  }
  if (!/^\d{5,20}$/.test(userId)) {
    return res.status(400).json({ error: "invalid userId format" });
  }
  req.validatedUserId = userId;
  next();
}

/* ------------ CREDITS ------------ */

app.get("/credits/:userId", requireServiceAuth, validateUserId, (req,res)=>{

const userId=String(
 req.params.userId || ""
).trim();

db.prepare(`
INSERT OR IGNORE INTO users
(user_id,plan,credits,last_credit_reset)
VALUES(?, 'free', 5, datetime('now'))
`).run(userId);

const row=db.prepare(`
SELECT * FROM users
WHERE user_id=?
`).get(userId);

res.json(row);

});

/* ------------ STATUS (entitlement snapshot for teoslinker-bot) ------------ */

app.get("/status/:userId", requireServiceAuth, validateUserId, (req,res)=>{

const userId = req.validatedUserId;

db.prepare(`
INSERT OR IGNORE INTO users
(user_id,plan,credits,tier,last_credit_reset)
VALUES(?, 'free', 5, 'free', datetime('now'))
`).run(userId);

const row = db.prepare(`
SELECT * FROM users WHERE user_id=?
`).get(userId);

const plan = String(row.tier || row.plan || "free").toLowerCase();
const balance = Number(row.credits ?? 0);

const entitlement_state =
 plan === "tester" ? "beta_granted"
 : (plan === "pro" || plan === "team" || plan === "enterprise" || plan === "founder") ? "premium_granted"
 : "none";

const billing_state =
 plan === "founder" ? "founder" : (row.subscription_status || "none");

const expires = row.subscription_expires ? new Date(row.subscription_expires) : null;
let access_state = "active";
if (row.subscription_status === "suspended") access_state = "suspended";
else if (expires && expires.getTime() < Date.now()) access_state = "expired";

const consumed = db.prepare(`
SELECT COALESCE(SUM(credits_before - credits_after),0) AS total
FROM credit_usage WHERE user_id=?
`).get(userId);

res.json({
 user_id: userId,
 tier: plan,
 entitlement_state,
 billing_state,
 access_state,
 credit_state: { balance, consumed_total: Number(consumed?.total || 0) },
 time_state: { subscription_expires: row.subscription_expires || null },
});

});


/* ------------ FIXED CONSUME ------------ */

app.post("/consume", requireServiceAuth, validateUserId, (req,res)=>{

try{

const userId = req.validatedUserId;
const amount = Math.max(1, Number(req.body?.amount || 1));

db.prepare(`
INSERT OR IGNORE INTO users
(user_id,plan,credits,last_credit_reset)
VALUES(?, 'free', 5, datetime('now'))
`).run(userId);


const userPlan = db.prepare(`SELECT plan FROM users WHERE user_id=?`).get(userId);
if (userPlan && userPlan.plan === "founder") {
  const row = db.prepare(`SELECT credits FROM users WHERE user_id=?`).get(userId);
  return res.json({ success: true, credits: row.credits, founder: true });
}

const user = db.prepare(`SELECT subscription_expires FROM users WHERE user_id=?`).get(userId);
if (user && user.subscription_expires && new Date(user.subscription_expires) < new Date()) {
  return res.status(403).json({ error: "access expired" });
}

const updated=db.prepare(`
UPDATE users
SET credits=credits-?
WHERE user_id=?
AND credits>=?
`).run(amount, userId, amount);

if(updated.changes===0){
 return res.status(402).json({
  error:"no credits"
 });
}

const row=db.prepare(`
SELECT credits FROM users
WHERE user_id=?
`).get(userId);

db.prepare(`
INSERT INTO credit_usage (user_id, action, credits_before, credits_after)
VALUES (?, 'consume', ?, ?)
`).run(userId, row.credits + amount, row.credits);

return res.json({
 success:true,
 credits:row.credits
});

}catch(e){
 logger.error({ err:e, reqId: req.id },"Consume failed");

return res.status(500).json({
 error:"consume failed",
 reqId: req.id
});
}

});


/* ------------ TIER ENDPOINT ------------ */

app.get("/api/tier/:userId", requireServiceAuth, validateUserId, (req, res) => {
  const userId = req.validatedUserId;

  db.prepare(`
  INSERT OR IGNORE INTO users
  (user_id, plan, credits, tier, last_credit_reset)
  VALUES(?, 'free', 5, 'free', datetime('now'))
  `).run(userId);

  const row = db.prepare(`
  SELECT user_id, plan as tier, credits, subscription_status, subscription_expires, monthly_credits, credit_balance, last_credit_reset
  FROM users
  WHERE user_id=?
  `).get(userId);

  res.json({
    tier: row.tier || "free",
    credits: row.credits || 0,
    subscription_status: row.subscription_status || null,
    subscription_expires: row.subscription_expires || null,
    monthly_credits: row.monthly_credits || 0,
    // `credits` is the single source of truth; `credit_balance` is legacy and kept
    // for backward compatibility only (never read as authoritative).
    credit_balance: row.credits || 0,
    last_credit_reset: row.last_credit_reset || null
  });
});

/* ------------ BILLING TRANSACTIONS ------------ */

app.get("/api/billing/:userId", requireServiceAuth, validateUserId, (req, res) => {
  const userId = req.validatedUserId;

  const rows = db.prepare(`
  SELECT * FROM billing_transactions
  WHERE user_id=?
  ORDER BY created_at DESC
  LIMIT 50
  `).all(userId);

  res.json({ transactions: rows });
});

/* ------------ CREDIT USAGE LOG ------------ */

app.get("/api/usage/:userId", requireServiceAuth, validateUserId, (req, res) => {
  const userId = req.validatedUserId;

  const rows = db.prepare(`
  SELECT * FROM credit_usage
  WHERE user_id=?
  ORDER BY created_at DESC
  LIMIT 100
  `).all(userId);

  res.json({ usage: rows });
});

/* ------------ CREDIT REFILL ------------ */

app.post("/refill", requireServiceAuth, validateUserId, (req, res) => {
  const userId = req.validatedUserId;
  const amount = Number(req.body?.amount || 0);

  if (amount <= 0) {
    return res.status(400).json({ error: "invalid amount" });
  }

  const updated = db.prepare(`
  UPDATE users
  SET credits = credits + ?
  WHERE user_id=?
  `).run(amount, userId);

  const row = db.prepare(`
  SELECT credits FROM users WHERE user_id=?
  `).get(userId);

  db.prepare(`
  INSERT INTO billing_transactions (user_id, event_type, plan, amount, status)
  VALUES (?, 'refill', (SELECT plan FROM users WHERE user_id=?), ?, 'completed')
  `).run(userId, userId, amount);

  res.json({ success: true, credits: row.credits, credit_balance: row.credits });
});

/* ------------ ALPHA TESTER ACTIVATION ------------ */

const ALPHA_SECRET = process.env.ALPHA_ACTIVATION_SECRET || "";

app.post("/activate-tester", requireServiceAuth, validateUserId, (req, res) => {
  const userId = req.validatedUserId;
  const secret = String(req.body?.secret || "").trim();

  if (secret !== ALPHA_SECRET) {
    return res.status(403).json({ error: "invalid activation key" });
  }

  const existing = db.prepare(`SELECT plan, subscription_status, subscription_expires FROM users WHERE user_id=?`).get(userId);
  if (existing) {
    if (existing.plan === 'founder') {
      const user = db.prepare(`SELECT * FROM users WHERE user_id=?`).get(userId);
      return res.json({ success: true, user, already_active: true });
    }
    if (existing.plan === 'tester' && existing.subscription_status === 'active' && existing.subscription_expires && new Date(existing.subscription_expires) > new Date()) {
      return res.json({ success: true, user: existing, already_active: true });
    }
  }

  const plan = "tester";
  const credits = creditsForPlan(plan);
  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO users (user_id,plan,credits,subscription_status,subscription_expires,tier)
    VALUES(?,?,?,'active',?,?)
    ON CONFLICT(user_id) DO UPDATE SET
      plan=excluded.plan,
      credits=excluded.credits,
      subscription_status='active',
      subscription_expires=excluded.subscription_expires,
      tier=excluded.tier
  `).run(userId, plan, credits, expires, plan);
  const user = db.prepare(`SELECT * FROM users WHERE user_id=?`).get(userId);
  logger.info({ userId, action: "alpha_activation" }, "Tester activated via deep-link");
  res.json({ success: true, user });
});

// ── AUDIT LOGS ──────────────────────────────────────────────

app.post("/audit", requireServiceAuth, validateUserId, (req, res) => {
  const userId = req.validatedUserId;
  const { action, target, verdict, score, credits_used, credits_remaining } = req.body || {};
  if (!action) return res.status(400).json({ error: "missing action" });
  try {
    db.prepare(`INSERT INTO audit_logs (user_id, action, target, verdict, score, credits_used, credits_remaining) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(userId, action, target || null, verdict || null, score ?? null, credits_used ?? 0, credits_remaining ?? null);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err, userId, action }, "Failed to write audit log");
    res.status(500).json({ error: "audit_write_failed" });
  }
});

app.get("/audit/:userId", requireServiceAuth, validateUserId, (req, res) => {
  const userId = req.validatedUserId;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);
  try {
    const rows = db.prepare(`SELECT id, action, target, verdict, score, credits_used, credits_remaining, created_at FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(userId, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?`).get(userId);
    res.json({ logs: rows, total: total.count });
  } catch (err) {
    logger.error({ err, userId }, "Failed to query audit logs");
    res.status(500).json({ error: "audit_query_failed" });
  }
});

/* ------------ MANUAL GRANT ------------ */

const VALID_PLANS = ["free", "pro", "team", "enterprise", "founder", "tester"];

const grantLimiter = rateLimit({ windowMs: 60000, max: 5, message: { error: "too many grant requests" }, standardHeaders: true, legacyHeaders: false });

app.post("/grant", grantLimiter, (req, res, next) => {
const secret=req.headers["x-admin-secret"]||"";
if(!secret || secret!==process.env.ADMIN_SECRET){
 return res.status(401).json({error:"unauthorized"});
}
next();
}, validateUserId, (req, res) => {
const userId = req.validatedUserId;

const plan=String(
req.body?.plan||"starter"
).toLowerCase();

if (!VALID_PLANS.includes(plan)) {
  return res.status(400).json({ error: "invalid plan", valid: VALID_PLANS });
}

const expiresInHours = Number(req.body?.expires_in_hours) || 0;
const user=grantCredits(userId, plan, expiresInHours || undefined);

res.json({
success:true,
user
});

});

// ADMIN: bulk delete test users (x-admin-secret)
app.post("/admin/purge-users", grantLimiter, (req, res, next) => {
const secret=req.headers["x-admin-secret"]||"";
if(!secret || secret!==process.env.ADMIN_SECRET){
 return res.status(401).json({error:"unauthorized"});
}
next();
}, (req, res) => {
const ids = Array.isArray(req.body?.user_ids) ? req.body.user_ids.map(String).filter(Boolean) : [];
if (ids.length === 0 || ids.length > 100) {
  return res.status(400).json({ error: "user_ids array (1..100) required" });
}
const removed = [];
const notFound = [];
const tx = db.transaction((list) => {
  for (const id of list) {
    const row = db.prepare(`SELECT user_id, plan, credits FROM users WHERE user_id=?`).get(id);
    if (!row) { notFound.push(id); continue; }
    db.prepare(`DELETE FROM users WHERE user_id=?`).run(id);
    db.prepare(`DELETE FROM webhook_events WHERE user_id=?`).run(id);
    db.prepare(`DELETE FROM billing_transactions WHERE user_id=?`).run(id);
    db.prepare(`DELETE FROM credit_usage WHERE user_id=?`).run(id);
    db.prepare(`DELETE FROM audit_logs WHERE user_id=?`).run(id);
    db.prepare(`DELETE FROM beta_grants WHERE user_id=?`).run(id);
    removed.push({ id, plan: row.plan, credits: row.credits });
    logger.info({ userId: id, plan: row.plan }, "Admin purged test user");
  }
});
tx(ids);
res.json({ removed, notFound });
});

// ADMIN: list users (x-admin-secret) — hygiene check before go-live
app.get("/admin/users", (req, res, next) => {
const secret=req.headers["x-admin-secret"]||"";
if(!secret || secret!==process.env.ADMIN_SECRET){
 return res.status(401).json({error:"unauthorized"});
}
next();
}, (_req, res) => {
const users = db.prepare(`SELECT user_id, plan, credits, tier, subscription_status, subscription_expires FROM users ORDER BY user_id`).all();
res.json({ count: users.length, users });
});


// ── ERROR HANDLER — catches all unhandled errors ────────────
app.use((err, req, res, next) => {
  logger.error({ err, reqId: req.id }, "Unhandled error");
  if (err.type === "entity.too.large") {
    const limit = process.env.REQUEST_SIZE_LIMIT || "10kb";
    return res.status(413).json({ error: "payload_too_large", limit, reqId: req.id });
  }
  res.status(500).json({ error: "internal_error", reqId: req.id });
});

// ── GRACEFUL SHUTDOWN ──────────────────────────────────────
function shutdown(signal){
 logger.info({signal},"Shutdown signal received — closing server");
 server.close(()=>{
  logger.info("Server closed — exiting");
  process.exit(0);
 });
 setTimeout(()=>{
  logger.error("Graceful shutdown timeout — forcing exit");
  process.exit(1);
 },10000).unref();
}
process.on("SIGTERM",()=>shutdown("SIGTERM"));
process.on("SIGINT",()=>shutdown("SIGINT"));

server.listen(PORT,()=>{
 logger.info({port:PORT},"Activation service started");
});

