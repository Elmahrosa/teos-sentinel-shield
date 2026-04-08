import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import axios from 'axios';

// Import routes (Mandatory .js extensions for NodeNext compatibility)
import healthRoutes from './routes/health.js';
import activationRoutes from './routes/activation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Use the key from your .env file
const BOT_TOKEN = process.env.GATEWAY_BOT_TOKEN;
const BOT_SECRET = process.env.BOT_SHARED_SECRET;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Mount routes
app.use('/health', healthRoutes);
app.use('/activation', activationRoutes);

// Initialize Telegram Bot
if (BOT_TOKEN) {
  const bot = new Telegraf(BOT_TOKEN);
  
  bot.start((ctx) => {
    ctx.reply('🛡️ بوابة المحروسة (TEOS) جاهزة للعمل من الإسكندرية.\n\nاختر باقتك للبدء:');
  });
  
  bot.on('text', async (ctx) => {
    const txHash = ctx.message.text;
    if (txHash.length < 30) return;
    
    try {
      const response = await axios.post(`http://localhost:${PORT}/activation/verify`, {
        txHash,
        telegramUserId: ctx.from.id.toString(),
        network: 'solana'
      }, {
        headers: { 'x-bot-secret': BOT_SECRET }
      });
      
      ctx.reply(`✅ تم التفعيل!\nرخصتك: ${response.data.licenseKey}`);
    } catch (error) {
      // Cast error as any to bypass "unknown" type safety for response/message
      const err = error as any;
      console.error('Bot Verification Error:', err.response?.data || err.message || err);
      ctx.reply('❌ فشل التفعيل');
    }
  });
  
  bot.launch().then(() => {
    console.log('🤖 TEOS Bot is Live & Connected!');
  }).catch(err => {
    console.error('Bot launch failed:', err.message);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Activation: POST http://localhost:${PORT}/activation/verify`);
});

export default app;