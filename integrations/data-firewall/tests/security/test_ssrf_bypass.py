from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from collectors.http_connector import HTTPConnector, SSRFBlockedError


@pytest.mark.asyncio
async def test_dns_rebinding_bypass():
    connector = HTTPConnector()
    fake_result = SimpleNamespace(addresses=[SimpleNamespace(host="1.2.3.4"), SimpleNamespace(host="169.254.169.254")])

    with patch("collectors.http_connector.aiodns.DNSResolver.gethostbyname", new=AsyncMock(return_value=fake_result)):
        with pytest.raises(SSRFBlockedError):
            await connector._validate_host_async("http://example.com/metadata")
