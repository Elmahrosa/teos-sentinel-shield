# ADR-007: Execution Gateway

**Status:** Accepted (Implemented)  
**Date:** 2026-05-20  
**Engine Version:** v3.0.0  
**Deciders:** Architecture Team

---

## Context

The platform requires a single, consistent point of policy enforcement where all execution requests are evaluated. Multiple entry points (Telegram, REST API, CI/CD, Claude Code) must route through the same enforcement point to ensure policy consistency.

## Decision

Implement a centralized gateway architecture where all execution requests are routed through a single enforcement point before any action is taken.

### Gateway Architecture

```
                    ┌──────────────────┐
                    │  ENTRY POINTS    │
                    │                  │
                    │  Telegram Bot    │
                    │  REST API        │
                    │  CI/CD Pipeline  │
                    │  Claude Code     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  EXECUTION       │
                    │  GATEWAY         │
                    │                  │
                    │  Auth            │
                    │  Rate Limiting   │
                    │  Input Validation│
                    │  Request Routing │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  RULE ENGINE     │
                    │  (verdict)       │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  ALLOW   │   │  WARN    │   │  BLOCK   │
        │  Execute │   │  Review  │   │  Deny    │
        └──────────┘   └──────────┘   └──────────┘
```

### Gateway Responsibilities

| Responsibility | Implementation |
|---------------|---------------|
| Authentication | Validate `x-service-token`, `x-api-key`, or bot token |
| Rate limiting | Token bucket algorithm, configurable per session and endpoint |
| Input validation | JSON schema validation, size limits, encoding checks |
| Input sanitization | `escapeHtml()` on user fields destined for output |
| Request routing | Forward validated input to rule engine |
| Response formatting | Consistent JSON response structure |
| Audit recording | Append audit entry after each evaluation |

### Current Implementation

The gateway is currently implemented in the `teoslinker-bot` service, which handles Telegram interactions and exposes REST API endpoints. The bot validates input, forwards to the risk engine, and returns formatted results.

## Alternatives Considered

### Distributed Enforcement

Each entry point handles its own policy enforcement independently.

- **Pro**: No single point of failure
- **Con**: Policy drift — different entry points may apply different rules
- **Con**: Duplicate implementation across entry points
- **Con**: Harder to audit — no centralized decision log
- **Verdict**: Rejected — policy consistency requires centralized enforcement

### Client-Side Enforcement

Policy enforcement occurs in the client/agent process before sending to the gateway.

- **Pro**: Low latency for blocked actions (no network call needed)
- **Con**: Cannot trust client-side enforcement for security decisions
- **Con**: Can be bypassed by modified clients
- **Con**: No centralized audit trail
- **Verdict**: Rejected — security decisions must be server-side

### Edge Enforcement

Policy enforcement at the CDN/edge layer (Cloudflare Workers, etc.).

- **Pro**: Low latency, distributed enforcement
- **Con**: Limited compute capability for complex rule evaluation
- **Con**: Edge functions have execution time limits
- **Con**: Adds deployment complexity
- **Verdict**: Deferred — can augment gateway with edge enforcement for rate limiting

## Consequences

### Positive

- **Consistent enforcement**: Same policy applies to every execution request
- **Centralized audit**: All decisions recorded in a single audit chain
- **Simpler entry points**: Entry points (Telegram, CI/CD) act as thin clients
- **Easier to update**: Policy changes apply at a single point
- **Clear dependency graph**: Gateway is the only caller of the rule engine

### Negative

- **Single point of failure**: Gateway outage blocks all execution
- **Bottleneck**: All requests must pass through the same gateway
- **Latency**: Every request incurs an additional network hop through the gateway
- **Scaling**: Gateway must scale with total request volume across all entry points

### Mitigations

- Gateway health monitoring with automated recovery
- Circuit breaker pattern prevents cascading failures (ADR-002)
- Stateless gateway design enables horizontal scaling
- Caching reduces rule engine load for repeated inputs
