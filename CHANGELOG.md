# Changelog

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
