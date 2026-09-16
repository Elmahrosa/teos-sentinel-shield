# TEOS Sentinel — Scoring Policy

**Policy Version:** 1.0
**Applies To:** All engines, all deployments, all API consumers
**Governance:** Changes require policy version increment and CHANGELOG entry

---

## 1. Model: Max-Score Determination

TEOS does **not** use aggregate or weighted-average scoring. Every engine applies a **max-score model**: the single highest-scoring triggered rule determines the final verdict for that engine.

```
finalScore = max(triggeredRules[].score)
```

This ensures that a single critical threat is never diluted by a large number of low-severity findings.

## 2. Strict Determinism Guarantee

Identical inputs MUST always produce identical outputs across all invocations:

| Property | Guarantee |
|----------|-----------|
| Findings set | Exactly the same rules trigger for the same input |
| Score | Same final score value |
| Verdict | Same ALLOW/REVIEW/WARN/BLOCK result |
| Audit trace | Same rule execution order, same findings array |
| Rule ordering | Rules iterate in a fixed sequence (see §3) |

### Non-Determinism Prohibitions
- **No randomness**: No `Math.random()`, no shuffle, no probabilistic matching
- **No timestamp influence**: `Date.now()` or `new Date()` must never affect rule test logic
- **No unordered iteration**: `Object.keys()`, `for...in`, `Set.forEach()`, and `Map.forEach()` are prohibited in rule evaluation loops
- **No LLM/AI inference**: Scoring must never depend on external model calls, embeddings, or heuristic thresholds that change between runs
- **No floating-point arithmetic**: All scores are integers; no rounding or precision variation

### Enforcement
- Rule test functions must be pure: `(input: string) => boolean`
- Rule evaluation is a single sorted-loop pass with no side effects
- Verification: see §15 (Regression Tests) and §17 (Independent Verification)

## 3. Rule Ordering

Rules execute in a **fixed, deterministic order** defined at registration time.

### Ordering Methods (pick one per engine)
- **sort(ruleId)**: Rules sorted alphabetically by ID (R01, R02, ..., R10, R11, ...)
- **Registration order**: Rules execute in the order they appear in the array at definition time

### Versioning
- Rule order MUST NOT change without incrementing `rulePackVersion` (see §5)
- Inserting a new rule appends at the end (or inserts at the correct sorted position) — never reorders existing rules
- If reordering is required, a new rule pack version is mandatory

## 4. Verdict Thresholds

| Verdict | Score Range | Meaning |
|---------|-------------|---------|
| `ALLOW` | 0 | No rules triggered. Input is clean. |
| `REVIEW` | 1–59 | Low-severity patterns detected; manual review advised. |
| `WARN` | 60–84 | Medium-severity patterns detected; caution recommended. |
| `BLOCK` | 85–100 | High/critical-severity patterns detected; execution denied. |
| `ERROR` | — | Invalid input (empty, null, exceeds 10KB limit). |

Thresholds are immutable within a policy version. Changing thresholds requires `policyVersion` increment.

## 5. Engine Versioning

Every evaluation response MUST expose three version fields:

| Field | Example | Description |
|-------|---------|-------------|
| `engineVersion` | `4.1.0` | Version of the engine runtime (semver) |
| `rulePackVersion` | `rules-258` | Identifies the exact rule set — rules, scores, thresholds, ordering |
| `policyVersion` | `policy-1.0` | Identifies this scoring policy specification |

### Version Bump Requirements

| Change | Required Version Bump |
|--------|----------------------|
| Rule score changed | `rulePackVersion` |
| Rule added/removed | `rulePackVersion` |
| Rule order changed | `rulePackVersion` |
| Threshold changed | `policyVersion` |
| Model changed (e.g., max-score to weighted) | `policyVersion` (major) |
| New engine added | `rulePackVersion` |
| Documentation-only update | No version bump |

## 6. Score per Rule

