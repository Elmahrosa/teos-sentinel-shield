# Security Roadmap

## Positioning Boundary

Current positioning:

```text
TEOS Sentinel Shield
Pre-Execution Security Guardrails for Autonomous Systems
Generate → Validate → Execute
```

Use:

```text
rule-driven pre-execution validation
```

Do not use stronger infrastructure language until the technical foundation supports it.

## Phase 1: Execution Guardrail MVP

Goal: Block known unsafe patterns before execution.

Scope:

- `/scan` command validation
- `/deps` dependency input validation
- `/ci` CI/CD example validation
- credits and entitlement enforcement
- Dodo payment activation
- audit logs
- clear docs and known limitations

Required hardening:

- rule IDs
- severity model
- test corpus
- evidence logging
- normalization layer
- bypass tests
- README repositioning
- landing examples showing blocked payloads

## Phase 2: Policy Engine

Goal: Move from regex/rule lists to configurable policy evaluation.

Evaluate:

- Rego / OPA
- CEL
- custom DSL
- hybrid static rules + policy files

Required capabilities:

- organization-specific policies
- allowlist / denylist support
- rule versioning
- policy tests
- CI policy enforcement
- structured JSON verdicts
- signed audit records

Example future policy:

```rego
package teos.guardrails

deny[msg] {
  input.command contains "rm -rf /"
  msg := "Destructive root deletion blocked"
}
```

## Phase 3: Execution Control Infrastructure

Only use this language after the product has:

- stable engine API
- documented policy engine
- CI enforcement mode
- audit log exports
- signed verdicts
- enterprise deployment model
- measurable benchmark results
- adversarial test coverage
- sandbox integration examples

## Engine Migration Evaluation

Eventually evaluate Go or Rust for the core verdict engine.

Reasons to consider migration:

- lower deployment footprint
- easier single-binary distribution
- stronger type safety
- predictable performance
- easier embedding in CI/CD and agent runtimes

Do not migrate prematurely. First stabilize rules, tests, and verdict contracts.

## Technical Moat Direction

The moat should come from:

- auditable rule evidence
- policy customization
- bypass-resistant normalization
- CI/CD enforcement
- entitlement-aware API design
- high-quality adversarial corpus
- clear false-positive handling
- trustworthy docs
