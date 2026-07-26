/**
 * TEOS Sentinel Shield v4.0.0 GA — public site config
 * Hostinger: edit apiBase after Railway deploy / custom domain attach.
 * Never put SUPABASE_SERVICE_ROLE or TEOS server secrets here.
 */
(function (global) {
  var SITE = 'https://sentinel.teosegypt.com';

  // Primary API host. Prefer api subdomain once Railway custom domain is live.
  // Fallback: set RAILWAY_API to your current Railway public URL.
  // Canonical Railway production host (Test 4)
  var RAILWAY_API = 'https://teos-sentinel-shield-production.up.railway.app';
  var API_SUBDOMAIN = 'https://api.sentinel.teosegypt.com';

  // Use subdomain when production DNS is ready; otherwise Railway direct.
  // Flip USE_API_SUBDOMAIN to true after CNAME api.sentinel.teosegypt.com → Railway.
  var USE_API_SUBDOMAIN = false;

  var apiBase = USE_API_SUBDOMAIN ? API_SUBDOMAIN : RAILWAY_API;

  global.TEOS_CONFIG = {
    version: '4.0.0',
    siteUrl: SITE,
    apiBase: apiBase,
    wsUrl: apiBase.replace(/^http/, 'ws'),
    rulesCount: 121,
    // Optional free-tier demo key for public /scan demos only (low RPM). Leave empty to require user key.
    demoApiKey: '',
  };

  global.TEOS_API_BASE = global.TEOS_CONFIG.apiBase;
  global.TEOS_WS_URL = global.TEOS_CONFIG.wsUrl;
})(typeof window !== 'undefined' ? window : globalThis);
