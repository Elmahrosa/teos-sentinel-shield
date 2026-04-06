# Penetration Test Checklist

This checklist is designed for Safe Ingestion Engine before public launch.

## Scope
- FastAPI gateway (`api/server.py`)
- Ingestion submission (`POST /v1/ingest_async`)
- Job polling (`GET /v1/jobs/{job_id}`)
- Billing bridge (`POST /internal/register-key`)
- Metrics and health endpoints
- Redis-backed API key store
- Celery worker ingestion path

## SSRF payloads
1. `http://127.0.0.1/`
2. `http://127.1/`
3. `http://0.0.0.0/`
4. `http://169.254.169.254/latest/meta-data/`
5. `http://[::1]/`
6. `http://[::ffff:127.0.0.1]/`
7. `http://localhost/`
8. `http://127-0-0-1.nip.io/`
9. `http://127.0.0.1.xip.io/`
10. `https://bit.ly/<redirect-to-private-target>`
11. `javascript:alert(1)`
12. `file:///etc/passwd`
13. `gopher://127.0.0.1:6379/_PING`
14. Decimal/hex IP forms if parser accepts them.

Expected result: reject before fetch, zero credits deducted, security event logged.

## Auth tests
1. Missing `X-API-Key` => 401.
2. Invalid key => 401.
3. Expired/zero-credit key => 402 or equivalent business error.
4. Different valid key polling another key's job => 404.
5. Register-key with wrong webhook secret => 403.
6. Register-key endpoint absent from `/docs`.

## Job isolation tests
1. Submit same URL twice with different keys and confirm job ownership isolation.
2. Poll random UUID4 values and confirm 404 without timing leak.
3. Verify job records expire or are cleaned on schedule.

## PII tests
1. Standard email, phone, SSN, IPv4, credit card.
2. Obfuscated values:
   - `john[at]gmail.com`
   - `+1 (555) 555-1212`
   - `4111 1111 1111 1111`
   - homoglyph/unicode email
3. Large input > 1MB if scrubber has a size guard.

Expected result: safe patterns scrubbed, evasions documented if unsupported.

## Rate limiting and abuse tests
1. Burst `POST /v1/ingest_async` above configured threshold.
2. Burst `GET /v1/jobs/{job_id}`.
3. Confirm `/internal/register-key` has independent rate limiting.

## Metrics and health tests
1. `/health` returns expected status and version.
2. `/metrics` does not leak secrets, URLs, or full user identifiers.
3. Restrict metrics if exposed on public internet.

## Operational tests
1. `pytest`
2. `bandit -r .`
3. `pip-audit`
4. Smoke test script
5. Redis unavailable => API fails safely
6. Worker unavailable => queued jobs stay queued, API still responds

## Exit criteria
- No successful SSRF to private or metadata addresses
- No cross-tenant job access
- No webhook secret bypass
- No secrets or raw PII in logs
- No critical/high findings from automated scans without mitigation
