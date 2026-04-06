from unittest.mock import patch

import pytest
import redis

from collectors.http_connector import HTTPConnector
from core.policy import PolicyEngine
from services.ingestion_service import IngestionService


class FakeRedis:
    def __init__(self):
        self.data = {}

    class Pipe:
        def __init__(self, outer):
            self.outer = outer
            self.key = None
            self.commands = []

        def watch(self, key): self.key = key
        def get(self, key): return self.outer.data.get(key)
        def unwatch(self): pass
        def multi(self): pass
        def incr(self, key, value): self.commands.append(("incr", key, value))
        def expire(self, key, ttl): self.commands.append(("expire", key, ttl))
        def execute(self):
            for cmd in self.commands:
                if cmd[0] == "incr":
                    self.outer.data[cmd[1]] = str(int(self.outer.data.get(cmd[1], "0")) + cmd[2]).encode()
            self.commands.clear()
        def __enter__(self): return self
        def __exit__(self, exc_type, exc, tb): return False

    def pipeline(self):
        return FakeRedis.Pipe(self)


@pytest.mark.asyncio
async def test_full_ingestion_pipeline():
    connector = HTTPConnector()
    policy = PolicyEngine(FakeRedis())
    service = IngestionService(connector, policy)

    async def fake_fetch(url, **kwargs):
        from connectors.base import FetchResult
        return FetchResult(url=url, content="Email me at test@example.com", status_code=200, content_type="text/plain", metadata={})

    with patch.object(HTTPConnector, "fetch", side_effect=fake_fetch), patch.object(PolicyEngine, "check_robots", return_value=True):
        cleaned, pii_count = await service.ingest("https://example.com")
        assert "test@example.com" not in cleaned
        assert pii_count == 1
