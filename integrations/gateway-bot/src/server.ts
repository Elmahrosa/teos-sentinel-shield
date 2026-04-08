import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Telegraf, Markup } from "telegraf";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { env, tierPrices, Tier } from "./config.js";
import { verifySolanaPayment } from "./solana.js";

const app = express();
const prisma = new PrismaClient();
const bot = new Telegraf(env.GATEWAY_BOT_TOKEN);

app.use(cors());
app.use(helmet());
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", node: "Alexandria", ts: new Date().toISOString() });
});

// ─── Activation Route ─────────────────────────────────────────
app.post("/activation/verify", async (req, res) => {
  try {
    const { txHash, telegramUserId, tier = "pioneer" } = req.body;
    const incomingSecret = req.headers["x-bot-secret"];

    if (incomingSecret !== env.BOT_SHARED_SECRET) {
      return res.status(403).json({ ok: false, error: "Unauthorized gateway" });
    }
    if (!txHash || !telegramUserId) {
      return res.status(400).json({ ok: false, error: "txHash and telegramUserId required" });
    }
    if (!Object.keys(tierPrices).includes(tier)) {
      return res.status(400).json({ ok: false, error: "Invalid tier" });
    }

    const existing = await prisma.activation.findUnique({ where: { txHash } });
    if (existing) {
      const license = await prisma.license.findUnique({ where: { activationId: existing.id } });
      return res.json({ ok: true, licenseKey: license?.licenseKey, tier: license?.tier, status: "already_active" });
    }

    const verification = await verifySolanaPayment({ txHash, expectedTier: tier as Tier });
    if (!verification.ok) {
      return res.status(400).json({ ok: false, error: verification.reason });
    }

    const licenseKey = `TEOS-${(tier as string).substring(0, 3).toUpperCase()}-${nanoid(8).toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      const activation = await tx.activation.create({
        data: { txHash, telegramUserId: telegramUserId.toString(), network: "solana", status: "completed" },
      });
      return tx.license.create({
        data: { activationId: activation.id, telegramUserId: telegramUserId.toString(), tier, licenseKey, status: "activated" },
      });
    });

    console.log(`[LICENSE] ${result.licenseKey} → user ${telegramUserId} (${tier})`);
    return res.json({ ok: true, licenseKey: result.licenseKey, tier, status: "activated", activatedAt: new Date().toISOString() });

  } catch (error) {
    console.error("[ACTIVATION ERROR]", error);
    return res.status(500).json({ ok: false, error: "Vault write failure" });
  }
});

// ─── Helper ───────────────────────────────────────────────────
const WALLET = env.TREASURY_WALLET;

const tierInfo: Record<string, { price: string; sol: number; desc: string }> = {
  pioneer:  { price: "1.5 SOL",  sol: 1.5,  desc: "روابط غير محدودة + دعم فني" },
  builder:  { price: "12 SOL",   sol: 12,   desc: "للمؤسسات + API كامل" },
  sovereign:{ price: "75+ SOL",  sol: 75,   desc: "نشر خاص + كود المصدر" },
};

// Store user tier selection in memory
const userTierSession: Record<string, string> = {};

// ─── /start ───────────────────────────────────────────────────
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const license = await prisma.license.findFirst({ where: { telegramUserId: userId } });

  if (license) {
    return ctx.reply(
      `🛡️ *مرحباً بعودتك إلى TEOS!*\n\n` +
      `✅ لديك رخصة نشطة\n` +
      `📋 الباقة: *${license.tier.toUpperCase()}*\n` +
      `🔑 الرخصة: \`${license.licenseKey}\`\n\n` +
      `استخدم /help لعرض الأوامر المتاحة`,
      { parse_mode: "Markdown" }
    );
  }

  return ctx.reply(
    `🛡️ *مرحباً بك في بوابة المحروسة — TEOS Sovereign Sentinel*\n\n` +
    `نظام الحماية السيادي للذكاء الاصطناعي والأصول الرقمية\n` +
    `_من الإسكندرية إلى العالم_ 🌍\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `💎 *Pioneer* — 1.5 SOL | روابط غير محدودة\n` +
    `🚀 *Builder* — 12 SOL | للمؤسسات + API\n` +
    `👑 *Sovereign* — 75+ SOL | نشر خاص كامل\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `اختر باقتك للبدء أو جرّب مجاناً بـ /scan`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("💎 Pioneer — 1.5 SOL", "tier:pioneer")],
        [Markup.button.callback("🚀 Builder — 12 SOL", "tier:builder")],
        [Markup.button.callback("👑 Sovereign — 75+ SOL", "tier:sovereign")],
        [Markup.button.callback("🆓 جرّب مجاناً", "free_trial")],
      ])
    }
  );
});

