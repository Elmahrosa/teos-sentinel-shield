"""
TEOS MCP Tool Bridge
Converts remotely discovered MCP tools into TEOSTool subclasses
so they integrate seamlessly with the existing ToolRegistry + Sentinel pipeline.
"""
import logging

from src.tools.registry import TEOSTool
from src.mcp.client import MCPManager, MCPToolDescriptor

logger = logging.getLogger(__name__)


class MCPBridgeTool(TEOSTool):
    def __init__(self, descriptor: MCPToolDescriptor, manager: MCPManager):
        self.descriptor = descriptor
        self.manager = manager
        self.name = descriptor.name
        self.description = f"[MCP:{descriptor.server_name}] {descriptor.description}"

    async def run(self, **kwargs) -> dict:
        result = await self.manager.call_tool(
            server_name=self.descriptor.server_name,
            tool_name=self.descriptor.name,
            arguments=kwargs,
        )
        return {
            "result": result.get("content", ""),
            "is_error": result.get("is_error", False),
            "tool": self.name,
            "server": self.descriptor.server_name,
        }


def register_mcp_tools(manager: MCPManager, registry) -> int:
    count = 0
    for descriptor in manager.list_all_tools():
        full_name = descriptor["full_name"]
        existing = registry.get(full_name)
        if existing is None:
            tool_descriptor = MCPToolDescriptor(
                server_name=descriptor["server"],
                name=descriptor["name"],
                description=descriptor["description"],
                input_schema=descriptor["input_schema"],
            )
            bridge = MCPBridgeTool(tool_descriptor, manager)
            registry.register_external(full_name, bridge)
            count += 1
            logger.info("Registered MCP tool: %s", full_name)
        else:
            logger.debug("Tool %s already registered, skipping", full_name)
    return count
