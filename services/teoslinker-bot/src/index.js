require("dotenv").config();

// Disable system proxy for all outbound HTTP/HTTPS requests
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;
process.env.NO_PROXY = "*";
process.env.no_proxy = "*";

const axios = require("axios");
axios.defaults.proxy = false;

process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err);
});

// ── CRITICAL DIAGNOSTICS ──
process.on('exit', (code) => {
  console.error(`[EXIT] Process exiting with code ${code} signal=${process.exitCode}`);
});
process.on('SIGTERM', () => {
  console.error('[SIGNAL] Received SIGTERM');
});
process.on('SIGINT', () => {
  console.error('[SIGNAL] Received SIGINT');
});
setInterval(() => {
  const m = process.memoryUsage();
  console.log(`[HEARTBEAT] alive rss=${Math.round(m.rss/1024/1024)}MB heap=${Math.round(m.heapUsed/1024/1024)}MB`);
}, 30000);
const fs = require('fs');
const crypto = require('crypto');
const { Telegraf } = require("telegraf");
const express = require('express');
const cors = require('cors');
const { validateSecrets, getConfig, USE_WEBHOOK } = require("../config.cjs");
const { logger, httpLogger } = require("../logger.cjs");
const { requestContext } = require("../request-context.cjs");
const { versionHandler } = require("../version.cjs");
const { configureHelmet } = require("./security/helmet");
const { createLimiter } = require("./security/rate-limit");
const { sanitizeRequest } = require("./security/sanitize");
const { memoryGuard } = require("./security/memory");
const { registerHealthRoutes } = require("./api/health.routes");
const { registerWebhookRoutes } = require("./api/webhook.routes");
const { registerMetricsRoutes } = require("./api/metrics.routes");
const { registerDocsRoutes } = require("./api/docs.routes");
const { getCredits, consumeCredit, getUserTier, activateTester, logAudit } = require("./services/activation.service");
const { logScanToRedis, flushRedisBuffer, shutdownRedis } = require("./services/redis.service");
const { emit, start: startTelemetry, stop: stopTelemetry } = require("./services/telemetry.service");
const { recordActivation, recordCommand, recordUpgradeClick } = require("./services/analytics.service");
const { setEmit: setDriftEmit } = require("./governance/drift-detector");
const { onTelemetryDrop } = require("./services/telemetry.service");
const { pushTelemetryDrop } = require("./governance/drift-detector");
const { D } = require("./utils/formatting");
const { mainMenu } = require("./bot/menus");
const { modelService, MODELS } = require("./services/model.service");

// ── Lazy-loaded heavy modules (deferred until first use) ──
function _lazy(fn) { let m; return () => { if (!m) m = fn(); return m; }; }
const _startCmd       = _lazy(() => require("./bot/commands/start").startCommand);
const _scanCmd        = _lazy(() => require("./bot/commands/scan").scanCommand);
const _depsCmd        = _lazy(() => require("./bot/commands/deps").depsCommand);
const _ciCmd          = _lazy(() => require("./bot/commands/ci").ciCommand);
const _creditsCmd     = _lazy(() => require("./bot/commands/credits").creditsCommand);
const _plansCmd       = _lazy(() => require("./bot/commands/plans").plansCommand);
const _upgradeCmd     = _lazy(() => require("./bot/commands/upgrade").upgradeCommand);
const _helpCmd        = _lazy(() => require("./bot/commands/help").helpCommand);
const _solanaCmd      = _lazy(() => require("./bot/commands/solana").solanaCommand);
const _evmCmd         = _lazy(() => require("./bot/commands/evm").evmCommand);
const _solanatokenCmd = _lazy(() => require("./bot/commands/solanatoken").solanaTokenCommand);
const _diligenceCmd   = _lazy(() => require("./bot/commands/diligence").diligenceCommand);
const _statusCmd      = _lazy(() => require("./bot/commands/status").sendStatus);
const _fullreportCmd  = _lazy(() => require("./bot/commands/fullreport").fullReportCommand);
const _dashboardCmd   = _lazy(() => require("./bot/commands/dashboard").dashboardCommand);
const _feedbackCmd    = _lazy(() => require("./bot/commands/feedback").feedbackCommand);
const _modelCmd       = _lazy(() => require("./bot/commands/model").modelCommand);
const _chatCmd        = _lazy(() => require("./bot/commands/chat").chatCommand);
const _webtoolsCmd    = _lazy(() => require("./bot/commands/webtools").webtoolsCommand);
const _buy1Cmd        = _lazy(() => require("./bot/commands/buy1").buy1Command);
const _verifyCmd      = _lazy(() => require("./bot/commands/verify").verifyCommand);
const _planCmd        = _lazy(() => require("./bot/commands/plan").planHandler);
const _bankingCmd     = _lazy(() => require("./bot/commands/banking").bankingCommand);
const _claudeCmd      = _lazy(() => require("./bot/commands/claude").claudeCommand);
const _actions        = _lazy(() => require("./bot/actions").registerActions);
const _processBatch   = _lazy(() => require("./bot/batch-processor").processBatch);
const _scanWithMcp    = _lazy(() => require("./services/mcp.service").scanWithMcp);
const _githubService  = _lazy(() => require("./services/github.service"));
const _reportFmt      = _lazy(() => require("./services/report-format").formatTelegramReport);
const _tierGuard      = _lazy(() => require("./lib/billing/tier-guard"));
const _detect         = _lazy(() => require("./services/detectionEngine"));
const _safetyGates    = _lazy(() => require("./governance/safety-gates"));
const _pdfGuard       = _lazy(() => require("./governance/resource-guard"));
const _reportSvc      = _lazy(() => require("./services/report.service").generateScanReport);
const _showcaseSvc    = _lazy(() => require("./services/showcase.service").generateShowcasePdf);
const _scoring        = _lazy(() => require("./utils/scoring"));

