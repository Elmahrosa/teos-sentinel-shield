const router = require('express').Router();
const crypto = require('crypto');
const { executeEngine } = require('../../engines/index');
const { saveEvent } = require('../../services/cache');

router.post('/scan', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'invalid_request', message: 'JSON body required' });
  }

  const input = (body.command || body.cmd || '').toString();
  const type = (body.type || 'shell').toString().slice(0, 32);

  if (!input.trim()) {
    return res.status(400).json({
      error: 'missing_command',
      message: 'Provide a "command" or "cmd" field in the request body',
    });
  }

  const newResult = executeEngine('core', input);

  const result = {
    verdict: newResult.verdict,
    score: newResult.score,
    ruleId: newResult.highestRule,
    rule: newResult.highestRule,
    severity: newResult.findings[0]?.severity || 'unknown',
    reasons: newResult.findings.flatMap(f => f.reasons),
    command: input.trim(),
    type,
    reqId: req.id,
    tier: req.apiTier,
    auditId: newResult.auditId,
    engineVersion: newResult.engineVersion,
  };

  const commandHash = crypto.createHash('sha3-256').update(result.command).digest('hex');
  await saveEvent({ id: Date.now(), ...result, commandHash });

  res.json(result);
});

module.exports = router;