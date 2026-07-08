const CI_RULES = [
  // ── Workflow Injection ──
  { id: 'C01', name: 'CI_SCRIPT_INJECTION',           sev: 'critical', score: 96,
    test: c => /(?:run|script)\s*[=:]\s*["'`][^"'`]*\${{?\s*(?:github\.event|github\.context|github\.payload|github\.head_ref|github\.base_ref|github\.ref_name|github\.ref)\s*}?}?/i.test(c) ||
               /(?:run|script)\s*[=:]\s*["'`][^"'`]*\${{?\s*github\.event\.[^}]*}\s*}?/i.test(c) ||
               /\${{?\s*github\.event\./i.test(c),
    reasons: ['CI script injection — event payload concatenated into shell command', 'Attacker-controlled branch/tag name can execute arbitrary commands'] },
  { id: 'C02', name: 'CI_SECRET_IN_SCRIPT',            sev: 'critical', score: 94,
    test: c => /(?:run|script)\s*[=:]\s*["'`][^"'`]*\${{?\s*(?:secrets|SECRETS)\.[^}]*}?\s*}?/i.test(c) ||
               /(?:run|script)\s*[=:]\s*["'`][^"'`]*(?:echo|print|printf|cat)\s+(?:\$|%)\w*(?:SECRET|TOKEN|KEY|PASSWORD|API_KEY)/i.test(c) ||
               /\${{?\s*secrets\./i.test(c),
    reasons: ['CI script exposes secrets — secrets accessible in shell execution', 'Secret leakage via echo/print in CI pipeline'] },
  { id: 'C03', name: 'CI_PIPED_INSTALL',               sev: 'critical', score: 95,
    test: c => /(?:run|script)\s*[=:]\s*["'`][^"'`]*(?:curl|wget).*\|\s*(?:bash|sh|zsh|sudo)\b/i.test(c) ||
               /(?:curl|wget).*\|\s*(?:bash|sh|zsh|sudo)\b/i.test(c),
    reasons: ['Pipe-to-shell in CI — arbitrary remote code execution', 'Use pinned container images instead of inline scripts'] },

  // ── Permissions ──
  { id: 'C04', name: 'CI_WRITE_ALL_PERMS',             sev: 'high', score: 85,
    test: c => /permissions\s*:\s*write-all\b/i.test(c),
    reasons: ['Write-all permissions grant excessive access to repository', 'Limit permissions to specific scopes (contents: read, issues: write)'] },
  { id: 'C05', name: 'CI_WRITE_PERMISSIONS_CONTENTS',  sev: 'high', score: 82,
    test: c => /permissions\s*:\s*[^}]*\bcontents\s*:\s*write\b/i.test(c) &&
               !/permissions\s*:\s*[^}]*\b(?:read-all|contents\s*:\s*read)\b/i.test(c),
    reasons: ['Contents write permission on default — allows malicious commit push'] },
  { id: 'C06', name: 'CI_PERMISSIONS_MISSING',         sev: 'medium', score: 72,
    test: c => /(?:^|\n)\s*name\s*:\s*(?:test|build|deploy|ci|release)\b/i.test(c) &&
               !/permissions\s*:/i.test(c) &&
               /(?:pull_request|push|workflow_dispatch)\s*:/i.test(c),
    reasons: ['No explicit permissions block — defaults may be too broad'] },

  // ── Dangerous Actions ──
  { id: 'C07', name: 'CI_ACTIONS_BRANCH_MAIN',         sev: 'high', score: 85,
    test: c => /uses\s*:\s*[\w-]+\/[\w-]+@main\b/i.test(c) ||
               /uses\s*:\s*[\w-]+\/[\w-]+@master\b/i.test(c) ||
               /\/[\w-]+@main\b/i.test(c),
    reasons: ['Action pinned to mutable branch — supply chain risk from branch force-push'] },
  { id: 'C08', name: 'CI_ACTIONS_UNPINNED',             sev: 'medium', score: 68,
    test: c => /uses\s*:\s*[\w-]+\/[\w-]+@[\w.-]+\s*$/im.test(c) &&
               !/uses\s*:\s*[\w-]+\/[\w-]+@(?:v?\d+(?:\.\d+)*|[0-9a-f]{7,40})/i.test(c),
    reasons: ['Action not pinned to hash or semver — supply chain risk'] },
  { id: 'C09', name: 'CI_ACTIONS_SELF_HOSTED',          sev: 'medium', score: 62,
    test: c => /runs-on\s*:\s*self-hosted\b/i.test(c),
    reasons: ['Self-hosted runner — security responsibility on your infrastructure'] },

  // ── Credential Exposure ──
  { id: 'C10', name: 'CI_CREDENTIAL_CHECKOUT',          sev: 'critical', score: 92,
    test: c => /token\s*:\s*\${{?\s*secrets\.GITHUB_TOKEN\s*}?}?\s*[^;]*\bpersist-credentials\s*:\s*true\b/i.test(c) &&
               !/persist-credentials\s*:\s*false\b/i.test(c),
    reasons: ['Git checkout with persist-credentials=true — token accessible to post-job scripts'] },
  { id: 'C11', name: 'CI_TOKEN_ENVIRONMENT',            sev: 'high', score: 88,
    test: c => /env\s*:\s*[^}]*\b(?:GITHUB_TOKEN|GH_TOKEN|NPM_TOKEN|NUGET_API_KEY)\s*:/i.test(c),
    reasons: ['Token exposed as environment variable — accessible to all steps'] },

  // ── Checkout ──
  { id: 'C12', name: 'CI_SHALLOW_CHECKOUT',            sev: 'low', score: 40,
    test: c => /fetch-depth\s*:\s*0\b/i.test(c),
    reasons: ['Shallow checkout (fetch-depth: 0) fetches full history — may be unnecessary'] },
  { id: 'C13', name: 'CI_REF_CHECKOUT',                sev: 'high', score: 78,
    test: c => /git\s+checkout\s+\${{?\s*github\.(?:head_ref|base_ref|ref)\s*}?}?\s*[^;]*(?:before|after|pre|post)/i.test(c) ||
               /actions\/checkout@[^p][^;]*\bref\s*:\s*\${{?\s*github\.(?:head_ref|ref)\s*}?}?/i.test(c),
    reasons: ['PR checkout with user-controlled ref — possible code injection'] },

  // ── Secrets / Environment ──
  { id: 'C14', name: 'CI_ENVIRONMENT_PROD',            sev: 'medium', score: 66,
    test: c => /environment\s*:\s*production\b/i.test(c) && !/environment\s*:\s*(?:production|prod)\b[^;]*\breview\s*:\s*/i.test(c),
    reasons: ['Deploy to production environment without review — bypasses change control'] },
  { id: 'C15', name: 'CI_DEBUG_ENABLED',               sev: 'medium', score: 65,
    test: c => /ACTIONS_STEP_DEBUG\s*:\s*true\b/i.test(c) ||
               /ACTIONS_RUNNER_DEBUG\s*:\s*true\b/i.test(c),
    reasons: ['Debug mode enabled — secrets may be exposed in runner logs'] },
  { id: 'C16', name: 'CI_CHECKOUT_ALL_HISTORY',        sev: 'low', score: 35,
    test: c => /fetch-depth\s*:\s*0\b/i.test(c) && !/fetch-depth\s*:\s*1\b/i.test(c),
    reasons: ['Full git history checkout — reduces efficiency, increases attack surface'] },

  // ── Self-Hosted / Matrix ──
  { id: 'C17', name: 'CI_MATRIX_INJECTION',            sev: 'high', score: 88,
    test: c => /matrix\s*:[^}]*\${{?\s*github\.(?:event|context|payload)\.[^}]*}?\s*}?/i.test(c) ||
               /strategy\s*:\s*[^}]*matrix\b[^}]*\${{?\s*github\.event\.[^}]*}?\s*}?/i.test(c) ||
               /matrix.*github\.event\.inputs/i.test(c),
    reasons: ['Matrix variable sourced from event payload — injection via matrix param'] },
  { id: 'C18', name: 'CI_SELF_HOSTED_UNRESTRICTED',    sev: 'medium', score: 74,
    test: c => /runs-on\s*:\s*self-hosted\b/i.test(c) && !/runs-on\s*:\s*self-hosted\b[^;]*\blabel\b/i.test(c),
    reasons: ['Self-hosted runner without label restriction — any workflow uses it'] },

  // ── Artifact Safety ──
  { id: 'C19', name: 'CI_UPLOAD_ARTIFACT_SENSITIVE',   sev: 'high', score: 86,
    test: c => /actions\/upload-artifact@[^;]*\bwith\b[^;]*\bpath\s*:[^;]*(?:\.env|credentials|secrets|keys|tokens|\.pem|\.key|password)/i.test(c),
    reasons: ['Sensitive file uploaded as artifact — credential exposure risk'] },
  { id: 'C20', name: 'CI_ARTIFACT_RETENTION',         sev: 'medium', score: 60,
    test: c => /actions\/upload-artifact@[^;]*\bretention-days\s*:\s*(?:>[1-9]\d{2,}|[4-9]\d\d)/i.test(c),
    reasons: ['Long artifact retention period — increased exposure window'] },

  // ── OIDC ──
  { id: 'C21', name: 'CI_OIDC_DISABLED',              sev: 'high', score: 80,
    test: c => /id-token\s*:\s*write\b[^;]*\bpermissions\s*:[^}]*\bcontents\s*:\s*read\b/i.test(c) &&
               !/id-token\s*:\s*write\b/i.test(c) &&
               /aws|gcp|azure|vault|hashicorp/i.test(c),
    reasons: ['OIDC not configured for cloud access — long-lived credentials instead'] },

  // ── Condition Injection ──
  { id: 'C22', name: 'CI_IF_CONDITION_INJECTION',     sev: 'high', score: 88,
    test: c => /if\s*:\s*[^}]*\${{?\s*github\.event\.[^}]*}?\s*}?\s*[=!]=\s*["'`][^"'`]*["'`]/i.test(c) ||
               /if\s*:\s*github\.event\.(?:comment|issue|pull_request)\.[^}]*\s*==\s*["'`]/i.test(c),
    reasons: ['Condition based on event payload — injection via crafted event data'] },

  // ── Git Config ──
  { id: 'C23', name: 'CI_GIT_CONFIG_EXPOSURE',        sev: 'medium', score: 64,
    test: c => /git\s+config\s+(?:--global|user\.email|user\.name)\b[^;]*/i.test(c),
    reasons: ['Git config changes in CI — identity spoofing in commits'] },
];

