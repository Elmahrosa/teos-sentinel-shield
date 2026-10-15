const crypto = require('crypto');
const { safeReplace } = require('../security/safe-regex');

const ENGINE_VERSION = "4.0.0";
const POLICY_VERSION = "1.0.0";

let ruleHashes = {};

function setRuleHashes(registry) {
  ruleHashes = {};
  for (const [id, rule] of Object.entries(registry)) {
    ruleHashes[id] = crypto.createHash('sha3-256').update(JSON.stringify(rule)).digest('hex').slice(0, 12);
  }
}

function normalizeInput(input) {
  return safeReplace(/\s+/g, ' ', safeReplace(/\r\n/g, '\n', input.trim())).toLowerCase();
}

function build(input, results) {
  const normalized = normalizeInput(input);
  const engineVersions = results.map(r => `${r._source}:${ENGINE_VERSION}`).sort().join('|');
  const ruleHashChain = Object.values(ruleHashes).sort().join('');
  const sources = results.map(r => `${r._source}:${r.verdict}:${r.score}`).sort().join('|');

  const hash = crypto.createHash('sha3-256')
    .update(normalized)
    .update(engineVersions)
    .update(POLICY_VERSION)
    .update(ruleHashChain)
    .update(sources)
    .digest('hex');

  return {
    fingerprint: hash,
    engineVersions: engineVersions || "none",
    policyVersion: POLICY_VERSION,
    ruleHashCount: Object.keys(ruleHashes).length,
    inputHash: crypto.createHash('sha3-256').update(normalized).digest('hex').slice(0, 16),
  };
}

module.exports = { build, setRuleHashes, normalizeInput, ENGINE_VERSION, POLICY_VERSION };
