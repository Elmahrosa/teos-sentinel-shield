import { Telegraf, Markup } from "telegraf";
import axios from "axios";
import { env, tierPlans, type TierPlanKey } from "./config.js";

const bot = new Telegraf(env.GATEWAY_BOT_TOKEN);

function planKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🆓 Free · 5 scans", "plan_free")],
    [Markup.button.callback("⚡ Starter · $9 · 50 scans", "plan_starter")],
    [Markup.button.callback("🚀 Builder · $49 · 500 scans", "plan_builder")],
    [Markup.button.callback("👑 Pro · $99 · 1000 scans + deps", "plan_pro")],
    [Markup.button.callback("🏛 Sovereign · Custom", "plan_sovereign")]
  ]);
}

function helpText() {
  return [
    "🛡️ TEOS Sovereign Sentinel",
    "",
    "Available commands:",
    "/start - Start the bot",
    "/scan - Analyze code risk",
    "/deps - Dependency scan info",
    "/plans - View pricing plans",
    "/faq - Common questions",
    "/help - Show help",
    "/upgrade - Upgrade options"
  ].join("\n");
}

bot.start(async (ctx) => {
  await ctx.reply(
    [
      "🛡️ Welcome to TEOS Sovereign Sentinel!",
      "Scan your code for risks before execution.",
      "",
      "Try it now:",
      '/scan eval("console.log(\'hello\')")',
      "",
      "✅ Free to start!"
    ].join("\n"),
    planKeyboard()
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(helpText());
});

bot.command("plans", async (ctx) => {
  await ctx.reply(
    [
      "📦 Plans",
      "Free → 5 scans",
      "Starter → $9 / 50 scans",
      "Builder → $49 / 500 scans",
      "Pro → $99 / 1000 scans + deps",
      "Sovereign → Custom"
    ].join("\n"),
    planKeyboard()
  );
});

bot.command("faq", async (ctx) => {
  await ctx.reply(
    [
      "❓ FAQ",
      "",
      "Q: Is there a free tier?",
      "A: Yes, 5 scans.",
      "",
      "Q: What is the payment method?",
      "A: USDC only for paid plans.",
      "",
      "Q: What is Sovereign?",
      "A: Custom enterprise onboarding."
    ].join("\n")
  );
});

bot.command("upgrade", async (ctx) => {
  await ctx.reply(
    [
      "⬆️ Upgrade options",
      "Choose a plan below."
    ].join("\n"),
    planKeyboard()
  );
});

bot.command("deps", async (ctx) => {
  await ctx.reply(
    [
      "📚 Dependency analysis",
      "Dependency scanning is available for Pro and higher.",
      "Production integration is being finalized."
    ].join("\n")
  );
});

bot.command("scan", async (ctx) => {
  const text = ctx.message.text.trim();
  const payload = text.replace(/^\/scan\s*/i, "").trim();

  if (!payload) {
    await ctx.reply(
      [
        "🔍 Send code after /scan",
        "Example:",
        '/scan eval("console.log(\'hello\')")'
      ].join("\n")
    );
    return;
  }

  const suspicious =
    /eval|child_process|rm -rf|drop table|process\.env|exec\(/i.test(payload);

  await ctx.reply(
    suspicious
      ? "🚫 BLOCK\nReason: risky pattern detected."
      : "✅ ALLOW\nReason: no risky pattern detected in demo scan."
  );
});

bot.action(/^plan_(free|starter|builder|pro|sovereign)$/, async (ctx) => {
  const tier = ctx.match[1] as TierPlanKey;
  await ctx.answerCbQuery();

  if (tier === "free") {
    await ctx.reply(
      [
        "✅ Free plan selected",
        "You get 5 scans.",
        "",
        `App: ${env.APP_BASE_URL}`
      ].join("\n")
    );
    return;
  }

  if (tier === "sovereign") {
    await ctx.reply(
      [
        "🏛 Sovereign selected",
        "Custom onboarding only.",
        `Contact: ${env.CONTACT_EMAIL}`
      ].join("\n")
    );
    return;
  }

  const plan = tierPlans[tier];
  await ctx.reply(
    [
      `Plan: ${plan.label}`,
      `Price: $${plan.priceUsd}`,
      `Scans: ${plan.scans}`,
      "",
      "To request activation, reply with:",
      `ACTIVATE ${tier.toUpperCase()} your@email.com`
    ].join("\n")
  );
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();

  if (!text.toUpperCase().startsWith("ACTIVATE ")) {
    return;
  }

  const parts = text.split(/\s+/);
  if (parts.length < 3) {
    await ctx.reply("❌ Use: ACTIVATE STARTER your@email.com");
    return;
  }

  const tier = parts[1].toLowerCase();
  const email = parts.slice(2).join(" ").trim();

  if (!["starter", "builder", "pro"].includes(tier)) {
    await ctx.reply("❌ Allowed paid tiers: STARTER, BUILDER, PRO");
    return;
  }

  try {
    const response = await axios.post(
      "http://localhost:8080/activation/request",
      {
        tier,
        email,
        telegramUserId: ctx.from.id.toString(),
        paymentMethod: "usdc_manual"
      },
      {
        headers: {
          "x-bot-secret": env.BOT_SHARED_SECRET
        },
        timeout: 15000
      }
    );

    await ctx.reply(
      [
        "✅ Activation request received",
        `Tier: ${response.data.tier}`,
        `Status: ${response.data.status}`,
        "",
        "Payment will be confirmed manually for now."
      ].join("\n")
    );
  } catch (error: any) {
    await ctx.reply(
      "❌ Activation request failed: " +
        (error?.response?.data?.reason || "system error")
    );
  }
});

export { bot };