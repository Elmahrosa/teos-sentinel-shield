
<div align="center">

# 🛡 Safe Ingestion Engine

### Compliance-First Web Data Ingestion Infrastructure for AI Systems

[![Python](https://img.shields.io/badge/Python-3.11-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Redis](https://img.shields.io/badge/Redis-Queue-dc382d?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-gevent_pool-37814a?style=flat-square)](https://docs.celeryq.dev)
[![Tests](https://img.shields.io/badge/Tests-32_passing-brightgreen?style=flat-square)]()
[![Version](https://img.shields.io/badge/Version-3.0.0-blue?style=flat-square)]()
[![License](https://img.shields.io/badge/License-Commercial_Proprietary-red?style=flat-square)](LICENSE)

*Governance enforced at the pipeline layer — before data reaches your application.*

[📖 Docs](#-api-overview) · [🚀 Quick Start](#-quick-start) · [🔐 Guarantees](#-core-guarantees) · [💬 License](mailto:ayman@teosegypt.com)

</div>

---

## ❓ Why Safe Ingestion Engine?

Traditional scrapers dump raw data and leave compliance as an afterthought. They expose your infrastructure to SSRF attacks, legal risks from PII leaks, and volatile website structures.

**Safe Ingestion Engine inverts the model.**

We enforce **governance at the infrastructure layer**. Before data ever reaches your application, it has passed through a strict pipeline of security checks, policy gates, and privacy scrubbers.

```
Traditional:   fetch → raw data → YOUR PROBLEM (Security, PII, Legal)
SIE:           request → POLICY GATE → SECURE FETCH → PII SCRUB → safe data
```

---

## 🏗 Architecture

Built for enterprise scale and strict compliance. Every request is authenticated, authorized, and audited.

```
┌─────────────────────────────────────────────────────────┐
│                1. API Gateway                           │
│        Auth (HMAC) · Rate Limit · Routing               │
└──────────────────────┬──────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  2. Policy Gate │  YAML Rules · Robots.txt · Crawl Budget
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  3. SSRF Guard  │  DNS Rebinding Protection · Private IP Block
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   4. Fetcher    │  Controlled HTTP Client · Streaming Limits
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   5. PII Scrub  │  Redaction · HMAC Hashing · Anonymization
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   6. Storage    │  Content Hashing · Audit Log · Job State
              └─────────────────┘
```

---

## 🚀 Engineering Maturity — v3.0.0

Three independent technical audits completed. All critical findings resolved in the v3.0.0 hardening cycle.

| Category            | Score        | Notes                                   |
| ------------------- | ------------ | --------------------------------------- |
| Architecture        | **9 / 10**   | Modular, event-driven, stateless API    |
| Security Design     | **9 / 10**   | SSRF hardened, keys hashed, race-free   |
| Production Maturity | **8 / 10**   | Docker-first, structured logging        |
| Scale Readiness     | **8 / 10**   | Redis-backed queueing & concurrency     |
| **Overall**         | **8.5 / 10** | **Production Ready**                    |

---

## 🔐 Core Guarantees

| Guarantee               | Implementation                                         |
| ----------------------- | ----------------------------------------------------- |
| **SSRF Protection**     | Private/Loopback IPs blocked; DNS rebind prevention   |
| **PII Anonymization**   | Sensitive data redacted or HMAC-hashed before output  |
| **Race-Free Billing**   | Atomic credit deduction via Redis `WATCH/MULTI`       |
| **Compliance**          | `robots.txt` enforced via PolicyEngine                |
| **Content Integrity**   | SHA-256 content hashing for deduplication             |
| **Auditability**        | Structured logs for every ingestion request           |
| **State Safety**        | Strict JobStatus state machine validation             |

---

## 📡 API Overview

| Method | Endpoint            | Description                           |
| ------ | ------------------- | ------------------------------------- |
| POST   | `/v1/ingest_async`  | Submit ingestion job                  |
| GET    | `/v1/jobs/{job_id}` | Retrieve job result (polling)         |
| GET    | `/v1/jobs`          | List jobs (paginated)                 |
| GET    | `/v1/audit`         | Audit logs                            |
| GET    | `/v1/domains`       | Domain statistics & crawl budget      |
| GET    | `/v1/account`       | Account details & credit balance      |
| GET    | `/health`           | Service health check                  |
| GET    | `/metrics`          | Prometheus metrics (Auth protected)   |

---

## 🔄 Job Lifecycle

Transparent state transitions for every job.

```
PENDING ──▶ RUNNING ──▶ COMPLETED
                │
                ├──▶ RETRYING (transient errors)
                ├──▶ BLOCKED  (policy/robots.txt)
                └──▶ FAILED   (unrecoverable error)
```

---

## 🚀 Quick Start

**Prerequisites:** Docker & Docker Compose installed.

```bash
# 1. Clone
git clone https://github.com/Elmahrosa/safe-ingestion-engine.git
cd safe-ingestion-engine

# 2. Configure
cp .env.example .env
# Edit .env with your salts and passwords

# 3. Launch
docker compose up --build -d
```

Access the API Docs at `http://localhost:8000/docs`.

---

## ⚙️ Configuration

Key environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Postgres or SQLite connection string |
| `REDIS_URL` | ✅ | Redis connection for queue/billing |
| `PII_SALT` | ✅ | Salt for HMAC hashing of PII |
| `API_KEY_SALT` | ✅ | Salt for HMAC hashing of API keys |

---

## 🧪 Testing

Run the full security and functionality suite.

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```

---

## 🤖 AI Integration

Designed to feed clean data into LLMs and RAG pipelines.

```python
import httpx

response = httpx.post(
    "https://your-host/v1/ingest_async",
    headers={"X-API-Key": "sk-your-key"},
    json={"url": "https://example.com"}
)

job_id = response.json()["job_id"]
# Poll /v1/jobs/{job_id} for clean, scrubbed content
```

---

## 💳 Licensing

**Commercial Proprietary License.**

This software is production-ready but requires a license for commercial use.

For inquiries: **[ayman@teosegypt.com](mailto:ayman@teosegypt.com)**

---

<div align="center">

**Built with precision by [Elmahrosa International](https://TEOSEGYPT.com)**

**Cairo · Egypt**

</div>
```
