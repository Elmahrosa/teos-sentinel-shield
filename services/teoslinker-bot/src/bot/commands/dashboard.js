const { mainMenu } = require("../menus");
const { D } = require("../../utils/formatting");

const DASHBOARD_URL = process.env.DASHBOARD_URL || "https://sentinel.teosegypt.com/";

async function dashboardCommand(ctx) {
  await ctx.reply(
`\u{1F6E1}\uFE0F TEOS Sentinel Shield \u2014 Command Center
${D}
Web dashboard with live scan telemetry, audit trail, and real-time SOC view.

\u{1F517} ${DASHBOARD_URL}
${D}
Features:
\u2022 Live scan events (WebSocket)
\u2022 Audit trail with timestamps
 \u2022 258 detection rules
\u2022 PDF report export
\u2022 Transparency hub`,
    mainMenu()
  );
}

module.exports = { dashboardCommand };
