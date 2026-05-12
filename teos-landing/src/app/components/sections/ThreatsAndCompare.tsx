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

const THREATS = [
  { icon: '\u{1F6D1}', cat: 'Shell Destruction', desc: 'rm -rf, format, disk wipes, fork bombs. Wiper-pattern commands blocked before execution.' },
  { icon: '\u{1F6D1}', cat: 'Secret Leakage', desc: 'Hardcoded API keys, tokens, environment variable exposure in code and CI logs.' },
  { icon: '\u{1F6D1}', cat: 'Injection & Evasion', desc: 'SQL injection, command injection, path traversal, SSRF, and obfuscated eval/exec patterns.' },
  { icon: '\u{1F6D1}', cat: 'Supply Chain Risk', desc: 'Known malicious packages (event-stream, ua-parser-js), typosquats, and floating versions.' },
  { icon: '\u{1F6D1}', cat: 'CI/CD Abuse', desc: 'write-all permissions, curl|bash in pipelines, privileged containers, secrets dumping.' },
];

const COMPARE_ROWS = [
  { cap: 'Pre-execution blocking', sentinel: '\u2713 Yes', others: ['\u2717 Post-commit', '\u2717 Post-commit', '\u2717'] },
  { cap: 'AI agent native design', sentinel: '\u2713 Yes', others: ['\u2717', '\u2717', '\u2717'] },
  { cap: 'Pre-execution enforcement', sentinel: '\u2713 Yes', others: ['\u2717', '\u2717', '\u2717'] },
  { cap: 'Shell command enforcement', sentinel: '\u2713 R01\u2013R08', others: ['\u2717', '\u2717', '\u26A0 Limited'] },
  { cap: 'Supply chain audit', sentinel: '\u2713 Team+', others: ['\u2713', '\u2713', '\u2713'] },
  { cap: 'Regional deployment focus', sentinel: '\u2713 Yes', others: ['\u2717', '\u2717', '\u2717'] },
  { cap: 'Government pilot program', sentinel: '\u2713 MENA focus', others: ['\u2717', '\u2717', '\u2717 Enterprise'] },
];

function cellColor(val: string): string {
  if (val.startsWith('\u2713')) return 'text-green';
  if (val.startsWith('\u26A0')) return 'text-amber';
  return 'text-white/[0.2]';
}

const LAYERS = [
  { position: '1st', name: 'TEOS Sentinel', role: 'Pre-execution enforcement', tools: '', desc: 'Deterministic policy evaluation before anything runs. Blocks dangerous commands at the source.' },
  { position: '2nd', name: 'Sandbox / MicroVM', role: 'Runtime isolation', tools: 'Firecracker, E2B, gVisor', desc: 'Contains execution in isolated environments. Limits blast radius if enforcement is bypassed.' },
  { position: '3rd', name: 'Runtime Telemetry', role: 'Behavioral monitoring', tools: 'Falco, Oligo, Tracee', desc: 'Detects anomalous runtime behavior. Alerts post-execution. Complements pre-execution enforcement.' },
  { position: '4th', name: 'Static Analysis', role: 'Repo scanning', tools: 'Semgrep, Trivy, Snyk', desc: 'Finds vulnerabilities in committed code. Post-commit, pre-deployment. Catches what TEOS never sees.' },
  { position: '5th', name: 'AI Governance', role: 'Enterprise policy management', tools: 'Wiz, HiddenLayer, Palo Alto', desc: 'Broad AI security posture management. TEOS feeds enforcement decisions into their dashboards.' },
];

