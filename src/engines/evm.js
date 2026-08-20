const EVM_RULES = [
  // ── Reentrancy ──
  { id: 'E01', name: 'REENTRANCY',                  sev: 'critical', score: 98,
    test: c => /\b(?:call|delegatecall|staticcall)\s*\{[^}]*value[^}]*\}\s*\([^)]*\)[^;]{0,300}?\b(?:transfer|send|call)\b[^;]{0,200}?\b(?:after|then|subsequen)\b/i.test(c) ||
               /\b(?:\.call|\.delegatecall)\s*\{[^}]*\}[^;]{0,500}?\b(?:state|storage|balance|mapping|array)\b[^;]{0,200}?\b(?:update|write|modify|set|push|delete)\b/i.test(c) ||
               /\bchecks.+(?:effects|interactions)\b|CEI/i.test(c) ||
               /\b(?:send|transfer)\s*\([^)]*\)[^;]{0,500}?\b(?:state|balance|mapping)\b[^;]{0,200}?\b(?:update|write|modify)\b(?!.*\b(?:reentrancy|guard|mutex|lock|nonReentrant)\b)/i.test(c) ||
               /\b\.call\s*\{[^}]*value[^}]*\}[\s\S]{0,500}?\w+\s*\[[^\]]*\]\s*=\s*\d+/i.test(c),
    reasons: ['Reentrancy vulnerability — external call before state update', 'CEI (Checks-Effects-Interactions) pattern violated'] },
  { id: 'E02', name: 'REENTRANCY_GUARD_MISSING',    sev: 'high', score: 88,
    test: c => /\b(?:withdraw|claim|redeem|collect|harvest|getReward)\b[^;]{0,300}?\b(?:call|delegatecall|send|transfer)\b[^;]{0,200}?\b(?:address|msg\.sender|user|beneficiary)\b[^;]{0,200}?\b(?:\.call\b|\.transfer\b|\.send\b)/i.test(c) &&
               !/\b(?:reentrancy|nonReentrant|mutex|lock|guard|ReentrancyGuard)\b/i.test(c),
    reasons: ['Reentrancy guard missing on withdraw/claim function'] },
  { id: 'E03', name: 'CROSS_FUNCTION_REENTRANCY',   sev: 'high', score: 85,
    test: c => /\b(?:function|modifier)\b[^;]{0,200}?\b(?:public|external)\b[^;]{0,200}?\b(?:call|delegatecall)\b[^;]{0,200}?\b(?:address|contract|external)\b[^;]{0,200}?\b(?:state|storage|balance|mapping)\b[^;]{0,200}?\b(?:update|write|modify|set)\b/i.test(c) &&
               /\b(?:call|delegatecall)\b[^;]{0,200}?\b(?:external|address)\b[^;]{0,200}?\b(?:state|storage|balance|mapping)\b[^;]{0,200}?\b(?:update|write|modify|set)\b/i.test(c),
    reasons: ['Cross-function reentrancy — multiple functions share state without reentrancy protection'] },

  // ── Delegatecall ──
  { id: 'E04', name: 'DELEGATECALL_UNCHECKED',      sev: 'critical', score: 97,
    test: c => /\bdelegatecall\b[^;]{0,300}?\b(?:without|no)\s+(?:check|verify|validate|assert)\b/i.test(c) ||
               /\bdelegatecall\b[^;]{0,300}?\b(?:msg\.data|_data|input|data)\b[^;]{0,300}?\b(?:without|no)\s+(?:check|verify|validate|assert)\b/i.test(c) ||
               /\b(?:function\s+[a-z_]\w*\s*\([^)]*\)\s*(?:public|external)\s*(?:payable)?\s*\{[^}]*delegatecall)/i.test(c) &&
               !/\b(?:onlyOwner|owner\s*==\s*msg\.sender|require.*owner|auth)/i.test(c),
    reasons: ['Unchecked delegatecall — arbitrary code execution in caller context', 'Storage corruption via delegatecall to untrusted contract'] },
  { id: 'E05', name: 'DELEGATECALL_LOOP',           sev: 'high', score: 86,
    test: c => /\bdelegatecall\b[^;]{0,300}?\b(?:for|while|loop|array|mapping\[|list)\b/i.test(c),
    reasons: ['Delegatecall in loop — mass storage corruption risk'] },

  // ── Overflow / Underflow ──
  { id: 'E06', name: 'INTEGER_OVERFLOW',            sev: 'high', score: 85,
    test: c => /\b(?:uint|int)(?:8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)\b[^;]{0,200}?\b(?:[+\-*\/]|[-+*]=)\b[^;]{0,200}?\b(?:return|mapping|storage|push)\b/i.test(c) &&
               !/(?:SafeMath|SafeCast|unchecked|solc\s*0\.8|overflow|checked)/i.test(c),
    reasons: ['Integer overflow/underflow vulnerability — use Solidity 0.8+ or SafeMath'] },
  { id: 'E07', name: 'UNCHECKED_MATH_BLOCK',        sev: 'medium', score: 72,
    test: c => /\bunchecked\s*\{[^}]{0,500}?(?:[+\-*\/=]|[+\-*]=)/i.test(c) &&
               /(?:balance|amount|total|supply|value|reward|fee)\b[^;]{0,100}?\b(?:[+\-*\/]|[-+*]=)/i.test(c),
    reasons: ['Unchecked math block with financial operations — silent overflow/underflow'] },

  // ── Access Control ──
  { id: 'E08', name: 'OWNER_CHECK_MISSING',         sev: 'critical', score: 95,
    test: c => /\b(?:function|modifier)\b[^;]{0,200}?\b(?:public|external)\b[^;]{0,200}?\b(?:withdraw|claim|mint|burn|set|update|change|transfer|destroy|kill|pause|unpause)\b/i.test(c) &&
               !/(?:onlyOwner|Ownable|auth|require.*owner|require.*msg\.sender|modifier\s+\w+Auth|accessControl|role|Admin)/i.test(c),
    reasons: ['Missing owner/access control on privileged function'] },
  { id: 'E09', name: 'TX_ORIGIN_AUTH',              sev: 'high', score: 88,
    test: c => /\btx\.origin\b[^;]{0,200}?\b(?:==|===|!=|!==)\b[^;]{0,200}?\b(?:owner|admin|auth)\b/i.test(c) ||
               /\btx\.origin\b[^;]{0,300}?\b(?:owner|admin|auth)\b/i.test(c),
    reasons: ['tx.origin used for authentication — phishing vulnerability'] },
  { id: 'E10', name: 'TIMELOCK_BYPASS',             sev: 'high', score: 85,
    test: c => /\b(?:timelock|time_lock|TimeLock)\b[^;]{0,200}?\b(?:bypass|skip|override|disable|cancel|emergency)\b/i.test(c) ||
               /\b(?:bypass|skip|override|disable).{0,100}?(?:timelock|time_lock|TimeLock)\b/i.test(c),
    reasons: ['Timelock bypass detected — governance protection overridden'] },

  // ── Flash Loan ──
  { id: 'E11', name: 'FLASH_LOAN_CHECK',            sev: 'high', score: 86,
    test: c => /\b(?:flash|flashloan|flash_loan)\b[^;]{0,200}?\b(?:without|no|skip|missing)\s+(?:check|verify|validation)\b/i.test(c) ||
               /\b(?:flashMint|flashLoan|flash_loan)\b[^;]{0,200}?\b(?:fee\s*=\s*0|fee\s*=\s*zero|noFee|zeroFee|withoutFee)\b/i.test(c) ||
               /\b(?:flashMint|flashLoan|flash_loan)\b/i.test(c) && /\bfee\s*=\s*0\b/i.test(c),
    reasons: ['Flash loan without balance verification — price manipulation risk'] },

  // ── Timestamp Dependency ──
  { id: 'E12', name: 'TIMESTAMP_DEPENDENCY',        sev: 'medium', score: 70,
    test: c => /\bblock\.timestamp\b[^;]{0,200}?\b(?:==|!=|===|!==|<\s*[a-z]|>\s*[a-z])\b/i.test(c) ||
               /\b(?:now|block\.timestamp)\b[^;]{0,200}?\b(?:require|if|while|for)\b[^;]{0,200}?\b(?:>\s*|<\s*|==\s*|>=\s*|<=\s*)/i.test(c) ||
               /\bblock\.timestamp\b[^;]{0,200}?(?:>|<|>=|<=|==|!=)\s*[a-z_]\w*\b/i.test(c),
    reasons: ['Block.timestamp dependency — miner manipulation ±15 seconds'] },

  // ── Gas ──
  { id: 'E13', name: 'GAS_DEPENDENCY',              sev: 'medium', score: 65,
    test: c => /\b(?:gasleft|msg\.gas|gas_limit)\b[^;]{0,200}?\b(?:==|!=|>|<)\b/i.test(c),
    reasons: ['Gas-dependent logic — manipulation via gas price/limit'] },

  // ── Uninitialized Storage ──
  { id: 'E14', name: 'UNINITIALIZED_STORAGE',       sev: 'critical', score: 94,
    test: c => /\b(?:struct|contract)\b[^;]{0,200}?\b(?:public|external)\b[^;]{0,200}?\b[^;]{0,200}?\b(?:initialize|init)\b[^;]{0,300}?\b(?:public|external)\b[^;]{0,200}?\b[^;]{0,200}?\b(?:without|no)\s+(?:onlyOwner|modifier|auth|require)/i.test(c) ||
               /\b(?:initialize|init)\s*\([^)]*\)\s*(?:public|external)\s*\{[^}]*\b(?:owner|admin)\s*=\s*msg\.s/i.test(c) &&
               !/\b(?:initializer|onlyInitializing|once|modifier)\b/i.test(c),
    reasons: ['Uninitialized storage — anyone can initialize contract and become owner'] },

  // ── Selfdestruct ──
  { id: 'E15', name: 'SELFDESTRUCT',                sev: 'critical', score: 99,
    test: c => /\bselfdestruct\b/i.test(c) ||
               /\bsuicide\b/i.test(c),
    reasons: ['Selfdestruct detected — contract can be destroyed, all funds lost'] },

  // ── Insecure Randomness ──
  { id: 'E16', name: 'INSECURE_RANDOMNESS',         sev: 'high', score: 88,
    test: c => /\b(?:block\.hash|blockhash|block\.difficulty|block\.prevrandao)\b[^;]{0,200}?\b(?:random|randomness|shuffle|pick|select|determine|choose|winner)\b/i.test(c) ||
               /\b(?:block\.difficulty|blockhash|block\.prevrandao)\b/i.test(c) && /\b(?:random|keccak|sha|encodePacked)\b/i.test(c),
    reasons: ['Insecure randomness — miner-controlled block hash used for randomness'] },

  // ── Function Default Visibility ──
  { id: 'E17', name: 'DEFAULT_VISIBILITY',          sev: 'high', score: 88,
    test: c => /\bfunction\s+\w+\s*\([^)]*\)\s*\{[^}]*\b(?:selfdestruct|suicide|call|delegatecall|send|transfer)\b/i.test(c) &&
               /(?:^|[\s;])\w+\s*\([^)]*\)\s*\{/i.test(c) &&
               !/(?:public|private|internal|external)\s*\b/.test(c.substring(0, 200)),
    reasons: ['Function with default visibility — may be called by anyone'] },

  // ── Arbitrary Jump ──
  { id: 'E18', name: 'ARBITRARY_JUMP',              sev: 'high', score: 88,
    test: c => /\b(?:assembly|asm)\b[^;]{0,500}?\b(?:jump|jumpi|jumpdest)\b/i.test(c) &&
               /\b(?:assembly|asm)\b[^;]{0,500}?\b(?:mstore|mload|sstore|sload)\b/i.test(c),
    reasons: ['Arbitrary jump in assembly — control flow hijacking risk'] },

  // ── DoS ──
  { id: 'E19', name: 'DOS_WITH_REVERT',             sev: 'high', score: 88,
    test: c => /\b(?:for|while)\b[^;]{0,200}?\b(?:>\s*100|>\s*200|>\s*500)\b[^;]{0,200}?\b(?:\+\+|--)\b[^;]{0,200}?\b(?:user|holder|address|member)\b/i.test(c) ||
               /\b(?:for|while)\b[\s\S]{0,300}?\b(?:user|holder|address|member)\w*[\s\S]{0,100}?\blength\b/i.test(c),
    reasons: ['Unbounded loop over dynamic array — gas exhaustion DoS'] },
  { id: 'E20', name: 'DOS_WITH_PUSH',               sev: 'medium', score: 74,
    test: c => /\barray\b[^;]{0,200}?\b(?:push|\.push)\b[^;]{0,200}?\b(?:for|while|loop)\b[^;]{0,200}?\b(?:user|address|member|holder)\b/i.test(c),
    reasons: ['Array push in loop — gas cost grows unbounded'] },

  // ── Phishing ──
  { id: 'E21', name: 'ADDRESS_LIST_PHISHING',       sev: 'medium', score: 68,
    test: c => /\b(?:approve|increaseAllowance)\b[^;]{0,200}?\b(?:type|spender)\s*[=:]\s*["'`][^"'`]{0,100}["'`]/i.test(c) &&
               /\b(?:unlimited|max|maxUint|type\(uint\)\.max)\b/i.test(c),
    reasons: ['Unlimited token approval to hardcoded address — phishing risk'] },
];

const { extractMatch, toRecommendation } = require('./finding-utils');
const { isBudgetExceeded, safeRuleInput } = require('../../lib/regex-guard');

function runEvmEngine(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return { verdict: 'ERROR', score: 0, rule: 'E00.ERROR', reasons: ['No input provided'], findings: [] };
  }

  const ruleInput = safeRuleInput(input);
  const startMs = Date.now();
  const triggered = [];
  let maxScore = 0;
  let topRule = null;

  for (let i = 0; i < EVM_RULES.length; i++) {
    const rule = EVM_RULES[i];
    if (i % 10 === 0 && isBudgetExceeded(startMs)) break;
    try {
      if (rule.test(ruleInput)) {
        triggered.push(rule);
        if (rule.score > maxScore) {
          maxScore = rule.score;
          topRule = rule;
        }
      }
    } catch (e) { /* skip rule on error */ }
  }

  const findings = triggered.map(t => ({
    ruleId: t.id, name: t.name, severity: t.sev,
    score: t.score, reasons: t.reasons,
    matchedPattern: extractMatch(input, t),
    recommendation: toRecommendation(t.reasons, t.sev),
  }));

  if (!topRule) {
    return {
      verdict: 'ALLOW', score: 0, rule: 'E00.CLEAN',
      reasons: ['No EVM security violations detected'],
      findings, timestamp: new Date().toISOString(),
      engine: 'evm', totalRules: EVM_RULES.length,
    };
  }

  const verdict = maxScore >= 85 ? 'BLOCK' : maxScore >= 60 ? 'WARN' : 'REVIEW';
  return {
    verdict, score: maxScore, rule: `${topRule.id}.${topRule.name}`,
    ruleId: topRule.id, severity: topRule.sev,
    reasons: topRule.reasons,
    findings, timestamp: new Date().toISOString(),
    engine: 'evm', totalRules: EVM_RULES.length,
  };
}

module.exports = { runEvmEngine, EVM_RULES };
