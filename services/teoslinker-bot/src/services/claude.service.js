const { logger } = require('../../logger.cjs');
const { SentinelGuard } = require('../governance/sentinel-guard');

let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (e) {
  logger.warn({ err: e?.message }, 'Claude SDK not available — /claude command will be disabled');
}

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `You are TEOS Sentinel — a Sovereign AI Execution Firewall.

Your rules:
1. ALWAYS pre-scan destructive commands through teos_sentinel_check
2. If BLOCKED, explain the risk in clear terms and suggest safe alternatives
3. If WARN, proceed with caution and explain the concern
4. Never bypass the Sentinel firewall
5. Never exfiltrate data outside approved endpoints
6. Never execute rm -rf /, dd, mkfs, or crypto miners
7. Keep audit hashes for all security decisions

When blocked:
- Explain WHY it was blocked (specific rule match)
- Suggest a SAFE alternative
- Provide the audit hash for reference`;

const TOOLS = [
  {
    name: 'bash',
    description: 'Execute shell commands. All commands pre-scanned by TEOS Sentinel.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
      },
      required: ['command'],
    },
  },
  {
    name: 'write',
    description: 'Write files. All content pre-scanned by TEOS Sentinel.',
    input_schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'File content to write' },
      },
      required: ['filePath', 'content'],
    },
  },
  {
    name: 'teos_sentinel_check',
    description: 'TEOS Sentinel — sovereign pre-execution firewall. Scans any input before execution.',
    input_schema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'Command or code to scan' },
        context: {
          type: 'string',
          enum: ['tool_execution', 'shell_command', 'file_write', 'code_generation'],
          description: 'Execution context',
        },
      },
      required: ['input'],
    },
  },
];

class ClaudeService {
  constructor() {
    this.client = null;
    this.guard = null;
    this.initialized = false;
    this.sessions = new Map();
  }

  async initialize() {
    if (this.initialized) return true;

    if (!Anthropic) {
      logger.warn('Claude SDK not installed — skipping initialization');
      return false;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn('ANTHROPIC_API_KEY not set — /claude command will be disabled');
      return false;
    }

    try {
      this.client = new Anthropic({ apiKey });

      this.guard = await SentinelGuard.create({
        enableCache: true,
        enableRateLimiting: true,
        enableCircuitBreaker: true,
        enableSessionTracking: true,
        enableAudit: true,
        failClosed: false,
        mcpConfig: {
          apiEndpoint: process.env.MCP_API || '',
          timeout: 600,
          retry: 2,
        },
      });

      this.initialized = true;
      logger.info('Claude Service initialized with TEOS Sentinel Guard');
      return true;
    } catch (e) {
      logger.error({ err: e?.message }, 'Failed to initialize Claude Service');
      return false;
    }
  }

  isAvailable() {
    return this.initialized && this.client && this.guard;
  }

  async sendMessage(userId, userMessage, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Claude Service not initialized. Set ANTHROPIC_API_KEY and ensure @anthropic-ai/sdk is installed.');
    }

    const sessionId = options.sessionId || `claude_${userId}_${Date.now()}`;

    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        userId,
        history: [],
        createdAt: Date.now(),
      };
      this.sessions.set(sessionId, session);
    }

    session.history.push({ role: 'user', content: userMessage });

    const response = await this.client.messages.create({
      model: options.model || DEFAULT_MODEL,
      system: SYSTEM_PROMPT,
      max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
      tools: TOOLS,
      messages: session.history,
    });

    const toolCalls = (response.content || []).filter((b) => b.type === 'tool_use');
    const toolResults = [];

    for (const tc of toolCalls) {
      const input = this.extractInput(tc);
      const guardResult = await this.guard.check(input, { sessionId });

      const toolResult = {
        toolName: tc.name,
        toolCallId: tc.id,
        input,
        guardResult,
      };

      if (guardResult.decision === 'BLOCK') {
        toolResult.status = 'BLOCKED';
        toolResult.error = `TEOS Sentinel BLOCKED: ${guardResult.reasons.join('; ')} (risk: ${guardResult.riskScore}/100, audit: ${guardResult.auditHash.slice(0, 16)}...)`;

        session.history.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({
            error: 'TEOS_BLOCKED',
            message: toolResult.error,
            auditHash: guardResult.auditHash,
            riskScore: guardResult.riskScore,
            reasons: guardResult.reasons,
          }),
        });
      } else if (guardResult.decision === 'WARN') {
        toolResult.status = 'WARNED';
        toolResult.message = `[TEOS] WARNING — ${guardResult.reasons.join('; ')} (risk: ${guardResult.riskScore}/100)`;

        session.history.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({
            status: 'WARNED',
            message: toolResult.message,
            toolName: tc.name,
            auditHash: guardResult.auditHash,
          }),
        });
      } else {
        toolResult.status = 'ALLOWED';
        toolResult.message = `[TEOS] ALLOW (risk: ${guardResult.riskScore}/100)`;

        session.history.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({
            status: 'ALLOWED',
            message: toolResult.message,
            toolName: tc.name,
            auditHash: guardResult.auditHash,
          }),
        });
      }

      toolResults.push(toolResult);
    }

    session.history.push({ role: 'assistant', content: response.content });

    return {
      sessionId,
      response,
      toolResults,
      blocked: toolResults.some((r) => r.status === 'BLOCKED'),
      warned: toolResults.some((r) => r.status === 'WARNED'),
    };
  }

  extractInput(toolCall) {
    if (typeof toolCall.input === 'string') return toolCall.input;
    if (toolCall.input?.command) return toolCall.input.command;
    if (toolCall.input?.content) return toolCall.input.content;
    if (toolCall.input?.code) return toolCall.input.code;
    return JSON.stringify(toolCall.input || '');
  }

  async checkToolCall(toolName, toolInput) {
    if (!this.guard) {
      return { decision: 'ALLOW', riskScore: 0, reasons: ['Guard not initialized'] };
    }

    let input;
    if (typeof toolInput === 'string') {
      input = toolInput;
    } else if (toolInput?.command) {
      input = toolInput.command;
    } else if (toolInput?.content) {
      input = toolInput.content;
    } else {
      input = JSON.stringify(toolInput || '');
    }

    return await this.guard.check(input, { sessionId: `tool_${Date.now()}` });
  }

  async getMetrics() {
    if (!this.guard) return null;
    return await this.guard.getMetrics();
  }

  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  getSessionCount() {
    return this.sessions.size;
  }
}

const claudeService = new ClaudeService();

module.exports = {
  claudeService,
  ClaudeService,
  SYSTEM_PROMPT,
  TOOLS,
};
