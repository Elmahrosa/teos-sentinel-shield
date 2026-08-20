# Railway Scaling Runbook — TEOS Sentinel Shield

**Classification:** INTERNAL — Operations Team Only
**Last Updated:** 2026-06-18
**Railway Plan:** Pro ($20/mo)

---

## 1. Current Resource Allocation

| Service | RAM | vCPU | Replicas | Auto-scaling |
|---------|-----|------|----------|-------------|
| teoslinker-bot | 512 MB | 1 | 1 | No |
| agent-code-risk-mcp | 512 MB | 1 | 1 | No |
| teos-activation-service | 256 MB | 0.5 | 1 | No |
| teos-sentinel-shield | 512 MB | 1 | 1 | No |

**Pro Plan Limits:** 1 TB RAM, 1,000 vCPU, 42 replicas per service maximum.

---

## 2. Scaling Targets

| Target | Condition | Risk Engine | Bot | Activation | Shield |
|--------|-----------|-------------|-----|------------|--------|
| 100 CCU | Current baseline | 1 GB / 1 vCPU | 512 MB / 1 vCPU | 256 MB / 0.5 vCPU | 512 MB / 1 vCPU |
| 500 CCU | Growth target | 2 GB / 2 vCPU | 1 GB / 1 vCPU | 512 MB / 1 vCPU | 1 GB / 1 vCPU |
| 1,000 CCU | Stretch goal | 4 GB / 4 vCPU | 2 GB / 2 vCPU | 1 GB / 1 vCPU | 2 GB / 2 vCPU |
| 5,000 CCU | Enterprise | 8 GB / 8 vCPU × 2 replicas | 4 GB / 4 vCPU × 2 replicas | 2 GB / 2 vCPU × 2 replicas | 4 GB / 4 vCPU × 2 replicas |

---

## 3. Scaling Methods

### 3.1 Vertical Scaling (Manual)

Increase RAM and vCPU for a service via Railway Dashboard:

```
Railway Dashboard → Project → Service → Settings → Resources
```

**Risk Engine (MCP) — recommended first:**
```bash
# Via Railway CLI
railway service agent-code-risk-mcp
railway resources set memory=1024 cpu=1
```

### 3.2 Horizontal Scaling (Manual Replicas)

```bash
# Scale to 2 replicas in us-east
railway scale --service agent-code-risk-mcp us-east=2

# Scale multiple services
railway scale --service teoslinker-bot us-east=2
railway scale --service teos-activation-service us-east=1
railway scale --service teos-sentinel-shield us-east=2
```

### 3.3 Auto-scaling (CPU-based)

Enable via Railway Dashboard:
```
Railway Dashboard → Project → Service → Settings → Auto-scaling
```

| Setting | Recommended Value |
|---------|------------------|
| Min replicas | 1 |
| Max replicas | 3 |
| CPU threshold | 70% |
| Scale-up cooldown | 60s |
| Scale-down cooldown | 120s |

**Risk Engine auto-scaling config:**
```json
{
  "autoScaling": {
    "minReplicas": 1,
    "maxReplicas": 3,
    "cpuThreshold": 70,
    "cooldownPeriod": {
      "scaleUpMs": 60000,
      "scaleDownMs": 120000
    }
  }
}
```

---

## 4. Step-by-Step: Scale Risk Engine to 1GB+ RAM

**Current:** 512 MB — bottleneck at 100+ CCU (P95 4500ms at 500 CCU)

```bash
# Step 1: Verify current config
railway service agent-code-risk-mcp
railway resources list

# Step 2: Bump to 1 GB RAM
railway resources set memory=1024

# Step 3: Bump to 2 vCPU
railway resources set cpu=2

# Step 4: Verify deployment
railway service deploy
sleep 15
curl -sf https://agent-code-risk-mcp-production-b97d.up.railway.app/health

# Step 5: Run load test
k6 run test/load/scenario-100-ccu.js
k6 run test/load/scenario-500-ccu.js
```

