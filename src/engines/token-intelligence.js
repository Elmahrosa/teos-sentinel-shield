const TOKEN_INTELLIGENCE_RULES = [
  // ── Supply ──
  { id: 'T01', name: 'UNLIMITED_MINT',                sev: 'critical', score: 98,
    test: c => /\b(?:mint|mint_to|mintToken|mint_\w*)[^;]{0,300}?\b(?:unlimited|anyone|any|arbitrary|without|no)\s+(?:limit|cap|bound|check|auth)\b/i.test(c) ||
               /\b(?:mintAuthority|mint_authority)\b[^;]{0,200}?=\s*(?:null|none|undefined|pubkey::default|address\(0\)|0x0)\b/i.test(c) ||
               /\b(?:mint|_mint)\s*\([^)]*\)\s*(?:public|external|internal)?\s*(?:onlyOwner|onlyRole)?\s*\{[^}]*\b(?:require|if)\b(?!.*\b(?:require|if)\b)/i.test(c) ||
               /mintAuthority\s*=\s*null/i.test(c),
    reasons: ['Unlimited mint — supply can be inflated to zero value', 'Mint authority unset or missing cap — infinite inflation possible'] },
  { id: 'T02', name: 'SUPPLY_MANIPULATION',           sev: 'critical', score: 95,
    test: c => /\b(?:burn|burn_from|burnFrom)\b[^;]{0,200}?\b(?:anyone|any|arbitrary)\b[^;]{0,200}?\b(?:without|no)\s+(?:check|auth|verify|approval)\b/i.test(c) ||
               /\b(?:totalSupply|_totalSupply)\b[^;]{0,200}?[=:][^;]*(?:adjust|modify|set|decrement)\b(?!.*\b(?:mint|burn)\b)/i.test(c) ||
               /totalSupply\s*=\s*totalSupply\s*-\s*\d+/i.test(c),
    reasons: ['Total supply directly manipulated — bypasses mint/burn accounting'] },
  { id: 'T03', name: 'SUPPLY_CAP',                   sev: 'high', score: 82,
    test: c => /\b(?:mint|_mint)\s*\([^)]*\)[^;]{0,300}?\b(?:for|while)\b[^;]{0,200}?\b(?:unlimited|no\s+limit|max\s*=\s*0|max\s*=\s*type\()/i.test(c),
    reasons: ['No supply cap — token can be minted indefinitely'] },

  // ── Ownership ──
  { id: 'T04', name: 'RENOUNCE_OWNERSHIP',            sev: 'critical', score: 94,
    test: c => /\b(?:renounce|renounceOwnership|transferOwnership)\b[^;]{0,200}?(?:to\s+)?(?:address\s*\(\s*0\s*\)|0x0|0x0000000000000000000000000000000000000000|null|dead)\b/i.test(c) ||
               /renounceOwnership\s*\(0x0/i.test(c),
    reasons: ['Ownership renounced to zero address — no contract admin possible', 'Irreversible — cannot add liquidity, pause, or upgrade'] },
  { id: 'T05', name: 'OWNERSHIP_TRANSFER',            sev: 'high', score: 85,
    test: c => /\b(?:transferOwnership|owner_transfer|changeOwner)\b[^;]{0,200}?\b(?:anyone|any|arbitrary|msg\.sender)\b[^;]{0,200}?\b(?:without|no)\s+(?:two_factor|timelock|delay|multi_sig)\b/i.test(c),
    reasons: ['Ownership transferrable without two-factor or timelock — single-key risk'] },
  { id: 'T06', name: 'MULTI_OWNER_MISSING',           sev: 'medium', score: 72,
    test: c => /\b(?:owner|admin)\b[^;]{0,200}?\b(?:=\s*msg\.sender|==\s*msg\.sender)\b[^;]{0,200}?\b(?:only|single|one)\b/i.test(c),
    reasons: ['Single owner — single point of failure, no multisig fallback'] },

  // ── Liquidity ──
  { id: 'T07', name: 'LIQUIDITY_LOCK_ABSENT',         sev: 'high', score: 88,
    test: c => /\b(?:lock|liquidity_lock|lockLiquidity)\b[^;]{0,200}?\b(?:without|no|skip|missing|absent)\b/i.test(c) ||
               /\b(?:initialize|init)\b[^;]{0,200}?\b(?:pool|pair|amm)\b[^;]{0,200}?\b(?:add|liquidity)\b[^;]{0,200}?\b(?:without|no)\s+(?:lock|timelock|cliff)\b/i.test(c),
    reasons: ['Liquidity not locked — rug pull: LP tokens can be withdrawn anytime'] },
  { id: 'T08', name: 'LIQUIDITY_REMOVAL',             sev: 'critical', score: 96,
    test: c => /\b(?:remove|withdraw|pull)\b[^;]{0,200}?\b(?:liquidity|pool)\b[^;]{0,200}?\b(?:anyone|any|without|no)\s+(?:check|auth|timelock|delay)\b/i.test(c) ||
               /removeLiquidity\s*\(\s*\)\s*public.*withdraw_all/i.test(c),
    reasons: ['Immediate liquidity removal without delay — rug pull vector'] },

  // ── Honeypot ──
  { id: 'T09', name: 'HONEYPOT_SELL_RESTRICTED',      sev: 'critical', score: 97,
    test: c => /\b(?:sell|transfer|_transfer|transferFrom)\b[^;]{0,300}?\b(?:revert|require\s*\(false|return|throw)\b[^;]{0,200}?\b(?:sender|from|account|holder)\b[^;]{0,200}?\b(?:!=|!==|not)\b[^;]{0,200}?\b(?:owner|admin|white|excluded)\b(?!.*\b(?:buy|purchase|swap|allow)\b)/i.test(c) ||
               /\b(?:blacklist|block)\b[^;]{0,200}?\b(?:seller|sell|transfer|market|all)\b[^;]{0,200}?\b(?:except|only|unless)\b/i.test(c) ||
               /msg\.sender\s*!=\s*owner\s*\)\s*revert.*only\s*owner\s*can\s*sell/i.test(c),
    reasons: ['Sell function restricted — honeypot: users can buy but not sell'] },
  { id: 'T10', name: 'HONEYPOT_FEE_STRUCTURE',        sev: 'high', score: 86,
    test: c => /\bfee\b[^;]{0,100}?\b(?:buy|sell|transfer)\b[^;]{0,200}?\b(?:>\s*25|>\s*30|90|95|99)\b/i.test(c) ||
               /\b(?:sellFee|sell_fee|sellTax)\b[^;]{0,200}?\b(?:>\s*buyFee|>\s*buy_fee|>\s*\d{2,3})\b[^;]{0,200}?\b(?:%|percent|basis)/i.test(c),
    reasons: ['Excessive sell fee — honeypot pattern: buy is cheap, sell is prohibitively expensive'] },

  // ── Tax ──
  { id: 'T11', name: 'TAX_MANIPULATION',              sev: 'high', score: 84,
    test: c => /\b(?:tax|fee|surcharge)\b[^;]{0,100}?\b(?:set|change|update|modify)\b[^;]{0,100}?\b(?:anyone|any|msg\.sender|arbitrary|caller)\b/i.test(c) ||
               /\b(?:max_tax|max_fee|tax_cap)\b[^;]{0,200}?\b(?:=\s*(?:0|no|unlimited|none))\b/i.test(c),
    reasons: ['Tax rate adjustable by anyone — can set to 100% and trap funds'] },
  { id: 'T12', name: 'TAX_CHANGE_DELAY',              sev: 'medium', score: 70,
    test: c => /\b(?:tax|fee)\b[^;]{0,200}?\b(?:set|change|update|modify)\b[^;]{0,200}?\b(?:without|no)\s+(?:timelock|delay|notice|two_step)\b/i.test(c),
    reasons: ['Tax can be changed instantly — no user notice period'] },

  // ── Ownership Concentration ──
  { id: 'T13', name: 'OWNER_CONCENTRATION',            sev: 'high', score: 83,
    test: c => /\b(?:owner|deployer|creator)\b[^;]{0,200}?\b(?:balance|hold|own|mint)\b[^;]{0,200}?\b(?:99|100|all|total|entire|majority|>\s*50)\b[^;]{0,200}?\b(?:%|percent|supply|of)\b/i.test(c),
    reasons: ['Owner controls majority supply — price manipulation risk'] },
  { id: 'T14', name: 'CONCENTRATED_HOLDING',          sev: 'medium', score: 74,
    test: c => /\b(?:presale|private_sale|airdrop)\b[^;]{0,200}?\b(?:owner|founder|team|dev)\b[^;]{0,200}?\b(?:90|80|>=\s*80|all|large)\b[^;]{0,200}?\b(?:%|percent)\b/i.test(c),
    reasons: ['Team holds large allocation — potential for coordinated dump'] },

  // ── Proxy / Upgrade ──
  { id: 'T15', name: 'PROXY_UPGRADE_UNRESTRICTED',    sev: 'critical', score: 95,
    test: c => /\b(?:upgradeTo|upgradeToAndCall|_upgradeTo)\b[^;]{0,200}?\b(?:anyone|any|msg\.sender|arbitrary)\b[^;]{0,200}?\b(?:without|no)\s+(?:auth|check|timelock|vote)\b/i.test(c) ||
               /\b(?:UUPS|TransparentUpgradeableProxy)\b[^;]{0,200}?\b(?:initialize|init)\b[^;]{0,200}?\b(?:public|external)\b[^;]{0,200}?\b(?:without|no)\s+(?:onlyOwner|initializer|auth)\b/i.test(c) ||
               /function\s+upgradeTo\s*\([^)]*\)\s*public/i.test(c),
    reasons: ['Proxy upgrade unrestricted — contract can be replaced with malicious logic', 'UUPS initialization missing — attacker can become proxy admin'] },
  { id: 'T16', name: 'PROXY_ADMIN_CHANGE',            sev: 'high', score: 88,
    test: c => /\b(?:changeAdmin|transferProxyAdmin|setAdmin)\b[^;]{0,200}?\b(?:anyone|any|msg\.sender|arbitrary)\b/i.test(c) ||
               /\bproxyAdmin\b[^;]{0,200}?\b(?:=\s*(?:null|none|address\(0\)|0x0))\b/i.test(c),
    reasons: ['Proxy admin transferrable without restriction — proxy can be hijacked'] },

  // ── Blacklist ──
  { id: 'T17', name: 'BLACKLIST_MANIPULATION',        sev: 'high', score: 85,
    test: c => /\b(?:blacklist|block|ban|exclude)\b[^;]{0,200}?\b(?:add|include|set)\b[^;]{0,200}?\b(?:all|any|every)\b[^;]{0,200}?\b(?:holder|user|address|wallet)\b/i.test(c) ||
               /blacklist\s*\.\s*add\s*\(\s*all_holders\s*\)/i.test(c),
    reasons: ['Broad blacklist power — can freeze all holders and centralize control'] },
  { id: 'T18', name: 'BLACKLIST_ADD_UNRESTRICTED',    sev: 'high', score: 82,
    test: c => /\b(?:addBlacklist|blockAccount|blacklistAdd)\b[^;]{0,200}?\b(?:anyone|any|msg\.sender|arbitrary)\b/i.test(c),
    reasons: ['Anyone can add to blacklist — griefing attack vector'] },

  // ── Reflection / Rewards ──
  { id: 'T19', name: 'REFLECTION_MANIPULATION',       sev: 'high', score: 80,
    test: c => /\b(?:reflection|reward|dividend|yield)\b[^;]{0,200}?\b(?:calc|calculate|set|update)\b[^;]{0,200}?\b(?:without|no)\s+(?:fee|tax|check)\b/i.test(c) ||
               /\b(?:excludeFromReward|excludeFromFee)\b[^;]{0,200}?\b(?:owner|admin|team)\b[^;]{0,200}?\b(?:and|also)\b[^;]{0,200}?\b(?:all|every|any)\b/i.test(c),
    reasons: ['Reward calculation can be manipulated — team can exclude from redistribution'] },
  { id: 'T20', name: 'REFLECTION_EXCLUSION',          sev: 'medium', score: 74,
    test: c => /\b(?:excludeFromReward|excludeFromFee|includeInFee)\b[^;]{0,200}?\b(?:owner|deployer|admin)\b[^;]{0,300}?\b(?:true|yes|1)\b/i.test(c),
    reasons: ['Owner excluded from reflection — skewed reward distribution'] },

  // ── Pause ──
  { id: 'T21', name: 'PAUSE_UNRESTRICTED',            sev: 'high', score: 86,
    test: c => /\b(?:pause|pause_\w*)\b[^;]{0,200}?\b(?:anyone|any|msg\.sender|arbitrary)\b[^;]{0,200}?\b(?:public|external)\b[^;]{0,200}?\b(?:without|no)\s+(?:onlyOwner|auth|role)\b/i.test(c) ||
               /\b(?:pause|unpause)\b[^;]{0,200}?\b(?:public|external)\b[^;]{0,200}?\b(?:without|no)\s+(?:timelock|delay|auth)\b/i.test(c) ||
               /function\s+pause\s*\(\s*\)\s*public/i.test(c),
    reasons: ['Pause/unpause unrestricted — trade can be frozen arbitrarily'] },

  // ── Swap / Router ──
  { id: 'T22', name: 'SWAP_MIN_OUTPUT',               sev: 'high', score: 88,
    test: c => /\b(?:swap|swapExact|swap_\w*)\b[^;]{0,200}?\b(?:amountOutMin|minAmount|minOut)\b[^;]{0,200}?[=:]\s*0\b/i.test(c) ||
               /swapExact\w*\([^)]*,\s*0\s*,/i.test(c),
    reasons: ['Minimum output set to zero — MEV sandwich attack: receive nothing'] },
  { id: 'T23', name: 'SWAP_DEADLINE_MISSING',         sev: 'medium', score: 72,
    test: c => /\b(?:swap|swapExact|swap_\w*)\b[^;]{0,200}?\b(?:function|def|\([^)]*\))\b[^;]{0,200}?\b(?:without|no)\s+(?:deadline|expir|timeout)\b/i.test(c),
    reasons: ['Deadline missing — stale swap execution at unfavorable price'] },

  // ── Pair / Factory ──
  { id: 'T24', name: 'UNVERIFIED_FACTORY',            sev: 'high', score: 78,
    test: c => /\b(?:factory|pairFactory|routerFactory)\b[^;]{0,200}?\b(?:without|no)\s+(?:verify|check|assert)\b[^;]{0,200}?\b(?:mainnet|prod|official|canonical)\b/i.test(c),
    reasons: ['Unverified factory address — fake pair with malicious token'] },
  { id: 'T25', name: 'FALSE_PAIR',                    sev: 'medium', score: 76,
    test: c => /\b(?:createPair|getPair|pairFor)\b[^;]{0,200}?\b(?:anyone|any|arbitrary)\b[^;]{0,200}?\b(?:token|address)\b/i.test(c),
    reasons: ['Anyone can create trading pair — counterfeit token pairs possible'] },
];

