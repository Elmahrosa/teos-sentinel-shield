/**
 * Deterministic JSON stringify:
 * - Sorts object keys recursively
 * - Preserves array order
 * - Produces stable output for hashing/signing
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortRecursively(value));
}

function sortRecursively(input: any): any {
  if (input === null || input === undefined) return input;

  if (Array.isArray(input)) {
    return input.map(sortRecursively);
  }

  if (typeof input === "object") {
    const keys = Object.keys(input).sort();
    const out: Record<string, any> = {};
    for (const k of keys) out[k] = sortRecursively(input[k]);
    return out;
  }

  return input;
}
