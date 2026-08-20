# Audit Logging Specification — TEOS Sentinel Shield

**Classification:** INTERNAL — Compliance
**Last Updated:** 2026-06-18

---

## Audit Events

All auditable events must be logged with the following structure:

```json
{
  "timestamp": "2026-06-18T12:00:00.000Z",
  "eventId": "evt_<uuid>",
  "eventType": "<event_type>",
  "userId": "<telegram_id>",
  "service": "<service_name>",
  "action": "<action_description>",
  "resource": "<affected_resource>",
  "result": "success|failure",
  "metadata": {}
}
```

## Event Types

### Authentication Events
| Event | Description | Retention |
|-------|-------------|-----------|
| `activation.attempt` | User attempts activation | 90 days |
| `activation.success` | Successful activation | 90 days |
| `activation.failure` | Failed activation attempt | 90 days |
| `admin.login` | Admin dashboard login | 1 year |
| `admin.action` | Admin action (grant, purge) | 1 year |

### Scan Events
| Event | Description | Retention |
|-------|-------------|-----------|
| `scan.request` | Scan request received | 90 days |
| `scan.complete` | Scan completed with verdict | 90 days |
| `scan.failure` | Scan failed | 90 days |
| `scan.blocked` | Code BLOCKED by rules | 1 year |

### Billing Events
| Event | Description | Retention |
|-------|-------------|-----------|
| `credits.granted` | Credits granted to user | 1 year |
| `credits.consumed` | Credits consumed by scan | 1 year |
| `payment.webhook` | Dodo Payments webhook received | 1 year |
| `payment.failure` | Payment processing failure | 1 year |

### System Events
| Event | Description | Retention |
|-------|-------------|-----------|
| `deployment.start` | Deployment started | 90 days |
| `deployment.complete` | Deployment completed | 90 days |
| `deployment.failure` | Deployment failed | 90 days |
| `config.change` | Configuration change | 1 year |
| `secret.rotation` | Secret rotation | 1 year |

## Log Format

All services must log in NDJSON format (newline-delimited JSON):

```
{"timestamp":"...","level":"info","eventId":"evt_...","eventType":"scan.request",...}
{"timestamp":"...","level":"info","eventId":"evt_...","eventType":"scan.complete",...}
```

## Storage

- **Active logs**: Stored in container logs (JSON-file driver, 10MB max, 3 rotations)
- **Archive**: `safe-ingestion-engine` (append-only NDJSON, when unarchived)
- **Retention**: Minimum 90 days for operational logs, 1 year for audit-critical events

## Access Control

- Audit logs are append-only
- Logs cannot be modified or deleted by service code
- Log access requires admin-level authentication
- Log export requires audit trail
