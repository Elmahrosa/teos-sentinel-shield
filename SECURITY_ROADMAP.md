# Benchmarks

## Purpose

This file defines how TEOS Sentinel Shield should measure the rule engine honestly.

Do not claim latency, accuracy, or coverage numbers until they are measured and reproducible.

## Current Status

Benchmarking is not yet complete.

Until benchmarks are implemented, use cautious language:

- “rule-driven verdicts”
- “pre-execution validation”
- “blocks known unsafe patterns”
- “designed for low-latency validation”

Do not use:

- “guaranteed sub-second”
- “100% detection”
- “proves safety”
- “complete protection”

## Metrics to Track

### 1. Verdict Latency

Measure time from payload received to verdict returned.

Recommended percentiles:

- p50
- p90
- p95
- p99

Example output:

```json
{
  "engine_version": "0.1.0",
  "cases": 1000,
  "p50_ms": 12,
  "p90_ms": 22,
  "p95_ms": 30,
  "p99_ms": 45
}
```

### 2. Rule Coverage

Track number of test cases per rule category:

| Category | Cases | Expected |
|---|---:|---|
| Destructive shell | TBD | BLOCK |
| Pipe-to-shell | TBD | BLOCK |
| Command execution escalation | TBD | BLOCK/WARN |
| Secret exposure | TBD | BLOCK/WARN |
| Privileged containers | TBD | BLOCK |
| Unsafe GitHub Actions | TBD | BLOCK/WARN |
| Data exfiltration | TBD | BLOCK |
| Prompt/tool abuse escalation | TBD | BLOCK/WARN |

### 3. False Positives

Track legitimate payloads that are blocked or warned.

Example:

```bash
docker run -v ./data:/data postgres
```

Expected:

```text
WARN or ALLOW depending on policy
```

### 4. False Negatives

Track unsafe payloads that pass as `ALLOW`.

Example:

```bash
r${x}m -rf /
```

Expected:

```text
Should be investigated as bypass candidate.
```

## Benchmark Harness Requirements

A benchmark harness should:

1. Load a JSON test corpus.
2. Run every payload through the engine.
3. Compare actual verdict with expected verdict.
4. Report mismatches.
5. Report latency percentiles.
6. Fail CI on regression.

## Suggested Test Case Format

```json
{
  "id": "shell-001",
  "category": "destructive-shell",
  "payload": "rm -rf /",
  "expected_verdict": "BLOCK",
  "expected_severity": "Critical",
  "expected_rule_id": "SHELL_DESTRUCTIVE_RM_RF_ROOT"
}
```

## Minimum Benchmark Before Stronger Claims

Before using stronger product claims, collect:

- at least 100 adversarial cases
- at least 100 benign cases
- repeatable CI benchmark output
- published rule coverage table
- documented false-positive examples
- documented false-negative fixes
