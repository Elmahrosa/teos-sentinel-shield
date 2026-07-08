# TEOS Sentinel — Scoring Policy

## 1. Model: Max-Score Determination

TEOS does **not** use aggregate or weighted-average scoring. Every engine applies a **max-score model**: the single highest-scoring triggered rule determines the final verdict for that engine.

```
finalScore = max(triggeredRules[].score)
```

This ensures that a single critical threat is never diluted by a large number of low-severity findings.

## 2. Verdict Thresholds

| Verdict | Score Range | Meaning |
|---------|-------------|---------|
| `ALLOW` | 0 | No rules triggered. Input is clean. |
| `REVIEW` | 1–59 | Low-severity patterns detected; manual review advised. |
| `WARN` | 60–84 | Medium-severity patterns detected; caution recommended. |
| `BLOCK` | 85–100 | High/critical-severity patterns detected; execution denied. |
| `ERROR` | — | Invalid input (empty, null, exceeds 10KB limit). |

## 3. Score per Rule

Each rule carries a static score (0–100) assigned at definition time based on:

- **Severity tier**: critical (85–100), high (70–89), medium (60–79), low (1–59)
- **Exploitability**: how easily the pattern can be weaponised
- **Impact**: potential damage if executed (data loss, RCE, regulatory penalty)
- **Detection confidence**: lower scores for heuristic/bayesian patterns, higher for deterministic signatures

### Score Distribution by Severity

| Severity | Score Range | Example Rules |
|----------|-------------|---------------|
| critical | 90–100 | Fork bomb, reverse shell, destructive shell (R01, R06, R08) |
| critical | 85–89 | Base64 exec, malicious package, CI curl|bash (R07, R14, R17) |
| high | 80–84 | Path traversal, SQL injection, privileged container (R11, R10, R18) |
| high | 75–79 | Typosquat package, CI write-all perms (R15, C04) |
| medium | 65–74 | Unsafe permissions, network scan, insecure cookie (R16, R55, R66) |
| low | 35–40 | Shallow checkout, full history checkout (C12, C16) |

## 4. Engines

All 8 engines follow the same max-score model independently.

| Engine | Prefix | Rules | Domain |
|--------|--------|-------|--------|
| Core Security | R00–R110 | 110 | OS commands, code injection, network attacks, crypto, cloud, OWASP Top 10 |
| Banking Compliance | B00–B32 | 32 | Basel III, AML, KYC, SWIFT, FIX, PCI-DSS, SAR, capital adequacy |
| Solana Security | S00–S29 | 29 | Solana program-level threats, CPI, account confusion, rent, freezing |
| EVM Security | E00–E28 | 28 | Ethereum/EVM smart contract threats, reentrancy, access control, gas |
| Dependency | D00–D13+ | 3 static + CVE | Known vulnerable packages (npm), typo-squatting, manifest analysis |
| CI/CD Pipeline | C00–C23 | 23 | GitHub Actions, secret leaks, permission overrides, matrix injection |
| Token Intelligence | T00–T23 | 23 | ERC-20, BEP-20, SPL token threats, flash loans, honeypots, tax manipulation |
| Due Diligence | DD00–DD19 | 19 | Contract ownership, liquidity, timelock, proxy patterns, mint/burn authority |

**Total: ~258+ rules across 8 engines.**

## 5. Multi-Engine Execution

When multiple engines are invoked on the same input, each engine returns its own independent verdict and score. The orchestrator (`src/engines/index.js`) collects all engine results and returns:

- `engines[]`: array of per-engine verdicts
- `auditId`: unique identifier for the evaluation
- `summary`: highest verdict across all engines

## 6. Verdict Precedence

When merging across engines, `BLOCK` > `WARN` > `REVIEW` > `ALLOW`. A single `BLOCK` from any engine causes the overall evaluation to be `BLOCK`.

## 7. Findings

Every triggered rule produces a finding containing:

```json
{
  "ruleId": "R01",
  "name": "DESTRUCTIVE_SHELL",
  "severity": "critical",
  "score": 100,
  "reasons": ["rm -rf on system-critical path — permanent filesystem destruction"]
}
```

All findings (including non-max-score rules) are returned in the `findings[]` array, enabling detailed per-rule audit.

## 8. Governance Constants

- **Max input length**: 10,000 characters (truncated/ERROR beyond)
- **Block threshold**: score >= 85
- **Warn threshold**: score >= 60
- **Null input**: returns `ERROR` verdict, score 0
- **CVE scoring**: critical = 92, high = 82, medium = 65

## 9. Rule Lifecycle

1. **Definition**: rule added to engine array with id, name, severity, score, test function
2. **Registration**: `lib/ruleRegistry.js` aggregates all engines for API reporting
3. **Evaluation**: `run*Engine()` iterates rules, collects findings, determines max-score verdict
4. **Retirement**: rules can be deprecated (kept for audit history) but never removed from the registry

## 10. Control ID Taxonomy

| Prefix | Engine | Range |
|--------|--------|-------|
| R | Core Security | R00–R110 |
| B | Banking Compliance | B00–B32 |
| S | Solana Security | S00–S29 |
| E | EVM Security | E00–E28 |
| D | Dependency | D00–D13+ |
| C | CI/CD Pipeline | C00–C23 |
| T | Token Intelligence | T00–T23 |
| DD | Due Diligence | DD00–DD19 |
