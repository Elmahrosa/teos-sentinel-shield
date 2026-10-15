const { modelService, MODELS } = require('../../services/model.service');
const { D } = require('../../utils/formatting');
const { mainMenu } = require('../menus');

async function modelCommand(ctx) {
  const userId = String(ctx.from.id);
  const args = ctx.message.text.split(' ').slice(1).join(' ').trim();

  const groqOk = !!process.env.GROQ_API_KEY;
  const anthropicOk = !!process.env.ANTHROPIC_API_KEY;
  const available = modelService.getAvailableModels(groqOk, anthropicOk);

  if (!args) {
    const current = modelService.getUserModel(userId);
    const cfg = MODELS[current];
    let lines = `🧠 Model Selection
${D}
Current: ${cfg?.label || 'llama3-8b'} (${cfg?.cost || 1} cr/msg)

Available models:`;

    for (const m of available) {
      const mark = m.id === current ? ' ◀' : '';
      lines += `\n/${m.id} — ${m.label} (${m.cost} cr)${mark}`;
    }

    const quickSelect = available.filter(m => ['llama3-8b', 'qwen', 'openai-20b'].includes(m.id));
    let quickLines = '';
    if (quickSelect.length > 0) {
      quickLines = '\n\nQuick-select:';
      for (const m of quickSelect) {
        quickLines += `\n/${m.id.replace('-8b', '').replace('-20b', '')} — ${m.label} (${m.cost} cr)`;
      }
    }

    lines += `\n\n${D}
Usage:
/model <model_id> — Switch model
/chat <message> — Chat with selected model${quickLines}

Examples:
/model llama3-70b
/chat Write a script to sort a CSV`;

    return ctx.reply(lines, mainMenu());
  }

  const modelId = args.toLowerCase().replace(/^\/+/, '');
  if (!MODELS[modelId]) {
    const valid = available.map(m => m.id).join(', ');
    return ctx.reply(`❌ Unknown model: "${modelId}"\nAvailable: ${valid}`, mainMenu());
  }

  const cfg = MODELS[modelId];
  if (cfg.provider === 'groq' && !groqOk) {
    return ctx.reply(`❌ ${cfg.label} requires GROQ_API_KEY — not configured yet.`, mainMenu());
  }
  if (cfg.provider === 'anthropic' && !anthropicOk) {
    return ctx.reply(`❌ Claude requires ANTHROPIC_API_KEY — not configured yet.`, mainMenu());
  }

  modelService.setUserModel(userId, modelId);

  const examples = {
    'llama3-8b': ['Write a Python script to sort a CSV', 'Explain how HTTPS works', 'Debug this: console.log(x.y.z)'],
    'llama3-70b': ['Write a React component for a file uploader', 'Optimize this SQL query', 'Explain zero-knowledge proofs'],
    'qwen': ['Summarize this article', 'Translate to Arabic', 'Write a poem about AI'],
    'openai-20b': ['Write a JSON API response', 'Explain REST principles', 'Generate test data'],
    'openai-120b': ['Analyze this codebase', 'Design a system architecture', 'Review security posture'],
    'claude': ['Analyze this architecture', 'Review this code for security issues', 'Design a microservice API'],
  };

  return ctx.reply(
`✅ *${cfg.label}* selected · ${cfg.cost} cr/msg
${cfg.desc}
${D}
Try it now:
/chat ${examples[modelId]?.[0] || 'Hello'}
/chat ${examples[modelId]?.[1] || 'Write a script'}
/chat ${examples[modelId]?.[2] || 'Explain a concept'}

💬 Or just send /chat with anything.
📊 Check /credits for balance.`,
    { parse_mode: "Markdown" }
  );
}

module.exports = { modelCommand };
