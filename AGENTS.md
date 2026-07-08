# TEOS Sentinel — AI Builder Instructions

This file contains the complete implementation plan and architecture reference for AI-assisted development of TEOS Sentinel Shield v4.2.

---

## Quick Start

```bash
npm install
npm run ci           # Validate policy + run determinism tests
npm run lint         # Version consistency, engine completeness checks
npm run test:all     # Full test suite
node scripts/enterprise-gate.js  # 9-criteria acceptance gate
```

## Key Commands

| Command | What It Does | CI Gate |
|---------|-------------|---------|
| `npm start` | Start modular server (src/server/) | — |
| `npm run dev:ws` | Start WS+Express unified server (ws-server/) | — |
| `npm run ci` | Policy validation + determinism tests | YES |
| `npm run test:all` | Full test suite (all engines + integration) | YES |
| `npm run test:determinism` | 1000× same-input determinism regression | YES |
| `npm run validate:policy` | Doc–implementation parity checks (30 checks) | YES |
| `npm run lint` | Version alignment, engine completeness | YES |
| `npm run test:engines` | All 8 engine unit tests | — |
| `node scripts/enterprise-gate.js` | 9-criteria release gate | PRE-RELEASE |

## Architecture

### Two Server Paths

| Server | Entry | File | Used By |
|--------|-------|------|---------|
| Modular Express | `npm start` | `src/server/index.js` | Railway, local dev |
| Unified WS+Express | `npm run dev:ws` | `ws-server/index.js` → `server/api.js` | WS connections |

Both serve the same engine but have separate route handlers. Changes must be replicated to both:
- **Modular routes:** `src/server/routes/*.js`
- **Monolithic routes:** `server/api.js` (lines 764–978)

### Core Engine Architecture

```
src/engines/index.js (orchestrator)
  ├── core.js          — 110 rules (R01–R110)
  ├── banking.js       — 32 rules (B01–B32)
  ├── solana.js        — 29 rules (S01–S29)
  ├── evm.js           — 21 rules (E01–E21)
  ├── dependency.js    — 8 rules (D01–D08 + CVE DB)
  ├── ci.js            — 23 rules (C01–C23)
  ├── token-intelligence.js — 25 rules (T01–T25)
  └── due-diligence.js — 25 rules (DD01–DD25)
Total: 258 rules

finding-utils.js — shared helpers (extractMatch, toRecommendation)
```

### Response Format

Every evaluation returns:

```json
{
  "verdict": "BLOCK|WARN|REVIEW|ALLOW|ERROR",
  "score": 88,
  "auditId": "TOS-...",
  "timestamp": "ISO-8601",
  "engineVersion": "4.1.0",
  "rulePackVersion": "rules-258",
  "policyVersion": "policy-1.0",
  "engine": "Core Security Engine",
  "highestRule": "R07",
  "highestRuleScore": 88,
  "findings": [
    {
      "ruleId": "R07",
      "name": "BASE64_EXEC",
      "severity": "high",
      "score": 88,
      "reasons": ["..."],
      "matchedPattern": "eval(atob...",
      "recommendation": "Required action: ..."
    }
  ]
}
```

### Version Sources

| Constant | Value | Defined In |
|----------|-------|------------|
| `ENGINE_VERSION` | `4.1.0` | `src/engines/index.js` |
| `RULE_PACK_VERSION` | `rules-258` | `src/engines/index.js` |
| `POLICY_VERSION` | `policy-1.0` | `SCORING_POLICY.md` |

### Audit Store

- In-memory `Map<String, Object>` keyed by `auditId`
- Max 10,000 entries (oldest evicted)
- Replay endpoint: `GET /api/audit/:auditId`
- Available in both server paths (modular: `global.__auditStore`; monolithic: local `auditStore`)

---

## Implementation Checklist for AI Builder

### Phase 1 — Score Explainability ✅ DONE
- [x] Each finding includes `matchedPattern` (first matching line/segment from input)
- [x] Each finding includes `recommendation` (severity-prefixed remediation guidance)
- [x] Orchestrator response includes `highestRule` and `highestRuleScore`
- [x] All 8 engines + monolithic `server/api.js` updated

### Phase 2 — Engine Version Metadata ✅ DONE
- [x] Every response includes `engineVersion`, `rulePackVersion`, `policyVersion`
- [x] Version fields present on ALLOW, BLOCK, WARN, REVIEW, and ERROR verdicts
- [x] Consistent across modular and monolithic servers

### Phase 3 — Determinism Tests ✅ DONE
- [x] `test/determinism-test.js` — 8 test groups × 1000 iterations each
- [x] Tests: ALLOW, BLOCK, WARN, version, finding order, cross-engine, ERROR
- [x] CI fails on any mismatch
- [x] Run: `npm run test:determinism`

