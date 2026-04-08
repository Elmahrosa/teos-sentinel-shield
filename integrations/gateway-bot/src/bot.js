import { Telegraf } from 'telegraf';
import axios from 'axios';
import { env } from './config.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.GATEWAY_BOT_TOKEN || '');

// --- 1. START COMMAND ---
bot.start((ctx) => {
    ctx.reply('🛡️ مرحباً بك في بوابة المحروسة (TEOS)\n\nنظام تأمين الأصول الرقمية السيادي. اختر الباقة المناسبة لتفعيل خدماتك أو ابدأ باستخدام المستوى المجاني (5 روابط):', {
        reply_markup: {
            inline_keyboard: [
                [{ text: "💎 Pioneer (1.5 SOL)", callback_data: "pioneer" }],
                [{ text: "🚀 Builder (12 SOL)", callback_data: "builder" }],
                [{ text: "👑 Sovereign (75+ SOL)", callback_data: "sovereign" }]
            ]
        }
    });
});

// --- 2. URL SHIELDING LOGIC (Free Tier Limit) ---
bot.command('shield', async (ctx) => {
    const messageText = ctx.message.text.split(' ');
    if (messageText.length < 2) {
        return ctx.reply('⚠️ الرجاء إرسال الرابط بعد الأمر. مثال:\n/shield example.com');
    }

    const urlToShield = messageText[1];
    const userId = ctx.from.id.toString();

    try {
        // Check for Active License
        const license = await prisma.license.findFirst({
            where: { telegramUserId: userId, status: 'activated' }
        });

        // Count existing URLs
        const urlCount = await prisma.shieldedUrl.count({
            where: { userId: userId }
        });

        // Apply Sovereign Logic: 5 URL limit for Free Tier
        if (!license && urlCount >= 5) {
            return ctx.reply(
                "⚠️ **تم الوصول للحد الأقصى للمستوى المجاني**\n\n" +
                "أنت تقوم بحماية 5/5 روابط حالياً. لحماية المزيد من الأصول، يرجى تفعيل رخصة **Pioneer Pro**."
            );
        }

        await prisma.shieldedUrl.create({
            data: { url: urlToShield, userId: userId }
        });

        ctx.reply(`✅ **تم تأمين الرابط:** ${urlToShield}\nالحالة: المراقبة نشطة.`);
    } catch (error) {
        console.error('Vault Error:', error);
        ctx.reply("❌ خطأ في الاتصال بخزنة البيانات السحابية.");
    }
});

// --- 3. TRANSACTION VERIFICATION ---
bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return;

    try {
        const response = await axios.post('http://localhost:8080/activation/verify', {
            txHash: text,
            telegramUserId: ctx.from.id.toString(),
            network: 'solana'
        }, {
            headers: { 'x-bot-secret': env.BOT_SHARED_SECRET }
        });

        ctx.reply('✅ تم التفعيل بنجاح! رخصتك السيادية هي:\n\n' + `\`${response.data.licenseKey}\``, { parse_mode: 'MarkdownV2' });
    } catch (error) {
        ctx.reply(`❌ فشل التفعيل: ${error.response?.data?.error || 'خطأ في النظام'}`);
    }
});

bot.launch().then(() => console.log('🤖 TEOS Sovereign Bot is Live on Neon Cloud!'));