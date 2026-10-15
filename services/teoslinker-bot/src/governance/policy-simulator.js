const crypto = require('crypto');
const { getRule } = require('../rules/registry');

const SIMULATION_MODE = process.env.POLICY_SIMULATION_MODE === "true" || false;

let alternatePolicies = {};

function registerAlternatePolicy(name, config) {
  alternatePolicies[name] = config;
}

async function simulate(input, results, policyOverrides = {}) {
  const verdicts = { BLOCK: 3, WARN: 2, ALLOW: 1, ERROR: 0 };
  const strictest = results.reduce((a, b) => {
    const aOrd = verdicts[a.verdict] || 0;
    const bOrd = verdicts[b.verdict] || 0;
    if (aOrd !== bOrd) return aOrd > bOrd ? a : b;
    return (a.score || 0) >= (b.score || 0) ? a : b;
  });

  const maxScore = Math.max(...results.map(r => r.score));
  const confOverride = policyOverrides.minConfidence;
  const consensusOverride = policyOverrides.minConsensus;
  const downgradeOverride = policyOverrides.downgradeLowConfidence;

  let verdict = strictest.verdict;
  let downgraded = false;

  if (downgradeOverride !== false && verdict === "BLOCK") {
    if (confOverride && maxScore < confOverride * 100) {
      verdict = "WARN";
      downgraded = true;
    }
  }

  const simId = crypto.createHash('sha256')
    .update(input)
    .update(JSON.stringify(policyOverrides))
    .update(JSON.stringify(results.map(r => r.verdict + r.score)))
    .digest('hex')
    .slice(0, 16);

  return {
    simulationId: simId,
    appliedPolicy: policyOverrides,
    verdict,
    score: maxScore,
    downgraded,
    resultCount: results.length,
    differs: verdict !== strictest.verdict,
  };
}

async function replayHistorical(historicalResults, policyOverrides) {
  const outcomes = [];
  for (const entry of historicalResults) {
    const sim = await simulate(entry.input, entry.results, policyOverrides);
    outcomes.push({
      original: entry,
      simulated: sim,
      changed: entry.verdict !== sim.verdict,
    });
  }
  return {
    total: outcomes.length,
    changed: outcomes.filter(o => o.changed).length,
    outcomes,
  };
}

function isSimulationEnabled() {
  return SIMULATION_MODE || process.env.NODE_ENV !== "production";
}

module.exports = { simulate, replayHistorical, registerAlternatePolicy, isSimulationEnabled };
