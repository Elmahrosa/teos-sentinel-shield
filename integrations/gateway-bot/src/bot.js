import { Telegraf } from 'telegraf';
import axios from 'axios';
import { env } from './config.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.GATEWAY_BOT_TOKEN || '');

// --- 1. START & HELP COMMANDS ---
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

bot.command('help', (ctx) => {
    ctx.reply(
        "🛠️ **قائمة الأوامر المتاحة:**\n\n" +
        "/start - بداية التشغيل\n" +
        "/plans - عرض باقات الاشتراك\n" +
        "/shield - تأمين رابط جديد\n" +
        "/list - عرض روابطك المؤمنة\n" +
        "/status - فحص حالة الرخصة\n" +
        "/activate - تفعيل كود الرخصة"
    );
});

// --- 2. PLANS & STATUS ---
bot.command('plans', (ctx) => {
    ctx.reply(
        "💎 **باقات TEOS السيادية:**\n\n" +
        "1️⃣ **المستوى المجاني**: حتى 5 روابط.\n" +
        "2️⃣ **Pioneer**: روابط غير محدودة + دعم فني (1.5 SOL)\n" +
        "3️⃣ **Builder**: للمؤسسات والشركات (12 SOL)\n\n" +
        "قم بإرسال Hash المعاملة هنا للتفعيل التلقائي."
    );
});

bot.command('status', async (ctx) => {
    const userId = ctx.from.id.toString();
    try {
        const license = await prisma.license.findFirst({
            where: { telegramUserId: userId }
        });
        const urlCount = await prisma.shieldedUrl.count({
            where: { userId: userId }
        });

        const statusLabel = license ? `✅ نشط (${license.tier})` : "⚠️ المستوى المجاني";
        ctx.reply(`📊 **حالة الحساب:**\n\nالمستوى: ${statusLabel}\nالروابط المحمية: ${urlCount}/5`);
    } catch (err) {
        ctx.reply("❌ تعذر الاتصال بالخزنة السحابية.");
    }
});

// --- 3. URL SHIELDING LOGIC ---
bot.command('shield', async (ctx) => {
    const messageText = ctx.message.text.split(' ');
    if (messageText.length < 2) {
        return ctx.reply('⚠️ الرجاء إرسال الرابط. مثال:\n/shield example.com');
    }

    const urlToShield = messageText[1];
    const userId = ctx.from.id.toString();

    try {
        const license = await prisma.license.findFirst({
            where: { telegramUserId: userId }
        });
        const urlCount = await prisma.shieldedUrl.count({
            where: { userId: userId }
        });

        if (!license && urlCount >= 5) {
            return ctx.reply("⚠️ تم الوصول للحد الأقصى (5/5). يرجى الترقية لـ Pioneer Pro.");
        }

        await prisma.shieldedUrl.create({
            data: { url: urlToShield, userId: userId }
        });
        ctx.reply(`✅ تم التأمين: ${urlToShield}`);
    } catch (error) {
        ctx.reply("❌ خطأ في قاعدة البيانات.");
    }
});

bot.command('list', async (ctx) => {
    const userId = ctx.from.id.toString();
    const urls = await prisma.shieldedUrl.findMany({
        where: { userId: userId },
        take: 10
    });

    if (urls.length === 0) return ctx.reply("📭 لا توجد روابط مؤمنة حالياً.");
    
    const list = urls.map((u, i) => `${i + 1}. ${u.url}`).join('\n');
    ctx.reply(`🔗 **روابطك المؤمنة:**\n\n${list}`);
});

// --- 4. TRANSACTION VERIFICATION ---
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

        ctx.reply(`✅ تم التفعيل بنجاح!\nرخصتك: \`${response.data.licenseKey}\``, { parse_mode: 'MarkdownV2' });
    } catch (error) {
        ctx.reply(`❌ فشل التفعيل: ${error.response?.data?.error || 'خطأ في النظام'}`);
    }
});

bot.launch().then(() => console.log('🤖 TEOS Sovereign Bot is Live on Neon Cloud!'));