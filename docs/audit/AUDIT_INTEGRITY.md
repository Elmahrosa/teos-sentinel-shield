# TEOS Sovereign Sentinel — Audit Integrity Model

**Classification:** Internal — Security Architecture  
**Component:** safe-ingestion-engine (storage) + risk-engine (generation)  
**Last Updated:** 2026-06-09  

---

## Design Principles

1. **Append-only** — Records may only be appended. No in-place modification, no deletion.
2. **Cryptographically verifiable** — Every entry carries an HMAC-SHA3-256 signature for integrity verification.
3. **Tamper-evident** — Each entry references the hash of the prior entry, forming a verifiable hash chain.
4. **Non-repudiable** — HMAC signatures bind entries to the signing authority.
5. **Minimal disclosure** — Audit entries contain verdicts and metadata, not raw scan payloads.

---

## 2. Audit Entry Format

Every audit entry is a single line of NDJSON (Newline-Delimited JSON):

```json
{
  "version": "1.0",
  "entryId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-06-09T14:30:00.000Z",
  "engineVersion": "2.2.0",
  "inputHash": "sha3-256:7d865e959b2466918c9863afca942d0fb89d7c9fac0c99b668c7ba4ef7295c0f",
  "verdict": "BLOCK",
  "score": 92,
  "matchedRules": [
    {
      "ruleId": "R07",
      "ruleName": "HARDCODED_SECRET",
      "score": 92
    }
  ],
  "requesterId": "tg:7815071893",
  "source": "telegram",
  "previousHash": "sha3-256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "entryHash": "sha3-256:7d865e959b2466918c9863afca942d0fb89d7c9fac0c99b668c7ba4ef7295c0f",
  "signature": "hmac-sha3-256:abc123def456..."
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Audit schema version (currently `"1.0"`) |
| `entryId` | UUIDv4 | Unique identifier for this audit entry |
| `timestamp` | ISO 8601 | UTC timestamp of verdict generation |
| `engineVersion` | string | Risk engine version at time of evaluation |
| `inputHash` | string | SHA3-256 hash of the normalized input (hex-encoded, not the raw input) |
| `verdict` | string | `ALLOW`, `WARN`, or `BLOCK` |
| `score` | integer | Aggregate confidence score (0–100) |
| `matchedRules` | array | Rules that triggered, with IDs and per-rule scores |
| `requesterId` | string | Identifier of the requesting user/service |
| `source` | string | Input source (`telegram`, `api`, `ci`) |
| `previousHash` | string | SHA3-256 hex hash of the preceding audit entry (empty for genesis entry) |
| `entryHash` | string | SHA3-256 hex hash of this entry's content (excluding the `signature` field) |
| `signature` | string | HMAC-SHA3-256 signature covering all preceding fields |

---

## 3. Hash Chain Construction

The audit log forms a forward hash chain where each entry cryptographically binds to its predecessor.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            AUDIT HASH CHAIN                              │
│                                                                          │
│  Genesis Entry                     Entry N                              │
│  ┌─────────────────────┐          ┌─────────────────────┐               │
│  │ entryId: "genesis"  │          │ entryId: "a1b2..."  │               │
│  │ previousHash:       │─────────▶│ previousHash:       │──────────────▶│
│  │   "00000000..."     │  ┌──────│   "e3b0c4..."       │               │
│  │ entryHash:          │  │      │                    │               │
│  │   "e3b0c4..."       │  │      │ entryHash:          │               │
│  │ signature: "..."    │  │      │   "7d865e..."       │               │
│  └─────────────────────┘  │      │ signature: "..."    │               │
│                           │      └─────────┬───────────┘               │
│                           │                │                            │
│                           │                ▼                            │
│                           │      ┌─────────────────────┐               │
│                           │      │   Verify Chain:     │               │
│                           └──────│   H(Entry N-1)  ==  │               │
│                                  │   Entry N.current?  │               │
│                                  └───────────────────────────          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Chain Properties

| Property | Guarantee |
|----------|-----------|
| **Immutability** | Modifying any field in any entry breaks the hash chain for all subsequent entries |
| **Ordering** | The `previousHash` field defines a strict linear ordering; reordering breaks the chain |
| **Non-repudiation** | HMAC signature binds each entry to the signing key |
| **Auditability** | Any party with the HMAC secret can verify the entire chain |

---

## 4. HMAC Signing Workflow

### ✅ CURRENTLY IMPLEMENTED

Each audit entry is signed using HMAC-SHA3-256 before storage:

```
1. Serialize all fields (excluding "signature") as canonical JSON
   ───────────────────────────────────────────────────────────
   Canonical JSON rules:
   • Keys sorted alphabetically
   • No whitespace between tokens
   • UTF-8 encoding

