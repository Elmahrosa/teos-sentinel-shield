const router = require('express').Router();
const { RULES } = require('../../engine/scanner');

router.get('/', (req, res) => {
  res.json({
    service: 'TEOS Sentinel Shield',
    version: 'v3.0.0',
    engine: 'deterministic',
    rules: RULES.length,
    endpoints: ['/scan', '/stats', '/health', '/live', '/ready'],
    auth: 'X-API-Key header required',
  });
});

module.exports = router;