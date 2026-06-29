/**
 * SARIF 2.1.0 Output Formatter
 * Converts TEOS Sentinel scan results into SARIF format for SIEM/CI integration.
 */

export interface ScanFinding {
  rule: string;
  severity: string;
  line: number;
  message: string;
  snippet?: string;
  governance?: {
    framework: string;
    confidence: string;
    governanceEngine: string;
    suggestedFix: string;
  };
}

export interface ScanResult {
  verdict: string;
  riskScore: number;
  findings: ScanFinding[];
  governance?: {
    verdict: string;
    riskScore: number;
    engines: string[];
    confidence: string;
    evidenceCount: number;
    frameworks: string[];
  };
  ts: string;
  input?: string;
  scanner?: string;
}

const SEVERITY_MAP: Record<string, string> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
  info: "note",
};

const SEVERITY_SCORE_MAP: Record<string, number> = {
  critical: 100,
  high: 80,
  medium: 50,
  low: 20,
  info: 0,
};

export function toSarif(result: ScanResult): string {
  const sarif = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "TEOS Sentinel",
            semanticVersion: "4.0.0",
            informationUri: "https://sentinel.teosegypt.com",
            rules: result.findings.map((f, i) => ({
              id: f.rule,
              name: f.rule,
              shortDescription: { text: f.message },
              fullDescription: { text: f.message + (f.snippet ? "\nSnippet: " + f.snippet : "") },
              defaultConfiguration: { level: SEVERITY_MAP[f.severity] || "warning" },
              properties: {
                severity: f.severity,
                governanceEngine: f.governance?.governanceEngine || "Security",
                confidence: f.governance?.confidence || "medium",
                framework: f.governance?.framework || "NIST CSF, OWASP ASVS",
                suggestedFix: f.governance?.suggestedFix || "Review and apply appropriate mitigation.",
                tags: [
                  f.governance?.governanceEngine || "security",
                  f.severity,
                  ...(f.governance?.framework ? f.governance.framework.split(", ").map(fw => fw.toLowerCase().replace(/\s+/g, "-")) : []),
                ],
              },
            })),
          },
        },
        artifacts: result.input
          ? [{ location: { uri: "input.txt" }, contents: { text: result.input } }]
          : [],
        results: result.findings.map((f) => ({
          ruleId: f.rule,
          ruleIndex: result.findings.indexOf(f),
          level: SEVERITY_MAP[f.severity] || "warning",
          message: { text: f.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: result.input ? "input.txt" : "scanned-code" },
                region: {
                  startLine: f.line || 1,
                  snippet: f.snippet ? { text: f.snippet } : undefined,
                },
              },
            },
          ],
          properties: {
            severity: f.severity,
            riskScore: SEVERITY_SCORE_MAP[f.severity] || 0,
            governanceEngine: f.governance?.governanceEngine || "Security",
            confidence: f.governance?.confidence || "medium",
            suggestedFix: f.governance?.suggestedFix || "Review and apply appropriate mitigation.",
            framework: f.governance?.framework || "NIST CSF, OWASP ASVS",
          },
        })),
        invocations: [
          {
            startTimeUtc: result.ts,
            executionSuccessful: result.verdict !== "ERROR",
            attachments: [],
          },
        ],
        properties: {
          teos: {
            verdict: result.verdict,
            riskScore: result.riskScore,
            governance: result.governance || {},
            scanner: result.scanner || "shell",
          },
        },
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

export function generateAuditHash(result: ScanResult): string {
  const input = result.input || "";
  const findings = result.findings.map(f => `${f.rule}:${f.severity}:${f.line}`).join(",");
  const payload = `${input}|${findings}|${result.ts}|${result.verdict}|${result.riskScore}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return "TEOS-" + Math.abs(hash).toString(16).padStart(8, "0");
}

export function toAuditEntry(result: ScanResult): object {
  return {
    version: "4.0.0",
    scanId: generateAuditHash(result),
    timestamp: result.ts,
    verdict: result.verdict,
    riskScore: result.riskScore,
    findingCount: result.findings.length,
    totalSeverityScore: result.findings.reduce((sum, f) => sum + (SEVERITY_SCORE_MAP[f.severity] || 0), 0),
    findings: result.findings.map(f => ({
      rule: f.rule,
      severity: f.severity,
      line: f.line,
      message: f.message,
      confidence: f.governance?.confidence || "medium",
      fix: f.governance?.suggestedFix || "Review and apply appropriate mitigation.",
    })),
    governance: result.governance || null,
    _hash: generateAuditHash(result),
    _signed: false,
    _chain: [],
  };
}
