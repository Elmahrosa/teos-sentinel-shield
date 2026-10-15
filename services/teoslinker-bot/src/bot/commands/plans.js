const { D } = require("../../utils/formatting");
const { planLinks } = require("../../utils/checkout");
const { plansMenu } = require("../menus");

async function plansCommand(ctx) {
  const L = planLinks(String(ctx.from.id));
  await ctx.reply(
`\u{1F6E1}\uFE0F TEOS SENTINEL \u2014 Plans
${D}
\u26AA FREE \u2014 $0/mo
\u2514\u2500 5 credits/month
\u2514\u2500 /scan \u2014 code & command analysis
\u2514\u2500 /solanatoken \u2014 basic token intelligence (5cr)
\u2514\u2500 ALLOW / WARN / BLOCK verdicts
\u2514\u2500 Community support
${D}
\u{1F7E2} PRO MONTHLY \u2014 $69/mo
\u2514\u2500 1,000 credits/month
\u2514\u2500 Everything in Free, plus:
\u2514\u2500 /deps \u00B7 /ci \u00B7 /github \u00B7 /report (PDF) \u00B7 /diligence (premium PDF)
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
\u2514\u2500 /deps \u00B7 /ci \u00B7 /github \u00B7 /report (PDF) \u00B7 /diligence (premium PDF)
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
\u{1F4A1} Credit costs:
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4B3} CREDIT COSTS
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u26AA /scan \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 1 credit
\u26AA /scan-banking \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 1 credit
\u26AA /solana \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 1 credit
\u26AA /evm \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 1 credit
\u26AA /solanatoken \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 5 credits
\u26AA /deps \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 1 credit
\u26AA /ci \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 1 credit
\u26AB /chat \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 1-3 credits
\u26AB /claude \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 2 credits
\u26AB /claude-opus \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 3 credits
\u{1F7E2} /report \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 2 credits
\u{1F7E2} /github \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 15 credits
\u{1F7E2} /diligence \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 15 credits
\u{1F7E2} /fullreport \u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7 20 credits
\u{1F451} /banking-audit \u00B7\u00B7 30 credits
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
Use /upgrade to subscribe.`,
    plansMenu()
  );
}

module.exports = { plansCommand };