const { extractMatch, toRecommendation } = require('./finding-utils');

function runCiEngine(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return { verdict: 'ERROR', score: 0, rule: 'C00.ERROR', reasons: ['No input provided'], findings: [] };
  }

  const triggered = [];
  let maxScore = 0;
  let topRule = null;

  for (const rule of CI_RULES) {
    try {
      if (rule.test(input)) {
        triggered.push(rule);
        if (rule.score > maxScore) {
          maxScore = rule.score;
          topRule = rule;
        }
      }
    } catch (e) { /* skip */ }
  }

  const findings = triggered.map(t => ({
    ruleId: t.id, name: t.name, severity: t.sev,
    score: t.score, reasons: t.reasons,
    matchedPattern: extractMatch(input, t),
    recommendation: toRecommendation(t.reasons, t.sev),
  }));

  if (!topRule) {
    return {
      verdict: 'ALLOW', score: 0, rule: 'C00.CLEAN',
      reasons: ['No CI/CD security violations detected'],
      findings, timestamp: new Date().toISOString(),
      engine: 'ci', totalRules: CI_RULES.length,
    };
  }

  const verdict = maxScore >= 85 ? 'BLOCK' : maxScore >= 60 ? 'WARN' : 'REVIEW';
  return {
    verdict, score: maxScore, rule: `${topRule.id}.${topRule.name}`,
    ruleId: topRule.id, severity: topRule.sev,
    reasons: topRule.reasons,
    findings, timestamp: new Date().toISOString(),
    engine: 'ci', totalRules: CI_RULES.length,
  };
}

module.exports = { runCiEngine, CI_RULES };
