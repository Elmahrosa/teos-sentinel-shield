# ADR-003: Audit Chain Design

**Status:** Accepted (Implemented)  
**Date:** 2026-05-20  
**Engine Version:** v3.0.0  
**Deciders:** Architecture Team, Compliance Lead

---

## Context

The platform must record every evaluation decision in an audit trail that is tamper-evident, verifiable, and suitable for compliance and forensic use. The audit trail must persist across service restarts and deployments, and must be queryable for operational visibility.

## Decision

Implement a SHA3-256 hash-chained, HMAC-signed, append-only NDJSON audit store.

### Audit Entry Structure

```
Entry[N-1].hash = SHA3-256(Entry[N-1])
Entry[N].prevHash = Entry[N-1].hash
Entry[N].hash = SHA3-256(Entry[N])
Entry[N].hmac = HMAC-SHA256(Entry[N].hash, secret)
```

### Storage Format

NDJSON (newline-delimited JSON) — each entry is a single JSON object on one line, appended to the end of the file. No existing entry is ever modified or deleted.

### Hash Algorithm

SHA3-256 is selected over SHA-256 for:
- Resistance to length extension attacks
- Different internal structure from SHA-2 (diversification)
- NIST-standardized post-quantum consideration

### Signing

HMAC-SHA256 provides:
- Origin authentication (only parties with the shared secret can produce valid entries)
- Integrity verification (any modification changes the HMAC)
- Non-repudiation (signer cannot deny producing an entry)

### Optional Encryption

AES-256-GCM encryption can be applied to entries using a customer-provided key (`SENTINEL_AUDIT_KEY`). This is optional and controlled by the deployer.

### Query Interface

The `/audit` endpoint returns entries in reverse chronological order. The endpoint is bound to internal network in production configurations.

## Alternatives Considered

### Relational Database (PostgreSQL)

Store audit entries in a relational database with standard CRUD operations.

- **Pro**: Rich query capability, indexing, joins
- **Con**: Database tables are inherently mutable — entries can be modified or deleted
- **Con**: Database-level permissions can be bypassed by privileged users
- **Con**: Auditing requires supplementary controls (triggers, audit tables)
- **Verdict**: Rejected — insufficient tamper evidence without additional complexity

### Blockchain

Store audit entries on a public or permissioned blockchain.

- **Pro**: Decentralized, highly tamper-evident, transparent
- **Con**: High latency (block confirmation times)
- **Con**: Cost per entry (gas fees for public chains)
- **Con**: Operational complexity of managing blockchain nodes
- **Con**: Over-engineered for a centralized audit requirement
- **Verdict**: Rejected — cost and complexity outweigh benefits for this use case

### Logging Library (Winston, Bunyan)

Use a standard logging library with file output.

- **Pro**: Simple, well-understood
- **Con**: No built-in tamper evidence
- **Con**: Log files can be truncated or modified without detection
- **Verdict**: Rejected — insufficient integrity guarantees

## Consequences

### Positive

- **Tamper-evident**: Any modification to any entry breaks the hash chain for all subsequent entries
- **Verifiable**: Any party with access to the audit file and HMAC key can verify chain integrity
- **Append-only**: No mechanism exists to modify or delete past entries
- **Self-contained**: Each entry contains all metadata needed for verification
- **Portable**: NDJSON can be read by any programming language or tool

### Negative

- **Not decentralized**: The audit store is a single file on a single volume
- **Monotonic growth**: The audit file grows indefinitely (mitigated by log rotation and archival)
- **Sequential query only**: No indexing — querying requires scanning the file
- **HMAC key management**: The signing key must be protected; key rotation invalidates existing signatures

### Mitigations

- Audit file rotation with archival (preserving chain integrity across files)
- HMAC key stored in environment variable, never logged
- Optional AES-256-GCM encryption for sensitive deployments
- Regular chain integrity verification as part of operational monitoring
