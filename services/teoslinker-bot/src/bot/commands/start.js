const { getCredits, getUserTier, refillCredits } = require("../../services/activation.service");
const { getTier } = require("../../utils/scoring");
const { resolveUserTier } = require("../../lib/billing/tier-guard");
const { mainMenu } = require("../menus");
const { D } = require("../../utils/formatting");
const { logger } = require("../../../logger.cjs");
const { redis } = require("../../services/redis.service");

const WELCOME_BONUS_CREDITS = 5;

async function startCommand(ctx) {
  const userId  = String(ctx.from.id);
  let credits = 0;
  let sub = { tier: "free" };
  let banner = "";
  let isNewUser = false;
  try {
    const user = await resolveUserTier(userId);
    credits = user.credits === Infinity ? "∞" : user.credits;
    sub = { tier: user.tier };

    if (sub.tier === "free" && credits === 0) {
      const alreadyClaimed = redis ? await redis.get(`teos:welcome_bonus:${userId}`) : null;
      if (!alreadyClaimed) {
        isNewUser = true;
        await refillCredits(userId, WELCOME_BONUS_CREDITS);
        credits = WELCOME_BONUS_CREDITS;
        if (redis) {
          await redis.set(`teos:welcome_bonus:${userId}`, "1", "EX", 365 * 86400);
        }
        banner = `\n\u{1F381} Welcome bonus: +${WELCOME_BONUS_CREDITS} free credits!\n`;
      }
    }
  } catch (e) {
    banner = "\n\u26A0\uFE0F Activation service offline — /credits unavailable\n";
    logger.warn({ userId, err: e?.message }, "startCommand: activation service down");
  }
  const tier = sub.tier || "free";
  if (tier === "free" && (credits === 0 || credits === "0") && !isNewUser) {
    return ctx.reply(
`\u{1F6E1}\uFE0F TEOS Sentinel Shield

Runtime Security for Autonomous Systems
Generate \u2192 Validate \u2192 Execute
${D}
This environment is currently restricted to authorized users.

\u{1F4E7} To request access:
ayman@teosegypt.com
${D}
\u{2139}\uFE0F Include your Telegram ID: \`${userId}\``,
      mainMenu()
    );
  }

  const { icon, name } = tier === "founder" ? { icon: "\u{1F6E1}\uFE0F", name: "Founder" }
    : tier === "enterprise" ? { icon: "\u{1F6E1}\uFE0F", name: "Enterprise" }
    : tier === "team" ? { icon: "\u{1F9FF}", name: "Team" }
    : tier === "tester" || tier === "beta_tester" ? { icon: "\u{1F9F1}", name: "Beta Tester" }
    : tier === "pro" ? { icon: "\u{1F7E2}", name: "Pro" }
    : getTier(typeof credits === "number" ? credits : 0);

  await ctx.reply(
`\u{1F6E1}\uFE0F TEOS Sentinel Shield

Runtime Security for Autonomous Systems
Generate \u2192 Validate \u2192 Execute
${D}
\u{1F464} Welcome
Tier   : ${icon} ${name}
Credits: ${credits}${banner}
${D}
\u{1F4CB} Commands
/scan          \u2014 Scan code or command
/scan-banking  \u2014 Banking compliance audit
/solana        \u2014 Scan Solana programs
/evm           \u2014 Scan EVM smart contracts
/solanatoken   \u2014 Token risk scan
/deps          \u2014 Dependency vulnerability scan
/ci            \u2014 CI/CD security audit
/github        \u2014 Scan GitHub repository
/report        \u2014 Generate PDF scan report
/diligence     \u2014 Due diligence report
/fullreport    \u2014 Full token risk report
/upgrade       \u2014 Upgrade plan
/status        \u2014 System dashboard
/dashboard     \u2014 Open Command Center
/help          \u2014 Quick reference`,
    mainMenu()
  );
}

module.exports = { startCommand };
