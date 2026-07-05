# ADR-008: Policy Versioning

**Status:** Accepted (Implemented)  
**Date:** 2026-05-20  
**Engine Version:** v3.0.0  
**Deciders:** Architecture Team

---

## Context

The rule set must evolve over time — adding new rules for emerging attack patterns, adjusting severity levels, fixing false positives. These changes must be trackable so that audit entries can be interpreted in the context of the rules that were active at the time of evaluation. Without versioning, retrospective analysis of audit entries is ambiguous.

## Decision

Adopt semantic versioning for the rule engine, with the engine version recorded in every audit entry.

### Versioning Scheme

The rule engine uses semantic versioning (MAJOR.MINOR.PATCH):

| Component | Meaning | Example |
|-----------|---------|---------|
| MAJOR | Breaking rule changes (rule removed, severity increased) | 3.0.0 |
| MINOR | Rule additions, severity decreases | 2.2.0 |
| PATCH | Pattern refinements, false positive fixes | 2.2.1 |

### Current Version

v4.0.0-rc1 — 111 rules (64 core + 29 Solana + 10 EVM + 8 banking), 596 tests.

### Version Recording

The engine version is included in every audit entry:

```json
{
  "engineVersion": "2.2.0",
  "decision": "BLOCK",
  "reasons": ["Destructive shell command detected (R07)"]
}
```

This enables retrospective queries such as:
- "Which rules were active when this entry was evaluated?"
- "Would a different version of the engine have produced a different verdict?"
- "What version of the engine was running during a given time period?"

### Policy Pinning (Future)

Enterprise deployments may pin to a specific engine version while evaluating new versions in a staging environment before rollout. This allows organizations to manage rule changes through their own change management process.

## Alternatives Considered

### No Versioning

Track rule changes in a changelog but do not embed version in audit entries.

- **Pro**: Simpler implementation
- **Con**: Cannot determine which rules applied to historical entries without external records
- **Con**: External records may be lost or out of sync
- **Verdict**: Rejected — insufficient for compliance requirements

### Date-Based Versioning

Use ISO 8601 date strings as version identifiers.

- **Pro**: Human-readable timeline of changes
- **Con**: Multiple changes on the same date are ambiguous
- **Con**: Does not communicate significance of change (major vs minor)
- **Con**: Difficult to reference in tooling and automation
- **Verdict**: Rejected — ambiguous and not machine-friendly

### Hash-Based Versioning

Use a git commit hash as the version identifier.

- **Pro**: Uniquely identifies exact state of rule set
- **Con**: Not human-readable — hard to reference in documentation
- **Con**: Does not communicate magnitude of change
- **Verdict**: Rejected — can supplement semantic version but not replace it

## Consequences

### Positive

- **Retrospective clarity**: Any audit entry can be interpreted in the context of the rules that produced it
- **Change management**: Rule changes are tracked through explicit version bumps
- **Compatibility**: Version number communicates upgrade impact
- **Audit trail for rules**: Changes to the rule set are themselves auditable
- **Enterprise readiness**: Policy pinning enables controlled rollouts

### Negative

- **Version management overhead**: Each rule change requires a version bump
- **Backward compatibility expectations**: Consumers may depend on specific version behavior
- **Multi-version support burden**: Supporting multiple concurrent versions increases complexity

### Mitigations

- Version is recorded automatically by the engine — no manual intervention required
- Backward-compatible changes (MINOR, PATCH) do not require consumer changes
- Policy pinning is a future feature — current version is singular and forward-compatible
- Engine version is exposed via `/health` endpoint for operational visibility
