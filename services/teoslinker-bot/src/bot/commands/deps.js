const { getCredits, consumeCredit } = require("../../services/activation.service");
const { scanDeps } = require("../../services/mcp.service");
const { logScanToRedis } = require("../../services/redis.service");
const { scoreBar } = require("../../utils/scoring");
const { requireTier } = require("../../lib/billing/tier-guard");
const { D } = require("../../utils/formatting");

async function depsCommand(ctx) {
  const gate = await requireTier(ctx, "deps");
  if (!gate.allowed) return ctx.reply(gate.reason);

  const userId = String(ctx.from.id);
  const credits = await getCredits(userId);
  if (credits < 1) {
    return ctx.reply("\u274C No credits remaining. Use /upgrade to continue.");
  }

  const payload = ctx.message.text.replace(/^\/deps(@\w+)?\s*/i, "").trim();

  if (!payload) {
    return ctx.reply(
`\u{1F6E1}\uFE0F Dependency Scanner
${D}
Usage:
/deps {"dependencies":{"express":"latest"}}

Example:
/deps {"dependencies":{"event-stream":"3.3.6"}}`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return ctx.reply(
`\u274C Invalid JSON format
${D}
Expected:
{"dependencies":{"package":"version"}}`
    );
  }

  try {
    const result   = await scanDeps(payload);
    const verdict  = String(result.verdict || "WARN").toUpperCase();
    const score    = Number(result.score ?? 50);

    if (verdict === "BLOCK") {
      const { logAudit } = require("../../services/activation.service");
      await logAudit(userId, 'deps', ctx.message.text, "BLOCK", score, 0, credits);
      await logScanToRedis({
        verdict: "BLOCK", score,
        rule:     result.rule     || "MCP_DEPS",
        ruleId:   result.ruleId   || "DEPS",
        severity: "critical",
        command:  ctx.message.text.slice(0, 500),
      }, ctx);
      return ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 Dependency Scan\n\u2500\nVerdict: *BLOCK*\nScore: ${score}/100\n\u2500\nNo credit consumed.`);
    }

    const total    = Number(result.totalDependencies ?? 0);
    const findings = Array.isArray(result.findings) && result.findings.length
      ? result.findings : ["No dependency risks detected"];
    const icon = verdict === "WARN" ? "\u26A0\uFE0F" : "\u2705";
    const bar  = scoreBar(score);

    await consumeCredit(userId, 1);
    const remaining = await getCredits(userId);
    const { logAudit } = require("../../services/activation.service");
    await logAudit(userId, 'deps', ctx.message.text, verdict, score, 1, remaining);
    await logScanToRedis({
      verdict, score,
      rule:     result.rule     || "MCP_DEPS",
      ruleId:   result.ruleId   || "DEPS",
      severity: result.severity || (verdict === "BLOCK" ? "critical" : verdict === "WARN" ? "medium" : "none"),
      command:  ctx.message.text.slice(0, 500),
    }, ctx);

    return ctx.reply(
`\u{1F6E1}\uFE0F ${icon} Dependency Analysis
${D}
Verdict  : ${verdict}
Risk     : ${score}/100  ${bar}
Packages : ${total} scanned
${D}
Findings:
${findings.map(f => `\u2022 ${f}`).join("\n")}
${D}
Credits remaining: ${await getCredits(userId)}`
    );
  } catch {
    return ctx.reply("\u274C Dependency engine unavailable. Try again shortly.");
  }
}

module.exports = { depsCommand };
