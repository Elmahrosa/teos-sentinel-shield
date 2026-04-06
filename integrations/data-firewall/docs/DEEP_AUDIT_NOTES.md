# Deep Audit Notes

## What is verified from the public repository
- Public GitHub repository with commit history, issue/pull/security tabs visible.
- Documented single FastAPI entrypoint in `api/server.py`.
- Documented endpoints: `/v1/ingest`, `/v1/jobs/{job_id}`, `/health`, `/metrics`, `/v1/status`, `/internal/register-key`.
- Documented Redis-backed API key store and job queue design.
- Documented claim that API keys do not travel in Celery payloads.

## What still requires runtime confirmation
- SSRF redirect handling on every hop.
- PII scrubber coverage for obfuscation and unicode evasions.
- Billing bridge end-to-end behavior under bad secrets and depleted credits.
- Metrics exposure and operational hardening in production deployment.

## Important correction
Python 3.14 incompatibility is not a confirmed blocker for every current revision.
At least some dependency sets install successfully under Python 3.14 on Windows, so pinning to 3.12 is still prudent for production consistency, but should be described as a compatibility recommendation rather than a proven universal failure.
