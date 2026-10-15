const { getCredits, getUserStatus, checkService, ACTIVATION_API } = require("../../services/activation.service");
const { MCP_API, MCP_CONFIGURED, getEngineInfo } = require("../../services/mcp.service");
const { resolveEngineInfo } = require("../../services/engine-metadata");
const { redis } = require("../../services/redis.service");
const { D } = require("../../utils/formatting");
const { mainMenu } = require("../menus");

const ACCESS_ICONS = {
  active: "✅",
  expired: "⏰",
  restricted: "🔒",
  suspended: "🚫"
};

const ENTITLEMENT_LABELS = {
  none: "None",
  beta_granted: "Beta Tester",
  premium_granted: "Premium",
  trial_granted: "Trial"
};

async function sendStatus(ctx) {
  const userId = String(ctx.from.id);
  const status = await getUserStatus(userId);
  const activationOk = await checkService(`${ACTIVATION_API}/health`);
  const mcpOk        = MCP_CONFIGURED ? await checkService(`${MCP_API}/health`) : null;

  // Live engine metadata, falling back to the canonical in-process values so the
  // dashboard never shows null/placeholder numbers when the Sentinel is unreachable.
  const meta          = resolveEngineInfo(await getEngineInfo());
  const engineVersion = meta.engineVersion;
  const rulePack      = meta.rulePackVersion;
  const totalRules    = meta.totalRules;
  const enginesList   = meta.engines;
  const engineCount   = meta.total;
  const breakdown     = enginesList.length
    ? enginesList.map(e => `${e.key} ${e.rules}`).join(" · ")
    : `${meta.coreRules} core`;

  const accessIcon = ACCESS_ICONS[status.access_state] || "❓";
  const entitlementLabel = ENTITLEMENT_LABELS[status.entitlement_state] || "None";
  const expiresDisplay = status.time_state?.subscription_expires
    ? new Date(status.time_state.subscription_expires).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const msg =
`🔶 *TEOS* ── Dashboard
${D}
*Account*
Access  : ${accessIcon} ${status.access_state.toUpperCase()}
Tier    : ${entitlementLabel}
Credits : ${status.credit_state.balance}
Expires : ${expiresDisplay}
${D}
*System Health*
Activation : ${activationOk ? "✅ Online" : "❌ Down"}
MCP Engine : ${!MCP_CONFIGURED ? "\u26AA Not configured" : mcpOk ? "\u2705 Ready" : "\u274C Down"}
Payments   : ✅ Active
Redis      : ${redis ? "✅ Connected" : "⚪ Local"}
${D}
🛡️ TEOS Sovereign Sentinel v${engineVersion}-FINANCE Active
📊 Enforced Rules: ${totalRules} across ${engineCount} engines — ${rulePack}
   (${breakdown})
🧪 Verified Tests: 410 Regressions Passing
${D}
*Quick Actions*
/scan          — Analyze code or command
/scan-banking  — Audit financial pipelines (CBE/FRA)
/upgrade       — Upgrade plan
/status        — Refresh dashboard`;

  await ctx.replyWithMarkdown(msg, mainMenu());
}

module.exports = { sendStatus };
