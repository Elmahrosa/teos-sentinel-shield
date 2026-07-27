/**
 * TEOS Sentinel Shield v4.0.0 GA — public site config
 * Hostinger: edit apiBase after Railway deploy / custom domain attach.
 * Never put SUPABASE_SERVICE_ROLE or TEOS server secrets here.
 */
(function (global) {
  var SITE = 'https://sentinel.teosegypt.com';

  // Railway API backend (agent-code-risk-mcp)
  var RAILWAY_API = 'https://agent-code-risk-mcp-production-b97d.up.railway.app';

  global.TEOS_CONFIG = {
    version: '4.0.0',
    siteUrl: SITE,
    apiBase: RAILWAY_API,
    wsUrl: RAILWAY_API.replace(/^http/, 'ws'),
    rulesCount: 31,
    demoApiKey: '',
  };

  global.TEOS_API_BASE = global.TEOS_CONFIG.apiBase;
  global.TEOS_WS_URL = global.TEOS_CONFIG.wsUrl;
})(typeof window !== 'undefined' ? window : globalThis);
