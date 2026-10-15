const { getCredits, getUserStatus }  = require('../../services/activation.service');
const { getTier }                  = require('../../utils/scoring');
const { resolveUserTier }          = require('../../lib/billing/tier-guard');
const { D }                        = require('../../utils/formatting');
const { creditsMenu }              = require('../menus');

const TIER_DISPLAY = {
  founder:    { icon: '\u{1F451}', label: 'Founder',    limit: '∞ Unlimited', price: 'Internal'     },
  enterprise: { icon: '\u{1F451}', label: 'Enterprise', limit: '∞ Unlimited', price: 'Custom'      },
  team:       { icon: '\u{1F9FF}', label: 'Team',       limit: '10,000/mo',   price: '$199/mo'      },
  pro:        { icon: '\u{1F7E2}', label: 'Pro',        limit: '1,000/mo',    price: '$69/mo'       },
  beta_granted: { icon: '\u{1F9F1}', label: 'Beta Tester', limit: '200',      price: '$0'           },
  none:       { icon: '\u26AA',    label: 'Standard',    limit: '5/mo',        price: '$0'           },
};

const ENTITLEMENT_TO_TIER = {
  none: 'none',
  beta_granted: 'beta_granted',
  premium_granted: 'pro',
  trial_granted: 'none'
};

function bar(used, dailyLimit) {
  if (!dailyLimit || dailyLimit === Infinity) return '█████████████████████ ∞';
  const pct    = Math.min(used / dailyLimit, 1);
  const filled = Math.round(pct * 20);
  return '█'.repeat(filled) + '░'.repeat(20 - filled) + `  ${Math.round(pct * 100)}%`;
}

async function creditsCommand(ctx) {
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
  const credits = status.credit_state.balance;

  const tierKey = ENTITLEMENT_TO_TIER[status.entitlement_state] || 'none';
  const display = TIER_DISPLAY[tierKey] || TIER_DISPLAY.none;
  const planLabel = display.label;
  const planIcon  = display.icon;
  const planLimit = display.limit;

  const expires = status.time_state?.subscription_expires
    ? new Date(status.time_state.subscription_expires).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const ACCESS_LABELS = {
    active: '\u2705 Access active',
    expired: '\u23F0 Access expired',
    restricted: '\u{1F512} Access restricted',
    suspended: '\u{1F6AB} Access suspended'
  };
  const accessLine = ACCESS_LABELS[status.access_state] || '\u2753 Unknown';

  const dailyLimitMap = { founder: Infinity, enterprise: Infinity, team: 10000, pro: 1000, beta_granted: 200, none: 5 };
  const dailyLimit = dailyLimitMap[tierKey] ?? 5;

  const lines = [
    `🔶 *TEOS* ── Credits`,
    D,
    `Plan   : ${planIcon} ${planLabel}  (${display.price})`,
    `Limit  : ${planLimit}`,
    `Remaining: ${credits}`,
    expires ? `Expires: ${expires}` : null,
    status.entitlement_state === "premium_granted" && tierKey === "founder" ? `${D}\n👑 *Founder* — permanent access, unlimited credits.` : null,
    accessLine,
    D,
    `Usage:`,
    `\`${bar(Math.max(0, dailyLimit - credits), dailyLimit)}\``,
    D,
    `Costs : /scan 1 · /scan-banking 1 · /deps 1 · /ci 1 · /report 2 · /github 15 · /solanatoken 5 · /diligence 15 · /fullreport 20`,
    `Upgrade: /upgrade`,
  ]
    .filter(l => l !== null)
    .join('\n');

  return ctx.replyWithMarkdown(lines, creditsMenu());
}

module.exports = { creditsCommand };