import express from 'express';
import { env } from './config.js';
// استيراد الـ Routes ككتل (Modules)
import * as activationModule from './routes/activation.js';
import * as healthModule from './routes/health.js';
import { Telegraf } from 'telegraf';
import axios from 'axios';

const app = express();
app.use(express.json());

// وظيفة ذكية لاستخراج الـ Router الحقيقي من الـ Module
const getRouter = (mod: any) => {
  // جرب استخراج الـ router أو الـ default أو الموديل نفسه كدالة
  return mod.router || mod.default || (typeof mod === 'function' ? mod : null);
};

const activationRouter = getRouter(activationModule);
const healthRouter = getRouter(healthModule);

if (healthRouter) app.use('/health', healthRouter);
if (activationRouter) app.use('/activation', activationRouter);

// إعداد البوت باستخدام التوكن من ملف الـ .env
const bot = new Telegraf(process.env.GATEWAY_BOT_TOKEN || '');

bot.start((ctx) => {
  ctx.reply('🛡️ بوابة المحروسة (TEOS) جاهزة للعمل من الإسكندرية.');
});

bot.on('text', async (ctx) => {
  const txHash = ctx.message.text;
  if (txHash.length < 30) return;
  try {
    const response = await axios.post(`http://localhost:${env.PORT}/activation/verify`, {
      txHash,
      telegramUserId: ctx.from.id.toString(),
      network: 'solana'
    }, {
      headers: { 'x-bot-secret': env.BOT_SHARED_SECRET }
    });
    ctx.reply('✅ تم التفعيل بنجاح!');
  } catch (error) {
    ctx.reply('❌ فشل في التفعيل.');
  }
});

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  if (process.env.GATEWAY_BOT_TOKEN) {
    bot.launch().then(() => console.log('🤖 TEOS Bot is Live & Connected!'));
  }
});