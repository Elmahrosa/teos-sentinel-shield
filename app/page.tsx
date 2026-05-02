"use client";

import { useState, useEffect } from "react";

const TELEGRAM_URL = "https://t.me/teoslinker_bot";
const TELEGRAM_GROUP_URL = "https://t.me/Elmahrosapi";
const GITHUB_URL = "https://github.com/Elmahrosa";
const CONTACT_EMAIL = "ayman@teosegypt.com";
const X_URL = "https://x.com/king_teos";
const PRICE_STARTER = "https://dodo.pe/tts";
const PRICE_BUILDER = "https://dodo.pe/tts2";
const PRICE_PRO = "https://dodo.pe/teos-pro";

type Verdict = "BLOCK" | "WARN" | "ALLOW";
type EmailState = "idle" | "submitting" | "done";

const BLOCK_PATTERNS = [
  "rm -rf", "rm -r /", "drop table", "drop database",
  "format c:", "del /f /s /q", ":(){:|:&};:", "chmod 777 /",
  "eval(", "exec(", "> /dev/sda", "dd if=/dev/zero", "mkfs", "shred",
];
const WARN_PATTERNS = [
  "curl", "wget", "bash <", "pip install", "npm install",
  "sudo", "chmod", "base64", "subprocess", "os.system", "fetch(",
];

function simulateScan(input: string): Verdict {
  const lower = input.toLowerCase();
  if (BLOCK_PATTERNS.some((p) => lower.includes(p))) return "BLOCK";
  if (WARN_PATTERNS.some((p) => lower.includes(p))) return "WARN";
  return "ALLOW";
}

const VERDICT_META = {
  BLOCK: {
    color: "#ef4444",
    dimColor: "rgba(239,68,68,0.10)",
    borderColor: "rgba(239,68,68,0.22)",
    rule: "R01.DESTRUCTIVE_SHELL",
    score: "100/100",
    description: "Execution blocked. Destructive pattern matched.",
  },
  WARN: {
    color: "#f59e0b",
    dimColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.22)",
    rule: "R12.NETWORK_FETCH",
    score: "45/100",
    description: "Review before executing. Network or install pattern detected.",
  },
  ALLOW: {
    color: "#22c55e",
    dimColor: "rgba(34,197,94,0.07)",
    borderColor: "rgba(34,197,94,0.18)",
    rule: "PASS",
    score: "0/100",
    description: "No risk patterns matched. Safe to execute.",
  },
};

