# ADR-004: Governance Layer

**Status:** Accepted (Implemented)  
**Date:** 2026-05-20  
**Engine Version:** v3.0.0  
**Deciders:** Architecture Team

---

## Context

The platform requires a governance layer that enforces policy at execution time. All execution requests — whether from a Telegram user, a REST API call, a CI/CD pipeline, or a Claude Code agent — must pass through the same policy enforcement point before any action is taken.

## Decision

Implement a governance layer where all input passes through the rule engine and receives a deterministic verdict (ALLOW/WARN/BLOCK) before execution.

### Governance Flow

```
Input → Gateway → Auth → Rate Limit → Rule Engine → Verdict → (Block | Warn | Allow) → Audit
```

### Key Properties

1. **Universal enforcement**: Same rules apply regardless of entry point
2. **Deterministic verdicts**: Same input always produces same result
3. **Verdict + reasons**: Every decision includes rule IDs and explanations
4. **Auditable**: Every evaluation is recorded in the audit chain
5. **Extensible**: Rules can be added, removed, or modified across versions

### Current Rule Set

103 rules (64 core + 29 Solana + 10 EVM) organized into 6 categories: destructive operations, secret exfiltration, supply chain risk, code injection, permission escalation, and network abuse.

### Versioning

The rule set is versioned (v3.0.0). The engine version is recorded in every audit entry, allowing retrospective verification of which rules applied to a given evaluation.

## Alternatives Considered

### ML-Based Policy Engine

Use a machine learning model to classify inputs.

- **Pro**: Can detect novel patterns
- **Con**: Non-deterministic — same input may produce different results
- **Con**: Output cannot be explained by referencing explicit rules
- **Con**: Model drift requires retraining and validation
- **Verdict**: Rejected — governance requires deterministic, auditable decisions

### Allow-List Only

Define a list of explicitly permitted patterns and block everything else.

- **Pro**: Simple to implement
- **Con**: Cannot accommodate the range of valid AI agent inputs
- **Con**: High false-positive rate for legitimate use cases
- **Verdict**: Rejected — insufficiently flexible

### Post-Hoc Auditing

Allow all execution and audit decisions after the fact.

- **Pro**: Zero friction for users
- **Con**: Cannot prevent execution of malicious input
- **Con**: Defeats the purpose of an execution governance layer
- **Verdict**: Rejected — prevention is a core requirement

## Consequences

### Positive

- **Deterministic**: Verdicts are reproducible and auditable
- **Auditable**: Each decision traces to specific rules
- **Extensible**: New rules can be added without changing architecture
- **Consistent**: Same policy applies across all entry points
- **Fail-closed**: Errors default to BLOCK

### Negative

- **Rule coverage gap**: Novel attack patterns not covered by existing rules will not be detected
- **False positives**: Overly broad rules may block legitimate input
- **Maintenance**: Rules require periodic review and updates

### Mitigations

- 596 tests validate rule behavior across known patterns
- WARN tier catches ambiguous or borderline cases
- Regular rule review cycle
- Engine versioning enables retrospective analysis of rule applicability
