import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { env, tierPrices } from "./config.js";

const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");

export async function verifySolanaPayment(params: {
  txHash: string;
  expectedTier: "pioneer" | "builder" | "sovereign";
}) {
  const tx = await connection.getParsedTransaction(params.txHash, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed"
  });

  if (!tx) return { ok: false as const, reason: "Transaction not found" };

  const receiver = new PublicKey(env.SOLANA_RECEIVER_WALLET).toBase58();
  const accountKeys = tx.transaction.message.accountKeys.map((k: any) => 
    typeof k === "string" ? k : k.pubkey.toBase58()
  );

  const receiverIndex = accountKeys.findIndex((k: string) => k === receiver);
  if (receiverIndex === -1) return { ok: false as const, reason: "Receiver wallet not found" };

  const pre = tx.meta?.preBalances?.[receiverIndex] ?? 0;
  const post = tx.meta?.postBalances?.[receiverIndex] ?? 0;
  const deltaSol = (post - pre) / LAMPORTS_PER_SOL;

  const expectedMinSol = tierPrices[params.expectedTier];
  if (deltaSol < expectedMinSol) {
    return { ok: false as const, reason: `Paid ${deltaSol} SOL, expected ${expectedMinSol}` };
  }

  return { ok: true as const, amountSol: deltaSol, receiverWallet: receiver, payerWallet: accountKeys[0] };
}
