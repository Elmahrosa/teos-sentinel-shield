import { teosLoop } from './sentinel-guard.js';

export async function sentinelFeedbackHook(toolName, toolInput, sessionId) {
  if (!/Bash|Write|Edit|Delete|Rename/.test(toolName)) {
    return { action: 'allow' };
  }

  const command = toolInput.command || toolInput.path || JSON.stringify(toolInput);

  const claudeRewrite = async (feedback) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY not configured — returning original command');
      return command;
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: feedback
        }]
      })
    });
    const data = await response.json();
    return data.content?.[0]?.text?.trim() || command;
  };

  const result = await teosLoop(command, sessionId, claudeRewrite);

  switch (result.status) {
    case 'executed':
    case 'executed_with_warning':
      return { action: 'allow', modified_command: result.command };
    case 'permanently_blocked':
    case 'user_rejected':
    case 'blocked_unknown':
      return {
        action: 'block',
        reason: `TEOS SENTINEL SHIELD — BLOCKED\n${result.reason}\nRisk: ${result.risk || 100}/100`
      };
  }
}
