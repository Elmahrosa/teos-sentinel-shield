export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-zinc-300">
          Sovereign AI Security Infrastructure
        </div>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl">
          🛡️ TEOS Sentinel Shield
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Public integration hub for sovereign AI defense, secure agent execution,
          and protected LLM data pipelines.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="https://t.me/teoslinker_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:opacity-90"
          >
            Get Access
          </a>

          <a
            href="https://github.com/Elmahrosa/teos-sentinel-shield"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            View Repository
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold">🔍 Code Risk Engine</h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Analyze AI agents and automation pipelines for vulnerabilities,
            unsafe execution paths, and operational risk.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold">🔥 Data Firewall</h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Protect LLM ingestion flows with compliance-first controls, PII
            redaction, and secure policy enforcement.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-semibold">🤖 Gateway Bot</h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Automate licensing, access control, and secure onboarding through the
            Telegram gateway layer.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
          <h2 className="text-2xl font-semibold">Why TEOS Sentinel Shield</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-5 text-zinc-300">
              Compliance-first AI ingestion architecture
            </div>
            <div className="rounded-2xl bg-white/5 p-5 text-zinc-300">
              Sovereign deployment model for controlled infrastructure
            </div>
            <div className="rounded-2xl bg-white/5 p-5 text-zinc-300">
              Private security engines separated from public control plane
            </div>
            <div className="rounded-2xl bg-white/5 p-5 text-zinc-300">
              Enterprise-ready positioning for licensing and acquisition
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-zinc-500">
        <div className="border-t border-white/10 pt-6">
          © Elmahrosa International — TEOS
        </div>
      </footer>
    </main>
  );
}