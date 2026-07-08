const router = require('express').Router();
const crypto = require('crypto');
const { executeEngine, getEngineInfo } = require('../../engines/index');
const { saveEvent } = require('../../services/cache');

// In-memory audit store for replay (shared with rules route)
const auditStore = global.__auditStore || new Map();
global.__auditStore = auditStore;

function storeAuditRecord(auditId, record) {
  if (auditStore.size > 10000) {
    const oldest = auditStore.keys().next().value;
    if (oldest) auditStore.delete(oldest);
  }
  auditStore.set(auditId, { ...record, _stored: Date.now() });
}

const ENGINE_MAP = {
  'banking': 'banking',
  'solana': 'solana',
  'evm': 'evm',
  'deps': 'dependency',
  'dependency': 'dependency',
  'ci': 'ci',
  'solanatoken': 'tokenIntel',
  'token-intelligence': 'tokenIntel',
  'diligence': 'dueDiligence',
  'due-diligence': 'dueDiligence',
  'fullreport': 'fullreport',
};

router.post('/scan/:engine', async (req, res) => {
  const engineName = req.params.engine?.toLowerCase();
  const mapped = ENGINE_MAP[engineName] || engineName;
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'invalid_request', message: 'JSON body required' });
  }

  const input = (body.command || body.code || body.cmd || body.manifest || body.text || '').toString();
  if (!input.trim()) {
    return res.status(400).json({ error: 'missing_input', message: 'Provide command, code, or text field' });
  }

  const result = executeEngine(mapped, input, { skipCredit: true });
  result.reqId = req.id;
  result.tier = req.apiTier;

  const commandHash = crypto.createHash('sha3-256').update(input).digest('hex');

  // Store audit record for replay verification
  if (result.auditId) {
    storeAuditRecord(result.auditId, { ...result, input, commandHash, engine: mapped });
  }

  await saveEvent({ id: Date.now(), ...result, commandHash, engine: mapped });

  res.json(result);
});

router.get('/engines', (req, res) => {
  res.json({ engines: getEngineInfo() });
});

router.post('/fullreport', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'invalid_request', message: 'JSON body required' });
  }

  const input = (body.command || body.code || body.address || '').toString();
  if (!input.trim()) {
    return res.status(400).json({ error: 'missing_input' });
  }

  const ddResult = executeEngine('dueDiligence', input, { skipCredit: true });
  const tiResult = executeEngine('tokenIntel', input, { skipCredit: true });

  const combined = {
    verdict: ddResult.score > tiResult.score ? ddResult.verdict : tiResult.verdict,
    score: Math.max(ddResult.score, tiResult.score),
    severity: ddResult.score > tiResult.score ? ddResult.severity : tiResult.severity,
    findings: [...(ddResult.findings || []), ...(tiResult.findings || [])],
    reasons: [...(ddResult.reasons || []), ...(tiResult.reasons || [])],
    engine: 'fullreport',
    dueDiligence: ddResult,
    tokenIntelligence: tiResult,
    reqId: req.id,
    timestamp: new Date().toISOString(),
  };

  res.json(combined);
});

module.exports = router;
