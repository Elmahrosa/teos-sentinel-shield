// ─────────────────────────────────────────────────────────────
//  src/core/review.ts — Heuristic diff-risk scanner (core engine)
// ─────────────────────────────────────────────────────────────

export interface Finding {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  evidence: string;
  recommendation: string;
}

export interface ReviewResult {
  decision: "ALLOW" | "WARN" | "BLOCK";
  score: number;
  findings: Finding[];
}

export interface FixSuggestion {
  findingId: string;
  description: string;
  suggestedPatch: string;
}

// ── Pattern definitions ──────────────────────────────────────

interface RulePattern {
  id: string;
  regex: RegExp;
  severity: Finding["severity"];
  title: string;
  recommendation: string;
  weight: number;
}

const RULES: RulePattern[] = [
  // ── Injection & dynamic execution ──
  {
    id: "INJECTION.EVAL",
    regex: /\beval\s*\(/gi,
    severity: "HIGH",
    title: "Dynamic code execution detected",
    recommendation: "Remove eval; use a safe parser or allowlist.",
    weight: 25,
  },
  {
    id: "INJECTION.FUNCTION_CTOR",
    regex: /new\s+Function\s*\(/gi,
    severity: "HIGH",
    title: "Function constructor used for dynamic execution",
    recommendation:
      "Avoid new Function(); use static imports or a sandboxed evaluator.",
    weight: 25,
  },
  {
    id: "INJECTION.EXEC",
    regex: /\bexec\s*\(|child_process|\.exec\s*\(/gi,
    severity: "HIGH",
    title: "Shell / OS command execution detected",
    recommendation:
      "Avoid exec; use parameterized APIs or spawn with explicit args.",
    weight: 25,
  },
  {
    id: "INJECTION.SQL",
    regex:
      /(\$\{.*?\}|['"]?\s*\+\s*\w+\s*\+\s*['"]?)\s*.*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)/gi,
    severity: "HIGH",
    title: "Potential SQL injection via string interpolation",
    recommendation: "Use parameterized queries or an ORM.",
    weight: 25,
  },
  {
    id: "INJECTION.TEMPLATE_CMD",
    regex: /`[^`]*\$\{[^}]+\}[^`]*`\s*.*?(exec|spawn|system)/gi,
    severity: "HIGH",
    title: "Template literal interpolated into command execution",
    recommendation: "Never interpolate user input into shell commands.",
    weight: 25,
  },

  // ── Secrets & credential leakage ──
  {
    id: "SECRET.API_KEY",
    regex:
      /(api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/gi,
    severity: "CRITICAL",
    title: "Hardcoded API key detected",
    recommendation:
      "Move secrets to environment variables or a secret manager.",
    weight: 30,
  },
  {
    id: "SECRET.PRIVATE_KEY",
    regex: /-----BEGIN\s+(RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/gi,
    severity: "CRITICAL",
    title: "Private key committed to source",
    recommendation: "Remove immediately; rotate the key; use a vault.",
    weight: 35,
  },
  {
    id: "SECRET.TOKEN",
    regex:
      /(token|bearer|authorization)\s*[:=]\s*['"][A-Za-z0-9_\-\.]{20,}['"]/gi,
    severity: "HIGH",
    title: "Hardcoded token or bearer credential",
    recommendation: "Use environment variables or runtime secret injection.",
    weight: 25,
  },
  {
    id: "SECRET.ENV_FILE",
    regex: /\.env\b(?!\.example|\.template|\.sample)/gi,
    severity: "MEDIUM",
    title: "Possible .env file reference or exposure",
    recommendation:
      "Ensure .env is in .gitignore and never committed.",
    weight: 15,
  },
  {
    id: "SECRET.HIGH_ENTROPY",
    regex: /['"][A-Za-z0-9+/=]{40,}['"]/g,
    severity: "MEDIUM",
    title: "High-entropy string (possible secret)",
    recommendation: "Verify this is not a credential; move to config if so.",
    weight: 12,
  },
  {
    id: "SECRET.AWS_KEY",
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: "CRITICAL",
    title: "AWS access key ID detected",
    recommendation: "Rotate the key immediately; use IAM roles instead.",
    weight: 35,
  },

  // ── Unsafe deserialization ──
  {
    id: "DESER.PICKLE",
    regex: /pickle\.loads?\s*\(/gi,
    severity: "HIGH",
    title: "Unsafe pickle deserialization",
    recommendation:
      "Use a safe format (JSON, protobuf) or restrict unpickling.",
    weight: 25,
  },
  {
    id: "DESER.YAML_UNSAFE",
    regex: /yaml\.load\s*\([^)]*(?!Loader\s*=\s*SafeLoader)/gi,
    severity: "HIGH",
    title: "YAML load without SafeLoader",
    recommendation: "Use yaml.safe_load() or pass Loader=SafeLoader.",
    weight: 20,
  },
  {
    id: "DESER.UNSERIALIZE",
    regex: /\bunserialize\s*\(/gi,
    severity: "HIGH",
    title: "PHP unserialize on untrusted data",
    recommendation: "Use JSON decoding or validate input strictly.",
    weight: 25,
  },

  // ── Insecure crypto ──
  {
    id: "CRYPTO.MD5",
    regex: /\b(md5|MD5)\s*\(/gi,
    severity: "MEDIUM",
    title: "Weak hash function (MD5)",
    recommendation: "Use SHA-256+ or bcrypt/argon2 for passwords.",
    weight: 15,
  },
  {
    id: "CRYPTO.SHA1",
    regex: /\b(sha1|SHA1)\s*\(/gi,
    severity: "MEDIUM",
    title: "Weak hash function (SHA-1)",
    recommendation: "Upgrade to SHA-256 or stronger.",
    weight: 12,
  },
  {
    id: "CRYPTO.MATH_RANDOM",
    regex: /Math\.random\s*\(/gi,
    severity: "MEDIUM",
    title: "Math.random used (not cryptographically secure)",
    recommendation:
      "Use crypto.getRandomValues() or crypto.randomBytes().",
    weight: 12,
  },
  {
    id: "CRYPTO.HARDCODED_SALT",
    regex: /salt\s*[:=]\s*['"][^'"]{1,32}['"]/gi,
    severity: "MEDIUM",
    title: "Hardcoded salt detected",
    recommendation: "Generate salts dynamically per-hash.",
    weight: 15,
  },

  // ── Auth / authz risk ──
  {
    id: "AUTH.BYPASS",
    regex:
      /(auth\s*=\s*false|skip[_-]?auth|no[_-]?auth|disable[_-]?auth|isAdmin\s*=\s*true)/gi,
    severity: "HIGH",
    title: "Authentication/authorization bypass pattern",
    recommendation: "Review carefully; ensure this is gated by tests.",
    weight: 22,
  },
  {
    id: "AUTH.PERMISSIVE_ACL",
    regex: /(allowAll|permit\s*\(\s*\*\s*\)|role\s*[:=]\s*['"]admin['"])/gi,
    severity: "MEDIUM",
    title: "Overly permissive access control",
    recommendation: "Apply least-privilege; restrict roles explicitly.",
    weight: 15,
  },

  // ── Network & SSRF ──
  {
    id: "NET.SSRF",
    regex:
      /(fetch|axios|http\.get|request)\s*\(\s*(\w+|`\$\{)/gi,
    severity: "HIGH",
    title: "Potential SSRF — URL from variable",
    recommendation: "Validate and allowlist target URLs.",
    weight: 22,
  },
  {
    id: "NET.OPEN_REDIRECT",
    regex: /redirect\s*\(\s*req\.(query|params|body)\./gi,
    severity: "MEDIUM",
    title: "Open redirect from user input",
    recommendation: "Validate redirect targets against an allowlist.",
    weight: 15,
  },

  // ── Dangerous config changes ──
  {
    id: "CONFIG.CORS_STAR",
    regex: /cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]/gi,
    severity: "MEDIUM",
    title: "CORS set to allow all origins",
    recommendation: "Restrict origins to known domains.",
    weight: 15,
  },
  {
    id: "CONFIG.TLS_REJECT",
    regex: /rejectUnauthorized\s*:\s*false/gi,
    severity: "HIGH",
    title: "TLS certificate verification disabled",
    recommendation: "Never disable TLS verification in production.",
    weight: 22,
  },
  {
    id: "CONFIG.SECURITY_HEADER_OFF",
    regex:
      /(helmet\s*\(\s*\{\s*.*?:\s*false|x-frame-options\s*:\s*['"]?ALLOWALL)/gi,
    severity: "MEDIUM",
    title: "Security header disabled or weakened",
    recommendation: "Keep security headers at recommended defaults.",
    weight: 15,
  },
  {
    id: "CONFIG.CI_SECRET_EXPOSURE",
    regex: /(pull_request_target|secrets\.\w+.*\bif\b.*\bfork\b)/gi,
    severity: "HIGH",
    title: "CI config may expose secrets to fork/PR builds",
    recommendation:
      "Never pass secrets to pull_request_target or fork workflows.",
    weight: 25,
  },
];

// ── Only scan added lines ────────────────────────────────────

function extractAddedLines(diff: string): string[] {
  return diff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1));
}

// ── Core review function ─────────────────────────────────────

export function reviewDiff(diff: string): ReviewResult {
  const addedLines = extractAddedLines(diff);
  const addedText = addedLines.join("\n");
  const findings: Finding[] = [];
  let totalWeight = 0;

  for (const rule of RULES) {
    // Reset lastIndex for global regexes
    rule.regex.lastIndex = 0;
    const match = rule.regex.exec(addedText);
    if (match) {
      findings.push({
        id: rule.id,
        severity: rule.severity,
        title: rule.title,
        evidence: match[0].trim().substring(0, 120),
        recommendation: rule.recommendation,
      });
      totalWeight += rule.weight;
    }
  }

  const score = Math.min(100, totalWeight);

  let decision: ReviewResult["decision"];
  if (score >= 60) {
    decision = "BLOCK";
  } else if (score >= 25) {
    decision = "WARN";
  } else {
    decision = "ALLOW";
  }

  return { decision, score, findings };
}

// ── Pipeline guard (thin wrapper) ────────────────────────────

export interface PipelineGuardResult {
  gate: "ALLOW" | "BLOCK";
  score: number;
  critical: number;
  high: number;
  summary: string;
}

export function pipelineGuard(
  diff: string,
  threshold: number = 50
): PipelineGuardResult {
  const review = reviewDiff(diff);

  const critical = review.findings.filter(
    (f) => f.severity === "CRITICAL"
  ).length;
  const high = review.findings.filter((f) => f.severity === "HIGH").length;
  const gate: "ALLOW" | "BLOCK" =
    review.score >= threshold || critical > 0 ? "BLOCK" : "ALLOW";

  return {
    gate,
    score: review.score,
    critical,
    high,
    summary: `${review.findings.length} finding(s): ${critical} critical, ${high} high. Score ${review.score}/100.`,
  };
}

// ── Fix suggestion generator (premium) ───────────────────────

export function generateFixSuggestions(diff: string): FixSuggestion[] {
  const review = reviewDiff(diff);
  return review.findings.map((finding) => {
    return {
      findingId: finding.id,
      description: `${finding.title} — ${finding.recommendation}`,
      suggestedPatch: buildPatchHint(finding),
    };
  });
}

function buildPatchHint(finding: Finding): string {
  const patchMap: Record<string, string> = {
    "INJECTION.EVAL":
      '- eval(userInput)\n+ const result = safeParser.parse(userInput);',
    "INJECTION.FUNCTION_CTOR":
      '- const fn = new Function(code)\n+ // Use a sandboxed evaluator or static import',
    "INJECTION.EXEC":
      '- exec(cmd)\n+ const { stdout } = spawn("cmd", args, { shell: false });',
    "SECRET.API_KEY":
      '- const key = "AKIAXXXXXXXXXXXXXXXX"\n+ const key = process.env.API_KEY;',
    "SECRET.PRIVATE_KEY":
      "- [inline private key]\n+ // Load from vault or env at runtime",
    "SECRET.AWS_KEY":
      '- AKIA...\n+ const key = process.env.AWS_ACCESS_KEY_ID;',
    "CRYPTO.MD5":
      '- md5(password)\n+ const hash = crypto.createHash("sha256").update(password).digest("hex");',
    "CRYPTO.MATH_RANDOM":
      "- Math.random()\n+ crypto.getRandomValues(new Uint32Array(1))[0]",
    "DESER.PICKLE":
      "- pickle.loads(data)\n+ json.loads(data)  # or use a safe schema",
    "DESER.YAML_UNSAFE":
      "- yaml.load(data)\n+ yaml.safe_load(data)",
    "CONFIG.TLS_REJECT":
      "- rejectUnauthorized: false\n+ rejectUnauthorized: true",
    "CONFIG.CORS_STAR":
      '- origin: "*"\n+ origin: ["https://yourdomain.com"]',
  };

  return (
    patchMap[finding.id] ||
    `- ${finding.evidence}\n+ // ${finding.recommendation}`
  );
}
