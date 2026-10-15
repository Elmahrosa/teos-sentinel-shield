const { getCredits, getUserTier } = require("../../services/activation.service");
const { getTier } = require("../../utils/scoring");

const TIER_ORDER = { founder: 6, enterprise: 5, team: 4, tester: 3, beta_tester: 3, pro: 3, free: 1 };

const TIER_NAMES = {
  founder:    { icon: "\u{1F451}", name: "Founder" },
  enterprise: { icon: "\u{1F451}", name: "Enterprise" },
  team:       { icon: "\u{1F9FF}", name: "Team" },
  tester:     { icon: "\u{1F9F1}", name: "Alpha Tester" },
  beta_tester: { icon: "\u{1F9F1}", name: "Beta Tester" },
  pro:        { icon: "\u{1F7E2}", name: "Pro" },
  free:       { icon: "\u26AA",    name: "Free" },
};

const TIER_FEATURES = {
  deps:     { minTier: "pro",     label: "Dependency scanning", link: "Pro" },
  github:   { minTier: "pro",     label: "GitHub repo scanning", link: "Pro" },
  ci:       { minTier: "pro",     label: "CI/CD audits", link: "Pro" },
  reports:  { minTier: "pro",     label: "PDF reports", link: "Pro" },
  export:   { minTier: "pro",     label: "JSON export", link: "Pro" },
  webhook:  { minTier: "pro",     label: "Webhook integrations", link: "Pro" },
  team:     { minTier: "team",    label: "Team management", link: "Team" },
  api:      { minTier: "team",    label: "API access", link: "Team" },
  analytics:{ minTier: "team",    label: "Analytics", link: "Team" },
  custom:   { minTier: "team",    label: "Custom rules", link: "Team" },
  compliance:{minTier: "team",    label: "Compliance reports", link: "Team" },
  sso:      { minTier: "enterprise", label: "SSO/SAML", link: "Enterprise" },
  secrets:  { minTier: "enterprise", label: "Secrets scanning", link: "Enterprise" },
  deploy:   { minTier: "enterprise", label: "Self-hosted deploy", link: "Enterprise" },
  whitelabel:{minTier: "enterprise", label: "White-label", link: "Enterprise" },
  gpu:      { minTier: "enterprise", label: "GPU scanning", link: "Enterprise" },
  airgap:   { minTier: "enterprise", label: "Air-gapped mode", link: "Enterprise" },
};

const FOUNDER_IDS = new Set(["7815071893"]);
const FOUNDER_EMAILS = new Set(["ayman@teosegypt.com"]);

async function resolveUserTier(userId) {
  if (FOUNDER_IDS.has(String(userId))) {
    return { tier: "founder", credits: Infinity, order: TIER_ORDER.founder, sub: { tier: "founder" } };
  }
  try {
    const sub = await getUserTier(userId);
    if (sub.tier && sub.tier !== "free" && TIER_ORDER[sub.tier]) {
      const credits = sub.credits || 0;
      return { tier: sub.tier, credits, order: TIER_ORDER[sub.tier], sub };
    }
    const credits = await getCredits(userId);
    const tier = resolveTierFromCredits(credits);
    return { tier, credits, order: TIER_ORDER[tier], sub: null };
  } catch {
    const credits = await getCredits(userId);
    const tier = resolveTierFromCredits(credits);
    return { tier, credits, order: TIER_ORDER[tier], sub: null };
  }
}

function resolveTierFromCredits(credits) {
  if (credits >= 10000) return "team";
  if (credits >= 1000)  return "pro";
  return "free";
}

async function requireTier(ctx, feature) {
  const featureConfig = TIER_FEATURES[feature];
  if (!featureConfig) return { allowed: true };

  const userId = String(ctx.from.id);
  const user = await resolveUserTier(userId);

  if (user.order >= TIER_ORDER[featureConfig.minTier]) {
    return { allowed: true, tier: user.tier };
  }

  const minInfo = TIER_NAMES[featureConfig.minTier];
  const upgradeMsg =
`\u{1F512} ${featureConfig.label} requires ${minInfo.icon} ${featureConfig.link} or higher
${"\u2501".repeat(19)}
Your current tier: ${TIER_NAMES[user.tier].icon} ${TIER_NAMES[user.tier].name}
Required tier:     ${minInfo.icon} ${featureConfig.link}

Use /upgrade to unlock this feature.`;

  return { allowed: false, reason: upgradeMsg, requiredTier: featureConfig.minTier, currentTier: user.tier };
}

function formatExpires(sub) {
  if (!sub) return "—";
  if (sub.tier === "founder") return "Never";
  if (!sub.subscription_expires) return "—";
  try {
    return new Date(sub.subscription_expires).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return "—";
  }
}

module.exports = { requireTier, resolveUserTier, formatExpires, TIER_ORDER, TIER_NAMES, TIER_FEATURES };
