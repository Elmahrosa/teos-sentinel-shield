# ADR-005: MCP Security Controls

**Status:** Accepted (Implemented)  
**Date:** 2026-05-20  
**Engine Version:** v3.0.0  
**Deciders:** Architecture Team

---

## Context

Model Context Protocol (MCP) tools provide AI agents with access to external capabilities — bash execution, file operations, network requests, and more. If ungoverned, an MCP tool can execute unsafe operations at an agent's request. The platform must secure MCP tool calls without introducing prohibitive latency.

## Decision

Pre-scan all MCP tool calls through the TEOS rule engine before execution. The Sentinel Guard intercepts tool calls at the `before_tool_execution` hook level, evaluates the input against the 28-rule set, and either allows, warns, or blocks execution.

### Integration Points

| Integration | Mechanism | Latency Budget |
|-------------|-----------|---------------|
| Claude Code | `before_tool_execution` hook via opencode.json | 600ms |
| Claude Agent SDK | `SentinelGuard` class in Node.js | 600ms |
| CLI tool | `sentinel-guard.sh` wrapper | 600ms |

### Sentinel Guard Features (v2.0)

| Feature | Purpose | Configuration |
|---------|---------|---------------|
| Redis Cache | Cache verdicts for identical inputs (300s TTL) | `SENTINEL_CACHE_TTL` |
| Rate Limiter | Token bucket, 60 checks/min per session | `SENTINEL_RATE_LIMIT` |
| Circuit Breaker | 3 failures → OPEN 30s, then HALF_OPEN probe | `SENTINEL_CB_THRESHOLD` |
| Session Tracking | Per-session isolation for sub-agents | Automatic |
| Escalation | 3+ consecutive BLOCKs → auto-escalate | Built-in |

### Tool Classification

| Category | Examples | Check Behavior |
|----------|----------|---------------|
| Always check | `bash`, `write`, `edit` | Full scan via rule engine |
| Never check | `read`, `glob`, `grep` | Pass through (read-only) |
| Configurable | Per deployment configuration | Via opencode.json |

## Alternatives Considered

### Post-Hoc Auditing

Allow all MCP tool calls and audit them after execution.

- **Pro**: Zero latency impact
- **Con**: Malicious operations execute before any detection
- **Con**: Audit-only approach cannot prevent damage
- **Verdict**: Rejected — execution prevention is required

### No Controls

Allow all MCP tool calls with no governance.

- **Pro**: Maximum flexibility for agents
- **Con**: Unsafe — any prompt injection or agent error can execute dangerous commands
- **Verdict**: Rejected — unsafe

### Client-Side Enforcement

Implement security checks within the agent process itself.

- **Pro**: Low latency (no network call)
- **Con**: Security logic runs in the same process as the agent
- **Con**: Can be bypassed or disabled by the agent
- **Verdict**: Rejected — insufficient separation of duties

## Consequences

### Positive

- **Execution prevention**: Malicious or risky MCP tool calls are blocked before execution
- **Consistent governance**: Same rule set applies to all MCP tools
- **Performance**: Redis cache enables sub-300ms evaluation for cached inputs
- **Resilience**: Circuit breaker prevents cascading failures
- **Sub-agent isolation**: Each sub-agent gets an independent session with its own rate limit

### Negative

- **Latency overhead**: Each tool call incurs at minimum the rule engine round-trip time
- **Cache staleness**: Cached verdicts may not reflect updated rules
- **Rate limit friction**: Legitimate high-frequency tool calls may be blocked

### Mitigations

- 600ms timeout budget accommodates rule engine evaluation + network latency
- Redis cache TTL balances freshness with performance
- Configurable rate limits per deployment
- "Never check" classification for read-only tools avoids unnecessary overhead
