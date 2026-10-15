const { modelService, MODELS } = require('../../services/model.service');
const { consumeCredit, getCredits } = require('../../services/activation.service');
const { scanWithMcp } = require('../../services/mcp.service');
const { mainMenu } = require('../menus');
const { D } = require('../../utils/formatting');
const { logger } = require('../../../logger.cjs');

async function chatCommand(ctx) {
  const userId = String(ctx.from.id);
  const args = ctx.message.text.split(' ').slice(1).join(' ').trim();

  if (!args) {
    const modelId = modelService.getUserModel(userId);
    const cfg = MODELS[modelId];
    return ctx.reply(
`💬 *Chat with AI* · ${cfg?.label || 'Llama 3 8B'} (${cfg?.cost || 1} cr/msg)
All outputs scanned by TEOS before you see them.
${D}
Try these:
/chat Write a Python script that sorts a CSV
/chat What does rm -rf / do?
/chat Explain how to secure an Express API

Select another model: /model
Check balance: /credits`,
      { parse_mode: "Markdown" }
    );
  }

  let modelId = modelService.getUserModel(userId);
  let cfg = MODELS[modelId];
  if (!cfg || !modelService.isModelAvailable(modelId)) {
    const available = modelService.getAvailableModels(!!process.env.GROQ_API_KEY, !!process.env.ANTHROPIC_API_KEY);
    if (available.length === 0) {
      return ctx.reply(`❌ No AI models available. Contact support.`, mainMenu());
    }
    modelId = available[0].id;
    cfg = MODELS[modelId];
    modelService.setUserModel(userId, modelId);
  }

  const cost = cfg.cost;

  let credits = 0;
  try { credits = await getCredits(userId); } catch (e) { logger.warn({ userId, err: e?.message }, 'chat: credits fail'); }
  if (credits < cost) {
    return ctx.reply(`❌ Need ${cost} credits. You have ${credits}.\nUse /plans to see options.`, mainMenu());
  }

  const typingMsg = await ctx.reply(`🧠 ${cfg.label} thinking...`);

  try {
    const result = await modelService.chat(userId, args, modelId);

    await consumeCredit(userId, cost, `chat_${modelId}`);

    const scanResult = await scanWithMcp(result.text);
    const verdict = scanResult?.verdict || 'ALLOW';
    const score = scanResult?.score || 0;
    const rule = scanResult?.provenanceAnalysis?.decisiveRule || scanResult?.findings?.[0]?.rule || '';

    if (verdict === 'BLOCK') {
      await ctx.telegram.deleteMessage(ctx.chat.id, typingMsg.message_id);
      return ctx.reply(
        `🚫 TEOS BLOCKED Output
${D}
${cfg.label} generated a response that was BLOCKED by the security scanner.

Risk Score: ${score}/100
Rule: ${rule || 'Unknown'}

Reason: The model's output contained potentially dangerous content.
Try rephrasing your request to avoid generating dangerous commands.`,
        mainMenu()
      );
    }

    let header = `🧠 ${cfg.label} · ${verdict === 'WARN' ? '⚠️ WARN' : '✅ ALLOW'} · ${score}/100`;
    if (rule) header += ` · ${rule}`;
    header += `\n${D}\n`;

    const output = header + result.text + `\n\n${D}\nSession: ${result.sessionId || modelId}`;

    if (output.length > 4000) {
      const truncated = output.slice(0, 3800) + '\n\n... (truncated, output too long)';
      await ctx.telegram.deleteMessage(ctx.chat.id, typingMsg.message_id);
      await ctx.reply(truncated, mainMenu());
    } else {
      await ctx.telegram.deleteMessage(ctx.chat.id, typingMsg.message_id);
      await ctx.reply(output, mainMenu());
    }
  } catch (e) {
    logger.error({ userId, modelId, err: e?.message }, 'chat: failed');
    await ctx.telegram.deleteMessage(ctx.chat.id, typingMsg.message_id);
    const friendly = e.response?.status === 429
      ? `❌ ${cfg.label} is rate limited. The Groq free tier has a limit of ~30 requests per minute.\n\n⏳ Wait a few seconds and try again.\n💡 Use /model to switch models.`
      : `❌ ${cfg.label} request failed: ${e.message}`;
    await ctx.reply(friendly, mainMenu());
  }
}

module.exports = { chatCommand };