const { extractMatch, toRecommendation } = require('./finding-utils');
const { isBudgetExceeded, safeRuleInput } = require('../../lib/regex-guard');

function runTokenIntelligenceEngine(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return { verdict: 'ERROR', score: 0, rule: 'T00.ERROR', reasons: ['No input provided'], findings: [] };
  }

  const ruleInput = safeRuleInput(input);
  const startMs = Date.now();
  const triggered = [];
  let maxScore = 0;
  let topRule = null;

  for (let i = 0; i < TOKEN_INTELLIGENCE_RULES.length; i++) {
    const rule = TOKEN_INTELLIGENCE_RULES[i];
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
      verdict: 'ALLOW', score: 0, rule: 'T00.CLEAN',
      reasons: ['No token risk indicators detected'],
      findings, timestamp: new Date().toISOString(),
      engine: 'token-intelligence', totalRules: TOKEN_INTELLIGENCE_RULES.length,
    };
  }

  const verdict = maxScore >= 85 ? 'BLOCK' : maxScore >= 60 ? 'WARN' : 'REVIEW';
  return {
    verdict, score: maxScore, rule: `${topRule.id}.${topRule.name}`,
    ruleId: topRule.id, severity: topRule.sev,
    reasons: topRule.reasons,
    findings, timestamp: new Date().toISOString(),
    engine: 'token-intelligence', totalRules: TOKEN_INTELLIGENCE_RULES.length,
  };
}

module.exports = { runTokenIntelligenceEngine, TOKEN_INTELLIGENCE_RULES };
