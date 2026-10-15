const { getCredits, consumeCredit } = require("../../services/activation.service");
const { logger } = require("../../logger.cjs");

let loggerInstance;
try {
  loggerInstance = require("../../../logger.cjs").logger;
} catch {
  loggerInstance = console;
}

// Initialize Solana connection lazily
let _connection = null;
function getConnection() {
  if (!_connection) {
    const { Connection } = require("@solana/web3.js");
    const rpcUrl = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
    _connection = new Connection(rpcUrl, "confirmed");
  }
  return _connection;
}

async function verifyCommand(ctx) {
  const userId = String(ctx.from.id);
  const txHash = ctx.message.text.split(' ')[1]?.trim();

  if (!txHash) {
    return ctx.reply('استخدم: /verify TX_HASH');
  }

  // Check if transaction was already used
  try {
    const db = require("../../database.cjs"); // We'll need to create this or use existing DB
    const row = await db.get('SELECT 1 FROM used_txs WHERE tx_hash = ?', [txHash]);
    if (row) {
      return ctx.reply('❌ TX مستخدم قبل كده');
    }
  } catch (dbErr) {
    loggerInstance.warn({ err: dbErr }, "Database check failed, continuing with verification");
    // Continue with verification even if DB check fails
  }

  try {
    const connection = getConnection();

    // Fetch transaction with parsing
    const tx = await connection.getParsedTransaction(txHash, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      return ctx.reply('❌ TX مش موجود، استنى 30 ثانية وجرب تاني');
    }

    let paid = 0;
    const usdcMint = process.env.USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const walletAddress = process.env.SOLANA_ADDRESS || "Aai9XYkpQMrVMLTP5CKHSin1UoJ12rU2FSupGwpNwMQ6";

    // Check instructions for USDC transfers
    const { transaction, meta } = tx;
    if (meta && meta.preTokenBalances && meta.postTokenBalances) {
      const preBalances = meta.preTokenBalances;
      const postBalances = meta.postTokenBalances;

      // Check each instruction for USDC transfers to our address
      for (const instr of transaction.message.instructions) {
        if (instr.parsed && instr.parsed.type === "transfer" &&
            instr.parsed.info && instr.parsed.info.mint === usdcMint) {

          if (instr.parsed.info.destination === walletAddress) {
            const amountStr = instr.parsed.info.tokenAmount?.uiAmountString || "0";
            const amount = parseFloat(amountStr);
            paid = Math.max(paid, amount);
          }
        }
      }

      // Fallback: check balance changes for our address
      if (paid < 0.99) {
        const ourPost = postBalances.find(b =>
          b.owner === walletAddress && b.mint === usdcMint
        );
        const ourPre = preBalances.find(b =>
          b.owner === walletAddress && b.mint === usdcMint
        );

        if (ourPost) {
          const postAmount = parseFloat(ourPost.uiTokenAmount.uiAmount || "0");
          const preAmount = ourPre ? parseFloat(ourPre.uiTokenAmount.uiAmount || "0") : 0;
          paid = Math.max(paid, postAmount - preAmount);
        }
      }
    }

    // Verify minimum payment (1 USDC with small tolerance for fees)
    if (paid < 0.99) {
      return ctx.reply(`❌ لم يصل 1 USDC. الواصل: ${paid.toFixed(6)} USDC`);
    }

    // Mark transaction as used
    try {
      const db = require("../../database.cjs");
      await db.run(
        'INSERT INTO used_txs (tx_hash, user_id, amount, created_at) VALUES (?, ?, ?, datetime("now"))',
        [txHash, userId, paid]
      );
    } catch (dbErr) {
      loggerInstance.warn({ err: dbErr, txHash, userId }, "Failed to record used transaction");
      // Continue anyway - we'll still grant credits
    }

    // Add credits to user (5 credits for 1 USDC)
    const currentCredits = await getCredits(userId);
    await consumeCredit(userId, -5); // Negative because we're adding credits
    const newCredits = await getCredits(userId);

    return ctx.reply(
      `✅ تم! +5 credits\nرصيدك: ${newCredits}\n/buy1 لشراء تاني`
    );
  } catch (err) {
    loggerInstance.error({ err: err?.message, txHash, userId }, "Verification error");
    return ctx.reply('❌ خطأ، جرب تاني بعد دقيقة');
  }
}

module.exports = { verifyCommand };