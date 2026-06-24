const router = require('express').Router();
const { RULES } = require('../../engine/scanner');

router.get('/', (req, res) => {
  res.json({
    service: 'TEOS Sentinel Shield',
    version: 'v4.0',
    engine: 'deterministic',
    rules: RULES.length,
    endpoints: ['/scan', '/stats', '/health', '/live', '/ready'],
    auth: 'X-API-Key header required',
  });
});

module.exports = router;