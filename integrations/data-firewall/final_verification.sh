#!/bin/bash

echo "=== Final Security Fixes Verification ==="
echo ""

# Check PII stable_hash
echo "1. PII stable_hash fix:"
if grep -q "hmac.new" core/pii.py 2>/dev/null; then
    echo "   ✅ HMAC implementation found in core/pii.py"
else
    echo "   ❌ Still needs manual integration in core/pii.py"
fi

# Check domain concurrency
echo "2. Domain concurrency fix:"
if grep -q "pipe.watch" core/policy.py 2>/dev/null; then
    echo "   ✅ Atomic Redis operations found in core/policy.py"
else
    echo "   ❌ Still needs manual integration in core/policy.py"
fi

# Check plan credits
echo "3. Plan credits fix:"
if grep -q '"trial".*5' api/routes/ingest.py 2>/dev/null; then
    echo "   ✅ Trial credits set to 5 in api/routes/ingest.py"
else
    echo "   ❌ Still needs manual integration in api/routes/ingest.py"
fi

# Check MCP status handling
echo "4. MCP ingest block fix:"
if grep -q "status.*upper" mcp_server.py 2>/dev/null; then
    echo "   ✅ Status normalization found in mcp_server.py"
else
    echo "   ❌ Still needs manual integration in mcp_server.py"
fi

# Check applied files
echo "5. Applied file fixes:"
if [ -f "api/routes/metrics.py" ] && grep -q "Basic Auth" api/routes/metrics.py 2>/dev/null; then
    echo "   ✅ /metrics Basic Auth guard applied"
else
    echo "   ❌ /metrics Basic Auth guard not found"
fi

if [ -f "scripts/rotate_api_keys.py" ] && grep -q "Redis" scripts/rotate_api_keys.py 2>/dev/null; then
    echo "   ✅ API key rotation script updated"
else
    echo "   ❌ API key rotation script not updated"
fi

echo ""
echo "=== Remaining manual fixes ==="
echo "📋 These require manual review and application:"
echo "   - Fix 04: dashboard/app.py (SQL injection)"
echo "   - Fix 06: collectors/http_connector.py (redirect handling)"
echo "   - Fix 07: infrastructure/queue/tasks.py (security event logging)"
