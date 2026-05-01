"use client";

import { useState, useEffect } from "react";

const TELEGRAM_BOT_URL = "https://t.me/teoslinker_bot";
const TELEGRAM_GROUP_URL = "https://t.me/Elmahrosapi";
const PRICING_ANCHOR = "#pricing";

export default function SentinelShieldLanding() {
const [scanInput, setScanInput] = useState("rm -rf /");
const [verdict, setVerdict] = useState<"BLOCK" | "WARN" | "ALLOW">("BLOCK");
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
const handleScroll = () => setScrolled(window.scrollY > 40);
window.addEventListener("scroll", handleScroll);
return () => window.removeEventListener("scroll", handleScroll);
}, []);

const simulateScan = (input: string) => {
const lower = input.toLowerCase();
const blockPatterns = [
"rm -rf", "rm -r /", "drop table", "drop database",
"format c:", "del /f /s /q", ":(){:|:&};:", "chmod 777 /",
"eval(", "exec(", "> /dev/sda", "dd if=/dev/zero",
];
const warnPatterns = [
"curl", "wget", "bash <", "pip install", "npm install",
"sudo", "chmod", "base64", "subprocess", "os.system",
];
if (blockPatterns.some((p) => lower.includes(p))) return "BLOCK";
if (warnPatterns.some((p) => lower.includes(p))) return "WARN";
return "ALLOW";
};

const handleScan = () => {
const result = simulateScan(scanInput);
setVerdict(result);
};

const verdictConfig = {
BLOCK: {
color: "#ef4444",
bg: "rgba(239,68,68,0.1)",
border: "rgba(239,68,68,0.3)",
rule: "R01.DESTRUCTIVE_SHELL",
score: "100/100",
glyph: "✕",
},
WARN: {
color: "#f59e0b",
bg: "rgba(245,158,11,0.1)",
border: "rgba(245,158,11,0.3)",
rule: "R12.NETWORK_FETCH",
score: "45/100",
glyph: "⚠",
},
ALLOW: {
color: "#22c55e",
bg: "rgba(34,197,94,0.1)",
border: "rgba(34,197,94,0.3)",
rule: "PASS",
score: "0/100",
glyph: "✓",
},
};

const vc = verdictConfig[verdict];

