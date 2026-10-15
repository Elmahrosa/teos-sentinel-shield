const path = require('path');
const fs = require('fs');
const { logger } = require('../../../logger.cjs');
const { D } = require('../../utils/formatting');
const { sendTokenScan } = require('../../services/token.service');
const { generatePremiumReport, setEngineMeta } = require('../../services/report-design');
const { getEngineInfo } = require('../../services/mcp.service');
const { consumeCredit, logAudit, getCredits, getUserTier } = require('../../services/activation.service');
const { resolveUserTier } = require('../../lib/billing/tier-guard');
const { mainMenu } = require('../menus');

async function fullReportCommand(ctx) {
  const userId = String(ctx.from.id);
  const input = ctx.message.text.replace(/^\/fullreport(@\w+)?\s*/i, "").trim();

  if (!input) {
    return ctx.reply(
`\u{1F6E1}\uFE0F Full Token Risk Report (PDF) \u2014 20 credits
${D}
Generate a comprehensive risk report for a Solana token.
Includes: on-chain analysis, whale distribution, authority audit,
liquidity depth, rug pull indicators, investor-grade PDF.

Usage:
/fullreport <Solana token mint address>

Example:
/fullreport DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`,
      mainMenu()
    );
  }

  const user = await resolveUserTier(userId);
  const isUnlimited = user.tier === "founder" || user.tier === "enterprise";
  const credits = isUnlimited ? user.credits : await getCredits(userId);

  if (!isUnlimited && credits < 20) {
    return ctx.reply("\u274C Not enough credits (need 20 for full report). Use /upgrade.");
  }

  let loading, pdfPath = null;
  try {
    loading = await ctx.reply("\u{1F50D} Fetching on-chain token data...");

    const result = await sendTokenScan(input, 'premium');
    if (result && result.error) {
      return ctx.reply("\u274C Token scan failed: " + result.error);
    }

    const r = result.result || result;
    const score = r.finalRiskScore ?? result.score ?? 0;
    const verdict = result.verdict || r.overallVerdict || "ALLOW";

    if (verdict === "BLOCK") {
      logAudit(userId, 'full_report', input, "BLOCK", score, 0, credits);
      return ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 Token Risk Report\n\u2500\nVerdict: *BLOCK*\nScore: ${score}/100\n\u2500\nNo credit consumed.`);
    }

    await ctx.reply("\u{1F4CA} Analyzing holder distribution and risk metrics...");

    const remaining = isUnlimited ? credits : await consumeCredit(userId, 20);
    logAudit(userId, 'full_report', input, verdict, score, 20, remaining);

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    pdfPath = path.join(tmpDir, `full-report-${Date.now()}.pdf`);

    await ctx.reply("\u{1F4C4} Generating comprehensive PDF report...");

    setEngineMeta(await getEngineInfo());
    await generatePremiumReport(result, input, pdfPath, {
      title: 'Full Token Risk Report',
      includeCover: true,
      includeDisclaimers: true,
      includeMethodology: true,
      watermark: 'TEOS SENTINEL',
    });

    await ctx.replyWithDocument(
      { source: pdfPath, filename: `teos-full-risk-report-${Date.now()}.pdf` },
      { caption: `\u{1F6E1}\uFE0F Full Risk Report \u2014 \`${input.slice(0, 16)}...\`\nScore: ${score}/100 | Verdict: ${verdict}`, parse_mode: "Markdown" }
    );

  } catch (err) {
    logger.error({ err, userId, input }, "fullreportCommand error");
    const detail = err?.message || "unknown error";
    try {
      await (loading
        ? ctx.reply("\u274C Full report failed: " + detail.slice(0, 200))
        : ctx.reply("\u274C Full report failed to start: " + detail.slice(0, 200)));
    } catch (e) { logger.error({ err: e, userId }, "fullreport error reply also failed"); }
  } finally {
    if (pdfPath) {
      fs.unlink(pdfPath, () => {});
    }
  }
}

module.exports = { fullReportCommand };
