# TEOS Sentinel Shield v4.0.0 Acceptance Criteria

## Sprint 1 Gates (18 passing — per your notes)

1. Provider abstraction complete (ILLMProvider/ClaudeProvider/LocalProvider/ProviderRouter)
2. Zero governance logic in ProviderRouter
3. SECURITY.md generated from real codebase
4. POLICY.md generated from real codebase
5. All provider tests passing (unit + integration)
6. WebSocket crash handlers (ws.on('error'), process.on('uncaughtException'), process.on('unhandledRejection'))
7. Heartbeat/keepalive verified under load
8. Railway deployment config intact (railway.toml, Dockerfile)
9. Vercel deployment config intact (vercel.json, 20 routes)
10. Gatekeeper evaluate() returns ALLOW/REFUSE with reasons
11. Secret scan detects all SECRET_PATTERNS
12. Memory redaction strips emails, API keys, webhooks
13. Token budget estimation within 20% of actual
14. CLI (teos.js) runs without errors
15. Dashboard HTML loads without console errors
16. /health endpoint returns version + uptime + memory
17. No hardcoded credentials in source (verified by verify.js)
18. .env.example contains all required vars with safe defaults
