const DUE_DILIGENCE_RULES = [
  // ── Ownership & Control ──
  { id: 'DD01', name: 'ANONYMOUS_TEAM',               sev: 'critical', score: 94,
    test: c => /\b(?:anon|anonymous|pseudo|unknown|hidden)\b[^;]{0,200}?\b(?:team|dev|founder|creator|owner)\b/i.test(c) ||
               /\b(?:no\s+(?:team|founder|dev|creator)|no\s+(?:social|linkedin|github))\b/i.test(c) ||
               /\b(?:team|dev|founder|creator|owner)\b[^;]{0,200}?\b(?:anon|anonymous|pseudo|unknown|hidden)\b/i.test(c),
    reasons: ['Anonymous team — no accountability, high rug pull risk'] },
  { id: 'DD02', name: 'SINGLE_SIG_OWNER',              sev: 'high', score: 88,
    test: c => /\b(?:owner|admin|controller)\b[^;]{0,200}?\b(?:single\s+key|single\s+sig|private\s+key|one\s+person|one\s+entity)\b/i.test(c) ||
               /\b(?:onlyOwner|owner\s*==\s*msg\.sender)\b[^;]{0,200}?\b(?:without|no)\s+(?:multisig|multi_sig|2FA|timelock)\b/i.test(c),
    reasons: ['Single signer ownership — single point of compromise, no recovery path'] },
  { id: 'DD03', name: 'UNRESTRICTED_UPGRADE',          sev: 'critical', score: 96,
    test: c => /\b(?:upgrade|upgradeable|proxy)\b[^;]{0,200}?\b(?:without|no)\s+(?:timelock|delay|multi_sig|vote|governance|community)\b/i.test(c) &&
               /\b(?:owner|admin)\b[^;]{0,200}?\b(?:single|only|sole|one)\b/i.test(c) ||
               /\b(?:upgradeable|upgrade|proxy)\b[^;]{0,200}?(?:single|only|one)[- ]key\b/i.test(c),
    reasons: ['Upgradeable contract with single-key upgrade — rug pull vector'] },

  // ── Liquidity ──
  { id: 'DD04', name: 'UNLOCKED_LIQUIDITY',           sev: 'critical', score: 95,
    test: c => /\b(?:liquidity|lp)\b[^;]{0,200}?\b(?:unlocked|not\s+locked|no\s+lock|without\s+lock|expired|unlock)\b/i.test(c) ||
               /\b(?:lock_duration|lockup_period)\b[^;]{0,200}?\b(?:<\s*[6-9]\d|<\s*[1-9]\d{2}|0)\s*(?:day|month|year)/i.test(c),
    reasons: ['Liquidity not locked or lock expired — immediate rug pull possible'] },
  { id: 'DD05', name: 'LP_TOKEN_BURN_ABSENT',         sev: 'high', score: 86,
    test: c => /\b(?:lp|LPToken|pair_token)\b[^;]{0,200}?\b(?:burn|lock|send\s+to\s+(?:dead|null|zero))\b(?!.*\b(?:burn|lock|send)\b)/i.test(c),
    reasons: ['LP tokens not burned or locked — creator can drain liquidity'] },
  { id: 'DD06', name: 'LIQUIDITY_TIMELOCK',           sev: 'high', score: 84,
    test: c => /\b(?:lock|unlock)\b[^;]{0,200}?\b(?:liquidity)\b[^;]{0,200}?\b(?:<\s*[1-9]\d|<\s*[3-9]|<\s*[6-9]\d|short|immediate)\s*(?:day|month|week)/i.test(c),
    reasons: ['Liquidity lock duration too short — rug pull after lock expires'] },

  // ── Supply ──
  { id: 'DD07', name: 'UNLIMITED_MINT_AUTHORITY',     sev: 'critical', score: 97,
    test: c => /\b(?:mint|_mint)\b[^;]{0,200}?\b(?:without|no)\s+(?:cap|limit|bound|max)\b/i.test(c) &&
               /\b(?:owner|admin|authority)\b[^;]{0,200}?\b(?:single|only|one)\b/i.test(c),
    reasons: ['Unrestricted mint authority held by single account — infinite inflation'] },
  { id: 'DD08', name: 'OWNER_SUPPLY_CONCENTRATION',   sev: 'high', score: 88,
    test: c => /\b(?:owner|deployer|creator|team|dev)\b[^;]{0,200}?\b(?:hold|own|balance)\b[^;]{0,200}?\b(?:>=\s*[5-9]\d|>\s*50|majority|most|bulk|large)\b[^;]{0,200}?\b(?:%|percent|supply|portion)\b/i.test(c),
    reasons: ['Owner holds majority supply — price manipulation on any sell'] },

  // ── Honeypot ──
  { id: 'DD09', name: 'HONEYPOT_SELL_BLOCK',          sev: 'critical', score: 98,
    test: c => /\b(?:sell|_sell|_transfer|transferFrom)\b[^;]{0,500}?\b(?:revert|require\s*\(false|throw|return\s+false)\b[^;]{0,200}?\b(?:sender|from|caller|user|holder)\b[^;]{0,200}?\b(?:!=\s*owner|!==\s*owner|except|unless)\b(?!.*\b(?:buy|swap|purchase|mint)\b)/i.test(c) ||
               /\b(?:from|sender|caller)\b[^;]{0,200}?(?:!=\s*owner|!==\s*owner)\b[^;]{0,200}?\b(?:revert|require|sell|transfer)\b/i.test(c),
    reasons: ['Sell blocked for non-owners — honeypot: users cannot exit positions'] },
  { id: 'DD10', name: 'HONEYPOT_MAX_SELL',             sev: 'high', score: 86,
    test: c => /\b(?:max_sell|maxTransactionAmount|maxTransfer)\b[^;]{0,200}?\b(?:<\s*[1-9]|0\.[0-9]{2}|very\s+small|tiny)\b/i.test(c),
    reasons: ['Maximum sell amount extremely small — honeypot: users cannot exit'] },
  { id: 'DD11', name: 'SELL_TAX_HIGH',                sev: 'high', score: 85,
    test: c => /\b(?:sell|sellFee|sell_fee|sellTax|tax_on_sell)\b[^;]{0,200}?\b(?:>\s*buy|>\s*\d{2}|[5-9]\d|high|excessive)\b[^;]{0,200}?\b(?:%|percent|fee|tax)/i.test(c),
    reasons: ['Sell tax significantly higher than buy tax — honeypot pattern'] },

  // ── Team & Transparency ──
  { id: 'DD12', name: 'NO_KYC_TEAM',                  sev: 'high', score: 85,
    test: c => /\b(?:kyc|dox|identity|verification)\b[^;]{0,200}?\b(?:not|no|none|missing|absent|without)\b[^;]{0,200}?\b(?:team|dev|founder|creator)\b/i.test(c) ||
               /\b(?:no|not|none|missing|absent)\b[^;]{0,200}?\b(?:kyc|dox|identity|verification)\b[^;]{0,200}?\b(?:team|dev|founder|creator)\b/i.test(c),
    reasons: ['No KYC-verified team — no legal accountability'] },
  { id: 'DD13', name: 'NO_AUDIT',                      sev: 'high', score: 85,
    test: c => /\b(?:audit|security\s+review|code\s+review)\b[^;]{0,200}?\b(?:not|no|none|missing|absent|without)\b/i.test(c) ||
               /\b(?:no|not|none|missing|absent)\b[^;]{0,200}?\b(?:audit|security\s+review)\b/i.test(c),
    reasons: ['No security audit — undiscovered vulnerabilities likely'] },
  { id: 'DD14', name: 'AUDIT_FABRICATED',             sev: 'critical', score: 93,
    test: c => /\b(?:audit)\b[^;]{0,200}?\b(?:fake|fabricated|forged|custom|template|generic)\b[^;]{0,200}?\b(?:report|certificate|badge)\b/i.test(c) ||
               /\b(?:fake|fabricated|forged|custom)\b[^;]{0,200}?\baudit\b[^;]{0,200}?\b(?:report|certificate|badge)\b/i.test(c),
    reasons: ['Fabricated audit report — false security assurance'] },

  // ── Tokenomics ──
  { id: 'DD15', name: 'UNFAIR_ALLOCATION',            sev: 'high', score: 85,
    test: c => /\b(?:allocation|distribution)\b[^;]{0,200}?\b(?:team|dev|founder|insider|private)\b[^;]{0,200}?\b(?:>\s*[3-9]\d|>\s*30|large|majority|bulk)\b[^;]{0,200}?\b(?:%|percent)\b/i.test(c) ||
               /\b(?:team|dev|founder|insider)\b[^;]{0,200}?\b(?:allocation|distribution)\b[^;]{0,200}?(?:[4-9]\d|\d{3,}|large|majority|bulk)\s*%/i.test(c),
    reasons: ['Unfair allocation — team/insiders hold excessive supply'] },
  { id: 'DD16', name: 'NO_VESTING_TEAM',              sev: 'high', score: 85,
    test: c => /\b(?:team|dev|founder|advisor|partner)\b[^;]{0,200}?\b(?:allocation|token|share|allowance)\b[^;]{0,200}?\b(?:without|no)\s+(?:vesting|lock|cliff|schedule)\b/i.test(c),
    reasons: ['Team tokens without vesting — immediate dump possible on TGE'] },
  { id: 'DD17', name: 'SHORT_VESTING',                sev: 'medium', score: 72,
    test: c => /\b(?:vesting|lockup|cliff)\b[^;]{0,200}?\b(?:<\s*[3-9]\s*month|<\s*1\s*year|short|immediate)\b/i.test(c),
    reasons: ['Short vesting period — team can dump quickly after TGE'] },

  // ── Trading Controls ──
  { id: 'DD18', name: 'TRADING_PAUSE_UNRESTRICTED',   sev: 'high', score: 87,
    test: c => /\b(?:pause|stop|halt)\b[^;]{0,200}?\b(?:trading|trade|swap|market)\b[^;]{0,200}?\b(?:anyone|any|anyone|arbitrary)\b[^;]{0,200}?\b(?:without|no)\s+(?:auth|check|vote)\b/i.test(c),
    reasons: ['Trading can be paused by anyone — market manipulation risk'] },
  { id: 'DD19', name: 'BLACKLIST_ALL',                sev: 'critical', score: 92,
    test: c => /\b(?:blacklist|block|freeze)\b[^;]{0,200}?\b(?:all|every|any)\b[^;]{0,200}?\b(?:holder|user|address|wallet)\b[^;]{0,200}?\b(?:without|no)\s+(?:reason|cause|vote|governance)\b/i.test(c) ||
               /\bfreeze\w*[Aa]ll\w*[Hh]olders?\b/i.test(c),
    reasons: ['Mass blacklist capability — all holders can be frozen instantly'] },
  { id: 'DD20', name: 'MAX_WALLET',                   sev: 'medium', score: 70,
    test: c => /\b(?:maxWallet|max_wallet|max_holding)\b[^;]{0,200}?\b(?:<\s*[1-9]|0\.[0-9]{2}|tiny|very\s+small)\b[^;]{0,200}?\b(?:%|percent|supply)\b/i.test(c),
    reasons: ['Maximum wallet limit extremely low — restricts normal trading'] },

  // ── Social / Reputation ──
  { id: 'DD21', name: 'LOW_SOCIAL_ENGAGEMENT',        sev: 'medium', score: 64,
    test: c => /\b(?:twitter|telegram|discord|social)\b[^;]{0,200}?\b(?:few|low|small|<100|<1000|inactive|empty|no)\s*(?:followers|members|engagement)\b/i.test(c),
    reasons: ['Low social engagement — potential lack of community support'] },
  { id: 'DD22', name: 'NO_WHITEPAPER',                sev: 'medium', score: 66,
    test: c => /\b(?:whitepaper|whitepage|litepaper|documentation)\b[^;]{0,200}?\b(?:no|none|missing|absent|without)\b/i.test(c),
    reasons: ['No whitepaper or documentation — lack of project substance'] },
  { id: 'DD23', name: 'PAST_RUG_CHECK',               sev: 'high', score: 89,
    test: c => /\b(?:rug|rug_pull|scam|fraud|hack|exploit|drain|exit_scam)\b[^;]{0,200}?\b(?:previous|past|before|former|history|associated)\b/i.test(c) ||
               /\b(?:previous|past|before|former|history|associated)\b[^;]{0,200}?\b(?:rug|rug_pull|scam|fraud|hack|exploit|drain|exit_scam)\b/i.test(c),
    reasons: ['Team associated with past rug pull or scam project'] },
  { id: 'DD24', name: 'CLONED_PROJECT',               sev: 'high', score: 87,
    test: c => /\b(?:fork|clone|copy|copycat)\b[^;]{0,200}?\b(?:of|from)\b[^;]{0,200}?\b(?:another|other|different|unknown)\b[^;]{0,200}?\b(?:project|token|protocol|dapp)\b[^;]{0,200}?\b(?:without|no)\s+(?:improvement|change|modification|audit)\b/i.test(c),
    reasons: ['Cloned/forked project without meaningful changes — copycat risk'] },
  { id: 'DD25', name: 'IMPERSONATION',                sev: 'critical', score: 96,
    test: c => /\b(?:impersonat|pretend|fake|fake_{1}brand|false_{1}rep|lookalike|squat)\b[^;]{0,200}?\b(?:project|token|team|brand|name|project)\b/i.test(c),
    reasons: ['Impersonation of known project or brand — likely scam'] },
];

const { extractMatch, toRecommendation } = require('./finding-utils');

function runDueDiligenceEngine(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return { verdict: 'ERROR', score: 0, rule: 'DD00.ERROR', reasons: ['No input provided'], findings: [] };
  }

  const triggered = [];
  let maxScore = 0;
  let topRule = null;

  for (const rule of DUE_DILIGENCE_RULES) {
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
      verdict: 'ALLOW', score: 0, rule: 'DD00.CLEAN',
      reasons: ['Token/Project passes due diligence checks'],
      findings, timestamp: new Date().toISOString(),
      engine: 'due-diligence', totalRules: DUE_DILIGENCE_RULES.length,
    };
  }

  const verdict = maxScore >= 85 ? 'BLOCK' : maxScore >= 60 ? 'WARN' : 'REVIEW';
  return {
    verdict, score: maxScore, rule: `${topRule.id}.${topRule.name}`,
    ruleId: topRule.id, severity: topRule.sev,
    reasons: topRule.reasons,
    findings, timestamp: new Date().toISOString(),
    engine: 'due-diligence', totalRules: DUE_DILIGENCE_RULES.length,
  };
}

module.exports = { runDueDiligenceEngine, DUE_DILIGENCE_RULES };
