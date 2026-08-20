const { runCoreEngine } = require('./core');
const { runBankingEngine } = require('./banking');
const { runSolanaEngine } = require('./solana');
const { runEvmEngine } = require('./evm');
const { runDependencyEngine } = require('./dependency');
const { runCiEngine } = require('./ci');
const { runTokenIntelligenceEngine } = require('./token-intelligence');
const { runDueDiligenceEngine } = require('./due-diligence');

const crypto = require('crypto');
const { normalizeInput } = require('../../lib/normalizeInput');
const { version: ENGINE_VERSION } = require('../../package.json');

const RULE_PACK_VERSION = 'rules-258';
const POLICY_VERSION = 'policy-1.0';

function generateAuditId() {
  return 'TOS-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

const ENGINE_REGISTRY = {
  core:         { name: 'Core Security Engine',    run: runCoreEngine,         creditCost: 1 },
  banking:      { name: 'Banking Compliance Engine', run: runBankingEngine,    creditCost: 1 },
  solana:       { name: 'Solana Security Engine',    run: runSolanaEngine,     creditCost: 1 },
  evm:          { name: 'EVM Security Engine',       run: runEvmEngine,        creditCost: 1 },
  dependency:   { name: 'Dependency Engine',         run: runDependencyEngine, creditCost: 1 },
  ci:           { name: 'CI/CD Pipeline Engine',     run: runCiEngine,         creditCost: 1 },
  tokenIntel:   { name: 'Token Intelligence Engine', run: runTokenIntelligenceEngine, creditCost: 5 },
  dueDiligence: { name: 'Due Diligence Engine',      run: runDueDiligenceEngine,      creditCost: 15 },
};

function executeEngine(engineName, input, options = {}) {
  const engine = ENGINE_REGISTRY[engineName];
  if (!engine) {
    return {
      verdict: 'ERROR', score: 0, auditId: generateAuditId(),
      error: `Unknown engine: ${engineName}`,
      timestamp: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
      rulePackVersion: RULE_PACK_VERSION,
      policyVersion: POLICY_VERSION,
    };
  }

  const auditId = generateAuditId();
  const normalized = normalizeInput(input);
  const result = engine.run(normalized, options);

  // Find highest-scoring rule from findings
  let highestRule = null;
  let highestRuleScore = 0;
  if (result.findings && result.findings.length > 0) {
    for (const f of result.findings) {
      if (f.score > highestRuleScore) {
        highestRuleScore = f.score;
        highestRule = f.ruleId;
      }
    }
  }

  return {
    ...result,
    engine: engine.name,
    auditId,
    timestamp: result.timestamp || new Date().toISOString(),
    creditCost: options.skipCredit ? 0 : engine.creditCost,
    engineVersion: ENGINE_VERSION,
    rulePackVersion: RULE_PACK_VERSION,
    policyVersion: POLICY_VERSION,
    ...(highestRule ? { highestRule, highestRuleScore } : {}),
  };
}

function getEngineInfo() {
  const { getEngineCounts } = require('../../lib/ruleRegistry');
  const counts = getEngineCounts();
  const info = {};
  for (const [key, val] of Object.entries(ENGINE_REGISTRY)) {
    info[key] = { name: val.name, creditCost: val.creditCost, count: counts[key] || 0 };
  }
  return info;
}

module.exports = { executeEngine, getEngineInfo, ENGINE_REGISTRY, generateAuditId };