Each rule carries a static integer score (0–100) assigned at definition time. Scores are immutable within a `rulePackVersion`. Changing a score requires a `rulePackVersion` increment.

### Score Assignment Criteria

- **Severity tier**: critical (85–100), high (70–89), medium (60–79), low (1–59)
- **Exploitability**: how easily the pattern can be weaponised
- **Impact**: potential damage if executed (data loss, RCE, regulatory penalty)
- **Detection confidence**: lower scores for heuristic/bayesian patterns, higher for deterministic signatures

### Score Distribution by Severity

| Severity | Score Range | Example Rules |
|----------|-------------|---------------|
| critical | 90–100 | Fork bomb, reverse shell, destructive shell (R01, R06, R08) |
| critical | 85–89 | Base64 exec, malicious package, CI curl\|bash (R07, R14, R17) |
| high | 80–84 | Path traversal, SQL injection, privileged container (R11, R10, R18) |
| high | 75–79 | Typosquat package, CI write-all perms (R15, C04) |
| medium | 65–74 | Unsafe permissions, network scan, insecure cookie (R16, R55, R66) |
| low | 35–40 | Shallow checkout, full history checkout (C12, C16) |

### Rationale Notes
- SQL injection (R10, score 80) is scored **high** rather than critical because successful exploitation requires schema knowledge and context — the pattern itself is a probe. Compare: base64 exec (R07, score 88) is **critical** because the decoded payload executes immediately with no additional barriers.
- All scoring rationale is documented per-rule in the rule definition comments.

## 7. Engines

All 8 engines follow the same max-score model independently.

| Engine | Prefix | Rules | Domain |
|--------|--------|-------|--------|
| Core Security | R01–R110 | 110 (95 active, 15 in staging) | OS commands, code injection, network attacks, crypto, cloud, OWASP Top 10 |
| Banking Compliance | B01–B32 | 32 | Basel III, AML, KYC, SWIFT, FIX, PCI-DSS, SAR, capital adequacy |
| Solana Security | S01–S29 | 29 | Solana program-level threats, CPI, account confusion, rent, freezing |
| EVM Security | E01–E21 | 21 | Ethereum/EVM smart contract threats, reentrancy, access control, gas |
| Dependency | DEP-* | 8 (5 static + CVE) | Known vulnerable packages (npm), typo-squatting, manifest analysis |
| CI/CD Pipeline | C01–C23 | 23 | GitHub Actions, secret leaks, permission overrides, matrix injection |
| Token Intelligence | T01–T25 | 25 | ERC-20, BEP-20, SPL token threats, flash loans, honeypots, tax manipulation |
| Due Diligence | DD01–DD25 | 25 | Contract ownership, liquidity, timelock, proxy patterns, mint/burn authority |

**Total: 258 rules across 8 engines (95 + 32 + 29 + 21 + 8 + 23 + 25 + 25 = 258).**
> Core Security has 95 active rules (R01–R25, R41–R110) with a gap at R26–R40 reserved for future expansion.

The discrepancy between "121 controls" in the UI and "258+ rules" in this policy is explained by deployment-specific active rule subsets. The full rule registry contains all defined rules; a given deployment may enable a subset.

## 8. Multi-Engine Execution

When multiple engines are invoked on the same input, each engine returns its own independent verdict and score. The orchestrator (`src/engines/index.js`) collects all engine results and returns:

- `engines[]`: array of per-engine verdicts
- `auditId`: unique identifier for the evaluation
- `summary`: highest verdict across all engines

### Execution Order
- Engines execute in a fixed order (sorted by engine ID) for deterministic multi-engine audit traces.
- Engine execution order MUST NOT change without a `rulePackVersion` increment.

## 9. Verdict Precedence

When merging across engines, `BLOCK` > `WARN` > `REVIEW` > `ALLOW`. A single `BLOCK` from any engine causes the overall evaluation to be `BLOCK`.

