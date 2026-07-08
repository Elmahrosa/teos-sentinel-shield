const { CORE_RULES } = require('../src/engines/core');
const { BANKING_RULES } = require('../src/engines/banking');
const { SOLANA_RULES } = require('../src/engines/solana');
const { EVM_RULES } = require('../src/engines/evm');
const { DEP_RULES } = require('../src/engines/dependency');
const { CI_RULES } = require('../src/engines/ci');
const { TOKEN_INTELLIGENCE_RULES } = require('../src/engines/token-intelligence');
const { DUE_DILIGENCE_RULES } = require('../src/engines/due-diligence');

function getRuleRegistry() {
  return {
    engines: {
      core:         { id: 'core',         name: 'Core Security Engine',    count: CORE_RULES.length,         rules: CORE_RULES },
      banking:      { id: 'banking',      name: 'Banking Compliance Engine', count: BANKING_RULES.length,    rules: BANKING_RULES },
      solana:       { id: 'solana',       name: 'Solana Security Engine',    count: SOLANA_RULES.length,     rules: SOLANA_RULES },
      evm:          { id: 'evm',          name: 'EVM Security Engine',       count: EVM_RULES.length,        rules: EVM_RULES },
      dependency:   { id: 'dependency',   name: 'Dependency Engine',         count: DEP_RULES.length,        rules: DEP_RULES },
      ci:           { id: 'ci',           name: 'CI/CD Pipeline Engine',     count: CI_RULES.length,         rules: CI_RULES },
      tokenIntel:   { id: 'tokenIntel',   name: 'Token Intelligence Engine', count: TOKEN_INTELLIGENCE_RULES.length, rules: TOKEN_INTELLIGENCE_RULES },
      dueDiligence: { id: 'dueDiligence', name: 'Due Diligence Engine',      count: DUE_DILIGENCE_RULES.length,    rules: DUE_DILIGENCE_RULES },
    },
    totalRules: getTotalRuleCount(),
    totalEngines: 8,
  };
}

function getTotalRuleCount() {
  return CORE_RULES.length + BANKING_RULES.length + SOLANA_RULES.length +
    EVM_RULES.length + DEP_RULES.length + CI_RULES.length +
    TOKEN_INTELLIGENCE_RULES.length + DUE_DILIGENCE_RULES.length;
}

function getEngineCounts() {
  const registry = getRuleRegistry();
  const counts = {};
  for (const [key, val] of Object.entries(registry.engines)) {
    counts[key] = val.count;
  }
  counts.total = registry.totalRules;
  return counts;
}

function getVersion() {
  const pkg = require('../package.json');
  return pkg.version;
}

module.exports = { getRuleRegistry, getTotalRuleCount, getEngineCounts, getVersion };
