# ADR-001: Rule Engine Design

**Status:** Accepted (Implemented)  
**Date:** 2026-05-20  
**Engine Version:** v3.0.0  
**Deciders:** Architecture Team

---

## Context

The platform requires a deterministic pre-commit scanning capability that evaluates user-supplied input before execution. The evaluation must be predictable, auditable, and consistent across all entry points (Telegram, REST API, CI/CD, Claude Code). The scanner must classify input into three categories: safe, risky, and malicious.

## Decision

Implement a 28-rule pattern-matching engine with the following properties:

- **Priority ordering**: Rules are evaluated in a defined sequence based on severity and category
- **Pattern matching**: Each rule implements one or more regex or string-based patterns
- **Deterministic output**: Same input always produces same verdict
- **Fail-closed default**: Any evaluation error returns BLOCK
- **Three-tier verdict**: ALLOW, WARN, BLOCK with clear thresholds
- **Versioned**: Engine version (v3.0.0) recorded in every audit entry

Rules are organized by category: destructive operations, secret exfiltration, supply chain risk, code injection, permission escalation, and network abuse. Each rule has a unique identifier (R01–R28), severity level, and explicit pattern definition.

## Alternatives Considered

### ML-Based Scoring

A machine learning classifier that scores inputs probabilistically.

- **Pro**: Could potentially detect novel attack patterns
- **Con**: Non-deterministic — same input may produce different scores across model versions
- **Con**: Requires training data, introduces model drift risk
- **Con**: Harder to audit — decisions are based on weights, not explicit rules
- **Verdict**: Rejected — insufficient for deterministic governance requirements

### Third-Party SAST Integration

Using an existing static analysis tool (e.g., Semgrep, CodeQL) as the evaluation engine.

- **Pro**: Established tooling with existing pattern libraries
- **Con**: SAST is designed for code analysis, not execution governance
- **Con**: Slower evaluation — SAST tools scan entire files, not single commands
- **Con**: External dependency adds latency and availability risk
- **Verdict**: Rejected — does not match execution governance use case

### Allow-List Only

Maintain a list of explicitly permitted commands and block everything else.

- **Pro**: Simple to implement and audit
- **Con**: Insufficient for general-purpose AI agent inputs
- **Con**: Requires constant maintenance as new use cases emerge
- **Verdict**: Rejected — too restrictive for production use

## Consequences

### Positive

- **Predictable governance**: Every input maps to a known verdict based on explicit rules
- **Easy to audit**: Each BLOCK/WARN maps to one or more rule IDs
- **Fast evaluation**: Pattern matching completes in sub-millisecond per rule
- **Versioned upgrades**: Rule changes are tracked via engine version
- **No training data required**: Rules are hand-authored from known patterns

### Negative

- **Rule maintenance burden**: New attack patterns require manual rule additions
- **False negatives**: Unknown patterns may not trigger existing rules
- **Regex complexity**: Some rules use complex regex patterns that are harder to maintain
- **No adaptive learning**: The engine cannot automatically detect novel patterns

### Mitigations

- Regular rule review cadence
- 596 tests covering known attack patterns
- WARN tier catches ambiguous patterns
- fail-closed default ensures unknown errors do not permit execution
