const axios = require('axios');
const { logger } = require('../../logger.cjs');
const { emit } = require('./telemetry.service');
const { getEffectiveConfidence } = require('../governance/confidence-decay');
const { buildProvenance } = require('../governance/provenance');
const { append: audit } = require('../governance/audit');
const { humanExplanation, machineExplanation } = require('../governance/explain');
const { build: buildFingerprint } = require('../governance/decision-fingerprint');
const { load: loadRules } = require('../rules/registry');
const { enrichAdjudication } = require('../governance/semantic-layer');
const { shouldEscalate, escalate, pushContext, preserveCritical } = require('../governance/context-manager');
const { isDangerousCommand } = require('./detectionEngine');
const { scanForSecrets } = require('./secret-detection');

// Optional upstream engine (deps/ci/token + Claude tool interception). Left empty when unset
// so callers can detect "not configured" and fail fast instead of waiting on localhost.
const MCP_API = process.env.MCP_API || process.env.MCP_ENGINE_URL || "";
const MCP_CONFIGURED = MCP_API.length > 0;
const SENTINEL_API = process.env.SENTINEL_URL || process.env.SENTINEL_API || "http://localhost:3000";
const SENTINEL_API_KEY = process.env.SENTINEL_API_KEY || "";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || "";

const VERDICT_ORDER = { BLOCK: 3, WARN: 2, ALLOW: 1, ERROR: 0 };

function epistemicState(cons, conf, results, finalVerdict, downgraded) {
  if (results.length === 0) return "UNKNOWN";
  if (results.length === 1) return "PROVISIONAL";
  if (cons === "split") {
    const verdicts = results.map(r => r.verdict);
    if (verdicts.includes("BLOCK") && verdicts.includes("ALLOW")) return "CONFLICTED";
    return "PARTIAL";
  }
  if (downgraded) return "LOW_CONFIDENCE";
  if (conf.level === "high") return "CONFIDENT";
  if (conf.level === "medium") return "PROVISIONAL";
  return "LOW_CONFIDENCE";
}

function confidenceFromConsensus(results) {
  if (results.length === 0) return { level: "none", label: "No data" };
  if (results.length === 1) return { level: "low", label: "Single source — provisional" };

  const verdicts = results.map(r => r.verdict);
  const unique = new Set(verdicts);

  if (unique.size === 1) {
    if (verdicts[0] === "ALLOW") return { level: "high", label: "Unanimous ALLOW — confident" };
    if (verdicts[0] === "BLOCK") return { level: "high", label: "Unanimous BLOCK — confident" };
    return { level: "medium", label: "Consistent — moderate confidence" };
  }

  const scores = results.map(r => r.score);
  const scoreGap = Math.abs(scores[0] - scores[1]);
  if (unique.has("BLOCK") && unique.has("ALLOW")) {
    return { level: "low", label: `Engines conflicted (BLOCK vs ALLOW, gap: ${scoreGap})` };
  }
  return { level: "medium", label: `Partial agreement (gap: ${scoreGap})` };
}

function consensusType(results) {
  if (results.length === 0) return "no_data";
  if (results.length === 1) return "single_source";
  const verdicts = results.map(r => r.verdict);
  const unique = new Set(verdicts);
  if (unique.size === 1) return "unanimous";
  return "split";
}

let rulesLoaded = false;
function ensureRulesLoaded() {
  if (!rulesLoaded) { loadRules(); rulesLoaded = true; }
}

