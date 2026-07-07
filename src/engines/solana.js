const SOLANA_RULES = [
  // ── Anchor Framework ──
  { id: 'S01', name: 'ANCHOR_UNCHECKED_ACCOUNT',    sev: 'critical', score: 95,
    test: c => /\bUncheckedAccount\b/i.test(c) ||
               /\bAccountInfo\b[^;]{0,200}?\b(?:new\s+AccountInfo\b|deserialize\s*\([^)]*\s*\))/i.test(c) ||
               /AccountInfo::new/i.test(c),
    reasons: ['Unchecked account — attacker can pass arbitrary account data', 'Use #[account(..)] constraint instead of UncheckedAccount'] },
  { id: 'S02', name: 'ANCHOR_SIGNER_SAFETY',        sev: 'critical', score: 92,
    test: c => /\bSigner\b[^;]{0,200}?\b(?:not\s+checked|without|no)\s+(?:signer|authority|validation)\b/i.test(c) ||
               /\bsigner\b[^;]{0,200}?\b(?:key\s*=\s*[a-z_]+\.key|pubkey\s*=\s*[a-z_]+\.key)\b[^;]{0,200}?\b(?:owner|authority)\b/i.test(c),
    reasons: ['Signer not properly validated — unauthorized state modification possible'] },
  { id: 'S03', name: 'ANCHOR_SEED_CONSTRAINT',      sev: 'high', score: 88,
    test: c => /\b#[^;]{0,200}?account\s*\([^)]*seeds\s*=([^)]*?(?:bump|bump_seed)[^)]*)?\)/i.test(c) &&
               !/seeds\s*=\s*\[[^\]]*bump[^\]]*\]/i.test(c),
    reasons: ['PDA seed constraint without bump seed — deterministic PDA derivation missing'] },

  // ── CPI / Cross-Program Invocation ──
  { id: 'S04', name: 'CPI_UNCHECKED',               sev: 'critical', score: 94,
    test: c => /\binvoke\s*\([^)]*account_infos\b/i.test(c) &&
               !/\binvoke_signed\b/i.test(c) ||
               /\b(?:cpi_|invoke)\w*\s*\([^)]*\b(?:seed|signer)[^)]*\bwithout\b/i.test(c),
    reasons: ['CPI without checking returned program ID — arbitrary program invocation risk'] },
  { id: 'S05', name: 'CPI_SIGNER_SEED_EXPOSURE',    sev: 'high', score: 87,
    test: c => /\binvoke_signed\b[^;]{0,300}?\b(?:seed|seeds)\b[^;]{0,300}?\b(?:log|print|emit|debug|console|msg!)\b/i.test(c),
    reasons: ['CPI signer seeds leaked via logging — privilege escalation risk'] },
  { id: 'S06', name: 'CPI_PRIVILEGE_ESCALATION',    sev: 'critical', score: 96,
    test: c => /\binvoke\s*\([^)]*\b(?:system_program|token_program|associated_token|spl_)\b[^)]*\b(?:close|transfer|withdraw|drain)\b/i.test(c) &&
               !/\binvoke_signed\b/i.test(c),
    reasons: ['Privilege escalation via CPI — missing PDA signer seeds for authority'] },

  // ── PDA / Seeds ──
  { id: 'S07', name: 'PDA_FRONT_RUNNING',           sev: 'high', score: 82,
    test: c => /\b(?:find_program_address|find_pda|pda)\b[^;]{0,200}?\b(?:user|buyer|trader)\w*\b[^;]{0,200}?\b(?:seed|seeds)\b[^;]{0,200}?\b(?:amount|price|value)\b/i.test(c),
    reasons: ['PDA derived from user input — front-running attack on address creation'] },
  { id: 'S08', name: 'PDA_OWNERSHIP_CHECK',         sev: 'critical', score: 93,
    test: c => /\b(?:pda|derived|program_address)\b[^;]{0,200}?\b(?:owner|ownership)\b[^;]{0,200}?\b(?:skip|bypass|missing|not\s+checked|assume)\b/i.test(c) ||
               /\b(?:account\.owner|\.owner\s*)\s*!=\s*(?:\w+::id|program_id|id\(\))\b[^;]{0,200}?\b(?:return|throw|err|revert|panic)\b(?!.*\b(?:return|throw|err|revert|panic)\b)/i.test(c) ||
               /pda_.*owner.*skip/i.test(c),
    reasons: ['Missing PDA ownership check — attacker can use arbitrary account'] },

  // ── Authority / Access Control ──
  { id: 'S09', name: 'MISSING_AUTHORITY_CHECK',     sev: 'critical', score: 95,
    test: c => /\b(?:authority|admin|owner|fee_payer)\b[^;]{0,200}?\b(?:=\s*(?!(?:\w+\.key|signer|authority\.key)))[^;]{0,100}?\b(?:signer|cpi_authority)\b(?!.*\b(?:require|if|assert|check|verify)\b)/i.test(c) ||
               /authority = user\.key.*update_state/i.test(c) ||
               /missing.*authority.*check/i.test(c),
    reasons: ['Authority check missing — unauthorized state access possible'] },
  { id: 'S10', name: 'CLOSE_ACCOUNT_SAFETY',        sev: 'high', score: 88,
    test: c => /\bclose\b[^;]{0,200}?\b(?:account|program|state)\b[^;]{0,200}?\b(?:lamports|sol|balance)\b[^;]{0,200}?\b(?:dest\s*=\s*(?!(?:\w+\.key\s*==\s*\w+\.key|signer)))/i.test(c),
    reasons: ['Account closure without verifying destination authority — rent theft risk'] },
  { id: 'S11', name: 'DELEGATE_AUTHORITY_ABUSE',    sev: 'high', score: 86,
    test: c => /\b(?:delegate|authority|approved)\b[^;]{0,200}?\b(?:set|update|change)\b[^;]{0,200}?\b(?:anyone|any|arbitrary|user)\b[^;]{0,200}?\b(?:without|no)\s+(?:check|auth|verify)\b/i.test(c),
    reasons: ['Delegating authority to arbitrary user without verification'] },

  // ── Arithmetic / Overflow ──
  { id: 'S12', name: 'ARITHMETIC_OVERFLOW',         sev: 'high', score: 85,
    test: c => /[a-z_]\s*[\+\-\*]\s*=\s*[a-z_][^;]{0,200}?(?!\b(?:checked|safe|overflow|wrapping)\b)/i.test(c) &&
               !/(?:checked_|safe_|overflow_|wrapping_)/i.test(c) &&
               /\buse\s+(?:\w+\s*::\s*)?(?:anchor_lang|solana_program)\b/i.test(c) &&
               !/\bchecked\b/i.test(c),
    reasons: ['Integer overflow possible — use checked arithmetic or SafeMath'] },
  { id: 'S13', name: 'UNCHECKED_MATH',              sev: 'medium', score: 75,
    test: c => /\b(?:overflow|underflow|wrapping|saturating)\b[^;]{0,200}?\b(?:add|sub|mul|div)\b/i.test(c) &&
               !/\bchecked\b/i.test(c),
    reasons: ['Unchecked math operations — potential overflow/underflow'] },

  // ── Token / SPL ──
  { id: 'S14', name: 'SPL_TOKEN_BURN',              sev: 'high', score: 84,
    test: c => /\b(?:burn|burning)\b[^;]{0,200}?\b(?:token|spl|mint)\b[^;]{0,200}?\b(?:without|no)\s+(?:auth|check|authority|signer)\b/i.test(c),
    reasons: ['Token burn without authority verification — unauthorized supply reduction'] },
  { id: 'S15', name: 'SPL_MINT_AUTHORITY',          sev: 'critical', score: 92,
    test: c => /\b(?:mint_to|mint\s+to|initialize_mint)\b[^;]{0,200}?\b(?:anyone|any|public|arbitrary)\b[^;]{0,200}?\b(?:mint_authority|authority)\b/i.test(c) ||
               /\bmint_authority\b[^;]{0,200}?=\s*(?:null|none|undefined|pubkey::default)\b/i.test(c) ||
               /mint_authority\s*=\s*(?:none|null|undefined|pubkey::default)/i.test(c),
    reasons: ['Mint authority set to arbitrary account — unlimited token minting'] },
  { id: 'S16', name: 'SPL_FREEZE_AUTHORITY',        sev: 'high', score: 85,
    test: c => /\bfreeze_authority\b[^;]{0,200}?\b(?:=\s*(?:null|none|undefined|pubkey::default)\b)/i.test(c) ||
               /freeze_authority\s*=\s*none/i.test(c),
    reasons: ['Freeze authority disabled — cannot freeze malicious token holders'] },

  // ── Account Data ──
  { id: 'S17', name: 'ACCOUNT_DATA_MUTATION',       sev: 'high', score: 86,
    test: c => /\b(?:data|data_mut|account_data)\b[^;]{0,200}?\b(?:borrow_mut|as_mut|set|modify|update)\b[^;]{0,200}?\b(?:without|no)\s+(?:check|validation|verification)\b/i.test(c) ||
               /account\.data\.borrow_mut/i.test(c),
    reasons: ['Account data mutated without validation — data corruption risk'] },
  { id: 'S18', name: 'ACCOUNT_REINIT',              sev: 'critical', score: 93,
    test: c => /\b(?:initialize|init|reinitialize|re_init)\b[^;]{0,200}?\b(?:account|program)\b[^;]{0,200}?\b(?:if|when)\b[^;]{0,200}?\b(?:already|exists|created|initialized)\b[^;]{0,200}?\b(?:close|reset)\b/i.test(c) ||
               /\b(?:close|reset)\b[^;]{0,100}?\b(?:account|state)\b[^;]{0,100}?\b(?:init|initialize|reinit)\b/i.test(c) ||
               /close_account_and_reinitialize/i.test(c) ||
               /close.*account.*reinit/i.test(c),
    reasons: ['Account reinitialization attack — attacker reinitializes existing account'] },

  // ── Solana-Specific ──
  { id: 'S19', name: 'COMPUTE_BUDGET_EXCEED',       sev: 'medium', score: 65,
    test: c => /\bcompute_budget\b[^;]{0,200}?\b(?:max|limit)\b[^;]{0,200}?\b(?:exceed|high|large|200000|[3-9]\d{5,})\b/i.test(c),
    reasons: ['Compute budget exceeded — transaction may fail or be expensive'] },
  { id: 'S20', name: 'INSTRUCTION_ORDERING',         sev: 'medium', score: 70,
    test: c => /\b(?:ix|instruction)\b[^;]{0,200}?\b(?:order|sequence)\b[^;]{0,200}?\b(?:assume|depend|rely)\b[^;]{0,200}?\b(?:order|sequence|before|after)\b/i.test(c) &&
               !/\b(?:check|verify|assert)\b[^;]{0,100}?\b(?:order|sequence|before|after)\b/i.test(c),
    reasons: ['Instruction ordering assumption — transactions may be reordered'] },
  { id: 'S21', name: 'ACCOUNT_DISCRIMINATOR',       sev: 'medium', score: 72,
    test: c => /\b(?:AccountDeserialize|try_deserialize|deserialize)\b[^;]{0,200}?\b(?:without|no)\s+(?:discriminator|magic|prefix)\b/i.test(c),
    reasons: ['Account deserialized without discriminator check — type confusion attack'] },
  { id: 'S22', name: 'PROGRAM_UPGRADE_AUTHORITY',   sev: 'high', score: 88,
    test: c => /\bupgrade_authority\b[^;]{0,200}?\b(?:=\s*(?:null|none|undefined|pubkey::default)\b)/i.test(c) ||
               /\b(?:set|update|change)\s+(?:upgrade|program)_authority\b[^;]{0,200}?\b(?:anyone|any|arbitrary)\b/i.test(c) ||
               /upgrade_authority\s*=\s*null/i.test(c),
    reasons: ['Upgrade authority unset or set to arbitrary account — program can be upgraded by anyone'] },
  { id: 'S23', name: 'CLOCK_DEPENDENCY',            sev: 'high', score: 85,
    test: c => /\b(?:clock|slot|epoch|unix_timestamp)\b[^;]{0,200}?\b(?:for|while|if)\b[^;]{0,200}?\b(?:expir|timelock|deadline|timeout)\b[^;]{0,200}?\b(?:without|no)\s+(?:buffer|tolerance)\b/i.test(c) ||
               /Clock.*unix_timestamp.*deadline/i.test(c) ||
               /timestamp.*deadline.*process/i.test(c),
    reasons: ['Clock/slot dependency without tolerance — validator manipulation risk'] },
  { id: 'S24', name: 'ACCOUNT_LENTH_CHECK',         sev: 'high', score: 85,
    test: c => /\b(?:data_len|account\.data\.len|\.data\(\)\.len)\b[^;]{0,200}?\b(?:<\s*|less|small|short)\b/i.test(c) ||
               /\b(?:deserialize|try_from_slice)\b[^;]{0,100}?\b(?:without|no)\s+(?:len|size|length)\s+(?:check|verify|assert)\b/i.test(c),
    reasons: ['Missing account data length check — deserialization OOB access'] },
  { id: 'S25', name: 'TOKEN_ACCOUNT_MISMATCH',      sev: 'high', score: 86,
    test: c => /\b(?:token_account|token_owner|spl_token)\b[^;]{0,200}?\b(?:mint)\b[^;]{0,200}?\b(?:check|verify|validate)\b(?!.*\b(?:check|verify|validate)\b)/i.test(c),
    reasons: ['Token account/mint/owner mismatch not verified — token confusion attack'] },

  // ── Additional Solana Rules ──
  { id: 'S26', name: 'LAMPORT_MANIPULATION',        sev: 'critical', score: 94,
    test: c => /\b(?:lamports|sol|rent)\b[^;]{0,200}?\b(?:sub|subtract|deduct|debit)\b[^;]{0,200}?\b(?:without|no|skip)\s+(?:check|verify|overflow)\b/i.test(c) ||
               /\b(?:credit|add|increase)_?(?:lamports|sol)\b[^;]{0,200}?\b(?:without|no)\s+(?:auth|authority|signer)\b/i.test(c) ||
               /account\.lamports\.sub/i.test(c) ||
               /lamports\.sub\(/i.test(c),
    reasons: ['Lamport manipulation without proper checks — fund theft risk'] },
  { id: 'S27', name: 'SYSTEM_PROGRAM_ABUSE',        sev: 'critical', score: 95,
    test: c => /\binvoke\s*\([^)]*\bsystem_program\b[^)]*\b(?:create_account|transfer|allocate)\b/i.test(c) &&
               !/\b(?:from|owner)\s*=\s*\w+\.key\b[^;]{0,100}?\b(?:signer|authority)\b/i.test(c),
    reasons: ['System program invocation without signer verification — unauthorized SOL movement'] },
  { id: 'S28', name: 'ACCOUNT_CLOSURE_DRAIN',       sev: 'high', score: 88,
    test: c => /\bclose\s+account\b[^;]{0,300}?\b(?:lamports|sol|balance)\b[^;]{0,300}?\b(?:dest|destination|to)\b[^;]{0,300}?\b(?:user|caller|invoker|signer)\b[^;]{0,300}?\b(?:key|account)\b/i.test(c),
    reasons: ['Account closure sends rent lamports to caller — rent extraction attack'] },
  { id: 'S29', name: 'CROSS_PROGRAM_INVOKE_WRONG',  sev: 'high', score: 87,
    test: c => /\binvoke\s*\([^)]*\b(?:program_id|program)\s*[=:]\s*\w+\b[^)]{0,200}?\b(?:check|verify|assert|require)\b(?!.*\b(?:check|verify|assert|require)\b)/i.test(c),
    reasons: ['Cross-program invocation without verifying program ID — CPI confusion'] },
];

