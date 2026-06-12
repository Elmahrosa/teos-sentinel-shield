const LOG_LEVELS = { fatal: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function log(level, msg, meta = {}) {
  if ((LOG_LEVELS[level] ?? 0) > CURRENT_LOG_LEVEL) return;
  const entry = {
    ts: new Date().toISOString(),
    level, msg,
    env: process.env.NODE_ENV || 'development',
    pid: process.pid,
    ...meta,
  };
  if (level === 'error' || level === 'fatal') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

module.exports = { log, LOG_LEVELS };