function adjudicate(results, input) {
  const startedAt = Date.now();
  ensureRulesLoaded();

  if (results.length === 0) {
    const base = {
      verdict: "UNKNOWN",
      score: 0,
      epistemic: "UNKNOWN",
      confidence: { level: "none", label: "No engines available" },
      consensus: "no_data",
      uncertainty: { source: "infrastructure", detail: "No adjudication sources reached" },
      provenance: [],
      provenanceAnalysis: { decisiveEngine: null, decisiveRule: null, signalWeights: {}, decisionType: "no_data" },
      reasons: ["No engines reachable — cannot adjudicate"],
      riskLevel: "unknown",
    };
    base.fingerprint = buildFingerprint(input || "", []);
    base.explain = { human: humanExplanation(base, input || ""), machine: machineExplanation(base) };
    return base;
  }

  const strictest = results.reduce((a, b) => {
    const aOrd = VERDICT_ORDER[a.verdict] || 0;
    const bOrd = VERDICT_ORDER[b.verdict] || 0;
    if (aOrd !== bOrd) return aOrd > bOrd ? a : b;
    return (a.score || 0) >= (b.score || 0) ? a : b;
  });

  const conf = confidenceFromConsensus(results);
  const cons = consensusType(results);

  let uncertainty = null;
  if (conf.level === "low") {
    uncertainty = { source: "consensus", detail: conf.label };
  }
  if (results.length === 1) {
    uncertainty = { source: "coverage", detail: "Only one adjudication source available — results provisional" };
  }

  const maxScore = Math.max(...results.map(r => r.score));
  const allReasons = [...new Set(results.flatMap(r => r.reasons || []))];

  let riskLevel = "info";
  if (maxScore >= 80) riskLevel = "critical";
  else if (maxScore >= 60) riskLevel = "high";
  else if (maxScore >= 40) riskLevel = "medium";
  else if (maxScore >= 20) riskLevel = "low";

  const provenance = results.map(r => ({
    source: r._source || "unknown",
    verdict: r.verdict,
    score: r.score,
    reasons: r.reasons || [],
    ruleIds: r.ruleIds || [],
  }));

  const hasCritical = Array.isArray(strictest.severity) && strictest.severity.some(s => String(s).toLowerCase() === "critical");
  let downgraded = false;
  let finalVerdict = strictest.verdict;
  if (finalVerdict === "BLOCK" && conf.level === "low" && !hasCritical && maxScore < 80) {
    finalVerdict = "WARN";
    downgraded = true;
  }

  const epi = epistemicState(cons, conf, results, finalVerdict, downgraded);
  const prov = buildProvenance(provenance, finalVerdict, conf, cons, downgraded);

  const latency = Date.now() - startedAt;

  emit("verdict", {
    verdict: finalVerdict,
    epistemic: epi,
    score: maxScore,
    confidence: conf.level,
    consensus: cons,
    riskLevel,
    ruleHits: allReasons.length,
    engineCount: results.length,
    engineDisagreement: cons === "split",
    downgraded,
    decisionType: prov.decisionType,
    latency,
  });

  if (finalVerdict === "BLOCK" || epi === "CONFLICTED") {
    audit({
      eventType: finalVerdict === "BLOCK" ? "BLOCK_VERDICT" : "CONFLICTED",
      verdict: finalVerdict,
      score: maxScore,
      confidence: conf.level,
      consensus: cons,
      epistemic: epi,
      riskLevel,
      decisiveEngine: prov.decisiveEngine,
      decisiveRule: prov.decisiveRule,
      decisionType: prov.decisionType,
      source: "adjudication",
    });
  }

  const fp = buildFingerprint(input || "", results);
  const result = {
    verdict: finalVerdict,
    epistemic: epi,
    score: maxScore,
    fingerprint: fp,
    confidence: conf,
    consensus: cons,
    uncertainty,
    provenance,
    provenanceAnalysis: prov,
    reasons: allReasons,
    riskLevel,
  };
  result.explain = { human: humanExplanation(result, input || ""), machine: machineExplanation(result) };

  const normalizedFindings = results.flatMap(r =>
    (r.rawFindings || []).map(f => ({
      reasons: [f.message || f.rule || JSON.stringify(f)],
      score: f.score ?? result.score ?? 50,
      verdict: f.severity === 'critical' || f.severity === 'high'
        ? 'BLOCK'
        : f.severity === 'medium'
          ? 'WARN'
          : 'ALLOW',
      file: f.location || 'unknown',
      rule: f.rule || null,
      rule_id: f.rule || null,
      line_number: f.line || null,
      matched_pattern: f.snippet || f.message || null,
      evidence_snippet: f.snippet || f.message || null,
    }))
  );
  if (normalizedFindings.length > 0) {
    result.findings = normalizedFindings;
  } else if (result.score >= 60) {
    result.findings = [{
      reasons: allReasons.length > 0 ? allReasons : ['Suspicious pattern detected'],
      score: result.score,
      verdict: finalVerdict,
      file: 'input',
      rule: null,
    }];
  }

  const enriched = enrichAdjudication(result);
  if (enriched) {
    pushContext({ verdict: finalVerdict, epistemic: epi, riskLevel });
    if (finalVerdict === "BLOCK" || epi === "CONFLICTED") {
      preserveCritical({
        verdict: finalVerdict,
        semantic_reason: enriched.semantic?.semantic_reason || "",
        root_cause: enriched.semantic?.root_cause || "",
        fingerprint: fp,
      });
    }
    if (shouldEscalate(enriched.semantic, enriched)) {
      escalate(enriched.semantic, enriched, { input_length: (input || "").length, engine_count: results.length });
    }
    return enriched;
  }

  return result;
}

