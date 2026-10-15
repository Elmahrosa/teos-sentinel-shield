"""
TEOS MCP Server Configuration
Defines external MCP server connections. All values from env vars.
"""
import os
from dataclasses import dataclass


@dataclass
class MCPServerConfig:
    name: str
    url: str
    auth_token: str = ""
    description: str = ""
    enabled: bool = True


def load_mcp_servers() -> dict[str, MCPServerConfig]:
    servers = {}

    code_risk_url = os.environ.get("MCP_CODE_RISK_URL", "")
    if code_risk_url:
        servers["agent-code-risk-mcp"] = MCPServerConfig(
            name="agent-code-risk-mcp",
            url=code_risk_url,
            auth_token=os.environ.get("MCP_CODE_RISK_TOKEN", ""),
            description="Code risk analysis, security telemetry, and vulnerability scanning",
        )

    due_diligence_url = os.environ.get("MCP_DUE_DILIGENCE_URL", "")
    if due_diligence_url:
        servers["teos-labs-due-diligence-mcp"] = MCPServerConfig(
            name="teos-labs-due-diligence-mcp",
            url=due_diligence_url,
            auth_token=os.environ.get("MCP_DUE_DILIGENCE_TOKEN", ""),
            description="Due diligence data, entity verification, and compliance checks",
        )

    return servers


ACTIVE_SERVERS = load_mcp_servers()

ARCHIVED_SERVERS: dict[str, str] = {
    "teos-bankchain": "Archived — superseded by teos-platform",
    "UCH-Backend": "Archived — superseded by teos-platform",
}
