'use client';

import { useEffect, useState } from 'react';

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

const STEPS = [
  { num: '01', title: 'Command Generated', desc: 'AI agent, developer, or CI pipeline generates a command \u2014 shell, SQL, CI/CD YAML, or npm manifest.' },
  { num: '02', title: 'Routed to Sentinel', desc: 'Command intercepted via Telegram bot, API gateway, or CI hook. Zero config required.' },
  { num: '03', title: 'Enforcement Engine Evaluates', desc: '25 deterministic rules evaluate against execution policy. No probabilistic scoring. Named rules, fixed thresholds.' },
  { num: '04', title: 'Verdict Returned', desc: 'Structured decision with rule ID, risk score 0\u2013100, and human-readable explanation.', verdicts: true },
  { num: '05', title: 'Execution Decision', desc: 'Allowed or blocked. Enforcement is deterministic \u2014 same input always produces same verdict.' },
  { num: '06', title: 'Audit Logged', desc: 'Every decision persisted with timestamp, rule ID, and SHA-256 hash. Full audit trail for compliance.' },
];

const SCAN_LINES = [
  { cmd: '/enforce rm -rf /', verdict: 'BLOCK', score: '100/100', rule: 'R01.DESTRUCTIVE_SHELL', reason: 'rm -rf permanently deletes all filesystem data.', action: 'Execution prevented. Credit not consumed.', color: 'red', icon: '🛑' },
  { cmd: '/enforce DROP TABLE users;', verdict: 'WARN', score: '75/100', rule: 'R09.SQL_DESTRUCTION', reason: 'DROP TABLE destroys database tables permanently.', action: 'Human review recommended. Credits left: 997', color: 'amber', icon: '⚠️' },
  { cmd: '/enforce console.log("hello world")', verdict: 'ALLOW', score: '0/100', rule: 'R00.CLEAN', reason: 'No destructive patterns detected.', action: 'Safe to execute. Credits left: 996', color: 'green', icon: '✅' },
];

const colorMap: Record<string, { text: string; bg: string; border: string }> = {
  red: { text: 'text-red', bg: 'bg-red/[0.06]', border: 'border-red/30' },
  amber: { text: 'text-amber', bg: 'bg-amber/[0.06]', border: 'border-amber/30' },
  green: { text: 'text-green', bg: 'bg-green/[0.05]', border: 'border-green/25' },
};

const ENTERPRISE_STACK = [
  { layer: 'AI Agent / Developer / CI', desc: 'Generates commands, scripts, and configurations', cls: 'border-[rgba(255,255,255,0.12)] bg-surface2' },
  { layer: '𓂀 TEOS Sentinel', desc: 'Pre-execution enforcement \u2014 deterministic policy evaluation before anything runs', cls: 'border-red/50 bg-red/[0.08] ring-1 ring-red/30' },
  { layer: 'Sandbox / MicroVM', desc: 'Runtime isolation \u2014 Firecracker, E2B, gVisor contain execution', cls: 'border-[rgba(255,255,255,0.12)] bg-surface2' },
  { layer: 'Falco / Runtime Telemetry', desc: 'Post-execution monitoring \u2014 behavioral detection, anomaly alerts', cls: 'border-[rgba(255,255,255,0.12)] bg-surface2' },
];

