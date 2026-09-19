'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

const DODO = {
  free:              'https://dodo.pe/xm1619v9elp',
  starter_monthly:   'https://dodo.pe/teos-starter-monthly-730161',
  starter_annual:    'https://dodo.pe/teos-starter-annual-730161',
  team_monthly:      'https://dodo.pe/teos-team-monthly-730161',
  team_annual:       'https://dodo.pe/teos-team-annual-730161',
  enterprise:        'mailto:ayman@elmahrosa.org?subject=Enterprise%20Pricing%20%E2%80%94%20TEOS%20Sentinel',
  sovereign:         'mailto:ayman@elmahrosa.org?subject=Sovereign%20Deployment%20%E2%80%94%20TEOS%20Sentinel',
};

interface Tier {
  id: string;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  annualEffective: string;
  setup: string;
  scans: string;
  rpm: string;
  features: string[];
  monthlyLink: string;
  annualLink: string;
  featured?: boolean;
  badge?: string;
  ctaLabel: string;
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    annualEffective: '',
    setup: '$0',
    scans: '50 / mo',
    rpm: '5',
    features: [
      'ALLOW / WARN / BLOCK verdicts',
      '25-rule deterministic engine',
      'Basic audit log',
    ],
    monthlyLink: DODO.free,
    annualLink: DODO.free,
    ctaLabel: 'Get started',
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: '$29',
    annualPrice: '$290',
    annualEffective: '$24.17 / mo',
    setup: '$500',
    scans: '5,000 / mo',
    rpm: '30',
    features: [
      'Everything in Free',
      '5K scans / month',
      'Webhook delivery',
      'Email support',
    ],
    monthlyLink: DODO.starter_monthly,
    annualLink: DODO.starter_annual,
    ctaLabel: 'Subscribe',
  },
  {
    id: 'team',
    name: 'Team',
    monthlyPrice: '$149',
    annualPrice: '$1,490',
    annualEffective: '$124.17 / mo',
    setup: '$2,000',
    scans: '50,000 / mo',
    rpm: '150',
    features: [
      'Everything in Starter',
      '50K scans / month',
      'Priority support',
      'SSE audit stream',
      'Custom rule tuning',
    ],
    monthlyLink: DODO.team_monthly,
    annualLink: DODO.team_annual,
    featured: true,
    badge: '\u2605 Most popular',
    ctaLabel: 'Subscribe',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    annualEffective: '',
    setup: '$0',
    scans: 'Unlimited',
    rpm: '600',
    features: [
      'Everything in Team',
      'Unlimited scans',
      '600 RPM',
      'Dedicated onboarding',
      'SLA guarantee',
    ],
    monthlyLink: DODO.enterprise,
    annualLink: DODO.enterprise,
    ctaLabel: 'Contact us',
  },
];

const SOVEREIGN_ADDONS = [
  'Additional sites',
  'Custom rule authoring',
  'On-site deployment',
  'Support SLA',
  'Source escrow',
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const },
  }),
};

function Price({ value, sub }: { value: string; sub?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={value}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className="flex items-baseline gap-0.5"
      >
        <span className="text-3xl font-semibold text-white">{value}</span>
        {sub && <span className="text-sm text-neutral-500 ml-1">{sub}</span>}
      </motion.div>
    </AnimatePresence>
  );
}