validateSecrets();
const CFG = getConfig();

const PORT = process.env.PORT || 8082;
const BOT_TOKEN = process.env.BOT_TOKEN || "";

// Config validation — log missing/invalid vars but do not crash so the health endpoint responds.
// "Required" = the bot cannot operate without it. "Optional" = only the dependent features degrade.
const NODE_ENV = process.env.NODE_ENV || "production";
const isLocalEndpoint = (v) => Boolean(v) && (v.includes("localhost") || v.includes("127.0.0.1"));

let SERVER_DEGRADED = false;
const missing = [];
if (!BOT_TOKEN || BOT_TOKEN === "placeholder") missing.push("BOT_TOKEN");
if (!process.env.ACTIVATION_API) missing.push("ACTIVATION_API");
if (missing.length > 0) {
  logger.error({ missing }, "Missing required environment variables — server running in degraded mode");
  SERVER_DEGRADED = true;
}

// MCP is an optional upstream engine used by /deps, /ci, /solanatoken, /diligence, /fullreport
// and Claude tool interception. The core /scan path no longer depends on it (in-process rules
// engine + cloud Sentinel API). A missing MCP endpoint therefore disables those features but
// must NOT mark the whole service degraded.
const MCP_ENDPOINT = process.env.MCP_API || process.env.MCP_ENGINE_URL || "";
if (!MCP_ENDPOINT) {
  logger.warn(
    { features: ["/deps", "/ci", "/solanatoken", "/diligence", "/fullreport", "/claude tools"] },
    "MCP engine not configured — dependent commands will report unavailable"
  );
} else if (isLocalEndpoint(MCP_ENDPOINT) && NODE_ENV === "production") {
  logger.warn({ MCP_API: MCP_ENDPOINT }, "MCP endpoint points to localhost in production");
}

if (isLocalEndpoint(process.env.ACTIVATION_API) && NODE_ENV === "production") {
  logger.error({ ACTIVATION_API: process.env.ACTIVATION_API }, "ACTIVATION_API points to localhost in production");
  SERVER_DEGRADED = true;
}

// Fix 4 — Runtime diagnostics: log configured endpoints at startup
logger.info({
  mcp_endpoint: process.env.MCP_API ? process.env.MCP_API.replace(/^https?:\/\//, '').split('/')[0].replace(/^[^.]+/, '***') : 'NOT SET',
  activation_endpoint: process.env.ACTIVATION_API ? process.env.ACTIVATION_API.replace(/^https?:\/\//, '').split('/')[0].replace(/^[^.]+/, '***') : 'NOT SET',
  mode: USE_WEBHOOK ? "webhook" : "polling",
  node_env: NODE_ENV,
  bot_token_configured: !!BOT_TOKEN && BOT_TOKEN !== "placeholder",
}, "Runtime configuration");

let releasePolling = false;
let releaseTimer = null;

const LOCKFILE = './.teos-bot.lock';
function acquireLock() {
  try {
    if (fs.existsSync(LOCKFILE)) {
      const existingPid = parseInt(fs.readFileSync(LOCKFILE, 'utf-8').trim(), 10);
      if (existingPid && !isNaN(existingPid)) {
        try {
          process.kill(existingPid, 0);
          logger.error({ pid: existingPid, lockfile: LOCKFILE }, "Another instance is running — exiting");
          process.exit(1);
        } catch {
          logger.warn({ pid: existingPid, lockfile: LOCKFILE }, "Stale lockfile (process dead) — removing");
          fs.unlinkSync(LOCKFILE);
        }
      } else {
        fs.unlinkSync(LOCKFILE);
      }
    }
  } catch (err) {
    logger.debug({ err: err?.message }, "Lockfile cleanup skipped");
  }
  try {
    fs.writeFileSync(LOCKFILE, String(process.pid));
    logger.info({ pid: process.pid, lockfile: LOCKFILE }, "Singleton lock acquired");
  } catch (err) {
    logger.error({ err, lockfile: LOCKFILE }, "Failed to acquire singleton lock");
    process.exit(1);
  }
}
function releaseLock() {
  try {
    if (fs.existsSync(LOCKFILE)) fs.unlinkSync(LOCKFILE);
  } catch (err) {
    logger.error({ err: err?.message }, "Failed to release lockfile");
  }
}
acquireLock();

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const RUNTIME_ALLOWED = new Map();
const ALLOWED_TTL = 3600000;
function setAllowed(id) {
  RUNTIME_ALLOWED.set(id, Date.now() + ALLOWED_TTL);
  if (RUNTIME_ALLOWED.size > 10000) {
    const cutoff = Date.now();
    for (const [key, expiry] of RUNTIME_ALLOWED) {
      if (expiry < cutoff) RUNTIME_ALLOWED.delete(key);
    }
  }
}
function isAllowed(id) {
  const expiry = RUNTIME_ALLOWED.get(id);
  if (!expiry) return false;
  if (expiry < Date.now()) { RUNTIME_ALLOWED.delete(id); return false; }
  return true;
}

const ALPHA_SECRET = process.env.ALPHA_ACTIVATION_SECRET || "";
const BETA_SECRET = process.env.BETA_ACTIVATION_SECRET || "beta";
const PUBLIC_ACTIVATION_PAYLOADS = new Set(["beta", "alpha", "teos2026"]);
const bot = new Telegraf(BOT_TOKEN);

bot.use(async (ctx, next) => {
  if (ctx.message?.text?.startsWith('/')) {
    const cmd = ctx.message.text.split(/\s/)[0].replace(/@\w+$/, '').toLowerCase().slice(1);
    recordCommand(String(ctx.from?.id || 'unknown'), cmd).catch(err => { logger.warn({ err, userId: ctx.from?.id, cmd }, "recordCommand failed"); });
  }
  return next();
});

const app = express();

app.use(configureHelmet());
app.use(createLimiter());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
}));

