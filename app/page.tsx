"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────
const TELEGRAM_BOT = "https://t.me/teoslinker_bot";
const GITHUB_REPO = "https://github.com/Elmahrosa";
const COMMUNITY = "https://t.me/Elmahrosapi";
const CONTACT_EMAIL = "mailto:ayman@teosegypt.com?subject=TEOS%20Sentinel%20Shield";
const UPGRADE_LINK = TELEGRAM_BOT;

// ─── Types ───────────────────────────────────────────────────
type Verdict = "ALLOW" | "WARN" | "BLOCK";

interface VerdictStyle {
  color: string;
  bg: string;
  border: string;
  textColor: string;
  glyph: string;
}

// ─── Inline SVG icon provider ────────────────────────────────
const iconPaths: Record<string, JSX.Element> = {
  hexagon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L21 7v10l-9 5-9-5V7z" />
    </svg>
  ),
  box: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <line x1="12" y1="12" x2="20" y2="7.5" />
      <line x1="12" y1="12" x2="4" y2="7.5" />
    </svg>
  ),
  gear: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  messaging: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8A8.5 8.5 0 0112 20.5a8.38 8.38 0 01-3.8-.9L3 21l1.4-5.2A8.38 8.38 0 014 12a8.5 8.5 0 015.2-7.6A8.38 8.38 0 0112 3.5" />
    </svg>
  ),
  lightning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  magnifier: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  coin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <text x="12" y="16" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">$</text>
    </svg>
  ),
  robot: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 3v4M8 3v4M16 3v4M10 14h4M9 17h6" />
    </svg>
  ),
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ lineHeight: 1 }}>
      {iconPaths[name] ?? null}
    </span>
  );
}

// ─── Verdict Simulator (frontend‑only demo) ──────────────────
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

const VERDICT_STYLES: Record<Verdict, VerdictStyle> = {
  ALLOW: { color: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.25)", textColor: "#4ade80", glyph: "✓" },
  WARN:  { color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.25)", textColor: "#fbbf24", glyph: "⚠" },
  BLOCK: { color: "#ef4444", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.25)",  textColor: "#f87171", glyph: "✕" },
};

// ─── Live Dot Component ──────────────────────────────────────
function LiveDot({ size = 8 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: "#22c55e",
        boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
        animation: "pulse-dot 2s ease-in-out infinite",
      }}
    />
  );
}

// ─── Nav Link ────────────────────────────────────────────────
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm text-slate-400 hover:text-amber-400 transition-colors duration-200 no-underline font-medium tracking-wide"
    >
      {children}
    </a>
  );
}

// ─── Section Label ───────────────────────────────────────────
function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`text-[11px] font-semibold tracking-[0.15em] uppercase text-amber-400 mb-4 ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────
function Card({
  children,
  className = "",
  featured = false,
}: {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-300 border ${
        featured
          ? "border-amber-500/30 bg-amber-500/[0.03] shadow-[0_0_0_1px_rgba(251,191,36,0.15),0_0_60px_rgba(251,191,36,0.05)]"
          : "border-white/[0.07] bg-white/[0.02] hover:border-amber-500/20 hover:bg-white/[0.04]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Button Variants ─────────────────────────────────────────
function ButtonPrimary({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-[#080c12] font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(251,191,36,0.35)] no-underline ${className}`}
      style={{ padding: "12px 24px", fontSize: 14, letterSpacing: "0.01em" }}
    >
      {children}
    </a>
  );
}

function ButtonGhost({
  href,
  children,
  className = "",
  isExternal = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  isExternal?: boolean;
}) {
  const externalProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a
      href={href}
      {...externalProps}
      className={`inline-flex items-center gap-2 bg-transparent text-slate-300 font-medium rounded-lg border border-white/[0.12] transition-all duration-200 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/[0.04] no-underline ${className}`}
      style={{ padding: "12px 24px", fontSize: 14 }}
    >
      {children}
    </a>
  );
}