export default function ThreatsAndCompare() {
  const section = useInView();

  return (
    <>
      {/* THREATS */}
      <section className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] relative z-[1]" ref={section.setRef}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Threat Coverage</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-10 md:mb-12">
            Five threat categories.<br />
            Twenty-five named rules.
          </h2>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
            {THREATS.map((t, i) => (
              <div key={i} className="border border-[rgba(255,255,255,0.07)] rounded-sm bg-surface p-6 hover:border-[rgba(255,255,255,0.12)] transition-colors">
                <div className="text-2xl mb-3" aria-hidden="true">{t.icon}</div>
                <h4 className="text-[14px] font-[700] mb-2 tracking-[-0.01em]">{t.cat}</h4>
                <p className="font-mono text-[12px] text-muted leading-[1.7]">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section id="compare" className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] relative z-[1]" ref={section.setRef}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Competitive Edge</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            The only pre-execution<br />enforcement layer.
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-12">
            GitGuardian, Snyk, Checkmarx \u2014 all evaluate post-commit. Sentinel blocks before your agent runs the command. Different threat model.
          </p>

          <div className={`overflow-x-auto rounded-sm ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
            <table className="w-full min-w-[580px] border-collapse font-mono text-[12px] md:text-[13px]" role="table" aria-label="Competitive comparison">
              <thead>
                <tr>
                  <th className="text-left py-[14px] px-4 border-b border-[rgba(255,255,255,0.12)] text-white text-[13px] font-normal tracking-normal normal-case">Capability</th>
                  <th className="text-left py-[14px] px-4 border-b border-[rgba(255,255,255,0.12)] text-white text-[11px] tracking-[0.08em] uppercase">𓂀 Sentinel</th>
                  {['GitGuardian', 'Snyk', 'Checkmarx'].map((c) => (
                    <th key={c} className="text-left py-[14px] px-4 border-b border-[rgba(255,255,255,0.12)] text-muted text-[11px] tracking-[0.08em] uppercase">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.07)]">
                    <td className="py-[14px] px-4 text-white">{row.cap}</td>
                    <td className="py-[14px] px-4 bg-red/[0.04] text-white"><span className={row.sentinel.startsWith('\u2713') ? 'text-green' : ''}>{row.sentinel}</span></td>
                    {row.others.map((o, j) => (
                      <td key={j} className="py-[14px] px-4 text-muted"><span className={cellColor(o)}>{o}</span></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECURITY LAYERING */}
      <section id="layers" className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] bg-gradient-to-b from-black via-surface to-black relative z-[1]" ref={section.setRef}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Security Layers</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            Defense in depth.<br />TEOS goes first.
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-12">
            TEOS is the first enforcement layer \u2014 not a replacement for sandboxing, monitoring, or static analysis. It stops dangerous commands before they reach production.
          </p>

          <div className={`border border-[rgba(255,255,255,0.12)] rounded-sm overflow-hidden ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
            <div className="hidden md:grid grid-cols-12 gap-0 bg-surface2 px-5 py-3 font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
              <div className="col-span-1">Order</div>
              <div className="col-span-3">Layer</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-3">Tools</div>
              <div className="col-span-3">What it does</div>
            </div>

            {LAYERS.map((layer, i) => (
              <div
                key={layer.name}
                className={`grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-0 px-5 py-4 ${
                  layer.position === '1st' ? 'bg-red/[0.06] border-l-2 border-l-red' : i % 2 === 0 ? 'bg-black/30' : 'bg-transparent'
                } border-t border-[rgba(255,255,255,0.05)] text-[12px] font-mono`}
              >
                <div className="md:col-span-1">
                  <span className={`font-mono text-[11px] font-[700] px-2 py-[3px] rounded-sm ${
                    layer.position === '1st' ? 'bg-red/15 text-red border border-red/40' : 'text-muted'
                  }`}>
                    {layer.position}
                  </span>
                </div>
                <div className={`md:col-span-3 font-[700] ${layer.position === '1st' ? 'text-red' : 'text-white'}`}>
                  {layer.name}
                </div>
                <div className="md:col-span-2 text-muted">{layer.role}</div>
                <div className="md:col-span-3 text-muted">{layer.tools || <span className="text-red/60 italic">TEOS is the tool</span>}</div>
                <div className="md:col-span-3 text-muted">{layer.desc}</div>
              </div>
            ))}
          </div>

          <div className={`mt-8 p-6 border border-[rgba(255,255,255,0.08)] rounded-sm bg-surface ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600 delay-200`}>
            <p className="font-mono text-[12px] text-muted leading-[1.7]">
              <span className="text-red font-[700]">Why first matters:</span> A command blocked before execution costs zero compute, generates no logs, and creates no blast radius. Post-execution monitoring catches what gets through \u2014 but the enforcement layer reduces the attack surface before it reaches the sandbox.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
