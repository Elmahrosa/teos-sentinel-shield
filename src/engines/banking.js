const BANKING_RULES = [
  // ── Ledger & Reserve Integrity ──
  { id: 'B01', name: 'LEDGER_DIRECT_MUTATION',       sev: 'critical', score: 98,
    test: c => /\b(?:update|modify|set|upsert)\s+(?:balance|ledger|account_balance|credit_pool|reserve|general_ledger|gl_)\b[^;]{0,200}?\b(?:where|set)\b[^;]{0,200}?\bwithout\s+transaction\b/i.test(c) ||
               /\bdb\.\s*(?:balance|ledger|account)\.\s*(?:updateOne|updateMany|findOneAndUpdate|bulkWrite)\b[^;]{0,300}?\b(?:bypass|skip|override)(?:Hooks|Validation|Transaction)\b/i.test(c),
    reasons: ['Direct ledger mutation bypasses atomic transaction hooks', 'Double-entry bookkeeping violation — audit trail broken'] },
  { id: 'B02', name: 'RESERVE_BYPASS',               sev: 'critical', score: 97,
    test: c => /\b(?:reserve|reserve_ratio|reserve_token|reserve_pool)\b[^;]{0,200}?\b(?:bypass|override|skip|disable|ignore)\b/i.test(c) ||
               /\b(?:set_reserve|update_reserve|adjust_reserve)\b[^;]{0,200}?\b(?:below|under|less\s+than)\s+(?:minimum|min_required|regulatory|statutory)\b/i.test(c) ||
               /\breserve_bypass|bypass_regulatory\b/i.test(c),
    reasons: ['Reserve requirement bypass attempt — systemic risk', 'Regulatory reserve ratio violation detected'] },
  { id: 'B03', name: 'DOUBLE_SPEND_LOGIC',           sev: 'critical', score: 99,
    test: c => /\b(?:double_spend|double_spending|double_spend_protection)\b[^;]{0,200}?\b(?:disabled|false|bypass|skip|off)\b/i.test(c) ||
               /\bnonce\b[^;]{0,100}?\b(?:skip|missing|absent|reuse|duplicate)\b/i.test(c) ||
               /\b(?:balance\s*>=\s*0|balance\s*>=\s*amount)\b[^;]{0,100}?\b(?:lock|atomic|transaction|mutex)\b(?!.*\b(?:lock|atomic|transaction|mutex)\b)/i.test(c),
    reasons: ['Double-spend protection disabled — funds can be spent twice', 'Nonce reuse or absence enables replay attacks'] },
  { id: 'B04', name: 'SETTLEMENT_MANIPULATION',      sev: 'critical', score: 95,
    test: c => /\b(?:settlement|netting|clearing|reconciliation)\b[^;]{0,200}?\b(?:manual|override|bypass|skip|disable)\b/i.test(c) ||
               /\b(?:settle_|clear_|net_)\w+\b[^;]{0,200}?\brounding|truncate|floor|ceil|arbitrary\b/i.test(c),
    reasons: ['Settlement manipulation — rounding/truncation can create or destroy value', 'Manual override of settlement process detected'] },

  // ── SWIFT / ISO 20022 ──
  { id: 'B05', name: 'SWIFT_UNENCRYPTED',            sev: 'critical', score: 96,
    test: c => /(?:ISO20022|SWIFT_MT|SWIFT_MX|payment_msg|swift_message)\b[^;]{0,200}?\b(?:http:\/\/|ws:\/\/|ftp:\/\/|tcp:\/\/|plain_text|cleartext)\b/i.test(c) ||
               /(?:http:\/\/|ws:\/\/|ftp:\/\/|tcp:\/\/)[^;]{0,200}?(?:ISO20022|SWIFT_MT|SWIFT_MX|payment_msg|swift_message)\b/i.test(c) ||
               /\bswift\s*=\s*["'`][^"'`]{0,100}?\bhttp:\/\//i.test(c) ||
               /SWIFTMessage.*ws:\/\//i.test(c) ||
               /SWIFTMessage.*transport.*ws:\/\//i.test(c),
    reasons: ['SWIFT/ISO 20022 message over unencrypted transport — PCI DSS violation', 'Financial message integrity compromised by cleartext transmission'] },
  { id: 'B06', name: 'SWIFT_AUTH_BYPASS',            sev: 'critical', score: 97,
    test: c => /\b(?:swift_auth|swift_authenticate|mt_auth|fin_auth)\b[^;]{0,200}?\b(?:skip|bypass|disable|mock|test_only|debug)\b/i.test(c) ||
               /\b(?:mt[0-9]{3}|swift_msg)\b[^;]{0,200}?\b(?:no_auth|unsigned|unauthenticated|without_auth)\b/i.test(c),
    reasons: ['SWIFT authentication bypassed — unauthorized payment messages possible', 'SWIFT FIN message without cryptographic authentication'] },
  { id: 'B07', name: 'SWIFT_SIGNATURE_WEAK',         sev: 'high', score: 85,
    test: c => /\bswift_sign\w*\b[^;]{0,200}?\b(?:md5|sha1|rc4|des|3des)\b/i.test(c) ||
               /\b(?:mt[0-9]{3}|swift_msg)\b[^;]{0,200}?\b(?:sign\w*\s*:\s*["'`][^"'`]{0,100}md5|sign\w*\s*:\s*["'`][^"'`]{0,100}sha1)\b/i.test(c),
    reasons: ['Weak cryptographic algorithm for SWIFT message signing — downgrade attack risk'] },

  // ── FIX Protocol ──
  { id: 'B08', name: 'FIX_CLEARTEXT_LOGIN',          sev: 'critical', score: 96,
    test: c => /BeginString\s*=\s*FIX[^;]{0,500}?35\s*=\s*A[^;]{0,500}?(?:Password|RawData|EncryptMethod\s*=\s*0)\s*=/i.test(c) ||
               /(?:fix|quickfix)\.[\w.]*\([^)]{0,500}?password[^)]{0,500}?\,\s*["'`][^"'`]{1,100}["'`]/i.test(c),
    reasons: ['FIX protocol login with cleartext credentials — account takeover risk', 'FIX session credentials transmitted without encryption'] },
  { id: 'B09', name: 'FIX_SEQUENCE_RESET',           sev: 'high', score: 82,
    test: c => /35\s*=\s*4\b[^;]{0,500}?43\s*=\s*Y/i.test(c) ||
               /(?:MsgType\s*=\s*4|GapFillFlag\s*=\s*Y|NewSeqNo\s*=\s*\d{4,})/i.test(c),
    reasons: ['FIX sequence number reset — possible message replay or insertion attack'] },
  { id: 'B10', name: 'FIX_DROP_COPY',                sev: 'medium', score: 65,
    test: c => /35\s*=\s*(?:W|X)[^;]{0,500}?DropCopy|ExecType\s*=\s*(?:F|C|D)/i.test(c),
    reasons: ['FIX Drop Copy session — no execution — informational only'] },

  // ── AML / KYC / Sanctions ──
  { id: 'B11', name: 'AML_SCREENING_BYPASS',         sev: 'critical', score: 97,
    test: c => /\b(?:aml_check|aml_screen|sanctions_check|ofac_check|kyc_verify)\b[^;]{0,200}?\b(?:skip|bypass|disable|mock|test|debug|false)\b/i.test(c) ||
               /\b(?:transfer|payment|send|wire)\b[^;]{0,100}?\b(?:amount|value)\b[^;]{0,100}?\b(?:without|no)\s+(?:aml|sanctions|kyc|compliance)\b/i.test(c) ||
               /\b(?:AML|aml)\s+(?:bypass|skip|disable|circumvent)\b/i.test(c),
    reasons: ['AML/sanctions screening bypassed — regulatory violation', 'Funds transfer executed without mandatory compliance checks'] },
  { id: 'B12', name: 'KYC_DOCUMENT_FORGERY',          sev: 'critical', score: 94,
    test: c => /\b(?:kyc_doc|kyc_upload|identity_doc|id_verify)\b[^;]{0,200}?\b(?:accept_all|auto_approve|skip_verify|mock|stub)\b/i.test(c) ||
               /\b(?:document|doc)_?\s*(?:verify|check|validate)\b[^;]{0,200}?\b(?:disabled|bypass|fake|bypass_security)\b/i.test(c),
    reasons: ['KYC document verification bypassed — identity fraud enabled'] },
  { id: 'B13', name: 'PEP_SCREENING_BYPASS',         sev: 'high', score: 88,
    test: c => /\b(?:pep_check|pep_screen|politically_exposed)\b[^;]{0,200}?\b(?:skip|bypass|disable|mock)\b/i.test(c),
    reasons: ['PEP (Politically Exposed Person) screening bypassed'] },
  { id: 'B14', name: 'SANCTIONS_LIST_MANIPULATION',  sev: 'critical', score: 96,
    test: c => /\b(?:sanctions_list|ofac_list|sdn_list|embargo_list)\b[^;]{0,200}?\b(?:modify|delete|drop|truncate|update|alter)\b/i.test(c) ||
               /\b(?:import|load)\s+(?:sanctions|ofac|sdn|embargo)\s+list\b[^;]{0,200}?\b(?:without|invalid|cached|stale|old)\b/i.test(c) ||
               /\b(?:delete|drop|truncate)\s+(?:from\s+)?(?:sanctions|ofac|sdn|embargo)_list\b/i.test(c),
    reasons: ['Sanctions list manipulation — screening integrity compromised'] },

  // ── PCI DSS ──
  { id: 'B15', name: 'PCI_CARD_DATA_STORAGE',        sev: 'critical', score: 98,
    test: c => /\b(?:credit_card|cc_number|card_number|pan|card_pan|cardno)\b[^;]{0,200}?\b(?:store|save|persist|log|write|insert|save|raw)\b/i.test(c) ||
               /\b(?:cvv|cvc|cvv2|cid|card_code)\b[^;]{0,200}?\b(?:store|save|persist|log|write)\b/i.test(c) ||
               /\b(?:pan|card_number)\s*(?:=|:)\s*["'`]\d{13,19}["'`]/i.test(c) ||
               /store_credit_card/i.test(c),
    reasons: ['PCI DSS violation: storing full PAN/CVV — prohibited', 'Card data storage without tokenization — regulatory liability'] },
  { id: 'B16', name: 'PCI_TRACK_DATA',               sev: 'critical', score: 99,
    test: c => /\b(?:track1|track2|track_data|magstripe|chip_data)\b[^;]{0,200}?\b(?:store|save|persist|log|write|insert)\b/i.test(c) ||
               /\b(?:%B|;\d{16}=)\b[^;]{0,200}?\b(?:db\.|insert|save|persist|log)\b/i.test(c) ||
               /track1.*VALUES/i.test(c) ||
               /track2.*VALUES/i.test(c),
    reasons: ['PCI DSS prohibited: magnetic stripe track data storage'] },
  { id: 'B17', name: 'PCI_UNENCRYPTED_TRANSMISSION', sev: 'critical', score: 97,
    test: c => /\b(?:pan|card_number|card_data|payment_info)\b[^;]{0,200}?\b(?:http:\/\/|ws:\/\/|plain|cleartext|unencrypted)\b/i.test(c) ||
               /\b(?:charge|payment|auth|sale)\b[^;]{0,100}?\b(?:api|endpoint|url)\b[^;]{0,100}?\bhttp:\/\//i.test(c),
    reasons: ['PCI DSS: cardholder data transmitted unencrypted over cleartext transport'] },

  // ── Payment Fraud ──
  { id: 'B18', name: 'ROUNDING_ATTACK',              sev: 'high', score: 85,
    test: c => /\b(?:round|floor|truncate|ceiling)\s*\(\s*(?:amount|value|total|fee|interest|tax|commission)\b[^;]{0,200}?\b(?:accumulate|collect|pool|keep|transfer|send)\b/i.test(c) ||
               /round\(amount.*accumulated/i.test(c),
    reasons: ['Currency rounding logic — systematic rounding attack where fractions accumulate', 'Salami slicing pattern — small amounts diverted from many transactions'] },
  { id: 'B19', name: 'FEE_MANIPULATION',             sev: 'high', score: 86,
    test: c => /\b(?:fee|commission|charge|surcharge|spread)\b[^;]{0,200}?\b(?:arbitrary|dynamic|override|multiply\s*by|inflate|increase|hidden)\b/i.test(c) ||
               /\bfee\b[^;]{0,100}?\b(?:calc|calculate|compute)\b[^;]{0,200}?\b(?:round|floor|ceil)\b[^;]{0,200}?\b(?:keep|collect|pool)\b/i.test(c) ||
               /\bfee\s*=\s*\w+\s*\*[\s\S]{0,200}?\bround\b[\s\S]{0,200}?pool/i.test(c),
    reasons: ['Fee manipulation pattern — hidden fee inflation or arbitrary surcharge'] },
  { id: 'B20', name: 'RECURRING_PAYMENT_FRAUD',      sev: 'high', score: 86,
    test: c => /\b(?:recurring|subscription|installment|autopay)\b[^;]{0,200}?\b(?:without|cancel|fail|skip)\s+(?:notification|consent|approval|auth)\b/i.test(c) ||
               /\b(?:charge|bill|debit)\b[^;]{0,100}?\b(?:without|no)\s+(?:auth|consent|approval|agreement)\b/i.test(c) ||
               /\b(?:charge|recurring|subscription|autopay)_without_/i.test(c),
    reasons: ['Recurring payment without explicit consent — unauthorized billing pattern'] },
  { id: 'B21', name: 'CHARGEBACK_AVOIDANCE',         sev: 'high', score: 83,
    test: c => /\b(?:chargeback|dispute|reversal|refund)\b[^;]{0,200}?\b(?:avoid|bypass|prevent|block|disable|suppress)\b/i.test(c) ||
               /\b(?:auto_chargeback|chargeback_avoid|dispute_suppress)\b/i.test(c) ||
               /charge_without_consent/i.test(c),
    reasons: ['Chargeback avoidance logic — preventing legitimate customer disputes'] },

  // ── Internal Controls ──
  { id: 'B22', name: 'SEGREGATION_OF_DUTIES',        sev: 'critical', score: 93,
    test: c => /\b(?:create|approve|settle|reconcile)\b[^;]{0,100}?\b(?:and|&&)\b[^;]{0,100}?\b(?:create|approve|settle|reconcile)\b[^;]{0,200}?\b(?:same|single|one)\s+(?:user|person|function|role|thread)\b/i.test(c) ||
               /\b(?:sudo|runas|impersonate)\b[^;]{0,100}?\b(?:create|approve|settle|pay|transfer)\b[^;]{0,100}?\b(?:as|by)\s+(?:same|single)\s+(?:user|role)\b/i.test(c) ||
               /create_and_approve_payment/i.test(c) ||
               /same_user.*create_and_approve/i.test(c),
    reasons: ['Segregation of duties violation — same actor creates and approves payment'] },
  { id: 'B23', name: 'AUDIT_LOG_TAMPERING',          sev: 'critical', score: 95,
    test: c => /\b(?:audit_log|audit_trail|audit_record|audit_entry)\b[^;]{0,200}?\b(?:delete|truncate|drop|modify|update|alter|clear|purge)\b/i.test(c) ||
               /\b(?:truncate|drop|delete)\s+(?:from\s+)?(?:audit_log|audit_trail|audit_)\b/i.test(c) ||
               /audit_log\s*=\s*false\b/i.test(c),
    reasons: ['Audit log tampering — destroying evidence of financial transactions'] },
  { id: 'B24', name: 'LEDGER_FABRICATION',           sev: 'critical', score: 99,
    test: c => /\b(?:entry|transaction|ledger_entry|journal)\b[^;]{0,100}?\b(?:backdate|postdate|back_date|future_date|antidate)\b/i.test(c) ||
               /\b(?:timestamp|created_at|date)\b[^;]{0,100}?\b(?:override|set|modify)\b[^;]{0,100}?\b(?:entry|transaction|record)\b[^;]{0,100}?\b(?:back|future|past)\b/i.test(c) ||
               /backdate_transaction/i.test(c),
    reasons: ['Ledger fabrication — backdating or future-dating transaction entries'] },

  // ── Identity / Sovereignty ──
  { id: 'B25', name: 'PII_CROSS_BOUNDARY',           sev: 'critical', score: 93,
    test: c => /\b(?:transfer|sync|export|send|copy)\s+(?:pii|customer_data|personally|personal_data)\b[^;]{0,100}?\b(?:cross|cross_|trans|inter)\s*(?:border|boundary|regulator|jurisdiction)\b/i.test(c) ||
               /\b(?:pii_cross|cross_border|trans_border)\s*(?:transfer|sync|export)\b/i.test(c) ||
               /sync_pii_cbe_to_fra/i.test(c) ||
               /pii_cross_boundary/i.test(c),
    reasons: ['Cross-border PII transfer without anonymization — sovereignty violation'] },
  { id: 'B26', name: 'FEDERATED_HSM_BYPASS',         sev: 'critical', score: 96,
    test: c => /\b(?:verify_card|process_card|card_access|card_authority)\b[^;]{0,200}?\b(?:bypass|skip|disable|override|mock)\b[^;]{0,200}?\b(?:ticket|hsm|signature|authority)\b/i.test(c) ||
               /\b(?:federated_hsm|bank_ticket|custodian_sign)\b[^;]{0,200}?\b(?:skip|missing|absent)\b/i.test(c),
    reasons: ['Federated HSM ticket verification bypassed — unauthorized card access'] },
  { id: 'B27', name: 'BIC_SWIFT_CODE_MANIPULATION',  sev: 'high', score: 87,
    test: c => /\b(?:bic|swift_code|swift_bic|bank_id)\b[^;]{0,200}?\b(?:modify|override|replace|spoof|fake)\b/i.test(c) ||
               /override_bic/i.test(c),
    reasons: ['BIC/SWIFT code manipulation — payment routing to wrong institution'] },
  { id: 'B28', name: 'IBAN_VALIDATION_BYPASS',       sev: 'high', score: 85,
    test: c => /\b(?:iban|account_number|account_id)\b[^;]{0,200}?\b(?:validate|check|verify)\b[^;]{0,200}?\b(?:skip|bypass|disable|false|no)\b/i.test(c) ||
               /iban_validation.*skip/i.test(c),
    reasons: ['IBAN validation bypass — allows invalid account routing'] },

  // ── Compliance Reporting ──
  { id: 'B29', name: 'SAR_FILING_BYPASS',            sev: 'critical', score: 94,
    test: c => /\b(?:sar|suspicious_activity|suspicious_transaction|mule_detect)\b[^;]{0,200}?\b(?:skip|bypass|disable|suppress|dont_file)\b/i.test(c) ||
               /dont_file_sar/i.test(c),
    reasons: ['Suspicious Activity Report (SAR) filing bypassed — FinCEN violation'] },
  { id: 'B30', name: 'REGULATORY_REPORT_MANIPULATION', sev: 'critical', score: 92,
    test: c => /\b(?:reg_report|regulatory_report|central_bank_report|cb_report)\b[^;]{0,200}?\b(?:modify|falsify|manipulate|adjust|omit|hide)\b/i.test(c) ||
               /reg_report\.modify/i.test(c) ||
               /hide_deficit/i.test(c),
    reasons: ['Regulatory report manipulation — false reporting to central bank'] },
  { id: 'B31', name: 'CAPITAL_RESERVE_CALCULATION',  sev: 'high', score: 88,
    test: c => /\b(?:capital_reserve|capital_requirement|capital_adequacy|basel)\b[^;]{0,200}?\b(?:bypass|skip|disable|underreport|wrong)\b/i.test(c) ||
               /\b(?:reserve_ratio|reserve_rate)\b[^;]{0,200}?\b(?:override|force|set)\b[^;]{0,200}?\b(?:below|under|less)\b/i.test(c),
    reasons: ['Capital reserve requirement calculation manipulation'] },
  { id: 'B32', name: 'INTEREST_CALCULATION_FRAUD',   sev: 'high', score: 86,
    test: c => /\b(?:interest|profit_rate|riba|margin)\b[^;]{0,200}?\b(?:calc|calculate|compute)\b[^;]{0,200}?\b(?:wrong|incorrect|override|force|arbitrary)\b/i.test(c) ||
               /\b(?:interest|profit)_?\s*(?:rate|ratio)\s*(?:=|:)\s*(?:[0-9]{2,3}\s*%?\s*\.?\s*[0-9]?)/i.test(c),
    reasons: ['Interest/profit rate calculation manipulation — value extraction fraud'] },
];

const { extractMatch, toRecommendation } = require('./finding-utils');
const { isBudgetExceeded, safeRuleInput } = require('../../lib/regex-guard');

function runBankingEngine(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return { verdict: 'ERROR', score: 0, rule: 'B00.ERROR', reasons: ['No input provided'], findings: [] };
  }

  const ruleInput = safeRuleInput(input);
  const startMs = Date.now();
  const triggered = [];
  let maxScore = 0;
  let topRule = null;

  for (let i = 0; i < BANKING_RULES.length; i++) {
    const rule = BANKING_RULES[i];
    if (isBudgetExceeded(startMs)) break;
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
      verdict: 'ALLOW', score: 0, rule: 'B00.CLEAN',
      reasons: ['No banking compliance violations detected'],
      findings, timestamp: new Date().toISOString(),
      engine: 'banking', totalRules: BANKING_RULES.length,
    };
  }

  const verdict = maxScore >= 85 ? 'BLOCK' : maxScore >= 60 ? 'WARN' : 'REVIEW';
  return {
    verdict, score: maxScore, rule: `${topRule.id}.${topRule.name}`,
    ruleId: topRule.id, severity: topRule.sev,
    reasons: topRule.reasons,
    findings, timestamp: new Date().toISOString(),
    engine: 'banking', totalRules: BANKING_RULES.length,
  };
}

module.exports = { runBankingEngine, BANKING_RULES };
