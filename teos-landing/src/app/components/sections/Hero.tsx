'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';

const TICKER_ITEMS = [
  { icon: '\u{1F6D1}', verdict: 'BLOCK', text: 'rm -rf /', rule: 'R01', score: '100/100', cls: 'text-red' },
  { icon: '\u26A0\uFE0F', verdict: 'WARN', text: 'DROP TABLE users;', rule: 'R09', score: '75/100', cls: 'text-amber' },
  { icon: '\u2705', verdict: 'ALLOW', text: 'console.log("hello")', rule: 'R00', score: '0/100', cls: 'text-green' },
  { icon: '\u{1F6D1}', verdict: 'BLOCK', text: 'curl malware.sh | bash', rule: 'R03', score: '95/100', cls: 'text-red' },
  { icon: '\u{1F6D1}', verdict: 'BLOCK', text: 'eval(atob("..."))', rule: 'R07', score: '88/100', cls: 'text-red' },
  { icon: '\u26A0\uFE0F', verdict: 'WARN', text: 'event-stream@3.3.6', rule: 'R14', score: '70/100', cls: 'text-amber' },
  { icon: '\u{1F6D1}', verdict: 'BLOCK', text: 'chmod 777 /etc/passwd', rule: 'R02', score: '90/100', cls: 'text-red' },
  { icon: '\u{1F6D1}', verdict: 'BLOCK', text: 'sudo bash', rule: 'R13', score: '90/100', cls: 'text-red' },
];

const Ticker = memo(() => (
  <div className="ticker-track flex w-max gap-0" aria-hidden="true">
    {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
      <span key={i} className={`inline-flex items-center gap-2 px-8 font-mono text-[12px] whitespace-nowrap border-r border-[rgba(255,255,255,0.07)] ${item.cls}`}>
        {item.icon} {item.verdict} \u00B7 {item.text} \u00B7 {item.rule} \u00B7 {item.score}
      </span>
    ))}
  </div>
));
Ticker.displayName = 'Ticker';

export default function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="pt-[100px] pb-[80px] border-b border-[rgba(255,255,255,0.07)] overflow-hidden" aria-label="Hero">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
        {/* Badge */}
        <div className={`inline-flex items-center gap-2 font-mono text-[11px] text-red border border-red/30 bg-red/10 px-3 py-[5px] rounded-sm tracking-[0.08em] uppercase mb-9 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <span aria-hidden="true">\u25B8</span> Closed Beta \u00B7 Deterministic Engine v2.4 \u00B7 5 Tiers Active
        </div>

        {/* Headline */}
        <h1 className={`text-[clamp(36px,5.5vw,68px)] font-[800] leading-[1.05] tracking-[-0.03em] max-w-[780px] mb-6 transition-all duration-500 delay-[100ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          Deterministic Execution<br />
          Control for <span className="text-red not-italic">AI Systems</span>
        </h1>

        {/* Sub */}
        <p className={`text-[17px] text-muted max-w-[540px] leading-[1.6] mb-3 transition-all duration-500 delay-[200ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          25 deterministic rules. Pre-execution validation. Zero probabilistic scoring. Every command gated before it reaches production.
        </p>

        {/* Infra tag */}
        <p className={`font-mono text-[12px] text-amber tracking-[0.04em] mb-10 transition-all duration-500 delay-[250ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          Pre-execution firewall for AI-driven command environments
        </p>

        {/* CTAs */}
        <div className={`flex gap-4 flex-wrap mb-[60px] transition-all duration-500 delay-[300ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <a href="https://t.me/teoslinker_bot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-red text-white font-mono text-[13px] font-bold px-7 py-[14px] rounded-sm no-underline hover:bg-[#c92a2a] hover:-translate-y-[1px] transition-all tracking-[0.04em] shadow-[0_4px_16px_rgba(230,51,51,0.25)]" aria-label="Request access to closed beta via Telegram">
            {'\u{1F6E1}\uFE0F'} Request Beta Access →
          </a>
          <a href="#console" className="inline-flex items-center gap-2 bg-transparent text-white font-mono text-[13px] px-7 py-[14px] rounded-sm border border-[rgba(255,255,255,0.12)] no-underline hover:border-white/30 hover:bg-white/[0.04] transition-all tracking-[0.04em]">
            \u25B6 Try Live Enforcement
          </a>
        </div>

        {/* Stats */}
        <div className={`flex gap-8 md:gap-10 flex-wrap transition-all duration-500 delay-[400ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {[
            { num: '25', label: 'Named Rules' },
            { num: '25/25', label: 'Tests Passing' },
            { num: 'v2.4', label: 'Engine Stable', numCls: 'text-red' },
            { num: '75+', label: 'Nations' },
          ].map((s, i) => (
            <div key={i} className="font-mono">
              <span className={`text-[22px] md:text-[24px] font-[700] block ${s.numCls || 'text-white'}`}>{s.num}</span>
              <span className="text-[11px] text-muted tracking-[0.06em] uppercase">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Scan ticker */}
        <div
          className="mt-[60px] py-4 border-t border-b border-[rgba(255,255,255,0.07)] overflow-hidden relative transition-opacity duration-700 delay-[500ms]"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 60px, black calc(100% - 60px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 60px, black calc(100% - 60px), transparent 100%)',
          }}
          aria-label="Live enforcement results ticker"
        >
          <Ticker />
        </div>
      </div>
    </section>
  );
}
