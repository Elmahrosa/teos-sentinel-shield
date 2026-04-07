import { Telegraf } from 'telegraf';
import axios from 'axios';
import { env } from './config.js';

const bot = new Telegraf(process.env.GATEWAY_BOT_TOKEN || '');

bot.start((ctx) => {
    ctx.reply('🛡️ مرحباً بك في بوابة المحروسة (TEOS)\n\nاختر الباقة المناسبة لتفعيل خدماتك:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: "💎 Pioneer (1.5 SOL)", callback_data: "pioneer" }],
                [{ text: "🚀 Builder (12 SOL)", callback_data: "builder" }],
                [{ text: "👑 Sovereign (75+ SOL)", callback_data: "sovereign" }]
            ]
        }
    });
});

bot.on('callback_query', async (ctx) => {
    const tier = (ctx.callbackQuery as any).data;
    await ctx.reply(`لقد اخترت باقة ${tier.toUpperCase()}.\nالرجاء إرسال الـ Transaction Hash للتأكد من الدفع:`);
});

bot.on('text', async (ctx) => {
    const txHash = ctx.message.text;
    try {
        const response = await axios.post('http://localhost:8080/activation/verify', {
            txHash,
            telegramUserId: ctx.from.id.toString(),
            network: 'solana'
        }, {
            headers: { 'x-bot-secret': env.BOT_SHARED_SECRET }
        });
        
        ctx.reply('✅ تم التفعيل بنجاح! رخصتك هي: ' + response.data.licenseKey);
    } catch (error: any) {
        ctx.reply('❌ فشل التفعيل: ' + (error.response?.data?.reason || 'خطأ في النظام'));
    }
});

bot.launch().then(() => console.log('🤖 TEOS Bot is Live!'));
