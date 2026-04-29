"use client";

import React, { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────
   TEOS SENTINEL SHIELD — Landing Page
   Runtime Security for Autonomous Systems
   Rebuilt: production-accurate, honest copy, live feature state
   Design: Sovereign terminal enterprise — Syne + JetBrains Mono
   ───────────────────────────────────────────────────────────── */

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

  :root {
    --bg:      #040810;
    --bg2:     #060c1a;
    --card:    #080d1e;
    --card2:   #0a1228;
    --border:  #172240;
    --border2: #1e2e50;
    --gold:    #c9a227;
    --gold-b:  #eec84a;
    --cyan:    #00a8e8;
    --cyan-b:  #3dd6f5;
    --text:    #dde3f4;
    --muted:   #5a6a8a;
    --dim:     #2a3a5a;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Keyframes ── */
  @keyframes fadeUp   { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; }                             to { opacity:1; } }
  @keyframes scanLine { 0%,100% { top: -2px; } 100% { top: calc(100% + 2px); } }
  @keyframes pulse    { 0%,100% { opacity:.5; } 50% { opacity:1; } }
  @keyframes glow     { 0%,100% { box-shadow:0 0 8px rgba(0,168,232,.25); } 50% { box-shadow:0 0 28px rgba(0,168,232,.6); } }
  @keyframes goldGlow { 0%,100% { box-shadow:0 0 8px rgba(201,162,39,.2); } 50% { box-shadow:0 0 28px rgba(201,162,39,.5); } }
  @keyframes blink    { 0%,100% { opacity:1; } 50% { opacity:0; } }
  @keyframes shimmer  { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
  @keyframes gridDrift { 0% { transform:translateY(0); } 100% { transform:translateY(60px); } }
  @keyframes rotateHex { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes slideRight { from { width:0; } to { width:100%; } }
  @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }

  /* ── Utility animation classes ── */
  .anim-fadeup { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both; }
  .d1 { animation-delay:.08s; }  .d2 { animation-delay:.16s; }
  .d3 { animation-delay:.24s; }  .d4 { animation-delay:.32s; }
  .d5 { animation-delay:.44s; }  .d6 { animation-delay:.56s; }

  .gold-shimmer {
    background: linear-gradient(90deg, var(--gold), var(--gold-b), var(--gold), var(--gold-b));
    background-size: 300% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }
  .cyan-shimmer {
    background: linear-gradient(90deg, var(--cyan), var(--cyan-b), var(--cyan));
    background-size: 300% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3s linear infinite;
  }

  /* ── Grid background ── */
  .grid-bg {
    background-image:
      linear-gradient(rgba(23,34,64,.55) 1px, transparent 1px),
      linear-gradient(90deg, rgba(23,34,64,.55) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .grid-drift {
    animation: gridDrift 8s linear infinite;
  }

  /* ── Cards ── */
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    transition: border-color .25s, box-shadow .25s, transform .25s;
  }
  .card:hover {
    border-color: rgba(0,168,232,.5);
    box-shadow: 0 0 0 1px rgba(0,168,232,.15), 0 12px 40px rgba(0,0,0,.6);
    transform: translateY(-3px);
  }
  .card-gold:hover {
    border-color: rgba(201,162,39,.5) !important;
    box-shadow: 0 0 0 1px rgba(201,162,39,.2), 0 12px 40px rgba(0,0,0,.6) !important;
    animation: goldGlow 2s ease-in-out infinite;
  }

  /* ── Buttons ── */
  .btn-gold {
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-b) 100%);
    color: #04080e;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    letter-spacing: .06em;
    transition: filter .2s, transform .2s, box-shadow .2s;
  }
  .btn-gold:hover {
    filter: brightness(1.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(201,162,39,.45);
  }
  .btn-ghost {
    background: transparent;
    border: 1px solid var(--border2);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    letter-spacing: .04em;
    transition: border-color .2s, color .2s, background .2s;
  }
  .btn-ghost:hover {
    border-color: var(--cyan);
    color: var(--cyan-b);
    background: rgba(0,168,232,.06);
  }
  .btn-cyan {
    background: transparent;
    border: 1px solid rgba(0,168,232,.35);
    color: var(--cyan-b);
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    letter-spacing: .04em;
    transition: all .2s;
  }
  .btn-cyan:hover {
    background: rgba(0,168,232,.1);
    border-color: var(--cyan);
    box-shadow: 0 0 20px rgba(0,168,232,.2);
  }

  /* ── Verdict tags ── */
  .verdict-allow { background:rgba(34,197,94,.1);  color:#4ade80; border:1px solid rgba(34,197,94,.25); }
  .verdict-warn  { background:rgba(234,179,8,.1);  color:#fbbf24; border:1px solid rgba(234,179,8,.25); }
  .verdict-block { background:rgba(239,68,68,.1);  color:#f87171; border:1px solid rgba(239,68,68,.25); }

  .verdict-card-allow { border-left: 3px solid #22c55e; background: rgba(34,197,94,.04); }
  .verdict-card-warn  { border-left: 3px solid #eab308; background: rgba(234,179,8,.04); }
  .verdict-card-block { border-left: 3px solid #ef4444; background: rgba(239,68,68,.04); }

  /* ── Tier card ── */
  .tier-featured {
    border-color: var(--gold) !important;
    box-shadow: 0 0 0 1px rgba(201,162,39,.25), 0 0 60px rgba(201,162,39,.07);
    position: relative;
  }

  /* ── Nav ── */
  .nav-blur {
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    background: rgba(4,8,16,.82);
    border-bottom: 1px solid var(--border);
  }

  /* ── Scan animation ── */
  .scan-beam {
    position: absolute;
    left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    animation: scanLine 2.4s ease-in-out infinite;
    pointer-events: none;
  }

  /* ── Live dot ── */
  .live-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 1.8s ease-in-out infinite;
    box-shadow: 0 0 0 3px rgba(34,197,94,.2);
  }

  /* ── Section header line ── */
  .section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: .7rem;
    font-weight: 600;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--cyan);
  }

  /* ── Terminal block ── */
  .terminal {
    background: #040810;
    border: 1px solid var(--border2);
    border-radius: 10px;
    overflow: hidden;
    font-family: 'JetBrains Mono', monospace;
    font-size: .8rem;
    box-shadow: 0 24px 64px rgba(0,0,0,.7);
  }
  .terminal-bar {
    background: #0d1a30;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: .6rem 1rem;
    gap: .5rem;
  }
  .dot { width:11px; height:11px; border-radius:50%; }

  /* ── Capability pill ── */
  .live-pill {
    background: rgba(34,197,94,.1);
    border: 1px solid rgba(34,197,94,.25);
    color: #4ade80;
    font-size: .65rem;
    letter-spacing: .12em;
    padding: 2px 8px;
    border-radius: 999px;
  }

  /* ── Hero radial ── */
  .hero-radial {
    background: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,168,232,.07) 0%, transparent 70%),
                radial-gradient(ellipse 40% 30% at 80% 60%, rgba(201,162,39,.05) 0%, transparent 60%);
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

  /* ── Step connector ── */
  .step-arrow {
    color: var(--gold);
    font-size: 1.6rem;
    opacity: .6;
    line-height: 1;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .hero-term { display: none !important; }
  }
`;

/* ──────────── Sub-components ──────────── */

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={scrolled ? {} : { background: "transparent" }}
    >
      <div
        className={`transition-all duration-500 ${scrolled ? "nav-blur" : ""}`}
      >
        <div
          className="max-w-6xl mx-auto px-6 flex items-center justify-between"
          style={{ height: "64px" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                background: "linear-gradient(135deg,#c9a227,#eec84a)",
                borderRadius: 6,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                  fill="#040810"
                  stroke="#040810"
                  strokeWidth="1"
                />
                <path d="M9 12l2 2 4-4" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                fontSize: ".95rem",
                letterSpacing: ".04em",
                color: "#dde3f4",
              }}
            >
              TEOS<span style={{ color: "var(--gold)" }}>.</span>SENTINEL
            </span>
          </div>

          {/* Nav links */}
          <div
            className="hide-mobile flex items-center gap-8"
            style={{ fontFamily: "JetBrains Mono", fontSize: ".75rem", color: "var(--muted)" }}
          >
            {["How It Works", "Capabilities", "Pricing", "Why TEOS"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                style={{ color: "var(--muted)", textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                {l}
              </a>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://t.me/teoslinker_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
            style={{ padding: "9px 22px", borderRadius: 7, fontSize: ".78rem", textDecoration: "none", display: "inline-block" }}
          >
            Launch Security Bot
          </a>
        </div>
      </div>
    </nav>
  );
}

function HeroTerminal() {
  const lines = [
    { delay: 0,    text: "$ /scan",                color: "var(--cyan-b)" },
    { delay: 600,  text: "▸ Analyzing AST patterns...",  color: "var(--muted)" },
    { delay: 1100, text: "▸ Checking eval() usage",  color: "var(--muted)" },
    { delay: 1600, text: "▸ Supply chain trace...",   color: "var(--muted)" },
    { delay: 2100, text: "VERDICT: ██ BLOCK",         color: "#f87171" },
    { delay: 2400, text: "REASON:  Detected shell injection via exec()", color: "#f87171" },
    { delay: 2900, text: "RISK:    CRITICAL — execution halted",          color: "#fbbf24" },
    { delay: 3500, text: "",                           color: "" },
    { delay: 3600, text: "$ /deps",                color: "var(--cyan-b)" },
    { delay: 4200, text: "▸ 23 packages resolved",   color: "var(--muted)" },
    { delay: 4700, text: "VERDICT: ✓ ALLOW",          color: "#4ade80" },
  ];

  const [visible, setVisible] = useState<number[]>([]);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById("hero-terminal");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    lines.forEach((_, i) => {
      setTimeout(() => setVisible((v) => [...v, i]), lines[i].delay);
    });
  }, [started]);

  return (
    <div id="hero-terminal" className="terminal hero-term" style={{ width: "100%", maxWidth: 420 }}>
      <div className="terminal-bar">
        <div className="dot" style={{ background: "#ff5f57" }} />
        <div className="dot" style={{ background: "#febc2e" }} />
        <div className="dot" style={{ background: "#28c840" }} />
        <span style={{ marginLeft: 12, color: "var(--muted)", fontSize: ".7rem" }}>
          teos-sentinel — live
        </span>
        <div className="live-dot" style={{ marginLeft: "auto" }} />
      </div>
      <div style={{ padding: "1.2rem 1.4rem", minHeight: 260, position: "relative" }}>
        {started && <div className="scan-beam" />}
        {lines.map((l, i) =>
          visible.includes(i) ? (
            <div
              key={i}
              style={{
                color: l.color || "transparent",
                fontSize: ".76rem",
                lineHeight: "1.8",
                animation: "fadeIn .25s ease both",
                fontWeight: l.text.startsWith("VERDICT") ? 600 : 400,
              }}
            >
              {l.text}
            </div>
          ) : null
        )}
        {visible.length > 0 && visible.length < lines.length && (
          <span style={{ color: "var(--cyan-b)" }}>
            █<span className="cursor-blink" style={{ animation: "blink .8s step-end infinite" }}>_</span>
          </span>
        )}
      </div>
    </div>
  );
}

function ProofChip({ label, variant }: { label: string; variant: "allow" | "warn" | "block" | "live" | "neutral" }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    allow:   { bg: "rgba(34,197,94,.1)",  color: "#4ade80", border: "rgba(34,197,94,.25)" },
    warn:    { bg: "rgba(234,179,8,.1)",  color: "#fbbf24", border: "rgba(234,179,8,.25)" },
    block:   { bg: "rgba(239,68,68,.1)",  color: "#f87171", border: "rgba(239,68,68,.25)" },
    live:    { bg: "rgba(0,168,232,.1)",  color: "var(--cyan-b)", border: "rgba(0,168,232,.25)" },
    neutral: { bg: "rgba(90,106,138,.12)", color: "var(--muted)", border: "rgba(90,106,138,.25)" },
  };
  const s = styles[variant];
  return (
    <div
      style={{
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 999, padding: "6px 14px",
        fontSize: ".68rem", fontWeight: 600,
        letterSpacing: ".1em", display: "inline-flex", alignItems: "center", gap: 6,
      }}
    >
      {variant === "live" && <div className="live-dot" style={{ width: 6, height: 6 }} />}
      {label}
    </div>
  );
}

function CapabilityCard({ icon, title, cmd, desc }: { icon: string; title: string; cmd: string; desc: string }) {
  return (
    <div className="card" style={{ borderRadius: 12, padding: "1.5rem", cursor: "default" }}>
      <div className="flex items-start justify-between mb-4">
        <div style={{ fontSize: "1.6rem" }}>{icon}</div>
        <div className="live-pill">LIVE</div>
      </div>
      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)", marginBottom: 6 }}>
        {title}
      </div>
      <div
        style={{
          fontFamily: "JetBrains Mono", fontSize: ".7rem", color: "var(--cyan)",
          background: "rgba(0,168,232,.07)", border: "1px solid rgba(0,168,232,.15)",
          borderRadius: 5, padding: "3px 10px", display: "inline-block", marginBottom: 10,
        }}
      >
        {cmd}
      </div>
      <div style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.7 }}>{desc}</div>
    </div>
  );
}

function VerdictCard({
  verdict, code, reason, risk,
}: { verdict: "ALLOW" | "WARN" | "BLOCK"; code: string; reason: string; risk: string }) {
  const cfg = {
    ALLOW: { cls: "verdict-card-allow", tag: "verdict-allow", dot: "#22c55e", glyph: "✓" },
    WARN:  { cls: "verdict-card-warn",  tag: "verdict-warn",  dot: "#eab308", glyph: "⚠" },
    BLOCK: { cls: "verdict-card-block", tag: "verdict-block", dot: "#ef4444", glyph: "✕" },
  }[verdict];

  return (
    <div
      className={`card ${cfg.cls}`}
      style={{ borderRadius: 12, overflow: "hidden" }}
    >
      {/* Terminal bar */}
      <div
        style={{
          background: "var(--card2)", borderBottom: "1px solid var(--border)",
          padding: ".6rem 1rem", display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 6, fontSize: ".65rem", color: "var(--muted)", fontFamily: "JetBrains Mono" }}>
          teos-sentinel · /scan
        </span>
      </div>

      <div style={{ padding: "1.2rem 1.4rem" }}>
        {/* Code input */}
        <div style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: 4, fontFamily: "JetBrains Mono" }}>
          INPUT
        </div>
        <div
          style={{
            fontFamily: "JetBrains Mono", fontSize: ".72rem", color: "var(--dim)",
            background: "rgba(0,0,0,.3)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "8px 12px", marginBottom: "1rem",
            whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6,
          }}
        >
          {code}
        </div>

        {/* Verdict badge */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className={cfg.tag}
            style={{
              fontFamily: "JetBrains Mono", fontSize: ".75rem", fontWeight: 700,
              padding: "4px 14px", borderRadius: 6, letterSpacing: ".12em",
            }}
          >
            {cfg.glyph} {verdict}
          </span>
        </div>

        <div style={{ fontSize: ".72rem", fontFamily: "JetBrains Mono", lineHeight: 1.8 }}>
          <div>
            <span style={{ color: "var(--muted)" }}>REASON  </span>
            <span style={{ color: "var(--text)" }}>{reason}</span>
          </div>
          <div>
            <span style={{ color: "var(--muted)" }}>RISK    </span>
            <span style={{ color: "var(--text)" }}>{risk}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  tier, price, scans, features, cta, href, featured,
}: {
  tier: string; price: string; scans: string; features: string[];
  cta: string; href: string; featured?: boolean;
}) {
  return (
    <div
      className={`card ${featured ? "tier-featured card-gold" : ""}`}
      style={{
        borderRadius: 14, padding: "2rem 1.75rem", display: "flex",
        flexDirection: "column", position: "relative",
      }}
    >
      {featured && (
        <div
          style={{
            position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
            background: "linear-gradient(135deg,var(--gold),var(--gold-b))",
            color: "#040810", fontFamily: "Syne,sans-serif", fontWeight: 700,
            fontSize: ".65rem", letterSpacing: ".15em", padding: "4px 16px",
            borderRadius: 999,
          }}
        >
          RECOMMENDED
        </div>
      )}

      <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "1.1rem", color: featured ? "var(--gold-b)" : "var(--text)", marginBottom: 8 }}>
        {tier}
      </div>

      <div style={{ marginBottom: 6 }}>
        <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--text)" }}>
          {price}
        </span>
        {price !== "$0" && (
          <span style={{ fontSize: ".8rem", color: "var(--muted)", marginLeft: 4 }}>/month</span>
        )}
      </div>

      <div
        style={{
          fontFamily: "JetBrains Mono", fontSize: ".7rem", color: "var(--cyan)",
          background: "rgba(0,168,232,.07)", border: "1px solid rgba(0,168,232,.15)",
          borderRadius: 6, padding: "4px 12px", display: "inline-block", marginBottom: "1.5rem",
        }}
      >
        {scans}
      </div>

      <ul style={{ listStyle: "none", marginBottom: "1.75rem", flex: 1 }}>
        {features.map((f) => (
          <li
            key={f}
            style={{
              fontSize: ".78rem", color: "var(--muted)", padding: "5px 0",
              borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ color: featured ? "var(--gold)" : "var(--cyan)", fontSize: ".7rem" }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={featured ? "btn-gold" : "btn-ghost"}
        style={{
          display: "block", textAlign: "center", textDecoration: "none",
          padding: "12px", borderRadius: 8, fontSize: ".82rem",
        }}
      >
        {cta}
      </a>
    </div>
  );
}

function WhyCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="card" style={{ borderRadius: 12, padding: "1.6rem" }}>
      <div style={{ fontSize: "1.4rem", marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: ".95rem", color: "var(--text)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.75 }}>{desc}</div>
    </div>
  );
}

/* ──────────── Main Page ──────────── */

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <NavBar />

      <main style={{ background: "var(--bg)" }}>

        {/* ═══════════════════════════════════════
            SECTION 1 — HERO
        ═══════════════════════════════════════ */}
        <section
          id="hero"
          className="hero-radial grid-bg"
          style={{ paddingTop: "130px", paddingBottom: "100px", position: "relative", overflow: "hidden" }}
        >
          {/* Ambient orbs */}
          <div style={{
            position: "absolute", top: "10%", left: "5%",
            width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,168,232,.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "5%", right: "8%",
            width: 300, height: 300, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,162,39,.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div className="max-w-6xl mx-auto px-6">
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "4rem", alignItems: "center",
              }}
            >
              {/* Left column */}
              <div>
                {/* Live status */}
                <div className="anim-fadeup flex items-center gap-3 mb-6">
                  <div className="live-dot" />
                  <span
                    style={{
                      fontFamily: "JetBrains Mono", fontSize: ".68rem",
                      color: "#4ade80", letterSpacing: ".15em",
                    }}
                  >
                    CORE SERVICES OPERATIONAL
                  </span>
                </div>

                {/* Headline */}
                <h1
                  className="anim-fadeup d1"
                  style={{
                    fontFamily: "Syne, sans-serif", fontWeight: 800,
                    fontSize: "clamp(2.4rem, 4vw, 3.4rem)",
                    lineHeight: 1.1, color: "var(--text)", marginBottom: "1rem",
                  }}
                >
                  TEOS{" "}
                  <span className="gold-shimmer">Sentinel</span>
                  <br />Shield
                </h1>

                {/* Subheadline */}
                <p
                  className="anim-fadeup d2"
                  style={{
                    fontFamily: "Syne, sans-serif", fontWeight: 600,
                    fontSize: "clamp(1rem, 2vw, 1.25rem)",
                    color: "var(--cyan-b)", marginBottom: "1rem", letterSpacing: ".01em",
                  }}
                >
                  Execution Control Infrastructure for Autonomous AI
                </p>

                {/* Support copy */}
                <p
                  className="anim-fadeup d3"
                  style={{
                    fontSize: ".88rem", color: "var(--muted)", lineHeight: 1.75,
                    maxWidth: 480, marginBottom: "2rem",
                  }}
                >
                  Pre-execution risk validation for AI-generated code, dependencies,
                  and CI/CD workflows — delivered through a sovereign Telegram security gateway.
                </p>

                {/* Flow */}
                <div
                  className="anim-fadeup d3 flex items-center gap-3 mb-8"
                  style={{ fontFamily: "JetBrains Mono", fontSize: ".8rem" }}
                >
                  {["Generate", "Validate", "Execute"].map((step, i) => (
                    <React.Fragment key={step}>
                      <span
                        style={{
                          color: i === 1 ? "var(--gold-b)" : "var(--text)",
                          fontWeight: i === 1 ? 700 : 400,
                          background: i === 1 ? "rgba(201,162,39,.1)" : "rgba(255,255,255,.04)",
                          border: `1px solid ${i === 1 ? "rgba(201,162,39,.3)" : "var(--border)"}`,
                          borderRadius: 6, padding: "5px 14px",
                        }}
                      >
                        {i === 1 ? "⬡ " : ""}{step}
                      </span>
                      {i < 2 && (
                        <span className="step-arrow">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="anim-fadeup d4 flex flex-wrap gap-3 mb-8">
                  <a
                    href="https://t.me/teoslinker_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold"
                    style={{ padding: "13px 28px", borderRadius: 9, fontSize: ".85rem", textDecoration: "none", display: "inline-block" }}
                  >
                    Start Free — 5 Scans
                  </a>
                  <a
                    href="#how-it-works"
                    className="btn-cyan"
                    style={{ padding: "13px 28px", borderRadius: 9, fontSize: ".85rem", textDecoration: "none", display: "inline-block" }}
                  >
                    How It Works
                  </a>
                  <a
                    href="#pricing"
                    className="btn-ghost"
                    style={{ padding: "13px 28px", borderRadius: 9, fontSize: ".85rem", textDecoration: "none", display: "inline-block" }}
                  >
                    View Plans
                  </a>
                </div>

                {/* Proof chips */}
                <div className="anim-fadeup d5 flex flex-wrap gap-2 mb-6">
                  <ProofChip label="ALLOW / WARN / BLOCK" variant="neutral" />
                  <ProofChip label="Live Telegram Gateway" variant="live" />
                  <ProofChip label="Dependency Audit" variant="live" />
                  <ProofChip label="CI Security Checks" variant="live" />
                </div>

                {/* Enterprise proof strip */}
                <div
                  className="anim-fadeup d6"
                  style={{
                    background: "rgba(255,255,255,.02)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "14px 20px",
                    display: "flex", flexWrap: "wrap", gap: "0",
                  }}
                >
                  {[
                    { label: "Deterministic Verdicts", icon: "⬡" },
                    { label: "Supply Chain Checks",    icon: "📦" },
                    { label: "CI Workflow Audit",      icon: "⚙️" },
                    { label: "Telegram Security Gateway", icon: "🤖" },
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "4px 16px",
                        borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                        flex: "1 1 auto",
                      }}
                    >
                      <span style={{ fontSize: ".85rem" }}>{item.icon}</span>
                      <span style={{
                        fontFamily: "JetBrains Mono", fontSize: ".68rem",
                        color: "var(--muted)", letterSpacing: ".06em", whiteSpace: "nowrap",
                      }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column — terminal */}
              <div className="anim-fadeup d4 flex justify-center">
                <HeroTerminal />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 2 — HOW IT WORKS
        ═══════════════════════════════════════ */}
        <section id="how-it-works" style={{ padding: "100px 0", borderTop: "1px solid var(--border)" }}>
          <div className="max-w-6xl mx-auto px-6">
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div className="section-label mb-4">HOW IT WORKS</div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif", fontWeight: 800,
                  fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "var(--text)",
                }}
              >
                Three Phases. Zero Assumed Trust.
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr auto 1fr",
                gap: "1.5rem", alignItems: "center",
              }}
            >
              {[
                {
                  num: "01", label: "Generate",
                  desc: "AI agents and developers produce code, package manifests, or CI workflow files.",
                  icon: "⚡",
                  color: "var(--muted)",
                },
                null,
                {
                  num: "02", label: "Validate",
                  desc: "TEOS Sentinel intercepts and applies deterministic risk rules across code, deps, and CI config.",
                  icon: "⬡",
                  color: "var(--gold-b)",
                  featured: true,
                },
                null,
                {
                  num: "03", label: "Execute",
                  desc: "ALLOW proceeds. WARN flags for review. BLOCK halts execution before damage occurs.",
                  icon: "✓",
                  color: "var(--cyan-b)",
                },
              ].map((step, i) => {
                if (!step) {
                  return (
                    <div key={i} style={{ textAlign: "center", color: "var(--gold)", fontSize: "2rem", opacity: .5 }}>
                      →
                    </div>
                  );
                }
                return (
                  <div
                    key={step.num}
                    className={`card ${step.featured ? "tier-featured" : ""}`}
                    style={{ borderRadius: 14, padding: "2rem 1.5rem", textAlign: "center" }}
                  >
                    <div
                      style={{
                        width: 56, height: 56, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1.2rem",
                        background: step.featured
                          ? "linear-gradient(135deg, rgba(201,162,39,.2), rgba(201,162,39,.05))"
                          : "rgba(255,255,255,.03)",
                        border: `1px solid ${step.featured ? "rgba(201,162,39,.3)" : "var(--border)"}`,
                        fontSize: "1.4rem",
                      }}
                    >
                      {step.icon}
                    </div>
                    <div
                      style={{
                        fontFamily: "JetBrains Mono", fontSize: ".65rem",
                        color: "var(--muted)", letterSpacing: ".15em", marginBottom: 6,
                      }}
                    >
                      PHASE {step.num}
                    </div>
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif", fontWeight: 800,
                        fontSize: "1.2rem", color: step.color, marginBottom: 10,
                      }}
                    >
                      {step.label}
                    </div>
                    <div style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.75 }}>
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 3 — LIVE CAPABILITIES
        ═══════════════════════════════════════ */}
        <section
          id="capabilities"
          style={{ padding: "100px 0", background: "var(--bg2)", borderTop: "1px solid var(--border)" }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div className="section-label mb-4">LIVE CAPABILITIES</div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif", fontWeight: 800,
                  fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "var(--text)",
                }}
              >
                Current Product Capabilities
              </h2>
              <p style={{ fontSize: ".88rem", color: "var(--muted)", maxWidth: 480, margin: "1rem auto 0", lineHeight: 1.75 }}>
                Capabilities shown reflect the current live product scope.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <CapabilityCard
                icon="🔍"
                title="Code Risk Scan"
                cmd="/scan"
                desc="Analyzes AI-generated code for dangerous patterns: eval(), shell injections, destructive commands, and obfuscated execution vectors."
              />
              <CapabilityCard
                icon="📦"
                title="Dependency Audit"
                cmd="/deps"
                desc="Resolves package manifests and checks for supply chain risks, malicious packages, and dependency confusion vulnerabilities."
              />
              <CapabilityCard
                icon="⚙️"
                title="CI Workflow Audit"
                cmd="PRO"
                desc="Inspects CI workflow files for privilege escalation, secret exposure, insecure runners, and deployment pipeline risks. Available on Pro tier."
              />
              <CapabilityCard
                icon="🪙"
                title="Persistent Credits"
                cmd="Automatic"
                desc="Scan credits persist across sessions. Purchase once, use continuously. Server-side state managed by a hardened activation service."
              />
              <CapabilityCard
                icon="🤖"
                title="Telegram Security Gateway"
                cmd="@teoslinker_bot"
                desc="A purpose-built Telegram bot serving as the primary security interface. Instant scan access with no app installs required."
              />
              <CapabilityCard
                icon="🛡"
                title="Sovereign Runtime Stack"
                cmd="PM2 + Local Sovereign Infra"
                desc="PM2-managed persistent services on sovereign-first infrastructure. No serverless cold starts. Designed for continuously available execution control."
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 4 — VERDICT EXAMPLES
        ═══════════════════════════════════════ */}
        <section
          id="verdicts"
          style={{ padding: "100px 0", borderTop: "1px solid var(--border)" }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div className="section-label mb-4">VERDICT ENGINE</div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif", fontWeight: 800,
                  fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "var(--text)",
                }}
              >
                Three Verdicts. No Ambiguity.
              </h2>
              <p style={{ fontSize: ".88rem", color: "var(--muted)", maxWidth: 500, margin: "1rem auto 0", lineHeight: 1.75 }}>
                Every scan produces a deterministic verdict. ALLOW, WARN, or BLOCK — with structured reasoning your agents can act on.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.25rem" }}>
              <VerdictCard
                verdict="ALLOW"
                code={`import hashlib\ndata = b"hello world"\nhashlib.sha256(data).hexdigest()`}
                reason="Standard cryptographic operation. No I/O, no execution."
                risk="NONE — cleared for execution"
              />
              <VerdictCard
                verdict="WARN"
                code={`import subprocess\nresult = subprocess.run(\n  ["ls", "-la"], capture_output=True\n)`}
                reason="Subprocess call detected. Scoped to directory listing."
                risk="LOW — review before automation"
              />
              <VerdictCard
                verdict="BLOCK"
                code={`eval(require("child_process")\n  .exec("rm -rf /"))`}
                reason="Shell injection via eval + exec combination."
                risk="CRITICAL — execution halted"
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 4B — TRUSTED FOR
        ═══════════════════════════════════════ */}
        <section
          style={{
            padding: "0 0 80px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <div
              style={{
                background: "var(--card2)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "2.5rem 3rem",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "2rem",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div className="section-label mb-3">TRUSTED FOR</div>
                <div
                  style={{
                    fontFamily: "Syne, sans-serif", fontWeight: 800,
                    fontSize: "1.1rem", color: "var(--text)",
                  }}
                >
                  Built for every layer of the autonomous AI stack
                </div>
              </div>
              <div
                style={{
                  display: "flex", flexWrap: "wrap", gap: "1rem",
                }}
              >
                {[
                  { label: "AI Agents",                icon: "🤖" },
                  { label: "Developer Workflows",      icon: "⚡" },
                  { label: "CI/CD Security Gates",     icon: "⚙️" },
                  { label: "Autonomous Code Execution", icon: "🔒" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid var(--border2)",
                      borderRadius: 9, padding: "10px 18px",
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                    <span
                      style={{
                        fontFamily: "Syne, sans-serif", fontWeight: 600,
                        fontSize: ".82rem", color: "var(--text)",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise category strip */}
            <div
              style={{
                marginTop: "1.25rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexWrap: "wrap", gap: "0",
                background: "rgba(255,255,255,.015)",
                border: "1px solid var(--border)",
                borderRadius: 10, padding: "14px 28px",
              }}
            >
              <span
                style={{
                  fontFamily: "JetBrains Mono", fontSize: ".68rem",
                  color: "var(--muted)", letterSpacing: ".14em", marginRight: 16,
                  textTransform: "uppercase",
                }}
              >
                Built for
              </span>
              {[
                "AI Agents",
                "Secure DevOps",
                "Autonomous Pipelines",
                "Sovereign Infrastructure",
              ].map((item, i, arr) => (
                <span key={item} style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "Syne, sans-serif", fontWeight: 600,
                      fontSize: ".78rem", color: "var(--text)",
                    }}
                  >
                    {item}
                  </span>
                  {i < arr.length - 1 && (
                    <span style={{ margin: "0 12px", color: "var(--dim)", fontSize: ".7rem" }}>•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 5 — PRICING
        ═══════════════════════════════════════ */}
        <section
          id="pricing"
          style={{ padding: "100px 0", background: "var(--bg2)", borderTop: "1px solid var(--border)" }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div className="section-label mb-4">PRICING</div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif", fontWeight: 800,
                  fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "var(--text)",
                }}
              >
                Start Free. Scale When Ready.
              </h2>
              <p style={{ fontSize: ".88rem", color: "var(--muted)", maxWidth: 440, margin: "1rem auto 0", lineHeight: 1.75 }}>
                No trial periods. No credit card required for free tier. Credits persist across sessions.
              </p>

              {/* Category positioning */}
              <div
                style={{
                  display: "inline-flex", flexDirection: "column", alignItems: "center",
                  gap: 4, marginTop: "2rem",
                  padding: "16px 32px",
                  background: "rgba(201,162,39,.04)",
                  border: "1px solid rgba(201,162,39,.18)",
                  borderRadius: 12,
                }}
              >
                {["Beyond scanning.", "Beyond linting.", "Execution Control Infrastructure."].map((line, i) => (
                  <span
                    key={line}
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: i === 2 ? 800 : 400,
                      fontSize: i === 2 ? "1.05rem" : ".88rem",
                      color: i === 2 ? "var(--gold-b)" : "var(--muted)",
                      letterSpacing: i === 2 ? ".02em" : "normal",
                    }}
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "1.25rem", alignItems: "start",
              }}
            >
              <PricingCard
                tier="Free"
                price="$0"
                scans="5 scans"
                features={[
                  "Code risk scan (/scan)",
                  "Telegram bot access",
                  "ALLOW / WARN / BLOCK verdicts",
                  "Structured risk output",
                ]}
                cta="Start Free"
                href="https://t.me/teoslinker_bot"
              />
              <PricingCard
                tier="Starter"
                price="$9"
                scans="50 scans / month"
                features={[
                  "Code risk scan (/scan)",
                  "Persistent credit balance",
                  "Full scan history",
                  "Audit log access",
                ]}
                cta="Get Starter"
                href="https://dodo.pe/tts"
              />
              <PricingCard
                tier="Builder"
                price="$49"
                scans="500 scans / month"
                features={[
                  "Code risk scan (/scan)",
                  "Dependency audit (/deps)",
                  "500 persistent credits",
                  "Priority support",
                ]}
                cta="Get Builder"
                href="https://dodo.pe/tts2"
                featured
              />
              <PricingCard
                tier="Pro"
                price="$99"
                scans="1,000 scans / month"
                features={[
                  "Code + Dependency scans",
                  "CI Workflow Audit (Pro rollout)",
                  "1,000 persistent credits",
                  "Full scan suite access",
                ]}
                cta="Get Pro"
                href="https://dodo.pe/teos-pro"
              />
            </div>

            {/* Enterprise note */}
            <div
              style={{
                marginTop: "2rem",
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "1.5rem 2rem",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                  Enterprise & Custom Deployments
                </div>
                <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                  Private deployment, custom rule engines, institutional contracts. Contact directly.
                </div>
              </div>
              <a
                href="mailto:ayman@teosegypt.com?subject=TEOS Sentinel Enterprise"
                className="btn-ghost"
                style={{ padding: "10px 24px", borderRadius: 8, fontSize: ".8rem", textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" }}
              >
                Contact Sales →
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 6 — WHY TEOS
        ═══════════════════════════════════════ */}
        <section
          id="why-teos"
          style={{ padding: "100px 0", borderTop: "1px solid var(--border)" }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div className="section-label mb-4">WHY TEOS</div>
              <h2
                style={{
                  fontFamily: "Syne, sans-serif", fontWeight: 800,
                  fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "var(--text)",
                }}
              >
                Engineered for Execution Control
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
              <WhyCard
                icon="⬡"
                title="Deterministic Rules Engine"
                desc="No probabilistic black boxes. Risk verdicts are computed against explicit, auditable rule sets. Every BLOCK has a traceable reason."
              />
              <WhyCard
                icon="🔒"
                title="Execution Risk Controls"
                desc="Intercepts code before it reaches your runtime. Designed for AI pipelines where generated code executes autonomously at scale."
              />
              <WhyCard
                icon="📦"
                title="Supply Chain Checks"
                desc="Dependency manifests analyzed for package-level risks including typosquatting, malicious publications, and version-pinning issues."
              />
              <WhyCard
                icon="🤖"
                title="Agent Runtime Protection"
                desc="Built specifically for autonomous AI systems. When agents generate and execute code in the same loop, Sentinel is the circuit breaker."
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 7 — FOUNDER / SOVEREIGN
        ═══════════════════════════════════════ */}
        <section
          style={{
            padding: "80px 0", borderTop: "1px solid var(--border)",
            background: "var(--bg2)",
          }}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(201,162,39,.2), rgba(0,168,232,.1))",
                border: "1px solid rgba(201,162,39,.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.5rem", fontSize: "1.8rem",
              }}
            >
              🛡
            </div>
            <div className="section-label mb-4">BUILT BY</div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif", fontWeight: 800,
                fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: "var(--text)", marginBottom: "1rem",
              }}
            >
              Elmahrosa International
            </h2>
            <p
              style={{
                fontFamily: "Syne, sans-serif", fontWeight: 600,
                fontSize: "1rem", color: "var(--cyan-b)", marginBottom: "1.2rem",
              }}
            >
              Building Execution Control Infrastructure for Autonomous Systems
            </p>
            <p
              style={{
                fontSize: ".85rem", color: "var(--muted)", lineHeight: 1.85,
                maxWidth: 560, margin: "0 auto 2rem",
              }}
            >
              Founded in Alexandria, Egypt. Building security infrastructure for the next generation
              of autonomous AI systems — from agent-native validation engines to institutional
              deployment-grade security tooling.
            </p>
            <div className="flex justify-center flex-wrap gap-4">
              {[
                { label: "Telegram Community", href: "https://t.me/Elmahrosapi" },
                { label: "GitHub", href: "https://github.com/Elmahrosa/teos-sentinel-shield" },
                { label: "Contact", href: "mailto:ayman@teosegypt.com" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{
                    padding: "9px 22px", borderRadius: 8,
                    fontSize: ".78rem", textDecoration: "none", display: "inline-block",
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 8 — FINAL CTA
        ═══════════════════════════════════════ */}
        <section
          style={{
            padding: "120px 24px",
            background: `
              radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,162,39,.08) 0%, transparent 70%),
              radial-gradient(ellipse 40% 30% at 50% 100%, rgba(0,168,232,.05) 0%, transparent 60%),
              var(--bg)
            `,
            borderTop: "1px solid var(--border)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Grid overlay */}
          <div
            className="grid-bg"
            style={{
              position: "absolute", inset: 0, opacity: .4, pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
            <div className="section-label mb-6">GET STARTED</div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif", fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                lineHeight: 1.1, color: "var(--text)", marginBottom: "1rem",
              }}
            >
              Execution Control Infrastructure<br />
              <span className="gold-shimmer">for Autonomous AI</span>
            </h2>
            <p
              style={{
                fontSize: ".9rem", color: "var(--muted)", lineHeight: 1.8,
                maxWidth: 480, margin: "0 auto 2.5rem",
              }}
            >
              Start validating AI-generated code today. Five free scans.
              No account required — open the bot and run{" "}
              <span style={{ color: "var(--cyan-b)", fontWeight: 600 }}>/scan</span>.
            </p>

            <div className="flex justify-center flex-wrap gap-4 mb-6">
              <a
                href="https://t.me/teoslinker_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{
                  padding: "15px 36px", borderRadius: 10,
                  fontSize: ".92rem", textDecoration: "none", display: "inline-block",
                }}
              >
                Start with 5 Free Scans →
              </a>
              <a
                href="#pricing"
                className="btn-ghost"
                style={{
                  padding: "15px 36px", borderRadius: 10,
                  fontSize: ".92rem", textDecoration: "none", display: "inline-block",
                }}
              >
                View Plans
              </a>
            </div>

            {/* Live system status */}
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.2)",
                borderRadius: 999, padding: "6px 16px",
              }}
            >
              <div className="live-dot" />
              <span style={{ fontFamily: "JetBrains Mono", fontSize: ".65rem", color: "#4ade80", letterSpacing: ".12em" }}>
                /scan · /deps · CREDITS · ACTIVATION — CORE SERVICES OPERATIONAL
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════ */}
        <footer
          style={{
            borderTop: "1px solid var(--border)",
            padding: "2.5rem 1.5rem",
            background: "var(--bg2)",
          }}
        >
          <div
            className="max-w-6xl mx-auto"
            style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 26, height: 26,
                  background: "linear-gradient(135deg,var(--gold),var(--gold-b))",
                  borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#040810" />
                  <path d="M9 12l2 2 4-4" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: ".85rem", color: "var(--muted)" }}>
                TEOS SENTINEL SHIELD
              </span>
            </div>

            <div style={{ display: "flex", gap: "2rem", fontFamily: "JetBrains Mono", fontSize: ".72rem", color: "var(--muted)" }}>
              {[
                { label: "Bot", href: "https://t.me/teoslinker_bot" },
                { label: "Community", href: "https://t.me/Elmahrosapi" },
                { label: "GitHub", href: "https://github.com/Elmahrosa/teos-sentinel-shield" },
                { label: "Contact", href: "mailto:ayman@teosegypt.com" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--muted)", textDecoration: "none", transition: "color .2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div style={{ fontFamily: "JetBrains Mono", fontSize: ".68rem", color: "var(--dim)" }}>
              © 2026 Elmahrosa International · Alexandria, Egypt
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}