# Known Limitations

TEOS Sentinel Shield is an MVP pre-execution guardrail. It is useful as an explicit rule-driven validation layer, but it must not be described as a complete proof of safety.

## What the Current MVP Does

The current MVP checks generated commands, code snippets, dependency inputs, and CI examples against explicit rules. It returns:

- `ALLOW`
- `WARN`
- `BLOCK`

The goal is to prevent obvious high-risk actions before they are executed.

## What the Current MVP Does Not Do

The current MVP does **not**:

- prove arbitrary code safety
- provide formal semantic verification
- replace sandbox isolation
- replace full SAST tools
- replace full DAST tools
- replace full SCA tools
- guarantee that an allowed command is safe
- understand every programming language deeply
- model runtime behavior completely
- verify business logic correctness
- prevent every prompt injection or tool-abuse path
- provide complete malware detection
- provide legal, compliance, or regulatory certification

## Why This Matters

A rule-driven guardrail can block known unsafe patterns, but many real vulnerabilities depend on context:

- runtime environment
- permissions
- secrets available to the process
- network access
- dependency behavior
- user intent
- deployment configuration

For this reason, TEOS Sentinel Shield should be used as one layer in a broader security architecture.

## Recommended Complementary Controls

Use TEOS Sentinel Shield together with:

- sandboxing
- least-privilege execution
- container isolation
- secret scanning
- SAST
- DAST
- SCA
- dependency pinning
- CI/CD approval gates
- audit logging
- human review for high-risk changes
- network egress restrictions

## Expected False Positives

The MVP may warn or block some legitimate workflows, especially:

- DevOps scripts
- CI/CD automation
- Docker operations
- package installation scripts
- admin maintenance commands
- security testing payloads

This is acceptable for the current product stage. The system is designed to be conservative before execution.

## Expected False Negatives

The MVP may miss risks when:

- payloads are obfuscated
- commands are split across files
- malicious behavior is hidden inside dependencies
- execution happens indirectly
- secrets are encoded
- unsafe behavior depends on runtime state
- payloads use language-specific features not covered by current rules

## Product Language Boundary

Do not claim:

- “proves code is safe”
- “fully prevents AI attacks”
- “complete autonomous security”
- “formal verification”
- “unbreakable”
- “zero false negatives”
- “replacement for SAST/DAST/SCA”

Use:

- “pre-execution guardrails”
- “rule-driven verdicts”
- “explicit validation before execution”
- “blocks known unsafe patterns”
- “adds an auditable review layer”
