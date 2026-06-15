const live   = require('./live');
const ready  = require('./ready');
const health = require('./health');
const root   = require('./root');
const scan   = require('./scan');
const stats  = require('./stats');
const events = require('./events');

function mountRoutes(app) {
  app.use(live);
  app.use(ready);
  app.use(health);
  app.use(root);
  app.use(scan);
  app.use(stats);
  app.use(events);
}

module.exports = { mountRoutes };