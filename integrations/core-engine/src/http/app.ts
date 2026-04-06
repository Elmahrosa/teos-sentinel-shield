import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import { config, printConfig } from "../config";
import { x402PaymentGate } from "./x402Verify";
import { analyzeCode } from "../tools/analyzeCode";
import { scanDependencies } from "../tools/scanDependencies";
import { stats, maybeReset24h } from "./stats";
import { trackStats } from "./trackStats";

const BUILD_FINGERPRINT = "2026-02-17T-live-ping-enabled";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.set("trust proxy", 1);

//
// ─────────────────────────────────────────────
// Root Landing
// ─────────────────────────────────────────────
//
app.get("/", (_req: Request, res: Response) => {
  res.type("html").send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Agent Code Risk MCP</title>
        <style>
          body { font-family: system-ui, Arial; max-width: 900px; margin: 40px auto; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Agent Code Risk MCP</h1>
        <p>Status: <b>Online ✅</b></p>
        <ul>
          <li>GET <code>/ping</code></li>
          <li>GET <code>/health</code></li>
          <li>GET <code>/pricing</code></li>
          <li>GET <code>/stats</code></li>
          <li>POST <code>/analyze</code></li>
          <li>POST <code>/scan-dependencies</code></li>
        </ul>
      </body>
    </html>
  `);
});

//
// ─────────────────────────────────────────────
// Ping (Used by Telegram Bot)
// ─────────────────────────────────────────────
//
app.get("/ping", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    build: BUILD_FINGERPRINT,
    network: config.networkId,
    mode: (config as any).teosMode,
    requirePayment: (config as any).requirePayment,
    prices: {
      basic: Number(config.priceBasic),
      premium: Number(config.pricePremium),
      pipeline: Number((config as any).pricePipeline),
    },
    timestamp: new Date().toISOString(),
  });
});

//
// ─────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────
//
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    build: BUILD_FINGERPRINT,
    network: config.networkId,
    verifyOnChain: config.verifyOnChain,
    mode: (config as any).teosMode,
    requirePayment: (config as any).requirePayment,
    timestamp: new Date().toISOString(),
  });
});

//
// ─────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────
//
app.get("/pricing", (_req: Request, res: Response) => {
  res.json({
    build: BUILD_FINGERPRINT,
    network: {
      id: config.networkId,
      name: config.network.name,
      chainId: config.network.chainId,
    },
    payment: {
      token: "USDC",
      contract: config.usdcAddress,
      payTo: config.payTo,
      confirmations: config.confirmations,
      verifyOnChain: config.verifyOnChain,
    },
    prices: {
      basic: Number(config.priceBasic),
      premium: Number(config.pricePremium),
      pipeline: Number((config as any).pricePipeline),
    },
  });
});

//
// ─────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────
//
app.get("/stats", (_req: Request, res: Response) => {
  maybeReset24h();

  res.json({
    usage: {
      total_requests: stats.totalRequests,
      unique_ips: stats.uniqueIps.size,
      paid_requests: stats.paidRequests,
      blocked_decisions: stats.blockedDecisions,
    },
    last_24h: stats.last24h,
    updated_at: new Date().toISOString(),
  });
});

//
// ─────────────────────────────────────────────
// Analyze Code
// ─────────────────────────────────────────────
//
app.post(
  "/analyze",
  trackStats,
  x402PaymentGate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, language, context, mode } = req.body;

      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Missing `code` string in body" });
      }

      const tier =
        mode === "premium"
          ? "premium"
          : mode === "pipeline"
          ? "pipeline"
          : "basic";

      const price_preview =
        tier === "premium"
          ? Number(config.pricePremium)
          : tier === "pipeline"
          ? Number((config as any).pricePipeline)
          : Number(config.priceBasic);

      const result = await analyzeCode(code, language, context);

      if (result?.overallRisk === "critical") {
        stats.blockedDecisions++;
        stats.last24h.blocked++;
      }

      res.json({
        tier,
        price_preview,
        payment_required:
          Boolean((config as any).requirePayment) &&
          (config as any).teosMode !== "test",
        result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//
// ─────────────────────────────────────────────
// Scan Dependencies
// ─────────────────────────────────────────────
//
app.post(
  "/scan-dependencies",
  trackStats,
  x402PaymentGate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { manifest, lockfile } = req.body;

      if (!manifest || typeof manifest !== "string") {
        return res.status(400).json({ error: "Missing `manifest` string" });
      }

      const result = await scanDependencies(manifest, lockfile);

      res.json({
        tier: "premium",
        price_preview: Number(config.pricePremium),
        payment_required:
          Boolean((config as any).requirePayment) &&
          (config as any).teosMode !== "test",
        result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//
// ─────────────────────────────────────────────
// 404 JSON
// ─────────────────────────────────────────────
//
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

//
// ─────────────────────────────────────────────
// Error Handler
// ─────────────────────────────────────────────
//
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ERROR]", err.message, err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

//
// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
//
app.listen(config.port, config.host, () => {
  printConfig();
  console.log(`\n🚀  HTTP server listening on ${config.host}:${config.port}\n`);
});

export { app };