2. Compute SHA3-256 hash of the canonical JSON
   ───────────────────────────────────────────────────────────
   entryHash = SHA3-256(canonicalJSON)

3. Compute HMAC-SHA3-256 over the canonical JSON
   ───────────────────────────────────────────────────────────
   signature = HMAC-SHA3-256(auditSigningKey, canonicalJSON)

4. Store: canonical JSON + "entryHash" + "signature"
   ───────────────────────────────────────────────────────────
   Written as one line of NDJSON
```

### Signing Key Management

| Aspect | Current Implementation |
|--------|----------------------|
| **Key storage** | Environment variable (`AUDIT_SIGNING_KEY`) |
| **Key rotation** | Manual — requires re-signing from last verified entry |
| **Key compromise** | Generate new key, re-sign from last trusted checkpoint |
| **Multiple signers** | Not implemented (single key) |

---

## 5. Append-Only NDJSON Storage

### ✅ CURRENTLY IMPLEMENTED

Audit entries are stored as NDJSON (Newline-Delimited JSON) on the safe-ingestion-engine service:

```ndjson
{"version":"1.0","entryId":"...","verdict":"BLOCK",...,"signature":"..."}
{"version":"1.0","entryId":"...","verdict":"ALLOW",...,"signature":"..."}
{"version":"1.0","entryId":"...","verdict":"WARN",...,"signature":"..."}
```

### Storage Properties

| Property | Implementation |
|----------|---------------|
| **Append-only** | Entries are appended to the end of the file. No seek-and-modify operations. |
| **Line-delimited** | One JSON object per line. Standard NDJSON parsing. |
| **Atomic append** | OS-level file append with O_APPEND flag. Single-writer pattern. |
| **Compression** | Planned (gzip rotation for archival segments) |
| **Rotation** | New file per day (`audit-YYYY-MM-DD.ndjson`) |
| **Retention** | 90 days online, 1 year cold storage (planned) |

### Storage Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  safe-ingestion-engine                    │
│                                                           │
│  ┌──────────────┐                                        │
│  │  Risk Engine  │──▶ POST /ingest (HMAC-signed entry)   │
│  │  (producer)   │                                        │
│  └──────────────┘                                        │
│                                                           │
│  ┌──────────────┐                                        │
│  │  Audit Store  │──▶ Write to append-only NDJSON file   │
│  │  (consumer)   │                                        │
│  └──────────────┘                                        │
│                                                           │
│  ┌──────────────┐                                        │
│  │  Audit Query  │──▶ GET /audit?from=...&to=...         │
│  │  (reader)     │    GET /audit/verify                  │
│  └──────────────┘                                        │
│                                                           │
│  ┌──────────────┐                                        │
│  │  Storage      │──▶ /data/audit/audit-2026-06-09.ndjson│
│  │  (disk)       │    /data/audit/audit-2026-06-10.ndjson│
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Log Verification Process

### ✅ CURRENTLY IMPLEMENTED: Per-Entry Verification

```
VERIFY(auditEntry, signingKey) → VALID / INVALID

