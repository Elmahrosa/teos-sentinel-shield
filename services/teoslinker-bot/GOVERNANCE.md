# TEOS Sentinel — System Constitution

## 1. Purpose

TEOS Sentinel is an **AI Execution Risk Adjudication Engine**. Its sole purpose is to determine, with calibrated confidence, whether a given command, script, or artifact should be ALLOWed, WARNed, or BLOCKed from execution.

It is not:
- A code quality tool
- A SAST platform
- A surveillance system
- A general-purpose scanner
- A SIEM replacement

## 2. Core Principles

### 2.1 False Positives Are Existentially Dangerous
A system that cries wolf too often will be ignored or disabled. Prefer calibrated WARN over low-confidence BLOCK. Downgrade when confidence is insufficient.

### 2.2 Uncertainty Is Information, Not Failure
Epistemic states (CONFIDENT, PROVISIONAL, LOW_CONFIDENCE, CONFLICTED, INSUFFICIENT_CONTEXT, UNKNOWN) communicate what the system knows — and what it does not know. These are not errors.

### 2.3 Decision Path Always Wins
Telemetry, auditing, logging, and observability must never block, delay, or degrade the adjudication path. All monitoring is fire-and-forget.

### 2.4 Telemetry Serves Adjudication, Not Visibility
Collect only signals that improve:
- Verdict quality
- Trust calibration
- Operational resilience

If a signal does not serve one of these three, do not collect it.

### 2.5 Rules Must Decay
Rules that accumulate false positives, reversals, or overrides lose confidence over time. The decay function `confidence_t = confidence_0 * e^(-lambda * drift)` ensures stale or noisy rules are automatically de-prioritized.

## 3. Adjudication Philosophy

### 3.1 Verdict Formation
```
Verdict = f(Risk, Confidence, Consensus, Context, RuleSeverity, EvidenceQuality)
```

### 3.2 Epistemic Hierarchy
- **CONFIDENT**: High confidence, unanimous consensus — act decisively
- **PROVISIONAL**: Single source or moderate confidence — treat as guidance
- **LOW_CONFIDENCE**: Engines disagree or degraded — prefer WARN over BLOCK
- **CONFLICTED**: Fundamental disagreement (BLOCK vs ALLOW) — escalate to human
- **INSUFFICIENT_CONTEXT**: Input too short or ambiguous — do not block
- **UNKNOWN**: No engines reachable — do not block, flag infrastructure issue

### 3.3 The Low-Confidence Rule
When any low-confidence condition triggers a BLOCK, the verdict is automatically downgraded to WARN. A BLOCK requires confidence.

## 4. Operational Constraints

### 4.1 Webhook Production Default
Polling mode is forbidden in production. All production deployments must use webhook mode with a valid BOT_WEBHOOK_URL and BOT_WEBHOOK_SECRET.

### 4.2 Memory Bounds
- Heap limit: 200 MB
- RSS limit: 256 MB
- Request body limit: 10 KB
- Request size limit configurable via REQUEST_SIZE_LIMIT env var

### 4.3 Rate Limits
- Global: 100 requests per 15-minute window
- Health endpoints (/live, /ready, /health) are exempt
- Per-user cooldown: 3 seconds between scans

### 4.4 Timeouts
- MCP engine scan: 8 seconds
- Sentinel cloud scan: 5 seconds
- GitHub repo fetch: 15 seconds
- Raw file download: 10 seconds

### 4.5 Input Limits
- Scan input: 10 KB max
- GitHub files: 200 KB per file, 5 MB total, 100 files max
- PDF report: 5 MB max
- Report reasons: 20 lines max

## 5. Telemetry Governance

### 5.1 Collect Only
- Verdict signals (type, confidence, consensus, latency)
- Runtime signals (duration, queue pressure, error counts)
- Security signals (replay attempts, auth failures, rate-limit hits)
- Trust signals (feedback, overrides, reversals)