function runSolanaEngine(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return { verdict: 'ERROR', score: 0, rule: 'S00.ERROR', reasons: ['No input provided'] };
  }

  const findings = [];
  let maxScore = 0;
  let topRule = null;

  for (const rule of SOLANA_RULES) {
    try {
      if (rule.test(input)) {
        findings.push({
          ruleId: rule.id, name: rule.name, severity: rule.sev,
          score: rule.score, reasons: rule.reasons,
        });
        if (rule.score > maxScore) {
          maxScore = rule.score;
          topRule = rule;
        }
      }
    } catch (e) { /* skip */ }
  }

  if (!topRule) {
    return {
      verdict: 'ALLOW', score: 0, rule: 'S00.CLEAN',
      reasons: ['No Solana security violations detected'],
      findings, timestamp: new Date().toISOString(),
      engine: 'solana', totalRules: SOLANA_RULES.length,
    };
  }

  const verdict = maxScore >= 85 ? 'BLOCK' : maxScore >= 60 ? 'WARN' : 'REVIEW';
  return {
    verdict, score: maxScore, rule: `${topRule.id}.${topRule.name}`,
    ruleId: topRule.id, severity: topRule.sev,
    reasons: topRule.reasons,
    findings, timestamp: new Date().toISOString(),
    engine: 'solana', totalRules: SOLANA_RULES.length,
  };
}

module.exports = { runSolanaEngine, SOLANA_RULES };
