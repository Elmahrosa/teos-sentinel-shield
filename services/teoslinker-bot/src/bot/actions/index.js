/**
 * TEOS Sentinel — Bot action handlers (inline keyboard callbacks)
 *
 * Pricing (Dodo Payments — fixed, never substitute):
 *   Pro       → 1,000 credits/mo  — $69/mo  ($690/yr)
 *   Team      → 10,000 credits/mo — $199/mo ($1,990/yr)
 *   Enterprise → Unlimited        — Custom pricing
 */

'use strict';

const { Markup } = require('telegraf');
const { getCredits, getUserTier, getUserStatus } = require('../../services/activation.service');
const { D }                       = require('../../utils/formatting');
const { getTier }                 = require('../../utils/scoring');
const { resolveUserTier, formatExpires } = require('../../lib/billing/tier-guard');
const { mainMenu, scanHubKeyboard, upgradeMenu, plansMenu, creditsMenu } = require('../menus');
const { sendStatus }              = require('../commands/status');
const { getBetaRedemptionCount }  = require('../commands/upgrade');
let logger;
try {
  logger = require('../../../logger.cjs').logger;
} catch {
  logger = console;
}

// ─── Dodo Payments checkout links (built per-user in the handlers below) ──────
const { planLinks } = require('../../utils/checkout');

function registerActions(bot) {

  // ── SCAN_HUB ────────────────────────────────────────────────────────────────
  bot.action('SCAN_HUB', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = String(ctx.from.id);
    const user = await resolveUserTier(userId);
    const isFree = user.order < 3;

    await ctx.reply(
`\u{1F6E1}\uFE0F TEOS Sentinel \u2014 Scan
${D}
Choose what to scan. Credits cost shown per scan.
${D}
Your tier: ${isFree ? '\u26AA Free' : '\u{1F7E2} Pro+'}
${D}
Tip: You can also type commands directly, e.g. /scan rm -rf / or /scan-banking <code>`,
      scanHubKeyboard(isFree)
    );
  });

  bot.action('SCAN_CODE', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F4DD} Code / Command Scan  (1 credit)
${D}
Usage:
/scan <code or command>

Example:
/scan rm -rf /

Analyzes: destructive commands, injection patterns,
suspicious network calls, privilege escalation,
crypto-mining payloads, data exfiltration.`,
      mainMenu()
    );
  });

  bot.action('SCAN_DEPS', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F4E6} Dependency Scan  (1 credit)
${D}
Usage:
/deps {"dependencies":{"express":"latest"}}

Example:
/deps {"dependencies":{"event-stream":"3.3.6"}}

Checks: floating versions, known malicious packages,
typosquatting, external URL deps, unmaintained packages.`,
      mainMenu()
    );
  });

  bot.action('SCAN_CI', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{2699}\uFE0F CI/CD Security Audit  (1 credit)
${D}
Usage:
/ci <workflow YAML, Dockerfile, or pipeline config>

Example:
/ci uses: actions/checkout@v4

Checks: secrets exposure, curl | bash patterns,
privileged containers, unsafe GitHub Actions,
supply chain vulnerabilities.`,
      mainMenu()
    );
  });

  bot.action('SCAN_GITHUB', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F419} GitHub Repository Scan  (15 credits)
${D}
Usage:
/github https://github.com/owner/repo

Example:
/github https://github.com/expressjs/express

Scans high-risk files: Dockerfiles, shell scripts,
GitHub Actions, Terraform, CI configs, secrets.`,
      mainMenu()
    );
  });

  bot.action('SCAN_REPORT', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F4C4} PDF Report  (2 credits, 15 for repos)
${D}
Usage:
/report <code or command>
/report https://github.com/owner/repo

Example:
/report rm -rf /

Generates a PDF with risk score, severity tags,
findings, and recommended actions.`,
      mainMenu()
    );
  });

  bot.action('SCAN_SOLANA', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F7E1} Solana Program Security Scan  (1 credit)
${D}
Usage:
/solana <anchor/rust program>

Example:
/solana use anchor_lang::prelude::*;

Analyzes: missing signer checks, owner validation,
CPI safety, token authority, PDA validation,
account safety, anchor constraint bypasses.`,
      mainMenu()
    );
  });

  bot.action('SCAN_EVM', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F535} EVM Smart Contract Security Scan  (1 credit)
