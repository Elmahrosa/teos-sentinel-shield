const { consumeCredit, logAudit } = require("../../services/activation.service");
const { sendTokenScan } = require("../../services/token.service");
const { logScanToRedis } = require("../../services/redis.service");
const { getTier } = require("../../utils/scoring");
const { D } = require("../../utils/formatting");
const { resolveUserTier } = require("../../lib/billing/tier-guard");
const { generatePremiumReport, setEngineMeta } = require("../../services/report-design");
const { getEngineInfo } = require("../../services/mcp.service");
const { Markup } = require("telegraf");
const path = require("path");
const fs = require("fs");
let logger;
try {
  logger = require("../../../logger.cjs").logger;
} catch {
  logger = console;
}

const TEMP_DIR = path.join(process.cwd(), "tmp");

function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

function formatDiligenceReport(result) {
  const r = result.result || result;
  const meta = r.metadata || {};
  const whale = r.whaleMetrics || {};
  const authority = r.authorityAnalysis || {};
  const rug = r.rugPullIndicators || {};
  const liquidity = r.liquidityAnalysis || {};
  const findings = r.findings || [];
  const holders = r.holderDistribution || [];

  const mintShort = r.mintAddress
    ? r.mintAddress.slice(0, 6) + "..." + r.mintAddress.slice(-4)
    : "Unknown";

  let maStatus = "\u2705 Revoked";
  if (!authority.mintAuthorityRevoked && authority.mintAuthority) {
    maStatus = "\u274C Active: `" + authority.mintAuthority.slice(0, 8) + "..." + authority.mintAuthority.slice(-4) + "`";
  }

  let faStatus = "\u2705 Revoked";
  if (!authority.freezeAuthorityRevoked && authority.freezeAuthority) {
    faStatus = "\u26A0\uFE0F Active: `" + authority.freezeAuthority.slice(0, 8) + "..." + authority.freezeAuthority.slice(-4) + "`";
  }

  const top10Str = holders.slice(0, 5).map((h, i) =>
    `${i + 1}. \`${h.address.slice(0, 6)}...${h.address.slice(-4)}\` ${h.percentage.toFixed(2)}%`
  ).join("\n");

  const liquidityStr = liquidity.hasLiquidity
    ? `$${liquidity.totalLiquidityUSD.toLocaleString()} across ${liquidity.topPools.length} pools\n   Price: $${liquidity.priceUSD.toFixed(8)}`
    : "\u26A0\uFE0F No liquidity detected";

  const riskFlags = rug.riskFlags.length > 0
    ? rug.riskFlags.slice(0, 8).map(f => "\u{1F4A5} " + f).join("\n")
    : "\u2705 No critical flags";

  let msg = `\u{1F3C6} TEOS SENTINEL \u2014 Premium Due Diligence
${D}
\u{1F4A0} ${meta.name || "Unknown"} (${meta.symbol || "???"})
\u{1F4B0} Supply: ${meta.supply || "?"} @ ${meta.decimals || 0} decimals
\u{1F517} Mint: \`${mintShort}\`
${D}
\u{1F6E1}\uFE0F AUTHORITY ANALYSIS
\u{1F511} Mint Authority: ${maStatus}
\u{2744}\uFE0F Freeze Authority: ${faStatus}

\u{1F0CF} WHALE CONCENTRATION
\u{1F3C6} Top 10: ${whale.top10Concentration || 0}% | Top 20: ${whale.top20Concentration || 0}%
\u{2696}\uFE0F Gini: ${whale.giniCoefficient || 0} | Total holders: ${whale.totalHolders || 0}

\u{1F4CA} TOP 5 HOLDERS
${top10Str || "  No holder data"}

\u{1F4B1} LIQUIDITY
${liquidityStr}

\u{26A0}\uFE0F RUG PULL RISK: ${rug.riskLevel || "UNKNOWN"} (${rug.riskScore || 0}/100)
${riskFlags}

\u{1F3AF} FINAL VERDICT
Risk Score: ${r.finalRiskScore ?? result.score ?? 0}/100
Decision: ${result.verdict || "ALLOW"}
${D}
\u{1F4C4} Premium PDF report attached below`;

  return msg;
}

