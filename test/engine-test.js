const assert = require("assert");
const { calculateScore, GRADE_THRESHOLDS, SECURITY_BONUSES, getGradeColor } = require("../services/score-engine.js");
const { generateRemediation, generateFindingsSummary, REMEDIATION_TEMPLATES } = require("../services/remediation-engine.js");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ❌ ${name}: ${e.message}`);
  }
}

function assertApprox(actual, expected, tolerance, msg) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${msg || ''} expected ${expected} ±${tolerance}, got ${actual}`);
  }
}

// ── SCORE ENGINE TESTS ──────────────────────────────────────────
console.log("\nScore Engine:");

test("perfect score with no findings and all controls", () => {
  const result = calculateScore([], {
    hsts: true, csp: true, helmet: true, cors_restricted: true,
    docker_nonroot: true, docker_healthcheck: true, docker_tini: true,
    rate_limiting: true, no_secrets: true, csrf_protection: true,
    request_validation: true, audit_logging: true, inter_service_auth: true,
  });
  assert.strictEqual(result.grade, "A+", "Should be A+ with all controls");
  assert(result.score >= 95, `Score ${result.score} should be >= 95`);
});

test("score starts at 100 and deducts per finding", () => {
  const findings = [
    { severity: "critical", category: "api" },
    { severity: "high", category: "api" },
    { severity: "medium", category: "docker" },
  ];
  const result = calculateScore(findings, {});
  assert.strictEqual(result.score, 65);
  assert.strictEqual(result.grade, "D");
});

test("score clamped to 0 minimum", () => {
  const findings = Array(10).fill({ severity: "critical", category: "api" });
  const result = calculateScore(findings, {});
  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.grade, "F");
});

test("score capped at 100 maximum", () => {
  const result = calculateScore([], { hsts: true, csp: true, helmet: true,
    cors_restricted: true, docker_nonroot: true, docker_healthcheck: true,
    docker_tini: true, rate_limiting: true, no_secrets: true,
    csrf_protection: true, request_validation: true, audit_logging: true,
    inter_service_auth: true, dependency_audit: true, api_auth: true });
  assert.strictEqual(result.score, 100);
});

test("missing controls do not add bonuses", () => {
  const result = calculateScore([], {});
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.bonuses.length, 0);
});

test("partial controls give partial bonuses", () => {
  const result = calculateScore([{ severity: "high", category: "api" }], { hsts: true, rate_limiting: true });
  assert.strictEqual(result.score, 95);
});

test("grade thresholds are sequential", () => {
  for (let i = 0; i < GRADE_THRESHOLDS.length - 1; i++) {
    assert(GRADE_THRESHOLDS[i].min > GRADE_THRESHOLDS[i + 1].min,
      `Threshold ${GRADE_THRESHOLDS[i].grade}(${GRADE_THRESHOLDS[i].min}) should be > ${GRADE_THRESHOLDS[i+1].grade}(${GRADE_THRESHOLDS[i+1].min})`);
  }
});

test("getGradeColor returns colors for all grades", () => {
  for (const t of GRADE_THRESHOLDS) {
    const color = getGradeColor(t.grade);
    assert(color, `No color for grade ${t.grade}`);
    assert(color.startsWith("#"), `Color ${color} should be hex`);
  }
  assert(getGradeColor("Z") === "#A1A1AA", "Unknown grade should return default");
});

// ── REMEDIATION ENGINE TESTS ────────────────────────────────────
console.log("\nRemediation Engine:");

test("generateRemediation returns template for hardcoded_secret", () => {
  const finding = { vulnerability: "hardcoded_secret", severity: "critical", file: "src/config.js", confidence: "high", exploitability: "high" };
  const r = generateRemediation(finding);
  assert(r.technicalExplanation.includes("Hardcoded secrets"), "Should explain the danger");
  assert(r.fixInstructions.includes("Secrets Manager"), "Should recommend secrets manager");
  assert(r.secureCodeExample.includes("process.env.API_KEY"), "Should show env var pattern");
  assert(r.cwe === "CWE-798: Use of Hard-coded Credentials");
  assert.strictEqual(r.finding, "hardcoded_secret");
  assert.strictEqual(r.file, "src/config.js");
  assert.strictEqual(r.severity, "critical");
});