${D}
Usage:
/evm <solidity code>

Example:
/evm pragma solidity ^0.8.0;

Analyzes: reentrancy, tx.origin auth, delegatecall,
selfdestruct, access control, flash loans,
arithmetic, proxy storage, unchecked calls,
centralization risks.`,
      mainMenu()
    );
  });

  bot.action('SCAN_TOKEN', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F7E1} Solana Token Intelligence  (5 credits)
${D}
Usage:
/solanatoken <mint_address>

Example:
/solanatoken DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

Analyzes: token metadata, holder distribution,
authority analysis, whale concentration metrics,
rug pull indicators, final risk score.`,
      mainMenu()
    );
  });

  bot.action('SCAN_DILIGENCE', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F3C6} Premium Token Due Diligence  (15 credits)
${D}
Usage:
/diligence <mint_address>

Example:
/diligence DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

Includes: everything in token scan + liquidity
analysis + premium cinema-quality PDF report
with Sentinel stamp and ELMAHROSA branding.`,
      mainMenu()
    );
  });

  bot.action('SCAN_FULL_REPORT', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F4C4} Full Token Risk Report (PDF)  (20 credits)
${D}
Usage:
/fullreport <mint_address>

Example:
/fullreport DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

Includes: all due diligence data + comprehensive
investor-grade PDF with executive summary, risk
gauges, whale analysis, authority audit, liquidity
depth, rug pull indicators, and disclaimers.`,
      mainMenu()
    );
  });

  bot.action('SCAN_BANKING', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F3DB}\uFE0F Banking Compliance Audit  (1 credit)
${D}
Usage:
/scan-banking <code>

Example:
/scan-banking ledger.balance.update(audit.bypass=true)

