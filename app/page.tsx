"use client";

import React, { useState, useEffect, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────
const TELEGRAM_BOT = "https://t.me/teoslinker_bot";
const GITHUB_REPO = "https://github.com/Elmahrosa";
const COMMUNITY = "https://t.me/Elmahrosapi";
const CONTACT_EMAIL = "mailto:ayman@teosegypt.com?subject=TEOS%20Sentinel%20Shield";

// Dodo payment links — live
const DODO_STARTER = "https://dodo.pe/tts";
const DODO_BUILDER = "https://dodo.pe/tts2";
const DODO_PRO = "https://dodo.pe/teos-pro";

// ─── Types ───────────────────────────────────────────────────
type Verdict = "ALLOW" | "WARN" | "BLOCK";

// ─── Inline SVG Icons (Lucide-style, zero dependencies) ─────
const Icons = {
  Shield: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Search: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Package: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/>
    </svg>
  ),
  Settings: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Zap: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Hexagon: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L21 7v10l-9 5-9-5V7z"/>
    </svg>
  ),
  MessageCircle: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8A8.5 8.5 0 0 1 12 20.5a8.38 8.38 0 0 1-3.8-.9L3 21l1.4-5.2A8.38 8.38 0 0 1 4 12a8.5 8.5 0 0 1 5.2-7.6A8.38 8.38 0 0 1 12 3.5"/>
    </svg>
  ),
  Coins: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.71.71-1.42 1.42"/>
    </svg>
  ),
  Bot: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
  ),
  ArrowRight: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  ExternalLink: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
    </svg>
  ),
  Github: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  ),
  Mail: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Globe: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Check: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  XCircle: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
    </svg>
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
  ),
};

// ─── Verdict Simulator (frontend-only demo) ──────────────────
const BLOCK_PATTERNS = [
  "rm -rf", "rm -r /", "drop table", "drop database",
  "format c:", "del /f /s /q", ":(){ :|:& };:", "chmod 777 /",
  "eval(", "exec(", "> /dev/sda", "dd if=/dev/zero",
  "require('child_process')", "os.system(", "subprocess.call",
];
const WARN_PATTERNS = [
  "curl", "wget", "bash <", "pip install", "npm install -g",
  "sudo", "chmod", "base64 -d", "| sh", "> /etc/",
];

function simulateVerdict(input: string): { verdict: Verdict; rule: string; score: number } {
  const lower = input.toLowerCase();
  for (const p of BLOCK_PATTERNS) {
    if (lower.includes(p)) return { verdict: "BLOCK", rule: "R01.DESTRUCTIVE_SHELL", score: 100 };
  }
  for (const p of WARN_PATTERNS) {
    if (lower.includes(p)) return { verdict: "WARN", rule: "R12.NETWORK_FETCH", score: 45 };
  }
  return { verdict: "ALLOW", rule: "PASS", score: 0 };
}