## 10. Findings — Explainability Requirements

Every triggered rule MUST produce a finding containing all fields required for independent score reproduction:

```json
{
  "ruleId": "R01",
  "name": "DESTRUCTIVE_SHELL",
  "severity": "critical",
  "score": 100,
  "reasons": ["rm -rf on system-critical path — permanent filesystem destruction"],
  "matchedPattern": "rm -rf / --no-preserve-root"
}
```

### Field Requirements

| Field | Required | Description |
|-------|----------|-------------|
| `ruleId` | Always | Control ID from the taxonomy (R01, B03, S12, etc.) |
| `name` | Always | Human-readable rule name |
| `severity` | Always | critical, high, medium, low |
| `score` | Always | Integer 0–100 — MUST match the rule's static score |
| `reasons` | Always | Array of human-readable explanations |
| `matchedPattern` | Always | The exact substring or pattern that triggered the rule (regex match) |

Every score MUST be reproducible from the published rule definitions in source code. No score may depend on external data, API calls, or runtime state.

All findings (including non-max-score rules) are returned in the `findings[]` array, enabling detailed per-rule audit. The array order MUST match rule execution order (see §3).

## 11. Audit Trace

Every evaluation MUST record and return:

| Field | Type | Description |
|-------|------|-------------|
| `auditId` | UUID v4 | Unique identifier for the evaluation |
| `timestamp` | ISO 8601 | When the evaluation occurred (informational only; never influences scoring) |
| `policyVersion` | string | Current `policy-1.0` (see §5) |
| `rulePackVersion` | string | Current rule pack identifier |
| `engineVersion` | string | Engine runtime version |
| `triggeredRules` | array | All findings (see §10) |
| `executionOrder` | array | Engine and rule execution sequence |
| `finalScore` | integer | Highest score among triggered rules |
| `finalVerdict` | string | ALLOW, REVIEW, WARN, BLOCK, or ERROR |

### Audit Storage
- Audit records are immutable once written
- Each record includes the full input and full output
- Audit logs support replay: re-evaluating the same input against the same rule pack MUST produce the same result

## 12. Governance Constants

| Constant | Value | Scope |
|----------|-------|-------|
| Max input length | 10,000 characters | All engines |
| Block threshold | score >= 85 | All engines |
| Warn threshold | score >= 60 | All engines |
| Review threshold | score >= 1 | All engines |
| Null input verdict | ERROR, score 0 | All engines |
| CVE critical score | 92 | Dependency engine |
| CVE high score | 82 | Dependency engine |
| CVE medium score | 65 | Dependency engine |
| Max rule score | 100 | All engines |
| Min rule score | 0 | All engines |

Constants are immutable within a policy version. Changing any constant requires `policyVersion` increment.

## 13. Rule Lifecycle

1. **Definition**: rule added to engine array with id, name, severity, score, test function
2. **Registration**: `lib/ruleRegistry.js` aggregates all engines for API reporting
3. **Evaluation**: `run*Engine()` iterates rules in fixed order (sorted by ID), collects findings, determines max-score verdict
4. **Retirement**: rules can be deprecated (kept in source and audit history, excluded from active evaluation) but never removed from the registry

### Deprecation Process
- Deprecated rules MUST remain in the source code with a `@deprecated` annotation
- Deprecated rules MUST be excluded from active evaluation but MUST remain in the registry for audit replay
- A deprecation notice MUST be added to the CHANGELOG

## 14. Control ID Taxonomy

| Prefix | Engine | Range |
|--------|--------|-------|
| R | Core Security | R01–R110 |
| B | Banking Compliance | B01–B32 |
| S | Solana Security | S01–S29 |
| E | EVM Security | E01–E21 |
| D | Dependency | DEP-* (e.g., DEP-LODASH-01) |
| C | CI/CD Pipeline | C01–C23 |
| T | Token Intelligence | T01–T25 |
| DD | Due Diligence | DD01–DD25 |

