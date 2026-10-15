const { Markup } = require("telegraf");
const { logger } = require("../../logger.cjs");

let loggerInstance;
try {
  loggerInstance = require("../../../logger.cjs").logger;
} catch {
  loggerInstance = console;
}

function buy1Command(ctx) {
  const walletAddress = process.env.SOLANA_ADDRESS || "Aai9XYkpQMrVMLTP5CKHSin1UoJ12rU2FSupGwpNwMQ6";

  // Generate or load QR code - for now we'll use a placeholder
  // In production, you'd generate this dynamically or load a pre-generated one
  const qrCodePath = "./teos_real_qr.png";

  ctx.replyWithPhoto({ source: qrCodePath }, {
    caption: `⭐ $1 STARTER — 5 credits = 1 token scan\n\n💸 ادفع 1 USDC على Solana:\n\`${walletAddress}\`\n\nNetwork: Solana (SPL)\nMin: 1 USDC\n\nبعد الدفع ابعت:\n/verify TX_HASH`,
    parse_mode: 'Markdown'
  }).catch(err => {
    loggerInstance.error({ err, userId: ctx.from?.id }, "Failed to send buy1 command photo");
    // Fallback to text-only if photo fails
    ctx.reply(
      `⭐ $1 STARTER — 5 credits = 1 token scan\n\n💸 ادفع 1 USDC على Solana:\n\`${walletAddress}\`\n\nNetwork: Solana (SPL)\nMin: 1 USDC\n\nبعد الدفع ابعت:\n/verify TX_HASH`,
      { parse_mode: 'Markdown' }
    );
  });
}

module.exports = { buy1Command };