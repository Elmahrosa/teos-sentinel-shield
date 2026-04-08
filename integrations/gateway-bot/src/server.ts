import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Telegraf } from "telegraf";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { env, tierPrices, Tier } from "./config.js";
import { verifySolanaPayment } from "./solana.js";

const app = express();
const prisma = new PrismaClient();
const bot = new Telegraf(env.GATEWAY_BOT_TOKEN);

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(helmet());
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", node: "Alexandria", ts: new Date().toISOString() });
});

// ─── Activation Route (single, Solana-verified) ───────────────
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

    // Replay attack protection
    const existing = await prisma.activation.findUnique({ where: { txHash } });
    if (existing) {
      const license = await prisma.license.findUnique({
        where: { activationId: existing.id },
      });
      return res.json({
        ok: true,
        licenseKey: license?.licenseKey,
        status: "already_active",
        note: "Existing license retrieved",
      });
    }

    // On-chain verification
    const verification = await verifySolanaPayment({
      txHash,
      expectedTier: tier as Tier,
    });

    if (!verification.ok) {
      return res.status(400).json({ ok: false, error: verification.reason });
    }

    // Atomic write
    const licenseKey = `TEOS-${(tier as string).substring(0, 3).toUpperCase()}-${nanoid(8).toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      const activation = await tx.activation.create({
        data: {
          txHash,
          telegramUserId: telegramUserId.toString(),
          network: "solana",
          status: "completed",
        },
      });

      const license = await tx.license.create({
        data: {
          activationId: activation.id,
          telegramUserId: telegramUserId.toString(),
          tier,
          licenseKey,
          status: "activated",
        },
      });

      return license;
    });

    console.log(`[LICENSE] ${result.licenseKey} → user ${telegramUserId} (${tier})`);

    return res.json({
      ok: true,
      licenseKey: result.licenseKey,
      tier,
      status: "activated",
      activatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ACTIVATION ERROR]", error);
    return res.status(500).json({ ok: false, error: "Vault write failure" });
  }
});

// ─── Bot Commands ─────────────────────────────────────────────
bot.start((ctx) => {
  ctx.reply(
    "🛡️ مرحباً بك في بوابة المحروسة (TEOS)\n\n" +
    "نظام تأمين الأصول الرقمية السيادي.\n" +
    "اختر الباقة المناسبة للبدء:",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💎 Pioneer — 1.5 SOL", callback_data: "tier:pioneer" }],
          [{ text: "🚀 Builder — 12 SOL", callback_data: "tier:builder" }],
          [{ text: "👑 Sovereign — 75+ SOL", callback_data: "tier:sovereign" }],
        ],
      },
    }
  );
});

bot.command("help", (ctx) => {
  ctx.reply(
    "🛠️ الأوامر المتاحة:\n\n" +
    "/start — البداية واختيار الباقة\n" +
    "/plans — عرض الأسعار\n" +
    "/shield [رابط] — تأمين رابط جديد\n" +
    "/list — روابطك المؤمنة\n" +
    "/status — حالة رخصتك"
  );
});

bot.command("plans", (ctx) => {
  ctx.reply(
    "💎 باقات TEOS:\n\n" +
    "Pioneer — 1.5 SOL: روابط غير محدودة + دعم\n" +
    "Builder — 12 SOL: للمؤسسات والشركات\n" +
    "Sovereign — 75+ SOL: نشر خاص + كود المصدر\n\n" +
    "أرسل الـ Transaction Hash بعد الدفع للتفعيل الفوري."
  );
});

bot.command("status", async (ctx) => {
  const userId = ctx.from.id.toString();
  try {
    const license = await prisma.license.findFirst({
      where: { telegramUserId: userId },
    });
    const urlCount = await prisma.shieldedUrl.count({ where: { userId } });
    const statusLabel = license
      ? `✅ نشط — ${license.tier} (${license.licenseKey})`
      : "⚠️ المستوى المجاني (5 روابط)";
    ctx.reply(`📊 حالة الحساب:\n\nالمستوى: ${statusLabel}\nالروابط المحمية: ${urlCount}`);
  } catch {
    ctx.reply("❌ تعذر الاتصال بالخزنة.");
  }
});

bot.command("shield", async (ctx) => {
  const parts = ctx.message.text.split(" ");
  if (parts.length < 2) {
    return ctx.reply("⚠️ مثال: /shield example.com");
  }
  const url = parts[1];
  const userId = ctx.from.id.toString();
  try {
    const license = await prisma.license.findFirst({ where: { telegramUserId: userId } });
    const urlCount = await prisma.shieldedUrl.count({ where: { userId } });
    if (!license && urlCount >= 5) {
      return ctx.reply("⚠️ وصلت للحد الأقصى (5/5). يرجى الترقية لـ Pioneer.");
    }
    await prisma.shieldedUrl.create({ data: { url, userId } });
    ctx.reply(`✅ تم التأمين: ${url}`);
  } catch {
    ctx.reply("❌ خطأ في قاعدة البيانات.");
  }
});

bot.command("list", async (ctx) => {
  const userId = ctx.from.id.toString();
  const urls = await prisma.shieldedUrl.findMany({ where: { userId }, take: 10 });
  if (urls.length === 0) return ctx.reply("📭 لا توجد روابط مؤمنة حالياً.");
  const list = urls.map((u, i) => `${i + 1}. ${u.url}`).join("\n");
  ctx.reply(`🔗 روابطك المؤمنة:\n\n${list}`);
});

// Tier selection callback
bot.on("callback_query", async (ctx) => {
  const data = (ctx.callbackQuery as any).data as string;
  if (data.startsWith("tier:")) {
    const tier = data.replace("tier:", "");
    const prices: Record<string, string> = {
      pioneer: "1.5 SOL",
      builder: "12 SOL",
      sovereign: "75+ SOL",
    };
    await ctx.answerCbQuery();
    ctx.reply(
      `اخترت باقة ${tier.toUpperCase()} — ${prices[tier]}\n\n` +
      `أرسل الـ Transaction Hash بعد تحويل المبلغ لمحفظتنا:\n` +
      `\`${env.TREASURY_WALLET}\``,
      { parse_mode: "Markdown" }
    );
  }
});