app.use(express.json({ limit: (process.env.REQUEST_SIZE_LIMIT || '10kb') }));
app.use(express.urlencoded({ limit: (process.env.REQUEST_SIZE_LIMIT || '10kb'), extended: false }));
app.use(httpLogger);
app.use(requestContext({ logFn: (e) => logger.info(e, 'request') }));
app.use(sanitizeRequest);
app.use(memoryGuard);
app.set('trust proxy', parseInt(process.env.TRUST_PROXY || '1'));

registerHealthRoutes(app, releasePollingSession, SERVER_DEGRADED);
registerWebhookRoutes(app, bot, CFG, USE_WEBHOOK);
registerMetricsRoutes(app);
registerDocsRoutes(app);

app.get('/version', versionHandler);

// ── Showcase PDF routes ──
app.get('/showcase/:type', async (req, res) => {
  const { type } = req.params;
  const validTypes = ['ai-command', 'solana', 'evm', 'token', 'diligence'];
  if (!validTypes.includes(type)) {
    return res.status(404).json({ error: 'Unknown showcase type. Valid: ' + validTypes.join(', ') });
  }
  try {
    const pdf = await _showcaseSvc()(type);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=teos-showcase-${type}.pdf`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
  } catch (err) {
    logger.error({ err, type }, 'Showcase PDF generation failed');
    res.status(500).json({ error: 'Failed to generate showcase PDF' });
  }
});

app.get('/showcase', (req, res) => {
  res.json({
    available: ['ai-command', 'solana', 'evm', 'token', 'diligence'],
    urls: {
      'ai-command': '/showcase/ai-command',
      solana: '/showcase/solana',
      evm: '/showcase/evm',
      token: '/showcase/token',
      diligence: '/showcase/diligence',
    },
    description: 'Downloadable showcase PDFs demonstrating TEOS Sentinel detection capabilities.',
  });
});

app.use((err, req, res, next) => {
  const semanticTag = err.type === 'entity.too.large' ? 'payload_too_large'
    : err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' ? 'service_unavailable'
    : err.status === 429 ? 'rate_limited'
    : err.status === 413 ? 'payload_too_large'
    : err.status === 403 ? 'policy_violation'
    : err.status === 401 ? 'unauthorized'
    : err.name === 'TimeoutError' || err.message?.includes('timeout') ? 'timeout'
    : 'internal_error';

  logger.error({ err, reqId: req.id, semanticTag }, 'Unhandled error');
  res.status(err.status || 500).json({
    error: semanticTag,
    reqId: req.id,
    ...(err.message && { detail: err.message }),
  });
});

const BIND_ADDR = (process.env.BIND_ADDRESS || '0.0.0.0').trim();
app.listen(PORT, BIND_ADDR, () => {
  logger.info({ bind: BIND_ADDR, port: PORT }, `HTTP server listening on ${BIND_ADDR}:${PORT}`);
  setDriftEmit(emit);
  onTelemetryDrop(pushTelemetryDrop);
  startTelemetry();
  startBot().catch(err => logger.error({ err }, "Bot startup failed — server still running"));
});

// ── Bot Commands ──
bot.start(async (ctx) => {
  const userId = String(ctx.from.id);
  const payload = (ctx.startPayload || ctx.message?.text?.replace(/^\/start(@\w+)?\s*/i, "").trim() || "").trim();

  const isPublicPayload = payload && PUBLIC_ACTIVATION_PAYLOADS.has(payload.toLowerCase());
  const isDeepLink = payload && (
    isPublicPayload ||
    (ALPHA_SECRET && safeCompare(payload, ALPHA_SECRET)) ||
    (BETA_SECRET && safeCompare(payload, BETA_SECRET))
  );

  if (isDeepLink) {
    const isPublic = isPublicPayload;
    const isBeta = isPublic || (BETA_SECRET && safeCompare(payload, BETA_SECRET));

    if (isPublic) {
      try {
        await activateTester(userId, payload);
      } catch (e) {
        logger.warn({ userId, payload, err: e?.message }, "Public activation: activation service unavailable, using local fallback");
      }
      setAllowed(userId);

      const tier = "beta_tester";
      const credits = 200;
      recordActivation(userId, tier).catch(err => { logger.warn({ err, userId, tier }, "recordActivation failed"); });

      await ctx.reply(
`🔷 *TEOS Sentinel* — Beta Access Activated
${D}
Tier   : 🧪 Beta Tester
Credits: ✨ ${credits}
${D}
Welcome to the TEOS Sentinel beta. All scanning commands are live:

/scan          — Analyze code or command
/scan-banking  — Banking compliance audit (CBE/FRA)
/solana        — Scan Solana programs
/evm           — Scan EVM smart contracts
/solanatoken   — Basic token intelligence
/deps          — Dependency vulnerability scan
/ci            — CI/CD security audit
/github        — Scan a GitHub repository
/report        — Generate PDF scan report
/diligence     — Premium due diligence
/fullreport    — Full token risk report PDF
/status        — System dashboard
/upgrade       — Upgrade plan
/dashboard     — Open Command Center
/help          — Quick reference`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    try {
      await activateTester(userId, payload);
      setAllowed(userId);
      const sub = await getUserTier(userId);
      recordActivation(userId, sub.tier || 'unknown').catch(err => { logger.warn({ err, userId, tier: sub.tier }, "recordActivation failed"); });

      if (sub.tier === "founder") {
        await ctx.reply(
`🔷 *TEOS Sentinel* — Activation
${D}
Tier   : 👑 Founder
Credits: ∞
${D}
Permanent access granted.`,
          { parse_mode: "Markdown" }
        );
      } else {
        await ctx.reply(
`🔷 *TEOS Sentinel* — Beta Activation
${D}
Tier   : 🧪 Beta Tester
Credits: ✨ ${sub.credits}
${D}

Try the commands below:

/scan          — Analyze code or command
/scan-banking  — Banking compliance audit (CBE/FRA)
/solana        — Scan Solana programs
/evm           — Scan EVM smart contracts
/solanatoken   — Basic token intelligence
/deps          — Dependency vulnerability scan
/ci            — CI/CD security audit
/github        — Scan a GitHub repository
/report        — Generate PDF scan report
/diligence     — Premium due diligence
/fullreport    — Full token risk report PDF

Use /plans to view your allocation details.`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (e) {
      const errorDetail = {
        userId,
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
        code: e?.code
      };
      logger.error({ err: errorDetail }, "Activation failed");
      await ctx.reply(
`🔷 *Activation Pending*
${D}
We couldn't complete your activation right now. This is a temporary issue.

Please contact ayman@teosegypt.com and mention your Telegram ID: \`${userId}\``,
        { parse_mode: "Markdown" }
      );
    }
    return;
  }

  return _startCmd()(ctx);
});

