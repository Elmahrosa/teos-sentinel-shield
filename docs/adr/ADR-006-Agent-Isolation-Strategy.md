# ADR-006: Agent Isolation Strategy

**Status:** Accepted (Implemented)  
**Date:** 2026-05-20  
**Engine Version:** v3.0.0  
**Deciders:** Architecture Team, Security Lead

---

## Context

AI agents executing code or commands on a host system can affect the host itself. A compromised or misconfigured agent could modify system files, access sensitive data, or affect other processes on the same host. The platform must isolate agents from the host system and from each other.

## Decision

Implement containerized deployment with the following isolation properties:

- **Non-root user**: Services run as a dedicated `teos` user (not root) inside containers
- **No privileged mode**: All containers use `privileged: false`
- **Read-only root filesystem**: Container root filesystem is read-only where feasible
- **Memory limits**: Per-service memory caps prevent resource exhaustion
- **Internal networking**: Inter-service communication via Docker bridge network
- **Health checks**: Container HEALTHCHECK ensures process health is monitored
- **Init process**: `tini` or similar init system for proper signal handling

### Docker Compose Configuration

```yaml
# Each service follows this pattern:
risk-engine:
  user: "teos:teos"
  mem_limit: 512m
  read_only: true
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL
```

### Port Exposure

- Redis: No ports exposed (internal network only)
- Risk Engine: 127.0.0.1:8090 only
- Activation Service: 127.0.0.1:8080 only
- Bot: 127.0.0.1:8082 only
- Sentinel Dashboard: 127.0.0.1:8081 only

### Sub-Agent Isolation

Within the Claude Code integration, sub-agents inherit the parent guard configuration but receive independent session tracking. Each sub-agent has its own rate limit counter, audit chain entries, and session ID.

## Alternatives Considered

### VM Per Agent

Run each agent in a separate virtual machine.

- **Pro**: Strongest isolation boundary
- **Con**: High resource overhead (OS, memory, disk per VM)
- **Con**: Slow startup time (seconds vs milliseconds for containers)
- **Con**: Operational complexity of managing VM fleet
- **Verdict**: Rejected — overhead too high for per-call/agent governance

### Same Process (No Isolation)

Run agents in the same process as the host application.

- **Pro**: Zero isolation overhead
- **Con**: Agent can access all host resources
- **Con**: Any agent compromise is a host compromise
- **Con**: No resource limits per agent
- **Verdict**: Rejected — unsafe

### Kubernetes Namespace Isolation

Run each agent in a separate Kubernetes namespace.

- **Pro**: Good isolation with Kubernetes-native tooling
- **Con**: Requires Kubernetes cluster (operational overhead)
- **Con**: Overkill for current scale requirements
- **Verdict**: Deferred — can adopt as scale increases

## Consequences

### Positive

- **Good isolation**: Container boundary with non-root user prevents most escape vectors
- **Resource limits**: Memory caps prevent one service from starving others
- **Network isolation**: Internal bridge network prevents unauthorized access
- **No privileged containers**: Reduces container breakout risk
- **Health monitoring**: Docker HEALTHCHECK enables automated recovery
- **Portable isolation**: Same Docker configuration works on-premise, air-gapped, or Railway

### Negative

- **Performance overhead**: Containerization adds minimal but non-zero overhead
- **Not VM-level isolation**: Container escape vulnerabilities exist
- **Shared kernel**: All containers share the host kernel
- **No orchestration**: Docker Compose does not provide the isolation guarantees of Kubernetes

### Mitigations

- `no-new-privileges:true` and `drop ALL capabilities` reduce kernel attack surface
- Non-root user limits post-exploitation impact
- Internal network-only exposure reduces network attack surface
- Regular container image scanning for CVEs
