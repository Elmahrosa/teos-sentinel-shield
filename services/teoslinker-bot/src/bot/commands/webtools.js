"use strict";

// /webtools — Website security scanner.
//
// index.js referenced this module ("Website security scanner" in /help) but the file
// was never committed, so the bot crashed on boot with MODULE_NOT_FOUND. This is the
// implementation that matches the declared purpose: fetch a public URL and score its
// transport + security-header posture.
//
// SSRF hardening: only http/https, private/loopback/link-local/metadata hosts are
// rejected, and every redirect hop is re-validated (hostname + resolved IP).

const dns = require("dns").promises;
const net = require("net");

const { consumeCredit, getCredits, logAudit } = require("../../services/activation.service");
const { logScanToRedis } = require("../../services/redis.service");
const { resolveUserTier } = require("../../lib/billing/tier-guard");
const { D } = require("../../utils/formatting");

let logger;
try {
  logger = require("../../../logger.cjs").logger;
} catch {
  logger = console;
}

const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const MAX_URL_LENGTH = 2048;

const HEADER_CHECKS = [
  { key: "strict-transport-security", label: "HSTS", weight: 20, hint: "force HTTPS" },
  { key: "content-security-policy",   label: "CSP",  weight: 20, hint: "mitigate XSS" },
  { key: "x-content-type-options",    label: "X-Content-Type-Options", weight: 10, expect: "nosniff" },
  { key: "x-frame-options",           label: "X-Frame-Options", weight: 10, hint: "anti-clickjacking" },
  { key: "referrer-policy",           label: "Referrer-Policy", weight: 10 },
  { key: "permissions-policy",        label: "Permissions-Policy", weight: 10 },
];

function isPrivateIp(ip) {
  if (!ip) return true;
  if (net.isIPv4(ip)) {
    const p = ip.split(".").map(Number);
    if (p[0] === 0 || p[0] === 10 || p[0] === 127) return true;
    if (p[0] === 169 && p[1] === 254) return true;      // link-local / cloud metadata
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // CGNAT
    if (p[0] >= 224) return true; // multicast / reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const low = ip.toLowerCase();
    if (low === "::1" || low === "::") return true;
    if (low.startsWith("fe80") || low.startsWith("fc") || low.startsWith("fd")) return true;
    if (low.startsWith("::ffff:")) return isPrivateIp(low.replace("::ffff:", ""));
    return false;
  }
  return true;
}

function isBlockedHostname(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".home.arpa")) return true;
  if (h.endsWith(".onion")) return true;
  if (net.isIP(h)) return isPrivateIp(h);
  if (!h.includes(".")) return true; // require a fully-qualified domain name
  return false;
}

function normalizeUrl(input) {
  let raw = String(input || "").trim();
  if (!raw || raw.length > MAX_URL_LENGTH) return null;
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (isBlockedHostname(parsed.hostname)) return null;
  parsed.hash = "";
  return parsed;
}

async function resolveIsPublic(hostname) {
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records.length) return false;
    return records.every((r) => !isPrivateIp(r.address));
  } catch {
    return false;
  }
}

async function fetchOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "TEOS-Sentinel-WebTools/1.0 (+https://teosegypt.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithGuards(startUrl) {
  let current = startUrl;
  let redirects = 0;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const host = new URL(current).hostname;
    if (isBlockedHostname(host) || !(await resolveIsPublic(host))) {
      throw new Error("blocked-host");
    }
    const res = await fetchOnce(current);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      try { res.body?.cancel(); } catch {}
      if (!loc) return { res, finalUrl: current, redirects };
      const next = new URL(loc, current);
      if (next.protocol !== "https:" && next.protocol !== "http:") throw new Error("blocked-redirect");
      if (isBlockedHostname(next.hostname)) throw new Error("blocked-host");
      current = next.href;
      redirects++;
      continue;
    }
    try { res.body?.cancel(); } catch {}
    return { res, finalUrl: current, redirects };
  }
  throw new Error("too-many-redirects");
}

