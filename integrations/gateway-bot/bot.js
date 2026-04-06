const TelegramBot = require('node-telegram-bot-api');
const { Connection, PublicKey } = require('@solana/web3.js');

// Configuration from your .env
const token = process.env.GATEWAY_BOT_TOKEN;
const solanaWallet = process.env.SOLANA_PAY_WALLET;
const priceInSol = 0.5; // Example: 0.5 SOL for access

const bot = new TelegramBot(token, {polling: true});
const connection = new Connection("https://api.mainnet-beta.solana.com");

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🛡️ Welcome to TEOS Sentinel Shield.\n\nTo activate your Sovereign AI Defense, please send " + priceInSol + " SOL to:\n\n`" + solanaWallet + "`\n\nAfter paying, send your Transaction ID here.", {parse_mode: "Markdown"});
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.length > 30 && !text.includes('/')) {
        bot.sendMessage(chatId, "🔍 Verifying transaction on Solana Mainnet...");
        
        try {
            const status = await connection.getSignatureStatus(text);
            if (status && status.value && status.value.confirmationStatus === 'finalized') {
                bot.sendMessage(chatId, "✅ Payment Verified! Here is your Sovereign Access Key:\n\n`TEOS-SHIELD-" + Math.random().toString(36).toUpperCase().substring(2, 12) + "`\n\nUse this key in your Dashboard to connect to the Core Engine.");
            } else {
                bot.sendMessage(chatId, "⏳ Transaction still pending or invalid. Please wait and try again.");
            }
        } catch (err) {
            bot.sendMessage(chatId, "❌ Error verifying transaction. Ensure the ID is correct.");
        }
    }
});

console.log("Sovereign Gateway Bot is running...");
