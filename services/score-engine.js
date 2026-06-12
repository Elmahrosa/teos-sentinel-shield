const CRITICAL_PENALTY = 20;
const HIGH_PENALTY = 10;
const MEDIUM_PENALTY = 5;
const LOW_PENALTY = 1;

const SECURITY_BONUSES = {
  hsts: { label: "HSTS Enabled", points: 3 },
  csp: { label: "Content Security Policy", points: 3 },
  helmet: { label: "Security Headers (Helmet)", points: 2 },
  cors_restricted: { label: "CORS Restricted", points: 2 },
  docker_nonroot: { label: "Non-Root Docker User", points: 3 },
  docker_healthcheck: { label: "Docker HEALTHCHECK", points: 1 },
  docker_tini: { label: "Tini Init Process", points: 1 },
  rate_limiting: { label: "Rate Limiting", points: 2 },
  no_secrets: { label: "No Exposed Secrets", points: 5 },
  csrf_protection: { label: "CSRF Protection", points: 2 },
  request_validation: { label: "Input Validation", points: 3 },
  audit_logging: { label: "Audit Logging", points: 2 },
  inter_service_auth: { label: "Inter-Service Auth", points: 3 },
};

const GRADE_THRESHOLDS = [
  { grade: "A+", min: 95 },
  { grade: "A", min: 90 },
  { grade: "B", min: 80 },
  { grade: "C", min: 70 },
  { grade: "D", min: 60 },
  { grade: "F", min: 0 },
];

function calculateScore(findings, securityControls) {
  let score = 100;

  for (const finding of findings) {
    switch (finding.severity) {
      case "critical": score -= CRITICAL_PENALTY; break;
      case "high": score -= HIGH_PENALTY; break;
      case "medium": score -= MEDIUM_PENALTY; break;
      case "low": score -= LOW_PENALTY; break;
      default: score -= 1;
    }
  }

  for (const [key, control] of Object.entries(securityControls)) {
    if (control && SECURITY_BONUSES[key]) {
      score += SECURITY_BONUSES[key].points;
    }
  }

  score = Math.max(0, Math.min(100, score));
  const grade = GRADE_THRESHOLDS.find(t => score >= t.min)?.grade || "F";

  const breakdown = {
    overall: { score, grade },
    dependency: { score: 0, grade: "F", max: 25 },
    api_security: { score: 0, grade: "F", max: 25 },
    docker_hardening: { score: 0, grade: "F", max: 20 },
    secrets_exposure: { score: 0, grade: "F", max: 15 },
    runtime_security: { score: 0, grade: "F", max: 15 },
  };

  const dependencyCount = findings.filter(f => f.category === "dependency").length;
  const apiCount = findings.filter(f => f.category === "api").length;
  const dockerCount = findings.filter(f => f.category === "docker").length;
  const secretsCount = findings.filter(f => f.category === "secret").length;

  breakdown.dependency = {
    score: Math.max(0, 25 - dependencyCount * 5 + (securityControls.dependency_audit ? 3 : 0)),
    grade: calcGrade(Math.max(0, 25 - dependencyCount * 5 + (securityControls.dependency_audit ? 3 : 0)), 25),
    max: 25,
  };
  breakdown.api_security = {
    score: Math.max(0, 25 - apiCount * 5 + (securityControls.api_auth ? 5 : 0) + (securityControls.rate_limiting ? 3 : 0)),
    grade: calcGrade(Math.max(0, 25 - apiCount * 5 + (securityControls.api_auth ? 5 : 0) + (securityControls.rate_limiting ? 3 : 0)), 25),
    max: 25,
  };
  breakdown.docker_hardening = {
    score: Math.max(0, 20 - dockerCount * 4 + (securityControls.docker_nonroot ? 4 : 0) + (securityControls.docker_healthcheck ? 2 : 0) + (securityControls.docker_tini ? 2 : 0)),
    grade: calcGrade(Math.max(0, 20 - dockerCount * 4 + (securityControls.docker_nonroot ? 4 : 0) + (securityControls.docker_healthcheck ? 2 : 0) + (securityControls.docker_tini ? 2 : 0)), 20),
    max: 20,
  };
  breakdown.secrets_exposure = {
    score: Math.max(0, 15 - secretsCount * 5 + (securityControls.no_secrets ? 5 : 0)),
    grade: calcGrade(Math.max(0, 15 - secretsCount * 5 + (securityControls.no_secrets ? 5 : 0)), 15),
    max: 15,
  };
  breakdown.runtime_security = {
    score: Math.max(0, 15 - (findings.length - dependencyCount - apiCount - dockerCount - secretsCount) * 3 + (securityControls.audit_logging ? 2 : 0) + (securityControls.csrf_protection ? 2 : 0) + (securityControls.request_validation ? 2 : 0)),
    grade: calcGrade(Math.max(0, 15 - (findings.length - dependencyCount - apiCount - dockerCount - secretsCount) * 3 + (securityControls.audit_logging ? 2 : 0) + (securityControls.csrf_protection ? 2 : 0) + (securityControls.request_validation ? 2 : 0)), 15),
    max: 15,
  };

  return { score, grade, breakdown, bonuses: getBonuses(securityControls) };
}

function calcScoreLabel(value, max) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return `${Math.round(value)}/${max} (${pct}%)`;
}

function calcGrade(score, max) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return GRADE_THRESHOLDS.find(t => pct >= t.min)?.grade || "F";
}

function getBonuses(securityControls) {
  const earned = [];
  for (const [key, val] of Object.entries(securityControls)) {
    if (val && SECURITY_BONUSES[key]) {
      earned.push(SECURITY_BONUSES[key]);
    }
  }
  return earned;
}

function getGradeColor(grade) {
  switch (grade) {
    case "A+": case "A": return "#22C55E";
    case "B": return "#6EE7B7";
    case "C": return "#EAB308";
    case "D": return "#F97316";
    case "F": return "#EF4444";
    default: return "#A1A1AA";
  }
}

module.exports = { calculateScore, GRADE_THRESHOLDS, SECURITY_BONUSES, getGradeColor, calcScoreLabel };