const MAX_SCAN_INPUT = 500 * 1024;

// In-process local rules engine — replaces the previous network call to `${MCP_API}/query`.
// Uses the bot's own detectors so the "local-mcp" adjudication source always resolves
// (previously it always errored with "MCP engine not reachable").
function localEvaluate(code) {
  try {
    if (isDangerousCommand(code)) {
      return {
        verdict: "BLOCK",
        score: 90,
        severity: ["critical"],
        reasons: ["Local rules: destructive / shell-execution pattern detected"],
        ruleIds: ["R01.DESTRUCTIVE_SHELL"],
        rawFindings: [],
      };
    }
    const criticalSecrets = scanForSecrets(code).filter(s => s.severity === "critical");
    if (criticalSecrets.length > 0) {
      return {
        verdict: "BLOCK",
        score: 90,
        severity: ["critical"],
        reasons: [`Local rules: hardcoded credential(s) detected (${criticalSecrets.slice(0, 3).map(s => s.rule).join(", ")})`],
        ruleIds: criticalSecrets.slice(0, 3).map(s => s.rule),
        rawFindings: criticalSecrets.map(s => ({ rule: s.rule, severity: s.severity, message: s.message, snippet: s.snippet, line: s.line })),
      };
    }
    return {
      verdict: "ALLOW",
      score: 0,
      severity: ["info"],
      reasons: ["Local rules: no threat patterns detected"],
      ruleIds: [],
      rawFindings: [],
    };
  } catch (err) {
    logger.warn({ err }, "localEvaluate: local rule evaluation failed");
    return { verdict: "ERROR", score: 0, severity: ["info"], reasons: ["Local rules engine error"], ruleIds: [], rawFindings: [] };
  }
}

