'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

const LINKS = {
  free:               'https://dodo.pe/xm1619v9elp',
  starter_monthly:    'https://dodo.pe/iba2piggql',
  starter_annual:     'https://dodo.pe/slkqpsvswlt',
  team_monthly:       'https://dodo.pe/mz3a54cb2s',
  team_annual:        'https://dodo.pe/d4fr3ef9qt6',
  enterprise_monthly: 'https://dodo.pe/xn38jipi66d',
  enterprise_annual:  'https://dodo.pe/kuqery53ove',
  sovereign:          'https://dodo.pe/uft6rqarbel',
} as const;

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    monthly: '$0',
    annual: '$0',
    annualNote: '',
    setup: null,
    scans: '50 / mo',
    rpm: '5',
    features: [
      'Core threat rules (R01\u2013R10)',
      'CLI + API access',
      'ALLOW / WARN / BLOCK verdicts',
      'Community support',
    ],
    cta: 'Try Free \u2192',
    ctaMonthly: LINKS.free,
    ctaAnnual: LINKS.free,
    featured: false,
    badge: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    monthly: '$29',
    annual: '$290',
    annualNote: '$24.17/mo effective',
    setup: '$500',
    scans: '5,000 / mo',
    rpm: '30',
    features: [
      'All 25 threat rules',
      'CLI + API + GitHub Actions',
      '5K scans / month',
      'Email support',
    ],
    cta: 'Get Started \u2192',
    ctaMonthly: LINKS.starter_monthly,
    ctaAnnual: LINKS.starter_annual,
    featured: false,
    badge: null,
  },
  {
    id: 'team',
    name: 'Team',
    monthly: '$149',
    annual: '$1,490',
    annualNote: '$124.17/mo effective',
    setup: '$2,000',
    scans: '50,000 / mo',
    rpm: '150',
    features: [
      'All enforcement engines',
      'Team dashboard + audit exports',
      'Slack alerts + priority support',
      'CI/CD pipeline audit',
      'SSE audit stream',
    ],
    cta: 'Get Protected \u2192',
    ctaMonthly: LINKS.team_monthly,
    ctaAnnual: LINKS.team_annual,
    featured: true,
    badge: 'POPULAR',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: '$499',
    annual: '$4,990',
    annualNote: '$415.83/mo effective',
    setup: '$5,000',
    scans: 'Unlimited',
    rpm: '600',
    features: [
      'Unlimited scans',
      'SSO/SAML + custom rules',
      '99.95% SLA',
      'Dedicated account manager',
      'Compliance reports + audit exports',
    ],
    cta: 'Subscribe \u2192',
    ctaMonthly: LINKS.enterprise_monthly,
    ctaAnnual: LINKS.enterprise_annual,
    featured: false,
    badge: null,
  },
] as const;

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="w-full py-24 px-4 bg-gradient-to-b from-black via-surface to-black">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-10">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-3">Pricing</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] text-white mb-2">
            Start free. Scale when ready.
          </h2>
          <p className="text-sm text-muted">
            Instant activation. Credits auto-applied. Full rule ID and explanation on every verdict.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm transition-colors ${!annual ? 'text-white' : 'text-muted'}`}>Monthly</span>
          <button
            onClick={() => setAnnual((v) => !v)}
            role="switch"
            aria-checked={annual}
            aria-label="Toggle annual billing"
            className={`relative w-10 h-5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red ${
              annual ? 'bg-red' : 'bg-[rgba(255,255,255,0.12)]'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm transition-colors ${annual ? 'text-white' : 'text-muted'}`}>Annual</span>
          <AnimatePresence>
            {annual && (
              <motion.span
                key="save"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="text-[10px] font-semibold bg-green-dim text-green border border-[rgba(34,197,94,0.3)] px-2.5 py-1 rounded-full"
              >
                2 months free
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {TIERS.map((tier, i) => {
            const price = annual ? tier.annual : tier.monthly;
            const priceSub = tier.id === 'free' ? '/month \u00B7 start here' : annual ? '/year' : '/month';
            const link = annual ? tier.ctaAnnual : tier.ctaMonthly;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className={`relative flex flex-col rounded-2xl p-6 border bg-surface ${
                  tier.featured
                    ? 'border-red shadow-[0_0_28px_-6px_rgba(230,51,51,0.4)]'
                    : 'border-[rgba(255,255,255,0.07)]'
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-red text-white px-3 py-1 rounded-full whitespace-nowrap">
                    {tier.badge}
                  </span>
                )}

                <p className="text-xs font-mono tracking-widest text-muted uppercase mb-2">{tier.name}</p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={price}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <span className="text-3xl font-semibold text-white">{price}</span>
                    <span className="text-sm text-muted ml-1">{priceSub}</span>
                  </motion.div>
                </AnimatePresence>
                <AnimatePresence>
                  {annual && tier.annualNote && (
                    <motion.p
                      key="note"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-green mt-0.5 overflow-hidden"
                    >
                      {tier.annualNote}
                    </motion.p>
                  )}
                </AnimatePresence>
                {tier.setup && <p className="text-xs text-muted mt-0.5">+{tier.setup} setup</p>}

                <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-xl bg-black border border-[rgba(255,255,255,0.07)]">
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-widest mb-0.5">Scans</p>
                    <p className="text-sm font-medium text-white">{tier.scans}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-widest mb-0.5">RPM</p>
                    <p className="text-sm font-medium text-white">{tier.rpm}</p>
                  </div>
                </div>

                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted">
                      <Check size={13} className="mt-0.5 shrink-0 text-green" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center text-sm font-medium py-2.5 rounded-xl transition-opacity hover:opacity-85 ${
                    tier.featured
                      ? 'bg-red text-white'
                      : 'bg-[rgba(255,255,255,0.07)] text-white border border-[rgba(255,255,255,0.12)]'
                  }`}
                >
                  {tier.cta}
                </a>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-2xl border border-amber/30 bg-surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono tracking-widest text-amber uppercase">{'\u{1F3DB}\uFE0F'} Sovereign</span>
              <span className="text-[10px] font-semibold bg-amber/15 text-amber border border-amber/20 px-2 py-0.5 rounded-full">AIR-GAPPED \u00B7 ON-PREM</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              $25,000
              <span className="text-sm text-muted font-normal ml-2">/year \u00B7 annual license</span>
            </p>
            <p className="text-xs text-muted mt-1">
              Unlimited scans \u00B7 unlimited RPM \u00B7 zero external network calls \u00B7 on-prem audit storage
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['+$10K/additional site', 'Custom rules', 'On-site deployment', 'Support SLA', 'Source escrow'].map((a) => (
                <span key={a} className="text-[10px] text-muted border border-[rgba(255,255,255,0.07)] rounded-full px-2.5 py-0.5">{a}</span>
              ))}
            </div>
          </div>
          <a
            href={LINKS.sovereign}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-medium px-6 py-3 rounded-xl border border-amber/30 text-amber hover:bg-amber/10 transition-colors whitespace-nowrap"
          >
            {'\u{1F1EA}\u{1F1EC} \u{1F1E6}\u{1F1EA} \u{1F1F8}\u{1F1E6}'} Request Sovereign License \u2192
          </a>
        </motion.div>

        <p className="text-center text-xs text-muted mt-6">
          Annual plans save ~17% \u00B7 Setup fees are one-time \u00B7{' '}
          <a href="mailto:ayman@teosegypt.com?subject=Pricing%20Question%20%E2%80%94%20TEOS%20Sentinel" className="text-muted hover:text-white underline underline-offset-2">
            Questions? ayman@teosegypt.com
          </a>
        </p>
      </div>
    </section>
  );
}
