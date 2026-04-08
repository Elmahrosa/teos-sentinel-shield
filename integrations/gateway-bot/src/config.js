"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tierPrices = exports.env = void 0;
var dotenv_1 = require("dotenv");
var zod_1 = require("zod");
dotenv_1.default.config();
var envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(8080),
    NODE_ENV: zod_1.z.string().default("development"),
    DATABASE_URL: zod_1.z.string(),
    SOLANA_RPC_URL: zod_1.z.string().url(),
    SOLANA_RECEIVER_WALLET: zod_1.z.string().min(20),
    BOT_SHARED_SECRET: zod_1.z.string().min(10),
    LICENSE_SIGNING_SECRET: zod_1.z.string().min(10),
    PIONEER_PRICE_SOL: zod_1.z.coerce.number().positive(),
    BUILDER_PRICE_SOL: zod_1.z.coerce.number().positive(),
    SOVEREIGN_MIN_PRICE_SOL: zod_1.z.coerce.number().positive()
});
exports.env = envSchema.parse(process.env);
exports.tierPrices = {
    pioneer: exports.env.PIONEER_PRICE_SOL,
    builder: exports.env.BUILDER_PRICE_SOL,
    sovereign: exports.env.SOVEREIGN_MIN_PRICE_SOL
};
