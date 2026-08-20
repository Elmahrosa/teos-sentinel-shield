const { log } = require('../../services/logger');

function errorHandler(err, req, res, next) {
  log('error', 'Unhandled error', { reqId: req.id, error: err.message, stack: err.stack });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'payload_too_large',
      message: `Max ${parseInt(process.env.MAX_PAYLOAD_KB) || 64}KB`,
    });
  }
  if (err.status === 400) {
    return res.status(400).json({ error: 'bad_request', message: 'Invalid request' });
  }

  res.status(500).json({ error: 'internal_error', reqId: req.id });
}

module.exports = { errorHandler };