Analyzes: ledger manipulation, SWIFT/ISO 20022 unencrypted,
FIX protocol cleartext, front-running patterns,
reserve key leaks, CBE/FRA dual-mandate compliance,
unassigned dispute escalation, PCI/FRA data contamination.`,
      mainMenu()
    );
  });

  bot.action('BANKING_DEMO', async (ctx) => {
    await ctx.answerCbQuery();
    const sampleCode = `function processPayment() {
  const ledger = getLedger();
  ledger.balance.update({ bypassHooks: true });
  const swiftMsg = new SWIFTMessage({ transport: "ws://swift.example.com" });
  const fixSession = new FIXSession({ password: "cleartext!" });
  const reserveKey = "cb_reserve_signing_key_2026";
}`;
    const { bankingCommand } = require('../commands/banking');
    ctx.message = { text: `/scan-banking ${sampleCode}` };
    await bankingCommand(ctx);
  });

  // ── PLANS ───────────────────────────────────────────────────────────────────
  bot.action('PLANS', async (ctx) => {
    await ctx.answerCbQuery();
    const L = planLinks(String(ctx.from.id));
    await ctx.reply(
`\u{1F6E1}\uFE0F TEOS SENTINEL \u2014 Plans
${D}
\u26AA FREE \u2014 $0/mo
\u2514\u2500 5 credits/month
\u2514\u2500 /scan \u2014 code & command analysis
\u2514\u2500 /scan-banking \u2014 financial pipeline audit
\u2514\u2500 /solana \u2014 Solana program security
\u2514\u2500 /evm \u2014 EVM smart contract security
\u2514\u2500 /solanatoken \u2014 Basic token intelligence
\u2514\u2500 ALLOW / WARN / BLOCK verdicts
\u2514\u2500 Community support
${D}
\u{1F7E2} PRO MONTHLY \u2014 $69/mo
\u2514\u2500 1,000 credits/month
\u2514\u2500 Everything in Free, plus:
\u2514\u2500 /deps \u00B7 /ci \u00B7 /github \u00B7 /report (PDF) \u00B7 /diligence \u00B7 /fullreport
\u2514\u2500 Full repo scanning + CI/CD audits
\u2514\u2500 Email support
\u2514\u2500 Bonus +200 credits granted after successful payment (first 100 users only)
\u2514\u2500 Valid 7 days or until used
\u2514\u2500 Refunds handled per Dodo Payments rules
\u{1F517} ${L.proMonthly}
${D}
\u{1F7E2} PRO ANNUAL \u2014 $690/yr
\u2514\u2500 1,000 credits/month
\u2514\u2500 Everything in Free, plus:
\u2514\u2500 /deps \u00B7 /ci \u00B7 /github \u00B7 /report (PDF) \u00B7 /diligence \u00B7 /fullreport
\u2514\u2500 Full repo scanning + CI/CD audits
\u2514\u2500 Email support
\u2514\u2500 Bonus +200 credits granted after successful payment (first 100 users only)
\u2514\u2500 Valid 7 days or until used
\u2514\u2500 Refunds handled per Dodo Payments rules
\u{1F517} ${L.proAnnual}
${D}
\u{1F9FF} TEAM \u2014 $199/mo
\u2514\u2500 10,000 credits/month
\u2514\u2500 Everything in Pro, plus:
\u2514\u2500 Higher throughput for teams
\u2514\u2500 Priority support
\u{1F517} ${L.teamMonthly}  |  Yearly: ${L.teamAnnual}
${D}
\u{1F451} ENTERPRISE
\u2514\u2500 Unlimited usage
\u2514\u2500 Self-hosted / air-gapped deployment
\u2514\u2500 SSO/SAML \u00B7 audit logs \u00B7 SLA
\u{1F4E7} ayman@teosegypt.com
${D}
\u{1F451} FOUNDER
\u2514\u2500 Unlimited usage
\u2514\u2500 Internal \u2014 admin-granted only
${D}
\u{1F4A1} Credit costs: /scan 1 \u00B7 /scan-banking 1 \u00B7 /solana 1 \u00B7 /evm 1 \u00B7 /deps 1 \u00B7 /ci 1 \u00B7 /report 2 \u00B7 /github 15 \u00B7 /solanatoken 5 \u00B7 /diligence 15 \u00B7 /fullreport 20
Use /upgrade to subscribe.`,
      plansMenu()
    );
  });

  // ── UPGRADE ─────────────────────────────────────────────────────────────────
  bot.action('UPGRADE', async (ctx) => {
    await ctx.answerCbQuery();
    const L = planLinks(String(ctx.from.id));
    await ctx.reply(
`\u{1F680} Upgrade TEOS Sentinel
${D}
\u{1F381} Beta: +200 bonus credits \u2014 ${await getBetaRedemptionCount()}/100 users claimed
${D}
\u{1F7E2} PRO \u2014 $69/mo
\u2514\u2500 1,000 credits/month
\u2514\u2500 Bonus +200 credits (first 100 users only)
\u2514\u2500 ${L.proMonthly}
${D}
\u{1F7E2} PRO ANNUAL \u2014 $690/yr
\u2514\u2500 1,000 credits/month
\u2514\u2500 Bonus +200 credits (first 100 users only)
\u2514\u2500 ${L.proAnnual}
${D}
\u{1F9FF} TEAM \u2014 $199/mo
\u2514\u2500 10,000 credits/month
\u2514\u2500 ${L.teamMonthly}  |  Yearly: ${L.teamAnnual}
${D}
\u{1F451} Enterprise / air-gapped?   \u{1F4E7} ayman@teosegypt.com
${D}
Valid 7 days or until used. Refunds per Dodo Payments rules.`,
      upgradeMenu(String(ctx.from.id))
    );
  });

  // ── CREDITS ─────────────────────────────────────────────────────────────────
  bot.action('CREDITS', async (ctx) => {
    await ctx.answerCbQuery();
    const userId  = String(ctx.from.id);
    const user = await resolveUserTier(userId);

    if (user.tier === "founder") {
      return ctx.reply(
`\u{1F6E1}\uFE0F TEOS Credits
${D}
Plan     : \u{1F451} Founder
Credits  : \u221E Unlimited
Expires  : Never
\u2705 Access active
${D}
Founder tier \u2014 all features unlocked, no credit deductions.`,
        creditsMenu()
      );
    }

    const status  = await getUserStatus(userId);

    const ENTITLEMENT_ICONS = { none: '\u26AA', beta_granted: '\u{1F9F1}', premium_granted: '\u{1F7E2}', trial_granted: '\u{1F9EA}' };
    const ENTITLEMENT_LABELS = { none: 'Standard', beta_granted: 'Beta Tester', premium_granted: 'Premium', trial_granted: 'Trial' };

    const entitlementIcon = ENTITLEMENT_ICONS[status.entitlement_state] || '\u26AA';
    const entitlementLabel = ENTITLEMENT_LABELS[status.entitlement_state] || 'Standard';
    const expires = status.time_state?.subscription_expires
      ? new Date(status.time_state.subscription_expires).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : '—';

    const ACCESS_LABELS = { active: '\u2705 Access active', expired: '\u23F0 Access expired', restricted: '\u{1F512} Access restricted', suspended: '\u{1F6AB} Access suspended' };
    const accessLine = ACCESS_LABELS[status.access_state] || '\u2753 Unknown';

    await ctx.reply(
`\u{1F6E1}\uFE0F TEOS Credits
${D}
Plan     : ${entitlementIcon} ${entitlementLabel}
Credits  : ${status.credit_state.balance} remaining
Expires  : ${expires}
${accessLine}
${D}
Credit costs: /scan 1 \u00B7 /scan-banking 1 \u00B7 /solana 1 \u00B7 /evm 1 \u00B7 /deps 1 \u00B7 /ci 1 \u00B7 /report 2 \u00B7 /github 15 \u00B7 /solanatoken 5 \u00B7 /diligence 15 \u00B7 /fullreport 20
Use /upgrade to add credits or change plan.`,
      creditsMenu()
    );
  });

  // ── STATUS ──────────────────────────────────────────────────────────────────
  bot.action('STATUS', async (ctx) => {
    await ctx.answerCbQuery();
    await sendStatus(ctx);
  });

  // ── DEPS_HELP ───────────────────────────────────────────────────────────────
  bot.action('DEPS_HELP', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F9E9} Dependency Scanner
${D}
Usage:
/deps {"dependencies":{"express":"latest"}}

Checks:
\u2022 Floating versions (e.g. "latest")
\u2022 Known malicious packages
\u2022 Typosquatting attacks
\u2022 External URL dependencies
\u2022 Unmaintained packages

\u26A0\uFE0F Requires Pro plan or above.`,

      mainMenu()
    );
  });

  // ── CI_HELP ─────────────────────────────────────────────────────────────────
  bot.action('CI_HELP', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F9EA} CI/CD Security Audit
