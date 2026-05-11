'use client';

import { useState, useEffect } from 'react';

function useInView(threshold = 0.1) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return { setRef, visible };
}

const INTEGRATIONS = [
  { icon: '\u{1F400}', name: 'Telegram Bot', status: 'LIVE' },
  { icon: '\u2699\uFE0F', name: 'REST API', status: 'LIVE' },
  { icon: '\u{1F400}', name: 'CLI Tool', status: 'LIVE' },
  { icon: '\u{1F400}', name: 'GitHub Actions', status: 'BETA' },
  { icon: '\u{1F400}', name: 'GitLab CI', status: 'BETA' },
  { icon: '\u{1F400}', name: 'Autonomous Agents', status: 'BETA' },
];

const TRUST_ITEMS = [
  { icon: '\u{1F4DC}', title: 'Published Rule Definitions', desc: 'All 25 rules documented with patterns, test cases, and false positive rates. Inspect the engine at /rules.json.' },
  { icon: '\u{1F6D1}', title: 'Compliance Audit Trail', desc: 'Every enforcement decision logged with timestamp, rule ID, score, and SHA-256 hash. Full audit history for procurement.' },
  { icon: '\u{1F6D1}', title: 'Deterministic Engine', desc: '25 named rules. 25/25 tests passing. No probabilistic AI guessing \u2014 deterministic policy enforcement.' },
  { icon: '\u{1F3DB}', title: 'Built in Alexandria, Egypt', desc: 'Deployment-first architecture for MENA contexts \u2014 data residency, regulatory alignment, and local compliance.' },
];

const GOVT_ITEMS = [
  { flag: '\u{1F1EA}\u{1F1EC}', org: 'MCIT \u00B7 ITIDA \u00B7 TIEC', range: '$5K \u2013 $25K pilot', desc: 'Pre-execution enforcement aligned with Egypt AI Strategy 2025\u20132030.' },
  { flag: '\u{1F1E6}\u{1F1EA}', org: 'UAE AI Office \u00B7 G42 \u00B7 TDRA', range: '$10K \u2013 $50K pilot', desc: 'Policy enforcement at national AI infrastructure scale.' },
  { flag: '\u{1F1F8}\u{1F1E6}', org: 'SDAIA \u00B7 NEOM \u00B7 STC', range: '$25K \u2013 $200K pilot', desc: 'Kill-switch enforcement for AI-native autonomous infrastructure.' },
];

