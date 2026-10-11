# Changelog

## v5.2.2 (2026-10-11)

### Changed
- Repointed the remote endpoint from the retired Railway host to the live
  production backend across `src/action.js` (`DEFAULT_API_URL`), `action.yml`
  (`api-url` default), `public/config.js` (`RAILWAY_WS`), and `public/proxy.php`
  (`$BACKEND`); `dist/index.js` rebuilt.

### Added
- `scripts/set-endpoint.js` — repoints every hard-coded backend host in one command.
- Railway deploy config: `railway.json`, `.node-version`, and `engines.node` in
  `package.json`.
- Host-agnostic Docker + Caddy kit (`Dockerfile`, `deploy/`) for free always-on
  VMs (Oracle Cloud Always Free / GCP e2-micro), documented in
  `docs/deploy-free.md`.

## v5.2.1 (2026-10-11)

### Added
- GitHub Action: **local execution mode** — the deterministic engine is bundled
  into `dist/index.js` (via `ncc`) and runs entirely inside the runner with no
  network calls and no data exfiltration (`mode: local`).
- GitHub Action: `engine` input to select a rule pack in local mode
  (`core`, `ci`, `deps`/`dependency`, `banking`, `solana`, `evm`,
  `tokenIntel`, `dueDiligence`). Defaults to `core`.
- GitHub Action: `mode` input — `auto` (default), `local`, or `remote`.
  `auto` runs locally when no `api-key` is supplied and remotely when one is.

### Changed
- `package.json`: license metadata updated from `MIT` to
  `SEE LICENSE IN LICENSE` to match the TEOS Egypt Sovereign License (TESL).
- GitHub Action `api-key` input is no longer required — it is required only in
  remote mode.
- Local mode validates the requested `engine` against `ENGINE_REGISTRY` and
  fails with a clear message on an unknown value.

### Fixed
- Remote mode with a missing `api-key` now fails with an explicit, actionable
  message instead of an ambiguous failure.

## v4.1.0 (2026-07-08)

### Added
- Token-intelligence engine (25 rules) — mint authority, supply manipulation,
  honeypot, liquidity removal, proxy upgrade, blacklist, pause, swap min output
- Due-diligence engine (25 rules) — anonymous team, single-key owner,
  liquidity not locked, freezeAllHolders, fake audit, previous rug pull,
  no audit, no KYC
- 15 new core rules (R96–R110) — SSTI, NoSQL injection, XXE, path traversal,
  insecure randomness, prototype pollution, SSRF, crypto weakness, command
  injection, weak hashing, JWT alg none, race condition, IDOR, supply chain,
  insecure deserialization
- Automated verification script (`scripts/verify.js`) — 55 checks including
  engine registration, rule counts, test pass/fail, assertion coverage,
  dangerous-input deep scan
- Bulk assertion test files for 700+ assertion coverage

### Changed
- Core engine: 80 rules → 95 rules
- Total rules across all 8 engines: 258
- CI engine regex broadened to support `[\w-]+` org/repo names with hyphens
- Dependency engine: event-stream detection in JSON format,
  `@internal/secret-lib` with hyphens
- Banking engine: audit_log = false and AML bypass fallback branches
- Solana engine: mint_authority = none fallback

### Fixed
- Token-intelligence: regex escaping for `++`/`--`, mintAuthority pattern,
  supply manipulation, renounce ownership, liquidity removal, honeypot,
  proxy upgrade, blacklist, pause, swap min output score
- Core: prompt injection pattern ordering (R20), auth bypass reverse order (R91),
  OpenAI sk-proj- key detection (R19)
- All 1325 tests pass — 0 failures across 18 test files
- Structural tests: 1977 assertions across 8 engines, 0 failures

### Security
- 258 production rules across 8 independent engines
- No dangerous input returns ALLOW
- All bot commands wired to real handlers — zero placeholders
- Assertion coverage: 711/700 (100%)