// Text handler — only processes tx hashes (64 chars), ignores everything else
bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return;

  // Solana tx hashes are base58, 87-88 chars
  if (text.length < 60 || text.length > 100) {
    return ctx.reply("❓ أرسل Transaction Hash أو استخدم /help لعرض الأوامر.");
  }

  await ctx.reply("⏳ جاري التحقق من الدفع على البلوكشين...");

  try {
    // Auto-detect tier from active session — default pioneer
    const response = await fetch(`http://localhost:${env.PORT}/activation/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": env.BOT_SHARED_SECRET,
      },
      body: JSON.stringify({
        txHash: text,
        telegramUserId: ctx.from.id.toString(),
        tier: "pioneer",
      }),
    });

    const data = await response.json() as any;

    if (data.ok) {
      ctx.reply(
        `✅ تم التفعيل بنجاح!\n\n` +
        `رخصتك: \`${data.licenseKey}\`\n` +
        `الباقة: ${data.tier}\n\n` +
        `احتفظ برخصتك في مكان آمن.`,
        { parse_mode: "Markdown" }
      );
    } else {
      ctx.reply(`❌ فشل التفعيل: ${data.error}`);
    }
  } catch (error) {
    console.error("[BOT TX ERROR]", error);
    ctx.reply("❌ خطأ في النظام. حاول مجدداً.");
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
    console.log(`[SERVER] Health: GET /health`);
    console.log(`[SERVER] Activate: POST /activation/verify`);
  });
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});

export default app;
