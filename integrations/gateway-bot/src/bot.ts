import { Telegraf, Markup } from "telegraf";
import axios from "axios";
import { env, tierPlans, type TierPlanKey } from "./config.js";

const bot = new Telegraf(env.GATEWAY_BOT_TOKEN);

function planButtons() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🆓 Free · 5 scans", "plan_free")],
    [Markup.button.callback("⚡ Starter · $9 · 50 scans", "plan_starter")],
    [Markup.button.callback("🚀 Builder · $49 · 500 scans", "plan_builder")],
    [Markup.button.callback("👑 Pro · $99 · 1000 scans + deps", "plan_pro")],
    [Markup.button.callback("🏛 Sovereign · Enterprise", "plan_sovereign")]
  ]);
}

bot.start(async (ctx) => {
  await ctx.reply(
    [
      "🛡️ Welcome to TEOS Sentinel Shield",
      "",
      "Sovereign AI Execution Firewall",
      "Scan AI-generated code before it runs.",
      "",
      "Choose a plan to continue:"
    ].join("\n"),
    planButtons()
  );
});

bot.action(/^plan_(free|starter|builder|pro|sovereign)$/, async (ctx) => {
  const tier = ctx.match[1] as TierPlanKey;

  if (tier === "free") {
    await ctx.answerCbQuery();
    await ctx.reply(
      [
        "✅ Free plan selected",
        "You get 5 scans.",
        "",
        "Open the app to start:",
        env.APP_BASE_URL
      ].join("\n")
    );
    return;
  }

  if (tier === "sovereign") {
    await ctx.answerCbQuery();
    await ctx.reply(
      [
        "🏛 Sovereign plan selected",
        "Enterprise onboarding is handled manually.",
        "",
        "Contact:",
        "ayman@teosegypt.com"
      ].join("\n")
    );
    return;
  }

  const plan = tierPlans[tier];
  await ctx.answerCbQuery();
  await ctx.reply(
    [
      `You selected ${plan.label}.`,
      `Price: $${plan.priceUsd}`,
      `Scans: ${plan.scans}`,
      "",
      "Reply with this exact format to request activation:",
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
    await ctx.reply("❌ Invalid format. Use: ACTIVATE STARTER your@email.com");
    return;
  }

  const tierRaw = parts[1].toLowerCase();
  const email = parts.slice(2).join(" ").trim();

  if (!["starter", "builder", "pro"].includes(tierRaw)) {
    await ctx.reply("❌ Allowed activation tiers: STARTER, BUILDER, PRO");
    return;
  }

  try {
    const response = await axios.post(
      "http://localhost:8080/activation/request",
      {
        tier: tierRaw,
        email,
        telegramUserId: ctx.from.id.toString()
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
        "You will be activated after payment confirmation or manual approval."
      ].join("\n")
    );
  } catch (error: any) {
    await ctx.reply(
      "❌ Activation request failed: " +
        (error?.response?.data?.reason || "system error")
    );
  }
});

bot.launch().then(() => {
  console.log("🤖 TEOS Gateway Bot is live");
});