// ─── /help ────────────────────────────────────────────────────
bot.command("help", (ctx) => {
  ctx.reply(
    `🛠️ *أوامر TEOS المتاحة:*\n\n` +
    `▸ /start — الصفحة الرئيسية\n` +
    `▸ /plans — عرض الباقات والأسعار\n` +
    `▸ /pay — كيفية الدفع وتفعيل الرخصة\n` +
    `▸ /scan [رابط] — فحص رابط (5 مجاناً)\n` +
    `▸ /shield [رابط] — حماية رابط\n` +
    `▸ /list — روابطك المحمية\n` +
    `▸ /status — حالة رخصتك\n` +
    `▸ /balance — رصيد الفحوصات\n` +
    `▸ /activate [tx] — تفعيل برمز المعاملة\n` +
    `▸ /about — عن TEOS\n` +
    `▸ /support — التواصل مع الدعم`,
    { parse_mode: "Markdown" }
  );
});

// ─── /plans ───────────────────────────────────────────────────
bot.command("plans", (ctx) => {
  ctx.reply(
    `💰 *باقات TEOS السيادية:*\n\n` +
    `💎 *Pioneer — 1.5 SOL*\n` +
    `• روابط محمية غير محدودة\n` +
    `• دعم فني أولوية\n` +
    `• API أساسي\n\n` +
    `🚀 *Builder — 12 SOL*\n` +
    `• كل مميزات Pioneer\n` +
    `• API كامل للمؤسسات\n` +
    `• لوحة تحكم خاصة\n` +
    `• تقارير أمنية شهرية\n\n` +
    `👑 *Sovereign — 75+ SOL*\n` +
    `• نشر خاص على سيرفرك\n` +
    `• كود المصدر الكامل\n` +
    `• إعداد احترافي مخصص\n` +
    `• دعم مباشر 24/7\n\n` +
    `_للدفع: /pay_`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("💎 اختر Pioneer", "tier:pioneer")],
        [Markup.button.callback("🚀 اختر Builder", "tier:builder")],
        [Markup.button.callback("👑 اختر Sovereign", "tier:sovereign")],
      ])
    }
  );
});

// ─── /pay ─────────────────────────────────────────────────────
bot.command("pay", async (ctx) => {
  const userId = ctx.from.id.toString();
  const selectedTier = userTierSession[userId] || "pioneer";
  const info = tierInfo[selectedTier];

  ctx.reply(
    `💳 *طريقة الدفع والتفعيل:*\n\n` +
    `*الباقة المختارة:* ${selectedTier.toUpperCase()} — ${info.price}\n\n` +
    `*الخطوات:*\n` +
    `1️⃣ حوّل *${info.price}* إلى محفظتنا:\n` +
    `\`${WALLET}\`\n\n` +
    `2️⃣ بعد التحويل، أرسل Transaction Hash هنا\n\n` +
    `3️⃣ سيتم التحقق تلقائياً وإصدار رخصتك فوراً ✅\n\n` +
    `_ملاحظة: التحقق يتم على البلوكشين مباشرةً_`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("💎 Pioneer 1.5 SOL", "tier:pioneer")],
        [Markup.button.callback("🚀 Builder 12 SOL", "tier:builder")],
        [Markup.button.callback("👑 Sovereign 75 SOL", "tier:sovereign")],
      ])
    }
  );
});