// ─── Sub-components ─────────────────────────────────────────
function LiveDot({ size = 8 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle, #4ade80 0%, #22c55e 100%)",
        boxShadow: "0 0 8px rgba(34,197,94,0.4), 0 0 2px rgba(34,197,94,0.8)",
        animation: "pulse-dot 2s ease-in-out infinite",
      }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold tracking-[0.18em] uppercase text-amber-400/90 mb-4 flex items-center gap-3">
      <span className="w-6 h-px bg-gradient-to-r from-amber-500/60 to-transparent" />
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function SentinelLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [scanInput, setScanInput] = useState("rm -rf /");
  const [scanResult, setScanResult] = useState<{
    verdict: Verdict;
    rule: string;
    score: number;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScan = useCallback(() => {
    if (!scanInput.trim()) return;
    setIsScanning(true);
    setTimeout(() => {
      setScanResult(simulateVerdict(scanInput));
      setIsScanning(false);
    }, 500);
  }, [scanInput]);

  const verdictColors: Record<Verdict, { bg: string; border: string; text: string; glow: string }> = {
    ALLOW: { bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.3)", text: "#4ade80", glow: "rgba(34,197,94,0.15)" },
    WARN:  { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.3)", text: "#fbbf24", glow: "rgba(245,158,11,0.15)" },
    BLOCK: { bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.3)",  text: "#f87171", glow: "rgba(239,68,68,0.15)" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth;background:#060b1a}
        body{background:#060b1a;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        ::selection{background:rgba(251,191,36,0.25);color:#fff}

        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}
        @keyframes fade-up{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-400% center}100%{background-position:400% center}}
        @keyframes scan-beam{0%{top:-2px}100%{top:calc(100% + 2px)}}
        @keyframes drift{0%{transform:translate(0,0) rotate(0deg)}100%{transform:translate(-40px,-40px) rotate(6deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes border-glow{0%,100%{border-color:rgba(251,191,36,0.15)}50%{border-color:rgba(251,191,36,0.45)}}

        .anim-fade-up{animation:fade-up .7s cubic-bezier(.22,1,.36,1) both}
        .anim-d1{animation-delay:.06s}.anim-d2{animation-delay:.14s}.anim-d3{animation-delay:.22s}.anim-d4{animation-delay:.32s}.anim-d5{animation-delay:.44s}

        .shimmer-gold{background:linear-gradient(90deg,#fbbf24,#fcd34d,#f59e0b,#fbbf24,#fcd34d);background-size:400% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 5s linear infinite}
        .shimmer-cyan{background:linear-gradient(90deg,#22d3ee,#67e8f9,#06b6d4,#22d3ee);background-size:400% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}

        .glass-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);transition:all .35s ease}
        .glass-card:hover{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.04);transform:translateY(-2px);box-shadow:0 20px 48px rgba(0,0,0,.4),0 0 0 1px rgba(251,191,36,.08)}

        .glass-card-featured{background:rgba(251,191,36,.025);border:1px solid rgba(251,191,36,.2);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);animation:border-glow 4s ease-in-out infinite;transition:all .35s ease}
        .glass-card-featured:hover{border-color:rgba(251,191,36,.5);background:rgba(251,191,36,.05);transform:translateY(-3px);box-shadow:0 24px 56px rgba(0,0,0,.5),0 0 32px rgba(251,191,36,.08)}

        .grid-bg{background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:56px 56px}

        .terminal-window{background:rgba(4,8,20,.95);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04)}

        .scan-line{position:absolute;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,rgba(6,182,212,.6),transparent);animation:scan-beam 2.8s ease-in-out infinite;pointer-events:none;z-index:1}

        .verdict-card-allow{border-left:3px solid #22c55e}
        .verdict-card-warn{border-left:3px solid #f59e0b}
        .verdict-card-block{border-left:3px solid #ef4444}

        .hero-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px);opacity:.4}

        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#060b1a}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:4px}

        @media(max-width:768px){.hide-mobile{display:none!important}.hero-term{display:none!important}}
      `}</style>

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 flex items-center justify-between transition-all duration-500"
        style={{
          height: scrolled ? 56 : 68,
          background: scrolled ? "rgba(6,11,26,0.92)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        }}
      >
        <a href="#" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)" }}>
            <Icons.Hexagon className="w-4 h-4 text-[#060b1a]" />
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">
            TEOS<span className="text-amber-400">.</span>Sentinel
          </span>
        </a>
        <div className="hide-mobile flex items-center gap-8">
          {[
            ["#how", "How It Works"],
            ["#features", "Capabilities"],
            ["#pricing", "Pricing"],
            ["#roadmap", "Roadmap"],
          ].map(([href, label]) => (
            <a key={href} href={href}
              className="text-[13px] text-slate-400 hover:text-amber-300 transition-colors duration-200 no-underline font-medium tracking-wide">
              {label}
            </a>
          ))}
        </div>
        <a href={TELEGRAM_BOT} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#060b1a] font-bold rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(251,191,36,.35)] no-underline py-2 px-4 text-[13px]">
          <Icons.Bot className="w-4 h-4" />
          Launch Bot
        </a>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section id="hero" className="relative pt-36 md:pt-44 pb-20 md:pb-28 px-6 overflow-hidden grid-bg">
        {/* Ambient orbs */}
        <div className="hero-orb w-[600px] h-[600px] top-[-150px] left-[-100px]" style={{ background: "radial-gradient(circle, rgba(6,182,212,.12) 0%, transparent 70%)" }} />
        <div className="hero-orb w-[500px] h-[500px] bottom-[-100px] right-[-80px]" style={{ background: "radial-gradient(circle, rgba(251,191,36,.1) 0%, transparent 70%)" }} />
        <div className="hero-orb w-[300px] h-[300px] top-[40%] left-[50%] -translate-x-1/2 opacity-30" style={{ background: "radial-gradient(circle, rgba(139,92,246,.08) 0%, transparent 70%)" }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column */}
            <div>
              <div className="anim-fade-up flex items-center gap-3 mb-6">
                <LiveDot />
                <span className="text-[11px] font-mono text-emerald-400 tracking-[0.14em] uppercase font-medium">
                  Core Services Operational
                </span>
              </div>

              <h1 className="anim-fade-up anim-d1 text-[clamp(40px,5.5vw,64px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white mb-5">
                Pre-Execution<br />
                <span className="shimmer-gold">Security Guardrails</span><br />
                <span className="text-slate-300">for Autonomous AI</span>
              </h1>

              <p className="anim-fade-up anim-d2 text-slate-400/90 text-[15px] leading-relaxed max-w-[460px] mb-8">
                Rule-driven validation for AI-generated code, dependency manifests, and CI/CD workflows — delivered through a Telegram access layer with structured ALLOW / WARN / BLOCK verdicts.
              </p>

              {/* Flow */}
              <div className="anim-fade-up anim-d3 flex items-center gap-2 mb-8 text-sm">
                <span className="text-slate-400 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 font-medium">Generate</span>
                <Icons.ArrowRight className="w-4 h-4 text-amber-500/60" />
                <span className="text-amber-300 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg px-4 py-2.5 font-bold flex items-center gap-1.5">
                  <Icons.Hexagon className="w-4 h-4" /> Validate
                </span>
                <Icons.ArrowRight className="w-4 h-4 text-amber-500/60" />
                <span className="text-slate-400 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 font-medium">Execute</span>
              </div>

              {/* CTAs */}
              <div className="anim-fade-up anim-d3 flex flex-wrap gap-3 mb-8">
                <a href={TELEGRAM_BOT} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#060b1a] font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(251,191,36,.35)] no-underline px-6 py-3.5 text-[15px]">
                  Start Free — 5 Scans
                  <Icons.ArrowRight className="w-4 h-4" />
                </a>
                <a href="#how"
                  className="inline-flex items-center gap-2 bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.1] transition-all duration-200 hover:border-amber-500/30 hover:text-amber-300 hover:bg-amber-500/[0.04] no-underline px-6 py-3.5 text-[15px]">
                  How It Works
                </a>
                <a href="#pricing"
                  className="inline-flex items-center gap-2 bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.1] transition-all duration-200 hover:border-amber-500/30 hover:text-amber-300 hover:bg-amber-500/[0.04] no-underline px-6 py-3.5 text-[15px]">
                  View Plans
                </a>
              </div>

              {/* Trust pills */}
              <div className="anim-fade-up anim-d4 flex flex-wrap gap-2 mb-6">
                {[
                  { label: "ALLOW / WARN / BLOCK" },
                  { label: "Dependency Audit", live: true },
                  { label: "CI Security Checks", live: true },
                ].map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full border border-cyan-500/15 bg-cyan-500/[0.04] text-cyan-300">
                    {p.live && <LiveDot size={6} />}
                    {p.label}
                  </span>
                ))}
              </div>

              {/* Trust bar */}
              <div className="anim-fade-up anim-d5 flex flex-wrap rounded-xl border border-white/[0.05] bg-white/[0.01] overflow-hidden">
                {[
                  { icon: "Hexagon", text: "Rule-Driven Verdicts" },
                  { icon: "Package", text: "Supply Chain Checks" },
                  { icon: "Settings", text: "CI Workflow Audit" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5 text-[11px] text-slate-500 tracking-wide border-r border-white/[0.04] last:border-r-0 flex-1 justify-center min-w-[120px]">
                    {React.createElement(Icons[item.icon as keyof typeof Icons], { className: "w-4 h-4 text-slate-400" })}
                    <span className="whitespace-nowrap font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Terminal Preview */}
            <div className="anim-fade-up anim-d3 flex justify-center lg:justify-end hero-term">
              <div className="terminal-window w-full max-w-[440px] relative">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                  <span className="ml-3 text-[11px] text-slate-500 font-mono">teos-sentinel — live</span>
                  <LiveDot size={7} />
                </div>
                <div className="relative p-5 min-h-[280px] text-[12px] font-mono">
                  <div className="scan-line" />
                  <div className="text-slate-500 mb-2">$ <span className="text-cyan-400">/scan</span></div>
                  <div className="text-slate-600 mb-1 text-[10px] uppercase tracking-wider">Input</div>
                  <div className="bg-black/40 border border-white/[0.05] rounded-lg p-3 mb-4 text-red-400/80 break-all leading-relaxed">
                    rm -rf /
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] font-bold tracking-widest px-3 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                      ✕ BLOCK
                    </span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">RULE</span>
                      <span className="text-slate-300">R01.DESTRUCTIVE_SHELL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RISK SCORE</span>
                      <span className="text-red-400 font-bold">100/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ACTION</span>
                      <span className="text-red-400">Execution Halted</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PROOF STRIP ═══════════ */}
      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { label: "Telegram Bot Live", live: true },
            { label: "25 Rule Checks" },
            { label: "Dependency Scanner" },
            { label: "CI/CD Scanner" },
            { label: "37 Tests Passing", live: true },
            { label: "Engine v2 Stable", live: true },
          ].map((item, i) => (
            <div key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.05] bg-white/[0.01] text-[11px] text-slate-400 whitespace-nowrap font-medium">
              {item.live && <LiveDot size={6} />}
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how" className="px-6 py-24 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto text-center">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-[clamp(30px,4vw,44px)] font-extrabold tracking-[-0.025em] text-white mb-16">
            Three Phases.<br className="md:hidden" /> Zero Assumed Trust.
          </h2>

          <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-center">
            {/* Generate */}
            <div className="glass-card rounded-2xl p-7 text-center group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-white/[0.03] border border-white/[0.06] group-hover:border-cyan-500/30 transition-colors">
                <Icons.Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-600 tracking-[0.16em] mb-2">PHASE 01</div>
              <h3 className="text-lg font-bold text-slate-200 mb-2.5">Generate</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">AI agents and developers produce code, package manifests, or CI workflow files.</p>
            </div>

            <div className="text-amber-500/40 text-2xl font-light text-center hidden md:block">→</div>

            {/* Validate */}
            <div className="glass-card-featured rounded-2xl p-7 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg, rgba(251,191,36,.15), rgba(251,191,36,.04))", border: "1px solid rgba(251,191,36,.25)" }}>
                <Icons.Hexagon className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-[10px] font-mono text-amber-600/60 tracking-[0.16em] mb-2">PHASE 02</div>
              <h3 className="text-lg font-bold text-amber-300 mb-2.5">Validate</h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">TEOS Sentinel intercepts and applies rule-driven risk checks across code, deps, and CI config.</p>
            </div>

            <div className="text-amber-500/40 text-2xl font-light text-center hidden md:block">→</div>

            {/* Execute */}
            <div className="glass-card rounded-2xl p-7 text-center group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-white/[0.03] border border-white/[0.06] group-hover:border-emerald-500/30 transition-colors">
                <Icons.CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-600 tracking-[0.16em] mb-2">PHASE 03</div>
              <h3 className="text-lg font-bold text-slate-200 mb-2.5">Execute</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">ALLOW proceeds. WARN flags for review. BLOCK halts execution before damage occurs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="px-6 py-24 border-t border-white/[0.04] bg-white/[0.005]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Live Capabilities</SectionLabel>
            <h2 className="text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-white mb-4">
              Current Product Capabilities
            </h2>
            <p className="text-[15px] text-slate-500 max-w-[480px] mx-auto leading-relaxed">
              Capabilities shown reflect the current live product scope.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "Search", title: "Code Risk Scan", badge: "/scan", badgeLive: true, body: "Detects destructive shell commands, eval/exec abuse, command injection, subprocess misuse, chmod issues, secret leakage, and base64 execution patterns." },
              { icon: "Package", title: "Dependency Audit", badge: "/deps", badgeLive: true, body: "Resolves package manifests and checks for supply chain risks, malicious packages, and dependency confusion vulnerabilities." },
              { icon: "Settings", title: "CI Workflow Audit", badge: "PRO", badgePro: true, body: "Inspects CI workflow files for privilege escalation, secret exposure, insecure runners, and deployment pipeline risks. Available on Pro tier." },
              { icon: "Coins", title: "Persistent Credits", badge: "Automatic", badgeLive: true, body: "Scan credits persist across sessions. Purchase once, use continuously. Server-side state managed by a hardened activation service." },
              { icon: "MessageCircle", title: "Telegram Gateway", badge: "@teoslinker_bot", badgeLive: true, body: "A purpose-built Telegram bot serving as the primary interface. Instant scan access with no app installs required." },
              { icon: "Bot", title: "Sovereign Runtime", badge: "Persistent", badgeLive: true, body: "PM2-managed persistent services on sovereign-first infrastructure. No serverless cold starts. Designed for continuously available execution control." },
            ].map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.05] group-hover:border-amber-500/20 transition-colors">
                    {React.createElement(Icons[f.icon as keyof typeof Icons], { className: "w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors" })}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md ${f.badgePro ? "bg-amber-500/8 text-amber-400 border border-amber-500/15" : "bg-cyan-500/[0.06] text-cyan-400 border border-cyan-500/12"}`}>
                    {f.badgeLive && <LiveDot size={5} />} {f.badge}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-slate-200 mb-2">{f.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ VERDICT ENGINE ═══════════ */}
      <section id="verdicts" className="px-6 py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Verdict Engine</SectionLabel>
            <h2 className="text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-white mb-4">
              Three Verdicts. No Ambiguity.
            </h2>
            <p className="text-[15px] text-slate-500 max-w-[520px] mx-auto leading-relaxed">
              Every scan produces a deterministic verdict — ALLOW, WARN, or BLOCK — with structured reasoning your agents can act on.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* ALLOW */}
            <div className="glass-card verdict-card-allow rounded-xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.03] bg-white/[0.01]">
                <span className="w-2 h-2 rounded-full bg-red-400/70" /><span className="w-2 h-2 rounded-full bg-amber-400/70" /><span className="w-2 h-2 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-[10px] text-slate-600 font-mono">/scan</span>
              </div>
              <div className="p-5">
                <div className="text-[10px] text-slate-600 mb-1 font-mono uppercase tracking-wider">Input</div>
                <div className="bg-black/30 border border-white/[0.04] rounded-lg p-3 mb-4 text-[11px] font-mono text-slate-400 break-all leading-relaxed">
                  import hashlib{"\n"}data = b"hello"{"\n"}hashlib.sha256(data).hexdigest()
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold font-mono tracking-widest px-3 py-1 rounded-md mb-3 bg-emerald-500/8 text-emerald-400 border border-emerald-500/20">
                  <Icons.Check className="w-3 h-3" /> ALLOW
                </span>
                <div className="text-[11px] font-mono space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-600">REASON</span><span className="text-slate-300">No I/O, no execution. Safe.</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">RISK</span><span className="text-emerald-400">NONE</span></div>
                </div>
              </div>
            </div>

            {/* WARN */}
            <div className="glass-card verdict-card-warn rounded-xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.03] bg-white/[0.01]">
                <span className="w-2 h-2 rounded-full bg-red-400/70" /><span className="w-2 h-2 rounded-full bg-amber-400/70" /><span className="w-2 h-2 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-[10px] text-slate-600 font-mono">/scan</span>
              </div>
              <div className="p-5">
                <div className="text-[10px] text-slate-600 mb-1 font-mono uppercase tracking-wider">Input</div>
                <div className="bg-black/30 border border-white/[0.04] rounded-lg p-3 mb-4 text-[11px] font-mono text-slate-400 break-all leading-relaxed">
                  import subprocess{"\n"}subprocess.run(["ls", "-la"])
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold font-mono tracking-widest px-3 py-1 rounded-md mb-3 bg-amber-500/8 text-amber-400 border border-amber-500/20">
                  <Icons.AlertTriangle className="w-3 h-3" /> WARN
                </span>
                <div className="text-[11px] font-mono space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-600">REASON</span><span className="text-slate-300">Subprocess call. Scoped to listing.</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">RISK</span><span className="text-amber-400">LOW</span></div>
                </div>
              </div>
            </div>

            {/* BLOCK */}
            <div className="glass-card verdict-card-block rounded-xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.03] bg-white/[0.01]">
                <span className="w-2 h-2 rounded-full bg-red-400/70" /><span className="w-2 h-2 rounded-full bg-amber-400/70" /><span className="w-2 h-2 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-[10px] text-slate-600 font-mono">/scan</span>
              </div>
              <div className="p-5">
                <div className="text-[10px] text-slate-600 mb-1 font-mono uppercase tracking-wider">Input</div>
                <div className="bg-black/30 border border-white/[0.04] rounded-lg p-3 mb-4 text-[11px] font-mono text-red-400/70 break-all leading-relaxed">
                  eval(require("child_process").exec("rm -rf /"))
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold font-mono tracking-widest px-3 py-1 rounded-md mb-3 bg-red-500/8 text-red-400 border border-red-500/20">
                  <Icons.XCircle className="w-3 h-3" /> BLOCK
                </span>
                <div className="text-[11px] font-mono space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-600">REASON</span><span className="text-slate-300">Shell injection via eval + exec</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">RISK</span><span className="text-red-400">CRITICAL</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ INTERACTIVE DEMO ═══════════ */}
      <section className="px-6 py-24 border-t border-white/[0.04] bg-white/[0.005]">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>Interactive Preview</SectionLabel>
          <h2 className="text-[clamp(24px,4vw,36px)] font-extrabold tracking-[-0.02em] text-white mb-3">
            Try the Rule Engine
          </h2>
          <p className="text-[14px] text-slate-500 mb-10">
            Simulation for demonstration only. Production verdicts are generated by the live MCP risk engine.
          </p>

          <div className="glass-card rounded-2xl p-6 text-left">
            <label className="text-[11px] text-slate-500 font-mono block mb-2.5 uppercase tracking-wider">
              Input — Enter a shell command
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="text" value={scanInput}
                onChange={(e) => { setScanInput(e.target.value); setScanResult(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleScan(); }}
                className="flex-1 bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] font-mono text-slate-200 outline-none transition-all focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 placeholder:text-slate-600"
                placeholder="rm -rf /"
              />
              <button onClick={handleScan} disabled={isScanning}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-[#060b1a] font-bold rounded-xl px-6 py-3 text-[14px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(251,191,36,.3)] cursor-pointer disabled:cursor-not-allowed whitespace-nowrap">
                {isScanning ? "Scanning..." : "Run Scan"}
              </button>
            </div>

            {scanResult && (
              <div className="rounded-xl p-5 transition-all duration-300"
                style={{
                  background: verdictColors[scanResult.verdict].bg,
                  border: `1px solid ${verdictColors[scanResult.verdict].border}`,
                  boxShadow: `0 0 24px ${verdictColors[scanResult.verdict].glow}`,
                }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-extrabold font-mono" style={{ color: verdictColors[scanResult.verdict].text }}>
                    {scanResult.verdict === "ALLOW" ? "✓" : scanResult.verdict === "WARN" ? "⚠" : "✕"}
                  </span>
                  <span className="text-xl font-extrabold font-mono tracking-widest" style={{ color: verdictColors[scanResult.verdict].text }}>
                    {scanResult.verdict}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[12px] font-mono">
                  <div><div className="text-slate-500 mb-1">RULE</div><div className="text-slate-200">{scanResult.rule}</div></div>
                  <div><div className="text-slate-500 mb-1">RISK SCORE</div><div className="text-slate-200 font-bold">{scanResult.score}/100</div></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="px-6 py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto text-center">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-white mb-3">
            Start Free. Scale When Ready.
          </h2>
          <p className="text-[15px] text-slate-500 max-w-[440px] mx-auto mb-3 leading-relaxed">
            No trial periods. No credit card required for free tier. Credits persist across sessions.
          </p>
          <p className="text-[12px] text-slate-600 max-w-[560px] mx-auto mb-14 leading-relaxed">
            Digital access. Scan credits activate after payment. Payments are non‑refundable once access is delivered.
          </p>

          <div className="grid md:grid-cols-5 gap-3 items-start">
            {/* Free */}
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-1">Free</h3>
                <div className="flex items-baseline gap-1"><span className="text-3xl font-extrabold text-white">$0</span><span className="text-xs text-slate-500">forever</span></div>
                <span className="inline-block mt-2 text-[10px] font-mono text-cyan-400/80 bg-cyan-500/[0.06] border border-cyan-500/12 rounded-md px-2.5 py-1">5 scans</span>
              </div>
              <ul className="flex flex-col gap-2 flex-1 text-left">
                {["Code risk scan (/scan)","Telegram bot access","ALLOW/WARN/BLOCK verdicts","Structured risk output"].map((f,i)=>(<li key={i} className="flex items-start gap-2 text-[12px] text-slate-400"><Icons.Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"/>{f}</li>))}
              </ul>
              <a href={TELEGRAM_BOT} target="_blank" rel="noopener noreferrer" className="block text-center bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.1] hover:border-amber-500/30 hover:text-amber-300 no-underline py-2.5 text-[13px] transition-all">Start Free</a>
            </div>

            {/* Starter */}
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-1">Starter</h3>
                <div className="flex items-baseline gap-1"><span className="text-3xl font-extrabold text-white">$9</span><span className="text-xs text-slate-500">/month</span></div>
                <span className="inline-block mt-2 text-[10px] font-mono text-cyan-400/80 bg-cyan-500/[0.06] border border-cyan-500/12 rounded-md px-2.5 py-1">50 scans/month</span>
              </div>
              <ul className="flex flex-col gap-2 flex-1 text-left">
                {["Code risk scan (/scan)","Persistent credit balance","Full scan history","Audit log access"].map((f,i)=>(<li key={i} className="flex items-start gap-2 text-[12px] text-slate-400"><Icons.Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"/>{f}</li>))}
              </ul>
              <a href={DODO_STARTER} target="_blank" rel="noopener noreferrer" className="block text-center bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.1] hover:border-amber-500/30 hover:text-amber-300 no-underline py-2.5 text-[13px] transition-all">Get Starter</a>
            </div>

            {/* Builder (Featured) */}
            <div className="glass-card-featured rounded-2xl p-6 flex flex-col gap-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-600 text-[#060b1a] text-[10px] font-extrabold tracking-[0.12em] uppercase px-4 py-1 rounded-full whitespace-nowrap">Recommended</div>
              <div>
                <h3 className="text-sm font-bold text-amber-300 mb-1">Builder</h3>
                <div className="flex items-baseline gap-1"><span className="text-3xl font-extrabold text-white">$49</span><span className="text-xs text-slate-500">/month</span></div>
                <span className="inline-block mt-2 text-[10px] font-mono text-amber-400/80 bg-amber-500/[0.06] border border-amber-500/12 rounded-md px-2.5 py-1">500 scans/month</span>
              </div>
              <ul className="flex flex-col gap-2 flex-1 text-left">
                {["Code risk scan (/scan)","Dependency audit (/deps)","CI/CD scan access","500 persistent credits","Priority support"].map((f,i)=>(<li key={i} className="flex items-start gap-2 text-[12px] text-slate-300"><Icons.Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5"/>{f}</li>))}
              </ul>
              <a href={DODO_BUILDER} target="_blank" rel="noopener noreferrer" className="block text-center bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#060b1a] font-bold rounded-xl no-underline py-2.5 text-[13px] transition-all hover:-translate-y-0.5">Get Builder</a>
            </div>

            {/* Pro */}
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-1">Pro</h3>
                <div className="flex items-baseline gap-1"><span className="text-3xl font-extrabold text-white">$99</span><span className="text-xs text-slate-500">/month</span></div>
                <span className="inline-block mt-2 text-[10px] font-mono text-cyan-400/80 bg-cyan-500/[0.06] border border-cyan-500/12 rounded-md px-2.5 py-1">1,000 scans/month</span>
              </div>
              <ul className="flex flex-col gap-2 flex-1 text-left">
                {["Code + Dependency scans","CI Workflow Audit","1,000 persistent credits","Team/security workflow use","Audit logs"].map((f,i)=>(<li key={i} className="flex items-start gap-2 text-[12px] text-slate-400"><Icons.Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"/>{f}</li>))}
              </ul>
              <a href={DODO_PRO} target="_blank" rel="noopener noreferrer" className="block text-center bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.1] hover:border-amber-500/30 hover:text-amber-300 no-underline py-2.5 text-[13px] transition-all">Get Pro</a>
            </div>

            {/* Enterprise */}
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-1">Enterprise</h3>
                <div className="flex items-baseline gap-1"><span className="text-2xl font-extrabold text-white">Custom</span></div>
                <span className="inline-block mt-2 text-[10px] font-mono text-cyan-400/80 bg-cyan-500/[0.06] border border-cyan-500/12 rounded-md px-2.5 py-1">Unlimited</span>
              </div>
              <ul className="flex flex-col gap-2 flex-1 text-left">
                {["Self-hosted deployment","Custom onboarding","Audit logging","Dedicated support","Deployment support"].map((f,i)=>(<li key={i} className="flex items-start gap-2 text-[12px] text-slate-400"><Icons.Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"/>{f}</li>))}
              </ul>
              <a href={CONTACT_EMAIL} className="block text-center bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.1] hover:border-amber-500/30 hover:text-amber-300 no-underline py-2.5 text-[13px] transition-all">Contact Us</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ ROADMAP ═══════════ */}
      <section id="roadmap" className="px-6 py-24 border-t border-white/[0.04] bg-white/[0.005]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Roadmap</SectionLabel>
            <h2 className="text-[clamp(26px,4vw,36px)] font-extrabold tracking-[-0.02em] text-white mb-3">
              What's Coming in v2.1
            </h2>
            <p className="text-[14px] text-slate-500">Current development priorities as of May 2026.</p>
          </div>

          <div className="glass-card rounded-2xl py-3 px-6">
            {[
              { label: "AST precision improvements", status: "In Progress" },
              { label: "OSV vulnerability lookup integration", status: "Planned" },
              { label: "GitHub CI integrations", status: "Planned" },
              { label: "Enterprise onboarding flow", status: "Planned" },
              { label: "VPS / self-host hardening guide", status: "Planned" },
              { label: "First 20-user acquisition sprint", status: "Active" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3.5 border-b border-white/[0.03] last:border-b-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === "In Progress" || item.status === "Active" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,.5)]" : "bg-slate-700"}`} />
                <span className="text-[14px] text-slate-300 flex-1">{item.label}</span>
                <span className={`text-[10px] font-mono tracking-wider flex-shrink-0 ${item.status === "In Progress" || item.status === "Active" ? "text-amber-400" : "text-slate-600"}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BUILT BY ═══════════ */}
      <section className="px-6 py-24 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,.12), rgba(6,182,212,.08))", border: "1px solid rgba(251,191,36,.2)" }}>
            <Icons.Shield className="w-7 h-7 text-amber-400" />
          </div>
          <SectionLabel>Built By</SectionLabel>
          <h2 className="text-2xl font-extrabold text-white mb-2">Elmahrosa International</h2>
          <p className="text-cyan-300 font-semibold mb-4">Execution Control Infrastructure for Autonomous Systems</p>
          <p className="text-[14px] text-slate-500 leading-relaxed max-w-[520px] mx-auto mb-8">
            Founded in Alexandria, Egypt. Building security infrastructure for the next generation of autonomous AI — from agent-native validation engines to deployment‑ready security tooling.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={COMMUNITY} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.1] hover:border-amber-500/30 hover:text-amber-300 no-underline px-5 py-2.5 text-[13px] transition-all"><Icons.Globe className="w-4 h-4"/>Community</a>
            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.1] hover:border-amber-500/30 hover:text-amber-300 no-underline px-5 py-2.5 text-[13px] transition-all"><Icons.Github className="w-4 h-4"/>GitHub</a>
            <a href={CONTACT_EMAIL} className="inline-flex items-center gap-2 bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.1] hover:border-amber-500/30 hover:text-amber-300 no-underline px-5 py-2.5 text-[13px] transition-all"><Icons.Mail className="w-4 h-4"/>Contact</a>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="px-6 py-28 text-center relative overflow-hidden" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(251,191,36,.06) 0%, transparent 70%),radial-gradient(ellipse 40% 25% at 50% 100%, rgba(6,182,212,.04) 0%, transparent 60%),#060b1a" }}>
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative max-w-[600px] mx-auto">
          <SectionLabel>Get Started</SectionLabel>
          <h2 className="text-[clamp(30px,5vw,52px)] font-extrabold tracking-[-0.03em] text-white leading-[1.1] mb-5">
            Pre‑Execution Guardrails<br />
            <span className="shimmer-gold">for Autonomous Systems</span>
          </h2>
          <p className="text-[15px] text-slate-400 leading-relaxed max-w-[440px] mx-auto mb-8">
            Start validating AI-generated code today. Five free scans. Open the bot and run{" "}
            <span className="text-cyan-300 font-bold font-mono">/scan</span> in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <a href={TELEGRAM_BOT} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#060b1a] font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(251,191,36,.35)] no-underline px-7 py-4 text-[16px]">
              Start with 5 Free Scans <Icons.ArrowRight className="w-5 h-5" />
            </a>
            <a href="#pricing"
              className="inline-flex items-center gap-2 bg-transparent text-slate-300 font-semibold rounded-xl border border-white/[0.12] hover:border-amber-500/30 hover:text-amber-300 no-underline px-7 py-4 text-[16px] transition-all">
              View Plans
            </a>
          </div>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.03]">
            <LiveDot />
            <span className="text-[10px] font-mono text-emerald-400 tracking-[0.1em] uppercase font-medium">
              /scan · /deps · CREDITS — Core Services Operational
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="px-6 py-8 border-t border-white/[0.04] bg-white/[0.005]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#fbbf24,#d97706)" }}>
              <Icons.Hexagon className="w-3.5 h-3.5 text-[#060b1a]" />
            </div>
            <span className="text-[12px] text-slate-500 font-medium">TEOS Sentinel Shield · Elmahrosa International · Alexandria, EG</span>
          </div>
          <div className="flex gap-6 text-[12px]">
            <a href={TELEGRAM_BOT} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-400 transition-colors no-underline">Bot</a>
            <a href={COMMUNITY} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-400 transition-colors no-underline">Community</a>
            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-400 transition-colors no-underline">GitHub</a>
            <a href={CONTACT_EMAIL} className="text-slate-500 hover:text-amber-400 transition-colors no-underline">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}