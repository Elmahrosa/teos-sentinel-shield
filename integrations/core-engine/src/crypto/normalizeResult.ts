import { stableStringify } from "./stableStringify";

/**
 * Normalize analyzer output for determinism:
 * - remove unstable fields (timestamps, request ids)
 * - sort findings in stable order
 * - ensure consistent casing/shape
 */
export function normalizeResultForHash(input: any): any {
  const clone = deepClone(input);

  // Remove unstable fields if present
  deleteIfExists(clone, "timestamp");
  deleteIfExists(clone, "requestId");
  deleteIfExists(clone, "reqId");

  // Normalize top-level strings if present
  if (typeof clone?.decision === "string") clone.decision = clone.decision.toUpperCase();
  if (typeof clone?.overallRisk === "string") clone.overallRisk = clone.overallRisk.toLowerCase();

  // Normalize findings
  if (Array.isArray(clone?.findings)) {
    clone.findings = clone.findings
      .map((f: any) => ({
        rule: f?.rule ?? f?.id ?? "unknown",
        severity: typeof f?.severity === "string" ? f.severity.toLowerCase() : f?.severity ?? "unknown",
        message: f?.message ?? f?.msg ?? "",
        line: f?.line ?? null,
        file: f?.file ?? null,
      }))
      .sort(stableFindingSort);
  }

  // Normalize nested `.result` shapes if your API uses them
  if (clone?.result && typeof clone.result === "object") {
    deleteIfExists(clone.result, "timestamp");
    deleteIfExists(clone.result, "requestId");
    deleteIfExists(clone.result, "reqId");

    if (typeof clone.result?.decision === "string") clone.result.decision = clone.result.decision.toUpperCase();
    if (typeof clone.result?.overallRisk === "string") clone.result.overallRisk = clone.result.overallRisk.toLowerCase();

    if (Array.isArray(clone.result?.findings)) {
      clone.result.findings = clone.result.findings
        .map((f: any) => ({
          rule: f?.rule ?? f?.id ?? "unknown",
          severity: typeof f?.severity === "string" ? f.severity.toLowerCase() : f?.severity ?? "unknown",
          message: f?.message ?? f?.msg ?? "",
          line: f?.line ?? null,
          file: f?.file ?? null,
        }))
        .sort(stableFindingSort);
    }
  }

  // Return parsed stable JSON to remove runtime prototype noise
  return JSON.parse(stableStringify(clone));
}

function stableFindingSort(a: any, b: any): number {
  const A = `${a.severity}|${a.rule}|${a.file ?? ""}|${a.line ?? ""}|${a.message}`;
  const B = `${b.severity}|${b.rule}|${b.file ?? ""}|${b.line ?? ""}|${b.message}`;
  return A.localeCompare(B);
}

function deepClone<T>(x: T): T {
  return x === undefined ? x : (JSON.parse(JSON.stringify(x)) as T);
}

function deleteIfExists(obj: any, key: string) {
  if (obj && typeof obj === "object" && key in obj) delete obj[key];
}
