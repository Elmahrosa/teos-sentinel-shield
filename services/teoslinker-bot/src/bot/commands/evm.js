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

const EVM_SAMPLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdrawAll() public {
        uint256 amount = balances[msg.sender];
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] = 0;
    }

    function withdrawOwner() public {
        require(tx.origin == owner);
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent);
    }

    function destroy() public {
        require(msg.sender == owner);
        selfdestruct(payable(owner));
    }
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

async function evmCommand(ctx) {
  const userId = String(ctx.from.id);
  const code = ctx.message.text.replace(/^\/evm(@\w+)?\s*/i, "").trim();

  if (!code) {
    return ctx.reply(
`\u{1F535} TEOS Sentinel \u2014 EVM Smart Contract Security Scan
${D}
Scan Solidity smart contracts for security vulnerabilities.

*Supported Checks:*
\u2022 Reentrancy attacks
\u2022 tx.origin misuse
\u2022 Delegatecall vulnerabilities
\u2022 Selfdestruct risks
\u2022 Access control issues
\u2022 Flash loan patterns
\u2022 Arithmetic issues
\u2022 Proxy storage collisions
\u2022 Unchecked external calls
\u2022 Centralization risks

*Usage:*
/evm <solidity code>

*Example:*
\`\`\`
/evm pragma solidity ^0.8.0;
\`\`\`

Send \`/evm sample\` to scan a demo vulnerable contract.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u26A1 Scan EVM Demo", "EVM_DEMO")],
      ])
    );
  }

  if (code.toLowerCase() === "sample") {
    return ctx.replyWithMarkdown(
`\u{1F535} EVM Vulnerable Demo
${D}
Send this code to scan:

\`\`\`solidity
${EVM_SAMPLE}
\`\`\`

Paste the code above with \`/evm\` or tap the demo button to scan.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("\u26A1 Scan EVM Demo", "EVM_DEMO")],
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
    loading = await ctx.reply("\u{1F50D} Analyzing EVM smart contract...");

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Scan timed out after 120s")), 120000)
    );
    result = await Promise.race([scanWithMcp(code), timeout]);

    if (result && result.error) {
      return safeReply(ctx, "\u274C Scan engine unavailable. Credit not consumed.");
    }

    if (result.verdict === "BLOCK") {
      left = user.credits;
      logAudit(userId, 'evm_scan', code, "BLOCK", result.score, 0, left);
      logScanToRedis({
        verdict: "BLOCK",
        score: result.score,
        epistemic: "EVM_SCAN",
        rule: "EVM",
        ruleId: "EVM",
        severity: "critical",
        command: code,
      }, ctx);
      return safeReply(ctx, `\u{1F6AB} *Threat Blocked* \u2014 EVM Smart Contract\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
    }

    try {
      left = isUnlimited ? user.credits : await consumeCredit(userId, 1);
    } catch (creditErr) {
      logger.error({ err: creditErr, userId }, "consumeCredit failed");
      return safeReply(ctx, "\u274C Credit service unavailable. Try again shortly.");
    }

    logAudit(userId, 'evm_scan', code, result.verdict, result.score, 1, left);

    result.scanType = "EVM";
    const evmFindings = (result.findings || []).filter(f =>
      (f.rule && f.rule.startsWith("EVM-")) || (f.message && f.message.includes("[EVM]"))
    );

    logScanToRedis({
      verdict: String(result.verdict || "ALLOW").toUpperCase(),
      score: result.score,
      epistemic: "EVM_SCAN",
      rule: "EVM",
      ruleId: "EVM",
      severity: result.verdict === "BLOCK" ? "critical" : result.verdict === "WARN" ? "medium" : "none",
      command: code,
    }, ctx);

    const { icon: tierIcon, name: tierName } = getTier(left, user.tier);
    const msg = formatTelegramReport(result, left, tierIcon, tierName);
    const header = `\u{1F535} TEOS SENTINEL \u2014 EVM Smart Contract Scan\n`;
    await safeReply(ctx, header + msg.slice(msg.indexOf(D)));
  } catch (err) {
    logger.error({ err, userId, code: code && code.slice(0, 100) }, "evmCommand error");
    const detail = err?.message || err?.code || "unknown error";
    try {
      if (loading) {
        await ctx.reply("\u274C EVM scan failed: " + detail.slice(0, 200));
      } else {
        await ctx.reply("\u274C EVM scan failed to start: " + detail.slice(0, 200));
      }
    } catch (replyErr) {
      logger.warn({ err: replyErr, userId }, "Failed to send error reply");
    }
  }
}

module.exports = { evmCommand, EVM_SAMPLE };