async function scanWithMcp(code) {
  if (code && typeof code === 'string' && code.length > MAX_SCAN_INPUT) {
    logger.warn({ length: code.length, max: MAX_SCAN_INPUT }, "Truncating oversized scan input to prevent ReDoS");
    code = code.slice(0, MAX_SCAN_INPUT);
  }

  const results = [];
  const authHeaders = {};
  if (INTERNAL_API_KEY) authHeaders["X-Internal-Key"] = INTERNAL_API_KEY;
  if (MCP_AUTH_TOKEN) {
    authHeaders["Authorization"] = `Bearer ${MCP_AUTH_TOKEN}`;
    authHeaders["X-API-Key"] = MCP_AUTH_TOKEN;
  }

  if (!code || code.trim().length < 3) {
    return {
      verdict: "ALLOW",
      epistemic: "INSUFFICIENT_CONTEXT",
      score: 0,
      confidence: { level: "low", label: "Input too short for meaningful analysis" },
      consensus: "no_data",
      uncertainty: { source: "input", detail: "Insufficient context to evaluate risk" },
      provenance: [],
      provenanceAnalysis: { decisiveEngine: null, decisiveRule: null, signalWeights: {}, decisionType: "insufficient_context" },
      reasons: ["Input too short — insufficient context for risk evaluation"],
      riskLevel: "info",
      semantic: {
        decision: "ALLOW",
        semantic_reason: "Input too short for confidence — allowed by default",
        root_cause: "Input was too short for meaningful analysis — less than 3 characters",
        recovery_suggestion: "Provide longer input for meaningful analysis. Minimum 3 characters required.",
        epistemic_state: "INSUFFICIENT_CONTEXT",
        risk_level: "info",
      },
    };
  }

  {
    const local = localEvaluate(code);
    results.push({ _source: "local-mcp", ...local });
  }

  let engineMeta = null;
  try {
    const headers = { "Content-Type": "application/json" };
    if (SENTINEL_API_KEY) headers["X-API-Key"] = SENTINEL_API_KEY;
    const res = await axios.post(`${SENTINEL_API}/scan`, { command: code }, { timeout: 5000, headers });
    const d = res.data;
    if (d && d.verdict) {
      engineMeta = {
        engineVersion: d.engineVersion || null,
        rulePackVersion: d.rulePackVersion || null,
        totalRules: Number.isFinite(d.totalRules) ? d.totalRules : null,
      };
      results.push({
        _source: "cloud-sentinel",
        verdict: d.verdict,
        score: d.score ?? 0,
        reasons: Array.isArray(d.reasons) && d.reasons.length ? d.reasons : ["Sentinel: no threats"],
      });
    }
  } catch (e) {
    logger.warn({ err: e }, "Sentinel scan failed");
  }

  const result = adjudicate(results, code);
  if (engineMeta) result.engine = engineMeta;

  return result;
}

async function scanDeps(manifest) {
  if (!MCP_CONFIGURED) throw new Error("MCP engine not configured (set MCP_API)");
  const res = await axios.post(`${MCP_API}/scan-dependencies`, { manifest }, { timeout: 8000 });
  const data = res.data;
  const r = data?.result || {};
  const riskScore = r.riskScore || 0;
  return {
    verdict: riskScore >= 10 ? "BLOCK" : riskScore > 0 ? "WARN" : "ALLOW",
    score: Math.min(riskScore, 100),
    totalDependencies: r.totalDependencies || 0,
    findings: Array.isArray(r.vulnerabilities) && r.vulnerabilities.length
      ? r.vulnerabilities.map(v =>
          `${v.severity?.toUpperCase()}: ${v.package}@${v.version} — ${v.advisory}`
        )
      : ["No dependency risks detected"],
  };
}

async function scanCi(content) {
  if (!MCP_CONFIGURED) throw new Error("MCP engine not configured (set MCP_API)");
  const res = await axios.post(`${MCP_API}/query`, { query: content, session_id: `ci-${Date.now()}` }, { timeout: 8000 });
  return res.data;
}

// ── Live engine metadata (single source of truth for /status, /dashboard) ──
let _engineInfoCache = { at: 0, data: null };
async function getEngineInfo(maxAgeMs = 5 * 60 * 1000) {
  const now = Date.now();
  if (_engineInfoCache.data && (now - _engineInfoCache.at) < maxAgeMs) return _engineInfoCache.data;
  try {
    const headers = {};
    if (SENTINEL_API_KEY) headers["X-API-Key"] = SENTINEL_API_KEY;
    const res = await axios.get(`${SENTINEL_API}/engines`, { timeout: 5000, headers });
    const d = res.data;
    if (d && Array.isArray(d.engines)) {
      _engineInfoCache = { at: now, data: d };
      return d;
    }
  } catch (e) {
    logger.warn({ err: e }, "getEngineInfo failed — using cached/fallback engine metadata");
  }
  return _engineInfoCache.data || null;
}

module.exports = { scanWithMcp, scanDeps, scanCi, getEngineInfo, MCP_API, MCP_CONFIGURED, SENTINEL_API };
