import Link from 'next/link';
import { Send, Shield, FileText, FileCode } from 'lucide-react';

const XIcon = (p: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const GitHubIcon = (p: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedInIcon = (p: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.07)] py-14 px-6">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link href="/" className="font-mono text-[13px] font-bold tracking-[0.05em] text-white flex items-center gap-2 no-underline">
            <span>𓂀</span>
            <span className="text-red">TEOS</span>
            <span className="text-muted">Sentinel</span>
          </Link>
          <p className="font-mono text-[12px] text-muted mt-3.5 leading-[1.8] max-w-[280px]">
            Execution Control Infrastructure for Autonomous AI.
            <br />
            Built in Alexandria, Egypt by Elmahrosa International.
            <br /><br />
            Law governs execution.
            <br />
            Humans govern systems.
            <br />
            AI serves authority.
          </p>
        </div>

        {/* Product */}
        <div>
          <h5 className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted mb-4">Product</h5>
          <a href="https://t.me/teoslinker_bot" target="_blank" rel="noopener noreferrer" aria-label="Telegram Bot" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <Send className="h-3.5 w-3.5 stroke-[1.75]" /> Telegram Bot
          </a>
          <a href="#console" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <Shield className="h-3.5 w-3.5 stroke-[1.75]" /> Enforcement Console
          </a>
          <a href="https://teos-sentinel-shield.vercel.app/rules.json" target="_blank" rel="noopener noreferrer" aria-label="Rule Definitions" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <FileCode className="h-3.5 w-3.5 stroke-[1.75]" /> Rule Definitions
          </a>
          <a href="https://github.com/Elmahrosa/teos-sentinel-shield" target="_blank" rel="noopener noreferrer" aria-label="GitHub Stack" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <GitHubIcon className="h-3.5 w-3.5" /> GitHub Stack
          </a>
        </div>

        {/* Community */}
        <div>
          <h5 className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted mb-4">Community</h5>
          <a href="https://t.me/Elmahrosapi" target="_blank" rel="noopener noreferrer" aria-label="Telegram community" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <Send className="h-3.5 w-3.5 stroke-[1.75]" /> Elmahrosapi (75+ nations)
          </a>
          <a href="https://linkedin.com/in/aymanseif" target="_blank" rel="noopener noreferrer" aria-label="Founder LinkedIn profile" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <LinkedInIcon className="h-3.5 w-3.5" /> Founder LinkedIn
          </a>
          <a href="https://x.com/king_teos" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <XIcon className="h-3.5 w-3.5" /> X / Twitter
          </a>
        </div>

        {/* Security & Legal */}
        <div>
          <h5 className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted mb-4">Security & Legal</h5>
          <a href="/security.txt" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <Shield className="h-3.5 w-3.5 stroke-[1.75]" /> Security.txt
          </a>
          <a href="/privacy" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <FileText className="h-3.5 w-3.5 stroke-[1.75]" /> Privacy Policy
          </a>
          <a href="/responsible-disclosure" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <FileText className="h-3.5 w-3.5 stroke-[1.75]" /> Responsible Disclosure
          </a>
          <a href="https://teos-sentinel-shield.vercel.app/rules.json" target="_blank" rel="noopener noreferrer" aria-label="Rule Definitions" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <FileCode className="h-3.5 w-3.5 stroke-[1.75]" /> Rule Definitions
          </a>
        </div>

        {/* Government */}
        <div>
          <h5 className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted mb-4">Government</h5>
          <a href="mailto:ayman@teosegypt.com?subject=Enterprise%20Pilot%20Request%20%E2%80%94%20TEOS%20Sentinel" aria-label="Request Egypt ITIDA pilot" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <Shield className="h-3.5 w-3.5 stroke-[1.75]" /> Egypt Pilot (ITIDA)
          </a>
          <a href="mailto:ayman@teosegypt.com?subject=Enterprise%20Pilot%20Request%20%E2%80%94%20TEOS%20Sentinel" aria-label="Request UAE AI Office pilot" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <Shield className="h-3.5 w-3.5 stroke-[1.75]" /> UAE Pilot (AI Office)
          </a>
          <a href="mailto:ayman@teosegypt.com?subject=Enterprise%20Pilot%20Request%20%E2%80%94%20TEOS%20Sentinel" aria-label="Request Saudi SDAIA pilot" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <Shield className="h-3.5 w-3.5 stroke-[1.75]" /> Saudi Pilot (SDAIA)
          </a>
          <a href="https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution" target="_blank" rel="noopener noreferrer" aria-label="ICBC Constitution on GitHub" className="flex items-center gap-2 font-mono text-[12px] text-muted no-underline mb-2.5 hover:text-white transition-colors">
            <FileText className="h-3.5 w-3.5 stroke-[1.75]" /> ICBC Constitution
          </a>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-10 pt-6 border-t border-[rgba(255,255,255,0.07)] flex flex-wrap justify-between gap-2 font-mono text-[11px] text-muted">
        <span>© 2026 Elmahrosa International · Alexandria, Egypt · Engine v2.4</span>
        <span>
          <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
          {' · '}
          <a href="/responsible-disclosure" className="hover:text-white transition-colors">Responsible Disclosure</a>
          {' · '}
          <a href="/security.txt" className="hover:text-white transition-colors">Security</a>
        </span>
      </div>
    </footer>
  );
}
