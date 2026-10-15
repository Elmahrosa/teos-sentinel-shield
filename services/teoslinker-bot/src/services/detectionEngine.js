const logger = require('../../logger.cjs').logger;

const GITHUB_REGEX = /https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)(?:\/.*)?/i;

const SOLANA_ADDRESS_REGEX = /^[A-HJ-NP-Za-km-z1-9]{32,44}$/;

const SOLANA_PROGRAM_KEYWORDS = /\b(?:use\s+anchor_lang|solana_program|entrypoint!|process_instruction|Account\s*<(?:.*,)?\s*(?:Signer|AccountInfo|ProgramAccount|CpiAccount)>|declare_id!\s*\(|#[derive\(Accounts\)])\s*/s;

const SOLIDITY_REGEX = /\b(?:pragma\s+solidity|contract\s+\w+|interface\s+\w+|library\s+\w+|function\s+\w+\s*(?:public|private|internal|external|pure|view|payable)|mapping\s*\(|struct\s+\w+|modifier\s+\w+|event\s+\w+|require\s*\(|revert\s*\(|emit\s+\w+)\b/i;

const DANGEROUS_COMMANDS_PATTERNS = [
  /\brm\s+-rf\s+(?:\/\s*|~\/?\s|\.\/?\s|['\"]?\/|['\"]?~\/)/i,
  /\b(?:curl|wget)\s+(?:-\w+\s+)?https?:\/\/[^\s]+\s*\|\s*(?:bash|sh|zsh)\b/i,
  /\bchmod\s+(?:777|a\+x|a=wrx|o\+w)\s/i,
  /\bsudo\s+(?:rm|chmod|chown|mkfs|dd|shutdown|reboot|init)\b/i,
  /\beval\s*\(\s*['\"].*['\"]\s*\)/i,
  /\bexec\s*\(\s*['\"].*['\"]\s*\)/i,
  /\bsystem\s*\(\s*['\"].*['\"]\s*\)/i,
  /\bpassthru\s*\(/i,
  /\bshell_exec\s*\(/i,
  /\b(?:dd\s+if=|:\(\)\s*\{|:\(\)\s*\{|fork\s+bomb|\b>?\s*\/dev\/sda)/i,
  /\bmv\s+\/[^\s]+\s+\/[^\s]+/i,
  /\bwget\s+--post-file\s+/i,
  /\bcurl\s+(?:-F|--form|-d\s+@)\s+/i,
  /\bchown\s+-R\s+[0-9]+:/i,
  /\bapt-get\s+(?:purge|remove)\s+(?:--purge\s+)?(?:libc6|dpkg|apt|bash)\b/i,
];

const SEMANTIC_DOMAINS = [
  {
    id: 'financial_ops',
    label: 'Financial/Banking Operations',
    keywords: [
      'ledger', 'balance', 'reserve', 'vault', 'treasury', 'settlement', 'clearing',
      'swift', 'iso20022', 'fix', 'payment', 'credit', 'debit', 'escrow',
      'compliance', 'regulatory', 'cbe', 'fra', 'cbdc', 'bnpl',
      'transaction', 'remittance', 'fiat', 'overdraft', 'collateral',
      'liquidation', 'underwriting', 'hsm', 'custodian', 'custody', 'fintech',
      'banking', 'auditor', 'amortize', 'accrual', 'chargeback',
      'cleared', 'approved', 'processed', 'settled',
      'claim', 'audit', 'supervisor', 'examiner',
    ],
    threshold: 1,
    scanEmoji: '\u{1F3DB}\uFE0F',
    scanMessage: 'Financial/banking operations detected. Running comprehensive 111-rule scan...',
    auditEvent: 'auto_detect_financial',
  },
  {
    id: 'token_asset',
    label: 'Token/Asset Management',
    keywords: [
      'approve', 'approved', 'allowance', 'drain', 'sweep', 'withdraw',
      'transfer', 'balanceof', 'totalsupply', 'mint', 'burn',
      'selfdestruct', 'suicide', 'renounceownership', 'renounce',
      'setfee', 'updatefee', 'setapprovalforall', 'increaseallowance',
      'maxapprove', 'unlimitedapprove',
      'emergencywithdraw', 'transferall', 'transferfrom',
      'flashloan', 'liquidity', 'swap', 'stake', 'reward',
    ],
    threshold: 1,
    scanEmoji: '\u{1F6AB}',
    scanMessage: 'Token/asset management operations detected. Running comprehensive 111-rule scan...',
    auditEvent: 'auto_detect_token_asset',
  },
  {
    id: 'access_control',
    label: 'Access Control Pattern',
    keywords: [
      'bypass', 'override', 'skip', 'silence', 'mute',
      'hsm', 'signing', 'authorization', 'without',
      'no auth', 'no signature', 'no access control',
      'anyone can', 'allow anyone',
      'tx.origin', 'msg.sender', 'address(0)',
      'access control', 'authentication bypass',
      'permission escalation', 'privilege escalation',
      'no validation', 'no verification',
    ],
    threshold: 1,
    scanEmoji: '\u{1F6AB}',
    scanMessage: 'Access control pattern detected. Running comprehensive 111-rule scan...',
    auditEvent: 'auto_detect_access',
  },
];

const DEPENDENCY_MANIFEST_REGEX = /\{\s*["'](?:name|dependencies|devDependencies|scripts)["']\s*:/i;

const CI_WORKFLOW_REGEX = /\b(?:on\s*:\s*(?:push|pull_request|workflow_dispatch|schedule)|runs-on:\s+ubuntu|actions\/checkout@|uses:\s+\w+\/\w+@)\b/i;

function isDangerousCommand(text) {
  for (const pattern of DANGEROUS_COMMANDS_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

function isGitHubUrl(text) {
  return GITHUB_REGEX.test(text);
}

function isSolanaAddress(text) {
  return SOLANA_ADDRESS_REGEX.test(text);
}

function isSolidityCode(text) {
  return SOLIDITY_REGEX.test(text);
}

function isSolanaProgramCode(text) {
  return SOLANA_PROGRAM_KEYWORDS.test(text);
}

function isDependencyManifest(text) {
  return DEPENDENCY_MANIFEST_REGEX.test(text);
}

function isCiWorkflow(text) {
  return CI_WORKFLOW_REGEX.test(text);
}

function matchSemanticDomains(text) {
  try {
    if (!text || typeof text !== 'string') return [];
    const lower = text.toLowerCase();
    const results = [];
    for (const domain of SEMANTIC_DOMAINS) {
      let count = 0;
      for (const kw of domain.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          count++;
        }
      }
      if (count >= domain.threshold) {
        results.push({ ...domain, matchCount: count });
      }
    }
    return results.sort((a, b) => b.matchCount - a.matchCount);
  } catch (err) {
    logger.error({ err, text: text?.slice(0, 100) }, "matchSemanticDomains error");
    return [];
  }
}

function detectContentType(text) {
  try {
    if (!text || typeof text !== 'string') return { type: 'unknown', confidence: 0 };

    const trimmed = text.trim();
    if (!trimmed) return { type: 'unknown', confidence: 0 };

    const firstLine = trimmed.split('\n')[0].trim();

    if (isGitHubUrl(trimmed)) {
      return { type: 'github_url', confidence: 1.0, label: 'GitHub Repository' };
    }

    if (isSolanaAddress(firstLine) && trimmed.split('\n').length <= 3) {
      return { type: 'solana_address', confidence: 0.95, label: 'Solana Address' };
    }

    if (isDangerousCommand(trimmed)) {
      return { type: 'dangerous_command', confidence: 0.95, label: 'Dangerous Command' };
    }

    if (isSolidityCode(trimmed)) {
      return { type: 'solidity_code', confidence: 0.9, label: 'Solidity/Smart Contract' };
    }

    if (isSolanaProgramCode(trimmed)) {
      return { type: 'solana_program', confidence: 0.9, label: 'Solana Program' };
    }

    const domainMatches = matchSemanticDomains(trimmed);
    if (domainMatches.length > 0) {
      return { type: 'financial_scan', confidence: 0.85, label: domainMatches[0].label, domains: domainMatches };
    }

    if (isCiWorkflow(trimmed)) {
      return { type: 'ci_workflow', confidence: 0.85, label: 'CI/CD Workflow' };
    }

    if (isDependencyManifest(trimmed)) {
      return { type: 'dependency_manifest', confidence: 0.85, label: 'Dependency Manifest' };
    }

    if (trimmed.length > 200) {
      return { type: 'code_snippet', confidence: 0.5, label: 'Code Snippet' };
    }

    return { type: 'unknown', confidence: 0, label: 'Unknown' };
  } catch (err) {
    logger.error({ err, text: text?.slice(0, 100) }, "detectContentType error");
    return { type: 'unknown', confidence: 0, label: 'Unknown' };
  }
}

async function autoScan(type, content, ctx) {
  try {
    const userId = String(ctx.from.id);
    const { scanWithMcp } = require('./mcp.service');
    const { scanGitHubRepo } = require('./github.service');
    const { sendTokenScan } = require('./token.service');
    const { consumeCredit, logAudit, getCredits, getUserTier } = require('./activation.service');
    const { resolveUserTier } = require('../lib/billing/tier-guard');
    const { formatTelegramReport } = require('./report-format');
    const { logScanToRedis } = require('./redis.service');

    const user = await resolveUserTier(userId);
    const isUnlimited = user.tier === "founder" || user.tier === "enterprise";
    const credits = isUnlimited ? user.credits : await getCredits(userId);

    let loadingMsg = null;

    try {
      switch (type) {
      case 'dangerous_command': {
        if (!isUnlimited && credits < 1) {
          await ctx.reply("\u274C Not enough credits (need 1). Use /upgrade.");
          return;
        }
        loadingMsg = await ctx.reply("\u{1F50D} Scanning for dangerous patterns...");
        const result = await scanWithMcp(content);
        if (result.verdict === "BLOCK") {
          logAudit(userId, 'auto_detect_command', content.slice(0, 100), "BLOCK", result.score, 0, credits);
          await ctx.replyWithMarkdown(`\u{1F6AB} *Threat Blocked* \u2014 Dangerous Command\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nPayload blocked. No credit consumed.`);
          return;
        }
        const remaining = isUnlimited ? credits : await consumeCredit(userId, 1);
        logAudit(userId, 'auto_detect_command', content.slice(0, 100), result.verdict, result.score, 1, remaining);
        const { icon: tierIcon, name: tierName } = require('../utils/scoring').getTier(remaining, user.tier);
        const msg = formatTelegramReport(result, remaining, tierIcon, tierName);
        await ctx.replyWithMarkdown(msg);
        break;
      }

      case 'github_url': {
        if (!isUnlimited && credits < 15) {
          await ctx.reply("\u274C Not enough credits for repository scan (need 15). Use /upgrade.");
          return;
        }
        loadingMsg = await ctx.reply("\u{1F50D} Scanning GitHub repository...");
        const result = await scanGitHubRepo(content, scanWithMcp);
        if (result && result.error) {
          await ctx.reply("\u274C " + (result.message || "GitHub scan failed. Credit not consumed."));
          return;
        }
        if (result.verdict === "BLOCK") {
          result.gitHub = {
            owner: result.owner,
            repo: result.repo,
            branch: result.branch,
            filesScanned: result.filesScanned,
            issuesFound: result.issuesFound,
            findings: result.findings,
          };
          logAudit(userId, 'auto_detect_github', content.slice(0, 100), "BLOCK", result.score, 0, credits);
          const { icon: tierIcon, name: tierName } = require('../utils/scoring').getTier(credits, user.tier);
          const msg = formatTelegramReport(result, credits, tierIcon, tierName);
          await ctx.replyWithMarkdown(msg);
          return;
        }
        result.gitHub = {
          owner: result.owner,
          repo: result.repo,
          branch: result.branch,
          filesScanned: result.filesScanned,
          issuesFound: result.issuesFound,
          findings: result.findings,
        };
        const remaining = isUnlimited ? credits : await consumeCredit(userId, 15);
        logAudit(userId, 'auto_detect_github', content.slice(0, 100), result.verdict, result.score, 15, remaining);
        const { icon: tierIcon, name: tierName } = require('../utils/scoring').getTier(remaining, user.tier);
        const msg = formatTelegramReport(result, remaining, tierIcon, tierName);
        await ctx.replyWithMarkdown(msg);
        break;
      }

      case 'solana_address': {
        if (!isUnlimited && credits < 5) {
          await ctx.reply("\u274C Not enough credits for token scan (need 5). Use /upgrade.");
          return;
        }
        loadingMsg = await ctx.reply("\u{1F50D} Analyzing Solana address...");
        const result = await sendTokenScan(content, 'basic');
        if (result && result.error) {
          await ctx.reply("`\u274C " + result.error + "`");
          return;
        }
        if ((result.verdict || "ALLOW") === "BLOCK") {
          logAudit(userId, 'auto_detect_solana_address', content.slice(0, 44), "BLOCK", result.score || 0, 0, credits);
          await ctx.replyWithMarkdown(`\u{1F6AB} *Threat Blocked* \u2014 Solana Address\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score || 0}/100\n\u2500\nNo credit consumed.`);
          return;
        }
        const remaining = isUnlimited ? credits : await consumeCredit(userId, 5);
        logAudit(userId, 'auto_detect_solana_address', content.slice(0, 44), result.verdict || "ALLOW", result.score || 0, 5, remaining);
        await ctx.replyWithMarkdown(formatTokenAutoResult(result, content));
        break;
      }

      case 'solidity_code': {
        if (!isUnlimited && credits < 1) {
          await ctx.reply("\u274C Not enough credits (need 1). Use /upgrade.");
          return;
        }
        loadingMsg = await ctx.reply("\u{1F50D} Scanning Solidity smart contract...");
        const EVM_TAG = "pragma solidity " + "\n" + content;
        const result = await scanWithMcp(EVM_TAG);
        if (result.verdict === "BLOCK") {
          logAudit(userId, 'auto_detect_evm', content.slice(0, 100), "BLOCK", result.score, 0, credits);
          await ctx.replyWithMarkdown(`\u{1F6AB} *Threat Blocked* \u2014 Solidity Contract\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
          return;
        }
        const remaining = isUnlimited ? credits : await consumeCredit(userId, 1);
        logAudit(userId, 'auto_detect_evm', content.slice(0, 100), result.verdict, result.score, 1, remaining);
        const { icon: tierIcon, name: tierName } = require('../utils/scoring').getTier(remaining, user.tier);
        const msg = formatTelegramReport(result, remaining, tierIcon, tierName);
        await ctx.replyWithMarkdown(msg);
        break;
      }

      case 'solana_program': {
        if (!isUnlimited && credits < 1) {
          await ctx.reply("\u274C Not enough credits (need 1). Use /upgrade.");
          return;
        }
        loadingMsg = await ctx.reply("\u{1F50D} Scanning Solana program...");
        const result = await scanWithMcp(content);
        if (result.verdict === "BLOCK") {
          logAudit(userId, 'auto_detect_solana', content.slice(0, 100), "BLOCK", result.score, 0, credits);
          await ctx.replyWithMarkdown(`\u{1F6AB} *Threat Blocked* \u2014 Solana Program\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
          return;
        }
        const remaining = isUnlimited ? credits : await consumeCredit(userId, 1);
        logAudit(userId, 'auto_detect_solana', content.slice(0, 100), result.verdict, result.score, 1, remaining);
        const { icon: tierIcon, name: tierName } = require('../utils/scoring').getTier(remaining, user.tier);
        const msg = formatTelegramReport(result, remaining, tierIcon, tierName);
        await ctx.replyWithMarkdown(msg);
        break;
      }

      case 'financial_scan': {
        if (!isUnlimited && credits < 1) {
          await ctx.reply("\u274C Not enough credits (need 1). Use /upgrade.");
          return;
        }
        const domains = ctx._detectedDomains || [];
        const emoji = domains.length > 0 ? domains[0].scanEmoji : '\u{1F6E1}\uFE0F';
        const msgText = domains.length > 0 ? domains[0].scanMessage : 'Scanning for security threats...';
        loadingMsg = await ctx.reply(emoji + ' ' + msgText);
        const result = await scanWithMcp(content);
        if (result.verdict === "BLOCK") {
          logger.warn({ userId, score: result.score, reasons: result.reasons }, "BLOCK verdict on financial scan — threat isolated");
          logAudit(userId, 'auto_detect_financial_scan', content.slice(0, 100), "BLOCK", result.score, 0, credits);
          await ctx.replyWithMarkdown(
            `\u{1F6AB} *Threat Blocked* \u2014 Financial Security Violation\n` +
            require('../utils/formatting').D + '\n' +
            `Verdict: *BLOCK*\n` +
            `Score: ${result.score}/100\n` +
            `Risk: *${(result.riskLevel || 'critical').toUpperCase()}*\n` +
            (result.reasons?.length ? `Reason: ${result.reasons.slice(0, 3).join('; ')}` : '') + '\n' +
            require('../utils/formatting').D + '\n' +
            `Payload blocked. No credit consumed.`
          );
          return;
        }
        const remaining = isUnlimited ? credits : await consumeCredit(userId, 1);
        logAudit(userId, 'auto_detect_financial_scan', content.slice(0, 100), result.verdict, result.score, 1, remaining);
        result.scanType = "Financial/Banking";
        const { icon: tierIcon, name: tierName } = require('../utils/scoring').getTier(remaining, user.tier);
        const msg = formatTelegramReport(result, remaining, tierIcon, tierName);
        await ctx.replyWithMarkdown(msg);
        break;
      }

      case 'ci_workflow': {
        if (!isUnlimited && credits < 1) {
          await ctx.reply("\u274C Not enough credits (need 1). Use /upgrade.");
          return;
        }
        loadingMsg = await ctx.reply("\u{1F50D} Scanning CI/CD workflow...");
        const result = await scanWithMcp(content);
        if (result.verdict === "BLOCK") {
          logAudit(userId, 'auto_detect_ci', content.slice(0, 100), "BLOCK", result.score, 0, credits);
          await ctx.replyWithMarkdown(`\u{1F6AB} *Threat Blocked* \u2014 CI/CD Workflow\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
          return;
        }
        const remaining = isUnlimited ? credits : await consumeCredit(userId, 1);
        logAudit(userId, 'auto_detect_ci', content.slice(0, 100), result.verdict, result.score, 1, remaining);
        const { icon: tierIcon, name: tierName } = require('../utils/scoring').getTier(remaining, user.tier);
        const msg = formatTelegramReport(result, remaining, tierIcon, tierName);
        await ctx.replyWithMarkdown(msg);
        break;
      }

      case 'dependency_manifest': {
        if (!isUnlimited && credits < 1) {
          await ctx.reply("\u274C Not enough credits (need 1). Use /upgrade.");
          return;
        }
        loadingMsg = await ctx.reply("\u{1F50D} Scanning dependencies...");
        const { scanDeps } = require('./mcp.service');
        const result = await scanDeps(content);
        if ((result.verdict || "ALLOW") === "BLOCK") {
          logAudit(userId, 'auto_detect_deps', content.slice(0, 100), "BLOCK", result.score || 0, 0, credits);
          await ctx.replyWithMarkdown(`\u{1F6AB} *Threat Blocked* \u2014 Dependency Manifest\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score || 0}/100\n\u2500\nNo credit consumed.`);
          return;
        }
        const remaining = isUnlimited ? credits : await consumeCredit(userId, 1);
        logAudit(userId, 'auto_detect_deps', content.slice(0, 100), result.verdict || "ALLOW", result.score || 0, 1, remaining);
        await ctx.replyWithMarkdown(formatDepsAutoResult(result));
        break;
      }

      default:
        await ctx.reply(
`\u{1F6E1}\uFE0F Content detected as: *${content.length > 50 ? "code" : "text"}*
${require('../utils/formatting').D}
Use a specific command to analyze this:
/scan     \u2014 Scan any code or command
/scan-banking \u2014 Scan banking/financial code
/solana   \u2014 Scan Solana programs
/evm      \u2014 Scan EVM smart contracts
/solanatoken \u2014 Analyze Solana tokens`,
          { parse_mode: "Markdown" }
        );
        return;
    }
    } catch (err) {
      logger.error({ err, userId, type, content: content.slice(0, 100) }, "autoScan error");
      if (loadingMsg) {
        await ctx.reply(`\u274C Scan failed: ${err.message?.slice(0, 200) || "unexpected error"}`);
      } else {
        await ctx.reply("\u274C Scan failed. Try a specific command like /scan.");
      }
    }
  } catch (outerErr) {
    logger.error({ err: outerErr, type, content: content?.slice(0, 100) }, "autoScan outer error");
    await ctx.reply("\u274C Scan failed. Please try again or use /scan directly.");
  }
}

function formatTokenAutoResult(result, input) {
  const r = result.result || result;
  const score = r.finalRiskScore ?? result.score ?? 0;
  const meta = r.metadata || {};
  const auth = r.authorityAnalysis || {};
  const whale = r.whaleMetrics || {};
  const rug = r.rugPullIndicators || {};

  let riskEmoji = "\u{1F7E2}";
  let riskLabel = "LOW";
  if (score >= 80) { riskEmoji = "\u{1F534}"; riskLabel = "CRITICAL"; }
  else if (score >= 60) { riskEmoji = "\u{1F7E0}"; riskLabel = "HIGH"; }
  else if (score >= 40) { riskEmoji = "\u{26A0}\uFE0F"; riskLabel = "MEDIUM"; }

  const D = require('../utils/formatting').D;
  return [
    `\u{1F6E1}\uFE0F *TEOS* \u2014 Solana Address Analysis`,
    D,
    `Address: \`${input.slice(0, 20)}...${input.slice(-4)}\``,
    meta.name ? `Token: ${meta.name} (${meta.symbol || '?'})` : null,
    meta.supply ? `Supply: ${meta.supply}` : null,
    D,
    `Risk: ${riskEmoji} *${riskLabel}* (${score}/100)`,
    auth.mintAuthorityRevoked ? `\u2705 Mint: REVOKED` : `\u{1F6AB} Mint: ACTIVE`,
    auth.freezeAuthorityRevoked ? `\u2705 Freeze: REVOKED` : `\u{1F6AB} Freeze: ACTIVE`,
    whale.totalHolders > 0 ? `Holders: ${whale.totalHolders}` : null,
    whale.top10Concentration > 0 ? `Whale Top 10: ${whale.top10Concentration}%` : null,
    rug.isPotentialRug ? `\u{1F6AB} *Rug Pull Risk Detected*` : null,
    D,
    `Use /diligence for full due diligence with PDF report (15cr)`,
    `Use /solanatoken for detailed token analysis (5cr)`,
  ].filter(l => l !== null).join('\n');
}

function formatDepsAutoResult(result) {
  const D = require('../utils/formatting').D;
  const score = result.score || 0;
  const verdict = result.verdict || "ALLOW";
  return [
    `\u{1F6E1}\uFE0F *TEOS* \u2014 Dependency Scan`,
    D,
    `Verdict: ${verdict}`,
    `Score: ${score}/100`,
    D,
    `Use /deps for detailed dependency analysis`,
  ].join('\n');
}

const PROTECTION_GROUPS = new Map();

function setGroupProtection(chatId, enabled) {
  if (enabled) {
    PROTECTION_GROUPS.set(chatId, true);
  } else {
    PROTECTION_GROUPS.delete(chatId);
  }
}

function isGroupProtected(chatId) {
  return PROTECTION_GROUPS.has(chatId);
}

function getProtectedGroups() {
  return Array.from(PROTECTION_GROUPS.keys());
}

module.exports = {
  detectContentType,
  autoScan,
  isDangerousCommand,
  isGitHubUrl,
  isSolanaAddress,
  isSolidityCode,
  isSolanaProgramCode,
  isDependencyManifest,
  isCiWorkflow,
  matchSemanticDomains,
  setGroupProtection,
  isGroupProtected,
  getProtectedGroups,
  formatTokenAutoResult,
  formatDepsAutoResult,
  DANGEROUS_COMMANDS_PATTERNS,
  SEMANTIC_DOMAINS,
};