### Phase 4 — Rule Registry Endpoint ✅ DONE
- [x] `GET /api/rules` — returns metadata (id, name, severity, score, status) for all 258 rules
- [x] No implementation logic, no test functions exposed
- [x] Available in both modular and monolithic servers

### Phase 5 — Rule Catalog ✅ DONE
- [x] `docs/RULE_CATALOG.md` — auto-generated from source
- [x] Every rule: ID, name, engine, severity, score, description, example trigger, score rationale
- [x] Regenerate: `node scripts/generate-catalog.js > docs/RULE_CATALOG.md`

### Phase 6 — Score Rationale ✅ DONE
- [x] Documented in RULE_CATALOG.md for all rules
- [x] Key rationale: SQL Injection vs Base64 Exec vs Fork Bomb score differences
- [x] Each rationale explains: determinism level, exploit probability, impact severity

### Phase 7 — Replay Verification ✅ DONE
- [x] `GET /api/audit/:auditId` — returns full evaluation record
- [x] Lightweight in-memory map (10K max, oldest evicted)
- [x] Available in both server paths

### Phase 8 — CI Validation ✅ DONE
- [x] `npm run ci` = policy validation + determinism tests
- [x] `npm run lint` = version consistency + engine completeness
- [x] `npm run validate:policy` = 30 checks (rule counts, scores, IDs, thresholds, docs)
- [x] Merge blocked on any failure

### Phase 9 — Documentation Cross-Reference ✅ DONE
- [x] SCORING_POLICY.md §18 — cross-reference table to all docs
- [x] RULE_CATALOG.md header — cross-reference to all docs
- [x] Architecture doc header — cross-reference
- [x] API doc header — cross-reference
- [x] Docs synchronized (RULE_CATALOG.md auto-generated from source)

### Phase 10 — Enterprise Acceptance Gate ✅ DONE
- [x] `scripts/enterprise-gate.js` — 9 criteria
- [x] Blocks release if any criterion fails
- [x] Criteria: deterministic, explainable, reproducible, versioned, auditable, regression tested, policy validated, documentation synced, CI green

### Phase 11 (New) — Version Unification ✅ DONE
- [x] `package.json` → `4.1.0`
- [x] `.version.json` → `4.1.0`
- [x] `lib/version.js` → `4.1.0`

---

## Rules for AI Development

1. **Never change the max-score model.** `finalScore = max(triggeredRules[].score)` is immutable.
2. **Never add randomness.** Rule test functions must be pure: `(input: string) => boolean`.
3. **Never remove a rule.** Rules are deprecated in place with `@deprecated` annotation.
4. **Both server paths must be updated.** Changes to engine responses need updates in `src/server/routes/` AND `server/api.js`.
5. **Always run the enterprise gate** before finalizing: `node scripts/enterprise-gate.js`.
6. **Keep RULE_CATALOG.md in sync.** Regenerate after adding/modifying rules: `node scripts/generate-catalog.js > docs/RULE_CATALOG.md`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info + available endpoints |
| GET | `/live` | Liveness probe |
| GET | `/ready` | Readiness probe |
| GET | `/health` | Full health check |
| GET | `/stats` | Aggregate scan statistics |
| GET | `/events` | Recent scan events (max 500) |
| POST | `/scan` | Legacy single-engine scan |
| POST | `/scan/:engine` | Named engine scan (core, banking, solana, evm, deps, ci, token-intelligence, due-diligence) |
| POST | `/fullreport` | Combined dueDiligence + tokenIntel |
| GET | `/engines` | List available engines with credit costs |
| GET | `/api/rules` | Rule registry (metadata only) |
| GET | `/api/audit/:auditId` | Replay verification from audit store |
| GET | `/api/version` | Engine version info |
| POST | `/ingest` | External event ingestion |

All endpoints require `X-API-Key` header.

---

## Deployment Notes

### Production (sentinel.teosegypt.com)

| Detail | Value |
|--------|-------|
| Host | Hostinger shared hosting |
| Document root | `/home/u461931265/domains/sentinel.teosegypt.com/public_html/` |
| Static file | `index.html` (served at root) |
| API server | Railway (separate deployment) |

### Deployment Recommendation

**Use Git-based deployment instead of FTP whenever possible.**

| Method | Viable? | Notes |
|--------|---------|-------|
| GitHub Actions | ✓ Recommended | Push-to-deploy via SSH or Railway API |
| Hostinger Git | ✓ Check availability | Hostinger hPanel → Files → Git |
| FTP | ⚠️ Fallback only | Risk of updating wrong directory if paths drift |

**Why:** The previous FTP deployment discovered a document-root mismatch — the FTP root did not match Apache's `DocumentRoot`. Git-based deployment eliminates this class of error by using the server's own file resolution.
