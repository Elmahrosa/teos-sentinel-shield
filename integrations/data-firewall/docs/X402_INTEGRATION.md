# x402 Integration Guide

Safe Ingestion Engine supports x402 per-request payments — an AI agent with a USDC wallet on Base can call the API with zero signup, zero API key registration, and zero human intervention.

## How It Works
```
Agent → POST /v1/ingest_async (no payment)
     ← 402 Payment Required
        {"amount": "0.05", "currency": "USDC", "network": "base",
         "wallet": "0xd9CA11Dde3810a1BA9B5E1a4b6b76F5a419FAb41"}

Agent → pays 0.05 USDC on Base
Agent → POST /v1/ingest_async
        X-Payment: 0xTRANSACTION_HASH
     ← {"job_id": "...", "status": "queued"}
```

## Python Agent
```python
import httpx

SAFE_API = "https://safe.teosegypt.com"

async def ingest_with_x402(url: str, tx_hash: str = None) -> dict:
    async with httpx.AsyncClient() as client:
        headers = {"Content-Type": "application/json"}
        if tx_hash:
            headers["X-Payment"] = tx_hash
        r = await client.post(f"{SAFE_API}/v1/ingest_async",
                              json={"url": url}, headers=headers)
        if r.status_code == 402:
            payment_info = r.json()
            # pay USDC on Base, get tx_hash, retry
            return {"needs_payment": payment_info}
        return r.json()
```

## TypeScript Agent
```typescript
async function ingestWithX402(url: string, txHash?: string) {
  const headers: Record<string, string> = {"Content-Type": "application/json"};
  if (txHash) headers["X-Payment"] = txHash;
  const r = await fetch("https://safe.teosegypt.com/v1/ingest_async", {
    method: "POST", headers, body: JSON.stringify({url})
  });
  if (r.status === 402) return {needsPayment: await r.json()};
  return r.json();
}
```

## MCP Tool (Claude / Cursor / Windsurf)
```json
{
  "mcpServers": {
    "safe-ingestion": {
      "command": "python",
      "args": ["mcp_server.py"],
      "env": {"SAFE_API_KEY": "sk-your-key", "SAFE_API_BASE": "https://safe.teosegypt.com"}
    }
  }
}
```

## Payment Tiers

| Endpoint | Cost |
|----------|------|
| `POST /v1/ingest_async` | $0.05 USDC |
| Bulk (10 URLs) | $0.40 USDC |

Blocked requests (SSRF, robots.txt) cost $0.

## USDC Wallet
```
Network: Base (Coinbase L2)
Token:   USDC
Address: 0xd9CA11Dde3810a1BA9B5E1a4b6b76F5a419FAb41
```
