# agent-code-risk-mcp Hard Audit Checklist

Use this after the documentation is shipped.

## 1. Rule Inventory

For every rule, record:

- rule ID
- category
- severity
- verdict
- pattern
- examples blocked
- examples allowed
- test coverage
- known bypasses

## 2. Evaluation Flow

Verify:

- input is normalized before matching
- original payload is preserved for evidence
- highest severity wins
- rule order is documented
- verdict contract is stable
- no rule executes user payload
- errors fail closed for high-risk routes

## 3. Bypass Review

Test:

- whitespace bypass
- quoted command bypass
- shell wrapper bypass
- base64 payloads
- line continuation
- environment variable composition
- command aliases
- indirect execution
- YAML multiline strings
- PowerShell equivalents

## 4. False Positive Review

Collect legitimate examples for:

- Docker workflows
- CI workflows
- deployment scripts
- package installation
- security testing
- local development scripts

## 5. False Negative Review

Every missed dangerous payload becomes:

- new test case
- new rule or normalization fix
- documented regression test

## 6. Roadmap to Stronger Engine

Next steps:

1. Structured test corpus.
2. Normalization layer.
3. Rule IDs and verdict schema.
4. CI regression tests.
5. Policy engine evaluation.
6. Signed audit logs.
7. Sandbox integration example.
8. Go/Rust migration evaluation only after the schema stabilizes.
