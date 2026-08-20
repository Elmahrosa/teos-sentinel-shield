# TEOS Sentinel — Strategic Recommendations & v4 Foundation

**Date:** 2026-06-12  
**Classification:** Strategic Architecture

---

## Executive Summary

This document consolidates all findings from the audit and proposes a ranked, phased implementation plan. The central architectural question — **what happens when a threat matches no rule** — receives a definitive answer that serves as the foundation for TEOS Sentinel v4.

---

## Ranked Findings (All Audits)

### Critical — Must Fix Before v3.1 Release

| # | Finding | Source | Effort | Impact |
|---|---------|--------|--------|--------|
| C1 | **Encoded payload detection rate: 0%** | Red Team | 2-3 days | Any adversary with non-base64 encoding bypasses all rules |
| C2 | **Multi-stage chain detection: 0%** | Red Team | 3-5 days | Attack split across messages is invisible |
| C3 | **EVM-ACCESS-CONTROL ~80% false positive rate** | EVM Review | 1 day | EVM scanner unusable for enterprise |
| C4 | **No ERC-20 semantic checks** | EVM Review | 2-3 days | Most common EVM bug not detected |
| C5 | **No Flash Loan detection (Solana)** | Solana Review | 2 days | Most common Solana DeFi attack vector |
| C6 | **No Oracle manipulation detection** | Solana + EVM | 3 days | #1 DeFi attack vector across both chains |
| C7 | **No heuristic suspicion scoring layer** | Threat Model | 5-7 days | Unknown threats return ALLOW with no signal |
| C8 | **EVM coverage: 10 rules vs 29 Solana rules** | EVM Review | 10 days | EVM is critically under-covered |

### High — Must Fix Before v3.2

| # | Finding | Source | Effort |
|---|---------|--------|--------|
| H1 | **No Signature replay detection** | EVM Review | 1-2 days |
| H2 | **No Token 2022 coverage** | Solana Review | 2-3 days |
| H3 | **No Account reinitialization check** | Solana Review | 1 day |
| H4 | **No Supply-chain typosquatting** | Threat Model | 3-5 days |
| H5 | **Prompt injection 90% miss rate** | Red Team | 3-5 days |
| H6 | **No SSO/SAML/OIDC** | Enterprise | 10-15 days |
| H7 | **No cryptographic audit chain** | Enterprise | 5-7 days |
| H8 | **Severity thresholds inconsistent across engines** | Rule Audit | 1 day |

### Medium — v3.3

| # | Finding | Source |
|---|---------|--------|
| M1 | **No pre-0.8 arithmetic overflow detection** | EVM Review |
| M2 | **Unicode/bidi/confusable normalization** | Threat Model |
| M3 | **Session-level chain detection** | Red Team |
| M4 | **LP lock verification in token scanner** | Solana Review |
| M5 | **Context-aware rule thresholds** | Enterprise |
| M6 | **Docker/non-standard escape patterns** | Red Team |
| M7 | **RBAC for enterprise** | Enterprise |

---

## Implementation Phases

### Phase 1: Security Foundation (Immediate — 2 weeks)

**Goal:** Close critical gaps that enable total bypass

| Week | Deliverable | Depends On |
|------|-------------|------------|
| W1 | Heuristic suspicion scoring layer | None — new module |
| W1 | Encoding-agnostic detection (85/hex/gzip/xor) | Suspicion layer |
| W1 | EVM-ACCESS-CONTROL fix (reduce to state-modifying only) | None — regex change |
| W1 | ERC-20 return value + approve race rules | None — new rules |
| W2 | Solana Flash Loan rules | None — new rules |
| W2 | Oracle manipulation (Solana + EVM) | None — new rules |
| W2 | Unify severity thresholds across engines | None — config change |

### Phase 2: Enterprise Foundation (3-4 weeks)

**Goal:** Enable enterprise sales conversations

| Week | Deliverable |
|------|-------------|
| W3 | SSO/SAML/OIDC — Okta + Azure AD |
| W3 | Cryptographic audit chain (SHA-256 linked) |
| W3 | Multi-party approval for BLOCK override |
| W4 | RBAC (Admin, Auditor, Developer, Viewer) |
| W4 | Policy-as-code with versioning |

### Phase 3: Platform Expansion (5-8 weeks)

**Goal:** Industry-leading detection coverage

| Week | Deliverable |
|------|-------------|
| W5 | EVM expansion from 10 to 25+ rules |
| W5 | Token 2022 coverage |
| W5 | Account reinitialization rules |
| W6 | Supply-chain typosquatting analysis |
| W6 | Pre-0.8 arithmetic detection |
| W7 | Unicode/bidi normalization layer |
| W7 | Session-level chain detection |
| W7 | LP lock verification in token scanner |
| W8 | Prompt injection pattern expansion + leetspeak |

### Phase 4: v4.1 Launch (9-12 weeks)

**Goal:** Enterprise-ready with REVIEW verdict

| Week | Deliverable |
|------|-------------|
| W9 | REVIEW verdict fully implemented across all endpoints |
| W9 | Governance controls (policy testing, dry-run) |
| W10 | On-premises deployment package (Helm chart) |
| W10 | SOC 2 readiness documentation |
| W11 | Compliance certification audit kickoff |
| W12 | v4.1 launch with all critical/high findings resolved |

