const { claudeService } = require("../../services/claude.service");
const { modelService } = require("../../services/model.service");
const { consumeCredit, getCredits } = require("../../services/activation.service");
const { mainMenu } = require("../menus");
const { D } = require("../../utils/formatting");
const { logger } = require("../../../logger.cjs");

const CLAUDE_COST = 5;

async function claudeCommand(ctx) {
  const userId = String(ctx.from.id);

  if (!modelService.isModelAvailable('claude')) {
    const available = modelService.getAvailableModels(!!process.env.GROQ_API_KEY, !!process.env.ANTHROPIC_API_KEY);
    const modelList = available.map(m => `/${m.id}`).join(', ');
    return ctx.reply(
      `❌ Claude is currently unavailable.
${D}
This is due to the Anthropic provider being unavailable.

Try one of the available models:
${modelList}

Use /model to select a model.
Use /chat to start chatting.`,
      mainMenu()
    );
  }

  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();

  if (!args) {
    return ctx.reply(
      `🤖 Claude Agent + TEOS Sentinel
${D}
Send messages to Claude with all tool calls intercepted by TEOS Sentinel before execution.

📋 Usage:
/claude <message>

💡 Examples:
/claude Run "echo hello world"
/claude Write a file called test.txt with "Hello"
/claude What happens if I run rm -rf /?

🛡️ All tool calls are scanned:
• ALLOW → Executed normally
• WARN → Executed with warning
• BLOCK → Blocked, safe alternative suggested

Cost: ${CLAUDE_COST} credits per message`,
      mainMenu()
    );
  }

  let credits = 0;
  try {
    credits = await getCredits(userId);
  } catch (e) {
    logger.warn({ userId, err: e?.message }, "claude: failed to get credits");
  }

  if (credits < CLAUDE_COST) {
    return ctx.reply(
      `❌ Insufficient credits
${D}
Need ${CLAUDE_COST} credits. You have ${credits}.
Use /credits to check balance.
Use /plans to see upgrade options.`,
      mainMenu()
    );
  }

  const initialized = await claudeService.initialize();
  if (!initialized) {
    return ctx.reply(
      `\u274C Claude Service unavailable
${D}
The Claude SDK is not configured.
Contact admin to set ANTHROPIC_API_KEY.`,
      mainMenu()
    );
  }

  const typingMsg = await ctx.reply("\u{1F916} Thinking...");

  try {
    const result = await claudeService.sendMessage(userId, args);

    await consumeCredit(userId, CLAUDE_COST, "claude");

    const textBlocks = (result.response.content || []).filter((b) => b.type === "text");
    const responseText = textBlocks.map((b) => b.text).join("\n\n");

    let output = `\u{1F916} Claude + TEOS Sentinel
${D}
${responseText}
`;

    if (result.toolResults.length > 0) {
      output += `\n${D}\n\u{1F6E1}\uFE0F Tool Call Interception:\n`;

      for (const tr of result.toolResults) {
        const icon = tr.status === "BLOCKED" ? "\u{1F6AB}" : tr.status === "WARNED" ? "\u26A0\uFE0F" : "\u2705";
        const risk = tr.guardResult?.riskScore || 0;
        output += `\n${icon} ${tr.toolName} → ${tr.status} (risk: ${risk}/100)\n`;

        if (tr.status === "BLOCKED" && tr.guardResult?.reasons?.length) {
          output += `   Reason: ${tr.guardResult.reasons.slice(0, 2).join(", ")}\n`;
          output += `   Audit: ${tr.guardResult.auditHash?.slice(0, 16)}...\n`;
        }
      }
    }

    output += `\n${D}\nSession: ${result.sessionId}`;

    await ctx.telegram.deleteMessage(ctx.chat.id, typingMsg.message_id);
    await ctx.reply(output, mainMenu());
  } catch (e) {
    logger.error({ userId, err: e?.message }, "claude: command failed");
    await ctx.telegram.deleteMessage(ctx.chat.id, typingMsg.message_id);
    await ctx.reply(
      `\u274C Claude request failed
${D}
Error: ${e.message}
Use /help for available commands.`,
      mainMenu()
    );
  }
}

module.exports = { claudeCommand };
