"""
TEOS MCP Client Manager
Manages connections to multiple external MCP servers via Streamable HTTP.
Handles lifecycle, tool discovery, and health checks.
Fail-closed: connection errors default to degraded state.
"""
import logging
from typing import Any, Optional

import httpx

from src.mcp.config import MCPServerConfig, ACTIVE_SERVERS

logger = logging.getLogger(__name__)


class MCPToolDescriptor:
    def __init__(self, server_name: str, name: str, description: str, input_schema: dict):
        self.server_name = server_name
        self.name = name
        self.full_name = f"{server_name}::{name}"
        self.description = description
        self.input_schema = input_schema

    def to_dict(self) -> dict:
        return {
            "server": self.server_name,
            "name": self.name,
            "full_name": self.full_name,
            "description": self.description,
            "input_schema": self.input_schema,
        }


class MCPServerConnection:
    def __init__(self, config: MCPServerConfig):
        self.config = config
        self.name = config.name
        self.url = config.url.rstrip("/")
        self._client: Optional[httpx.AsyncClient] = None
        self._tools: list[MCPToolDescriptor] = []
        self._connected = False
        self._request_id = 0

    async def connect(self) -> bool:
        try:
            headers = {"Content-Type": "application/json"}
            if self.config.auth_token:
                headers["Authorization"] = f"Bearer {self.config.auth_token}"

            self._client = httpx.AsyncClient(
                timeout=30.0,
                headers=headers,
            )

            init_result = await self._send_request("initialize", {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "teos-superintelligence", "version": "1.0.0"},
            })

            if init_result is not None:
                await self._send_notification("notifications/initialized", {})
                self._connected = True
                await self._discover_tools()
                logger.info("MCP connected to %s (%d tools)", self.name, len(self._tools))
                return True

            return False
        except Exception as e:
            logger.error("MCP connection failed for %s: %s", self.name, e)
            self._connected = False
            return False

    async def disconnect(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None
        self._connected = False

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def tools(self) -> list[MCPToolDescriptor]:
        return self._tools

    async def _send_request(self, method: str, params: dict) -> Optional[dict]:
        self._request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
            "params": params,
        }
        try:
            resp = await self._client.post(self.url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                if "result" in data:
                    return data["result"]
                if "error" in data:
                    logger.error("MCP error from %s: %s", self.name, data["error"])
                    return None
            logger.error("MCP HTTP %d from %s", resp.status_code, self.name)
            return None
        except Exception as e:
            logger.error("MCP request failed for %s: %s", self.name, e)
            return None

    async def _send_notification(self, method: str, params: dict) -> None:
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
        }
        try:
            await self._client.post(self.url, json=payload)
        except Exception:
            pass

    async def _discover_tools(self) -> None:
        result = await self._send_request("tools/list", {})
        if result and "tools" in result:
            self._tools = []
            for tool in result["tools"]:
                self._tools.append(MCPToolDescriptor(
                    server_name=self.name,
                    name=tool.get("name", ""),
                    description=tool.get("description", ""),
                    input_schema=tool.get("inputSchema", {}),
                ))

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        if not self._connected or not self._client:
            return {"error": f"MCP server {self.name} not connected", "is_error": True}

        result = await self._send_request("tools/call", {
            "name": tool_name,
            "arguments": arguments,
        })

        if result is None:
            return {"error": f"MCP tool call failed: {tool_name}", "is_error": True}

        content_parts = []
        for item in result.get("content", []):
            if item.get("type") == "text":
                content_parts.append(item.get("text", ""))

        return {
            "content": "\n".join(content_parts),
            "is_error": result.get("isError", False),
        }

    async def health(self) -> dict:
        try:
            if self._client:
                resp = await self._client.post(self.url, json={
                    "jsonrpc": "2.0",
                    "id": 0,
                    "method": "ping",
                    "params": {},
                })
                if resp.status_code == 200:
                    return {"status": "ok", "server": self.name, "tools": len(self._tools)}
            return {"status": "disconnected", "server": self.name}
        except Exception:
            return {"status": "error", "server": self.name}


class MCPManager:
    def __init__(self):
        self._connections: dict[str, MCPServerConnection] = {}
        self._all_tools: list[MCPToolDescriptor] = []

    async def startup(self) -> None:
        for name, config in ACTIVE_SERVERS.items():
            conn = MCPServerConnection(config)
            self._connections[name] = conn
            await conn.connect()
            self._all_tools.extend(conn.tools)

        connected = sum(1 for c in self._connections.values() if c.is_connected)
        logger.info(
            "MCP Manager started: %d/%d servers connected, %d tools discovered",
            connected, len(self._connections), len(self._all_tools),
        )

    async def shutdown(self) -> None:
        for conn in self._connections.values():
            await conn.disconnect()
        self._connections.clear()
        self._all_tools.clear()

    def get_connection(self, server_name: str) -> Optional[MCPServerConnection]:
        return self._connections.get(server_name)

    def list_servers(self) -> list[dict]:
        return [
            {
                "name": conn.name,
                "connected": conn.is_connected,
                "tools": [t.to_dict() for t in conn.tools],
                "url": conn.config.url,
            }
            for conn in self._connections.values()
        ]

    def list_all_tools(self) -> list[dict]:
        return [t.to_dict() for t in self._all_tools]

    def get_tool_by_full_name(self, full_name: str) -> Optional[MCPToolDescriptor]:
        for tool in self._all_tools:
            if tool.full_name == full_name:
                return tool
        return None

    async def call_tool(
        self, server_name: str, tool_name: str, arguments: dict[str, Any]
    ) -> dict[str, Any]:
        conn = self._connections.get(server_name)
        if not conn:
            return {"error": f"MCP server '{server_name}' not found", "is_error": True}
        return await conn.call_tool(tool_name, arguments)

    async def health(self) -> dict[str, dict]:
        result = {}
        for name, conn in self._connections.items():
            result[name] = await conn.health()
        return result
