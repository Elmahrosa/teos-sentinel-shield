const { getRuleCounts } = require('../../version.cjs');

function registerRulesRoutes(app) {
  app.get('/api/rules', (req, res) => {
    const counts = getRuleCounts();
    res.json({
      total: counts.total,
      active: counts.active,
      breakdown: {
        core: counts.core,
        solana: counts.solana,
        evm: counts.evm,
        banking: counts.banking,
        mena: counts.mena,
      },
      display: counts.display,
    });
  });
}

module.exports = { registerRulesRoutes };
