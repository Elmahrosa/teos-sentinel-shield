import express from 'express';
import { Telegraf } from 'telegraf';
import { Connection, PublicKey } from '@solana/web3.js';
import { PrismaClient } from '@prisma/client';

// --- 1. INITIALIZATION ---
const app = express();
const prisma = new PrismaClient();
const bot = new Telegraf(process.env.GATEWAY_BOT_TOKEN || '');
const PORT = process.env.PORT || 8080;

// Blockchain Connection (Alexandria Node)
const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com");
const TREASURY_WALLET = new PublicKey(process.env.TREASURY_WALLET || "");

app.use(express.json());

// --- 2. SOLANA VERIFICATION ENGINE ---
async function verifySolanaPayment(txHash: string, expectedSol: number) {
    try {
        const tx = await connection.getTransaction(txHash, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
        });

        if (!tx || !tx.meta) return { success: false, error: "Transaction not found on-chain." };

        const accountKeys = tx.transaction.message.getAccountKeys();
        const treasuryIndex = accountKeys.staticAccountKeys.findIndex(k => k.equals(TREASURY_WALLET));

        if (treasuryIndex === -1) return { success: false, error: "Wrong destination wallet." };

        const amountReceived = (tx.meta.postBalances[treasuryIndex] - tx.meta.preBalances[treasuryIndex]) / 1e9;
        
        if (amountReceived < expectedSol) {
            return { success: false, error: `Insufficient amount. Expected ${expectedSol} SOL.` };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: "Blockchain connection error." };
    }
}

// --- 3. HARDENED ACTIVATION ROUTE ---
app.post('/activation/verify', async (req, res) => {
    const { txHash, telegramUserId, tier } = req.body;
    const priceMap = { pioneer: 1.5, builder: 12, sovereign: 75 };
    const price = priceMap[tier as keyof typeof priceMap] || 1.5;

    try {
        // Step A: Replay Attack Protection
        const existingTx = await prisma.activation.findFirst({ where: { txHash } });
        if (existingTx) return res.status(400).json({ error: "Transaction already used." });

        // Step B: Real-time Blockchain Audit
        const verification = await verifySolanaPayment(txHash, price);
        if (!verification.success) return res.status(400).json({ error: verification.error });

        // Step C: Sovereign Vault Update (Fixing relational write bug)
        const result = await prisma.activation.create({
            data: {
                txHash,
                telegramUserId,
                network: 'solana',
                status: 'completed',
                licenses: {
                    create: {
                        tier,
                        telegramUserId, 
                        status: 'activated'
                    }
                }
            },
            include: { licenses: true }
        });

        res.json({ success: true, licenseKey: result.licenses[0].id });
    } catch (error) {
        res.status(500).json({ error: "Sovereign Vault write failure." });
    }
});

// --- 4. STARTUP SIGNALS ---
app.get('/health', (req, res) => res.json({ status: "Alexandria Node Active" }));

bot.launch().then(() => console.log('🤖 TEOS Bot is Live & Connected!'));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;