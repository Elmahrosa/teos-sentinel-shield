const router = require('express').Router();
const { loadEvents, saveEvent } = require('../../services/cache');

router.get('/events', async (req, res) => {
  const events = await loadEvents();
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  res.json({
    total: events.length,
    limit,
    events: events.slice(0, limit).map(e => ({
      id: e.id, verdict: e.verdict, score: e.score,
      rule: e.rule, ruleId: e.ruleId, severity: e.severity,
      command: e.command, timestamp: e.timestamp,
    })),
    generated: new Date().toISOString(),
  });
});

router.post('/ingest', async (req, res) => {
  const { verdict, score, reasons, ruleIds, riskLevel, command, source } = req.body || {};
  if (!verdict) {
    return res.status(400).json({ error: 'missing_verdict', message: 'Provide a verdict' });
  }
  const event = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    verdict: String(verdict).toLowerCase(),
    score: score ?? 0,
    reasons: Array.isArray(reasons) ? reasons : [],
    ruleIds: Array.isArray(ruleIds) ? ruleIds : [],
    riskLevel: riskLevel || 'info',
    command: command || '',
    source: source || 'bot',
  };
  await saveEvent(event);
  res.json({ status: 'ok', event });
});

module.exports = router;
