const { getCredits, consumeCredit } = require("../../services/activation.service");
const { scanCi } = require("../../services/mcp.service");
const { logScanToRedis } = require("../../services/redis.service");
const { scoreBar } = require("../../utils/scoring");
const { requireTier } = require("../../lib/billing/tier-guard");
const { D } = require("../../utils/formatting");

async function ciCommand(ctx) {
  const gate = await requireTier(ctx, "ci");
  if (!gate.allowed) return ctx.reply(gate.reason);

  const userId = String(ctx.from.id);
  const credits = await getCredits(userId);
  if (credits < 1) {
    return ctx.reply("\u274C No credits remaining. Use /upgrade to continue.");
  }

  const payload = ctx.message.text.replace(/^\/ci(@\w+)?\s*/i, "").trim();

  if (!payload) {
    return ctx.reply(
`\u{1F9EA} CI/CD Security Audit
${D}
Send GitHub Actions YAML, Dockerfile, or pipeline config.

Example:
/ci uses: actions/checkout@v4`
    );
  }

  try {
    const result   = await scanCi(payload);
    const verdict  = String(result.verdict || "WARN").toUpperCase();
    const score    = Number(result.score ?? 50);

    if (verdict === "BLOCK") {
      const { logAudit } = require("../../services/activation.service");
      await logAudit(userId, 'ci', ctx.message.text, "BLOCK", score, 0, credits);
      await logScanToRedis({
        verdict: "BLOCK", score,
        rule:     result.rule     || "MCP_CI",
        ruleId:   result.ruleId   || "CI",
        severity: "critical",
        command:  ctx.message.text.slice(0, 500),
      }, ctx);
      return ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 CI/CD Pipeline\n\u2500\nVerdict: *BLOCK*\nScore: ${score}/100\n\u2500\nNo credit consumed.`);
    }

    const findings = Array.isArray(result.findings) && result.findings.length
      ? result.findings : ["No CI risks detected"];
    const icon = verdict === "WARN" ? "\u26A0\uFE0F" : "\u2705";
    const bar  = scoreBar(score);

    await consumeCredit(userId, 1);
    const remaining = await getCredits(userId);
    const { logAudit } = require("../../services/activation.service");
    await logAudit(userId, 'ci', ctx.message.text, verdict, score, 1, remaining);
    await logScanToRedis({
      verdict, score,
      rule:     result.rule     || "MCP_CI",
      ruleId:   result.ruleId   || "CI",
      severity: result.severity || (verdict === "BLOCK" ? "critical" : verdict === "WARN" ? "medium" : "none"),
      command:  ctx.message.text.slice(0, 500),
    }, ctx);

    return ctx.reply(
`\u{1F6E1}\uFE0F ${icon} CI/CD Audit
${D}
Verdict : ${verdict}
Risk    : ${score}/100  ${bar}
${D}
Findings:
${findings.map(f => `\u2022 ${f}`).join("\n")}
${D}
Credits remaining: ${await getCredits(userId)}`
    );
  } catch {
    return ctx.reply("\u274C CI audit engine unavailable. Try again shortly.");
  }
}

module.exports = { ciCommand };