function analyzeHeaders(headers, finalUrl) {
  const findings = [];
  let score = 100;
  const get = (k) => String(headers.get(k) || "").trim();

  for (const c of HEADER_CHECKS) {
    const val = get(c.key);
    if (!val) {
      score -= c.weight;
      findings.push({ level: "warn", text: `Missing ${c.label}${c.hint ? ` (${c.hint})` : ""}` });
    } else if (c.expect && !val.toLowerCase().includes(c.expect)) {
      score -= Math.round(c.weight / 2);
      findings.push({ level: "warn", text: `${c.label} present but not "${c.expect}"` });
    } else {
      findings.push({ level: "ok", text: `${c.label} configured` });
    }
  }

  let proto = "";
  try { proto = new URL(finalUrl).protocol; } catch {}
  if (proto !== "https:") {
    score -= 15;
    findings.push({ level: "warn", text: "Served over plain HTTP (no TLS)" });
  }

  const server = get("server");
  if (server) {
    score -= 5;
    findings.push({ level: "info", text: `Server header discloses "${server}"` });
  }

  const setCookie = headers.get("set-cookie") || "";
  if (setCookie && !/;\s*secure/i.test(setCookie)) {
    score -= 10;
    findings.push({ level: "warn", text: "Cookies set without Secure flag" });
  }

  score = Math.max(0, Math.min(100, score));
  const verdict = score < 50 ? "BLOCK" : score < 80 ? "WARN" : "ALLOW";
  return { score, verdict, findings };
}

function formatReport({ url, status, verdict, score, findings, redirects, creditsLeft }) {
  const icon = verdict === "BLOCK" ? "\u{1F6AB}" : verdict === "WARN" ? "\u26A0\uFE0F" : "\u2705";
  const lines = findings
    .slice(0, 12)
    .map((f) => `${f.level === "ok" ? "\u2713" : f.level === "warn" ? "\u2717" : "\u2022"} ${f.text}`)
    .join("\n");
  const hops = redirects ? ` (${redirects} redirect${redirects > 1 ? "s" : ""})` : "";
  return `\u{1F6E1}\uFE0F ${icon} Website Security Scan
${D}
Target  : ${url}
Status  : HTTP ${status}${hops}
Verdict : ${verdict}
Score   : ${score}/100
${D}
${lines}
${D}
Credits remaining: ${creditsLeft}`;
}

async function webtoolsCommand(ctx) {
  const userId = String(ctx.from.id);
  const target = String(ctx.message?.text || "").replace(/^\/webtools(@\w+)?\s*/i, "").trim();

  if (!target) {
    return ctx.reply(
`\u{1F6E1}\uFE0F TEOS Sentinel \u2014 Website Security Scanner
${D}
Usage: /webtools <url>
Example: /webtools https://example.com

Checks TLS and security headers
(HSTS, CSP, X-Frame-Options, cookies).`
    );
  }

  const parsed = normalizeUrl(target);
  if (!parsed) {
    return ctx.reply("\u274C Invalid or disallowed URL. Provide a public https:// address.");
  }

  const user = await resolveUserTier(userId);
  if (user.credits <= 0 && user.tier !== "founder") {
    return ctx.reply(`\u274C No credits remaining\n${D}\nUse /upgrade to continue scanning.`);
  }

  try {
    await ctx.reply("\u{1F50D} Scanning website headers...");
    const { res, finalUrl, redirects } = await fetchWithGuards(parsed.href);
    const { score, verdict, findings } = analyzeHeaders(res.headers, finalUrl);
    const severity = verdict === "BLOCK" ? "critical" : verdict === "WARN" ? "medium" : "none";

    await consumeCredit(userId, 1);
    const creditsLeft = user.tier === "founder" ? "∞" : await getCredits(userId);

    await logAudit(userId, "webtools", parsed.href, verdict, score, 1, creditsLeft);
    await logScanToRedis({
      verdict, score,
      rule: "WEB_HEADERS",
      ruleId: "WEBTOOLS",
      severity,
      command: parsed.href.slice(0, 500),
    }, ctx).catch(() => {});

    return ctx.reply(formatReport({ url: finalUrl, status: res.status, verdict, score, findings, redirects, creditsLeft }));
  } catch (err) {
    const reason = err?.name === "AbortError"
      ? "request timed out"
      : err?.message === "blocked-host"
        ? "target resolves to a private/internal address"
        : err?.message === "too-many-redirects"
          ? "too many redirects"
          : "site unreachable";
    logger.warn({ err: err?.message, host: parsed.hostname, userId }, "webtools scan failed");
    return ctx.reply(`\u274C Could not scan ${parsed.hostname}: ${reason}. No credit consumed.`);
  }
}

module.exports = {
  webtoolsCommand,
  normalizeUrl,
  isBlockedHostname,
  isPrivateIp,
  analyzeHeaders,
};
