const { runCoreEngine } = require('./core');
const { runBankingEngine } = require('./banking');
const { runSolanaEngine } = require('./solana');
const { runEvmEngine } = require('./evm');
const { runDependencyEngine } = require('./dependency');
const { runCiEngine } = require('./ci');
const { runTokenIntelligenceEngine } = require('./token-intelligence');
const { runDueDiligenceEngine } = require('./due-diligence');

const crypto = require('crypto');

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
    };
  }

  const auditId = generateAuditId();
  const result = engine.run(input, options);
  return {
    ...result,
    engine: engine.name,
    auditId,
    timestamp: result.timestamp || new Date().toISOString(),
    creditCost: options.skipCredit ? 0 : engine.creditCost,
  };
}

function getEngineInfo() {
  const info = {};
  for (const [key, val] of Object.entries(ENGINE_REGISTRY)) {
    info[key] = { name: val.name, creditCost: val.creditCost };
  }
  return info;
}

module.exports = { executeEngine, getEngineInfo, ENGINE_REGISTRY, generateAuditId };
