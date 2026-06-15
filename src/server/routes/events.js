const router = require('express').Router();
const { loadEvents } = require('../../services/cache');

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

module.exports = router;
