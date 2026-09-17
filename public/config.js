/**
 * TEOS Sentinel Shield v5.0.0 — public site config
 * Host-agnostic: served from BOTH sentinel.teosegypt.com (Hostinger static,
 * /scan /stats /events /health /api/* proxied by proxy.php) and the Railway
 * domain (real backend, no proxy). Same-origin API calls work on both.
 * Never put SUPABASE_SERVICE_ROLE or TEOS server secrets here.
 */
(function (global) {
  var SITE = 'https://sentinel.teosegypt.com';

  // Railway backend (real execution engine)
  var RAILWAY_WS = 'wss://teos-sentinel-shield-production-7f0d.up.railway.app';

  var hasLocation = typeof global.location !== 'undefined' && global.location;
  var HOST  = hasLocation ? global.location.host : 'sentinel.teosegypt.com';
  var PROTO = hasLocation ? global.location.protocol : 'https:';

  // On Hostinger the REST API is same-origin via proxy.php; WebSocket cannot
  // run on shared hosting, so the live feed points straight at Railway.
  var ON_HOSTINGER = HOST === 'sentinel.teosegypt.com';

  var apiBase = PROTO + '//' + HOST;
  var wsUrl   = ON_HOSTINGER ? RAILWAY_WS : apiBase.replace(/^http/, 'ws');

  global.TEOS_CONFIG = {
    version: '5.0.0',
    siteUrl: SITE,
    apiBase: apiBase,
    wsUrl: wsUrl,
    rulesCount: 258,
    demoApiKey: '',
  };

  global.TEOS_API_BASE = global.TEOS_CONFIG.apiBase;
  global.TEOS_WS_URL = global.TEOS_CONFIG.wsUrl;
})(typeof window !== 'undefined' ? window : globalThis);