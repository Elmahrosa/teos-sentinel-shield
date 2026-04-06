import dotenv from "dotenv";
dotenv.config();

// ── CAIP-2 network registry ─────────────────────────────────────────
export const NETWORKS = {
  "eip155:8453": {
    name: "Base Mainnet",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  "eip155:84532": {
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
} as const;

export type NetworkId = keyof typeof NETWORKS;
export type TeosMode = "test" | "live";

function reqEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.trim() === "") throw new Error(`Missing required env var: ${key}`);
  return val.trim();
}

function optEnv(key: string, fallback: string): string {
  const val = process.env[key];
  return val && val.trim() !== "" ? val.trim() : fallback;
}

/**
 * Prefer the first env var name that exists (non-empty). Otherwise fallback.
 */
function optEnvAny(keys: string[], fallback: string): string {
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim() !== "") return v.trim();
  }
  return fallback;
}

/**
 * Parse booleans safely.
 * True:  "1", "true", "yes", "on"
 * False: "0", "false", "no", "off", "" (or missing uses fallback)
 */
function resolveBoolAny(keys: string[], fallback: boolean): boolean {
  const raw = optEnvAny(keys, fallback ? "1" : "0").toLowerCase().trim();
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  // If weird value, fall back deterministically
  return fallback;
}

function resolveNetwork(): NetworkId {
  const raw = optEnv("X402_NETWORK", "eip155:8453");
  if (!(raw in NETWORKS)) {
    throw new Error(
      `Unsupported X402_NETWORK="${raw}". Supported: ${Object.keys(NETWORKS).join(", ")}`
    );
  }
  return raw as NetworkId;
}

function resolveMode(): TeosMode {
  // accept TEOS_MODE or MODE
  const raw = optEnvAny(["TEOS_MODE", "MODE"], "live").toLowerCase().trim();
  return raw === "test" ? "test" : "live";
}

export const config = (() => {
  const teosMode = resolveMode();

  // Payment gating:
  // - In TEST mode, default OFF (safe dev experience)
  // - In LIVE mode, default ON (enforcement by default)
  //
  // Accept BOTH:
  // - TEOS_REQUIRE_PAYMENT (canonical)
  // - REQUIRE_PAYMENT (common)
  const requirePaymentDefault = teosMode === "test" ? false : true;
  const requirePayment = resolveBoolAny(
    ["TEOS_REQUIRE_PAYMENT", "REQUIRE_PAYMENT"],
    requirePaymentDefault
  );

  // Only require X402_PAY_TO when payment is enabled
  const payTo = requirePayment ? reqEnv("X402_PAY_TO") : optEnv("X402_PAY_TO", "");

  // Verification:
  // Default OFF in test, ON in live (but configurable)
  const verifyOnChainDefault = teosMode === "test" ? false : true;
  const verifyOnChain = resolveBoolAny(["X402_VERIFY_ONCHAIN"], verifyOnChainDefault);

  const networkId = resolveNetwork();

  const cfg = {
    // Server
    port: parseInt(optEnv("PORT", "8000"), 10),
    host: optEnv("HOST", "0.0.0.0"),

    // Mode / gating
    teosMode,
    requirePayment,

    // Network
    networkId,
    get network() {
      return NETWORKS[this.networkId];
    },

    // Payment settings
    payTo,
    verifyOnChain,
    confirmations: parseInt(optEnv("X402_CONFIRMATIONS", "2"), 10),

    // Pricing
    priceBasic: optEnv("PRICE_BASIC", "0.25"),
    pricePremium: optEnv("PRICE_PREMIUM", "0.50"),
    pricePipeline: optEnv("PRICE_PIPELINE", "1.00"),

    // RPC / USDC overrides
    get rpcUrl(): string {
      return optEnv("RPC_URL_BASE", NETWORKS[this.networkId].rpcUrl);
    },

    get usdcAddress(): string {
      return optEnv("USDC_ADDRESS", NETWORKS[this.networkId].usdcAddress);
    },
  } as const;

  // If payment is enabled, ensure payTo is non-empty
  if (cfg.requirePayment && (!cfg.payTo || cfg.payTo.trim() === "")) {
    throw new Error("Missing required env var: X402_PAY_TO (required when payment is enabled)");
  }

  return cfg;
})();

export function printConfig(): void {
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│  Agent Code Risk MCP — Config               │");
  console.log("├─────────────────────────────────────────────┤");
  console.log(`│  Mode         : ${config.teosMode}`);
  console.log(`│  Require Pay  : ${config.requirePayment ? "ON" : "OFF"}`);
  console.log(`│  Network      : ${config.network.name} (${config.networkId})`);
  console.log(`│  Chain ID     : ${config.network.chainId}`);
  console.log(`│  Pay-to       : ${config.payTo || "(disabled in test)"}`);
  console.log(`│  USDC         : ${config.usdcAddress}`);
  console.log(`│  Price basic  : $${config.priceBasic} USDC`);
  console.log(`│  Price premium: $${config.pricePremium} USDC`);
  console.log(`│  Price pipe   : $${config.pricePipeline} USDC`);
  console.log(`│  Verify chain : ${config.verifyOnChain ? "ON" : "OFF (dev/test)"}`);
  console.log(`│  Confirmations: ${config.confirmations}`);
  console.log(`│  RPC          : ${config.rpcUrl}`);
  console.log("└─────────────────────────────────────────────┘");
}
