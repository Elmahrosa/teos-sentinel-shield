const immutable = require('../audit/immutable-log');

module.exports = { append: immutable.append, verifyChain: immutable.verifyChain, recent: immutable.recent, AUDIT_FILE: immutable.AUDIT_FILE };