${D}
Usage:
/ci <workflow, Dockerfile, or pipeline>

Checks:
\u2022 Secrets exposure in CI
\u2022 curl | bash patterns
\u2022 Privileged containers
\u2022 Unsafe GitHub Actions
\u2022 Supply chain vulnerabilities

\u26A0\uFE0F Requires Pro plan or above.`,
      mainMenu()
    );
  });

  // ── ENTERPRISE ──────────────────────────────────────────────────────────────
  bot.action('ENTERPRISE', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
 `\u{1F451} Enterprise / air-gapped inquiries
${D}
SSO/SAML \u00B7 audit logs \u00B7 SLA

\u{1F4E7} ayman@teosegypt.com`
    );
  });

  // ── SOLANA_DEMO ─────────────────────────────────────────────
  bot.action('SOLANA_DEMO', async (ctx) => {
    await ctx.answerCbQuery();
    const { SOLANA_SAMPLE } = require('../commands/solana');
    const { scanWithMcp } = require('../../services/mcp.service');
    const { consumeCredit, logAudit, getCredits } = require('../../services/activation.service');
    const { resolveUserTier } = require('../../lib/billing/tier-guard');
    const { formatTelegramReport } = require('../../services/report-format');
    const { getTier } = require('../../utils/scoring');

    const userId = String(ctx.from.id);
    const user = await resolveUserTier(userId);
    const isUnlimited = user.tier === "founder" || user.tier === "enterprise";
    if (!isUnlimited && user.credits <= 0) {
      return ctx.reply("\u274C No credits remaining. Use /upgrade to continue.");
    }

    try {
      const loading = await ctx.reply("\u{1F50D} Scanning vulnerable Solana demo...");
      const result = await scanWithMcp(SOLANA_SAMPLE);
      if (result && result.error) return ctx.reply("\u274C Engine unavailable.");
      if (result.verdict === "BLOCK") {
        logAudit(userId, 'solana_demo', 'solana_demo_sample', "BLOCK", result.score, 0, user.credits);
        return ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 Solana Demo\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
      }
      const left = isUnlimited ? user.credits : await consumeCredit(userId, 1);
      logAudit(userId, 'solana_demo', 'solana_demo_sample', result.verdict, result.score, 1, left);
      const { icon: tierIcon, name: tierName } = getTier(left, user.tier);
      const msg = formatTelegramReport(result, left, tierIcon, tierName);
      await ctx.reply(`\u{1F7E1} TEOS SENTINEL \u2014 Solana Demo Scan\n${msg.slice(msg.indexOf('\u2501'))}`);
    } catch (err) {
      logger.error({ err, userId }, "SOLANA_DEMO action error");
      await ctx.reply("\u274C Demo scan failed. Try again.");
    }
  });

  // ── TOKEN_SAMPLE ────────────────────────────────────────────
  bot.action('TOKEN_SAMPLE', async (ctx) => {
    await ctx.answerCbQuery();
    const { sendTokenScan } = require('../../services/token.service');
    const { consumeCredit, logAudit } = require('../../services/activation.service');
    const { resolveUserTier } = require('../../lib/billing/tier-guard');
    const userId = String(ctx.from.id);
    const user = await resolveUserTier(userId);
    const isUnlimited = user.tier === "founder" || user.tier === "enterprise";
    if (!isUnlimited && user.credits < 5) {
      return ctx.reply("\u274C Not enough credits (need 5). Use /upgrade.");
    }
    try {
      const loading = await ctx.reply("\u{1F50D} Scanning sample BONK token on Solana...");
      const result = await sendTokenScan('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 'basic');
      if (result && result.error) return ctx.reply("\u274C Token scan engine unavailable.");
      if ((result.verdict || "ALLOW") === "BLOCK") {
        logAudit(userId, 'token_sample', 'bonk_token', "BLOCK", result.score, 0, user.credits);
        return ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 Token Sample\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
      }
      const left = isUnlimited ? user.credits : await consumeCredit(userId, 5);
      logAudit(userId, 'token_sample', 'bonk_token', result.verdict, result.score, 5, left);
      const r = result.result || result;
      const score = r.finalRiskScore ?? result.score ?? 0;
      const meta = r.metadata || {};
      await ctx.replyWithMarkdown(
`\u{1F7E1} TEOS SENTINEL \u2014 BONK Token Scan
${require('../../utils/formatting').D}
Token: ${meta.name || 'Bonk'} (${meta.symbol || 'BONK'})
Supply: ${meta.supply || '?'} | Holders: ${r.whaleMetrics?.totalHolders || '?'}
Risk Score: ${score}/100
Verdict: ${result.verdict || 'ALLOW'}
Use /diligence for full due diligence with PDF`
      );
    } catch (err) {
      logger.error({ err, userId }, "TOKEN_SAMPLE action error");
      await ctx.reply("\u274C Token sample scan failed. Try /solanatoken sample instead.");
    }
  });

  // ── DILIGENCE_SAMPLE ─────────────────────────────────────────
  bot.action('DILIGENCE_SAMPLE', async (ctx) => {
    await ctx.answerCbQuery();
    const { sendTokenScan } = require('../../services/token.service');
    const { consumeCredit, logAudit } = require('../../services/activation.service');
    const { resolveUserTier } = require('../../lib/billing/tier-guard');
    const { generatePremiumReport, setEngineMeta } = require('../../services/report-design');
    const { getEngineInfo } = require('../../services/mcp.service');
    const path = require('path');
    const fs = require('fs');
    const userId = String(ctx.from.id);
    const user = await resolveUserTier(userId);
    const isUnlimited = user.tier === "founder" || user.tier === "enterprise";
    if (!isUnlimited && user.credits < 15) {
      return ctx.reply("\u274C Not enough credits (need 15). Use /upgrade.");
    }
    try {
      const loading = await ctx.reply("\u{1F50D} Running premium due diligence on BONK token...");
      const result = await sendTokenScan('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 'premium');
      if (result && result.error) return ctx.reply("\u274C Engine unavailable.");
      if ((result.verdict || "ALLOW") === "BLOCK") {
        logAudit(userId, 'diligence_sample', 'bonk_premium', "BLOCK", result.score, 0, user.credits);
        return ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 Diligence Sample\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
      }
      const left = isUnlimited ? user.credits : await consumeCredit(userId, 15);
      logAudit(userId, 'diligence_sample', 'bonk_premium', result.verdict, result.score, 15, left);
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const pdfPath = path.join(tmpDir, `diligence-sample-${Date.now()}.pdf`);
      setEngineMeta(await getEngineInfo());
      await generatePremiumReport(result, 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', pdfPath);
      await ctx.replyWithDocument({ source: pdfPath, filename: `teos-diligence-bonk.pdf` });
      fs.unlink(pdfPath, () => {});
    } catch (err) {
      logger.error({ err, userId }, "DILIGENCE_SAMPLE action error");
      await ctx.reply("\u274C Premium sample failed. Try /diligence sample instead.");
    }
  });

  // ── EVM_DEMO ────────────────────────────────────────────────
  bot.action('EVM_DEMO', async (ctx) => {
    await ctx.answerCbQuery();
    const { EVM_SAMPLE } = require('../commands/evm');
    const { scanWithMcp } = require('../../services/mcp.service');
    const { consumeCredit, logAudit } = require('../../services/activation.service');
    const { resolveUserTier } = require('../../lib/billing/tier-guard');
    const { formatTelegramReport } = require('../../services/report-format');
    const { getTier } = require('../../utils/scoring');

    const userId = String(ctx.from.id);
    const user = await resolveUserTier(userId);
    const isUnlimited = user.tier === "founder" || user.tier === "enterprise";
    if (!isUnlimited && user.credits <= 0) {
      return ctx.reply("\u274C No credits remaining. Use /upgrade to continue.");
    }

    try {
      const loading = await ctx.reply("\u{1F50D} Scanning vulnerable EVM demo...");
      const result = await scanWithMcp(EVM_SAMPLE);
      if (result && result.error) return ctx.reply("\u274C Engine unavailable.");
      if (result.verdict === "BLOCK") {
        logAudit(userId, 'evm_demo', 'evm_demo_sample', "BLOCK", result.score, 0, user.credits);
        return ctx.reply(`\u{1F6AB} *Threat Blocked* \u2014 EVM Demo\n\u2500\nVerdict: *BLOCK*\nScore: ${result.score}/100\n\u2500\nNo credit consumed.`);
      }
      const left = isUnlimited ? user.credits : await consumeCredit(userId, 1);
      logAudit(userId, 'evm_demo', 'evm_demo_sample', result.verdict, result.score, 1, left);
      const { icon: tierIcon, name: tierName } = getTier(left, user.tier);
      const msg = formatTelegramReport(result, left, tierIcon, tierName);
      await ctx.reply(`\u{1F535} TEOS SENTINEL \u2014 EVM Demo Scan\n${msg.slice(msg.indexOf('\u2501'))}`);
    } catch (err) {
      logger.error({ err, userId }, "EVM_DEMO action error");
      await ctx.reply("\u274C Demo scan failed. Try again.");
    }
  });

  // ── HELP ────────────────────────────────────────────────────────────────────
  bot.action('HELP', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
`\u{1F6E1}\uFE0F TEOS Sentinel \u2014 Quick Reference
${D}
/scan         \u2014 Analyze code or command
/scan-banking \u2014 Audit financial pipelines (CBE/FRA)
/solana       \u2014 Scan Solana programs
/evm          \u2014 Scan EVM smart contracts
/solanatoken  \u2014 Basic token scan (5cr)
/diligence    \u2014 Premium due diligence (15cr)
/fullreport   \u2014 Full token risk PDF (20cr)
/deps         \u2014 Dependency scan (Pro+)
/ci           \u2014 CI/CD security audit (Team+)
/credits      \u2014 View your balance & plan
/plans        \u2014 View pricing plans
/upgrade      \u2014 Upgrade anytime
/status       \u2014 System health dashboard
/protect      \u2014 Group protection mode
${D}
\ud83e\udde0 Bot auto-detects: dangerous commands, GitHub URLs,
Solana addresses, Solidity code, dependency manifests, CI/CD workflows
${D}
Verdicts: \u2705 ALLOW \u2502 \u26A0\uFE0F WARN \u2502 \u{1F6AB} BLOCK
Scans: AI Commands \u2502 Solana Programs \u2502 EVM Contracts \u2502 Tokens \u2502 DD \u2502 Banking \u2502 Repos`,
      mainMenu()
    );
  });
}

module.exports = { registerActions };