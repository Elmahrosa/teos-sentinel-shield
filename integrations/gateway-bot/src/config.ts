import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string(),
  BOT_SHARED_SECRET: z.string().min(10),
  LICENSE_SIGNING_SECRET: z.string().min(10),
  GATEWAY_BOT_TOKEN: z.string().min(10),
  APP_BASE_URL: z.string().url().default("https://teos-sentinel-shield.vercel.app")
});

export const env = envSchema.parse(process.env);

export const tierPlans = {
  free: {
    label: "Free",
    scans: 5
  },
  starter: {
    label: "Starter",
    priceUsd: 9,
    scans: 50
  },
  builder: {
    label: "Builder",
    priceUsd: 49,
    scans: 500
  },
  pro: {
    label: "Pro",
    priceUsd: 99,
    scans: 1000,
    deps: true
  },
  sovereign: {
    label: "Sovereign",
    priceUsd: null,
    scans: null
  }
} as const;

export type TierPlanKey = keyof typeof tierPlans;
