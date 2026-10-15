const { Markup } = require("telegraf");
const { logger } = require("../../logger.cjs");

let loggerInstance;
try {
  loggerInstance = require("../../../logger.cjs").logger;
} catch {
  loggerInstance = console;
}

const WALLET_ADDRESS = process.env.SOLANA_ADDRESS || "Aai9XYkpQMrVMLTP5CKHSin1UoJ12rU2FSupGwpNwMQ6";

const MICRO_MSG = `
💎 **TEOS Sentinel - Plans**

عندنا باقة واحدة شغالة حالياً:

**🔹 Micro Pack**
💰 1 USDC = 5 Credits = 1 Token Scan

للبدء:
1️⃣ دوس /buy1
2️⃣ ابعت 1 USDC للعنوان
\`${WALLET_ADDRESS}\`
3️⃣ دوس /verify TX_HASH

البوت هيضيفلك الـ 5 كريدت أوتوماتيك.
`;

function planHandler(ctx) {
  return ctx.reply(MICRO_MSG, { parse_mode: 'Markdown' });
}

module.exports = { planHandler };