# Security Audit — teos-activation-service

## Scan Date
2026-05-25

## Results
- Dependencies scanned: 139
- Vulnerabilities found: 0
- Critical: 0
- High: 0
- Medium: 0
- Low: 0

## Action Taken
- npm audit run with --audit-level=moderate — clean
- express-rate-limit installed and configured (100 req/15min per IP, skip health checks)
- Helmet upgraded from bare `helmet()` to full configuration with CSP, HSTS, frameguard, noSniff, xssFilter
- CORS changed from permissive `cors()` to strict allowlist via ALLOWED_ORIGINS
- Request body size limit added (10kb, configurable via REQUEST_SIZE_LIMIT)
- URL-encoded body parsing limited to 10kb
- Trust proxy setting made configurable via TRUST_PROXY env var

## Unfixable Issues
None

## Next Review
2026-06-24