const commandHandlers = {
  scan: (...a) => _scanCmd()(...a),
  deps: (...a) => _depsCmd()(...a),
  ci: (...a) => _ciCmd()(...a),
  credits: (...a) => _creditsCmd()(...a),
  plans: (...a) => _plansCmd()(...a),
  upgrade: (...a) => _upgradeCmd()(...a),
  status: (...a) => _statusCmd()(...a),
  help: (...a) => _helpCmd()(...a),
  solana: (...a) => _solanaCmd()(...a),
  'scan-solana': (...a) => _solanaCmd()(...a),
  evm: (...a) => _evmCmd()(...a),
  solanatoken: (...a) => _solanatokenCmd()(...a),
  diligence: (...a) => _diligenceCmd()(...a),
  fullreport: (...a) => _fullreportCmd()(...a),
  dashboard: (...a) => _dashboardCmd()(...a),
  feedback: (...a) => _feedbackCmd()(...a),
  claude: (...a) => _claudeCmd()(...a),
  model: (...a) => _modelCmd()(...a),
  chat: (...a) => _chatCmd()(...a),
  webtools: (...a) => _webtoolsCmd()(...a),
  // Single source of truth: these delegate to the named handlers defined below
  // (also registered with bot.command). Previously the full bodies were duplicated
  // here and in bot.command(...), which drifted out of sync.
  github: (ctx) => githubCommand(ctx),
  report: (ctx) => reportCommand(ctx)
};

bot.on('text', async (ctx, next) => {
  const text = ctx.message.text;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const commandLines = lines.filter(l => l.match(/^\/\w+/));
  
  if (commandLines.length >= 2) {
    try {
      const batchResult = await _processBatch()(ctx, commandHandlers);
      if (batchResult && batchResult.status !== 'rejected') {
        return;
      }
    } catch (err) {
      logger.error({ 
        err, 
        userId: ctx.from?.id,
        stack: err.stack,
        message: err.message,
        text: text.slice(0, 200)
      }, "Batch processing error in text handler");
      
      try {
        await ctx.reply(`❌ Batch processing failed: ${err.message}`);
      } catch (replyErr) {
        logger.error({ err: replyErr }, "Failed to send batch error reply");
      }
      return;
    }
  }
  
  return next();
});

bot.command("scan", (...a) => _scanCmd()(...a));
bot.command("scan_banking", (...a) => _bankingCmd()(...a));
bot.command("deps", (...a) => _depsCmd()(...a));
bot.command("ci", (...a) => _ciCmd()(...a));
bot.command("credits", (...a) => _creditsCmd()(...a));
bot.command("plans", (...a) => _planCmd()(...a));
bot.command("upgrade", (...a) => _planCmd()(...a));
bot.command("status", (ctx) => _statusCmd()(ctx));
bot.command("help", (...a) => _helpCmd()(...a));
bot.command("solana", (...a) => _solanaCmd()(...a));
bot.command("scan-solana", (...a) => _solanaCmd()(...a));
bot.command("evm", (...a) => _evmCmd()(...a));
bot.command("solanatoken", (...a) => _solanatokenCmd()(...a));
bot.command("diligence", (...a) => _diligenceCmd()(...a));
bot.command("fullreport", (...a) => _fullreportCmd()(...a));
bot.command("dashboard", (...a) => _dashboardCmd()(...a));
bot.command("feedback", (...a) => _feedbackCmd()(...a));
// Always register /claude so the command is discoverable; the handler itself reports a clear
// message when ANTHROPIC_API_KEY (or the SDK) is unavailable instead of silently disappearing.
bot.command("claude", (...a) => _claudeCmd()(...a));
bot.command("model", (...a) => _modelCmd()(...a));
bot.command("chat", (...a) => _chatCmd()(...a));
bot.command("webtools", (...a) => _webtoolsCmd()(...a));
bot.command("buy1", (...a) => _buy1Cmd()(...a));
bot.command("verify", (...a) => _verifyCmd()(...a));