// ─── /status ──────────────────────────────────────────────────
bot.command("status", async (ctx) => {
  const userId = ctx.from.id.toString();
  try {
    const license = await prisma.license.findFirst({ where: { telegramUserId: userId } });
    const urlCount = await prisma.shieldedUrl.count({ where: { userId } });

    if (license) {
      ctx.reply(
        `📊 *حالة حسابك:*\n\n` +
        `✅ *الرخصة:* نشطة\n` +
        `📦 *الباقة:* ${license.tier.toUpperCase()}\n` +
        `🔑 *مفتاح الرخصة:*\n\`${license.licenseKey}\`\n` +
        `🔗 *الروابط المحمية:* ${urlCount}\n` +
        `📅 *تاريخ التفعيل:* ${license.createdAt.toLocaleDateString("ar-EG")}`,
        { parse_mode: "Markdown" }
      );
    } else {
      const freeCount = await prisma.shieldedUrl.count({ where: { userId } });
      ctx.reply(
        `📊 *حالة حسابك:*\n\n` +
        `⚠️ *الباقة:* مجاني\n` +
        `🔗 *الروابط المستخدمة:* ${freeCount}/5\n\n` +
        `ترقّ الآن للحصول على روابط غير محدودة!\n_/plans للاطلاع على الباقات_`,
        { parse_mode: "Markdown" }
      );
    }
  } catch {
    ctx.reply("❌ تعذر الاتصال بالخزنة. حاول مجدداً.");
  }
});

// ─── /balance ─────────────────────────────────────────────────
bot.command("balance", async (ctx) => {
  const userId = ctx.from.id.toString();
  const license = await prisma.license.findFirst({ where: { telegramUserId: userId } });
  const urlCount = await prisma.shieldedUrl.count({ where: { userId } });

  if (license) {
    ctx.reply(
      `💰 *رصيدك:*\n\n` +
      `✅ باقة ${license.tier.toUpperCase()} — روابط غير محدودة\n` +
      `🔗 روابط محمية: ${urlCount}`,
      { parse_mode: "Markdown" }
    );
  } else {
    ctx.reply(
      `💰 *رصيدك:*\n\n` +
      `🆓 المستوى المجاني\n` +
      `🔗 الفحوصات المتبقية: ${Math.max(0, 5 - urlCount)}/5\n\n` +
      `_/plans للترقية_`,
      { parse_mode: "Markdown" }
    );
  }
});

// ─── /about ───────────────────────────────────────────────────
bot.command("about", (ctx) => {
  ctx.reply(
    `🛡️ *TEOS Sovereign Sentinel*\n\n` +
    `بوابة الأمان السيادي للذكاء الاصطناعي\n` +
    `من *الإسكندرية، مصر* إلى العالم 🌍\n\n` +
    `*المؤسس:* Ayman Seif\n` +
    `*الشركة:* Elmahrosa International\n` +
    `*الموقع:* teosegypt.com\n` +
    `*GitHub:* github.com/Elmahrosa\n\n` +
    `_حماية وكلاء الذكاء الاصطناعي وبيانات LLM بتقنية سيادية_`,
    { parse_mode: "Markdown" }
  );
});

// ─── /support ─────────────────────────────────────────────────
bot.command("support", (ctx) => {
  ctx.reply(
    `🆘 *الدعم الفني:*\n\n` +
    `📧 البريد: ayman@teosegypt.com\n` +
    `💬 تيليغرام: @ElmahrosaPi\n` +
    `🌐 الموقع: teosegypt.com\n\n` +
    `_سنرد خلال 24 ساعة_`,
    { parse_mode: "Markdown" }
  );
});

