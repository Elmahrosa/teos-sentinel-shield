// ─────────────────────────────────────────────────────────────
//  src/mcp/server.ts — MCP server (stdio JSON-RPC transport)
// ─────────────────────────────────────────────────────────────

import {
  reviewDiff,
  pipelineGuard,
  generateFixSuggestions,
  ReviewResult,
  PipelineGuardResult,
  FixSuggestion,
} from "../core/review";

// ── Types ────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ── Tool schemas (MCP tools/list) ────────────────────────────

const TOOL_DEFINITIONS = [
  {
    name: "review_diff",
    description:
      "Scans a unified diff for security risks. Returns decision (ALLOW/WARN/BLOCK), risk score, and structured findings.",
    inputSchema: {
      type: "object",
      properties: {
        diff: {
          type: "string",
          description: "Unified diff text to analyze",
        },
      },
      required: ["diff"],
    },
  },
  {
    name: "pipeline_guard",
    description:
      "CI/CD gate — returns ALLOW or BLOCK based on risk score threshold.",
    inputSchema: {
      type: "object",
      properties: {
        diff: {
          type: "string",
          description: "Unified diff text to analyze",
        },
        threshold: {
          type: "number",
          description:
            "Score threshold for BLOCK decision (default: 50)",
        },
      },
      required: ["diff"],
    },
  },
  {
    name: "generate_fix_patch",
    description:
      "Generates structured fix suggestions for each finding in the diff (premium tool).",
    inputSchema: {
      type: "object",
      properties: {
        diff: {
          type: "string",
          description: "Unified diff text to analyze",
        },
      },
      required: ["diff"],
    },
  },
];

// ── Handle JSON-RPC methods ──────────────────────────────────

function handleRequest(req: JsonRpcRequest): JsonRpcResponse {
  const { id, method, params } = req;

  switch (method) {
    // ── MCP discovery ──
    case "initialize": {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "agent-code-risk-mcp",
            version: "1.0.0",
          },
        },
      };
    }

    case "notifications/initialized": {
      // Client ack — no response needed, but we reply cleanly
      return { jsonrpc: "2.0", id, result: {} };
    }

    case "tools/list": {
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOL_DEFINITIONS },
      };
    }

    // ── Tool execution ──
    case "tools/call": {
      const toolName = (params as Record<string, unknown>)?.name as string;
      const args = (params as Record<string, unknown>)?.arguments as Record<
        string,
        unknown
      >;

      if (!toolName || !args) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32602,
            message: "Invalid params: name and arguments required",
          },
        };
      }

      return executeTool(id, toolName, args);
    }

    default: {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
    }
  }
}

function executeTool(
  id: number | string,
  toolName: string,
  args: Record<string, unknown>
): JsonRpcResponse {
  const diff = args.diff as string;

  if (!diff) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32602,
        message: "Missing required argument: diff",
      },
    };
  }

  switch (toolName) {
    case "review_diff": {
      const result: ReviewResult = reviewDiff(diff);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    case "pipeline_guard": {
      const threshold = (args.threshold as number) ?? 50;
      const result: PipelineGuardResult = pipelineGuard(diff, threshold);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    case "generate_fix_patch": {
      const fixes: FixSuggestion[] = generateFixSuggestions(diff);
      const review: ReviewResult = reviewDiff(diff);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  decision: review.decision,
                  score: review.score,
                  fixes,
                },
                null,
                2
              ),
            },
          ],
        },
      };
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32602,
          message: `Unknown tool: ${toolName}`,
        },
      };
  }
}

// ── stdio transport ──────────────────────────────────────────

let inputBuffer = "";

process.stdin.setEncoding("utf-8");

process.stdin.on("data", (chunk: string) => {
  inputBuffer += chunk;

  // Process all complete lines
  let newlineIndex: number;
  while ((newlineIndex = inputBuffer.indexOf("\n")) !== -1) {
    const line = inputBuffer.slice(0, newlineIndex).trim();
    inputBuffer = inputBuffer.slice(newlineIndex + 1);

    if (!line) continue;

    try {
      const request: JsonRpcRequest = JSON.parse(line);
      const response = handleRequest(request);
      const out = JSON.stringify(response);
      process.stdout.write(out + "\n");
    } catch (err) {
      const errorResponse: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: 0,
        error: {
          code: -32700,
          message: "Parse error",
          data: String(err),
        },
      };
      process.stdout.write(JSON.stringify(errorResponse) + "\n");
    }
  }
});

process.stdin.on("end", () => {
  process.exit(0);
});

// ── Startup log (stderr so it doesn't pollute JSON-RPC) ─────

process.stderr.write(
  "[agent-code-risk-mcp] MCP server running on stdio\n"
);
process.stderr.write(
  `[agent-code-risk-mcp] Tools: ${TOOL_DEFINITIONS.map((t) => t.name).join(", ")}\n`
);
