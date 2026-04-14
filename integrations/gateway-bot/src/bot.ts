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

bot.start(async (ctx) => {
  await ctx.reply(
    [
      "🛡️ Welcome to TEOS Sentinel Shield",
      "",
      "Sovereign AI Execution Firewall",
      "USDC-only activation flow",
      "",
      "Choose a plan:"
    ].join("\n"),
    planKeyboard()
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
        "Launch page:",
        env.APP_BASE_URL
      ].join("\n")
    );
    return;
  }

  if (tier === "sovereign") {
    await ctx.reply(
      [
        "🏛 Sovereign selected",
        "Custom onboarding only",
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
      "USDC payment flow:",
      `Send USDC to the receiver wallet configured by TEOS.`,
      "",
      "Then reply in this format:",
      `ACTIVATE ${tier.toUpperCase()} your@email.com`
    ].join("\n")
  );
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();

  if (!text.toUpperCase().startsWith("ACTIVATE ")) {
    return;
  }

  const parts = text.split(/\\s+/);
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

bot.launch().then(() => {
  console.log("🤖 TEOS Gateway Bot live");
});
