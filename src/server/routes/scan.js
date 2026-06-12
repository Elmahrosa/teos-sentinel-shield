const router = require('express').Router();
const crypto = require('crypto');
const { runEngine } = require('../../engine/scanner');
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

  const result = runEngine(input);
  result.type = type;
  result.reqId = req.id;
  result.tier = req.apiTier;

  const commandHash = crypto.createHash('sha3-256').update(input).digest('hex');
  await saveEvent({ id: Date.now(), ...result, commandHash });

  res.json(result);
});

module.exports = router;