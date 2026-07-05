# TEOS Sovereign — Production Observability Plan

**Status:** Planning — No Implementation Yet
**Goal:** Production-grade observability without compromising governance or performance.

---

## Principles

1. **Telemetry must never block execution.** Monitoring is advisory — not a gate.
2. **No raw code in telemetry.** Scan payloads are never stored in logs or metrics.
3. **Alert thresholds must be tuned to beta traffic.** No pager-flooding.
4. **Observability must be auditable.** Alert decisions, dashboard configs, and log retention policies are version-controlled.

---

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Services   │───▶│  Loki        │───▶│  Grafana    │
│  (JSON logs)│    │  (log store) │    │  (dashboards)│
└─────────────┘    └──────────────┘    └─────────────┘
       │                                       │
       │  Prometheus metrics                   │  Alertmanager
       │  (/metrics endpoints)                 │  (thresholds)
       ▼                                       ▼
┌──────────────┐                      ┌──────────────┐
│  Prometheus  │                      │  BetterStack │
│  (TSDB)      │                      │  (uptime)    │
└──────────────┘                      └──────────────┘

┌──────────────┐
│  UptimeRobot │
│  (external)  │
└──────────────┘
```

---

## Component Plan

### 1. Structured Logging (Already Active)

**Current state:** All services log structured JSON via Pino (Node.js) or Python logging. Correlation IDs on every request.

**Retention:**
| Environment | Retention | Storage |
|-------------|-----------|---------|
| Development | 7 days | Docker json-file (3 files, 10 MB each) |
| Production | 30 days | Loki + object storage |

**Log levels:**
| Level | Use | Volume |
|-------|-----|--------|
| `trace` | Debugging | Low |
| `debug` | Development | Low |
| `info` | Normal operations | High |
| `warn` | Degraded but functional | Low |
| `error` | Operational failures | Very low |
| `fatal` | Unrecoverable | Critical only |

### 2. BetterStack (Heartbeat Monitoring)

**Config location:** `monitoring/betterstack.md`

**Implementation:**
- Add heartbeat URL to each service's health endpoint
- BetterStack pings `/health` every 60s
- Alert if 3 consecutive pings fail
- Integrations: Email, Slack, Telegram

**Services to monitor:**
- `https://<host>:8082/health` — teoslinker-bot
- `https://<host>:8090/health` — risk-engine
- `https://<host>:8080/health` — activation-service
- `https://<host>:8000/health` — safe-ingestion
- `https://<host>:8081/` — sentinel-shield

### 3. UptimeRobot (External Uptime)

**Config location:** `monitoring/uptimerobot.yml`

**Frequency:** Every 5 minutes from external monitors.
**Alert after:** 2 consecutive failures.
**Channels:** Email, Slack webhook.

### 4. Prometheus (Metrics Collection)

**Endpoints already exposed:**
- teoslinker-bot: `/metrics` (prom-client, default metrics)
- risk-engine: `/metrics`
- activation-service: `/metrics`

**Metrics to collect:**
| Category | Examples |
|----------|----------|
| HTTP | request count, latency (p50/p95/p99), error rate |
| Runtime | memory, CPU, event loop lag |
| Business | scans executed, verdicts by type, credits consumed |
| Governance | gate failures, drift events, telemetry drops |
| Health | uptime, restart count, dependency status |

**Scrape interval:** 15s (default)
**Retention:** 15 days

### 5. Grafana (Dashboards)

**Dashboards to create:**
1. **Service Health** — Uptime, restart count, health check status per service
2. **Request Pipeline** — Throughput, latency, error rate across gateway → risk-engine → activation
3. **Business Metrics** — Scans by verdict, credit consumption, active users
4. **Governance** — Safety gate passes/fails, drift events, resource guard contention
5. **Infrastructure** — Memory, CPU, disk per container

### 6. Loki (Log Aggregation)

**Collector:** Promtail or Docker plugin
**Parse:** Structured JSON logs by service name and correlation ID
**Retention:** 30 days
**Query examples:**
```
{service="teoslinker-bot"} |= "error"
{service="risk-engine"} |= "BLOCK"
{service="activation-service"} |= "credit"
```

### 7. Alertmanager (Alerting)

**Thresholds (beta):**
| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| Container Down | Health check fails 3x | Critical | Page on-call |
| High Error Rate | >5% errors over 5 min | Warning | Investigate |
| High Latency | p99 > 5s over 5 min | Warning | Investigate |
| Memory Cap | >80% of container limit | Warning | Scale up |
| Governance Failure | Safety gate blocks | Info | Review |
| Credit Exhaustion | Credits < 10% remaining | Info | Notify admin |

### 8. Incident Response Flow

```
Alert triggers
    │
    ▼
Auto-diagnose (gather logs, metrics, health)
    │
    ├── Known pattern?
    │   ├── Yes → Run recovery playbook (runbook in docs/runbooks/)
    │   └── No  → Escalate to engineer
    │
    ▼
Resolve → Document → Update runbooks
```

---

## Implementation Order

| Priority | Component | Effort | Dependencies |
|----------|-----------|--------|--------------|
| P0 | BetterStack heartbeats | 15 min | Public URLs for each service |
| P0 | UptimeRobot monitors | 15 min | Public URLs for each service |
| P1 | Prometheus scrape config | 1 hour | docker-compose addition |
| P1 | Grafana dashboards | 2 hours | Prometheus data |
| P2 | Loki + Promtail | 2 hours | Shared storage volume |
| P2 | Alert rules | 1 hour | Prometheus + Grafana |
| P3 | Incident runbooks | 2 hours | Documented patterns |

---

## Anti-Patterns to Avoid

- **Telemetry backpressure** — Never let monitoring slow down scan execution
- **Raw code in logs** — Scan payloads must never appear in structured logs
- **Unbounded retention** — 30-day cap on logs, 15-day on metrics
- **Chatty alerts** — Beta threshold tuning before enabling any pager integration
- **Dependency on external SaaS for core monitoring** — BetterStack/UptimeRobot are supplementary; Prometheus + Loki are primary

---

*This document defines the observability target. Implementation begins post-closed-beta stabilization.*
