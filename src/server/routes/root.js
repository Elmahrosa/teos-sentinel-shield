const router = require('express').Router();
const { getTotalRuleCount, getVersion, getEngineCounts } = require('../../../lib/ruleRegistry');

router.get('/', (req, res) => {
  res.json({
    service: 'TEOS Sentinel Shield',
    version: getVersion(),
    engine: 'deterministic',
    rules: getTotalRuleCount(),
    engines: getEngineCounts(),
    endpoints: ['/scan', '/scan/:engine', '/engines', '/stats', '/health', '/live', '/ready'],
    auth: 'X-API-Key header required',
  });
});

module.exports = router;