// ─── Price Card ──────────────────────────────────────────────
function PriceCard({
  name,
  price,
  period,
  scanLimit,
  features,
  href,
  featured = false,
  isExternal = true,
}: {
  name: string;
  price: string;
  period: string;
  scanLimit: string;
  features: string[];
  href: string;
  featured?: boolean;
  isExternal?: boolean;
}) {
  return (
    <Card featured={featured} className="flex flex-col gap-5 relative">
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-br from-amber-400 to-amber-600 text-[#080c12] text-[10px] font-bold tracking-[0.12em] uppercase px-4 py-1 rounded-full whitespace-nowrap">
          Recommended
        </div>
      )}
      <div>
        <div className={`text-sm font-semibold mb-2 ${featured ? "text-amber-400" : "text-slate-300"}`}>
          {name}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-100 tracking-tight">{price}</span>
          <span className="text-xs text-slate-500">{period}</span>
        </div>
        <div className="mt-1.5">
          <span className="text-[11px] font-mono text-sky-400/80 bg-sky-500/[0.08] border border-sky-500/15 rounded-md px-2.5 py-1">
            {scanLimit}
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5 flex-1 list-none p-0 m-0">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-400 leading-relaxed">
            <span className={featured ? "text-amber-400 flex-shrink-0 mt-0.5" : "text-emerald-400 flex-shrink-0 mt-0.5"}>
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {featured ? (
        <ButtonPrimary href={href} className="justify-center w-full text-sm">
          Get {name}
        </ButtonPrimary>
      ) : (
        <ButtonGhost href={href} isExternal={isExternal} className="justify-center w-full text-sm">
          {name === "Free" ? "Start Free" : name === "Enterprise" ? "Contact Us" : `Get ${name}`}
        </ButtonGhost>
      )}
    </Card>
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
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScan = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => {
      setScanResult(simulateVerdict(scanInput));
      setIsScanning(false);
    }, 400);
  }, [scanInput]);

  const vs = scanResult ? VERDICT_STYLES[scanResult.verdict] : null;

  return (
    <>
      {/* ─── Global Styles & Animations ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; background: #080c12; }
        body { background: #080c12; color: #e2e8f0; font-family: 'DM Sans', 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }

        ::selection { background: rgba(251,191,36,0.22); color: #f8fafc; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes scan-beam {
          0%, 100% { top: -2px; }
          100% { top: calc(100% + 2px); }
        }
        .animate-fade-up {
          animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .animate-fade-up-d1 { animation-delay: 0.08s; }
        .animate-fade-up-d2 { animation-delay: 0.16s; }
        .animate-fade-up-d3 { animation-delay: 0.24s; }
        .animate-fade-up-d4 { animation-delay: 0.32s; }

        .shimmer-gold {
          background: linear-gradient(90deg, #fbbf24, #fcd34d, #fbbf24, #f59e0b);
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .grid-bg-subtle {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .terminal-frame {
          background: #040810;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          font-family: 'DM Mono', 'JetBrains Mono', monospace;
          box-shadow: 0 24px 64px rgba(0,0,0,0.7);
        }
        .terminal-bar {
          background: rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          padding: 0.6rem 1rem;
          gap: 0.5rem;
        }
        .terminal-dot { width: 10px; height: 10px; border-radius: 50%; }

        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          animation: scan-beam 2.4s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }

        .verdict-card {
          border-left: 3px solid;
          border-radius: 8px;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080c12; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* ─── NAVIGATION ─────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 flex items-center justify-between transition-all duration-300"
        style={{
          height: 60,
          background: scrolled ? "rgba(8,12,18,0.94)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#080c12" />
              <path d="M9 12l2 2 4-4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-slate-100 tracking-tight">
            TEOS<span className="text-amber-400">.</span>Sentinel
          </span>
        </div>
        <div className="hide-mobile flex items-center gap-8">
          <NavLink href="#how-it-works">How It Works</NavLink>
          <NavLink href="#features">Capabilities</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#roadmap">Roadmap</NavLink>
        </div>
        <ButtonPrimary href={TELEGRAM_BOT} className="!py-2 !px-5 !text-[13px]">
          Launch Bot
        </ButtonPrimary>
      </nav>

      {/* ─── HERO ──────────────────────────────────────── */}
      <section
        id="hero"
        className="relative pt-40 pb-24 px-6 overflow-hidden grid-bg-subtle"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,0.04) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 60%, rgba(251,191,36,0.04) 0%, transparent 60%)",
        }}
      >
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[5%] right-[8%] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)" }} />

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="animate-fade-up flex items-center gap-3 mb-6">
                <LiveDot />
                <span className="text-[11px] font-mono text-emerald-400 tracking-[0.15em] uppercase font-medium">
                  Core Services Operational
                </span>
              </div>

              <h1 className="animate-fade-up animate-fade-up-d1 text-[clamp(36px,5vw,58px)] font-semibold leading-[1.08] tracking-[-0.025em] text-slate-50 mb-5">
                TEOS{" "}
                <span className="shimmer-gold">Sentinel</span>
                <br />
                Shield
              </h1>

              <p className="animate-fade-up animate-fade-up-d2 text-[clamp(16px,2vw,19px)] font-medium text-sky-300 mb-4 tracking-tight">
                Pre-Execution Security Guardrails for Autonomous Systems
              </p>

              <p className="animate-fade-up animate-fade-up-d3 text-[15px] text-slate-400 leading-relaxed max-w-[480px] mb-7">
                Rule-driven pre-execution validation for AI-generated code, dependencies, and CI/CD workflows — delivered through a Telegram access layer with structured ALLOW / WARN / BLOCK verdicts.
              </p>

              <div className="animate-fade-up animate-fade-up-d3 flex items-center gap-2.5 mb-8 text-sm">
                <span className="text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-2 font-medium">
                  Generate
                </span>
                <span className="text-amber-500 text-lg opacity-60">→</span>
                <span className="text-amber-300 bg-amber-500/[0.08] border border-amber-500/25 rounded-lg px-4 py-2 font-bold flex items-center gap-1">
                  <Icon name="hexagon" className="text-amber-400" />
                  Validate
                </span>
                <span className="text-amber-500 text-lg opacity-60">→</span>
                <span className="text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-2 font-medium">
                  Execute
                </span>
              </div>

              <div className="animate-fade-up animate-fade-up-d4 flex flex-wrap gap-3 mb-8">
                <ButtonPrimary href={TELEGRAM_BOT}>
                  Start Free — 5 Scans
                </ButtonPrimary>
                <ButtonGhost href="#how-it-works">
                  How It Works
                </ButtonGhost>
                <ButtonGhost href="#pricing">
                  View Plans
                </ButtonGhost>
              </div>

              <div className="animate-fade-up animate-fade-up-d4 flex flex-wrap gap-2 mb-6">
                {[
                  { label: "ALLOW / WARN / BLOCK", dot: false },
                  { label: "Dependency Audit", dot: true },
                  { label: "CI Security Checks", dot: true },
                ].map((pill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full border"
                    style={{
                      background: "rgba(59,130,246,0.06)",
                      color: "#93c5fd",
                      borderColor: "rgba(59,130,246,0.2)",
                    }}
                  >
                    {pill.dot && <LiveDot size={6} />}
                    {pill.label}
                  </span>
                ))}
              </div>

              <div className="animate-fade-up animate-fade-up-d4 flex flex-wrap gap-0 rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                {[
                  { icon: "hexagon", text: "Rule-Driven Verdicts" },
                  { icon: "box", text: "Supply Chain Checks" },
                  { icon: "gear", text: "CI Workflow Audit" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2.5 text-[11px] text-slate-500 font-mono tracking-wide border-r border-white/[0.05] last:border-r-0 flex-1 justify-center min-w-[120px]"
                  >
                    <Icon name={item.icon} className="text-slate-400" />
                    <span className="whitespace-nowrap">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-fade-up animate-fade-up-d3 flex justify-center lg:justify-end hide-mobile">
              <div className="terminal-frame w-full max-w-[420px] relative">
                <div className="terminal-bar">
                  <div className="terminal-dot" style={{ background: "#ff5f57" }} />
                  <div className="terminal-dot" style={{ background: "#febc2e" }} />
                  <div className="terminal-dot" style={{ background: "#28c840" }} />
                  <span className="ml-3 text-[11px] text-slate-500 font-mono">teos-sentinel — live</span>
                  <LiveDot size={7} />
                </div>
                <div className="relative p-5 min-h-[260px] text-[12px] font-mono">
                  <div className="scan-line" />
                  <div className="text-slate-500 mb-2">$ /scan</div>
                  <div className="text-slate-600 mb-1"><span className="text-slate-500">INPUT</span></div>
                  <div className="bg-black/30 border border-white/[0.06] rounded-md p-3 mb-4 text-red-400/80 break-all">
                    rm -rf /
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold tracking-widest px-3 py-1 rounded-md"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                      ✕ BLOCK
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-500">RULE </span><span className="text-slate-300">R01.DESTRUCTIVE_SHELL</span></div>
                    <div><span className="text-slate-500">RISK </span><span className="text-red-400">CRITICAL — execution halted</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROOF STRIP ───────────────────────────────── */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {[
            { label: "Telegram Bot Live", dot: true },
            { label: "25 Rule Checks", dot: false },
            { label: "Dependency Scanner", dot: false },
            { label: "CI/CD Scanner", dot: false },
            { label: "37 Tests Passing", dot: true },
            { label: "Engine v2 Stable", dot: true },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/[0.07] bg-white/[0.02] text-[12px] text-slate-400 whitespace-nowrap"
            >
              {item.dot && <LiveDot size={6} />}
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-24 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto text-center">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.02em] text-slate-50 mb-16">
            Three Phases. Zero Assumed Trust.
          </h2>

          <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">
            <Card>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/[0.03] border border-white/[0.06]">
                <Icon name="lightning" className="text-slate-300" />
              </div>
              <div className="text-[10px] font-mono text-slate-500 tracking-[0.15em] mb-1.5">PHASE 01</div>
              <div className="text-lg font-semibold text-slate-300 mb-2">Generate</div>
              <div className="text-[13px] text-slate-500 leading-relaxed">
                AI agents and developers produce code, package manifests, or CI workflow files.
              </div>
            </Card>

            <div className="text-amber-500 text-2xl opacity-40 text-center hidden md:block">→</div>

            <Card featured>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))", border: "1px solid rgba(251,191,36,0.3)" }}
              >
                <Icon name="hexagon" className="text-amber-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-500 tracking-[0.15em] mb-1.5">PHASE 02</div>
              <div className="text-lg font-semibold text-amber-300 mb-2">Validate</div>
              <div className="text-[13px] text-slate-500 leading-relaxed">
                TEOS Sentinel intercepts and applies rule-driven risk checks across code, deps, and CI config.
              </div>
            </Card>

            <div className="text-amber-500 text-2xl opacity-40 text-center hidden md:block">→</div>

            <Card>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/[0.03] border border-white/[0.06]">
                <Icon name="check" className="text-slate-300" />
              </div>
              <div className="text-[10px] font-mono text-slate-500 tracking-[0.15em] mb-1.5">PHASE 03</div>
              <div className="text-lg font-semibold text-sky-300 mb-2">Execute</div>
              <div className="text-[13px] text-slate-500 leading-relaxed">
                ALLOW proceeds. WARN flags for review. BLOCK halts execution before damage occurs.
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────── */}
      <section id="features" className="px-6 py-24 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Live Capabilities</SectionLabel>
            <h2 className="text-[clamp(26px,4vw,38px)] font-semibold tracking-[-0.02em] text-slate-50 mb-4">
              Current Product Capabilities
            </h2>
            <p className="text-[15px] text-slate-500 max-w-[480px] mx-auto leading-relaxed">
              Capabilities shown reflect the current live product scope.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "magnifier",
                title: "Code Risk Scan",
                badge: "/scan",
                badgeStyle: "live",
                body: "Detects destructive shell commands, eval/exec abuse, command injection, subprocess misuse, chmod issues, secret leakage, and base64 execution patterns.",
              },
              {
                icon: "box",
                title: "Dependency Audit",
                badge: "/deps",
                badgeStyle: "live",
                body: "Resolves package manifests and checks for supply chain risks, malicious packages, and dependency confusion vulnerabilities before installation.",
              },
              {
                icon: "gear",
                title: "CI Workflow Audit",
                badge: "PRO",
                badgeStyle: "pro",
                body: "Inspects CI workflow files for privilege escalation, secret exposure, insecure runners, and deployment pipeline risks. Available on Pro tier.",
              },
              {
                icon: "coin",
                title: "Persistent Credits",
                badge: "Automatic",
                badgeStyle: "live",
                body: "Scan credits persist across sessions. Purchase once, use continuously. Server-side state managed by a hardened activation service.",
              },
              {
                icon: "messaging",
                title: "Telegram Gateway",
                badge: "@teoslinker_bot",
                badgeStyle: "live",
                body: "A purpose-built Telegram bot serving as the primary interface. Instant scan access with no app installs required.",
              },
              {
                icon: "shield",
                title: "Sovereign Runtime",
                badge: "Persistent Runtime",
                badgeStyle: "live",
                body: "PM2-managed persistent services on sovereign-first infrastructure. No serverless cold starts. Designed for continuously available execution control.",
              },
            ].map((feature, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between mb-3">
                  <Icon name={feature.icon} className="text-slate-400" />
                  <span
                    className={`text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md ${
                      feature.badgeStyle === "pro"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-sky-500/8 text-sky-400 border border-sky-500/15"
                    }`}
                  >
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-slate-200 mb-2.5">{feature.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{feature.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VERDICT ENGINE ────────────────────────────── */}
      <section id="verdicts" className="px-6 py-24 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Verdict Engine</SectionLabel>
            <h2 className="text-[clamp(26px,4vw,38px)] font-semibold tracking-[-0.02em] text-slate-50 mb-4">
              Three Verdicts. No Ambiguity.
            </h2>
            <p className="text-[15px] text-slate-500 max-w-[500px] mx-auto leading-relaxed">
              Every scan produces a rule-driven verdict. ALLOW, WARN, or BLOCK — with structured reasoning your agents can act on.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* ALLOW */}
            <div className="verdict-card p-5 rounded-xl bg-white/[0.01] border border-white/[0.06]" style={{ borderLeftColor: "#22c55e" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="terminal-dot" style={{ background: "#ff5f57" }} />
                <div className="terminal-dot" style={{ background: "#febc2e" }} />
                <div className="terminal-dot" style={{ background: "#28c840" }} />
                <span className="ml-2 text-[10px] text-slate-500 font-mono">/scan</span>
              </div>
              <div className="text-[10px] text-slate-500 mb-1 font-mono">INPUT</div>
              <div className="bg-black/30 border border-white/[0.05] rounded-md p-3 mb-4 text-[11px] font-mono text-slate-500 break-all leading-relaxed">
                import hashlib{"\n"}data = b"hello world"{"\n"}hashlib.sha256(data).hexdigest()
              </div>
              <span className="inline-block text-[11px] font-bold font-mono tracking-widest px-3 py-1 rounded-md mb-3"
                style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
                ✓ ALLOW
              </span>
              <div className="text-[11px] font-mono space-y-1.5">
                <div><span className="text-slate-500">REASON </span><span className="text-slate-300">Standard cryptographic operation. No I/O, no execution.</span></div>
                <div><span className="text-slate-500">RISK </span><span className="text-emerald-400">NONE — cleared for execution</span></div>
              </div>
            </div>

            {/* WARN */}
            <div className="verdict-card p-5 rounded-xl bg-white/[0.01] border border-white/[0.06]" style={{ borderLeftColor: "#f59e0b" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="terminal-dot" style={{ background: "#ff5f57" }} />
                <div className="terminal-dot" style={{ background: "#febc2e" }} />
                <div className="terminal-dot" style={{ background: "#28c840" }} />
                <span className="ml-2 text-[10px] text-slate-500 font-mono">/scan</span>
              </div>
              <div className="text-[10px] text-slate-500 mb-1 font-mono">INPUT</div>
              <div className="bg-black/30 border border-white/[0.05] rounded-md p-3 mb-4 text-[11px] font-mono text-slate-500 break-all leading-relaxed">
                import subprocess{"\n"}result = subprocess.run([&quot;ls&quot;, &quot;-la&quot;], capture_output=True)
              </div>
              <span className="inline-block text-[11px] font-bold font-mono tracking-widest px-3 py-1 rounded-md mb-3"
                style={{ background: "rgba(245,158,11,0.08)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}>
                ⚠ WARN
              </span>
              <div className="text-[11px] font-mono space-y-1.5">
                <div><span className="text-slate-500">REASON </span><span className="text-slate-300">Subprocess call detected. Scoped to directory listing.</span></div>
                <div><span className="text-slate-500">RISK </span><span className="text-amber-400">LOW — review before automation</span></div>
              </div>
            </div>

            {/* BLOCK */}
            <div className="verdict-card p-5 rounded-xl bg-white/[0.01] border border-white/[0.06]" style={{ borderLeftColor: "#ef4444" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="terminal-dot" style={{ background: "#ff5f57" }} />
                <div className="terminal-dot" style={{ background: "#febc2e" }} />
                <div className="terminal-dot" style={{ background: "#28c840" }} />
                <span className="ml-2 text-[10px] text-slate-500 font-mono">/scan</span>
              </div>
              <div className="text-[10px] text-slate-500 mb-1 font-mono">INPUT</div>
              <div className="bg-black/30 border border-white/[0.05] rounded-md p-3 mb-4 text-[11px] font-mono text-red-400/70 break-all leading-relaxed">
                eval(require(&quot;child_process&quot;).exec(&quot;rm -rf /&quot;))
              </div>
              <span className="inline-block text-[11px] font-bold font-mono tracking-widest px-3 py-1 rounded-md mb-3"
                style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                ✕ BLOCK
              </span>
              <div className="text-[11px] font-mono space-y-1.5">
                <div><span className="text-slate-500">REASON </span><span className="text-slate-300">Shell injection via eval + exec combination.</span></div>
                <div><span className="text-slate-500">RISK </span><span className="text-red-400">CRITICAL — execution halted</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE SCAN DEMO ─────────────────────── */}
      <section className="px-6 py-24 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>Interactive Preview</SectionLabel>
          <h2 className="text-[clamp(24px,4vw,34px)] font-semibold tracking-[-0.02em] text-slate-50 mb-3">
            Try the Rule Engine
          </h2>
          <p className="text-[14px] text-slate-500 mb-10">
            Preview simulation for demonstration only. Production verdicts are generated by the live MCP risk engine.
          </p>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.01] p-6 text-left">
            <label className="text-[11px] text-slate-500 font-mono block mb-2.5">
              INPUT — Enter a shell command or code snippet
            </label>
            <input
              type="text"
              value={scanInput}
              onChange={(e) => { setScanInput(e.target.value); setScanResult(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleScan(); }}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-[13px] font-mono text-slate-200 outline-none transition-colors focus:border-amber-500/40 placeholder:text-slate-600 mb-4"
              placeholder="e.g. rm -rf / or curl | bash"
            />
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-[#080c12] font-semibold rounded-lg py-3 text-[14px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(251,191,36,0.3)] cursor-pointer disabled:cursor-not-allowed"
            >
              {isScanning ? "Scanning..." : "Run Scan"}
            </button>

            {scanResult && vs && (
              <div
                className="mt-5 p-5 rounded-xl transition-all duration-300"
                style={{ background: vs.bg, border: `1px solid ${vs.border}` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold font-mono" style={{ color: vs.color }}>
                    {vs.glyph}
                  </span>
                  <span className="text-2xl font-bold font-mono tracking-widest" style={{ color: vs.color }}>
                    {scanResult.verdict}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[12px] font-mono">
                  <div>
                    <div className="text-slate-500 mb-1">RULE</div>
                    <div className="text-slate-300">{scanResult.rule}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">RISK SCORE</div>
                    <div className="text-slate-300">{scanResult.score}/100</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────── */}
      <section id="pricing" className="px-6 py-24 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto text-center">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="text-[clamp(26px,4vw,38px)] font-semibold tracking-[-0.02em] text-slate-50 mb-3">
            Start Free. Scale When Ready.
          </h2>
          <p className="text-[15px] text-slate-500 max-w-[440px] mx-auto mb-4 leading-relaxed">
            No trial periods. No credit card required for free tier. Credits persist across sessions.
          </p>
          <p className="text-[12px] text-slate-600 max-w-[560px] mx-auto mb-12 leading-relaxed">
            Digital access. Scan credits activate after payment. Payments are non‑refundable once access is delivered.
          </p>

          <div className="grid md:grid-cols-5 gap-3 items-start">
            <PriceCard
              name="Free"
              price="$0"
              period="forever"
              scanLimit="5 scans"
              features={["Code risk scan (/scan)", "Telegram bot access", "ALLOW / WARN / BLOCK verdicts", "Structured risk output"]}
              href={TELEGRAM_BOT}
            />
            <PriceCard
              name="Starter"
              price="$9"
              period="/month"
              scanLimit="50 scans/month"
              features={["Code risk scan (/scan)", "Persistent credit balance", "Full scan history", "Audit log access"]}
              href={UPGRADE_LINK}
            />
            <PriceCard
              name="Builder"
              price="$49"
              period="/month"
              scanLimit="500 scans/month"
              featured
              features={["Code risk scan (/scan)", "Dependency audit (/deps)", "500 persistent credits", "Priority support"]}
              href={UPGRADE_LINK}
            />
            <PriceCard
              name="Pro"
              price="$99"
              period="/month"
              scanLimit="1,000 scans/month"
              features={["Code + Dependency scans", "CI Workflow Audit", "1,000 persistent credits", "Team/security workflow use", "Audit logs"]}
              href={UPGRADE_LINK}
            />
            <PriceCard
              name="Enterprise"
              price="Custom"
              period="contact us"
              scanLimit="Unlimited"
              features={["Self-hosted deployment", "Custom onboarding", "Audit logging", "Dedicated support", "Deployment support"]}
              href={CONTACT_EMAIL}
              isExternal={false}
            />
          </div>
        </div>
      </section>

      {/* ─── ROADMAP ───────────────────────────────────── */}
      <section id="roadmap" className="px-6 py-24 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Roadmap</SectionLabel>
            <h2 className="text-[clamp(24px,4vw,34px)] font-semibold tracking-[-0.02em] text-slate-50 mb-3">
              What's Coming in v2.1
            </h2>
            <p className="text-[14px] text-slate-500">
              Current development priorities as of May 2026.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] py-3 px-6">
            {[
              { label: "AST precision improvements", status: "In Progress" },
              { label: "OSV vulnerability lookup integration", status: "Planned" },
              { label: "GitHub CI integrations", status: "Planned" },
              { label: "Enterprise onboarding flow", status: "Planned" },
              { label: "VPS / self-host hardening guide", status: "Planned" },
              { label: "First 20-user acquisition sprint", status: "Active" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-b-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{
                    background: item.status === "In Progress" || item.status === "Active" ? "#fbbf24" : "#334155",
                  }}
                />
                <span className="text-[14px] text-slate-300 flex-1">{item.label}</span>
                <span
                  className={`text-[10px] font-mono tracking-wider flex-shrink-0 ${
                    item.status === "In Progress" || item.status === "Active" ? "text-amber-400" : "text-slate-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BUILT BY ──────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(59,130,246,0.08))", border: "1px solid rgba(251,191,36,0.25)" }}
          >
            <Icon name="shield" className="text-amber-400 text-2xl" />
          </div>
          <SectionLabel>Built By</SectionLabel>
          <h2 className="text-2xl font-semibold text-slate-100 mb-2">Elmahrosa International</h2>
          <p className="text-sky-300 font-medium mb-4">Building Execution Control Infrastructure for Autonomous Systems</p>
          <p className="text-[14px] text-slate-500 leading-relaxed max-w-[520px] mx-auto mb-8">
            Founded in Alexandria, Egypt. Building security infrastructure for the next generation of autonomous AI systems — from agent-native validation engines to deployment‑ready security tooling.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonGhost href={COMMUNITY} isExternal>Telegram Community</ButtonGhost>
            <ButtonGhost href={GITHUB_REPO} isExternal>GitHub</ButtonGhost>
            <ButtonGhost href={CONTACT_EMAIL} isExternal={false}>Contact</ButtonGhost>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────── */}
      <section
        className="px-6 py-28 text-center relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(251,191,36,0.06) 0%, transparent 70%), radial-gradient(ellipse 40% 25% at 50% 100%, rgba(59,130,246,0.04) 0%, transparent 60%), #080c12",
        }}
      >
        <div className="absolute inset-0 grid-bg-subtle opacity-30 pointer-events-none" />
        <div className="relative max-w-[600px] mx-auto">
          <SectionLabel>Get Started</SectionLabel>
          <h2 className="text-[clamp(28px,5vw,48px)] font-semibold tracking-[-0.025em] text-slate-50 leading-[1.1] mb-5">
            Pre‑Execution Guardrails<br />
            <span className="shimmer-gold">for Autonomous Systems</span>
          </h2>
          <p className="text-[15px] text-slate-400 leading-relaxed max-w-[440px] mx-auto mb-8">
            Start validating AI-generated code today. Five free scans. Open the bot and run{" "}
            <span className="text-sky-300 font-semibold font-mono">/scan</span> in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <ButtonPrimary href={TELEGRAM_BOT}>
              Start with 5 Free Scans →
            </ButtonPrimary>
            <ButtonGhost href="#pricing">
              View Plans
            </ButtonGhost>
          </div>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.04]">
            <LiveDot />
            <span className="text-[10px] font-mono text-emerald-400 tracking-[0.1em] uppercase font-medium">
              /scan · /deps · CREDITS — Core Services Operational
            </span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────── */}
      <footer className="px-6 py-8 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#080c12" />
                <path d="M9 12l2 2 4-4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[13px] text-slate-500 font-medium">
              TEOS Sentinel Shield · Elmahrosa International · Alexandria, EG
            </span>
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