function TierCard({ tier, annual, index }: { tier: Tier; annual: boolean; index: number }) {
  const price = annual ? tier.annualPrice : tier.monthlyPrice;
  const priceSub = price === 'Custom' ? '' : tier.id === 'free'
    ? 'forever'
    : annual
    ? '/year'
    : '/month';
  const link = annual ? tier.annualLink : tier.monthlyLink;

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={[
        'relative flex flex-col rounded-2xl p-6 transition-shadow',
        'bg-[#111113] border',
        tier.featured
          ? 'border-[#e63333] shadow-[0_0_24px_-4px_rgba(230,51,51,0.35)]'
          : 'border-[rgba(255,255,255,0.07)]',
      ].join(' ')}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold bg-[#e63333] text-white px-3 py-1 rounded-full">
          {tier.badge}
        </span>
      )}

      <div className="mb-4">
        <p className="text-xs font-mono tracking-widest text-[rgba(240,237,232,0.45)] uppercase mb-1">
          {tier.name}
        </p>
        <Price value={price} sub={priceSub} />
        <AnimatePresence mode="wait">
          {annual && tier.annualEffective ? (
            <motion.p
              key="eff"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-[#22c55e] mt-0.5 overflow-hidden"
            >
              {tier.annualEffective} effective
            </motion.p>
          ) : null}
        </AnimatePresence>
        {tier.setup !== '$0' && (
          <p className="text-xs text-[rgba(240,237,232,0.45)] mt-0.5">+{tier.setup} setup</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.07)]">
        <div>
          <p className="text-[10px] text-[rgba(240,237,232,0.45)] uppercase tracking-widest mb-0.5">Scans</p>
          <p className="text-sm font-medium text-[#f0ede8]">{tier.scans}</p>
        </div>
        <div>
          <p className="text-[10px] text-[rgba(240,237,232,0.45)] uppercase tracking-widest mb-0.5">RPM</p>
          <p className="text-sm font-medium text-[#f0ede8]">{tier.rpm}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2 mb-6 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[rgba(240,237,232,0.45)]">
            <Check size={13} className="mt-0.5 shrink-0 text-[#22c55e]" />
            {f}
          </li>
        ))}
      </ul>

      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={[
          'block text-center text-sm font-medium py-2.5 rounded-xl transition-opacity hover:opacity-85',
          tier.featured
            ? 'bg-[#e63333] text-white'
            : 'bg-[rgba(255,255,255,0.07)] text-[#f0ede8] border border-[rgba(255,255,255,0.12)]',
        ].join(' ')}
      >
        {tier.ctaLabel}
      </a>
    </motion.div>
  );
}

export default function PricingTable() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="w-full py-20 md:py-24 px-6 border-b border-[rgba(255,255,255,0.07)] bg-gradient-to-b from-black via-[#111113] to-black relative z-[1]">
      <div className="max-w-5xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-xs font-mono tracking-widest text-[rgba(240,237,232,0.45)] uppercase mb-3">
            Pricing
          </p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-2 text-white">
            Execution safety at every scale.
          </h2>
          <p className="text-sm text-[rgba(240,237,232,0.45)] max-w-md mx-auto">
            From solo developers to sovereign-grade air-gapped deployments.
          </p>
        </motion.div>

        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm ${!annual ? 'text-white' : 'text-[rgba(240,237,232,0.45)]'}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            role="switch"
            aria-checked={annual}
            aria-label="Toggle annual billing"
            className={[
              'relative w-10 h-5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e63333]',
              annual ? 'bg-[#e63333]' : 'bg-[rgba(255,255,255,0.12)]',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                annual ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
          <span className={`text-sm ${annual ? 'text-white' : 'text-[rgba(240,237,232,0.45)]'}`}>
            Annual
          </span>
          <AnimatePresence>
            {annual && (
              <motion.span
                key="save"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-[10px] font-semibold bg-[rgba(34,197,94,0.15)] text-[#22c55e] border border-[rgba(34,197,94,0.3)] px-2.5 py-1 rounded-full"
              >
                Save ~17%
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {TIERS.map((tier, i) => (
            <TierCard key={tier.id} tier={tier} annual={annual} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#111113] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div>
            <p className="text-xs font-mono tracking-widest text-[rgba(240,237,232,0.45)] uppercase mb-1">
              Sovereign
            </p>
            <p className="text-2xl font-semibold text-white">
              Custom
              <span className="text-sm text-[rgba(240,237,232,0.45)] font-normal ml-2">
                &middot; quoted per deployment
              </span>
            </p>
            <p className="text-xs text-[rgba(240,237,232,0.45)] mt-1">
              Unlimited scans &middot; unlimited RPM &middot; custom deployment
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {SOVEREIGN_ADDONS.map((a) => (
                <span
                  key={a}
                  className="text-[10px] font-medium text-[rgba(240,237,232,0.45)] border border-[rgba(255,255,255,0.07)] rounded-full px-2.5 py-0.5"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
          <a
            href={DODO.sovereign}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-medium px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors whitespace-nowrap"
          >
            Request deployment
          </a>
        </motion.div>

        <p className="text-center text-xs text-[rgba(240,237,232,0.45)] mt-6">
          Billing via Dodo Payments. All prices in USD. Setup fee is one-time.{' '}
          <a
            href="mailto:ayman@teosegypt.com"
            className="text-[rgba(240,237,232,0.45)] hover:text-white underline underline-offset-2"
          >
            Questions? ayman@teosegypt.com
          </a>
        </p>
      </div>
    </section>
  );
}
