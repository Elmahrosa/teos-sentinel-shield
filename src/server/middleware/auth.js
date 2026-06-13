const { log } = require('../../services/logger');
const { redis } = require('../../services/cache');

const VALID_KEYS = process.env.TEOS_API_KEYS
  ? process.env.TEOS_API_KEYS.split(',').map(k => k.trim())
  : [];

const KEY_TIER_MAP = {};
VALID_KEYS.forEach(k => {
  if (k.includes('-founder')) KEY_TIER_MAP[k] = 'founder';
  else if (k.includes('-enterprise')) KEY_TIER_MAP[k] = 'enterprise';
  else if (k.includes('-pro')) KEY_TIER_MAP[k] = 'pro';
  else if (k.includes('-starter')) KEY_TIER_MAP[k] = 'starter';
  else KEY_TIER_MAP[k] = 'free';
});

async function resolveKeyTier(apiKey) {
  if (KEY_TIER_MAP[apiKey]) return KEY_TIER_MAP[apiKey];
  if (redis) {
    try {
      const API_KEY_PREFIX = 'teos:apikey:';
      const tier = await redis.get(`${API_KEY_PREFIX}${apiKey}`);
      const TIERS = { free: {}, starter: {}, team: {}, enterprise: {}, sovereign: {}, founder: {} };
      if (tier && TIERS[tier]) return tier;
    } catch (err) {
      console.warn('Redis key lookup failed:', err.message);
    }
  }
  return null;
}

function apiKeyAuth(req, res, next) {
  const publicPaths = ['/stats', '/health', '/live', '/ready', '/'];
  if (publicPaths.includes(req.path)) return next();

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({
      error: 'missing_api_key',
      message: 'Provide X-API-Key header.',
    });
  }

  resolveKeyTier(apiKey).then(tier => {
    if (!tier) {
      return res.status(403).json({
        error: 'invalid_api_key',
        message: 'API key not recognized',
      });
    }
    req.apiKey = apiKey;
    req.apiTier = tier;
    next();
  });
}

module.exports = { apiKeyAuth };