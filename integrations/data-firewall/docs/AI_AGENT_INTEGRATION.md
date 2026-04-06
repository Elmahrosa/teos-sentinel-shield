# AI Agent Integration Guide

## Basic Integration

```python
import httpx

headers = {"X-API-Key": "sk-..."}
payload = {"url": "https://example.com/research"}

response = httpx.post(
    "https://safe.teosegypt.com/v1/ingest_async",
    headers=headers,
    json=payload,
    timeout=30.0,
)
print(response.json())
```

## Async Agent Pattern

```python
import asyncio
import httpx

async def ingest_one(client: httpx.AsyncClient, url: str):
    r = await client.post("/v1/ingest_async", json={"url": url})
    return r.json()

async def research_agent(query: str, sources: list[str]):
    async with httpx.AsyncClient(
        base_url="https://safe.teosegypt.com",
        headers={"X-API-Key": "sk-..."},
        timeout=30.0,
    ) as client:
        jobs = await asyncio.gather(*(ingest_one(client, src) for src in sources[:10]))
        return jobs
```
