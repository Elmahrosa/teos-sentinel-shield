import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — TEOS Sentinel',
  description: 'Data handling, retention, and user rights for TEOS Sentinel Shield.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-[720px] mx-auto px-6 py-20">
        <Link href="/" className="font-mono text-[13px] text-muted no-underline hover:text-white transition-colors mb-12 inline-block">
          \u2190 Back to TEOS Sentinel
        </Link>

        <div className="mb-12">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Legal</p>
          <h1 className="text-[clamp(28px,4vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-4">
            Privacy Policy
          </h1>
          <p className="font-mono text-[12px] text-muted">
            Effective Date: May 8, 2026 \u00B7 Last Updated: May 8, 2026
          </p>
        </div>

        <div className="space-y-10 font-mono text-[13px] text-muted leading-[1.8]">
          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">1. Data Controller</h2>
            <p>TEOS Sovereign (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)<br />Alexandria, Egypt<br />Contact: privacy@teos-sentinel.io</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">2. Data We Collect</h2>
            <h3 className="text-white text-[14px] font-[600] mb-2">2.1 Enforcement Logs</h3>
            <p>When you submit commands for evaluation via our API, CLI, or Telegram bot, we collect: the command or action submitted, enforcement verdict (BLOCK/WARN/ALLOW), rule ID that triggered the verdict, risk score (0\u2013100), timestamp of evaluation, agent identifier (if provided), and request ID (auto-generated).</p>

            <h3 className="text-white text-[14px] font-[600] mb-2 mt-5">2.2 Technical Metadata</h3>
            <p>IP address (rate limiting only, not stored beyond 60s window), User-Agent header (truncated to 120 characters), API key identifier (if authenticated).</p>

            <h3 className="text-white text-[14px] font-[600] mb-2 mt-5">2.3 What We Do NOT Collect</h3>
            <p>File contents or source code beyond the command string. Credentials, tokens, or secrets (we actively block attempts to echo these). Personal identifiable information (PII). Biometric data, health data, or financial data.</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">3. Purpose of Processing</h2>
            <p>We process data solely for: providing deterministic execution control enforcement, generating audit trails for compliance, improving rule detection accuracy, rate limiting and abuse prevention, and security incident investigation.</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">4. Data Retention</h2>
            <div className="border border-[rgba(255,255,255,0.08)] rounded-sm overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <th className="text-left p-3 text-white font-[600]">Data Type</th>
                    <th className="text-left p-3 text-white font-[600]">Retention</th>
                    <th className="text-left p-3 text-white font-[600]">Legal Basis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]"><td className="p-3">Enforcement events</td><td className="p-3">90 days (default), up to 1 year (Enterprise)</td><td className="p-3">Legitimate interest</td></tr>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]"><td className="p-3">Rate limit counters</td><td className="p-3">60 seconds</td><td className="p-3">Legitimate interest</td></tr>
                  <tr className="border-b border-[rgba(255,255,255,0.05)]"><td className="p-3">Audit logs</td><td className="p-3">Per customer agreement (min 1 year)</td><td className="p-3">Contractual obligation</td></tr>
                  <tr><td className="p-3">Anonymized statistics</td><td className="p-3">Indefinite</td><td className="p-3">Legitimate interest</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">5. Data Residency</h2>
            <p><strong className="text-white">Default:</strong> Data processed through Upstash Redis (global edge network).</p>
            <p className="mt-2"><strong className="text-white">Enterprise/Government:</strong> Data can be restricted to specific regions (Egypt, UAE, Saudi Arabia) upon request.</p>
            <p className="mt-2"><strong className="text-white">Self-hosted deployments:</strong> Data never leaves your infrastructure.</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">6. Your Rights</h2>
            <p>Under GDPR and Egyptian Data Protection Law (Law No. 151/2020), you have the right to access, rectification, erasure, data portability, and objection to processing. Contact: privacy@teos-sentinel.io. Response time: Within 30 days.</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">7. Security Measures</h2>
            <p>All data encrypted in transit (TLS 1.3). Deterministic rule engine (no ML/AI model training on your data). No cross-customer data sharing. SHA-256 hash chain for audit log integrity. Rate limiting to prevent abuse. Input sanitization and payload size limits (64KB max).</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">8. Contact</h2>
            <p>Email: privacy@teos-sentinel.io<br />Telegram: @teoslinker_bot<br />Mail: TEOS Sovereign, Alexandria, Egypt</p>
          </section>

          <section>
            <h2 className="text-white text-[16px] font-[700] mb-3">9. Governing Law</h2>
            <p>This policy is governed by Egyptian law. Disputes shall be resolved in Alexandria courts unless otherwise agreed.</p>
          </section>
        </div>

        <div className="mt-16 pt-6 border-t border-[rgba(255,255,255,0.07)] font-mono text-[11px] text-muted">
          Document Version: 1.0 \u00B7 Review Cycle: Annual or upon material change
        </div>
      </div>
    </main>
  );
}