export default function ArchitectureAndDemo() {
  const section = useInView();
  const demo = useInView(0.15);

  return (
    <>
      {/* ARCHITECTURE */}
      <section id="architecture" className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] bg-gradient-to-b from-black via-surface to-black relative z-[1]" ref={section.setRef}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Architecture</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            Deterministic enforcement<br />before execution.
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-16">
            TEOS sits between command generation and runtime. Every action passes through the enforcement engine before it reaches production.
          </p>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px border border-[rgba(255,255,255,0.12)] rounded-sm overflow-hidden ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
            {STEPS.map((step) => (
              <div key={step.num} className="bg-surface2 p-6 md:p-7 border border-[rgba(255,255,255,0.07)]">
                <div className="font-mono text-[11px] text-muted tracking-[0.1em] mb-3">STEP {step.num}</div>
                <h4 className="text-[15px] font-[700] mb-2.5 tracking-[-0.01em]">{step.title}</h4>
                <p className="font-mono text-[12px] text-muted leading-[1.7]">{step.desc}</p>
                {step.verdicts && (
                  <div className="flex gap-1.5 flex-wrap mt-3.5">
                    <span className="font-mono text-[11px] font-[700] px-2 py-[3px] rounded-sm bg-red/10 text-red border border-red/30">🛑 BLOCK</span>
                    <span className="font-mono text-[11px] font-[700] px-2 py-[3px] rounded-sm bg-amber/10 text-amber border border-amber/30">\u26A0\uFE0F WARN</span>
                    <span className="font-mono text-[11px] font-[700] px-2 py-[3px] rounded-sm bg-green/10 text-green border border-green/25">\u2705 ALLOW</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Enterprise Stack Diagram */}
          <div className={`mt-10 md:mt-12 ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600 delay-200`}>
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted mb-5">Full Enterprise Architecture</p>
            <div className="flex flex-col gap-0 max-w-[780px]">
              {ENTERPRISE_STACK.map((item, i) => (
                <div key={i} className="relative">
                  <div className={`flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-5 px-5 md:px-7 py-[16px] border rounded-sm ${item.cls} ${
                    item.layer.includes('TEOS') ? 'md:scale-[1.02] md:-translate-x-1' : ''
                  }`}>
                    <span className={`font-mono text-[13px] md:text-[14px] font-[700] ${
                      item.layer.includes('TEOS') ? 'text-red' : 'text-white'
                    }`}>
                      {item.layer}
                    </span>
                    <span className="font-mono text-[11px] text-muted">{item.desc}</span>
                  </div>
                  {i < ENTERPRISE_STACK.length - 1 && (
                    <div className="flex justify-center py-1.5">
                      <span className="font-mono text-[16px] text-muted" aria-hidden="true">&#8595;</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] text-muted mt-4 max-w-[600px]">
              TEOS is the first enforcement layer \u2014 deterministic policy evaluation before runtime isolation and behavioral monitoring. Complementary to, not a replacement for, sandbox and telemetry layers.
            </p>
          </div>
        </div>
      </section>

      {/* TERMINAL DEMO */}
      <section id="demo" className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] relative z-[1]" ref={demo.setRef}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Enforcement Output</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            Three commands.<br />Three verdicts. Deterministic.
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-12">
            Every enforcement returns a risk score, rule ID, and structured explanation. Same input always produces the same verdict.
          </p>

          {/* Terminal */}
          <div className={`border border-[rgba(255,255,255,0.12)] rounded-md overflow-hidden max-w-[780px] ${demo.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} transition-all duration-700`} style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
            <div className="bg-[#1a1a1c] border-b border-[rgba(255,255,255,0.07)] px-4 py-3 flex items-center gap-1.5">
              <span className="w-[10px] h-[10px] rounded-full bg-red" aria-hidden="true" />
              <span className="w-[10px] h-[10px] rounded-full bg-amber" aria-hidden="true" />
              <span className="w-[10px] h-[10px] rounded-full bg-green" aria-hidden="true" />
              <span className="font-mono text-[11px] text-muted ml-2 truncate">@teoslinker_bot \u00B7 TEOS Sentinel v2.4 \u00B7 Engine Online</span>
            </div>

            <div className="bg-[#0e0e10] p-6 md:p-7">
              {SCAN_LINES.map((scan, i) => {
                const c = colorMap[scan.color];
                return (
                  <div key={i} className={i > 0 ? 'mt-5' : ''}>
                    <div className="font-mono text-[13px] leading-[1.8] flex items-start gap-2 mb-1">
                      <span className="text-red flex-shrink-0" aria-hidden="true">\u203A</span>
                      <span className="text-white">{scan.cmd}</span>
                    </div>
                    <div className="font-mono text-[13px] text-muted italic pl-5 mb-4">
                      evaluating<span className="cursor-blink ml-[2px]">_</span>
                    </div>
                    <div className={`ml-5 mb-2 p-4 md:p-5 rounded-sm border ${c.border} ${c.bg}`}>
                      <div className={`font-mono text-[13px] md:text-[14px] font-[700] ${c.text} mb-2.5`}>
                        {scan.icon} {scan.verdict} \u2014 Risk Score: {scan.score}
                      </div>
                      <div className="font-mono text-[12px] text-muted leading-[1.9]">
                        <span className="text-white inline-block min-w-[60px] md:min-w-[72px]">Rule:</span>{scan.rule}
                      </div>
                      <div className="font-mono text-[12px] text-muted leading-[1.9]">
                        <span className="text-white inline-block min-w-[60px] md:min-w-[72px]">Reason:</span>{scan.reason}
                      </div>
                      <div className="font-mono text-[12px] text-muted leading-[1.9]">
                        <span className="text-white inline-block min-w-[60px] md:min-w-[72px]">Action:</span>{scan.action}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