return (
<div
style={{
background: "#080c12",
color: "#e2e8f0",
fontFamily: "'DM Sans', 'Inter', sans-serif",
minHeight: "100vh",
overflowX: "hidden",
}}
>
{/* Google Fonts */}
{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body { background: #080c12; }

    ::selection { background: rgba(251,191,36,0.25); }

    .nav-link {
      color: #94a3b8;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }
    .nav-link:hover { color: #fbbf24; }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #fbbf24;
      color: #0a0d13;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.01em;
    }
    .btn-primary:hover {
      background: #f59e0b;
      transform: translateY(-1px);
    }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      color: #cbd5e1;
      padding: 12px 24px;
      font-weight: 500;
      text-decoration: none;
      border: 1px solid rgba(148,163,184,0.2);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-ghost:hover {
      border-color: rgba(251,191,36,0.4);
      color: #fbbf24;
      background: rgba(251,191,36,0.05);
    }

    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 24px;
      transition: border-color 0.2s, background 0.2s;
    }
    .card:hover {
      border-color: rgba(251,191,36,0.2);
      background: rgba(255,255,255,0.05);
    }

    .proof-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 40px;
      font-size: 13px;
      color: #94a3b8;
      white-space: nowrap;
    }
    .proof-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
      box-shadow: 0 0 6px rgba(34,197,94,0.6);
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .verdict-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      font-weight: 500;
      padding: 3px 10px;
      border-radius: 4px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(251,191,36,0.1);
      border: 1px solid rgba(251,191,36,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: #fbbf24;
      flex-shrink: 0;
    }

    .price-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      transition: all 0.2s;
    }
    .price-card:hover {
      border-color: rgba(251,191,36,0.2);
    }
    .price-card.featured {
      background: rgba(251,191,36,0.04);
      border-color: rgba(251,191,36,0.3);
    }

    .price-feature {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .price-check {
      color: #22c55e;
      flex-shrink: 0;
      margin-top: 1px;
      font-size: 12px;
    }

    .roadmap-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .roadmap-item:last-child { border-bottom: none; }

    .scan-input {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px 16px;
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      color: #e2e8f0;
      width: 100%;
      outline: none;
      transition: border-color 0.2s;
    }
    .scan-input:focus {
      border-color: rgba(251,191,36,0.4);
    }
    .scan-input::placeholder { color: #475569; }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #fbbf24;
      margin-bottom: 12px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    @media (max-width: 900px) {
      .grid-4 { grid-template-columns: repeat(2, 1fr); }
      .grid-3 { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
      .proof-strip { flex-wrap: wrap; justify-content: center; }
      .hero-ctas { flex-direction: column; align-items: flex-start; }
      .pricing-grid { grid-template-columns: 1fr !important; }
    }

    .hero-gradient {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 500px;
      background: radial-gradient(ellipse at center top, rgba(251,191,36,0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin: 80px 0;
    }

    .mono { font-family: 'DM Mono', monospace; }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .tag-amber { background: rgba(251,191,36,0.1); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
    .tag-blue { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
    .tag-green { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
  `}</style>

  {/* NAV */}
  <nav
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: "0 24px",
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: scrolled ? "rgba(8,12,18,0.95)" : "transparent",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      transition: "all 0.3s",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: "linear-gradient(135deg, #fbbf24, #d97706)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        ⬡
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>
        TEOS Sentinel Shield
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <a href="#features" className="nav-link">Features</a>
      <a href="#pricing" className="nav-link">Pricing</a>
      <a href="#roadmap" className="nav-link">Roadmap</a>
      <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
        Start Free
      </a>
    </div>
  </nav>

  {/* HERO */}
  <section
    style={{
      position: "relative",
      padding: "160px 24px 100px",
      maxWidth: 1100,
      margin: "0 auto",
      textAlign: "center",
    }}
  >
    <div className="hero-gradient" />

    <div style={{ marginBottom: 20 }}>
      <span className="tag tag-amber">v2.0 Stable · 37 Tests Passing</span>
    </div>

    <h1
      style={{
        fontSize: "clamp(38px, 6vw, 68px)",
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        color: "#f8fafc",
        marginBottom: 24,
        maxWidth: 760,
        margin: "0 auto 24px",
      }}
    >
      Pre-Execution Security<br />
      <span style={{ color: "#fbbf24" }}>Guardrails</span> for Autonomous Systems
    </h1>

    <p
      style={{
        fontSize: 18,
        color: "#64748b",
        lineHeight: 1.7,
        maxWidth: 560,
        margin: "0 auto 12px",
      }}
    >
      TEOS Sentinel Shield validates AI-generated code, shell commands, and CI/CD workflows
      before they run — returning structured verdicts your agents can act on.
    </p>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: 40,
        fontSize: 14,
        color: "#475569",
        fontFamily: "DM Mono, monospace",
      }}
    >
      <span>Generate</span>
      <span style={{ color: "#fbbf24" }}>→</span>
      <span>Validate</span>
      <span style={{ color: "#fbbf24" }}>→</span>
      <span>Execute</span>
    </div>

    <div
      className="hero-ctas"
      style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
    >
      <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
        Start Free on Telegram
      </a>
      <a href={TELEGRAM_GROUP_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost">
        Join Community
      </a>
    </div>
  </section>

  {/* PROOF STRIP */}
  <section style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
    <div
      className="proof-strip"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {[
        { label: "Telegram Bot Live", dot: true },
        { label: "25 Rule Checks" },
        { label: "Dependency Scanner" },
        { label: "CI/CD Scanner" },
        { label: "37 Tests Passing", dot: true },
        { label: "Engine v2 Stable", dot: true },
      ].map((item, i) => (
        <div key={i} className="proof-item">
          {item.dot && <span className="proof-dot" />}
          {item.label}
        </div>
      ))}
    </div>
  </section>

  <hr className="divider" style={{ maxWidth: 1100, margin: "0 auto 80px" }} />

  {/* PROBLEM */}
  <section style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
    <div className="section-label" style={{ textAlign: "center" }}>The Problem</div>
    <h2
      style={{
        fontSize: "clamp(28px, 4vw, 42px)",
        fontWeight: 600,
        textAlign: "center",
        color: "#f1f5f9",
        marginBottom: 48,
        letterSpacing: "-0.015em",
        maxWidth: 680,
        margin: "0 auto 48px",
      }}
    >
      AI agents generate commands faster than humans can review them
    </h2>

    <div className="grid-3" style={{ maxWidth: 900, margin: "0 auto" }}>
      {[
        {
          icon: "⚡",
          title: "Shell command risks",
          body: "Destructive shell commands like rm -rf, format, or DD operations can be generated and queued for execution before anyone notices.",
        },
        {
          icon: "🔑",
          title: "Secret leakage",
          body: "API keys, tokens, and credentials can leak through environment variable exposure, base64 encoding tricks, or log output.",
        },
        {
          icon: "📦",
          title: "Dependency supply chain",
          body: "AI-suggested packages may introduce vulnerable or malicious dependencies. Pre-install validation catches risks before they reach production.",
        },
      ].map((item, i) => (
        <div key={i} className="card">
          <div style={{ fontSize: 24, marginBottom: 16 }}>{item.icon}</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 10 }}>
            {item.title}
          </h3>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{item.body}</p>
        </div>
      ))}
    </div>
  </section>

  <hr className="divider" style={{ maxWidth: 1100, margin: "0 auto 80px" }} />

  {/* HOW IT WORKS */}
  <section style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
    <div className="section-label" style={{ textAlign: "center" }}>How It Works</div>
    <h2
      style={{
        fontSize: "clamp(26px, 4vw, 38px)",
        fontWeight: 600,
        textAlign: "center",
        color: "#f1f5f9",
        marginBottom: 56,
        letterSpacing: "-0.015em",
      }}
    >
      Validate before execution, not after
    </h2>

    <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 4 }}>
      {[
        {
          n: "01",
          title: "Generate",
          body: "Your AI agent generates a command, code snippet, or CI/CD workflow step.",
          tag: "AI Output",
          tagClass: "tag-blue",
        },
        {
          n: "02",
          title: "Send to Sentinel",
          body: "The output is forwarded to Sentinel via Telegram bot (/scan, /deps, /ci) or API call. No backend changes required.",
          tag: "Validation Request",
          tagClass: "tag-amber",
        },
        {
          n: "03",
          title: "Rule engine evaluates",
          body: "25 named rules check against destructive patterns, eval/exec abuse, secret leakage, risky packages, and unsafe CI permissions.",
          tag: "25 Rules · Real-time",
          tagClass: "tag-amber",
        },
        {
          n: "04",
          title: "Receive verdict",
          body: "ALLOW, WARN, or BLOCK — with the triggering rule ID and risk score. Structured output your agent can act on.",
          tag: "ALLOW / WARN / BLOCK",
          tagClass: "tag-green",
        },
      ].map((step, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 24,
            padding: "24px 0",
            borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}
        >
          <div className="step-num">{step.n}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>{step.title}</h3>
              <span className={`tag ${step.tagClass}`}>{step.tag}</span>
            </div>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{step.body}</p>
          </div>
        </div>
      ))}
    </div>
  </section>

  <hr className="divider" style={{ maxWidth: 1100, margin: "0 auto 80px" }} />

  {/* LIVE DEMO */}
  <section style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
    <div className="section-label" style={{ textAlign: "center" }}>Interactive Preview</div>
    <h2
      style={{
        fontSize: "clamp(24px, 4vw, 36px)",
        fontWeight: 600,
        textAlign: "center",
        color: "#f1f5f9",
        marginBottom: 16,
        letterSpacing: "-0.015em",
      }}
    >
      Try the rule engine
    </h2>
    <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginBottom: 40 }}>
      Example scoring preview — real bot verdicts may vary by rule context.
    </p>

    <div
      style={{
        maxWidth: 620,
        margin: "0 auto",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 28,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 8, fontFamily: "DM Mono, monospace" }}>
          INPUT
        </label>
        <input
          className="scan-input"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          placeholder="Enter a shell command or code snippet..."
        />
      </div>
      <button className="btn-primary" onClick={handleScan} style={{ width: "100%", justifyContent: "center" }}>
        Scan
      </button>

      {/* Verdict output */}
      <div
        style={{
          marginTop: 20,
          padding: 20,
          background: vc.bg,
          border: `1px solid ${vc.border}`,
          borderRadius: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: vc.color,
              fontFamily: "DM Mono, monospace",
            }}
          >
            {vc.glyph}
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: vc.color,
              fontFamily: "DM Mono, monospace",
              letterSpacing: "0.05em",
            }}
          >
            {verdict}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 4, fontFamily: "DM Mono, monospace" }}>RULE</div>
            <div style={{ fontSize: 13, color: "#94a3b8", fontFamily: "DM Mono, monospace" }}>{vc.rule}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 4, fontFamily: "DM Mono, monospace" }}>RISK SCORE</div>
            <div style={{ fontSize: 13, color: "#94a3b8", fontFamily: "DM Mono, monospace" }}>{vc.score}</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <hr className="divider" style={{ maxWidth: 1100, margin: "0 auto 80px" }} />

  {/* FEATURES */}
  <section id="features" style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
    <div className="section-label" style={{ textAlign: "center" }}>Features</div>
    <h2
      style={{
        fontSize: "clamp(24px, 4vw, 36px)",
        fontWeight: 600,
        textAlign: "center",
        color: "#f1f5f9",
        marginBottom: 48,
        letterSpacing: "-0.015em",
      }}
    >
      Everything you need to validate AI-generated actions
    </h2>

    <div className="grid-3">
      {[
        {
          icon: "🛡",
          title: "Code Risk Scan",
          body: "Detects destructive shell commands, eval/exec abuse, command injection, subprocess misuse, chmod issues, secret leakage, and base64 execution patterns.",
          badge: "Free · Starter · Builder · Pro",
        },
        {
          icon: "📦",
          title: "Dependency Scanner",
          body: "Audits package.json for risky dependencies and unsafe install patterns before anything touches your environment.",
          badge: "Builder · Pro",
        },
        {
          icon: "⚙️",
          title: "CI/CD Scanner",
          body: "Scans GitHub Actions workflows for dangerous permissions, unsafe curl/bash patterns, and enterprise-risk configurations.",
          badge: "Pro · Enterprise",
        },
        {
          icon: "✈️",
          title: "Telegram Gateway",
          body: "Full access via @teoslinker_bot. Commands: /scan, /deps, /ci, /status, /upgrade, /credits. No SDK integration required.",
          badge: "All Plans",
        },
        {
          icon: "🔑",
          title: "Credits & Payments",
          body: "Scan credits are tracked per user. Upgrade tiers unlock higher limits and advanced scanners. Managed via Telegram.",
          badge: "All Plans",
        },
        {
          icon: "📋",
          title: "Audit-Ready Verdicts",
          body: "Every scan returns a structured result: verdict, rule ID, and risk score. Logs are available for enterprise compliance workflows.",
          badge: "Pro · Enterprise",
        },
      ].map((f, i) => (
        <div key={i} className="card">
          <div style={{ fontSize: 22, marginBottom: 14 }}>{f.icon}</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 10 }}>
            {f.title}
          </h3>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, marginBottom: 16 }}>
            {f.body}
          </p>
          <span
            style={{
              fontSize: 11,
              color: "#475569",
              fontFamily: "DM Mono, monospace",
              letterSpacing: "0.02em",
            }}
          >
            {f.badge}
          </span>
        </div>
      ))}
    </div>
  </section>

  <hr className="divider" style={{ maxWidth: 1100, margin: "0 auto 80px" }} />

  {/* PRICING */}
  <section id="pricing" style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
    <div className="section-label" style={{ textAlign: "center" }}>Pricing</div>
    <h2
      style={{
        fontSize: "clamp(24px, 4vw, 36px)",
        fontWeight: 600,
        textAlign: "center",
        color: "#f1f5f9",
        marginBottom: 12,
        letterSpacing: "-0.015em",
      }}
    >
      Start free, scale when ready
    </h2>
    <p style={{ textAlign: "center", color: "#64748b", fontSize: 15, marginBottom: 48 }}>
      5 free scans with no credit card required. Upgrade through the Telegram bot.
    </p>

    <div
      className="pricing-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 14,
        alignItems: "start",
      }}
    >
      {/* FREE */}
      <div className="price-card">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Free</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>$0</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>forever</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["5 scans total", "Telegram access", "Code risk scan"].map((f, i) => (
            <div key={i} className="price-feature">
              <span className="price-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ textAlign: "center", justifyContent: "center", fontSize: 13 }}>
          Start Free
        </a>
      </div>

      {/* STARTER */}
      <div className="price-card">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Starter</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>$9</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>/month</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["50 scans/month", "Code scan", "Basic verdicts"].map((f, i) => (
            <div key={i} className="price-feature">
              <span className="price-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <a href="https://dodo.pe/tts" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ textAlign: "center", justifyContent: "center", fontSize: 13 }}>
          /upgrade
        </a>
      </div>

      {/* BUILDER */}
      <div className="price-card featured">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>Builder</span>
            <span
              style={{
                fontSize: 10,
                background: "rgba(251,191,36,0.15)",
                color: "#fbbf24",
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              POPULAR
            </span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>$49</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>/month</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["500 scans/month", "Code scan", "Dependency scan", "CI/CD scan"].map((f, i) => (
            <div key={i} className="price-feature">
              <span className="price-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <a href="https://dodo.pe/tts2" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textAlign: "center", justifyContent: "center", fontSize: 13 }}>
          /upgrade
        </a>
      </div>

      {/* PRO */}
      <div className="price-card">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Pro</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>$99</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>/month</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "1,000 scans/month",
            "All scanners",
            "Priority support",
            "Team use",
            "Audit logs",
          ].map((f, i) => (
            <div key={i} className="price-feature">
              <span className="price-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <a href="https://dodo.pe/teos-pro" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ textAlign: "center", justifyContent: "center", fontSize: 13 }}>
          /upgrade
        </a>
      </div>

      {/* ENTERPRISE */}
      <div className="price-card">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Enterprise</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1.3 }}>Custom</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>contact us</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Unlimited scans",
            "Self-hosted deployment",
            "Custom onboarding",
            "Dedicated support",
            "SLA guarantee",
          ].map((f, i) => (
            <div key={i} className="price-feature">
              <span className="price-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <a href={`mailto:ayman@teosegypt.com?subject=Sentinel Shield Enterprise`} className="btn-ghost" style={{ textAlign: "center", justifyContent: "center", fontSize: 13 }}>
          Contact
        </a>
      </div>
    </div>
  </section>

  <hr className="divider" style={{ maxWidth: 1100, margin: "0 auto 80px" }} />

  {/* ROADMAP */}
  <section id="roadmap" style={{ padding: "0 24px 80px", maxWidth: 700, margin: "0 auto" }}>
    <div className="section-label" style={{ textAlign: "center" }}>Roadmap</div>
    <h2
      style={{
        fontSize: "clamp(24px, 4vw, 36px)",
        fontWeight: 600,
        textAlign: "center",
        color: "#f1f5f9",
        marginBottom: 48,
        letterSpacing: "-0.015em",
      }}
    >
      What's coming in v2.1
    </h2>

    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "8px 28px",
      }}
    >
      {[
        { label: "AST precision improvements", status: "In Progress" },
        { label: "OSV vulnerability lookup", status: "Planned" },
        { label: "GitHub Actions integration example", status: "Planned" },
        { label: "Enterprise onboarding flow", status: "Planned" },
        { label: "VPS / self-host hardening guide", status: "Planned" },
        { label: "First 20-user acquisition sprint", status: "Active" },
      ].map((item, i) => (
        <div key={i} className="roadmap-item">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: item.status === "In Progress" || item.status === "Active" ? "#fbbf24" : "#334155",
              flexShrink: 0,
              marginTop: 6,
            }}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, color: "#cbd5e1" }}>{item.label}</span>
          </div>
          <span
            style={{
              fontSize: 11,
              color: item.status === "In Progress" || item.status === "Active" ? "#fbbf24" : "#475569",
              fontFamily: "DM Mono, monospace",
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {item.status}
          </span>
        </div>
      ))}
    </div>
  </section>

  <hr className="divider" style={{ maxWidth: 1100, margin: "0 auto 80px" }} />

  {/* FINAL CTA */}
  <section
    style={{
      padding: "80px 24px 120px",
      maxWidth: 1100,
      margin: "0 auto",
      textAlign: "center",
    }}
  >
    <div
      style={{
        maxWidth: 580,
        margin: "0 auto",
        padding: "60px 40px",
        background: "rgba(251,191,36,0.04)",
        border: "1px solid rgba(251,191,36,0.15)",
        borderRadius: 20,
      }}
    >
      <h2
        style={{
          fontSize: "clamp(26px, 4vw, 38px)",
          fontWeight: 600,
          color: "#f1f5f9",
          marginBottom: 16,
          letterSpacing: "-0.015em",
        }}
      >
        Start with 5 free scans
      </h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 36 }}>
        Launch through Telegram. No account setup. No credit card.
        Upgrade when your workflow needs more.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
          Open @teoslinker_bot
        </a>
        <a href={PRICING_ANCHOR} className="btn-ghost">
          See all plans
        </a>
      </div>
    </div>
  </section>

  {/* FOOTER */}
  <footer
    style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "32px 24px",
      maxWidth: 1100,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 16,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: "linear-gradient(135deg, #fbbf24, #d97706)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
        }}
      >
        ⬡
      </div>
      <span style={{ fontSize: 14, color: "#475569" }}>
        TEOS Sentinel Shield · Elmahrosa International · Alexandria, EG
      </span>
    </div>
    <div style={{ display: "flex", gap: 24 }}>
      <a href={TELEGRAM_GROUP_URL} target="_blank" rel="noopener noreferrer" className="nav-link">Telegram</a>
      <a href="https://x.com/king_teos" target="_blank" rel="noopener noreferrer" className="nav-link">X</a>
      <a href={`mailto:ayman@teosegypt.com`} className="nav-link">Contact</a>
    </div>
  </footer>
</div>
);
}