1. Extract "signature" field from entry
2. Compute canonical JSON of remaining fields
3. Compute expectedSignature = HMAC-SHA3-256(signingKey, canonicalJSON)
4. Compare:
   signature == expectedSignature → VALID
   signature != expectedSignature → INVALID (tampered)
5. Verify entryHash == SHA3-256(canonicalJSON)
```

### ✅ CURRENTLY IMPLEMENTED: Chain Verification

```
VERIFY_CHAIN(auditEntries[], signingKey) → VALID / BROKEN_AT(index)

1. For each entry at index i:
   a. Verify entry signature (per-entry verification)
   b. Verify entry.previousHash == entries[i-1].entryHash
   c. If any check fails → BROKEN_AT(i)
2. All checks pass → VALID
```

### 🔮 PLANNED: Automated Verification

| Feature | Status |
|---------|--------|
| ✅ Per-entry HMAC signature verification | Currently Implemented |
| ✅ Hash chain continuity check | Currently Implemented |
| 🔮 Cron job for periodic full-chain verification | Planned |
| 🔮 Tamper alerting (threshold-based) | Planned |
| 🔮 Public audit verification endpoint | Planned |
| 🔮 Split-key HMAC (multi-signer) | Planned |

---

## 7. Tamper Detection

### Detection Mechanisms

| Attack | Detection Method | Confidence |
|--------|-----------------|------------|
| Modify a field in an existing entry | `entryHash` mismatch on re-computation | High |
| Delete an entry in the middle of the chain | `previousHash` mismatch in the next entry | High |
| Insert a forged entry | `previousHash` does not match the real predecessor | High |
| Reorder entries | `previousHash` chain order violation | High |
| Replace entire log file | Genesis hash mismatch if checkpointed externally | High |
| Modify entry and recalculate hash | HMAC signature verification fails (attacker lacks signing key) | High |
| Truncate log from end | No missing-entry detection without external checkpointing | Medium |
| Bit-rot / partial file corruption | NDJSON parse failure + hash mismatch | Medium |

### Detection Flow

```
┌────────────────────────────────────────────────────────────┐
│                  TAMPER DETECTION FLOW                      │
│                                                             │
│  ┌──────────────┐    ┌──────────────────────────────┐     │
│  │  Read entry  │───▶│  Recompute entryHash         │     │
│  │  from chain  │    │  SHA3-256(canonicalJSON)     │     │
│  └──────────────┘    └──────────────┬───────────────┘     │
│                                     ▼                      │
│                           ┌──────────────────────┐        │
│                           │  entryHash match?     │        │
│                           │  ┌───┐    ┌───┐      │        │
│                           │  │Yes│    │No │      │        │
│                           │  └─┬─┘    └─┬─┘      │        │
│                           └────┼────────┼────────┘        │
│                                │        │                  │
│                                ▼        ▼                  │
│                        ┌──────────┐  ┌─────────────────┐  │
│                        │ Continue  │  │  TAMPER DETECTED│  │
│                        │ check     │  │  • Entry        │  │
│                        │ HMAC      │  │    modified     │  │
│                        │ signature │  │  • Alert:       │  │
│                        └────┬─────┘  │    CRITICAL     │  │
│                             │        └─────────────────┘  │
│                             ▼                              │
│                     ┌──────────────────────┐              │
│                     │  HMAC signature      │              │
│                     │  verify              │              │
│                     │  match?              │              │
│                     │  ┌───┐    ┌───┐     │              │
│                     │  │Yes│    │No │     │              │
│                     │  └─┬─┘    └─┬─┘     │              │
│                     └────┼────────┼───────┘              │
│                          │        │                       │
│                          ▼        ▼                       │
│                  ┌──────────┐  ┌─────────────────────┐   │
│                  │ Chain OK │  │  TAMPER DETECTED    │   │
│                  │ (next)   │  │  • Key compromise?  │   │
│                  └──────────┘  │  • Signature invalid │   │
│                                │  • Alert: CRITICAL  │   │
│                                └─────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 8. Evidence Retention Model