async function diligenceCommand(ctx) {
  const userId = String(ctx.from.id);
  const input = ctx.message.text.replace(/^\/diligence(@\w+)?\s*/i, "").trim();

  if (!input) {
    return ctx.reply(
`\u{1F3C6} TEOS Sentinel \u2014 Premium Due Diligence
${D}
Full on-chain Solana token due diligence with premium PDF report.
Cost: 15 credits

*What you get:*
\u2022 Token metadata & supply analysis
\u2022 Holder distribution (top wallets)
\u2022 Mint/freeze authority check
\u2022 Liquidity analysis (DEX pools, price)
\u2022 Whale concentration metrics
\u2022 Rug pull risk scoring
\u2022 Cinema-quality premium PDF report
\u2022 ELMAHROSA / Sentinel branded

*Usage:*
/diligence <mint_address>

*Example:*
\`\`\`
/diligence DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
\`\`\``,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u{1F3C6} Premium Sample", "DILIGENCE_SAMPLE")],
      ])
    );
  }

  if (input.toLowerCase() === "sample") {
    return ctx.reply(
`\u{1F3C6} Premium Due Diligence Sample
${D}
To run a due diligence on a sample token:
/diligence DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

This scans \`bonk\` token on Solana mainnet.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u{1F3C6} Premium Sample", "DILIGENCE_SAMPLE")],
      ])
    );
  }

  const user = await resolveUserTier(userId);
  const isUnlimited = user.tier === "founder" || user.tier === "enterprise";
  if (!isUnlimited && user.credits < 15) {
    return ctx.reply(
`\u274C Insufficient credits (need 15, have ${user.credits})
${D}
Use /upgrade to continue scanning.`
    );
  }

  let loading;
  try {
    loading = await ctx.reply("\u{1F50D} Running premium on-chain due diligence...");

    const result = await sendTokenScan(input, "premium");

    if (result && result.error) {
      return ctx.reply("\u274C Due diligence failed: " + (result.error || "Engine unavailable"));
    }

    const verdict = String(result.verdict || "ALLOW").toUpperCase();
    const score = result.score ?? 0;

    if (verdict === "BLOCK") {
      logAudit(userId, 'diligence', input, "BLOCK", score, 0, user.credits);
      logScanToRedis({
        verdict: "BLOCK",
        score,
        epistemic: "DILIGENCE",
        rule: "TOKEN",
        ruleId: "DD",
        severity: "critical",
        command: input,
      }, ctx);
      return ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 Due Diligence\n\u2500\nVerdict: *BLOCK*\nScore: ${score}/100\n\u2500\nNo credit consumed.`);
    }

    let left;
    try {
      left = isUnlimited ? user.credits : await consumeCredit(userId, 15);
    } catch (creditErr) {
      logger.error({ err: creditErr, userId }, "consumeCredit failed for diligence");
      return ctx.reply("\u274C Credit service unavailable. Try again shortly.");
    }

    logAudit(userId, 'diligence', input, verdict, score, 15, left);

    logScanToRedis({
      verdict,
      score,
      epistemic: "DILIGENCE",
      rule: "TOKEN",
      ruleId: "DD",
      severity: score >= 60 ? "critical" : score >= 30 ? "medium" : "none",
      command: input,
    }, ctx);

    const msg = formatDiligenceReport(result);

    let pdfPath = null;
    try {
      ensureTempDir();
      pdfPath = path.join(TEMP_DIR, `diligence-${Date.now()}.pdf`);
      setEngineMeta(await getEngineInfo());
      await generatePremiumReport(result, input, pdfPath);
    } catch (pdfErr) {
      logger.error({ err: pdfErr }, "Premium PDF generation failed");
    }

    try {
      await ctx.replyWithMarkdown(msg);
    } catch (markdownErr) {
      await ctx.reply(msg.replace(/[*_`\[\]]/g, ""));
    }

    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        await ctx.replyWithDocument({
          source: pdfPath,
          filename: `teos-diligence-${Date.now()}.pdf`
        });
        fs.unlink(pdfPath, () => {});
      } catch (docErr) {
        logger.error({ err: docErr }, "Failed to send premium PDF");
        try {
          await ctx.reply("\u274C PDF delivery failed, but report data is shown above");
        } catch (err) { logger.warn({ err }, "diligence PDF delivery failed reply"); }
      }
    } else {
      await ctx.reply("\u2139\uFE0F Premium PDF could not be generated — report displayed above");
    }
  } catch (err) {
    logger.error({ err, userId, input }, "diligenceCommand error");
    const detail = err?.message || "Unknown error";
    try {
      await (loading ? ctx.reply("\u274C Due diligence failed: " + detail.slice(0, 200))
        : ctx.reply("\u274C Due diligence failed to start: " + detail.slice(0, 200)));
    } catch (replyErr) {
      logger.warn({ err: replyErr, userId }, "Failed to send error reply");
    }
  }
}

module.exports = { diligenceCommand };