**Expected improvement after 1GB upgrade:**
- 500 CCU P95: 4500ms → ~2000ms
- 500 CCU error rate: ~5% → <1%
- 1000 CCU P95: 8500ms → ~3500ms

---

## 5. Step-by-Step: Enable Horizontal Auto-scaling

**Risk Engine (highest priority due to scan workloads):**

```bash
# Step 1: Ensure CLI is logged in
railway login

# Step 2: Select risk engine service
railway service agent-code-risk-mcp

# Step 3: Scale to 2 replicas across us-east
railway scale us-east=2

# Step 4: Verify distribution
railway service status
# Expected: 2 running replicas

# Step 5: Enable auto-scaling (via Dashboard)
# Settings → Scaling → Enable Auto Scaling
# minReplicas: 1
# maxReplicas: 3
# CPU Threshold: 70%
```

**Bot (stateless, good for replicas):**
```bash
railway service teoslinker-bot
railway scale us-east=2
# Enable auto-scaling: min=1, max=3, CPU 70%
```

**Activation Service (lightweight, single replica sufficient):**
```bash
railway service teos-activation-service
railway scale us-east=1
# Enable auto-scaling: min=1, max=2, CPU 80%
```

**Shield (static assets, good for replicas):**
```bash
railway service teos-sentinel-shield
railway scale us-east=2
# Enable auto-scaling: min=1, max=3, CPU 75%
```

---

## 6. Cost Analysis

| Service | Current/month | After 1GB RAM upgrade | After 2 replicas | After auto-scaling (avg) |
|---------|--------------|----------------------|------------------|-------------------------|
| Risk Engine | ~$5 | ~$10 | ~$15 | ~$12 |
| Bot | ~$3 | ~$5 | ~$8 | ~$6 |
| Activation | ~$2 | ~$2 | ~$3 | ~$2 |
| Shield | ~$3 | ~$5 | ~$8 | ~$6 |
| **Total** | **~$13** | **~$22** | **~$34** | **~$26** |

All costs are within Pro plan's included $20 credit plus reasonable overage.

---

## 7. Monitoring After Scaling

### Verify replica health
```bash
# Check that all replicas are serving
curl -sf https://agent-code-risk-mcp-production-b97d.up.railway.app/health

# Check environment variable for replica identity
# RAILWAY_REPLICA_ID and RAILWAY_REPLICA_REGION are auto-injected
```

### Watch metrics
```bash
# Railway Dashboard → Service → Metrics
# Key indicators:
#   - CPU utilization (should stay below 70% after scaling)
#   - Memory utilization (should stay below 80%)
#   - Request latency (target P95 < 2000ms)
```

### Load test after scaling
```bash
# Baseline
k6 run test/load/scenario-100-ccu.js

# Target
k6 run test/load/scenario-500-ccu.js

# Stretch
k6 run test/load/scenario-1000-ccu.js
```

---

## 8. Scaling Decision Matrix

| Symptom | Diagnosis | Action |
|---------|-----------|--------|
| P95 > 2000ms at 100 CCU | RAM bottleneck | Upgrade to 1 GB RAM |
| P95 > 3000ms at 500 CCU | CPU bottleneck | Upgrade to 2 vCPU |
| Error rate > 5% at peak | Capacity exhausted | Add 1-2 replicas |
| CPU > 70% sustained | Need auto-scaling | Enable auto-scaling 1-3 |
| Single replica crash | No redundancy | Min 2 replicas |
| OOM kills | RAM exhausted | Upgrade RAM + add replica |

---

## 9. Rollback

```bash
# Reduce resources
railway resources set memory=512 cpu=1

# Reduce replicas
railway scale us-east=1

# Disable auto-scaling
# Dashboard → Settings → Scaling → Disable Auto Scaling

# Redeploy previous version
railway service deploy --rollback
```

---

## 10. Related Documents

- `OPERATIONS_RUNBOOK.md` — Day-to-day operations
- `LOAD_TEST_REPORT.md` — Load test results and baselines
- `INCIDENT_RESPONSE.md` — Incident severity and response
- `COST_ANALYSIS.md` — Detailed cost tracking