Control IDs are unique across all engines. No two rules may share the same ID.

## 15. Regression Tests

Before any release, automated tests MUST prove:

```
same input × 1000 iterations →
  same score
  same verdict
  same findings (same rules, same order)
  same audit trace
```

### Test Requirements
- Every engine has a determinism test suite
- Every rule has at least one positive test (triggers) and one negative test (does not trigger)
- Score integrity tests: verify that the returned score matches the rule's defined static score
- Execution order tests: verify that findings array order matches the defined rule order
- CI pipeline MUST fail if any determinism test fails

## 16. Version Governance

### Change Classification

| Class | Examples | Required Action |
|-------|----------|-----------------|
| **Patch** | Documentation, comments, test additions | CHANGELOG entry |
| **Minor** | New rules added, existing rules deprecated, CVE database updated | `rulePackVersion` increment + CHANGELOG entry |
| **Major** | Score changed, threshold changed, rule reordered, rule logic changed, model changed | `policyVersion` or `rulePackVersion` increment + CHANGELOG entry + migration notes |

### Migration Notes
- Major changes MUST include migration notes explaining the impact on existing evaluations
- Breaking changes MUST be communicated at least one release cycle in advance when possible

## 17. Independent Verification

A validation script (`scripts/validate-policy.js`) MUST automatically verify that `SCORING_POLICY.md` matches the actual implementation:

### Verification Checks

| Check | Description |
|-------|-------------|
| Threshold alignment | Block threshold in source matches policy doc |
| Rule count | Registered rule count matches documented count per engine |
| Score ranges | No rule score exceeds 100 or is negative |
| Control ID uniqueness | No duplicate control IDs across engines |
| Version alignment | `package.json` version matches reported `engineVersion` |
| Determinism test pass | Determinism test suite passes |

### CI Integration
- The validation script runs in CI on every pull request and release
- CI MUST fail if documentation and implementation diverge

## 18. Cross-Reference Documentation

This policy is the authoritative specification. Related documents:

| Document | Location | Relationship |
|----------|----------|--------------|
| `SCORING_POLICY.md` | `/SCORING_POLICY.md` | This document — authoritative scoring specification |
| `RULE_CATALOG.md` | `/docs/RULE_CATALOG.md` | Complete list of all rules with scores, descriptions, examples, score rationale |
| `ARCHITECTURE.md` | `/docs/architecture-overview.md` | Engine runtime, plugin architecture, data flow |
| `API.md` | `/docs/api-reference.md` | REST and WebSocket API endpoints, request/response schemas |
| `CHANGELOG.md` | `/docs/changelog.md` | Version history with per-release policy changes |
| `Audit Directory` | `/docs/audit/` | Enterprise readiness, gap analysis, strategic recommendations |
| `AGENTS.md` | `/AGENTS.md` | Build instructions for AI-assisted development |

## 19. Enterprise Acceptance Criteria

A release is considered enterprise-ready ONLY if all of the following pass:

| Criterion | Verification |
|-----------|-------------|
| ✓ Deterministic | Determinism test suite: 1000× same input → same output |
| ✓ Reproducible | Every score traceable to a published rule definition |
| ✓ Explainable | Every finding includes `ruleId`, `name`, `severity`, `score`, `reason`, `matchedPattern` |
| ✓ Versioned | `engineVersion`, `rulePackVersion`, `policyVersion` exposed in every response |
| ✓ Auditable | Full audit trace with `auditId`, triggered rules, execution order, final verdict |
| ✓ Regression tested | Every rule has positive and negative tests; determinism tested per engine |
| ✓ Documented | Policy, rule catalog, architecture, API, audit schema all cross-referenced |
| ✓ CI-validated | Validation script enforces doc–implementation parity in CI |

---

*Policy Version: 1.0 · Engine Version: 5.0.0 · Rule Pack: rules-258*

