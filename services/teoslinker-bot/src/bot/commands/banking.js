const { consumeCredit, logAudit } = require("../../services/activation.service");
const { scanWithMcp } = require("../../services/mcp.service");
const { logScanToRedis } = require("../../services/redis.service");
const { emit } = require("../../services/telemetry.service");
const { getTier } = require("../../utils/scoring");
const { D } = require("../../utils/formatting");
const { formatTelegramReport } = require("../../services/report-format");
const { resolveUserTier } = require("../../lib/billing/tier-guard");
const { Markup } = require("telegraf");
let logger;
try {
  logger = require("../../../logger.cjs").logger;
} catch {
  logger = console;
}

async function safeReply(ctx, msg, fallback) {
  try {
    await ctx.reply(msg, { parse_mode: "Markdown" });
  } catch (err) {
    logger.error({ err, userId: ctx.from?.id }, "Primary reply failed");
    try {
      await ctx.reply(fallback || "\u2705 Done. Use /status to check credits.");
    } catch (e) {
      logger.error({ err: e, userId: ctx.from?.id }, "Fallback reply also failed");
    }
  }
}

async function bankingCommand(ctx) {
  const userId = String(ctx.from.id);
  const code = ctx.message.text.replace(/^\/scan[_-]banking(@\w+)?\s*/i, "").trim();

  if (!code) {
    const bankingRules = [
      ["R104", "Ledger Manipulation", "critical", "Direct ledger/balance update bypassing transaction hooks"],
      ["R105", "SWIFT/ISO 20022 Unencrypted", "critical", "SWIFT/ISO 20022 over HTTP/WS (non-TLS)"],
      ["R106", "FIX Protocol Cleartext", "critical", "FIX login with cleartext Password/RawData"],
      ["R107", "Algorithmic Front-Running", "medium", "Slippage manipulation, gas auction override"],
      ["R108", "Reserve Key Leak", "critical", "Sovereign reserve/treasury key leaked"],
      ["R109", "Cross-Identity Silent Trust", "critical", "CBE/FRA identity binding without attestation"],
      ["R110", "Unassigned Dispute Escalation", "critical", "BNPL/installment without dispute owner"],
      ["R111", "PCI/FRA Data Contamination", "critical", "Regulated data environment contamination"],
    ];

    const rulesText = bankingRules.map(([id, name, sev, desc]) =>
      `\u2022 ${id} ${name} (${sev === "critical" ? "\u26A0\uFE0F" : "\u{1F7E1}"} ${sev.toUpperCase()}) \u2014 ${desc}`
    ).join("\n");

    return ctx.reply(
`\u{1F3DB}\uFE0F TEOS Sentinel \u2014 Banking Security Audit (CBE / FRA)
${D}
Scan financial pipelines for 8 institutional banking rules:
${rulesText}
${D}
*Usage:*
/scan-banking <code>

*Example:*
\`\`\`
/scan-banking ledger.balance.update(audit.bypass=true)
\`\`\`

*Sample compliance check:*
Send \`/scan-banking sample\` to run a mock CBE/FRA compliance audit.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u{1F3DB}\uFE0F Run Mock Compliance Check", "BANKING_DEMO")],
      ])
    );
  }

  if (code.toLowerCase() === "sample") {
    const sampleCode = `function processPayment() {
  // CBE/FRA dual-mandate compliance check
  const ledger = getLedger();
  ledger.balance.update({ bypassHooks: true });
  const swiftMsg = new SWIFTMessage({ transport: "ws://swift.example.com" });
  const fixSession = new FIXSession({ password: "cleartext!" });
  // reserve key embedded for debugging
  const reserveKey = "cb_reserve_signing_key_2026";
}`;
    return ctx.replyWithMarkdown(
`\u{1F3DB}\uFE0F Banking Compliance Demo
${D}
Paste this sample for audit or tap the button:

\`\`\`javascript
${sampleCode}
\`\`\`

Send with \`/scan-banking\` or tap to run mock compliance check.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u{1F3DB}\uFE0F Run Mock Compliance Check", "BANKING_DEMO")],
      ])
    );
  }

  const user = await resolveUserTier(userId);
  const isUnlimited = user.tier === "founder" || user.tier === "enterprise";

  if (!isUnlimited && user.credits <= 0) {
    return ctx.reply(
`\u274C No credits remaining
${D}
Use /upgrade to continue scanning.`
    );
  }

  let loading, result, left;

  try {
    loading = await ctx.reply("\u{1F50D} Auditing financial pipeline for CBE/FRA compliance...");

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Scan timed out after 120s")), 120000)
    );
    result = await Promise.race([scanWithMcp(code), timeout]);

    if (result && result.error) {
      return safeReply(ctx, "\u274C Banking scan engine unavailable. Credit not consumed.");
    }

    if (result.verdict === "BLOCK") {
      left = user.credits;
      logAudit(userId, 'banking_scan', code, "BLOCK", result.score, 0, left);
      logScanToRedis({
        verdict: "BLOCK",
        score: result.score,
        epistemic: "BANKING_SCAN",
        rule: "BANKING",
        ruleId: "R104-R111",
        severity: "critical",
        command: code,
      }, ctx);
      return safeReply(ctx, `\u{1F6AB} *Threat Blocked* \u2014 Banking Compliance\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
    }

    try {
      left = isUnlimited ? user.credits : await consumeCredit(userId, 1);
    } catch (creditErr) {
      logger.error({ err: creditErr, userId }, "consumeCredit failed");
      return safeReply(ctx, "\u274C Credit service unavailable. Try again shortly.");
    }

    logAudit(userId, 'banking_scan', code, result.verdict, result.score, 1, left);

    result.scanType = "Banking";
    const bankingFindings = (result.findings || []).filter(f =>
      (f.rule && (f.rule.startsWith("R10") || f.rule.startsWith("R11"))) ||
      (f.message && f.message.includes("[BANKING]"))
    );

    logScanToRedis({
      verdict: String(result.verdict || "ALLOW").toUpperCase(),
      score: result.score,
      epistemic: "BANKING_SCAN",
      rule: "BANKING",
      ruleId: "R104-R111",
      severity: result.verdict === "BLOCK" ? "critical" : result.verdict === "WARN" ? "medium" : "none",
      command: code,
    }, ctx);

    const { icon: tierIcon, name: tierName } = getTier(left, user.tier);
    const msg = formatTelegramReport(result, left, tierIcon, tierName);
    const header = `\u{1F3DB}\uFE0F TEOS SENTINEL \u2014 CBE/FRA Banking Compliance Audit\n`;
    await safeReply(ctx, header + msg.slice(msg.indexOf(D)));
  } catch (err) {
    logger.error({ err, userId, code: code && code.slice(0, 100) }, "bankingCommand error");
    const detail = err?.message || err?.code || "unknown error";
    try {
      if (loading) {
        await ctx.reply("\u274C Banking scan failed: " + detail.slice(0, 200));
      } else {
        await ctx.reply("\u274C Banking scan failed to start: " + detail.slice(0, 200));
      }
    } catch (replyErr) {
      logger.warn({ err: replyErr, userId }, "Failed to send error reply");
    }
  }
}

module.exports = { bankingCommand };
