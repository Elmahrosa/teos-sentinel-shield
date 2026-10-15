const { consumeCredit, logAudit } = require("../../services/activation.service");
const { scanWithMcp } = require("../../services/mcp.service");
const { scanGitHubRepo, parseGitHubUrl } = require("../../services/github.service");
const { logScanToRedis } = require("../../services/redis.service");
const { emit } = require("../../services/telemetry.service");
const { getTier } = require("../../utils/scoring");
const { D } = require("../../utils/formatting");
const { formatTelegramReport, buildReportData } = require("../../services/report-format");
const { mainMenu, scanHubKeyboard } = require("../menus");
const { resolveUserTier } = require("../../lib/billing/tier-guard");
let logger;
try {
  logger = require("../../../logger.cjs").logger;
} catch {
  logger = console;
}

const userCooldowns = new Map();
const SCAN_TIMEOUT_MS = 120000;

async function safeReply(ctx, msg, fallback) {
  try {
    await ctx.reply(msg);
  } catch (err) {
    logger.error({ err, userId: ctx.from?.id }, "Primary reply failed");
    try {
      await ctx.reply(fallback || "\u2705 Done. Use /status to check credits.");
    } catch (e) {
      logger.error({ err: e, userId: ctx.from?.id }, "Fallback reply also failed");
    }
  }
}

async function scanCommand(ctx) {
  const userId = String(ctx.from.id);
  const code   = ctx.message.text.replace(/^\/scan(@\w+)?\s*/i, "").trim();

  if (!code) {
    const hubUser = await resolveUserTier(userId);
    return ctx.reply(
`\u{1F6E1}\uFE0F TEOS Sentinel \u2014 Scan
${D}
Choose what to scan. Credits cost shown per scan.
${D}
Your tier: ${hubUser.order < 3 ? '\u26AA Free' : '\u{1F7E2} Pro+'}
${D}
Tip: You can also type commands directly, e.g. /scan rm -rf /`,
      scanHubKeyboard(hubUser.order < 3)
    );
  }

  const last = userCooldowns.get(userId);
  if (last && Date.now() - last < 3000) {
    return ctx.reply("\u23F3 Please wait 3 seconds before scanning again.");
  }
  userCooldowns.set(userId, Date.now());
  ctx._scanStartedAt = Date.now();

  const user = await resolveUserTier(userId);
  const isUnlimited = user.tier === "founder" || user.tier === "enterprise";

  if (!isUnlimited && user.credits <= 0) {
    return ctx.reply(
`❌ No credits remaining
${D}
Your free scans have been used.

Use /upgrade to continue scanning.`
    );
  }

  let loading, parsedUrl, result, left;

  try {
    loading = await ctx.reply("\u{1F50D} Analyzing...");
    parsedUrl = parseGitHubUrl(code);

    const scanPromise = parsedUrl
      ? scanGitHubRepo(code, scanWithMcp)
      : scanWithMcp(code);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Scan timed out after 120s")), SCAN_TIMEOUT_MS)
    );
    result = await Promise.race([scanPromise, timeout]);

    if (result && result.error) {
      await safeReply(ctx, "\u274C " + (parsedUrl ? result.message : "Scan engine unavailable. Credit not consumed."));
      return;
    }

    if (result && result.verdict === "BLOCK") {
      left = user.credits;
      logAudit(userId, parsedUrl ? 'repo_scan' : 'scan', code, "BLOCK", result.score, 0, left);
    } else {
      try {
        left = isUnlimited ? user.credits : await consumeCredit(userId, 1);
      } catch (creditErr) {
        const detail = String(creditErr?.message || creditErr).slice(0, 200);
        logger.error({ err: creditErr, userId }, "consumeCredit failed");
        await safeReply(ctx, "\u274C Credit service unavailable. Try again shortly.\nDebug: " + detail);
        return;
      }
      logAudit(userId, parsedUrl ? 'repo_scan' : 'scan', code, result && result.verdict, result && result.score, 1, left);
    }

    const { icon: tierIcon, name: tierName } = getTier(left, user.tier);

    if (parsedUrl) {
      result.gitHub = {
        owner: result.owner,
        repo: result.repo,
        branch: result.branch,
        filesScanned: result.filesScanned,
        issuesFound: result.issuesFound,
        findings: result.findings,
      };

      logScanToRedis({
        verdict: String(result.verdict || "ALLOW").toUpperCase(),
        score: result.score,
        epistemic: "REPO_SCAN",
        rule: "GITHUB_REPO",
        ruleId: "GH",
        severity: result.verdict === "BLOCK" ? "critical" : result.verdict === "WARN" ? "medium" : "none",
        command: code,
      }, ctx);

      const msg = formatTelegramReport(result, left, tierIcon, tierName);
      await safeReply(ctx, msg, `\u2705 GitHub scan complete. Verdict: ${result.verdict} Score: ${result.score}`);
      return;
    }

    result.gitHub = null;
    const msg = formatTelegramReport(result, left, tierIcon, tierName);

    logScanToRedis({
      verdict: String(result.verdict || "WARN").toUpperCase(),
      score: result.score,
      epistemic: result.epistemic || "UNKNOWN",
      rule: result.rule || "MCP_ENGINE",
      ruleId: result.ruleId || "MCP",
      severity: result.severity || (result.verdict === "BLOCK" ? "critical" : "medium"),
      command: code,
    }, ctx);

    await safeReply(ctx, msg, `\u2705 Scan complete. Verdict: ${result.verdict} Score: ${result.score}`);
  } catch (err) {
    logger.error({ err, userId, code: code && code.slice(0, 100) }, "scanCommand unhandled error");
    require("../../services/analytics.service").recordFailedScan(userId, parsedUrl ? "github" : "scan").catch(err => { logger.warn({ err, userId }, "recordFailedScan failed"); });
    const detail = err?.message || err?.code || "unknown error";
    try {
      if (loading) {
        await ctx.reply("\u274C Scan failed unexpectedly: " + detail.slice(0, 200));
      } else {
        await ctx.reply("\u274C Scan failed to start: " + detail.slice(0, 200));
      }
    } catch (replyErr) {
      logger.warn({ err: replyErr, userId }, "Failed to send scan error reply");
    }
  }
}

module.exports = { scanCommand, userCooldowns };
