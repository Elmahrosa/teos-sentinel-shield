# Changelog

## v4.0.0-rc1 (Planned — 2026-07-15)

### Release Candidate (June 28 — July 14)

- v4.0.0-rc1 baseline established
- Stabilization freeze: no new features, no refactoring, no architecture changes
- 596/596 tests passing (MCP 459, Shield 119, Playground 18)
- Engine v4.0.0 consistent across all surfaces
- Linux admin rules (R34–R37): ADMIN_ELEVATION, PKG_MANAGER_REMOVE, FILESYSTEM_ADMIN, SERVICE_ADMIN
- 27 Playground Scenarios (all categories)
- Fixed health.test.ts (engine version, test count expectations)
- Fixed engine.test.js (deprecated mock.module() → Node v24 compat)
- Fixed R26–R33 gap in api.js RULE_ID_MAP (R01–R37 complete)
- Fixed Shield package.json version (3.0.0 → 4.0.0)
- Version consistency sweep across all surfaces
- Created ROADMAP.md and RELEASE_PLAN.md

### Release Candidate (2026-06-28 — 2026-07-14)

- Release Candidate now active through July 14
- Community and partner testing
- False-positive/negative validation
- Browser compatibility testing
- Performance validation
- Regression testing across all 111 rules

### General Availability (Planned — 2026-07-15)

- All critical bugs resolved
- Final production verification
- Documentation complete
- Security validation summary published

## v4.2.1 (2026-06-27)

### Modular Architecture

- Refactored 1,695-line inline playground into 10 ES modules with single responsibility
- New modules: constants.js, state.js, utils.js, dom.js, scenarios.js, engine.js, render.js, controls.js, export.js, index.js
- Zero behavioral changes — all 26 scenarios, 30 rules, pipeline stages, keyboard shortcuts, and deep links preserved

### Security

- Confirmed zero innerHTML in playground rendering layer — all DOM manipulation uses textContent/createElement/replaceChildren
- The single document.write in export.js uses escaped input in a new-window context (intentional, safe)

### Performance

- Build time reduced by 98.4%: ~48 min (v4.0.0-rc1) → ~46.5 sec (v4.2.1)

### Bug Fix

- Fixed `buildRiskSteps()` in utils.js referencing `RULE_MAP` without import — would throw ReferenceError on any scan with findings. Added `import { RULE_MAP } from './constants.js'`.

### Automated Tests

- Initial test suite: 18 tests across 3 files (state, escapeHtml, engine)
- `npm test` runs all tests via Node built-in test runner
- CI gate: `npm test` must pass before merge

### Deployment

- Both playground.html and assets/dist/playground.html updated to module loader pattern
- DOM contract validation and JS syntax checks pass
- HTTP 200 verified on all module files and both HTML files

## v4.2.0 (2026-06-27)

### Runtime Stability
- Fixed missing `statsRow` DOM container causing null-reference crash on verdict render
- Fixed `findingsList` / `evidenceList` ID mismatch causing `replaceChildren()` null-reference crash
- Eliminated all runtime null-reference exceptions during verdict rendering
- Added startup validation for 15 required DOM elements — fails fast with clear error message
- Added defensive early-return guards in `renderVerdict` for all critical UI containers
- Fixed `byId()` infinite recursion bug (was calling itself instead of `document.getElementById`)

### Security
- Replaced unsafe dynamic DOM updates with safer DOM manipulation where applicable
- Added automated DOM contract validation to CI pre-deploy gate
- Hardened deployment pipeline with 4-check pre-deploy gate

### Developer Experience
- Improved diagnostics: missing UI elements now produce explicit console error with element ID
- Created `scripts/validate-dom-contract.sh` — extracts all JS DOM lookups and HTML IDs, fails build on any orphan
- Browser regression checklist completed across Chrome, Firefox, Edge, and mobile
- CI now fails on DOM contract violations before any deployment

### Deployment
- Railway bot service: healthy (Engine 4.0)
- Hostinger Shield: healthy (all public endpoints HTTP 200)
- Risk MCP engine: healthy (Engine 4.0.0, 596 tests)
- CI pipeline validated end-to-end

### Notes
- v4.2.0 is the stable production baseline. No further code changes to this release.
- Next: v4.2.1 — modular playground refactor (separate branch).