---

## Architecture Decisions

### Decision 1: Deterministic Rules Remain Authoritative

**Rule:** The deterministic rule engine (258 rules) is the final authority. Heuristic suspicion can only **upgrade** verdicts (ALLOW → WARN → BLOCK), never downgrade. This preserves the auditability and repeatability that make TEOS Sentinel enterprise-grade.

### Decision 2: Heuristic Layer is Stateless

**Design:** The heuristic suspicion scoring layer evaluates each input independently, without maintaining state between requests. This avoids the complexity of session management, prevents state manipulation attacks, and keeps the system horizontally scalable.

*Exception:* Chain detection is optionally stateful when session tracking is enabled. Session tracking is off by default and must be explicitly enabled for enterprise deployments.

### Decision 3: REVIEW Verdict Replaces ALLOW for Unknown Threats

**Design:** When a threat matches no deterministic rule BUT triggers heuristic suspicion above threshold, the system returns **REVIEW** instead of ALLOW. This is a new verdict that requires human intervention. It is not a third classification alongside ALLOW/WARN/BLOCK — it is a **procedural lockdown** that says "I cannot classify this, a human must decide."

### Decision 4: No Embedding Systems, No Vector Databases, No LLM

**Rationale:** TEOS Sentinel v4 remains deterministic + heuristic. The heuristic layer uses hand-crafted signals, not machine learning. This preserves:
- **Determinism:** Same input always produces same suspicion score
- **Auditability:** Every suspicion signal can be explained and traced
- **Speed:** Heuristic evaluation is sub-millisecond (regex-based)
- **Compliance:** No black-box model, no hallucination risk

### Decision 5: Cryptographic Audit Chain

**Design:** Each audit entry includes:
```json
{
  "hash": "SHA256(previous_hash + timestamp + input + verdict + score)",
  "previous_hash": "...",
  "timestamp": "...",
  "input_hash": "SHA256(input)",
  "verdict": "BLOCK",
  "score": 85,
  "signature": "ED25519(hash, sentinel_signing_key)"
}
```

Verification: Re-compute hash chain from genesis, verify ED25519 signatures. Any break in the chain or invalid signature = tampered audit log.

---

## The v4 Foundation Answer

### The Question

> If a threat does not match any existing rule, what mechanism prevents TEOS Sentinel from incorrectly returning ALLOW?

### The Answer

**The REVIEW verdict.**

It is enabled by three layers that work together:

```
Layer 1: Deterministic Matching (258 rules)
    ↓ No match found
Layer 2: Heuristic Suspicion Scoring (0-100)
    ↓ Score > 60? → REVIEW, not ALLOW
Layer 3: Threshold Implementation
    ↓ Suspicion 0-59: ALLOW (logged as LOW_CONFIDENCE)
    ↓ Suspicion 60-79: REVIEW → WARN with human review flag
    ↓ Suspicion 80-100: REVIEW → BLOCK with mandatory human review
```

**Why this solves the problem:**

1. **The REVIEW verdict is a third outcome**, not a confidence score on ALLOW. It communicates "I don't know what this is, but it looks suspicious" rather than "this seems safe."

2. **Heuristic signals are deterministic** — same input always produces same suspicion score. This preserves the core value proposition of TEOS Sentinel (determinism, auditability, repeatability).

3. **The suspicion threshold is configurable** — enterprises can set their own REVIEW threshold (default 60). Conservative organizations set 40, experimental organizations set 80.

4. **The audit trail records the full decision** — which rules were checked, which signals fired, the suspicion breakdown, the final verdict. Every ALLOW that should have been BLOCK is traceable.

5. **No machine learning required** — the heuristic signals are hand-crafted from the red team findings. Every signal corresponds to a real evasion technique discovered during adversarial testing.

**Without this mechanism:** Any threat that doesn't match a known pattern returns ALLOW. The red team confirmed that 87% of adversarial payloads evade current rules. The REVIEW verdict closes this gap without requiring an LLM, vector database, or semantic infrastructure.

**This is the TEOS Sentinel v4 foundation.** Not AI. Not embeddings. Not autonomous agents. **A deterministic three-layer defense where unknown threats are explicitly flagged for human review rather than silently accepted as safe.**

---

## Cost-Benefit Summary

| Investment | Cost | Benefit |
|-----------|------|---------|
| Heuristic suspicion layer | 5-7 dev days | +40% detection for unknown threats |
| Encoding-agnostic detection | 2-3 dev days | Closes 0% detection rate for encoded payloads |
| EVM expansion (10 → 25 rules) | 10 dev days | EVM coverage becomes enterprise-grade |
| Session chain detection | 3-5 dev days | Closes multi-stage attack gap |
| REVIEW verdict plumbing | 3-5 dev days | Foundation for v4 — affects all endpoints |
| SSO/SAML | 10-15 dev days | Unblocks enterprise sales pipeline |
| Cryptographic audit chain | 5-7 dev days | Unblocks SOC 2 audit |
| **TOTAL** | **~40 dev days** | v4.1 Enterprise-ready release |

---

*Strategic audit completed: 2026-06-12T04:00:00Z*