### 5.2 Never Collect
- Full source repositories
- Raw secrets, tokens, credentials
- Entire conversation histories
- Unnecessary PII
- Raw binaries
- Large payload archives

### 5.3 Retention
- Runtime metrics: 30 days
- Verdict metrics: 90 days
- Trust signals: 90 days
- Security incidents: 180 days
- Governance metrics: 90 days

### 5.4 Backpressure
- Queue capacity: 200 events
- Batch flush: 20 events or 15 seconds
- Overflow: events silently dropped — never block the decision path

## 6. Audit Requirements

Critical events are recorded in an append-only audit trail:
- BLOCK verdicts
- Verdict overrides
- Escalations
- Replay attacks
- Auth failures
- Policy violations

Audit entries are written to both a local NDJSON file and a Redis stream when available.

## 7. Confidence Decay

Each rule has a decaying confidence score:

```
effective_confidence = base_confidence * e^(-0.05 * drift)
```

Where drift accumulates from:
- False positive reports (weight: 0.4)
- Verdict reversals (weight: 0.3)
- User overrides (weight: 0.2)
- Engine disagreements (weight: 0.1)

Minimum effective confidence: 0.15

## 8. GitHub Scanning Boundaries

The GitHub scanner targets **execution-relevant artifacts only**:

- CI/CD workflows (.github/workflows/*.yml)
- Container definitions (Dockerfile, docker-compose.yml)
- Shell scripts (*.sh, *.bash)
- Dependency manifests (package.json, requirements.txt, go.mod, etc.)
- Infrastructure configs (*.tf, k8s/*.yml)
- Build/deploy scripts (Jenkinsfile, .gitlab-ci.yml, deploy*.sh)

It must never expand into:
- General source code analysis
- SAST scanning
- Code quality review
- Full repository auditing

## 9. Negative Strategy

TEOS Sentinel will never become:
- A surveillance platform
- An infinite observability pipeline
- A vanity dashboard metrics collector
- An excessive tracing system
- A general-purpose code scanner
- A SIEM replacement
- A telemetry exhaust dump

## 10. Escalation Philosophy

### 10.1 When to Escalate
Escalation to a human operator is required when:
- Verdict is CONFLICTED (engines fundamentally disagree)
- Low-confidence BLOCK occurs despite automatic downgrade
- Repeated unsafe attempts from same user (>3 in 24h)
- Governance drift alert triggered
- Policy simulation detects divergence

### 10.2 Escalation Boundaries
- Escalation is a request for human review, not a system failure
- Humans may override, confirm, or request re-evaluation
- Overrides are recorded as trust telemetry and feed confidence decay
- Escalation must never block the decision path for other users

### 10.3 Operator Intervention Rules
Operators (identified by OPERATOR_USER_IDS env var) have weighted feedback:
- Operator feedback weight: 1.0
- Standard user feedback weight: 0.3
- Operators can force a verdict reassessment
- Operator overrides bypass the low-confidence downgrade rule
- All operator actions are audited with tamper-evident chaining

## 11. Uncertainty Philosophy

### 11.1 Uncertainty Is Not Failure
Epistemic states are first-class citizens of the verdict model. They communicate:
- What the system knows
- What it does not know
- Why it cannot be certain
- What would improve certainty

### 11.2 Uncertainty Types
- **Coverage uncertainty**: Only one engine reachable — results are provisional
- **Consensus uncertainty**: Engines disagree — conflicted epistemic state
- **Context uncertainty**: Input is too short or ambiguous — insufficient context
- **Degradation uncertainty**: Confidence has decayed due to historical drift
- **Infrastructure uncertainty**: Engines unreachable — cannot adjudicate

### 11.3 Action Under Uncertainty
- Low confidence BLOCK → downgraded to WARN
- Conflicted → WARN with escalation request
- Insufficient context → ALLOW with low confidence
- No engines → UNKNOWN, do not block

## 12. Telemetry Ethics

### 12.1 Data Minimalism
Collect only what improves adjudication quality. Never collect:
- Full user conversation histories
- Raw secrets, tokens, or credentials
- Unnecessary personally identifiable information
- Large binary payloads
- Full source repositories

### 12.2 Retention Discipline
All telemetry has explicit TTLs:
- Runtime: 30 days
- Verdicts: 90 days
- Trust signals: 90 days
- Security events: 180 days
- Governance metrics: 90 days

### 12.3 No Surveillance Function
TEOS Sentinel is an adjudication platform, not a surveillance system. Telemetry must never be used to:
- Profile user behavior beyond security signals
- Build behavioral histories of individuals
- Enable wholesale monitoring of operations
- Feed external surveillance systems

## 13. Negative Capability Principles

The system must be comfortable with what it does not know:

### 13.1 Epistemic Humility
UNKNOWN, CONFLICTED, and INSUFFICIENT_CONTEXT are valid outputs. The system does not need to always have an answer.

### 13.2 Bounded Scope
The system knows its boundaries:
- It evaluates execution risk, not code quality
- It scans execution-relevant artifacts, not full codebases
- It provides adjudication, not surveillance

### 13.3 Graceful Refusal
When certainty is insufficient, the system refuses to block rather than blocking incorrectly. False positives are more dangerous than false negatives.

## 14. Institutional Boundaries

### 14.1 Identity Boundaries
TEOS Sentinel is:
- An adjudication engine for AI execution risk
- A governance layer for autonomous systems
- A trust calibration platform

TEOS Sentinel is NOT and must never become:
- A surveillance or monitoring platform
- A general-purpose code security scanner (SAST/DAST)
- A SIEM or log aggregation system
- An infinite observability pipeline
- A data brokerage or telemetry exhaust system
- An autonomous decision system without human oversight

### 14.2 Operational Boundaries
- No recursive scanning (scanning the scanner)
- No autonomous deployment without human approval
- No telemetry export to third-party analytics
- No data sharing across organizational boundaries
- No machine learning model training on user data

### 14.3 Growth Boundaries
TEOS will not expand into:
- Generalized SAST/DAST scanning
- Full repository auditing
- Behavioral user profiling
- ML model training on telemetry
- Automated incident response

## 15. Prohibited Evolution Paths

The following transformations are explicitly prohibited:

### 15.1 Surveillance Path
Growing telemetry until it becomes a surveillance platform. Guard: telemetry TTLs, data minimalism, no PII collection.

### 15.2 SAST Expansion Path
Expanding execution-relevant scanning into general code auditing. Guard: HIGH_RISK_PATTERNS allowlist in github.service.js, no source extension scanning.

### 15.3 Autonomous Overreach Path
Removing human oversight from critical decisions. Guard: CONFLICTED states require escalation, BLOCK requires confidence.

### 15.4 Bureaucratic Rigidity Path
Allowing rules to accumulate without decay or review. Guard: confidence decay, false positive tracking, drift detection.

### 15.5 Telemetry Exhaust Path
Collecting everything because storage is cheap. Guard: bounded queues, TTL retention, explicit collect/never-collect lists, sampling under load.

## 16. Consolidation Success Metrics

Success is measured by:
- Stable verdict consistency across repeated scans of the same input
- Explainable governance — every verdict has a human-readable explanation
- Bounded telemetry — queue never exceeds 200 events, overflow drops silently
- Low operational entropy — no unhandled errors, graceful degradation under load
- Deterministic behavior — same input + same policy = same verdict (decision_fingerprint)
- Graceful degradation — telemetry drops before decision quality degrades
- Trust preservation — false positive rate below 15%, override rate below 10%

Not success:
- More integrations
- More endpoints
- More features
- Larger scan scope
- More telemetry volume

## 17. Success Criteria

The system succeeds when it can answer:

- Why was this blocked?
- Was the verdict correct?
- Is confidence degrading over time?
- Are rules becoming noisy?
- Is trust improving or eroding?
- Is the system becoming unstable?

If telemetry does not help answer these questions, it should not exist.
