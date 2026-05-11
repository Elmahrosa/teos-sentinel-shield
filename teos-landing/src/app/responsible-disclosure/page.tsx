import Link from 'next/link';

export const metadata = {
  title: 'Responsible Disclosure — TEOS Sentinel',
  description: 'Report security vulnerabilities in TEOS Sentinel Shield.',
};

export default function ResponsibleDisclosurePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-[720px] mx-auto px-6 py-20">
        <Link href="/" className="font-mono text-[13px] text-muted no-underline hover:text-white transition-colors mb-12 inline-block">
          \u2190 Back to TEOS Sentinel
        </Link>

        <div className="mb-12">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-amber mb-4">Security</p>
          <h1 className="text-[clamp(28px,4vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-4">
            Responsible Disclosure
          </h1>
          <p className="font-mono text-[12px] text-muted">
            Effective Date: May 8, 2026 \u00B7 Report to: security@teos-sentinel.io
          </p>
        </div>

        <div className="space-y-10 font-mono text-[13px] text-muted leading-[1.8]">
          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">Overview</h2>
            <p>TEOS Sovereign values the security research community and welcomes responsible disclosure of vulnerabilities in our products and services.</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">Scope</h2>
            <p>This policy covers: TEOS Sentinel Shield API, TEOS Landing Page, TEOS CLI, Telegram Bot (@teoslinker_bot), and open-source rule engine and test cases.</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">What We Consider Vulnerabilities</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Remote code execution</li>
              <li>Authentication/authorization bypass</li>
              <li>Data exposure of other users&apos; enforcement logs</li>
              <li>Rate limiting bypass</li>
              <li>Supply chain compromise (rule injection, test case manipulation)</li>
              <li>Denial of service affecting enforcement availability</li>
              <li>Cryptographic weaknesses in audit hash chain</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">Reporting Process</h2>
            <p>1. <strong className="text-white">Do NOT</strong> publicly disclose the vulnerability.<br />
            2. <strong className="text-white">Do NOT</strong> exploit the vulnerability beyond demonstration.<br />
            3. <strong className="text-white">Do NOT</strong> access, modify, or delete other users&apos; data.<br />
            4. Email your findings to: <strong className="text-white">security@teos-sentinel.io</strong></p>
            <p className="mt-3">Include: description of the vulnerability, steps to reproduce, impact assessment, and suggested remediation (optional).</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">Response Timeline</h2>
            <div className="border border-[rgba(255,255,255,0.08)] rounded-sm overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <th className="text-left p-3 text-white font-[600]">Stage</th>
                    <th className="text-left p-3 text-white font-[600]">Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]"><td className="p-3">Initial acknowledgment</td><td className="p-3">Within 48 hours</td></tr>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]"><td className="p-3">Triage and validation</td><td className="p-3">Within 7 days</td></tr>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]"><td className="p-3">Status update to researcher</td><td className="p-3">Every 14 days</td></tr>
                  <tr><td className="p-3">Fix deployment</td><td className="p-3">Within 30 days (critical: 7 days)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">Bug Bounty Tiers</h2>
            <div className="border border-[rgba(255,255,255,0.08)] rounded-sm overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <th className="text-left p-3 text-white font-[600]">Severity</th>
                    <th className="text-left p-3 text-white font-[600]">Reward</th>
                    <th className="text-left p-3 text-white font-[600]">Examples</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]"><td className="p-3 text-red">Critical</td><td className="p-3">$500</td><td className="p-3">RCE, auth bypass, data leak</td></tr>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]"><td className="p-3 text-amber">High</td><td className="p-3">$250</td><td className="p-3">Privilege escalation, rule injection</td></tr>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]"><td className="p-3">Medium</td><td className="p-3">$100</td><td className="p-3">Rate limit bypass, partial data exposure</td></tr>
                  <tr><td className="p-3">Low</td><td className="p-3">$50</td><td className="p-3">Informational, missing controls without exploit</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">Safe Harbor</h2>
            <p>If you follow this policy, we will not pursue legal action, report you to law enforcement, or send cease-and-desist letters. With your permission, we will acknowledge your contribution.</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">Contact</h2>
            <p>Email: security@teos-sentinel.io<br />PGP Key: Available at /security.txt</p>
          </section>
        </div>

        <div className="mt-16 pt-6 border-t border-[rgba(255,255,255,0.07)] font-mono text-[11px] text-muted">
          Document Version: 1.0 \u00B7 Last Updated: May 8, 2026
        </div>
      </div>
    </main>
  );
}
