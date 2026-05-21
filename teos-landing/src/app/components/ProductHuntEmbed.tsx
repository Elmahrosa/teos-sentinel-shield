'use client';

import { motion } from 'framer-motion';

const TRUST_METRICS = [
  { value: '27', label: 'Named Rules' },
  { value: '39/39', label: 'Tests Passing' },
  { value: 'v2.4', label: 'Engine Stable' },
  { value: '75+', label: 'Nations' },
];

const PH_URL = 'https://www.producthunt.com/posts/teos-sovereign-sentinel';
const PH_EMBED_URL = `${PH_URL}/embed`;
const PH_DISCUSS_URL = `${PH_URL}#discussion`;

export default function ProductHuntEmbed() {
  return (
    <section
      id="producthunt"
      aria-label="Featured on Product Hunt"
      className="relative w-full overflow-hidden px-6 py-24 lg:px-8 lg:py-32"
    >
      {/* Ambient gold halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
      >
        <div className="h-[520px] w-[820px] max-w-full rounded-full bg-[radial-gradient(closest-side,rgba(212,175,55,0.18),rgba(212,175,55,0.05)_45%,transparent_75%)] blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-12 max-w-[900px] text-center"
      >
        <div className="mb-4 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#d4af37]/80">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#d4af37]/60" />
          Product Hunt Launch
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#d4af37]/60" />
        </div>
        <h2 className="bg-gradient-to-b from-[#f5e6a8] via-[#d4af37] to-[#a8842c] bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl">
          {'\u{1F680}'} Featured on Product Hunt
        </h2>
        <p className="mx-auto mt-4 max-w-[600px] text-base leading-relaxed text-white/60">
          Your upvote puts a{' '}
          <span className="font-semibold text-white/90">deterministic firewall</span>{' '}
          in front of every AI-generated command.
        </p>
        <p className="mt-2 font-mono text-[11px] tracking-[0.08em] text-[#d4af37]/70">
          ALLOW / WARN / BLOCK every AI-generated command
        </p>
      </motion.div>

      {/* Showcase card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="group relative mx-auto w-full max-w-[1100px]"
      >
        {/* Hover glow ring */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-[#d4af37]/40 via-[#f5d76e]/15 to-transparent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
        />

        <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-500 supports-[backdrop-filter]:bg-white/[0.03] group-hover:border-[#d4af37]/45 group-hover:shadow-[0_20px_60px_-15px_rgba(212,175,55,0.25)] sm:p-8 md:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5"
          />

          <div className="relative grid gap-10 md:grid-cols-[1fr_1.1fr]">
            {/* Left: trust panel */}
            <div className="flex flex-col">
              {/* Live indicator */}
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#f5d76e]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4af37] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d4af37]" />
                </span>
                Live on Product Hunt
              </div>

              <h3 className="font-sans text-2xl font-bold leading-tight text-white sm:text-[28px]">
                TEOS Sovereign Sentinel
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Pre-execution firewall for AI agents. Deterministic. 27 named rules. Every command gated before it reaches production.
              </p>

              {/* Primary upvote CTA */}
              <a
                href={PH_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Upvote TEOS Sovereign Sentinel on Product Hunt"
                className="mt-7 inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#a8842c] px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-black shadow-[0_8px_24px_-6px_rgba(212,175,55,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:from-[#f5d76e] hover:to-[#d4af37] hover:shadow-[0_14px_36px_-6px_rgba(212,175,55,0.7)]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                  <path d="M7 1.2 13 9H1z" />
                </svg>
                Upvote on Product Hunt
              </a>
              <p className="mt-2 text-center font-mono text-[10px] tracking-[0.1em] text-white/40 sm:text-left">
                One click. No signup required.
              </p>

              {/* Trust metrics */}
              <div className="mt-7 grid grid-cols-4 gap-3 border-t border-white/5 pt-6">
                {TRUST_METRICS.map((m) => (
                  <div key={m.label} className="font-mono">
                    <div className="text-base font-bold text-[#f5d76e] sm:text-lg">
                      {m.value}
                    </div>
                    <div className="mt-1 text-[9px] uppercase tracking-[0.08em] text-white/40 sm:text-[10px]">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Maker quote */}
              <blockquote className="mt-6 border-l-2 border-[#d4af37]/40 pl-4 text-sm italic leading-relaxed text-white/65">
                &ldquo;Probabilistic safety scoring is a guess. We built the deterministic alternative — same input, same verdict, always.&rdquo;
                <footer className="mt-2 font-mono text-[10px] not-italic uppercase tracking-[0.1em] text-white/40">
                  — Ayman Seif · Alexandria, Egypt
                </footer>
              </blockquote>
            </div>

            {/* Right: official PH embed + secondary CTA */}
            <div className="flex flex-col">
              <div className="relative w-full overflow-hidden rounded-xl border border-[#d4af37]/20 bg-black/40 shadow-inner">
                <iframe
                  title="TEOS Sovereign Sentinel on Product Hunt"
                  src={PH_EMBED_URL}
                  loading="lazy"
                  allowFullScreen
                  scrolling="no"
                  frameBorder={0}
                  style={{ border: 'none', width: '100%', height: '405px' }}
                />
              </div>

              <a
                href={PH_DISCUSS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 transition-all duration-300 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/[0.06] hover:text-[#f5d76e]"
              >
                Join the discussion on Product Hunt
                <span aria-hidden="true">→</span>
              </a>

              {/* Mini trust strip */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/5 pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                <span>Closed Beta · Engine v2.4</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/20" />
                <span>Built in Alexandria, Egypt</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/20" />
                <span>Elmahrosa International</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