export default function SentinelShieldLanding() {
  const [scanInput, setScanInput] = useState("rm -rf /");
  const [verdict, setVerdict] = useState<Verdict>("BLOCK");
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");

  const handleEmailSubmit = () => {
    if (!email || !email.includes("@")) return;
    setEmailState("submitting");
    setTimeout(() => setEmailState("done"), 900);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScan = () => setVerdict(simulateScan(scanInput));
  const vm = VERDICT_META[verdict];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #07090e;
          color: #c8d3e0;
          font-family: 'DM Sans', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        ::selection { background: rgba(251,191,36,0.18); }
        a { text-decoration: none; color: inherit; }

        .container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
        .section { padding: 88px 0; }
        .section-sm { padding: 56px 0; }
        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.05); }
        .mono { font-family: 'DM Mono', 'Courier New', monospace; }

        /* NAV */
        .nav-wrap {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          transition: background 0.3s, border-color 0.3s;
        }
        .nav-wrap.scrolled {
          background: rgba(7,9,14,0.94);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 15px; font-weight: 600; color: #f0f4f8;
          flex-shrink: 0;
        }
        .nav-logo-mark {
          width: 30px; height: 30px; border-radius: 7px;
          background: #fbbf24;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nav-links-desktop {
          display: flex; align-items: center; gap: 28px;
        }
        .nav-link { font-size: 13px; color: #7a8ea3; transition: color 0.2s; }
        .nav-link:hover { color: #fbbf24; }
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          background: #fbbf24; color: #07090e;
          font-size: 13px; font-weight: 600;
          padding: 9px 20px; border-radius: 7px;
          border: none; cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          white-space: nowrap;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .btn-primary:hover { background: #f59e0b; transform: translateY(-1px); }
        .btn-primary-lg {
          display: inline-flex; align-items: center; justify-content: center;
          background: #fbbf24; color: #07090e;
          font-size: 14px; font-weight: 600;
          padding: 13px 28px; border-radius: 8px;
          border: none; cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          white-space: nowrap;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .btn-primary-lg:hover { background: #f59e0b; transform: translateY(-1px); }
        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: #7a8ea3;
          font-size: 14px; font-weight: 500;
          padding: 13px 28px; border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.16);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          white-space: nowrap;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .btn-outline:hover {
          border-color: rgba(251,191,36,0.35);
          color: #fbbf24;
          background: rgba(251,191,36,0.04);
        }
        .btn-outline-sm {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: #7a8ea3;
          font-size: 13px; font-weight: 500;
          padding: 9px 18px; border-radius: 7px;
          border: 1px solid rgba(148,163,184,0.16);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          white-space: nowrap;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .btn-outline-sm:hover {
          border-color: rgba(251,191,36,0.35);
          color: #fbbf24;
          background: rgba(251,191,36,0.04);
        }

        /* Hide desktop nav on mobile */
        @media (max-width: 640px) {
          .nav-links-desktop { display: none !important; }
          .nav-wrap { padding: 0 20px; }
        }

        /* HERO */
        .hero-bg {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 900px; height: 500px;
          background: radial-gradient(ellipse 600px 280px at 50% 0%, rgba(251,191,36,0.05) 0%, transparent 75%);
          pointer-events: none;
        }
        .flow-strip {
          display: flex; align-items: center; gap: 10px;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 13px; color: #2d3f50;
          margin-bottom: 40px;
        }
        .flow-arrow { color: #d4921a; }

        /* LABEL */
        .section-label {
          display: inline-block;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #d4921a; margin-bottom: 14px;
        }

        /* PROOF */
        .proof-grid {
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
        }
        .proof-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px;
          font-size: 13px; color: #7a8ea3; white-space: nowrap;
        }
        .status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 5px rgba(34,197,94,0.45);
          animation: blink 2.4s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }

        /* CARDS */
        .card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 24px;
          transition: border-color 0.2s;
        }
        .card:hover { border-color: rgba(251,191,36,0.16); }
        .card-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: rgba(251,191,36,0.08);
          border: 1px solid rgba(251,191,36,0.16);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px; flex-shrink: 0;
        }

        /* GRIDS */
        .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        @media (max-width: 860px) { .grid-3 { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 760px) { .grid-4 { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 540px) { .grid-3,.grid-4 { grid-template-columns: 1fr; } }

        /* STEPS */
        .step-row {
          display: flex; gap: 20px; align-items: flex-start;
          padding: 22px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .step-row:last-child { border-bottom: none; }
        .step-num {
          width: 34px; height: 34px; border-radius: 8px;
          background: rgba(251,191,36,0.07);
          border: 1px solid rgba(251,191,36,0.16);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: #d4921a;
          font-family: 'DM Mono', monospace;
          flex-shrink: 0;
        }
        .tag {
          display: inline-flex; align-items: center;
          font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 4px;
        }
        .tag-amber { background: rgba(251,191,36,0.09); color: #c27d10; border: 1px solid rgba(251,191,36,0.16); }
        .tag-green { background: rgba(34,197,94,0.07); color: #15803d; border: 1px solid rgba(34,197,94,0.16); }
        .tag-blue  { background: rgba(96,165,250,0.07); color: #2563eb; border: 1px solid rgba(96,165,250,0.16); }

        /* DEMO */
        .demo-wrap {
          max-width: 600px; margin: 0 auto;
          background: rgba(255,255,255,0.018);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 28px;
        }
        .scan-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px; padding: 12px 16px;
          font-family: 'DM Mono', monospace;
          font-size: 13px; color: #dde5ef;
          outline: none; transition: border-color 0.2s;
        }
        .scan-input:focus { border-color: rgba(251,191,36,0.35); }
        .scan-input::placeholder { color: #2d3f50; }
        .scan-btn {
          width: 100%; margin-top: 12px;
          background: #fbbf24; color: #07090e;
          font-size: 14px; font-weight: 600;
          padding: 12px; border-radius: 8px;
          border: none; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          transition: background 0.2s;
        }
        .scan-btn:hover { background: #f59e0b; }
        .verdict-box { margin-top: 20px; padding: 20px; border-radius: 10px; }
        .verdict-label {
          font-family: 'DM Mono', monospace;
          font-size: 24px; font-weight: 500; letter-spacing: 0.06em;
          line-height: 1; margin-bottom: 16px;
        }
        .verdict-meta { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .vm-key {
          font-family: 'DM Mono', monospace;
          font-size: 10px; color: #2d3f50;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px;
        }
        .vm-val { font-family: 'DM Mono', monospace; font-size: 12px; color: #7a8ea3; }
        .disclaimer { font-size: 11px; color: #2d3f50; line-height: 1.6; font-style: italic; margin-top: 14px; }

        /* PRICING */
        .pricing-grid {
          display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; align-items: start;
        }
        @media (max-width: 960px) { .pricing-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 600px) { .pricing-grid { grid-template-columns: 1fr; } }
        .price-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 22px 18px;
          display: flex; flex-direction: column; gap: 18px;
          transition: border-color 0.2s;
        }
        .price-card:hover { border-color: rgba(251,191,36,0.16); }
        .price-card.featured { background: rgba(251,191,36,0.03); border-color: rgba(251,191,36,0.26); }
        .price-name { font-size: 11px; font-weight: 600; color: #7a8ea3; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
        .price-amount { font-size: 28px; font-weight: 700; color: #f0f4f8; letter-spacing: -0.02em; }
        .price-period { font-size: 12px; color: #2d3f50; margin-top: 2px; }
        .price-features { display: flex; flex-direction: column; gap: 9px; }
        .price-feat { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #5c7080; line-height: 1.5; }
        .feat-check { color: #22c55e; flex-shrink: 0; font-size: 11px; margin-top: 1px; }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        /* ROADMAP */
        .rm-list { max-width: 680px; margin: 0 auto; background: rgba(255,255,255,0.018); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 8px 28px; }
        .rm-item { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .rm-item:last-child { border-bottom: none; }
        .rm-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* FOOTER */
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; padding: 56px 0 36px; }
        @media (max-width: 700px) { .footer-grid { grid-template-columns: 1fr; gap: 28px; } }
        .footer-link { font-size: 13px; color: #2d3f50; transition: color 0.2s; display: block; margin-bottom: 9px; }
        .footer-link:hover { color: #d4921a; }
        .footer-col-label { font-size: 10px; font-weight: 600; color: #2d3f50; letter-spacing: 0.10em; text-transform: uppercase; margin-bottom: 16px; }

        /* CRED */
        .cred-val { font-size: 24px; font-weight: 600; color: #f0f4f8; letter-spacing: -0.01em; margin-bottom: 4px; }
        .cred-key { font-size: 12px; color: #3d5266; }
      `}</style>

      {/* --- NAV --- */}
      <nav className={`nav-wrap${scrolled ? " scrolled" : ""}`}>
        <a href="/" className="nav-logo">
          <span className="nav-logo-mark" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L12 4V10L7 13L2 10V4L7 1Z" fill="#07090e" stroke="#07090e" strokeWidth="0.5"/>
            </svg>
          </span>
          TEOS Sentinel Shield
        </a>

        {/* Desktop links */}
        <div className="nav-links-desktop">
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#roadmap" className="nav-link">Roadmap</a>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Start Free
          </a>
        </div>

        {/* Mobile: CTA only */}
        <div className="nav-mobile-cta">
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Start Free
          </a>
        </div>
      </nav>

      {/* --- HERO --- */}
      <section style={{ position: "relative", padding: "148px 0 80px", overflow: "hidden" }}>
        <div className="hero-bg" aria-hidden="true" />
        <div className="container" style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <span className="tag tag-amber">v2.0 Stable</span>
          </div>
          <h1
            style={{
              fontSize: "clamp(36px,6vw,60px)",
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: "-0.022em",
              color: "#f0f4f8",
              maxWidth: 720,
              margin: "0 auto 22px",
            }}
          >
            Pre-Execution Security{" "}
            <span style={{ color: "#fbbf24" }}>Guardrails</span>
            <br />for Autonomous Systems
          </h1>
          <p
            style={{
              fontSize: 16, color: "#4a6070", lineHeight: 1.72,
              maxWidth: 500, margin: "0 auto 28px",
            }}
          >
            For AI engineers and DevOps teams running agent pipelines —
            TEOS Sentinel Shield validates AI-generated commands, code, and CI workflows
            before execution, returning structured verdicts your agents can act on instantly.
          </p>
          <div className="flow-strip">
            <span>Generate</span>
            <span className="flow-arrow">&#8594;</span>
            <span>Validate</span>
            <span className="flow-arrow">&#8594;</span>
            <span>Execute</span>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn-primary-lg">
              Start Free on Telegram
            </a>
            <a href="#pricing" className="btn-outline">
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* --- PROOF STRIP --- */}
      <section className="section-sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="proof-grid">
            {[
              { label: "Telegram Bot — Online", live: true },
              { label: "MCP Engine — Online", live: true },
              { label: "Activation Service — Online", live: true },
              { label: "25 Rule Checks" },
              { label: "37 Tests Passing" },
              { label: "Engine v2 Stable" },
            ].map((item, i) => (
              <div key={i} className="proof-pill">
                {item.live && <span className="status-dot" aria-label="Online" />}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --- CREDIBILITY --- */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="section-label">Backend Status</span>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 600, letterSpacing: "-0.016em", color: "#f0f4f8" }}>
              Production-stable infrastructure
            </h2>
          </div>
          <div className="grid-4">
            {[
              { val: "25", key: "Named rules", live: false },
              { val: "37", key: "Tests passing", live: false },
              { val: "3", key: "Services online", live: true },
              { val: "v2.0", key: "Engine version", live: false },
            ].map((c, i) => (
              <div key={i} className="card" style={{ textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 6 }}>
                  <span className="cred-val">{c.val}</span>
                  {c.live && <span className="status-dot" aria-label="Live" />}
                </div>
                <div className="cred-key">{c.key}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --- PROBLEM --- */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="section-label">The Problem</span>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 600, letterSpacing: "-0.016em", color: "#f0f4f8", maxWidth: 580, margin: "0 auto" }}>
              AI agents generate commands faster than humans can review them
            </h2>
          </div>
          <div className="grid-3">
            {[
              {
                title: "Destructive shell commands",
                body: "Commands like rm -rf, format, and dd operations can be generated and queued for execution before anyone notices.",
                tag: "Rules R01 — R08",
              },
              {
                title: "Secret and credential exposure",
                body: "API keys, tokens, and credentials can surface through environment variable exposure, base64 encoding, or log output.",
                tag: "Rules R14 — R18",
              },
              {
                title: "Dependency supply chain",
                body: "AI-suggested packages may carry vulnerable or malicious code. Pre-install validation catches risks before they reach production.",
                tag: "Rules R20 — R25",
              },
            ].map((c, i) => (
              <div key={i} className="card">
                <div style={{ marginBottom: 12 }}>
                  <span className="tag tag-amber">{c.tag}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#dde5ef", marginBottom: 10 }}>{c.title}</h3>
                <p style={{ fontSize: 13, color: "#4a6070", lineHeight: 1.65 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --- HOW IT WORKS --- */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="section-label">How It Works</span>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 600, letterSpacing: "-0.016em", color: "#f0f4f8" }}>
              Validate before execution — not after
            </h2>
          </div>
          <div style={{ maxWidth: 740, margin: "0 auto" }}>
            {[
              {
                n: "01", title: "Generate",
                body: "Your AI agent or developer produces a command, script, dependency list, or CI workflow step.",
                tag: "AI Output", tagClass: "tag-blue",
              },
              {
                n: "02", title: "Send to Sentinel",
                body: "Submit via the Telegram bot (/scan, /deps, /ci) or API call. No SDK required, no backend changes needed on your side.",
                tag: "Validation Request", tagClass: "tag-amber",
              },
              {
                n: "03", title: "Rule engine evaluates",
                body: "25 named rules run against destructive patterns, eval/exec abuse, secret exposure, risky packages, and unsafe CI permissions.",
                tag: "25 Rules — Real-time", tagClass: "tag-amber",
              },
              {
                n: "04", title: "Receive verdict",
                body: "ALLOW, WARN, or BLOCK — with rule ID and risk score. Structured output your pipeline or agent can act on immediately.",
                tag: "ALLOW / WARN / BLOCK", tagClass: "tag-green",
              },
            ].map((step, i) => (
              <div key={i} className="step-row">
                <div className="step-num">{step.n}</div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#dde5ef" }}>{step.title}</span>
                    <span className={`tag ${step.tagClass}`}>{step.tag}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#4a6070", lineHeight: 1.65 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --- INTERACTIVE PREVIEW --- */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="section-label">Interactive Preview</span>
            <h2 style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 600, letterSpacing: "-0.016em", color: "#f0f4f8", marginBottom: 12 }}>
              Try the rule engine
            </h2>
            <p style={{ fontSize: 14, color: "#3d5266", maxWidth: 480, margin: "0 auto" }}>
              Preview simulation. Real verdicts may vary based on full rule context.
            </p>
          </div>

          <div className="demo-wrap">
            <div style={{ marginBottom: 0 }}>
              <div className="vm-key" style={{ marginBottom: 8 }}>Input</div>
              <input
                className="scan-input"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="Enter a shell command, code snippet, or package name..."
              />
            </div>

            <button className="scan-btn" onClick={handleScan}>
              Scan
            </button>

            <div
              className="verdict-box"
              style={{ background: vm.dimColor, border: `1px solid ${vm.borderColor}` }}
            >
              <div className="verdict-label" style={{ color: vm.color }}>{verdict}</div>
              <div className="verdict-meta">
                <div>
                  <div className="vm-key">Rule</div>
                  <div className="vm-val">{vm.rule}</div>
                </div>
                <div>
                  <div className="vm-key">Risk Score</div>
                  <div className="vm-val">{vm.score}</div>
                </div>
                <div>
                  <div className="vm-key">Action</div>
                  <div className="vm-val" style={{ color: vm.color }}>{verdict}</div>
                </div>
              </div>
              <p style={{ marginTop: 14, fontSize: 12, color: "#3d5266", lineHeight: 1.6 }}>
                {vm.description}
              </p>
            </div>

            <p className="disclaimer">
              Preview simulation. Real verdicts may vary based on full rule context.
              Connect to @teoslinker_bot for production results.
            </p>
          </div>
        </div>
      </section>


      <hr className="divider" />

      {/* --- DEMO VIDEO --- */}
      <section id="demo" className="section" style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 40% at 50% 60%, rgba(0,200,120,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} aria-hidden="true" />
        <div className="container" style={{ position: "relative" }}>
          <span className="section-label">Demo</span>
          <h2 style={{
            fontSize: "clamp(24px,4vw,36px)", fontWeight: 600,
            letterSpacing: "-0.016em", color: "#f0f4f8",
            marginBottom: 12,
          }}>
            See it block unsafe AI code — live
          </h2>
          <p style={{ fontSize: 15, color: "#4a6070", maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.65 }}>
            Watch Sentinel Shield intercept a destructive AI-generated command
            before it ever reaches execution.
          </p>

          {/* Video wrapper — 9:16 vertical (Shorts ratio) */}
          <div style={{
            display: "inline-block",
            position: "relative",
            width: "100%",
            maxWidth: 340,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(34,197,94,0.14), 0 0 40px rgba(34,197,94,0.07), 0 24px 60px rgba(0,0,0,0.55)",
          }}>
            {/* Shimmer top bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0,
              height: 3,
              background: "linear-gradient(90deg, #22c55e, #3b82f6, #22c55e)",
              backgroundSize: "200% 100%",
              animation: "shimmer 3s linear infinite",
              zIndex: 2,
            }} aria-hidden="true" />

            <iframe
              width="315"
              height="560"
              src="https://www.youtube.com/embed/oA7AEprFjZE?rel=0&modestbranding=1"
              title="Blocking Unsafe AI Code Before Execution | TEOS Sentinel Shield"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              style={{ display: "block", width: "100%", aspectRatio: "9/16", height: "auto", minHeight: 560 }}
            />
          </div>

          <p style={{ marginTop: 32, fontSize: 14, color: "#3d5266" }}>
            Ready to protect your pipelines?{" "}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#22c55e", fontWeight: 600 }}
            >
              Start free on Telegram &rarr;
            </a>
          </p>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features" className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="section-label">Features</span>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 600, letterSpacing: "-0.016em", color: "#f0f4f8" }}>
              Everything needed to validate AI-generated actions
            </h2>
          </div>
          <div className="grid-3">
            {[
              {
                title: "Code Risk Scan",
                body: "Detects destructive shell commands, eval/exec abuse, command injection, subprocess misuse, chmod issues, secret leakage, and base64 execution patterns.",
                plans: "Free · Starter · Builder · Pro",
                d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
              },
              {
                title: "Dependency Scanner",
                body: "Audits package.json for risky dependencies, unsafe install patterns, and known problematic packages before anything runs.",
                plans: "Builder · Pro",
                d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
              },
              {
                title: "CI/CD Scanner",
                body: "Scans GitHub Actions workflows for dangerous permissions, unsafe curl/bash patterns, and enterprise-risk configurations.",
                plans: "Pro · Enterprise",
                d: "M22 12h-4l-3 9L9 3l-3 9H2",
              },
              {
                title: "Telegram Gateway",
                body: "Full bot access via @teoslinker_bot. Commands: /scan, /deps, /ci, /status, /upgrade, /credits. No SDK or additional setup required.",
                plans: "All Plans",
                d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
              },
              {
                title: "Credits Tracking",
                body: "Scan credits are tracked per user. Upgrade tiers unlock higher limits and access to advanced scanners via the bot.",
                plans: "All Plans",
                d: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
              },
              {
                title: "Audit Logs",
                body: "Every scan returns a structured verdict, rule ID, and risk score. Available for enterprise compliance and security team workflows.",
                plans: "Pro · Enterprise",
                d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              },
            ].map((f, i) => (
              <div key={i} className="card">
                <div className="card-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c27d10" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={f.d} />
                  </svg>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#dde5ef", marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#4a6070", lineHeight: 1.65, marginBottom: 16 }}>{f.body}</p>
                <span className="mono" style={{ fontSize: 10, color: "#2d3f50", letterSpacing: "0.04em" }}>{f.plans}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --- PRICING --- */}
      <section id="pricing" className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span className="section-label">Pricing</span>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 600, letterSpacing: "-0.016em", color: "#f0f4f8" }}>
              Start free. Scale when ready.
            </h2>
          </div>
          <p style={{ textAlign: "center", fontSize: 15, color: "#4a6070", marginBottom: 48 }}>
            10 free scans/day for 14 days. No credit card required. Upgrade via Telegram.
          </p>

          <div className="pricing-grid">
            {/* FREE */}
            <div className="price-card">
              <div>
                <div className="price-name">Free</div>
                <div className="price-amount">$0</div>
                <div className="price-period">forever</div>
              </div>
              <div className="price-features">
                {["10 scans/day · 14 days", "Telegram access", "Code risk scan"].map((f, i) => (
                  <div key={i} className="price-feat">
                    <span className="feat-check">&#10003;</span>{f}
                  </div>
                ))}
              </div>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn-outline-sm" style={{ justifyContent: "center" }}>
                Start Free
              </a>
            </div>

            {/* STARTER */}
            <div className="price-card">
              <div>
                <div className="price-name">Starter</div>
                <div className="price-amount">$9</div>
                <div className="price-period">/month</div>
              </div>
              <div className="price-features">
                {["50 scans/month", "Code scan", "Basic verdicts", "7-day money-back guarantee"].map((f, i) => (
                  <div key={i} className="price-feat">
                    <span className="feat-check">&#10003;</span>{f}
                  </div>
                ))}
              </div>
              <a href={PRICE_STARTER} target="_blank" rel="noopener noreferrer" className="btn-outline-sm" style={{ justifyContent: "center" }}>
                Get Starter
              </a>
            </div>

            {/* BUILDER */}
            <div className="price-card featured">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="price-name" style={{ color: "#c27d10", marginBottom: 0 }}>Builder</span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", background: "rgba(251,191,36,0.1)", color: "#c27d10", padding: "2px 7px", borderRadius: 3, textTransform: "uppercase" }}>
                    Popular
                  </span>
                </div>
                <div className="price-amount">$49</div>
                <div className="price-period">/month</div>
              </div>
              <div className="price-features">
                {["500 scans/month", "Code scan", "Dependency scan", "CI/CD scan", "7-day money-back guarantee"].map((f, i) => (
                  <div key={i} className="price-feat">
                    <span className="feat-check">&#10003;</span>{f}
                  </div>
                ))}
              </div>
              <a href={PRICE_BUILDER} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ justifyContent: "center", fontSize: 13, padding: "10px 16px" }}>
                Get Builder
              </a>
            </div>

            {/* PRO */}
            <div className="price-card">
              <div>
                <div className="price-name">Pro</div>
                <div className="price-amount">$99</div>
                <div className="price-period">/month</div>
              </div>
              <div className="price-features">
                {["1,000 scans/month", "All scanners", "Priority support", "Team use", "Audit logs"].map((f, i) => (
                  <div key={i} className="price-feat">
                    <span className="feat-check">&#10003;</span>{f}
                  </div>
                ))}
              </div>
              <a href={PRICE_PRO} target="_blank" rel="noopener noreferrer" className="btn-outline-sm" style={{ justifyContent: "center" }}>
                Get Pro
              </a>
            </div>

            {/* ENTERPRISE */}
            <div className="price-card">
              <div>
                <div className="price-name">Enterprise</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f0f4f8", letterSpacing: "-0.01em", marginTop: 2 }}>Custom</div>
                <div className="price-period">contact us</div>
              </div>
              <div className="price-features">
                {["Unlimited scans", "Self-hosted deploy", "Custom onboarding", "Dedicated support", "SLA guarantee"].map((f, i) => (
                  <div key={i} className="price-feat">
                    <span className="feat-check">&#10003;</span>{f}
                  </div>
                ))}
              </div>
              <a href={`mailto:${CONTACT_EMAIL}?subject=Sentinel Shield Enterprise`} className="btn-outline-sm" style={{ justifyContent: "center" }}>
                Contact
              </a>
            </div>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#2d3f50", lineHeight: 1.7 }}>
            Digital access. Scan credits activate after payment.
            Payments are non-refundable once access is delivered.
          </p>
        </div>
      </section>

      <hr className="divider" />

      {/* --- ROADMAP --- */}
      <section id="roadmap" className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="section-label">Roadmap</span>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 600, letterSpacing: "-0.016em", color: "#f0f4f8" }}>
              What&apos;s coming in v2.1
            </h2>
          </div>
          <div className="rm-list">
            {[
              { label: "AST precision improvements", status: "In Progress", active: true },
              { label: "OSV vulnerability lookup", status: "Planned", active: false },
              { label: "GitHub Actions integration example", status: "Planned", active: false },
              { label: "Enterprise onboarding flow", status: "Planned", active: false },
              { label: "VPS / self-host hardening guide", status: "Planned", active: false },
              { label: "Enhanced free trial onboarding flow", status: "In Progress", active: true },
            ].map((item, i) => (
              <div key={i} className="rm-item">
                <span className="rm-dot" style={{ background: item.active ? "#d4921a" : "#1a2535" }} />
                <span style={{ flex: 1, fontSize: 14, color: "#7a8ea3" }}>{item.label}</span>
                <span className="mono" style={{ fontSize: 10, letterSpacing: "0.06em", color: item.active ? "#c27d10" : "#2d3f50", flexShrink: 0 }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --- EMAIL CAPTURE --- */}
      <section className="section-sm">
        <div className="container">
          <div style={{
            maxWidth: 560, margin: "0 auto", textAlign: "center",
            background: "rgba(255,255,255,0.018)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "40px 36px",
          }}>
            <span className="section-label">Stay Updated</span>
            <h3 style={{ fontSize: "clamp(18px,3vw,24px)", fontWeight: 600, color: "#f0f4f8", marginBottom: 10, letterSpacing: "-0.012em" }}>
              Get notified of new rules and integrations
            </h3>
            <p style={{ fontSize: 14, color: "#4a6070", lineHeight: 1.65, marginBottom: 24 }}>
              No spam. One email when something worth knowing ships.
            </p>
            {emailState === "done" ? (
              <p style={{ fontSize: 14, color: "#22c55e", fontWeight: 500 }}>&#10003; You&apos;re on the list. We&apos;ll be in touch.</p>
            ) : (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  placeholder="your@email.com"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 8, padding: "11px 16px",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 14, color: "#dde5ef",
                    outline: "none", minWidth: 220, flex: 1, maxWidth: 300,
                  }}
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={emailState === "submitting"}
                  style={{
                    background: emailState === "submitting" ? "#c27d10" : "#fbbf24",
                    color: "#07090e", fontSize: 13, fontWeight: 600,
                    padding: "11px 20px", borderRadius: 8, border: "none",
                    cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
                    whiteSpace: "nowrap", transition: "background 0.2s",
                  }}
                >
                  {emailState === "submitting" ? "Saving..." : "Notify Me"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --- FINAL CTA --- */}
      <section className="section">
        <div className="container">
          <div
            style={{
              maxWidth: 560, margin: "0 auto", textAlign: "center",
              background: "rgba(251,191,36,0.03)",
              border: "1px solid rgba(251,191,36,0.13)",
              borderRadius: 18, padding: "60px 44px",
            }}
          >
            <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 600, letterSpacing: "-0.016em", color: "#f0f4f8", marginBottom: 16 }}>
              10 free scans/day for 14 days
            </h2>
            <p style={{ fontSize: 15, color: "#4a6070", lineHeight: 1.7, marginBottom: 36 }}>
              No account setup. No credit card. Start in Telegram in under 60 seconds.
              Upgrade when your pipeline needs more.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn-primary-lg">
                Open @teoslinker_bot
              </a>
              <a href="#pricing" className="btn-outline">
                See all plans
              </a>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --- FOOTER --- */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <div className="nav-logo" style={{ marginBottom: 16 }}>
                <span className="nav-logo-mark" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L12 4V10L7 13L2 10V4L7 1Z" fill="#07090e"/>
                  </svg>
                </span>
                TEOS Sentinel Shield
              </div>
              <p style={{ fontSize: 13, color: "#2d3f50", lineHeight: 1.65, maxWidth: 280, marginBottom: 12 }}>
                Pre-execution security guardrails for autonomous systems.
                Built by Elmahrosa International, Alexandria, Egypt.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                style={{ fontSize: 13, color: "#3d5266", textDecoration: "underline" }}
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            {/* Product */}
            <div>
              <div className="footer-col-label">Product</div>
              <a href="#features" className="footer-link">Features</a>
              <a href="#pricing" className="footer-link">Pricing</a>
              <a href="#roadmap" className="footer-link">Roadmap</a>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="footer-link">Telegram Bot</a>
            </div>

            {/* Company */}
            <div>
              <div className="footer-col-label">Company</div>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
              <a href={TELEGRAM_GROUP_URL} target="_blank" rel="noopener noreferrer" className="footer-link">Telegram Group</a>
              <a href={X_URL} target="_blank" rel="noopener noreferrer" className="footer-link">X / Twitter</a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link">Contact</a>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              padding: "20px 0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: "#1a2535" }}>
              &copy; {new Date().getFullYear()} Elmahrosa International. All rights reserved.
            </span>
            <span className="mono" style={{ fontSize: 11, color: "#1a2535" }}>
              TEOS Sentinel Shield v2.0
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}