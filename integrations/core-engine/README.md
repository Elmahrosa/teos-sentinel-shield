# 🛡️ teos-mcp-codeguard

> Execution-time code risk gating for autonomous AI agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)
[![Status: Live](https://img.shields.io/badge/Status-Live-green.svg)]()

---

## What Is This?

Your AI agent can write and run code.  
**But who checks if that code is safe before it runs?**

`teos-mcp-codeguard` is an MCP server that:
- Scores code risk **before execution** (0 = safe → 1 = dangerous)
- Returns a structured **ALLOW** or **BLOCK** verdict
- Gives **reasoning** so you know exactly why
- Is **deterministic** — same code = same score, every time

---

## Quick Start

### 1. Install

```bash
npx @elmahrosa/teos-mcp-codeguard
```

### 2. Add to Claude Desktop / Cursor / any MCP client

```json
{
  "mcpServers": {
    "codeguard": {
      "command": "npx",
      "args": ["@elmahrosa/teos-mcp-codeguard"]
    }
  }
}
```

### 3. Use in your agent

```python
# Your agent calls this before executing any code
result = mcp.call("validate_before_execute", {
  "code": your_code_string,
  "context": "smart_contract_deployment"
})

if result["verdict"] == "ALLOW":
    execute(your_code_string)
else:
    log(result["reasoning"])  # understand why it was blocked
```

---

## MCP Tools

### `validate_before_execute`

Check code risk before your agent runs it.

**Input:**
```json
{
  "code": "string",
  "context": "string (optional)"
}
```

**Output:**
```json
{
  "verdict": "ALLOW | BLOCK",
  "risk_score": 0.0,
  "reasoning": "Explanation of the decision",
  "flags": ["list", "of", "risk", "factors"]
}
```

---

## Risk Factors Detected

| Category | Examples |
|----------|---------|
| 🔑 Credential exposure | Hardcoded API keys, private keys |
| 💣 Destructive operations | `rm -rf`, DROP TABLE, self-delete |
| 🌐 Unexpected network calls | Unauthorized external requests |
| 🔁 Infinite loops | Unbound recursion, while True |
| 💰 Financial operations | Unvalidated transfers, token approvals |
| 🧬 Code self-modification | Agent rewriting its own source |

---

## Why Deterministic?

Most approaches use an LLM to judge code safety.

**Problems with LLM judges:**
- Non-deterministic (different answer each time)
- Slow and expensive
- Can be prompt-injected
- Not auditable

**TeosMCP approach:**
- Rule-based scoring engine
- Same input → same output → same verdict
- Every decision is reproducible and auditable

---

## Use Cases

- **Trading bots** — Block risky contract interactions
- **Code agents** — Gate self-generated code before execution
- **CI/CD pipelines** — Block PRs with risk score above threshold
- **Smart contract deployers** — Validate before broadcast

---

## Pricing

| Plan | Decisions/month | Price |
|------|----------------|-------|
| Free | 1,000 | $0 |
| Pro | 100,000 | $99/month |
| Enterprise | Unlimited | $2,000+/month |

---

## Part of TeosMCP Ecosystem

CodeGuard is **one layer** of a complete agent safety system.

```
CodeGuard (this repo) → checks CODE risk
Linker MCP           → checks ON-CHAIN risk  
TeosMCP Core         → unified ALLOW/BLOCK decision
```

➡️ See [TEOS_ECOSYSTEM.md](./TEOS_ECOSYSTEM.md) for full architecture.

---

## Contributing

1. Fork this repo
2. `git checkout -b feature/your-feature`
3. Make your changes
4. Open a Pull Request

---

## Contact

- 🐦 X: [@elmahrosa](https://x.com/elmahrosa)
- 🐛 Issues: [GitHub Issues](https://github.com/Elmahrosa/agent-code-risk-mcp/issues)
- 💼 Design partners: DM on X (3 slots open)

---

## License

MIT — See [LICENSE](./LICENSE)

---

*Don't let your agent run blind. Gate every execution.*