test("generateRemediation handles unknown vulnerability", () => {
  const finding = { vulnerability: "unknown_vuln", severity: "low", file: "test.js" };
  const r = generateRemediation(finding);
  assert(r.technicalExplanation.includes("potential weakness"), "Should fall back to default template");
  assert(r.cwe === "CWE-000: General Security Finding");
});

test("generateRemediation handles missing fields", () => {
  const r = generateRemediation({});
  assert(r.finding === "General Finding");
  assert(r.file === "Unknown");
  assert(r.severity === "medium");
  assert(r.confidence === "high");
  assert(r.exploitability === "medium");
});

test("generateRemediation for sql_injection", () => {
  const r = generateRemediation({ vulnerability: "sql_injection", severity: "critical", file: "db.js" });
  assert(r.cwe === "CWE-89: Improper Neutralization of Special Elements used in an SQL Command");
  assert(r.secureCodeExample.toLowerCase().includes("parameterized"), "Should show parameterized query");
});

test("generateRemediation for xss", () => {
  const r = generateRemediation({ vulnerability: "xss", severity: "high", file: "view.js" });
  assert(r.cwe === "CWE-79: Improper Neutralization of Input During Web Page Generation");
  assert(r.secureCodeExample.includes("textContent"), "Should show safe DOM API");
});

test("generateRemediation for command_injection", () => {
  const r = generateRemediation({ vulnerability: "command_injection", severity: "critical", file: "exec.js" });
  assert(r.cwe === "CWE-78: Improper Neutralization of Special Elements used in an OS Command");
  assert(r.fixInstructions.includes("NEVER"), "Should emphasize avoiding shell exec");
});

test("generateFindingsSummary counts severities correctly", () => {
  const findings = [
    { severity: "critical", category: "api" },
    { severity: "critical", category: "api" },
    { severity: "high", category: "docker" },
    { severity: "medium", category: "secret" },
    { severity: "low", category: "runtime" },
  ];
  const s = generateFindingsSummary(findings);
  assert.strictEqual(s.total, 5);
  assert.strictEqual(s.severityBreakdown.critical, 2);
  assert.strictEqual(s.severityBreakdown.high, 1);
  assert.strictEqual(s.severityBreakdown.medium, 1);
  assert.strictEqual(s.severityBreakdown.low, 1);
  assert.strictEqual(s.attackSurface, 4);
});

test("generateFindingsSummary with empty array", () => {
  const s = generateFindingsSummary([]);
  assert.strictEqual(s.total, 0);
  assert.strictEqual(s.severityBreakdown.critical, 0);
  assert.strictEqual(s.criticalExposure, "No critical findings detected");
});

test("generateFindingsSummary marks critical exposure", () => {
  const s = generateFindingsSummary([{ severity: "critical", category: "api" }]);
  assert(s.criticalExposure.includes("CRITICAL"), "Should flag critical exposure");
});

test("R07=HARDCODED_SECRET in REMEDIATION_TEMPLATES", () => {
  assert(REMEDIATION_TEMPLATES.hardcoded_secret, "R07 template should exist");
});

test("R22=KEY_EXFIL mapping (information_disclosure)", () => {
  assert(REMEDIATION_TEMPLATES.information_disclosure, "R22 template should exist");
});

test("ALL_REMEDIATION_TEMPLATES have required fields", () => {
  const required = ["title", "whyDangerous", "exploitationScenario", "impact", "remediation", "secureImplementation", "patchedCodeExample", "preventionGuidance", "cwe"];
  for (const [key, t] of Object.entries(REMEDIATION_TEMPLATES)) {
    for (const field of required) {
      assert(t[field], `Template ${key} missing field: ${field}`);
    }
  }
});

// ── SUMMARY ─────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