### Retention Tiers

| Tier | Duration | Location | Access |
|------|----------|----------|--------|
| Hot | 7 days | safe-ingestion-engine local storage | API query |
| Warm | 90 days | Compressed NDJSON with index | Slower query |
| Cold | 1 year | Object storage (S3-compatible) | Manual restore |
| Archive | Indefinite | Signed tarball with checksum manifest | Offline |

### Data Minimization

| Data | Stored? | Detail |
|------|---------|--------|
| Input hash (SHA3-256) | ✅ Yes | Enables verification without storing raw input |
| Raw input content | ❌ No | Not stored — audit includes hash only |
| Verdict + matched rules | ✅ Yes | Required for governance compliance |
| User/requester ID | ✅ Yes | Used for billing and abuse analysis |
| PII | ❌ No | Hashed with `PII_SALT` before any storage |
| API keys / tokens | ❌ No | Redacted from logs, never stored in audit |

### 🔮 PLANNED: Retention Enhancements

| Feature | Status |
|---------|--------|
| ✅ Daily NDJSON file rotation | Currently Implemented |
| ✅ Hot retention (7 days) | Currently Implemented |
| 🔮 Warm retention (90 days) with compression | Planned |
| 🔮 Cold storage (1 year) to object store | Planned |
| 🔮 Archive with signed checksum manifest | Planned |
| 🔮 Automated retention policy enforcement | Planned |
| 🔮 GDPR-compliant purge capability | Planned |

---

## 9. Threat Scenarios & Coverage

| Scenario | Can Detect? | How |
|----------|-------------|-----|
| Attacker modifies verdict from BLOCK to ALLOW | ✅ | entryHash changes → HMAC verification fails |
| Attacker inserts fake audit entry | ✅ | previousHash chain break → verification fails |
| Attractor truncates audit log | ⚠️ Partial | No detection without external checkpoint (requires off-chain hash publication) |
| Attacker replays old entries | ✅ | Timestamp + entryId uniqueness check |
| Attacker compromises signing key | ⚠️ Partial | New key required; existing entries remain verifiable with old key |
| Insider admin tampers before signing | ❌ Not directly | Relies on access controls and separation of duties |
| Bit-rot / storage corruption | ✅ | NDJSON parse failure + hash mismatch |

---

## 10. Implementation Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| SHA3-256 hashing of audit entries | ✅ Implemented | Used for entryHash and previousHash |
| HMAC-SHA3-256 signing | ✅ Implemented | Single signing key via env var |
| NDJSON append-only storage | ✅ Implemented | Daily file rotation |
| Per-entry signature verification | ✅ Implemented | Verification endpoint available |
| Hash chain continuity check | ✅ Implemented | previousHash validation |
| Full-chain automated verification | 🔮 Planned | Cron job for periodic audit |
| Tamper alerting | 🔮 Planned | Alert when chain verification fails |
| External checkpoint publication | 🔮 Planned | Publish chain head hash to immutable store (e.g., blockchain) |
| Split-key HMAC (multi-signer) | 🔮 Planned | Requires constitutional amendment |
| Cold storage archive | 🔮 Planned | 1-year retention target |
| Public verification endpoint | 🔮 Planned | Allow third-party audit verification |

---

## 11. References

- **Storage service:** safe-ingestion-engine (`github.com/Elmahrosa/safe-ingestion-engine`)
- **Audit endpoint:** `GET /audit` (risk-engine), `POST /ingest` (safe-ingestion-engine)
- **Key management:** `SECURITY_CHECKLIST.md` — section 1 (Secrets Management)
- **Incident response:** `docs/runbooks/INCIDENT_RESPONSE.md`

---

*This document describes the audit integrity architecture. For operational details, refer to the safe-ingestion-engine service documentation.*
