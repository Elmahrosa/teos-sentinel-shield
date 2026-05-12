'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, ArrowRight, Mail } from 'lucide-react';

const PACKAGES = [
  {
    id: 'fast-pilot',
    name: 'Fast Pilot',
    badge: '4-WEEK DEPLOYMENT',
    price: '$12,000\u2013$18,000',
    priceNote: 'one-time pilot fee',
    features: [
      'Air-gapped deployment in your data center',
      '50% upfront, 50% on go-live',
      'No penalty if it doesn\u2019t work \u2014 you keep the rules',
      'Full deterministic enforcement engine',
      'Dedicated integration engineer',
      'Post-deployment audit report',
    ],
    ctaLabel: 'Request Fast Pilot \u2192',
    ctaSubject: 'Fast%20Pilot%20Request%20%E2%80%94%20TEOS%20Sentinel',
    featured: false,
  },
  {
    id: 'sovereign',
    name: 'Sovereign License',
    badge: 'YEAR 1',
    price: '$25,000\u2013$35,000',
    priceNote: '/year \u00B7 annual license',
    features: [
      'Unlimited scans',
      '24/7 dedicated support',
      'Quarterly policy review sessions',
      'Full audit trail with SHA-256 chain',
      'Custom rule authoring',
      'Priority SLA < 4h response',
    ],
    ctaLabel: 'Request License \u2192',
    ctaSubject: 'Sovereign%20License%20Request%20%E2%80%94%20TEOS%20Sentinel',
    featured: true,
  },
  {
    id: 'regional',
    name: 'Regional Package',
    badge: '3 COUNTRIES',
    price: '$46,000',
    priceNote: '/year \u00B7 15% discount applied',
    features: [
      'Egypt + UAE + Saudi deployment',
      'Multi-region data residency',
      '15% discount vs. individual licenses',
      'Quarterly reviews per region',
      'Cross-region audit consolidation',
      'Unified SLA management',
    ],
    ctaLabel: 'Request Regional \u2192',
    ctaSubject: 'Regional%20Package%20Request%20%E2%80%94%20TEOS%20Sentinel',
    featured: false,
  },
];

export default function PricingSection() {
  const [sectionRef, setSectionRef] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!sectionRef) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    obs.observe(sectionRef);
    return () => obs.disconnect();
  }, [sectionRef]);

  return (
    <section id="pricing" className="w-full py-24 px-4 bg-gradient-to-b from-black via-surface to-black" ref={setSectionRef}>
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-12">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-3">Government & Sovereign</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] text-white mb-3">
            Deploy across MENA.<br />No lock-in. Total sovereignty.
          </h2>
          <p className="text-sm text-muted max-w-[600px] mx-auto">
            Purpose-built for government AI infrastructure. Air-gapped, auditable, and aligned with national data residency requirements for Egypt, UAE, and Saudi Arabia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`relative flex flex-col rounded-2xl p-6 border ${
                pkg.featured
                  ? 'border-red shadow-[0_0_28px_-6px_rgba(230,51,51,0.4)] bg-surface'
                  : 'border-[rgba(255,255,255,0.07)] bg-surface'
              }`}
            >
              {pkg.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-red text-white px-3 py-1 rounded-full whitespace-nowrap">
                  RECOMMENDED
                </span>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-amber border border-amber/20 bg-amber/[0.06] px-2.5 py-1 rounded-full">
                  {pkg.badge}
                </span>
              </div>

              <p className="text-lg font-[700] text-white mb-1">{pkg.name}</p>

              <div className="mb-4">
                <span className="text-3xl font-semibold text-white">{pkg.price}</span>
                <span className="text-sm text-muted ml-1">{pkg.priceNote}</span>
              </div>

              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <Check size={13} className="mt-0.5 shrink-0 text-green" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2.5">
                <a
                  href={`mailto:ayman@teosegypt.com?subject=${pkg.ctaSubject}`}
                  className={`block text-center text-sm font-medium py-2.5 rounded-xl transition-opacity hover:opacity-85 ${
                    pkg.featured
                      ? 'bg-red text-white'
                      : 'bg-[rgba(255,255,255,0.07)] text-white border border-[rgba(255,255,255,0.12)]'
                  }`}
                >
                  {pkg.ctaLabel}
                </a>
                <a
                  href="mailto:ayman@teosegypt.com?subject=Demo%20Request%20%E2%80%94%20TEOS%20Sentinel"
                  className="block text-center text-sm font-medium py-2 rounded-xl border border-[rgba(255,255,255,0.07)] text-muted hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-colors"
                >
                  Schedule Demo \u2192
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ICBC Governance Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-2xl border border-amber/30 bg-surface p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center text-xl flex-shrink-0">
              \u2696\uFE0F
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono tracking-widest text-amber uppercase">ICBC Aligned</span>
                <span className="text-[10px] font-semibold bg-amber/15 text-amber border border-amber/20 px-2 py-0.5 rounded-full">GOVERNANCE</span>
              </div>
              <p className="text-sm text-muted max-w-[600px]">
                TEOS Sentinel is constitutionally aligned with the{' '}
                <a href="https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution" target="_blank" rel="noopener noreferrer" className="text-amber hover:text-amber-bright underline underline-offset-2">
                  TEOS International Civic Blockchain Constitution (ICBC)
                </a>
                {' \u2014 '}ensuring that all enforcement decisions are transparent, auditable, and bound by rule of law, not algorithmic discretion.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-medium px-5 py-2.5 rounded-xl border border-amber/30 text-amber hover:bg-amber/10 transition-colors whitespace-nowrap"
          >
            View ICBC Constitution \u2192
          </a>
        </motion.div>

        <p className="text-center text-xs text-muted mt-6">
          All prices USD. Invoices available. NDA on request.{' '}
          <a href="mailto:ayman@teosegypt.com?subject=Pricing%20Question%20%E2%80%94%20TEOS%20Sentinel" className="text-muted hover:text-white underline underline-offset-2">
            Questions? ayman@teosegypt.com
          </a>
        </p>
      </div>
    </section>
  );
}
