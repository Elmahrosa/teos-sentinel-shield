import crypto from "crypto";
import { stableStringify } from "./stableStringify";
import { normalizeResultForHash } from "./normalizeResult";

/**
 * Produces a deterministic SHA-256 hash of the normalized analyzer result.
 * This is your "proof of determinism" value.
 */
export function computeResultHash(payload: any): string {
  const normalized = normalizeResultForHash(payload);
  const canonical = stableStringify(normalized);
  const hash = crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
  return `sha256:${hash}`;
}

/**
 * Optional helper if you want to expose the canonical string for debugging.
 * Never expose this in production unless you need it.
 */
export function canonicalForHash(payload: any): string {
  const normalized = normalizeResultForHash(payload);
  return stableStringify(normalized);
}
