const fs = require("fs");
const path = require("path");
const { calculateScore, getGradeColor } = require("./score-engine");
const { generateRemediation, generateFindingsSummary } = require("./remediation-engine");

let puppeteer = null;
try { puppeteer = require("puppeteer"); } catch { }

const TEMPLATE_PATH = path.join(__dirname, "..", "reports", "templates", "report-template.html");

function generateReportId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TEOS-${ts}-${rand}`;
}

async function generateReport(params) {
  const {
    target = "Unknown Target",
    tier = "FREE",
    findings = [],
    securityControls = {},
    executiveSummary = "",
  } = params;

  if (!puppeteer) {
    return await generateHTMLReport(params);
  }

  const html = populateTemplate({
    ...params,
    findings,
    securityControls,
    executiveSummary,
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      displayHeaderFooter: false,
    });
    return { pdf, reportId: generateReportId(), format: "pdf" };
  } finally {
    await browser.close();
  }
}

async function generateHTMLReport(params) {
  const html = populateTemplate(params);
  return { html, reportId: generateReportId(), format: "html" };
}

function populateTemplate(params) {
  const {
    target = "Unknown",
    tier = "FREE",
    date = new Date().toISOString().split("T")[0],
    reportId = generateReportId(),
    findings = [],
    securityControls = {},
    executiveSummary = "",
  } = params;

  const scoreResult = calculateScore(findings, securityControls);
  const summary = generateFindingsSummary(findings);
  const gradeColor = getGradeColor(scoreResult.grade);

  const findingsColor = scoreResult.score >= 70 ? "#22C55E" : scoreResult.score >= 50 ? "#EAB308" : "#EF4444";

  const totalVulns = findings.length;
  const maxBar = Math.max(1, summary.severityBreakdown.critical || 0, summary.severityBreakdown.high || 0, summary.severityBreakdown.medium || 0, summary.severityBreakdown.low || 0);
  const barMaxWidth = 300;
  function barWidth(count) { return Math.max(10, (count / maxBar) * barMaxWidth); }

  const chartY = { crit: 10, high: 44, med: 78, low: 112 };

  let template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  const replacements = {
    __TARGET__: target,
    __DATE__: date,
    __REPORT_ID__: reportId,
    __TIER__: tier.toUpperCase(),
    __GRADE__: scoreResult.grade,
    __GRADE_COLOR__: gradeColor,
    __SCORE__: Math.round(scoreResult.score),
    __TOTAL_FINDINGS__: totalVulns,
    __FINDINGS_COLOR__: findingsColor,
    __ATTACK_SURFACE__: summary.attackSurface,
    __CRITICAL_COUNT__: summary.severityBreakdown.critical || 0,
    __HIGH_COUNT__: summary.severityBreakdown.high || 0,
    __MEDIUM_COUNT__: summary.severityBreakdown.medium || 0,
    __LOW_COUNT__: summary.severityBreakdown.low || 0,
    __EXECUTIVE_SUMMARY__: executiveSummary || generateDefaultSummary(findings, scoreResult),
    __CRITICAL_EXPOSURE__: summary.criticalExposure,
    __CRIT_COLOR__: summary.severityBreakdown.critical > 0 ? "#EF4444" : "#22C55E",
    __CRIT_WEIGHT__: summary.severityBreakdown.critical > 0 ? "700" : "400",
    __CRIT_BAR_Y__: chartY.crit,
    __CRIT_BAR_W__: barWidth(summary.severityBreakdown.critical || 0),
    __CRIT_TEXT_Y__: chartY.crit + 16,
    __CRIT_LABEL_X__: 40 + barWidth(summary.severityBreakdown.critical || 0) + 8,
    __HIGH_BAR_Y__: chartY.high,
    __HIGH_BAR_W__: barWidth(summary.severityBreakdown.high || 0),
    __HIGH_TEXT_Y__: chartY.high + 16,
    __HIGH_LABEL_X__: 40 + barWidth(summary.severityBreakdown.high || 0) + 8,
    __MED_BAR_Y__: chartY.med,
    __MED_BAR_W__: barWidth(summary.severityBreakdown.medium || 0),
    __MED_TEXT_Y__: chartY.med + 16,
    __MED_LABEL_X__: 40 + barWidth(summary.severityBreakdown.medium || 0) + 8,
    __LOW_BAR_Y__: chartY.low,
    __LOW_BAR_W__: barWidth(summary.severityBreakdown.low || 0),
    __LOW_TEXT_Y__: chartY.low + 16,
    __LOW_LABEL_X__: 40 + barWidth(summary.severityBreakdown.low || 0) + 8,
    __VULN_ROWS__: generateVulnRows(findings),
    __REMEDIATION_BLOCKS__: generateRemediationBlocks(findings),
    __DEP_SCORE__: `${Math.round(scoreResult.breakdown.dependency.score)}/${scoreResult.breakdown.dependency.max}`,
    __DEP_PCT__: scoreResult.breakdown.dependency.max > 0 ? Math.round((scoreResult.breakdown.dependency.score / scoreResult.breakdown.dependency.max) * 100) : 0,
    __DEP_COLOR__: getGradeColor(scoreResult.breakdown.dependency.grade),
    __API_SCORE__: `${Math.round(scoreResult.breakdown.api_security.score)}/${scoreResult.breakdown.api_security.max}`,
    __API_PCT__: scoreResult.breakdown.api_security.max > 0 ? Math.round((scoreResult.breakdown.api_security.score / scoreResult.breakdown.api_security.max) * 100) : 0,
    __API_COLOR__: getGradeColor(scoreResult.breakdown.api_security.grade),
    __DOCKER_SCORE__: `${Math.round(scoreResult.breakdown.docker_hardening.score)}/${scoreResult.breakdown.docker_hardening.max}`,
    __DOCKER_PCT__: scoreResult.breakdown.docker_hardening.max > 0 ? Math.round((scoreResult.breakdown.docker_hardening.score / scoreResult.breakdown.docker_hardening.max) * 100) : 0,
    __DOCKER_COLOR__: getGradeColor(scoreResult.breakdown.docker_hardening.grade),
    __SECRETS_SCORE__: `${Math.round(scoreResult.breakdown.secrets_exposure.score)}/${scoreResult.breakdown.secrets_exposure.max}`,
    __SECRETS_PCT__: scoreResult.breakdown.secrets_exposure.max > 0 ? Math.round((scoreResult.breakdown.secrets_exposure.score / scoreResult.breakdown.secrets_exposure.max) * 100) : 0,
    __SECRETS_COLOR__: getGradeColor(scoreResult.breakdown.secrets_exposure.grade),
    __RUNTIME_SCORE__: `${Math.round(scoreResult.breakdown.runtime_security.score)}/${scoreResult.breakdown.runtime_security.max}`,
    __RUNTIME_PCT__: scoreResult.breakdown.runtime_security.max > 0 ? Math.round((scoreResult.breakdown.runtime_security.score / scoreResult.breakdown.runtime_security.max) * 100) : 0,
    __RUNTIME_COLOR__: getGradeColor(scoreResult.breakdown.runtime_security.grade),
    __BONUSES__: generateBonuses(scoreResult.bonuses),
    __IMMEDIATE_ACTIONS__: generateActions(findings, "immediate"),
    __SHORT_TERM_ACTIONS__: generateActions(findings, "short_term"),
    __LONG_TERM_ACTIONS__: generateActions(findings, "long_term"),
    __OWASP_COVERAGE__: generateOwaspCoverage(findings),
    __CWE_REFERENCES__: generateCweReferences(findings),
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.split(key).join(String(value));
  }

  return template;
}

function generateVulnRows(findings) {
  return findings.map(f => {
    const sev = f.severity || "low";
    const cwe = f.cwe || "N/A";
    const conf = f.confidence || "medium";
    return `<tr>
      <td><span class="badge badge-${sev}">${sev}</span></td>
      <td><div class="vuln-name">${f.vulnerability || "General Finding"}</div></td>
      <td><div class="vuln-path">${f.file || f.path || "Unknown"}</div></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:7px;color:#71717A;">${cwe}</td>
      <td><span class="badge badge-${conf}">${conf}</span></td>
    </tr>`;
  }).join("\n");
}

function generateRemediationBlocks(findings) {
  return findings.map(f => {
    const rem = generateRemediation(f);
    const sev = rem.severity || "medium";
    return `<div class="remediation-block">
      <div class="finding-header">
        <span class="badge badge-${sev}">${sev}</span>
        <h3>${rem.finding}</h3>
        <span class="cwe">${rem.cwe}</span>
        <span class="file">${rem.file}</span>
      </div>
      <div class="remediation-grid">
        <div class="remediation-item full-width">
          <div class="ri-label">Technical Explanation</div>
          <div class="ri-body">${rem.technicalExplanation}</div>
        </div>
        <div class="remediation-item">
          <div class="ri-label">Exploitation Scenario</div>
          <div class="ri-body">${rem.exploitationScenario}</div>
        </div>
        <div class="remediation-item">
          <div class="ri-label">Risk Impact</div>
          <div class="ri-body">${rem.riskImpact}</div>
        </div>
        <div class="remediation-item full-width">
          <div class="ri-label">Fix Instructions</div>
          <div class="ri-body">${rem.fixInstructions}</div>
        </div>
        <div class="remediation-item full-width">
          <div class="ri-label">Secure Implementation</div>
          <div class="ri-body">${rem.secureImplementation}</div>
        </div>
        <div class="remediation-item full-width">
          <div class="ri-label">Patched Code Example</div>
          <div class="ri-body mono">${escapeHtml(rem.secureCodeExample)}</div>
        </div>
        <div class="remediation-item">
          <div class="ri-label">Prevention Guidance</div>
          <div class="ri-body">${rem.preventionGuidance}</div>
        </div>
        <div class="remediation-item">
          <div class="ri-label">Exploitability</div>
          <div class="ri-body">${rem.exploitability}</div>
        </div>
        <div class="remediation-item" style="grid-column:1/-1;">
          <div class="ri-label">Severity Reasoning</div>
          <div class="ri-body">${rem.severityReasoning}</div>
        </div>
      </div>
    </div>`;
  }).join("\n");
}

function generateDefaultSummary(findings, scoreResult) {
  const total = findings.length;
  const critical = findings.filter(f => f.severity === "critical").length;
  if (total === 0) {
    return "No security findings were detected. The target demonstrates strong security posture with all controls properly configured. Continue monitoring and maintain regular security audits to sustain this level of security maturity.";
  }
  let summary = `TEOS Sentinel identified ${total} security finding${total !== 1 ? "s" : ""} across the target, resulting in an overall security score of ${Math.round(scoreResult.score)}/100 (Grade ${scoreResult.grade}). `;
  if (critical > 0) {
    summary += `${critical} critical finding${critical !== 1 ? "s were" : " was"} detected requiring immediate remediation. `;
  }
  summary += "This assessment evaluates runtime security posture, dependency hygiene, API security controls, Docker hardening, and secrets management. ";
  summary += scoreResult.score >= 80 ? "The overall security posture is strong with minor improvements recommended." : scoreResult.score >= 60 ? "While baseline security controls are present, significant improvements are recommended to reduce risk exposure." : "Urgent security improvements are required to establish a minimum security baseline.";
  return summary;
}

function generateBonuses(bonuses) {
  if (!bonuses || bonuses.length === 0) return "No security bonuses applicable.";
  return bonuses.map(b => `<span style="display:inline-block;padding:2px 10px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);border-radius:10px;margin:2px;font-size:8px;color:#22C55E;">+${b.points} ${b.label}</span>`).join(" ");
}

function generateActions(findings, timeframe) {
  const actions = [];
  for (const f of findings) {
    const sev = f.severity || "low";
    if (timeframe === "immediate" && (sev === "critical" || sev === "high")) {
      actions.push({ severity: sev, text: `<strong>${f.vulnerability || "Finding"}</strong> in <code>${f.file || f.path || "?"}</code> — ${f.remediation?.substring(0, 80) || "Apply fix per remediation guidance"}...` });
    } else if (timeframe === "short_term" && sev === "medium") {
      actions.push({ severity: sev, text: `<strong>${f.vulnerability || "Finding"}</strong> in <code>${f.file || f.path || "?"}</code> — ${f.remediation?.substring(0, 80) || "Apply fix per remediation guidance"}...` });
    }
  }

  if (timeframe === "long_term") {
    const hasLongTerm = findings.filter(f => f.severity === "low").length > 0;
    if (hasLongTerm) {
      for (const f of findings.filter(f => f.severity === "low")) {
        actions.push({ severity: "low", text: `<strong>${f.vulnerability || "Finding"}</strong> in <code>${f.file || f.path || "?"}</code> — ${f.remediation?.substring(0, 80) || "Apply fix per remediation guidance"}...` });
      }
    }
    actions.push({ severity: "low", text: "<strong>Establish regular security audit cadence</strong> — Schedule weekly automated scans and monthly manual reviews." });
    actions.push({ severity: "low", text: "<strong>Implement security training program</strong> — Ensure development team is trained on secure coding practices and OWASP Top 10." });
    actions.push({ severity: "low", text: "<strong>Deploy SAST/DAST in CI/CD pipeline</strong> — Add automated security scanning to prevent vulnerabilities from reaching production." });
  }

  if (actions.length === 0) {
    const emptyMessages = {
      immediate: "No critical or high-severity findings requiring immediate action.",
      short_term: "No medium-severity findings for short-term improvement.",
      long_term: "All recommended long-term hardening measures are listed below.",
    };
    return `<div class="action-item"><div class="dot low" style="background:#52525B;"></div><div class="ai-text">${emptyMessages[timeframe] || "No actions required."}</div></div>`;
  }

  return actions.map(a =>
    `<div class="action-item"><div class="dot ${a.severity}"></div><div class="ai-text">${a.text}</div></div>`
  ).join("\n");
}

function generateOwaspCoverage(findings) {
  const owaspMap = {
    hardcoded_secret: "A07:2021 — Identification and Authentication Failures",
    sql_injection: "A03:2021 — Injection",
    xss: "A03:2021 — Injection",
    command_injection: "A03:2021 — Injection",
    insecure_auth: "A07:2021 — Identification and Authentication Failures",
    insecure_dependency: "A06:2021 — Vulnerable and Outdated Components",
    information_disclosure: "A04:2021 — Insecure Design",
    csrf: "A01:2021 — Broken Access Control",
    xxe: "A05:2021 — Security Misconfiguration",
    ssti: "A03:2021 — Injection",
  };
  const categories = new Set();
  for (const f of findings) {
    const owasp = owaspMap[f.vulnerability];
    if (owasp) categories.add(owasp);
  }
  if (categories.size === 0) return "No OWASP Top 10 mappings for detected findings.";
  return Array.from(categories).map(c => `<div style="margin:4px 0;color:#D4D4D8;">• ${c}</div>`).join("");
}

function generateCweReferences(findings) {
  const refs = new Set();
  for (const f of findings) {
    if (f.cwe) refs.add(f.cwe);
  }
  if (refs.size === 0) return "No CWE references for detected findings.";
  return Array.from(refs).map(cwe => `<code style="color:#F5C542;font-family:'JetBrains Mono',monospace;font-size:8px;background:rgba(245,197,66,0.06);padding:2px 8px;border-radius:4px;display:inline-block;margin:2px;">${cwe}</code>`).join(" ");
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

module.exports = { generateReport, generateReportId, populateTemplate };
