const axios = require('axios');
const { logger } = require('../../logger.cjs');

const MODELS = {
  'llama3-8b': {
    provider: 'groq',
    apiModel: 'llama-3.1-8b-instant',
    cost: 1,
    label: 'Llama 3 8B',
    desc: 'Fast, free, open-source',
  },
  'llama3-70b': {
    provider: 'groq',
    apiModel: 'llama-3.3-70b-versatile',
    cost: 2,
    label: 'Llama 3 70B',
    desc: 'Powerful, free, open-source',
  },
  'qwen': {
    provider: 'groq',
    apiModel: 'qwen/qwen3-32b',
    cost: 2,
    label: 'Qwen 3 32B',
    desc: 'Free, GPT-like quality via Groq',
  },
  'openai-20b': {
    provider: 'groq',
    apiModel: 'openai/gpt-oss-20b',
    cost: 2,
    label: 'OpenAI GPT-OSS 20B',
    desc: 'Free OpenAI open-source model via Groq',
  },
  'openai-120b': {
    provider: 'groq',
    apiModel: 'openai/gpt-oss-120b',
    cost: 3,
    label: 'OpenAI GPT-OSS 120B',
    desc: 'Free large OpenAI open-source model via Groq',
  },
  'claude': {
    provider: 'anthropic',
    apiModel: 'claude-sonnet-4-20250514',
    cost: 2,
    label: 'Claude Sonnet',
    desc: 'Premium, requires ANTHROPIC_API_KEY',
  },
  'claude-opus': {
    provider: 'anthropic',
    apiModel: 'claude-opus-4-20250514',
    cost: 3,
    label: 'Claude Opus',
    desc: 'Most capable, requires ANTHROPIC_API_KEY',
  },
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class ModelService {
  constructor() {
    this.userModels = new Map();
    this.sessions = new Map();
    this._lastGroqCall = 0;
    this._groqQueue = [];
    this._groqProcessing = false;
    this.providerStatus = new Map();
  }

  getAvailableModels(groqKey, anthropicKey) {
    const list = [];
    for (const [id, cfg] of Object.entries(MODELS)) {
      if (cfg.provider === 'groq' && !groqKey) continue;
      if (cfg.provider === 'anthropic' && !anthropicKey) continue;
      if (!this.isProviderHealthy(cfg.provider)) continue;
      list.push({ id, ...cfg });
    }
    return list;
  }

  getUserModel(userId) {
    const modelId = this.userModels.get(String(userId)) || 'llama3-8b';
    if (!this.isModelAvailable(modelId)) {
      const fallback = this.getAvailableModels(!!process.env.GROQ_API_KEY, !!process.env.ANTHROPIC_API_KEY);
      return fallback.length > 0 ? fallback[0].id : 'llama3-8b';
    }
    return modelId;
  }

  setUserModel(userId, modelId) {
    if (!MODELS[modelId]) return false;
    if (!this.isModelAvailable(modelId)) return false;
    this.userModels.set(String(userId), modelId);
    return true;
  }

  getModelCost(modelId) {
    return MODELS[modelId]?.cost || 1;
  }

  isProviderHealthy(provider) {
    const status = this.providerStatus.get(provider);
    if (!status) return true;
    return status.healthy;
  }

  markProviderUnhealthy(provider, error) {
    this.providerStatus.set(provider, {
      healthy: false,
      lastError: error,
      lastChecked: Date.now()
    });
    logger.warn({ provider, error }, `Provider ${provider} marked unhealthy`);
  }

  resetProviderStatus(provider) {
    this.providerStatus.delete(provider);
    logger.info({ provider }, `Provider ${provider} status reset`);
  }

  isModelAvailable(modelId) {
    const cfg = MODELS[modelId];
    if (!cfg) return false;
    if (cfg.provider === 'groq') return !!process.env.GROQ_API_KEY;
    if (cfg.provider === 'anthropic') {
      if (!process.env.ANTHROPIC_API_KEY) return false;
      return this.isProviderHealthy('anthropic');
    }
    return false;
  }

  async chat(userId, message, modelId) {
    const cfg = MODELS[modelId];
    if (!cfg) throw new Error(`Unknown model: ${modelId}`);

    if (cfg.provider === 'anthropic') {
      return this._chatAnthropic(userId, message, cfg);
    }
    return this._chatGroq(userId, message, cfg);
  }

  async _chatGroq(userId, message, cfg) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const sessionKey = `groq_${userId}`;
    let session = this.sessions.get(sessionKey);
    if (!session) {
      session = { messages: [{ role: 'system', content: SYSTEM_PROMPT }] };
      this.sessions.set(sessionKey, session);
    }

    session.messages.push({ role: 'user', content: message });

    await this._throttleGroq();

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await axios.post(GROQ_API_URL, {
          model: cfg.apiModel,
          messages: session.messages,
          max_tokens: 4096,
          temperature: 0.7,
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });

        const reply = res.data?.choices?.[0]?.message?.content || '';
        session.messages.push({ role: 'assistant', content: reply });

        if (session.messages.length > 20) {
          session.messages = [session.messages[0], ...session.messages.slice(-18)];
        }

        return { text: reply, model: cfg.label, sessionId: sessionKey };
      } catch (err) {
        if (err.response?.status === 429 && attempt < maxRetries) {
          const wait = (attempt + 1) * 2000;
          logger.warn({ attempt, wait }, 'Groq rate limited — retrying');
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        throw err;
      }
    }
  }

  async _throttleGroq() {
    const minInterval = 2000;
    const now = Date.now();
    const elapsed = now - this._lastGroqCall;
    if (elapsed < minInterval) {
      await new Promise(r => setTimeout(r, minInterval - elapsed));
    }
    this._lastGroqCall = Date.now();
  }

  async _chatAnthropic(userId, message, cfg) {
    const { claudeService } = require('./claude.service');
    if (!claudeService.isAvailable()) {
      this.markProviderUnhealthy('anthropic', 'Claude SDK not available');
      throw new Error('Claude not available');
    }
    let result;
    try {
      result = await claudeService.sendMessage(userId, message);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 401 || status === 403 || err?.message?.includes('billing') || err?.message?.includes('not authorized')) {
        this.markProviderUnhealthy('anthropic', err.message);
      }
      throw err;
    }
    const textBlocks = (result.response.content || []).filter(b => b.type === 'text');
    const text = textBlocks.map(b => b.text).join('\n\n');

    let toolSummary = '';
    if (result.toolResults?.length) {
      const blocked = result.toolResults.filter(r => r.status === 'BLOCKED');
      const warned = result.toolResults.filter(r => r.status === 'WARNED');
      if (blocked.length) toolSummary += `\n🚫 ${blocked.length} tool call(s) blocked by TEOS`;
      if (warned.length) toolSummary += `\n⚠️ ${warned.length} tool call(s) warned`;
    }

    return { text: text + toolSummary, model: cfg.label, sessionId: result.sessionId };
  }

  clearSession(userId) {
    this.sessions.delete(`groq_${userId}`);
    this.sessionIdCounter = 0;
  }
}

const SYSTEM_PROMPT = `You are TEOS Sentinel — a Sovereign AI Execution Firewall.

You help users write code, execute commands, and analyze systems — but ALL output is scanned by TEOS before it reaches the user.

Rules:
1. Never suggest destructive commands (rm -rf, dd, mkfs, fork bombs)
2. Never suggest crypto miners or malicious scripts
3. Never suggest exfiltration of data
4. Always prefer safe alternatives
5. Explain risks when asked about dangerous operations
6. Keep responses concise and actionable`;

const modelService = new ModelService();

module.exports = { modelService, ModelService, MODELS, SYSTEM_PROMPT };
