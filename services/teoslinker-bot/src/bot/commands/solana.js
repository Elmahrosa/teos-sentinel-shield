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

const SOLANA_SAMPLE = `use anchor_lang::prelude::*;

declare_id!("Fg6G7kTfqFPCuEPoPqNqQ9zRfM9cGjRqTqQXW9yJkRaL");

#[program]
pub mod vulnerable_vault {
    use super::*;

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let user = &ctx.accounts.user;
        let vault = &ctx.accounts.vault;

        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user.to_account_info().try_borrow_mut_lamports()? += amount;

        Ok(())
    }

    pub fn admin_command(ctx: Context<AdminOnly>, command: String) -> Result<()> {
        msg!("Executing admin command: {}", command);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub user: Signer<'info>,
    /// CHECK: no validation
    pub vault: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    pub authority: Signer<'info>,
    /// CHECK: admin check missing
    pub target: AccountInfo<'info>,
}`;

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

async function solanaCommand(ctx) {
  const userId = String(ctx.from.id);
  const code = ctx.message.text.replace(/^\/solana(@\w+)?\s*/i, "").trim();

  if (!code) {
    return ctx.reply(
`\u{1F7E1} TEOS Sentinel \u2014 Solana Security Scan
${D}
Scan Solana programs (Anchor / Rust) for security vulnerabilities.

*Usage:*
/solana <code>
/solana <anchor program>

*Example:*
\`\`\`
/solana use anchor_lang::prelude::*;
\`\`\`

*Sample vulnerable program:*
Send \`/solana sample\` to scan a demo vulnerable Solana program.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u26A1 Scan Solana Demo", "SOLANA_DEMO")],
      ])
    );
  }

  if (code.toLowerCase() === "sample") {
    return ctx.replyWithMarkdown(
`\u{1F7E1} Solana Vulnerable Demo
${D}
Send this code to scan:

\u2060\u2060\`\`\`rust
${SOLANA_SAMPLE}
\`\`\`

Paste the code above with \`/solana\` or tap the demo button to scan.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u26A1 Scan Solana Demo", "SOLANA_DEMO")],
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
    loading = await ctx.reply("\u{1F50D} Analyzing Solana program...");

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Scan timed out after 120s")), 120000)
    );
    result = await Promise.race([scanWithMcp(code), timeout]);

    if (result && result.error) {
      return safeReply(ctx, "\u274C Scan engine unavailable. Credit not consumed.");
    }

    if (result.verdict === "BLOCK") {
      left = user.credits;
      logAudit(userId, 'solana_scan', code, "BLOCK", result.score, 0, left);
      logScanToRedis({
        verdict: "BLOCK",
        score: result.score,
        epistemic: "SOLANA_SCAN",
        rule: "SOLANA",
        ruleId: "SOL",
        severity: "critical",
        command: code,
      }, ctx);
      return safeReply(ctx, `\u{1F6AB} *Threat Blocked* \u2014 Solana Program\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
    }

    try {
      left = isUnlimited ? user.credits : await consumeCredit(userId, 1);
    } catch (creditErr) {
      logger.error({ err: creditErr, userId }, "consumeCredit failed");
      return safeReply(ctx, "\u274C Credit service unavailable. Try again shortly.");
    }

    logAudit(userId, 'solana_scan', code, result.verdict, result.score, 1, left);

    result.scanType = "Solana";
    const solanaFindings = (result.findings || []).filter(f =>
      (f.rule && f.rule.startsWith("SOL-")) || (f.message && f.message.includes("[SOLANA"))
    );

    logScanToRedis({
      verdict: String(result.verdict || "ALLOW").toUpperCase(),
      score: result.score,
      epistemic: "SOLANA_SCAN",
      rule: "SOLANA",
      ruleId: "SOL",
      severity: result.verdict === "BLOCK" ? "critical" : result.verdict === "WARN" ? "medium" : "none",
      command: code,
    }, ctx);

    const { icon: tierIcon, name: tierName } = getTier(left, user.tier);
    const msg = formatTelegramReport(result, left, tierIcon, tierName);
    const header = `\u{1F7E1} TEOS SENTINEL \u2014 Solana Security Scan\n`;
    await safeReply(ctx, header + msg.slice(msg.indexOf(D)));
  } catch (err) {
    logger.error({ err, userId, code: code && code.slice(0, 100) }, "solanaCommand error");
    const detail = err?.message || err?.code || "unknown error";
    try {
      if (loading) {
        await ctx.reply("\u274C Solana scan failed: " + detail.slice(0, 200));
      } else {
        await ctx.reply("\u274C Solana scan failed to start: " + detail.slice(0, 200));
      }
    } catch (replyErr) {
      logger.warn({ err: replyErr, userId }, "Failed to send error reply");
    }
  }
}

module.exports = { solanaCommand, SOLANA_SAMPLE };
