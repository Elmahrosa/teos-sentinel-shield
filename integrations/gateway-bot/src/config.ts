import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string(),
  SOLANA_RPC_URL: z.string().url(),
  SOLANA_RECEIVER_WALLET: z.string().min(20),
  TREASURY_WALLET: z.string().min(20),
  GATEWAY_BOT_TOKEN: z.string().min(10),
  BOT_SHARED_SECRET: z.string().min(10),
  LICENSE_SIGNING_SECRET: z.string().min(10),
  PIONEER_PRICE_SOL: z.coerce.number().positive(),
  BUILDER_PRICE_SOL: z.coerce.number().positive(),
  SOVEREIGN_MIN_PRICE_SOL: z.coerce.number().positive(),
});

export const env = envSchema.parse(process.env);

export const tierPrices = {
  pioneer: env.PIONEER_PRICE_SOL,
  builder: env.BUILDER_PRICE_SOL,
  sovereign: env.SOVEREIGN_MIN_PRICE_SOL,
} as const;

export type Tier = keyof typeof tierPrices;
