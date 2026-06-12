'use client';

import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

function Node({ children, delay = 0, className, onClick }: { children: React.ReactNode; delay?: number; className?: string; onClick?: () => void }) {
  return (
    <motion.g
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
      whileHover={onClick ? { opacity: 0.82 } : undefined}
    >
      {children}
    </motion.g>
  );
}

export default function ArchitectureDiagram() {
  return (
    <section id="architecture" className="w-full py-20 md:py-24 px-6 border-b border-[rgba(255,255,255,0.07)] bg-gradient-to-b from-black via-surface to-black relative z-[1]">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-3">Architecture</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] text-white mb-5">
            Pre-execution enforcement pipeline
          </h2>
          <p className="text-sm text-muted max-w-md mx-auto leading-[1.6]">
            Every command is scanned before execution. 25 deterministic regex rules. No ML. No probabilistic scoring.
          </p>
        </motion.div>

        <svg
          width="100%"
          viewBox="0 0 640 520"
          role="img"
          aria-label="TEOS Sentinel Shield architecture: AI agent sends command to enforcement API, 25 rules engine returns ALLOW/WARN/BLOCK verdict, all logged to SHA-256 audit chain"
          className="overflow-visible"
        >
          <defs>
            <marker
              id="arr"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M2 1L8 5L2 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>

          {/* Row 1: Agent → API → Rules */}

          <Node delay={0}>
            <rect x="40" y="60" width="130" height="56" rx="8" fill="#1e1a3a" stroke="#534AB7" strokeWidth="0.5" />
            <text x="105" y="82" textAnchor="middle" dominantBaseline="central" fill="#AFA9EC" fontSize="13" fontWeight="500">AI agent</text>
            <text x="105" y="100" textAnchor="middle" dominantBaseline="central" fill="#7F77DD" fontSize="11">Autonomous system</text>
          </Node>

          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}>
            <line x1="170" y1="88" x2="218" y2="88" stroke="#534AB7" strokeWidth="1" markerEnd="url(#arr)" fill="none" />
            <text x="194" y="80" textAnchor="middle" fill="#7F77DD" fontSize="10">command</text>
          </motion.g>

          <Node delay={1}>
            <rect x="220" y="60" width="148" height="56" rx="8" fill="#1a1a1a" stroke="#444441" strokeWidth="0.5" />
            <text x="294" y="82" textAnchor="middle" dominantBaseline="central" fill="#D3D1C7" fontSize="13" fontWeight="500">Enforcement API</text>
            <text x="294" y="100" textAnchor="middle" dominantBaseline="central" fill="#888780" fontSize="10">teos-sentinel-shield.vercel.app</text>
          </Node>

          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}>
            <line x1="368" y1="88" x2="414" y2="88" stroke="#444441" strokeWidth="1" markerEnd="url(#arr)" fill="none" />
            <text x="391" y="80" textAnchor="middle" fill="#888780" fontSize="10">scan</text>
          </motion.g>

          <Node delay={2}>
            <rect x="416" y="60" width="140" height="56" rx="8" fill="#0d2820" stroke="#0F6E56" strokeWidth="0.5" />
            <text x="486" y="82" textAnchor="middle" dominantBaseline="central" fill="#5DCAA5" fontSize="13" fontWeight="500">25 regex rules</text>
            <text x="486" y="100" textAnchor="middle" dominantBaseline="central" fill="#1D9E75" fontSize="11">Deterministic &middot; No ML</text>
          </Node>

          {/* Divider */}
          <motion.line
            x1="40" y1="148" x2="600" y2="148"
            stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          />
          <motion.text
            x="320" y="163" textAnchor="middle" fill="rgba(240,237,232,0.45)" fontSize="10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          >verdict</motion.text>

          {/* Fan arrows from rules engine to verdicts */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.72 }}>
            <path d="M486 116 L486 152 L126 152 L126 180" fill="none" stroke="#1D9E75" strokeWidth="1" markerEnd="url(#arr)" />
            <path d="M486 116 L486 152 L340 152 L340 180" fill="none" stroke="#BA7517" strokeWidth="1" markerEnd="url(#arr)" />
            <path d="M486 116 L486 152 L546 152 L546 180" fill="none" stroke="#A32D2D" strokeWidth="1" markerEnd="url(#arr)" />
          </motion.g>

          {/* Verdict boxes */}

          <Node delay={4}>
            <rect x="40" y="180" width="172" height="76" rx="8" fill="#0d2010" stroke="#0F6E56" strokeWidth="0.5" />
            <text x="126" y="208" textAnchor="middle" dominantBaseline="central" fill="#5DCAA5" fontSize="15" fontWeight="500">ALLOW</text>
            <text x="126" y="232" textAnchor="middle" dominantBaseline="central" fill="#1D9E75" fontSize="11">Safe to execute</text>
          </Node>

          <Node delay={5}>
            <rect x="254" y="180" width="172" height="76" rx="8" fill="#221800" stroke="#854F0B" strokeWidth="0.5" />
            <text x="340" y="208" textAnchor="middle" dominantBaseline="central" fill="#EF9F27" fontSize="15" fontWeight="500">WARN</text>
            <text x="340" y="232" textAnchor="middle" dominantBaseline="central" fill="#BA7517" fontSize="11">Review before running</text>
          </Node>

          <Node delay={6}>
            <rect x="468" y="180" width="172" height="76" rx="8" fill="#220808" stroke="#A32D2D" strokeWidth="0.5" />
            <text x="554" y="208" textAnchor="middle" dominantBaseline="central" fill="#F09595" fontSize="15" fontWeight="500">BLOCK</text>
            <text x="554" y="232" textAnchor="middle" dominantBaseline="central" fill="#E24B4A" fontSize="11">Halted &mdash; risk detected</text>
          </Node>

          {/* Arrows: verdicts to audit log */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.96 }}>
            <path d="M126 256 L126 330 L294 330 L294 350" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" markerEnd="url(#arr)" />
            <path d="M340 256 L340 350" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" markerEnd="url(#arr)" />
            <path d="M554 256 L554 330 L386 330 L386 350" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" markerEnd="url(#arr)" />
          </motion.g>

          {/* SHA-256 Audit Chain */}
          <Node delay={8}>
            <rect x="210" y="350" width="260" height="56" rx="8" fill="#1a1a1a" stroke="#444441" strokeWidth="0.5" />
            <text x="340" y="372" textAnchor="middle" dominantBaseline="central" fill="#D3D1C7" fontSize="13" fontWeight="500">SHA-256 audit chain</text>
            <text x="340" y="390" textAnchor="middle" dominantBaseline="central" fill="#888780" fontSize="11">Immutable &middot; tamper-evident log</text>
          </Node>

          {/* Arrow: audit to transparency */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.08 }}>
            <line x1="340" y1="406" x2="340" y2="446" stroke="rgba(255,255,255,0.12)" strokeWidth="1" markerEnd="url(#arr)" fill="none" />
          </motion.g>

          {/* Transparency Page */}
          <Node delay={9}>
            <rect x="210" y="448" width="260" height="52" rx="8" fill="#1e1a3a" stroke="#534AB7" strokeWidth="0.5" />
            <text x="340" y="468" textAnchor="middle" dominantBaseline="central" fill="#AFA9EC" fontSize="13" fontWeight="500">Transparency page</text>
            <text x="340" y="486" textAnchor="middle" dominantBaseline="central" fill="#7F77DD" fontSize="11">Public rules &middot; schema &middot; audit docs</text>
          </Node>
        </svg>
      </div>
    </section>
  );
}
