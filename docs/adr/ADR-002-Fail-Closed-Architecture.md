# ADR-002: Fail-Closed Architecture

**Status:** Accepted (Implemented)  
**Date:** 2026-05-20  
**Engine Version:** v3.0.0  
**Deciders:** Architecture Team, Security Lead

---

## Context

The platform must define behavior when components fail. The security boundary between AI generation and execution must not allow execution when the evaluation engine cannot produce a verdict. This applies to: rule engine unreachable, credit service unreachable, evaluation timeout, malformed input, and any internal error.

## Decision

Adopt a fail-closed architecture where any error in evaluation returns BLOCK:

| Failure Mode | Behavior | Rationale |
|-------------|----------|-----------|
| Rule engine unreachable | BLOCK (circuit breaker OPEN) | Cannot verify safety |
| Credit service unreachable | 0 credits returned (tier=free) | Cannot verify entitlement |
| Rule evaluation error | BLOCK | Cannot produce verdict |
| Malformed input | BLOCK + error description | Input cannot be evaluated |
| Rate limit exceeded | 429 (blocked) | Session exceeded allowed rate |
| Missing auth token | 401 (blocked) | Identity cannot be verified |

The circuit breaker pattern is applied to the rule engine connection: three consecutive failures cause the breaker to OPEN for 30 seconds, during which all requests return BLOCK without attempting connection. This prevents cascading failures.

## Alternatives Considered

### Fail-Open

Allow execution when evaluation is unavailable.

- **Pro**: No false positives during outages
- **Con**: Malicious input would execute during any failure window
- **Con**: Defeats the purpose of a security boundary
- **Verdict**: Rejected — unacceptable security risk

### Degrade Gracefully

Allow low-risk execution during failures while blocking high-risk patterns.

- **Pro**: Maintains some availability during partial failures
- **Con**: Requires stateful risk assessment of unverified input
- **Con**: Complex implementation increases surface for logic errors
- **Con**: Auditing degraded-mode decisions is ambiguous
- **Verdict**: Rejected — complexity outweighs benefit for v1

### Cache Last Known Good

Serve cached verdicts when the engine is unreachable.

- **Pro**: Maintains performance for repeated inputs
- **Con**: Cached verdicts may not be valid for new or modified inputs
- **Con**: Time-of-check to time-of-use race conditions
- **Verdict**: Rejected — cache is used for performance, not as failure fallback

## Consequences

### Positive

- **Guaranteed security boundary**: No execution occurs without a valid evaluation
- **Simple mental model**: Engineers and auditors can reason about failure behavior
- **No ambiguity**: BLOCK is the universal default for uncertainty
- **Cascading protection**: Circuit breaker prevents repeated attempts to a failing service

### Negative

- **Higher false-positive rate**: Transient failures cause legitimate requests to be blocked
- **Availability impact**: A rule engine outage blocks all execution
- **User-facing errors**: Users may see BLOCK verdicts for transient infrastructure issues

### Mitigations

- Circuit breaker with 30-second reset window allows automatic recovery
- Health check endpoints provide visibility into service status
- Monitoring alerts on circuit breaker state changes
- Redis cache reduces rule engine load during normal operation (ADR-005)
