# Changelog

## [2.1.0] — 2026-03-15

### Added
- `GET /v1/jobs/{job_id}` — async job polling endpoint
- `GET /v1/account` — credits and plan info
- `scripts/gas_billing_bridge.js` — GAS billing bridge for USDC payment → API key
- `frontend/` — Next.js 15 dashboard (Ingest, Jobs, Audit, Metrics)
- `docs/X402_INTEGRATION.md` — x402 per-request payment guide
- `mcp_server.py` — MCP server for Claude/Cursor/Windsurf
- Docker healthchecks for Redis and API

### Fixed
- API key validation reads from Redis (dynamic) not `.env` (static)
- Credit deduction race condition fixed with Redis WATCH/MULTI/EXEC
- `GAS_WEBHOOK_SECRET` added to `.env.example`

### Security
- SSRF guard upgraded to async DNS via `aiodns` — blocks DNS rebinding
- PII tokens replaced with HMAC-hashed placeholders

## [2.0.0] — 2026-02-28

### Added
- Full async pipeline via Celery + Redis
- Prometheus metrics at `GET /metrics`
- Circuit breaker on HTTP connector
- Idempotency key support
- Structured JSON logging
- Rate limiting via slowapi

## [1.0.0] — 2026-01-15

### Added
- Initial release — sync ingest, PII scrubbing, SSRF blocklist, robots.txt, Docker