export default function EnterpriseTrustAndFinal() {
  const section = useInView();

  return (
    <>
      {/* INTEGRATIONS */}
      <section className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] bg-surface relative z-[1]" ref={section.setRef}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Integrations</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-10 md:mb-12">
            Plugs into your<br />existing stack.
          </h2>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
            {INTEGRATIONS.map((item, i) => (
              <div key={i} className="border border-[rgba(255,255,255,0.07)] rounded-sm bg-black p-4 md:p-5 flex items-center gap-3 font-mono text-[12px] md:text-[13px] font-[700] hover:border-[rgba(255,255,255,0.12)] transition-colors">
                <span className="text-lg" aria-hidden="true">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                <span className={`text-[10px] tracking-[0.06em] flex-shrink-0 ${item.status === 'LIVE' ? 'text-green' : 'text-amber'}`}>
                  \u25CF {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENTERPRISE */}
      <section className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] relative z-[1]" ref={section.setRef}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Enterprise / Government</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            Closed beta for enterprise<br />and government pilots.
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-10 md:mb-12">
            Self-hosted deployments with custom policy engines, dedicated SLAs, and full audit trails. Data residency in Egypt, UAE, or Saudi Arabia. Currently accepting pilot partners.
          </p>

          <div className={`p-7 md:p-8 border border-[rgba(255,255,255,0.12)] rounded-sm bg-surface flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
            <div>
              <h4 className="text-[17px] font-[700] mb-1.5">📌 Enterprise / Government Pilot</h4>
              <p className="font-mono text-[12px] text-muted leading-[1.6]">
                Closed beta \u00B7 Dedicated deployment \u00B7 Custom policy engine \u00B7 Full audit trail \u00B7 MENA data residency
              </p>
              <p className="font-mono text-[11px] text-muted mt-2">
                Response within 24h \u00B7 NDA available \u00B7 Custom SLA negotiable \u00B7 Pilot pricing available
              </p>
            </div>
            <div className="flex flex-col gap-2.5 flex-shrink-0 w-full lg:w-auto">
              <a href="mailto:ayman@teosegypt.com?subject=Enterprise%20Pilot%20Request%20%E2%80%94%20TEOS%20Sentinel" className="inline-flex items-center justify-center gap-2 bg-red text-white font-mono text-[13px] font-bold px-6 py-[12px] rounded-sm no-underline hover:bg-[#c92a2a] transition-colors">
                {'\u{1F6E1}\uFE0F'} Request Pilot Access →
              </a>
              <a href="mailto:ayman@teosegypt.com?subject=Enterprise%20Demo%20Request%20%E2%80%94%20TEOS%20Sentinel" className="inline-flex items-center justify-center gap-2 bg-transparent text-white font-mono text-[12px] px-6 py-[10px] rounded-sm border border-[rgba(255,255,255,0.12)] no-underline hover:border-white/30 hover:bg-white/[0.04] transition-colors">
                 \u25B6 Schedule Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] relative z-[1]" ref={section.setRef}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Trust & Credibility</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-10 md:mb-12">
            Deterministic by design.<br />
            Published rules. Full audit trail.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-12">
            {TRUST_ITEMS.map((t, i) => (
              <div key={i} className="border border-[rgba(255,255,255,0.07)] rounded-sm bg-surface p-6">
                <div className="text-xl mb-3" aria-hidden="true">{t.icon}</div>
                <h4 className="text-[14px] font-[700] mb-2">{t.title}</h4>
                <p className="font-mono text-[12px] text-muted leading-[1.7]">{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Government pipeline */}
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-amber mb-4">Government Pipeline</p>
          <h3 className="text-[clamp(20px,2.5vw,30px)] font-[800] tracking-[-0.02em] leading-[1.1] mb-3">
            MENA is buying AI governance now.
          </h3>
          <ul className="font-mono text-[14px] text-muted leading-[1.8] max-w-[480px] mb-8 md:mb-10 list-disc list-inside space-y-0.5 ml-1">
            <li>Egypt, UAE, Saudi investing in AI execution control</li>
            <li>TEOS positioned as the enforcement layer</li>
            <li>Pre-execution blocking \u2014 not post-incident response</li>
          </ul>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {GOVT_ITEMS.map((g, i) => (
              <div key={i} className="border border-[rgba(255,255,255,0.07)] rounded-sm bg-surface p-6">
                <div className="text-2xl mb-2.5" aria-hidden="true">{g.flag}</div>
                <h4 className="text-[14px] font-[700] mb-1">{g.org}</h4>
                <div className="font-mono text-[11px] text-amber mb-3">{g.range}</div>
                <p className="font-mono text-[12px] text-muted leading-[1.7]">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* FINAL CTA */}
      <section className="py-[100px] md:py-[120px] border-b border-[rgba(255,255,255,0.07)] text-center relative overflow-hidden z-[1]" ref={section.setRef}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(230,51,51,0.08) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 relative">
          <h2 className={`text-[clamp(28px,4vw,52px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5 ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
            Join the closed beta.
          </h2>
          <p className={`font-mono text-[14px] text-muted mb-10 ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600 delay-100`}>
            Open Telegram \u00B7 Paste any command \u00B7 Get your verdict \u00B7 No account. No credit card.
          </p>
          <div className={`flex gap-3 md:gap-4 justify-center flex-wrap ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600 delay-200`}>
            <a href="https://t.me/teoslinker_bot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-red text-white font-mono text-[13px] font-bold px-7 py-[14px] rounded-sm no-underline hover:bg-[#c92a2a] hover:-translate-y-[1px] transition-all tracking-[0.04em] shadow-[0_4px_16px_rgba(230,51,51,0.25)]" aria-label="Open TEOS Sentinel bot on Telegram">
              {'\u{1F6E1}\uFE0F'} Open @teoslinker_bot →
            </a>
            <a href="https://github.com/Elmahrosa/teos-sentinel-shield" target="_blank" rel="noopener noreferrer" aria-label="View TEOS GitHub repository" className="inline-flex items-center gap-2 bg-transparent text-white font-mono text-[13px] px-6 py-[14px] rounded-sm border border-[rgba(255,255,255,0.12)] no-underline hover:border-white/30 hover:bg-white/[0.04] transition-all tracking-[0.04em]">
              View GitHub
            </a>
            <a href="mailto:ayman@teosegypt.com" aria-label="Send enterprise inquiry email" className="inline-flex items-center gap-2 bg-transparent text-white font-mono text-[13px] px-6 py-[14px] rounded-sm border border-[rgba(255,255,255,0.12)] no-underline hover:border-white/30 hover:bg-white/[0.04] transition-all tracking-[0.04em]">
              Enterprise Inquiry
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
