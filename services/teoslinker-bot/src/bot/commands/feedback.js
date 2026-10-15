const { D } = require("../../utils/formatting");
const { logAudit } = require("../../services/activation.service");
const { emit } = require("../../services/telemetry.service");
let logger;
try {
  logger = require("../../../logger.cjs").logger;
} catch {
  logger = console;
}

async function feedbackCommand(ctx) {
  const userId = String(ctx.from.id);
  const text = ctx.message.text.replace(/^\/feedback(@\w+)?\s*/i, "").trim();

  if (!text) {
    return ctx.reply(
`\u{1F6E1}\uFE0F *TEOS Feedback*
${D}
Help us improve TEOS Sentinel by reporting issues, false positives, or suggestions.

Usage:
/feedback <your message>

Examples:
/feedback The scan missed a secret in my code
/feedback False positive on /scan rm -rf /
/feedback Add support for Python dependency scanning

Your feedback is stored securely and reviewed by the team.`,
      { parse_mode: "Markdown" }
    );
  }

  if (text.length > 2000) {
    return ctx.reply("\u274C Feedback too long. Please keep it under 2000 characters.");
  }

  const cooldown = feedbackCooldowns.get(userId);
  if (cooldown && Date.now() - cooldown < 10000) {
    return ctx.reply("\u23F3 Please wait 10 seconds between feedback submissions.");
  }
  feedbackCooldowns.set(userId, Date.now());

  try {
    const { recordFeedback } = require("../../services/analytics.service");
    const feedbackId = await recordFeedback({
      userId,
      text,
      source: "telegram",
      timestamp: new Date().toISOString()
    });

    emit("feedback", { userId, feedbackId, textLength: text.length });

    await ctx.reply(
`\u2705 *Feedback received!*
${D}
Thank you for helping improve TEOS Sentinel.
Reference: \`${feedbackId || userId.slice(0, 8)}\`

Your feedback has been shared with the team.`,
      { parse_mode: "Markdown" }
    );

    logAudit(userId, 'feedback', text.slice(0, 100), 'INFO', 0, 0, 0);
  } catch (err) {
    logger.error({ err, userId }, "Feedback submission failed");

    try {
      const fs = require('fs');
      const path = require('path');
      const feedbackDir = path.join(__dirname, '..', '..', '..', 'data');
      if (!fs.existsSync(feedbackDir)) fs.mkdirSync(feedbackDir, { recursive: true });
      const feedbackFile = path.join(feedbackDir, 'feedback.json');
      const entry = { userId, text, timestamp: new Date().toISOString(), id: Date.now().toString(36) };
      let entries = [];
      try { entries = JSON.parse(fs.readFileSync(feedbackFile, 'utf8')); } catch (err) { logger.warn({ err }, "feedback file read failed"); }
      entries.push(entry);
      fs.writeFileSync(feedbackFile, JSON.stringify(entries, null, 2));

      logger.info({ userId, feedbackId: entry.id }, "Feedback saved to local file");

      await ctx.reply(
`\u2705 *Feedback saved!*
${D}
Reference: \`${entry.id}\`
Thank you for helping improve TEOS Sentinel.`,
        { parse_mode: "Markdown" }
      );
    } catch (fallbackErr) {
      logger.error({ err: fallbackErr, userId }, "Local feedback save also failed");
      await ctx.reply("\u274C Could not save feedback. Please try again later.");
    }
  }
}

const feedbackCooldowns = new Map();

module.exports = { feedbackCommand };
