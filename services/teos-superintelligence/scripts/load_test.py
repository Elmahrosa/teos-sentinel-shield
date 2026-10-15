"""
TEOS Load Testing Script
Simulates concurrent users sending queries to measure throughput and latency.
Usage: python scripts/load_test.py [--concurrency 10] [--requests 100]
"""
import os
import time
import json
import statistics
import argparse
import asyncio
from datetime import datetime, timezone

import httpx

API_URL = os.environ.get("TEOS_API_URL", "http://localhost:8000")
JWT_SECRET = os.environ.get("JWT_SECRET", "test-secret-key-for-testing")


async def get_token(client: httpx.AsyncClient) -> str:
    resp = await client.post(
        "/auth/token",
        json={"username": f"loadtest@{datetime.now(timezone.utc).timestamp()}", "api_key": JWT_SECRET},
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


async def send_query(client: httpx.AsyncClient, token: str, session_id: str, query: str) -> dict:
    start = time.monotonic()
    try:
        resp = await client.post(
            "/query",
            json={"query": query, "session_id": session_id},
            headers={"Authorization": f"Bearer {token}"},
        )
        elapsed = time.monotonic() - start
        return {
            "status_code": resp.status_code,
            "latency": elapsed,
            "success": resp.status_code == 200,
        }
    except Exception as e:
        return {"status_code": 0, "latency": time.monotonic() - start, "success": False, "error": str(e)}


async def worker(worker_id: int, concurrency: int, total_requests: int, results: list):
    queries = [
        "What is TEOS?",
        "Explain AI governance",
        "Summarize the key principles",
        "Translate hello to Arabic",
        "Analyze this security threat",
    ]
    async with httpx.AsyncClient(base_url=API_URL, timeout=30) as client:
        token = await get_token(client)
        session_id = f"loadtest_{worker_id}"
        for i in range(total_requests // concurrency):
            query = queries[i % len(queries)]
            result = await send_query(client, token, session_id, query)
            results.append(result)
            if (i + 1) % 10 == 0:
                print(f"  Worker {worker_id}: {i + 1} requests done")


async def main():
    parser = argparse.ArgumentParser(description="TEOS Load Test")
    parser.add_argument("--concurrency", type=int, default=5, help="Number of concurrent workers")
    parser.add_argument("--requests", type=int, default=50, help="Total requests to send")
    args = parser.parse_args()

    print(f"TEOS Load Test — {args.concurrency} workers, {args.requests} requests")
    print(f"Target: {API_URL}")
    print()

    results = []
    workers = [
        worker(i, args.concurrency, args.requests, results)
        for i in range(args.concurrency)
    ]

    start = time.monotonic()
    await asyncio.gather(*workers)
    total_time = time.monotonic() - start

    latencies = [r["latency"] for r in results if r["success"]]
    successes = sum(1 for r in results if r["success"])
    failures = sum(1 for r in results if not r["success"])

    print()
    print("=== RESULTS ===")
    print(f"Total time: {total_time:.2f}s")
    print(f"Requests: {len(results)} ({successes} success, {failures} failed)")
    print(f"Throughput: {len(results) / total_time:.1f} req/s")
    if latencies:
        print("Latency (successful):")
        print(f"  Min:    {min(latencies):.3f}s")
        print(f"  Max:    {max(latencies):.3f}s")
        print(f"  Mean:   {statistics.mean(latencies):.3f}s")
        print(f"  Median: {statistics.median(latencies):.3f}s")
        if len(latencies) > 1:
            print(f"  Stdev:  {statistics.stdev(latencies):.3f}s")
    else:
        print("No successful requests recorded")

    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "target": API_URL,
        "concurrency": args.concurrency,
        "total_requests": args.requests,
        "total_time": round(total_time, 3),
        "throughput": round(len(results) / total_time, 1),
        "successes": successes,
        "failures": failures,
        "latency_ms": {
            "min": round(min(latencies) * 1000, 1) if latencies else None,
            "max": round(max(latencies) * 1000, 1) if latencies else None,
            "mean": round(statistics.mean(latencies) * 1000, 1) if latencies else None,
            "median": round(statistics.median(latencies) * 1000, 1) if latencies else None,
        },
    }
    with open("load_test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    print("\nReport saved to load_test_report.json")


if __name__ == "__main__":
    asyncio.run(main())
