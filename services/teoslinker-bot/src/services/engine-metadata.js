"use strict";

// Canonical in-process engine metadata.
//
// The live Sentinel (/engines) is authoritative when configured, but the bot must
// never show null or a stray placeholder when it is not. Previously the fallback
// values were duplicated in three places and disagreed:
//   - status.js        -> "5.1.0" / "rules-258" / 258 / 8 engines
//   - report-design.js -> "5.1.0" / 258 / 95 core
//   - health.routes.js -> "4.0" / null / null      <-- the bug
//
// This module is now the single source of truth for the fallback so every surface
// (/status, /health, reports) agrees.

const DEFAULT_ENGINE_VERSION = "5.1.0";
const DEFAULT_RULE_PACK = "rules-258";

// 8 engines, 258 rules total — matches the published rule pack.
const DEFAULT_ENGINES = [
  { key: "core",         rules: 95 },
  { key: "banking",      rules: 32 },
  { key: "solana",       rules: 29 },
  { key: "evm",          rules: 21 },
  { key: "dependency",   rules: 8  },
  { key: "ci",           rules: 23 },
  { key: "tokenIntel",   rules: 25 },
  { key: "dueDiligence", rules: 25 },
];

const DEFAULT_TOTAL_RULES = DEFAULT_ENGINES.reduce((sum, e) => sum + e.rules, 0); // 258

function isPositiveInt(v) {
  return Number.isFinite(v) && v > 0;
}

// Merge live sentinel metadata over the in-process defaults. Never returns nulls:
// any missing field falls back individually instead of all-or-nothing.
function resolveEngineInfo(live) {
  const hasLiveEngines = Array.isArray(live?.engines) && live.engines.length > 0;
  const engines = hasLiveEngines ? live.engines : DEFAULT_ENGINES;
  const summed = engines.reduce((sum, e) => sum + (Number(e?.rules) || 0), 0);
  const core = engines.find((e) => e?.key === "core");

  return {
    engineVersion: live?.engineVersion || DEFAULT_ENGINE_VERSION,
    rulePackVersion: live?.rulePackVersion || DEFAULT_RULE_PACK,
    totalRules: isPositiveInt(live?.totalRules) ? live.totalRules : (summed || DEFAULT_TOTAL_RULES),
    coreRules: isPositiveInt(core?.rules) ? core.rules : (hasLiveEngines ? 0 : 95),
    engines,
    total: isPositiveInt(live?.total) ? live.total : engines.length,
    source: live?.engineVersion ? "live" : "in-process",
  };
}

function defaultEngineInfo() {
  return resolveEngineInfo(null);
}

module.exports = {
  DEFAULT_ENGINE_VERSION,
  DEFAULT_RULE_PACK,
  DEFAULT_ENGINES,
  DEFAULT_TOTAL_RULES,
  resolveEngineInfo,
  defaultEngineInfo,
};
