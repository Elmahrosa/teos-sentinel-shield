const SENTINEL_ENDPOINT = 'https://sentinel.teoslinker.com/v1/scan';
const MAX_RETRIES = 3;

export async function teosLoop(command, sessionId, claudeRewrite, attempt = 1) {
  const result = await tenosScan(command, sessionId);

  if (result.decision === 'ALLOW') {
    console.log(`✅ ALLOW — Executing command`);
    return { status: 'executed', command, attempts: attempt, audit: result.audit_hash };
  }

  if (result.decision === 'WARN') {
    console.log(`⚠️ WARN — Risk: ${result.risk_score}/100`);
    console.log(`Reason: ${result.reasoning}`);
    const confirmed = await askUser(`Proceed with risk ${result.risk_score}/100? [y/N]`);
    if (confirmed) {
      return { status: 'executed_with_warning', command, risk: result.risk_score, audit: result.audit_hash };
    }
    return { status: 'user_rejected', command, reason: result.reasoning };
  }

  if (result.decision === 'BLOCK') {
    console.log(`❌ BLOCK — ${result.reasoning}`);
    console.log(`Rule violated: ${result.findings?.critical?.[0] || 'Unknown rule'}`);

    if (attempt >= MAX_RETRIES) {
      console.log(`🚫 Max retries reached (${MAX_RETRIES}). Command permanently blocked.`);
      return {
        status: 'permanently_blocked',
        command,
        reason: result.reasoning,
        risk: result.risk_score,
        audit: result.audit_hash
      };
    }

    const feedback = buildFeedback(result, command, attempt);
    console.log(`\n📋 Feedback sent to Claude:\n${feedback}`);

    const rewritten = await claudeRewrite(feedback);
    console.log(`\n🔄 Claude rewrote to: ${rewritten}`);

    return teosLoop(rewritten, sessionId, claudeRewrite, attempt + 1);
  }

  return { status: 'blocked_unknown', command, reason: 'Unknown verdict — fail closed' };
}

function buildFeedback(result, originalCommand, attempt) {
  const critical = result.findings?.critical || [];
  const rules = critical.map(f => `  - ${f}`).join('\n') || '  - High risk pattern detected';

  return `TEOS SENTINEL SHIELD — BLOCK FEEDBACK (Attempt ${attempt})
═══════════════════════════════════════════════════════
Original command: ${originalCommand}
Risk score: ${result.risk_score}/100
Decision: BLOCK
Reason: ${result.reasoning}
Rules violated:
${rules}

REQUIRED: Rewrite the command to achieve the same goal WITHOUT:
${critical.map(f => `  ✗ ${f}`).join('\n') || '  ✗ The detected dangerous pattern'}

CONSTRAINTS:
  - No destructive operations (rm -rf, dd, mkfs, format)
  - No secret exfiltration (no env vars in URLs)
  - No code execution from untrusted input (no base64 | bash)
  - No system access escalation (no sudo, chmod 777)
  - No fork bombs or process flooding

Provide ONLY the safe rewritten command. No explanation.`.trim();
}

async function tenosScan(command, sessionId) {
  try {
    const response = await fetch(SENTINEL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'Bash',
        command,
        session_id: sessionId,
        context: 'feedback_loop_v1'
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return { decision: 'BLOCK', risk_score: 100, reasoning: 'TEOS scan failed — fail closed', findings: {} };
    }

    return await response.json();
  } catch (error) {
    console.log(`⚠️ TEOS unreachable: ${error.message} — fail closed`);
    return {
      decision: 'BLOCK',
      risk_score: 100,
      reasoning: `TEOS unreachable: ${error.message}`,
      findings: { critical: ['Network failure — fail closed'] }
    };
  }
}

async function askUser(question) {
  console.log(`❓ ${question}`);
  return false;
}
