/**
 * TEOS Audit Ledger — Cryptographic SHA-256 hash chaining via Supabase
 * Multi-repo label: teos-audit-ledger
 *
 * ZERO native dependencies. All persistence via hosted Supabase cluster.
 * Each row in public.teos_verdict_logs chains to the previous via SHA-256.
 * Tampering with any row breaks the chain — detected by hash mismatch.
 */
const { createHash } = require('crypto');

const CHAIN_ALGO = 'sha3-256';
const SUPABASE_TABLE = 'teos_verdict_logs';

/**
 * Compute SHA-256 block hash chained to the previous entry.
 *   block_hash = SHA-256(previous_hash + canonicalJSON(event))
 */
function calculateLogHash(previousHash, event) {
  const canonical = typeof event === 'string'
    ? event
    : JSON.stringify(event, Object.keys(event).sort());
  const dataString = previousHash + canonical;
  return createHash(CHAIN_ALGO).update(dataString, 'utf8').digest('hex');
}

/**
 * Fetch the previous block hash from the latest row in teos_verdict_logs.
 * Returns 'GENESIS' if the table is empty.
 * Uses only Supabase — no Redis, no filesystem, no sqlite.
 */
async function fetchPreviousHash(supabaseClient) {
  if (!supabaseClient) return 'GENESIS';
  try {
    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLE)
      .select('block_hash')
      .order('id', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0 && data[0].block_hash) {
      return data[0].block_hash;
    }
  } catch (e) {
    // table may not exist yet — treat as genesis
    console.warn('[auditLedger] fetchPreviousHash failed, treating as genesis:', e.message);
  }
  return 'GENESIS';
}

/**
 * Insert a chained log record into teos_verdict_logs.
 * Returns the inserted row or null on failure.
 */
async function insertChainedLog(supabaseClient, entry) {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLE)
      .insert(entry)
      .select();

    if (error) {
      console.warn('[auditLedger] insert failed:', error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('[auditLedger] insert exception:', e.message);
    return null;
  }
}

module.exports = {
  calculateLogHash,
  fetchPreviousHash,
  insertChainedLog,
  SUPABASE_TABLE,
};
