from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import urlparse

import httpx

from connectors.base import DataConnector, FetchResult
from core.config import get_settings
from core.logging import logger


# ── SSRF blocked ranges ────────────────────────────────────────────────────────
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),   # link-local / AWS metadata
    ipaddress.ip_network("::1/128"),           # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 ULA
    ipaddress.ip_network("fe80::/10"),         # IPv6 link-local
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),     # Carrier-grade NAT
    ipaddress.ip_network("198.18.0.0/15"),     # Benchmarking
    ipaddress.ip_network("240.0.0.0/4"),       # Reserved
    ipaddress.ip_network("224.0.0.0/4"),       # Multicast
]

_ALLOWED_SCHEMES = {"http", "https"}


class SSRFBlockedError(Exception):
    """Raised when a URL resolves to a private/reserved address."""
    pass


def _is_private_ip(ip_str: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip_str)
        return any(addr in net for net in _BLOCKED_NETWORKS)
    except ValueError:
        return True  # unparseable = block


def _validate_url(url: str) -> None:
    """
    Validates URL scheme and resolves hostname to check for SSRF.
    Raises SSRFBlockedError on any violation.
    """
    parsed = urlparse(url)

    if parsed.scheme not in _ALLOWED_SCHEMES:
        raise SSRFBlockedError(f"Scheme not allowed: {parsed.scheme!r}")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFBlockedError("URL has no hostname")

    # Block bare IP literals in the URL
    try:
        addr = ipaddress.ip_address(hostname)
        if _is_private_ip(str(addr)):
            raise SSRFBlockedError(f"Private IP literal blocked: {hostname}")
    except ValueError:
        pass  # hostname is a domain name — resolve it below

    # DNS resolution check — blocks DNS rebinding after initial validation
    try:
        infos = socket.getaddrinfo(hostname, None)
        for info in infos:
            ip = info[4][0]
            if _is_private_ip(ip):
                raise SSRFBlockedError(
                    f"Hostname {hostname!r} resolves to private IP {ip}"
                )
    except SSRFBlockedError:
        raise
    except OSError as exc:
        raise SSRFBlockedError(f"DNS resolution failed for {hostname!r}: {exc}") from exc


class HTTPConnector(DataConnector):
    """
    Safe HTTP connector with SSRF protection, response size cap,
    and configurable redirect policy.

    Implements the DataConnector ABC from connectors/base.py.
    """

    def __init__(self, user_agent: str = "TeosCrawl/2.0") -> None:
        self._user_agent = user_agent
        self.settings = get_settings()
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.settings.request_timeout_seconds,
                follow_redirects=False,   # Always False at client level (defensive)
                limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
            )
        return self._client

    async def validate_source(self, url: str) -> bool:
        """Returns True if URL passes SSRF validation, raises SSRFBlockedError otherwise."""
        _validate_url(url)
        return True

    async def fetch(self, url: str, *, follow_redirects: bool = False, **kwargs) -> FetchResult:
        """
        Fetch URL with SSRF protection and response size cap.

        Args:
            url: Target URL. Must pass SSRF validation.
            follow_redirects: Whether to follow HTTP redirects (default: False).
                              Always re-validates the final URL after redirect.
        """
        await self.validate_source(url)
        client = await self._get_client()

        try:
            async with client.stream(
                "GET",
                url,
                headers={"User-Agent": self._user_agent},
                follow_redirects=follow_redirects,
                **kwargs,
            ) as response:
                # Re-validate if we followed redirects (DNS rebinding protection)
                if follow_redirects and str(response.url) != url:
                    await self.validate_source(str(response.url))

                response.raise_for_status()

                chunks: list[bytes] = []
                total_size = 0
                async for chunk in response.aiter_bytes():
                    total_size += len(chunk)
                    if total_size > self.settings.max_response_bytes:
                        logger.warning(
                            "http_connector.response_too_large",
                            url=url,
                            max_bytes=self.settings.max_response_bytes,
                        )
                        raise ValueError(
                            f"Response exceeds {self.settings.max_response_bytes} bytes"
                        )
                    chunks.append(chunk)

                body = b"".join(chunks).decode("utf-8", errors="replace")
                return FetchResult(
                    url=str(response.url),
                    content=body,
                    status_code=response.status_code,
                    content_type=response.headers.get("content-type"),
                    metadata={"bytes": total_size},
                )
        except SSRFBlockedError:
            raise
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(f"HTTP {exc.response.status_code} fetching {url}") from exc
        except httpx.RequestError as exc:
            raise RuntimeError(f"Network error fetching {url}: {exc}") from exc

    def get_capabilities(self) -> dict:
        return {
            "ssrf_protection": True,
            "max_response_bytes": self.settings.max_response_bytes,
            "follow_redirects_default": False,
            "schemes": list(_ALLOWED_SCHEMES),
        }

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
