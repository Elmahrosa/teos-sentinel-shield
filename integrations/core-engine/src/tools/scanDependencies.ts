export type Severity = "critical" | "high" | "medium" | "low";

export interface DepVulnerability {
  package: string;
  version: string;
  severity: Severity;
  advisory: string;
  fixedIn?: string;
}

export interface ScanResult {
  manifestType: string;
  totalDependencies: number;
  vulnerabilities: DepVulnerability[];
  riskScore: number;
  summary: string;
}

const ADVISORIES: Record<
  string,
  { below: string; severity: Severity; advisory: string; fixedIn: string }[]
> = {
  lodash: [
    { below: "4.17.21", severity: "high", advisory: "Prototype pollution (CVE-2021-23337)", fixedIn: "4.17.21" },
  ],
  minimist: [
    { below: "1.2.6", severity: "critical", advisory: "Prototype pollution (CVE-2021-44906)", fixedIn: "1.2.6" },
  ],
  "node-fetch": [
    { below: "2.6.7", severity: "high", advisory: "Exposure of sensitive information (CVE-2022-0235)", fixedIn: "2.6.7" },
  ],
  axios: [
    { below: "1.6.0", severity: "medium", advisory: "SSRF vulnerability (CVE-2023-45857)", fixedIn: "1.6.0" },
  ],
  jsonwebtoken: [
    { below: "9.0.0", severity: "high", advisory: "Insecure default algorithm (CVE-2022-23529)", fixedIn: "9.0.0" },
  ],
  tar: [
    { below: "6.1.9", severity: "high", advisory: "Arbitrary file creation (CVE-2021-37713)", fixedIn: "6.1.9" },
  ],
  express: [
    { below: "4.19.2", severity: "medium", advisory: "Open redirect (CVE-2024-29041)", fixedIn: "4.19.2" },
  ],
  semver: [
    { below: "7.5.2", severity: "medium", advisory: "ReDoS vulnerability (CVE-2022-25883)", fixedIn: "7.5.2" },
  ],
  "word-wrap": [
    { below: "1.2.4", severity: "medium", advisory: "ReDoS vulnerability (CVE-2023-26115)", fixedIn: "1.2.4" },
  ],
  tough_cookie: [
    { below: "4.1.3", severity: "medium", advisory: "Prototype pollution (CVE-2023-26136)", fixedIn: "4.1.3" },
  ],
};

function semverLessThan(a: string, b: string): boolean {
  const pa = a.replace(/[^0-9.]/g, "").split(".").map(Number);
  const pb = b.replace(/[^0-9.]/g, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va < vb) return true;
    if (va > vb) return false;
  }
  return false;
}

function detectManifestType(manifest: string): string {
  if (manifest.trim().startsWith("{")) return "package.json";
  if (manifest.includes("==") || manifest.includes(">=")) return "requirements.txt";
  if (manifest.includes("[dependencies]")) return "Cargo.toml";
  return "unknown";
}

function parseDeps(manifest: string): Record<string, string> {
  const type = detectManifestType(manifest);

  if (type === "package.json") {
    try {
      const parsed = JSON.parse(manifest);
      return { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
    } catch {
      return {};
    }
  }

  if (type === "requirements.txt") {
    const deps: Record<string, string> = {};
    for (const line of manifest.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*[=<>!~]+\s*([\d.]+)/);
      if (match) deps[match[1].toLowerCase().replace(/_/g, "-")] = match[2];
    }
    return deps;
  }

  return {};
}

export async function scanDependencies(
  manifest: string,
  _lockfile?: string
): Promise<ScanResult> {
  const manifestType = detectManifestType(manifest);
  const allDeps = parseDeps(manifest);
  const depNames = Object.keys(allDeps);
  const vulnerabilities: DepVulnerability[] = [];

  for (const [name, version] of Object.entries(allDeps)) {
    const cleanVersion = version.replace(/^[\^~>=<\s]+/, "");
    const advisories = ADVISORIES[name];
    if (!advisories) continue;

    for (const adv of advisories) {
      if (semverLessThan(cleanVersion, adv.below)) {
        vulnerabilities.push({
          package: name,
          version: cleanVersion,
          severity: adv.severity,
          advisory: adv.advisory,
          fixedIn: adv.fixedIn,
        });
      }
    }
  }

  const scoreMap: Record<Severity, number> = { critical: 10, high: 5, medium: 2, low: 1 };
  const riskScore = vulnerabilities.reduce((sum, v) => sum + scoreMap[v.severity], 0);

  return {
    manifestType,
    totalDependencies: depNames.length,
    vulnerabilities,
    riskScore,
    summary:
      vulnerabilities.length === 0
        ? `Scanned ${depNames.length} dependencies in ${manifestType}. No known vulnerabilities.`
        : `Scanned ${depNames.length} dependencies in ${manifestType}. Found ${vulnerabilities.length} vulnerability(ies) with risk score ${riskScore}.`,
  };
}
