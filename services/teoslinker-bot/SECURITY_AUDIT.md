# Security Audit — teoslinker-bot

## Scan Date
2026-05-25

## Results
- Dependencies scanned: 137
- Vulnerabilities found: 0
- Critical: 0
- High: 0
- Medium: 0
- Low: 0

## Action Taken
- npm audit run with --audit-level=moderate — clean
- Helmet installed and configured with CSP, HSTS, frameguard, noSniff, xssFilter
- Rate limiting installed and configured (100 req/15min per IP)
- CORS added with strict allowlist via ALLOWED_ORIGINS env var
- Request body size limit added (10kb, configurable via REQUEST_SIZE_LIMIT)
- URL-encoded body parsing limited to 10kb
- Trust proxy setting made configurable via TRUST_PROXY env var

## Unfixable Issues
None

## Notes
- `.env.broken` file exists in service root with previously-used secrets — ensure this is gitignored (`.env.*` pattern covers it)
- Create a clean `.env.example` from the root `.env.example` [teoslinker-bot] section

## Next Review
2026-06-24
