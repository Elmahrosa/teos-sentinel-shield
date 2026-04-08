import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { env, tierPrices, Tier } from "./config.js";

const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");

export async function verifySolanaPayment(params: {
  txHash: string;
  expectedTier: Tier;
}) {
  const tx = await connection.getParsedTransaction(params.txHash, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (!tx) return { ok: false as const, reason: "Transaction not found on-chain" };
  if (tx.meta?.err) return { ok: false as const, reason: "Transaction failed on-chain" };

  const receiver = new PublicKey(env.TREASURY_WALLET).toBase58();
  const accountKeys = tx.transaction.message.accountKeys.map((k: any) =>
    typeof k === "string" ? k : k.pubkey.toBase58()
  );

  const receiverIndex = accountKeys.findIndex((k: string) => k === receiver);
  if (receiverIndex === -1)
    return { ok: false as const, reason: "Treasury wallet not found in transaction" };

  const pre = tx.meta?.preBalances?.[receiverIndex] ?? 0;
  const post = tx.meta?.postBalances?.[receiverIndex] ?? 0;
  const deltaSol = (post - pre) / LAMPORTS_PER_SOL;

  const expectedMinSol = tierPrices[params.expectedTier];
  if (deltaSol < expectedMinSol) {
    return {
      ok: false as const,
      reason: `Paid ${deltaSol.toFixed(4)} SOL, expected ${expectedMinSol} SOL for ${params.expectedTier}`,
    };
  }

  return {
    ok: true as const,
    amountSol: deltaSol,
    receiverWallet: receiver,
    payerWallet: accountKeys[0],
  };
}
