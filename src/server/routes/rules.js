const router = require('express').Router();
const { getRuleRegistry } = require('../../../lib/ruleRegistry');

// In-memory audit store reference (shared with engines route)
const auditStore = global.__auditStore || new Map();
if (!global.__auditStore) {
  global.__auditStore = auditStore;
}

router.get('/rules', (req, res) => {
  const registry = getRuleRegistry();
  const sanitized = {};

  for (const [key, val] of Object.entries(registry.engines)) {
    sanitized[key] = {
      id: val.id,
      name: val.name,
      ruleCount: val.count,
      rules: val.rules.map(r => ({
        id: r.id,
        name: r.name,
        severity: r.sev || r.severity,
        score: r.score,
        status: 'active',
      })),
    };
  }

  res.json({
    version: '1.0',
    totalEngines: registry.totalEngines,
    totalRules: registry.totalRules,
    engines: sanitized,
  });
});

// Replay verification
router.get('/audit/:auditId', (req, res) => {
  const record = auditStore.get(req.params.auditId);
  if (!record) {
    return res.status(404).json({ error: 'audit_not_found', message: 'No audit record for this ID' });
  }
  res.json(record);
});

module.exports = router;
