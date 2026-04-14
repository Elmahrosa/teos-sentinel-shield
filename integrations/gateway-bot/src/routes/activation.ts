import express from "express";
import { nanoid } from "nanoid";
import { env } from "../config.js";

const router = express.Router();

type ActivationTier = "starter" | "builder" | "pro";

const ALLOWED_TIERS: ActivationTier[] = ["starter", "builder", "pro"];

router.post("/request", (req, res) => {
  const botSecret = req.header("x-bot-secret");
  if (!botSecret || botSecret !== env.BOT_SHARED_SECRET) {
    return res.status(401).json({ reason: "Unauthorized bot request" });
  }

  const { tier, email, telegramUserId, paymentMethod } = req.body ?? {};

  if (!tier || !ALLOWED_TIERS.includes(tier)) {
    return res.status(400).json({ reason: "Invalid tier" });
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ reason: "Invalid email" });
  }

  if (!telegramUserId || typeof telegramUserId !== "string") {
    return res.status(400).json({ reason: "Invalid telegram user id" });
  }

  if (paymentMethod !== "usdc_manual") {
    return res.status(400).json({ reason: "Unsupported payment method" });
  }

  const activationId = nanoid(16);

  return res.status(200).json({
    ok: true,
    activationId,
    tier,
    status: "pending_manual_payment_confirmation",
    email,
    telegramUserId,
    receiverWallet: env.USDC_RECEIVER_WALLET
  });
});

router.post("/approve", (req, res) => {
  const botSecret = req.header("x-bot-secret");
  if (!botSecret || botSecret !== env.BOT_SHARED_SECRET) {
    return res.status(401).json({ reason: "Unauthorized approval request" });
  }

  const { activationId, tier, email } = req.body ?? {};

  if (!activationId || typeof activationId !== "string") {
    return res.status(400).json({ reason: "Missing activationId" });
  }

  if (!tier || !ALLOWED_TIERS.includes(tier)) {
    return res.status(400).json({ reason: "Invalid tier" });
  }

  if (!email || typeof email !== "string") {
    return res.status(400).json({ reason: "Invalid email" });
  }

  const licenseKey = `TEOS-${tier.toUpperCase()}-${nanoid(20)}`;

  return res.status(200).json({
    ok: true,
    activationId,
    tier,
    email,
    status: "approved",
    licenseKey
  });
});

export default router;
export { router };
