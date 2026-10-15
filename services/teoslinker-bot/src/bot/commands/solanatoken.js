const { consumeCredit, logAudit } = require("../../services/activation.service");
const { sendTokenScan } = require("../../services/token.service");
const { logScanToRedis } = require("../../services/redis.service");
const { emit } = require("../../services/telemetry.service");
const { getTier } = require("../../utils/scoring");
const { D } = require("../../utils/formatting");
const { resolveUserTier } = require("../../lib/billing/tier-guard");
const { Markup } = require("telegraf");
let logger;
try {
  logger = require("../../../logger.cjs").logger;
} catch {
  logger = console;
}

function renderRiskBar(score) {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  const blocks = "\u2588".repeat(filled) + "\u2591".repeat(empty);
  return blocks;
}

function formatTokenReport(result) {
  const r = result.result || result;
  const meta = r.metadata || {};
  const whale = r.whaleMetrics || {};
  const authority = r.authorityAnalysis || {};
  const rug = r.rugPullIndicators || {};
  const findings = r.findings || [];

  const mintShort = r.mintAddress
    ? r.mintAddress.slice(0, 6) + "..." + r.mintAddress.slice(-4)
    : "Unknown";

  const authorityStatus = !authority.mintAuthorityRevoked
    ? "\u274C Mint authority ACTIVE"
    : authority.freezeAuthorityRevoked && authority.mintAuthorityRevoked
    ? "\u2705 Authorities revoked"
    : "\u26A0\uFE0F Freeze authority active";

  const header = `\u{1F7E1} TEOS SENTINEL \u2014 Token Intelligence Report
${D}
Token: ${meta.name || "Unknown"} (${meta.symbol || "???"})
Mint: \`${mintShort}\`
${D}
\u{1F4CA} Supply: ${meta.supply || "?"} (${meta.decimals || 0} decimals)
`;

  let mid = `\u{1F50D} Distribution: ${whale.totalHolders || 0} holders
\u{1F0CF} Top 10: ${whale.top10Concentration || 0}%
\u{1F0CF} Top 20: ${whale.top20Concentration || 0}%
\u{2696}\uFE0F Gini: ${whale.giniCoefficient || 0}
${D}
\u{1F6E1}\uFE0F Authorities: ${authorityStatus}
`;

  const criticals = findings.filter(f => f.severity === "critical" || f.severity === "high");
  if (criticals.length > 0) {
    mid += `${D}\u{26A0}\uFE0F Risk Flags (${criticals.length})\n`;
    for (const c of criticals.slice(0, 5)) {
      mid += `\u{1F4A5} ${c.message}: ${c.value}\n`;
    }
    if (criticals.length > 5) {
      mid += `...and ${criticals.length - 5} more risks\n`;
    }
  }

  const score = r.finalRiskScore ?? r.score ?? 0;
  const riskBar = renderRiskBar(score);
  let verdictEmoji, verdictLabel;
  if (score >= 60) { verdictEmoji = "\u{1F6D1}"; verdictLabel = "BLOCK"; }
  else if (score >= 30) { verdictEmoji = "\u26A0\uFE0F"; verdictLabel = "WARN"; }
  else { verdictEmoji = "\u2705"; verdictLabel = "ALLOW"; }

  const footer = `${D}
${verdictEmoji} Risk Score: ${score}/100
${riskBar}
Verdict: ${verdictLabel}
${D}
\u2139\uFE0F Use /diligence for premium analysis with PDF report`;

  return header + mid + footer;
}

async function solanaTokenCommand(ctx) {
  const userId = String(ctx.from.id);
  const input = ctx.message.text.replace(/^\/solanatoken(@\w+)?\s*/i, "").trim();

  if (!input) {
    return ctx.reply(
`\u{1F7E1} TEOS Sentinel \u2014 Solana Token Intelligence
${D}
Analyze any Solana SPL token for security risks and holder insights.
Cost: 5 credits

*Usage:*
/solanatoken <mint_address>

*Example:*
\`\`\`
/solanatoken DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
\`\`\`

*What you get:*
\u2022 Token metadata (name, symbol, supply)
\u2022 Holder distribution & top wallets
\u2022 Authority analysis (mint/freeze)
\u2022 Whale concentration metrics
\u2022 Rug pull risk indicators
\u2022 Final risk score

*Premium upgrade:*
Use /diligence for liquidity analysis + premium PDF report (15 cr)`,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u{1F50D} Scan Sample Token", "TOKEN_SAMPLE")],
      ])
    );
  }

  if (input.toLowerCase() === "sample") {
    return ctx.reply(
`\u{1F7E1} Solana Token Sample
${D}
To scan a sample token, run:
/solanatoken DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

This is the \`bonk\` token mint address on Solana mainnet.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u{1F50D} Scan Sample Token", "TOKEN_SAMPLE")],
      ])
    );
  }

  const user = await resolveUserTier(userId);
  const isUnlimited = user.tier === "founder" || user.tier === "enterprise";
  if (!isUnlimited && user.credits < 5) {
    return ctx.reply(
`\u274C Insufficient credits (need 5, have ${user.credits})
${D}
Use /upgrade to continue scanning.`
    );
  }

  let loading;
  try {
    loading = await ctx.reply("\u{1F50D} Fetching on-chain token data from Solana...");

    const result = await sendTokenScan(input, "basic");

    if (result && result.error) {
      return ctx.reply("\u274C Token scan failed: " + (result.error || "Engine unavailable"));
    }

    const verdict = String(result.verdict || "ALLOW").toUpperCase();
    const score = result.score ?? 0;

    if (verdict === "BLOCK") {
      logAudit(userId, 'token_scan', input, "BLOCK", score, 0, user.credits);
      logScanToRedis({
        verdict: "BLOCK",
        score,
        epistemic: "TOKEN_SCAN",
        rule: "TOKEN",
        ruleId: "TOK",
        severity: "critical",
        command: input,
      }, ctx);
      return ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 Token Intelligence\n\u2500\nVerdict: *BLOCK*\nScore: ${score}/100\n\u2500\nNo credit consumed.`);
    }

    let left;
    try {
      left = isUnlimited ? user.credits : await consumeCredit(userId, 5);
    } catch (creditErr) {
      logger.error({ err: creditErr, userId }, "consumeCredit failed for token scan");
      return ctx.reply("\u274C Credit service unavailable. Try again shortly.");
    }

    logAudit(userId, 'token_scan', input, verdict, score, 5, left);

    logScanToRedis({
      verdict,
      score,
      epistemic: "TOKEN_SCAN",
      rule: "TOKEN",
      ruleId: "TOK",
      severity: score >= 60 ? "critical" : score >= 30 ? "medium" : "none",
      command: input,
    }, ctx);
    const msg = formatTokenReport(result);
    try {
      await ctx.replyWithMarkdown(msg);
    } catch (markdownErr) {
      await ctx.reply(msg.replace(/[*_`\[\]]/g, ""));
    }
  } catch (err) {
    logger.error({ err, userId, input }, "solanatokenCommand error");
    const detail = err?.message || "Unknown error";
    try {
      await (loading ? ctx.reply("\u274C Token scan failed: " + detail.slice(0, 200))
        : ctx.reply("\u274C Token scan failed to start: " + detail.slice(0, 200)));
    } catch (replyErr) {
      logger.warn({ err: replyErr, userId }, "Failed to send error reply");
    }
  }
}

module.exports = { solanaTokenCommand };
