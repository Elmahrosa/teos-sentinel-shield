export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Decision = "ALLOW" | "WARN" | "BLOCK";

export interface RiskFinding {
  rule: string;
  severity: Severity;
  line?: number;
  message: string;
  snippet?: string;
}

export interface AnalysisResult {
  language: string;
  linesAnalyzed: number;
  findings: RiskFinding[];
  overallRisk: Severity;
  decision: Decision;
  summary: string;
}

interface Rule {
  id: string;
  pattern: RegExp;
  severity: Severity;
  message: string;
  languages?: string[];
}

const RULES: Rule[] = [
  // ── CRITICAL ───────────────────────────────
  { id: "no-eval", pattern: /eval\s*\(/g, severity: "critical", message: "eval() allows arbitrary code execution" },
  { id: "no-new-function", pattern: /new\s+Function\s*\(/g, severity: "critical", message: "new Function() enables dynamic code execution" },
  { id: "no-shell-exec", pattern: /child_process|\.exec\s*\(|execSync\s*\(|spawn\s*\(/g, severity: "critical", message: "Shell execution detected — command injection risk" },
  { id: "sql-injection", pattern: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*(?:\+|`\$\{)/gi, severity: "critical", message: "String-concatenated SQL — injection risk" },

  // ── HIGH ───────────────────────────────────
  { id: "no-innerhtml", pattern: /innerHTML\s*=/g, severity: "high", message: "Direct innerHTML assignment — XSS risk" },
  { id: "no-document-write", pattern: /document\.write\s*\(/g, severity: "high", message: "document.write can enable XSS" },
  { id: "hardcoded-secret", pattern: /(?:password|secret|api_key|apikey|token)\s*[:=]\s*["'][^"']{4,}["']/gi, severity: "high", message: "Possible hardcoded secret" },
  { id: "prototype-pollution", pattern: /__proto__|Object\.assign\s*\(\s*\{|prototype\s*\[/g, severity: "high", message: "Potential prototype pollution vector" },
  { id: "unsafe-deserialization", pattern: /pickle\.loads|yaml\.load\s*\(|unserialize\s*\(/g, severity: "high", message: "Unsafe deserialization — code execution risk" },
  { id: "path-traversal", pattern: /\.\.\//g, severity: "high", message: "Path traversal pattern detected" },

  // ✅ SSRF (USER-CONTROLLED URL)
  // fetch(req.query.url) / axios.get(req.body.url) / http.get(req.params.url) etc.
  { id: "ssrf-user-controlled-url-fetch", pattern: /\bfetch\s*\(\s*req\.(query|body|params)\.[a-zA-Z0-9_]+\s*\)/gi, severity: "high", message: "SSRF risk: fetch() called with user-controlled input (req.query/body/params)" },
  { id: "ssrf-user-controlled-url-axios", pattern: /\baxios\.(get|post|request)\s*\(\s*req\.(query|body|params)\.[a-zA-Z0-9_]+\s*\)/gi, severity: "high", message: "SSRF risk: axios called with user-controlled input (req.query/body/params)" },
  { id: "ssrf-user-controlled-url-http", pattern: /\bhttps?\.(get|request)\s*\(\s*req\.(query|body|params)\.[a-zA-Z0-9_]+\s*\)/gi, severity: "high", message: "SSRF risk: http(s) request called with user-controlled input (req.query/body/params)" },
  { id: "ssrf-user-controlled-url-got", pattern: /\bgot\s*\(\s*req\.(query|body|params)\.[a-zA-Z0-9_]+\s*\)/gi, severity: "high", message: "SSRF risk: got() called with user-controlled input (req.query/body/params)" },

  // ── MEDIUM ─────────────────────────────────
  { id: "insecure-random", pattern: /Math\.random\s*\(\)/g, severity: "medium", message: "Math.random() is not cryptographically secure" },
  { id: "no-cors-wildcard", pattern: /Access-Control-Allow-Origin.*\*/g, severity: "medium", message: "Wildcard CORS origin can expose API" },
  { id: "http-no-tls", pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/g, severity: "medium", message: "Non-TLS HTTP URL in production code" },

  // ── LOW / INFO ─────────────────────────────
  { id: "lint-suppression", pattern: /eslint-disable|noqa|noinspection|@ts-ignore/g, severity: "low", message: "Linter suppression — verify intentionality" },
  { id: "no-console", pattern: /console\.(log|debug|info)\s*\(/g, severity: "info", message: "Console logging left in code" },
  { id: "open-todo", pattern: /TODO|FIXME|HACK|XXX/g, severity: "info", message: "Unresolved TODO / FIXME comment" },
];

function detectLanguage(code: string, hint?: string): string {
  if (hint) return hint.toLowerCase();
  if (code.includes("import React") || code.includes("tsx")) return "typescript-react";
  if (code.includes(": string") || code.includes("interface ")) return "typescript";
  if (/^\s*def\s+/m.test(code) && code.includes(":")) return "python";
  if (code.includes("func ") && code.includes("package ")) return "go";
  if (code.includes("fn ") && code.includes("let mut")) return "rust";
  if (code.includes("public class") || code.includes("System.out")) return "java";
  if (code.includes("<?php")) return "php";
  return "javascript";
}

function decisionForRisk(risk: Severity): Decision {
  if (risk === "critical") return "BLOCK";
  if (risk === "high" || risk === "medium") return "WARN";
  return "ALLOW";
}

export async function analyzeCode(
  code: string,
  language?: string,
  _context?: string
): Promise<AnalysisResult> {
  const lang = detectLanguage(code, language);
  const lines = code.split("\n");
  const findings: RiskFinding[] = [];

  for (const rule of RULES) {
    if (rule.languages && !rule.languages.includes(lang)) continue;
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = re.exec(code)) !== null) {
      const lineNumber = code.slice(0, match.index).split("\n").length;
      findings.push({
        rule: rule.id,
        severity: rule.severity,
        line: lineNumber,
        message: rule.message,
        snippet: lines[lineNumber - 1]?.trim().slice(0, 120),
      });
    }
  }

  // Dedup by rule + line
  const seen = new Set<string>();
  const deduped = findings.filter((f) => {
    const key = `${f.rule}:${f.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity
  const order: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
  deduped.sort((a, b) => order[b.severity] - order[a.severity]);

  // Overall risk
  const criticalCount = deduped.filter((f) => f.severity === "critical").length;
  const highCount = deduped.filter((f) => f.severity === "high").length;

  let overallRisk: Severity = "info";
  if (criticalCount > 0) overallRisk = "critical";
  else if (highCount > 0) overallRisk = "high";
  else if (deduped.some((f) => f.severity === "medium")) overallRisk = "medium";
  else if (deduped.some((f) => f.severity === "low")) overallRisk = "low";

  const decision = decisionForRisk(overallRisk);

  return {
    language: lang,
    linesAnalyzed: lines.length,
    findings: deduped,
    overallRisk,
    decision,
    summary:
      deduped.length === 0
        ? "No risks detected in static analysis."
        : `Found ${deduped.length} issue(s): ${criticalCount} critical, ${highCount} high. Overall risk: ${overallRisk}.`,
  };
}