// Text hearing for plan/upgrade variations (Arabic and common misspellings)
bot.hears(/^(plan|plans|upgrade|pricing|الباقة|الباقات|ابجريد|بلان)$/i, ctx => _planCmd()(ctx));

const ALLOWED_PROTECT_CMDS = ["/protect", "/automod"];
const protectHandler = async (ctx) => {
  if (ctx.chat.type === "private") {
    return ctx.reply("\u{1F6E1}\uFE0F Protection mode is for groups only. Add me to a group and make me admin.");
  }
  const fullText = ctx.message.text;
  const cmd = fullText.split(/\s/)[0].replace(/@\w+$/, "").toLowerCase();
  if (!ALLOWED_PROTECT_CMDS.includes(cmd)) {
    return ctx.reply("\u274C Unknown protection command.");
  }
  const args = fullText.slice(cmd.length).replace(/^@\w+\s*/, "").trim().toLowerCase();
  const chatId = String(ctx.chat.id);

  if (args === "on") {
    try {
      const admins = await ctx.getChatAdministrators();
      const botId = ctx.botInfo.id;
      const isAdmin = admins.some(a => a.user.id === botId);
      if (!isAdmin) {
        return ctx.reply("\u274C I need to be an admin to enable protection mode. Promote me first.");
      }
    } catch (err) {
      logger.error({ err, chatId }, "Failed to check admin status for protect");
      return ctx.reply("\u274C Could not verify admin status. Make sure I'm an admin in this group.");
    }
    _detect().setGroupProtection(chatId, true);
    await ctx.reply(
`\u{1F6E1}\uFE0F *TEOS Protection* \u2014 ACTIVE
${D}
All messages will be monitored for dangerous content.
Detected threats will be flagged with WARN/BLOCK/REVIEW.
Admins will be alerted on critical findings.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (args === "off") {
    _detect().setGroupProtection(chatId, false);
    await ctx.reply("\u{1F6E1}\uFE0F TEOS Protection \u2014 disabled.");
    return;
  }

  const active = _detect().isGroupProtected(chatId);
  await ctx.reply(
`\u{1F6E1}\uFE0F *TEOS Protection Status*
${D}
Group: ${ctx.chat.title || "this chat"}
Protection: ${active ? "\u2705 ACTIVE" : "\u26AA INACTIVE"}
${D}
Commands:
/protect on   \u2014 Enable auto-moderation
/protect off  \u2014 Disable auto-moderation
/automod on   \u2014 Same as /protect on
/automod off  \u2014 Same as /protect off`,
    { parse_mode: "Markdown" }
  );
};

bot.command("protect", protectHandler);
bot.command("automod", protectHandler);

async function githubCommand(ctx) {
  const userId = String(ctx.from.id);

  const gate = await _tierGuard().requireTier(ctx, "github");
  if (!gate.allowed) return ctx.reply(gate.reason);

  const user = await _tierGuard().resolveUserTier(userId);
  const isUnlimited = user.tier === "founder" || user.tier === "enterprise";

  if (!isUnlimited && user.credits < 15) {
    return ctx.reply("\u274C Not enough credits for GitHub scan (requires 15).");
  }

  const url = ctx.message.text.replace(/^\/github(@\w+)?\s*/i, "").trim();
  if (!url) {
    return ctx.reply(
`\u{1F6E1}\uFE0F GitHub Repo Scanner
${D}
Scan a public GitHub repository for security issues.

Usage:
/github https://github.com/owner/repo

Example:
/github https://github.com/expressjs/express`
    );
  }

  try {
    const loading = await ctx.reply("\u{1F50D} Scanning GitHub repository...");
    const ghStart = Date.now();

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("GitHub scan timed out after 120s")), 120000)
    );
    const result = await Promise.race([_githubService().scanGitHubRepo(url, _scanWithMcp()), timeout]);

    emit("runtime", { action: "github_scan", duration: Date.now() - ghStart, filesScanned: result.filesScanned || 0, issuesFound: result.issuesFound || 0 });

    if (result.error) {
      return ctx.reply(`\u274C ${result.message}`);
    }

    result.gitHub = {
      owner: result.owner,
      repo: result.repo,
      branch: result.branch,
      filesScanned: result.filesScanned,
      issuesFound: result.issuesFound,
      findings: result.findings,
    };

    if (result.verdict === "BLOCK") {
      logAudit(userId, 'github_scan', url, "BLOCK", result.score, 0, user.credits);
      await ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 GitHub Scan\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
      return { verdict: result.verdict, score: result.score, filesScanned: result.filesScanned, issuesFound: result.issuesFound };
    }

    const remaining = isUnlimited ? user.credits : await consumeCredit(userId, 15);
    logAudit(userId, 'github_scan', url, result.verdict, result.score, 15, remaining);
    const { icon: tierIcon, name: tierName } = _scoring().getTier(remaining, user.tier);
    const msg = _reportFmt()(result, remaining, tierIcon, tierName);

    await ctx.reply(msg);
    return { verdict: result.verdict, score: result.score, filesScanned: result.filesScanned, issuesFound: result.issuesFound };
  } catch (err) {
    logger.error({ err, userId, url: url && url.slice(0, 100) }, "/github unhandled error");
    try { await ctx.reply("\u274C GitHub scan failed unexpectedly. Try again."); } catch (e) { logger.error({ err: e, userId }, "github error reply also failed"); }
  }
}
bot.command("github", githubCommand);