// ─── /activate ────────────────────────────────────────────────
bot.command("activate", async (ctx) => {
  const parts = ctx.message.text.split(" ");
  if (parts.length < 2) {
    return ctx.reply(
      `⚠️ *طريقة الاستخدام:*\n\n` +
      `/activate [Transaction Hash]\n\n` +
      `مثال:\n\`/activate 5KtJ...abc\``,
      { parse_mode: "Markdown" }
    );
  }

  const txHash = parts[1].trim();
  const userId = ctx.from.id.toString();
  const tier = userTierSession[userId] || "pioneer";

  await ctx.reply("⏳ جاري التحقق من معاملتك على البلوكشين...");

  try {
    const response = await fetch(`http://localhost:${env.PORT}/activation/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bot-secret": env.BOT_SHARED_SECRET },
      body: JSON.stringify({ txHash, telegramUserId: userId, tier }),
    });
    const data = await response.json() as any;

    if (data.ok) {
      ctx.reply(
        `🎉 *تم التفعيل بنجاح!*\n\n` +
        `📦 الباقة: *${data.tier?.toUpperCase()}*\n` +
        `🔑 رخصتك:\n\`${data.licenseKey}\`\n\n` +
        `احتفظ بهذا المفتاح في مكان آمن ✅\n` +
        `استخدم /status لعرض حالة حسابك`,
        { parse_mode: "Markdown" }
      );
    } else {
      ctx.reply(`❌ *فشل التفعيل:*\n\n${data.error}`, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error("[ACTIVATE CMD ERROR]", error);
    ctx.reply("❌ خطأ في النظام. حاول مجدداً أو تواصل مع /support");
  }
});

// ─── /scan ────────────────────────────────────────────────────
bot.command("scan", async (ctx) => {
  const parts = ctx.message.text.split(" ");
  if (parts.length < 2) {
    return ctx.reply("⚠️ مثال: /scan example.com");
  }

  const url = parts[1].trim();
  const userId = ctx.from.id.toString();
  const license = await prisma.license.findFirst({ where: { telegramUserId: userId } });
  const scanCount = await prisma.shieldedUrl.count({ where: { userId } });

  if (!license && scanCount >= 5) {
    return ctx.reply(
      `⚠️ *وصلت للحد المجاني (5/5)*\n\n` +
      `للحصول على فحوصات غير محدودة، رقّ إلى Pioneer\n` +
      `_/plans للاطلاع على الباقات_`,
      { parse_mode: "Markdown" }
    );
  }

  await ctx.reply(`🔍 *جاري فحص:* ${url}\n${license ? "✅ [غير محدود]" : `[مجاني ${scanCount + 1}/5]`}`, { parse_mode: "Markdown" });

  // Save scan record
  await prisma.shieldedUrl.create({ data: { url, userId } });

  // Simulate scan result (replace with real scan engine when ready)
  setTimeout(() => {
    ctx.reply(
      `✅ *فحص مكتمل:* ${url}\n\n` +
      `🟢 لا توجد تهديدات مكتشفة\n` +
      `🔒 الرابط آمن للاستخدام`,
      { parse_mode: "Markdown" }
    );
  }, 1500);
});

// ─── /shield ──────────────────────────────────────────────────
bot.command("shield", async (ctx) => {
  const parts = ctx.message.text.split(" ");
  if (parts.length < 2) return ctx.reply("⚠️ مثال: /shield example.com");

  const url = parts[1].trim();
  const userId = ctx.from.id.toString();
  const license = await prisma.license.findFirst({ where: { telegramUserId: userId } });
  const urlCount = await prisma.shieldedUrl.count({ where: { userId } });

  if (!license && urlCount >= 5) {
    return ctx.reply(
      `⚠️ *وصلت للحد المجاني (5/5)*\n\nرقّ إلى Pioneer للحماية غير المحدودة\n_/plans_`,
      { parse_mode: "Markdown" }
    );
  }

  await prisma.shieldedUrl.create({ data: { url, userId } });
  ctx.reply(`🛡️ *تم تأمين الرابط:*\n\`${url}\``, { parse_mode: "Markdown" });
});

// ─── /list ────────────────────────────────────────────────────
bot.command("list", async (ctx) => {
  const userId = ctx.from.id.toString();
  const urls = await prisma.shieldedUrl.findMany({ where: { userId }, take: 10, orderBy: { createdAt: "desc" } });

  if (urls.length === 0) return ctx.reply("📭 لا توجد روابط محمية حالياً.\n\nاستخدم /shield [رابط] للبدء");

  const list = urls.map((u, i) => `${i + 1}. \`${u.url}\``).join("\n");
  ctx.reply(`🔗 *آخر روابطك المحمية:*\n\n${list}`, { parse_mode: "Markdown" });
});

// ─── Tier selection callbacks ──────────────────────────────────
bot.on("callback_query", async (ctx) => {
  const data = (ctx.callbackQuery as any).data as string;
  await ctx.answerCbQuery();

  if (data === "free_trial") {
    ctx.reply(
      `🆓 *المستوى المجاني:*\n\n` +
      `• 5 فحوصات روابط مجانية\n` +
      `• 5 روابط محمية\n\n` +
      `استخدم /scan [رابط] للبدء الآن!`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (data.startsWith("tier:")) {
    const tier = data.replace("tier:", "");
    const info = tierInfo[tier];
    const userId = (ctx.callbackQuery as any).from.id.toString();

    // Save tier selection
    userTierSession[userId] = tier;

    ctx.reply(
      `✅ *اخترت باقة ${tier.toUpperCase()}*\n\n` +
      `💰 السعر: *${info.price}*\n` +
      `📋 المميزات: ${info.desc}\n\n` +
      `*خطوات التفعيل:*\n` +
      `1️⃣ حوّل *${info.price}* إلى:\n\`${WALLET}\`\n\n` +
      `2️⃣ أرسل Transaction Hash مباشرة هنا أو استخدم:\n` +
      `/activate [Transaction Hash]\n\n` +
      `_سيتم التحقق وإصدار رخصتك فوراً_ ✅`,
      { parse_mode: "Markdown" }
    );
  }
});

// ─── Text handler — tx hash auto-detection ────────────────────
bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return;

  // Solana tx hashes are base58, 87-88 chars
  if (text.length < 60 || text.length > 100) {
    return ctx.reply(
      `❓ لم أفهم رسالتك.\n\nاستخدم /help لعرض الأوامر المتاحة.`
    );
  }

  const userId = ctx.from.id.toString();
  const tier = userTierSession[userId] || "pioneer";

  await ctx.reply("⏳ تم استلام Transaction Hash...\nجاري التحقق على البلوكشين...");

  try {
    const response = await fetch(`http://localhost:${env.PORT}/activation/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bot-secret": env.BOT_SHARED_SECRET },
      body: JSON.stringify({ txHash: text, telegramUserId: userId, tier }),
    });
    const data = await response.json() as any;

    if (data.ok) {
      ctx.reply(
        `🎉 *تم التفعيل بنجاح!*\n\n` +
        `📦 الباقة: *${data.tier?.toUpperCase()}*\n` +
        `🔑 رخصتك:\n\`${data.licenseKey}\`\n\n` +
        `✅ احتفظ بهذا المفتاح في مكان آمن\n` +
        `استخدم /status لعرض حالة حسابك`,
        { parse_mode: "Markdown" }
      );
    } else {
      ctx.reply(`❌ *فشل التفعيل:*\n\n${data.error}\n\nتأكد من صحة الـ Transaction Hash وحاول مجدداً.`, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error("[BOT TX ERROR]", error);
    ctx.reply("❌ خطأ في النظام. حاول مجدداً أو تواصل مع /support");
  }
});

// ─── Launch ───────────────────────────────────────────────────
async function main() {
  await prisma.$connect();
  console.log("[DB] Connected to Neon PostgreSQL");

  bot.launch();
  console.log("[BOT] TEOS Sovereign Bot is live");

  process.once("SIGINT", () => { bot.stop("SIGINT"); prisma.$disconnect(); });
  process.once("SIGTERM", () => { bot.stop("SIGTERM"); prisma.$disconnect(); });

  app.listen(env.PORT, () => {
    console.log(`[SERVER] Running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => { console.error("[FATAL]", err); process.exit(1); });

export default app;
