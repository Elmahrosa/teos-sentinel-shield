const router = require('express').Router();
const { loadEvents } = require('../../services/cache');
const { RULES } = require('../../engine/scanner');

router.get('/stats', async (req, res) => {
  const events = await loadEvents();
  const total = events.length;
  const blocked = events.filter(e => e.verdict?.toLowerCase() === 'block').length;
  const warned = events.filter(e => e.verdict?.toLowerCase() === 'warn').length;
  const allowed = events.filter(e => e.verdict?.toLowerCase() === 'allow').length;
  const blockRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0';

  const ruleCounts = {};
  events.forEach(e => {
    if (e.ruleId) ruleCounts[e.ruleId] = (ruleCounts[e.ruleId] || 0) + 1;
  });
  const topRules = Object.entries(ruleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  res.json({
    total,
    blocked,
    warned,
    allowed,
    blockRate,
    topRules,
    rulesActive: RULES.length,
    generated: new Date().toISOString(),
  });
});

module.exports = router;