async function reportCommand(ctx) {
  const gate = await _tierGuard().requireTier(ctx, "reports");
  if (!gate.allowed) return ctx.reply(gate.reason);

  const userId = String(ctx.from.id);
  const args = ctx.message.text.replace(/^\/report(@\w+)?\s*/i, "").trim();
  if (!args) {
    return ctx.reply(
`\u{1F6E1}\uFE0F PDF Report Generator
${D}
Generate a PDF security report.

Usage:
/report <code or command to scan>

/report https://github.com/owner/repo

Example:
/report rm -rf /`
    );
  }

  const parsedUrl = _githubService().parseGitHubUrl(args);
  const minCredits = parsedUrl ? 15 : 2;

  const credits = await getCredits(userId);
  if (credits < minCredits) {
    return ctx.reply(`\u274C Not enough credits (requires ${minCredits}).`);
  }

  try {
    await ctx.reply("\u{1F4CB} Generating PDF report...");
    const reportStart = Date.now();

    const pdfGuard = _pdfGuard().acquirePdfGeneration();
    if (!pdfGuard.allowed) {
      return ctx.reply("\u274C " + pdfGuard.reason);
    }

    let scanResult;
    if (parsedUrl) {
      scanResult = await _githubService().scanGitHubRepo(args, _scanWithMcp());
      if (scanResult.error) {
        _pdfGuard().releasePdfGeneration();
        return ctx.reply("\u274C " + scanResult.message);
      }
      scanResult.gitHub = {
        owner: scanResult.owner,
        repo: scanResult.repo,
        branch: scanResult.branch,
        filesScanned: scanResult.filesScanned,
        issuesFound: scanResult.issuesFound,
        findings: scanResult.findings,
      };
    } else {
      scanResult = await _scanWithMcp()(args);
    }

    if (scanResult.verdict === "BLOCK") {
      logAudit(userId, parsedUrl ? 'report_repo' : 'report', args, "BLOCK", scanResult.score, 0, credits);
      await ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 Report\n\u2500\nVerdict: *BLOCK*\nScore: ${scanResult.score}/100\n\u2500\nNo credit consumed.`);
      // Still emit the evidence PDF for a blocked threat (no credit consumed).
      try {
        const pdf = await _reportSvc()(scanResult, args, credits);
        await ctx.reply("\u{1F4C4} Evidence report \u2014 sending...");
        await ctx.replyWithDocument({ source: pdf, filename: `teos-scan-report-${Date.now()}.pdf` });
        emit("runtime", { action: "pdf_report", duration: Date.now() - reportStart, pdfSize: pdf.length });
      } catch (err) {
        logger.error({ err, userId }, "BLOCK evidence report failed");
      } finally { _pdfGuard().releasePdfGeneration(); }
      return { verdict: scanResult.verdict, score: scanResult.score };
    }

    try {
      const remaining = await consumeCredit(userId, minCredits);
      logAudit(userId, parsedUrl ? 'report_repo' : 'report', args, scanResult.verdict, scanResult.score, minCredits, remaining);
      const pdf = await _reportSvc()(scanResult, args, remaining);

      await ctx.reply("\u{1F4C4} Report ready — sending...");
      await ctx.replyWithDocument({ source: pdf, filename: `teos-scan-report-${Date.now()}.pdf` });
      emit("runtime", { action: "pdf_report", duration: Date.now() - reportStart, pdfSize: pdf.length });
      return { verdict: scanResult.verdict, score: scanResult.score };
    } catch (err) {
      await ctx.reply("\u274C Failed to generate report.");
      emit("runtime", { action: "pdf_report", duration: Date.now() - reportStart, error: true });
    } finally { _pdfGuard().releasePdfGeneration(); }
  } catch (err) {
    logger.error({ err, userId, args: args && args.slice(0, 100) }, "/report unhandled error");
    try { await ctx.reply("\u274C Report failed unexpectedly. Try again."); } catch (e) { logger.error({ err: e, userId }, "report error reply also failed"); }
  }
}
bot.command("report", reportCommand);

bot.on("text", async (ctx) => {
  const raw = ctx.message.text;
  const modelAliases = {
    'llama3': 'llama3-8b', 'llama3-8b': 'llama3-8b',
    'llama3-70b': 'llama3-70b',
    'qwen': 'qwen',
    'openai': 'openai-20b',
    'openai-20b': 'openai-20b',
    'openai-120b': 'openai-120b',
  };
  const aliasMatch = raw.trim().match(/^\/(llama3(?:[-_]?(?:8b|70b))?|qwen|openai(?:[-_]?(?:20b|120b))?)$/i);
  if (aliasMatch) {
    const mapped = modelAliases[aliasMatch[1].toLowerCase()];
    if (mapped) {
      ctx.message.text = `/model ${mapped}`;
      return _modelCmd()(ctx);
    }
  }
  if (raw.startsWith("/")) return;

  const text = raw;
  const detection = _detect().detectContentType(text);
  const chatId = String(ctx.chat.id);
  const isProtected = _detect().isGroupProtected(chatId);

  if (isProtected && ctx.chat.type !== "private") {
    if (detection.type !== "unknown") {
      try {
        const loading = await ctx.reply(
`\u{1F6E1}\uFE0F *Protection* \u2014 ${detection.label} detected
${D}
Auto-scanning...`,
          { parse_mode: "Markdown" }
        );
        ctx._detectedDomains = detection.domains || [];
        await _detect().autoScan(detection.type, text, ctx);
        const userLabel = ctx.from?.username ? `@${ctx.from.username}` : `${ctx.from?.first_name || "Unknown"}`;
        await ctx.reply(
`\u{1F514} *Security Event Logged*
User: ${userLabel}
Type: ${detection.label}
Action: Auto-scanned`,
          { parse_mode: "Markdown" }
        );
      } catch (err) {
        logger.error({ err, chatId, userId: ctx.from?.id }, "Protection auto-scan failed");
      }
    }
    return;
  }

  if (detection.type !== "unknown" && detection.confidence >= 0.85) {
    try {
      const loading = await ctx.reply(
`\u{1F6E1}\uFE0F *TEOS* \u2014 ${detection.label} detected
${D}
Auto-analyzing...`,
        { parse_mode: "Markdown" }
      );
      ctx._detectedDomains = detection.domains || [];
      await _detect().autoScan(detection.type, text, ctx);
    } catch (err) {
      logger.error({ err, userId: ctx.from?.id }, "Auto-detect scan failed");
      await ctx.reply(
`\u{1F6E1}\uFE0F Use /scan to analyze code
${D}
Example:
/scan ${text.slice(0, 80)}`
      );
    }
    return;
  }

  await ctx.reply(
`\u{1F6E1}\uFE0F Use /scan to analyze code
${D}
Example:
/scan ${text.slice(0, 80)}`
  );
});

_actions()(bot);

bot.catch((err, ctx) => {
  const errorDetails = {
    message: err?.message || err?.error?.message || 'Unknown error',
    stack: err?.stack || err?.error?.stack,
    code: err?.code || err?.error?.code,
    response: err?.response?.data || err?.error?.response?.data,
    userId: ctx?.from?.id,
    chatId: ctx?.chat?.id,
    command: ctx?.message?.text?.slice(0, 100)
  };
  logger.error(errorDetails, "Bot global error handler");
  try { ctx.reply("\u274C An unexpected error occurred. Please try again."); } catch (e) {
    logger.error({ err: e }, "Failed to send global error reply");
  }
});

// ── Provider Health Check ──
(async function checkProviderHealth() {
  if (process.env.ANTHROPIC_API_KEY && modelService.isModelAvailable('claude')) {
    try {
      const { claudeService } = require('./services/claude.service');
      const ok = await withTimeout(claudeService.initialize(), 10000);
      if (!ok) {
        modelService.markProviderUnhealthy('anthropic', 'Claude SDK initialization failed at startup');
        logger.warn('Anthropic provider marked unhealthy at startup — SDK init failed');
      } else {
        logger.info('Anthropic provider healthy at startup');
      }
    } catch (err) {
      modelService.markProviderUnhealthy('anthropic', err.message);
      logger.warn({ err: err.message }, 'Anthropic provider marked unhealthy at startup');
    }
  }
})().catch(err => logger.error({ err }, 'Provider health check error'));

// ── Safety Gates Check ──
if (process.env.NODE_ENV === "production" && process.env.SKIP_SAFETY_GATES !== "true") {
  _safetyGates().runAll().then((gates) => {
    if (!_safetyGates().allPassed()) {
      logger.error({ failed: _safetyGates().failures() }, "Safety gates check failed — unsafe deployment");
    } else {
      logger.info("All safety gates passed");
    }
  }).catch(err => logger.error({ err }, "Safety gates check error"));
}

function isPollingConflict(err) {
  return err?.response?.error_code === 409 ||
         (err?.message && err.message.includes("409")) ||
         (err?.description && err.description.includes("409"));
}

async function launchWithRetry(bot, attempt) {
  if (!BOT_TOKEN || BOT_TOKEN === "placeholder") {
    logger.warn("BOT_TOKEN not configured — bot not started. Set BOT_TOKEN in Railway env vars.");
    return;
  }
  try {
    await bot.launch();
  } catch (err) {
    logger.error({ err, attempt }, `Bot polling failed`);
    if (isPollingConflict(err)) {
      if (releasePolling) {
        const delay = 60000;
        logger.info({ delay, attempt }, "Docker taking over — retrying in 1 minute");
        await new Promise(r => setTimeout(r, delay));
        return launchWithRetry(bot, attempt);
      }
      const delay = Math.min(5000 * Math.pow(2, Math.min(attempt, 6)), 60000);
      logger.info({ delay, nextAttempt: attempt + 1 }, "Another bot instance is polling — retrying");
      await new Promise(r => setTimeout(r, delay));
      return launchWithRetry(bot, attempt + 1);
    }
    logger.error({ err, attempt }, "Bot polling exhausted retries");
  }
}

async function releasePollingSession(minutes = 5) {
  releasePolling = true;
  if (!USE_WEBHOOK) bot.stop("SIGINT");
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = setTimeout(() => {
    releasePolling = false;
    releaseTimer = null;
    logger.info("Release timer expired — polling retry enabled");
  }, minutes * 60 * 1000);
  logger.info({ duration_minutes: minutes }, "Docker takeover — polling released");
}

// ── Launch ──
async function withTimeout(promise, ms) {
  const timer = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms));
  return Promise.race([promise, timer]);
}

async function startBot() {
  if (!BOT_TOKEN || BOT_TOKEN === "placeholder") {
    logger.warn("BOT_TOKEN not configured — bot commands not registered. Set BOT_TOKEN in Railway env vars.");
    return;
  }
  try {
    const commands = [
      { command: "start",   description: "Open TEOS dashboard" },
      { command: "scan",    description: "Scan code or command" },
      { command: "scan_banking", description: "Banking compliance audit (CBE/FRA)" },
      { command: "solana",  description: "Scan Solana programs" },
      { command: "scan_solana", description: "Scan Solana programs" },
      { command: "evm",     description: "Scan EVM smart contracts" },
      { command: "solanatoken", description: "Basic Solana token scan (5cr)" },
      { command: "deps",    description: "Pro dependency scan" },
      { command: "webtools", description: "Website security scanner" },
      { command: "ci",      description: "CI/CD security audit" },
      { command: "github",  description: "Scan a GitHub repository" },
      { command: "report",  description: "Generate PDF scan report" },
      { command: "diligence",   description: "Premium due diligence report (15cr)" },
      { command: "fullreport", description: "Full token risk report PDF (20cr)" },
      { command: "credits", description: "View credits and plan" },
      { command: "plans",   description: "View pricing plans" },
      { command: "upgrade", description: "Upgrade account" },
      { command: "status",  description: "Check system health" },
      { command: "protect",  description: "Group protection (on/off/status)" },
      { command: "automod",  description: "Group auto-moderation (on/off/status)" },
      { command: "dashboard", description: "Open Command Center" },
      { command: "feedback", description: "Report issues or suggestions" },
      { command: "model",  description: "Select AI model" },
      { command: "llama3",  description: "Llama 3 8B — free chat" },
      { command: "qwen",    description: "Qwen 3 32B — free GPT-like chat" },
      { command: "openai",  description: "OpenAI GPT-OSS 20B — free via Groq" },
      { command: "chat",   description: "Chat with AI through TEOS firewall" },
      { command: "claude", description: "Claude agent with TEOS firewall (5cr)" },
      { command: "help",    description: "How to use TEOS" },
    ];
    await withTimeout(bot.telegram.setMyCommands(commands), 15000);
    console.log("Bot commands registered with Telegram");

    await withTimeout(bot.telegram.setMyDescription(
      "TEOS Sentinel \u2014 AI execution firewall for code, repos, and agents.\n\n" +
      "Scan code, Solana programs, EVM contracts, GitHub repos, dependencies, and CI/CD pipelines.\n\n" +
      "\u{1F310} https://sentinel.teosegypt.com"
    ), 15000);
    await withTimeout(bot.telegram.setMyShortDescription(
      "TEOS Sentinel \u2014 AI security scanning for code & agents \u{1F6E1}\uFE0F"
    ), 15000);
    console.log("Bot profile description updated");
  } catch (err) {
    console.warn("setMyCommands failed:", err.message);
  }

  emit("runtime", { action: "startup", mode: USE_WEBHOOK ? "webhook" : "polling" });

  let usePolling = !USE_WEBHOOK;

  if (USE_WEBHOOK) {
    logger.info("Webhook mode enabled — probing health before registration");
    try {
      const probe = await withTimeout(axios.get(`${CFG.webhookUrl}/health`, { timeout: 5000 }), 6000);
      if (probe.data && probe.data.status === "ok") {
        logger.info("Bot health endpoint reachable — proceeding with webhook");
      } else {
        throw new Error(`Health probe returned unexpected status: ${JSON.stringify(probe.data)}`);
      }
    } catch (err) {
      logger.warn({ err: err.message }, "Webhook URL unreachable — forcing polling mode");
      usePolling = true;
    }
  }

  if (!usePolling) {
    if (CFG.webhookSecret) bot.secretToken = CFG.webhookSecret;
    try {
      const webhookUrl = `${CFG.webhookUrl}/webhook/${BOT_TOKEN.split(":")[1]}`;
      await withTimeout(bot.telegram.setWebhook(webhookUrl, {
        secret_token: CFG.webhookSecret || undefined,
        drop_pending_updates: true,
      }), 20000);
      logger.info("Webhook registered with Telegram successfully");
      logger.info("Polling disabled — webhook confirmed");
    } catch (err) {
      logger.error({ err }, "Webhook registration failed — falling back to polling");
      usePolling = true;
    }
  }

  if (usePolling) {
    logger.warn("Polling mode active — webhook bypassed");
    try { await withTimeout(bot.telegram.deleteWebhook(), 10000); logger.info("Stale webhook deleted"); } catch (e) { logger.warn({ err: e }, "Could not delete webhook"); }
    launchWithRetry(bot, 1);
  }
}



async function shutdown() {
  if (!USE_WEBHOOK) bot.stop("SIGINT");
  await stopTelemetry();
  await shutdownRedis();
  releaseLock();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

module.exports = { releasePollingSession };
