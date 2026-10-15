const { Markup } = require("telegraf");
const { planLinks } = require("../../utils/checkout");

const WEBSITE_URL       = "https://sentinel.teosegypt.com";

function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("\u{1F6E1}\uFE0F Scan Code", "SCAN_HUB")],
    [
      Markup.button.callback("\u{1F4B3} Plans",   "PLANS"),
      Markup.button.callback("\u{1F4CA} Credits", "CREDITS"),
    ],
    [
      Markup.button.callback("\u{1F680} Upgrade",  "UPGRADE"),
      Markup.button.callback("\u{1F6E1}\uFE0F Status",   "STATUS"),
    ],
    [Markup.button.callback("\u{1F3DB}\uFE0F Banking Audit", "SCAN_BANKING")],
    [Markup.button.callback("\u2753 Help", "HELP")],
    [Markup.button.url("\u{1F310} Open Website", WEBSITE_URL)],
    [Markup.button.url("\u{1F4CA} SOC Dashboard", "https://sentinel.teosegypt.com/dashboard.html"),
     Markup.button.url("\u{1F6E1}\uFE0F Command Center", "https://sentinel.teosegypt.com/")],
  ]);
}

function scanHubKeyboard(isFree) {
  const buttons = [
    [Markup.button.callback("\u{1F4DD} Code / Command  (1 cr)", "SCAN_CODE")],
  ];
  buttons.push(
    [Markup.button.callback("\u{1F7E1} Solana Program   (1 cr)", "SCAN_SOLANA"),
     Markup.button.callback("\u{1F535} Solidity Contract (1 cr)", "SCAN_EVM")],
    [Markup.button.callback("\u{1F3DB}\uFE0F Banking Audit   (1 cr)", "SCAN_BANKING")],
    [Markup.button.callback("\u{1F4A0} Token Scan        (5 cr)", "SCAN_TOKEN"),
     Markup.button.callback("\u{1F3C6} Due Diligence    (15 cr)", "SCAN_DILIGENCE"),
     Markup.button.callback("\u{1F4C4} Full Report      (20 cr)", "SCAN_FULL_REPORT")],
  );
  if (!isFree) {
    buttons.push(
      [Markup.button.callback("\u{1F4E6} Dependencies    (1 cr)", "SCAN_DEPS")],
      [Markup.button.callback("\u{2699}\uFE0F CI/CD Audit     (1 cr)", "SCAN_CI")],
      [Markup.button.callback("\u{1F419} GitHub Repo    (15 cr)", "SCAN_GITHUB")],
      [Markup.button.callback("\u{1F4C4} PDF Report      (2 cr)", "SCAN_REPORT")],
    );
  }
  return Markup.inlineKeyboard(buttons);
}

function upgradeMenu(userId) {
  const L = planLinks(userId);
  return Markup.inlineKeyboard([
    [Markup.button.url("\u{1F7E2} Pro \u2014 $69/mo",     L.proMonthly),
     Markup.button.url("\u{1F7E2} $690/yr",               L.proAnnual)],
    [Markup.button.url("\u{1F9FF} Team \u2014 $199/mo",   L.teamMonthly),
     Markup.button.url("\u{1F9FF} $1,990/yr",             L.teamAnnual)],
    [Markup.button.callback("\u{1F451} Enterprise \u2014 Contact Sales", "ENTERPRISE")],
    [Markup.button.url("\u{1F310} Open Dashboard", WEBSITE_URL)],
    [Markup.button.callback("\u{1F4CA} My Credits", "CREDITS")],
  ]);
}

function plansMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("\u{1F48E} Upgrade",    "UPGRADE")],
    [Markup.button.callback("\u{1F4CA} My Credits", "CREDITS")],
  ]);
}

function creditsMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("\u{1F48E} Upgrade Plan", "UPGRADE")],
  ]);
}

module.exports = { mainMenu, scanHubKeyboard, upgradeMenu, plansMenu, creditsMenu };
