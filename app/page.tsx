"use client";
import React from "react";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">

      {/* HERO */}
      <section className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          TEOS Sentinel Shield
        </h1>

        <p className="text-xl text-zinc-400 mb-6">
          Runtime Security for Autonomous Systems
        </p>

        <p className="text-zinc-500 mb-10">
          Generate → Validate → Execute
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="https://t.me/TEOS_Sovereign_Sentinel_bot"
            target="_blank"
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold"
          >
            Open Telegram Bot
          </a>

          <a
            href="https://t.me/TEOSNetwork"
            target="_blank"
            className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-xl font-semibold"
          >
            Join Community
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto mt-20 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Code Scanning",
            desc: "Detect destructive commands, injections, and unsafe execution patterns.",
          },
          {
            title: "Dependency Audit",
            desc: "Identify risky packages and suspicious versions before install.",
          },
          {
            title: "CI Workflow Analysis",
            desc: "Scan GitHub Actions for permission abuse and secret leaks.",
          },
        ].map((f, i) => (
          <div key={i} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-zinc-400">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* PRICING */}
      <section className="max-w-4xl mx-auto mt-24">
        <h2 className="text-3xl font-bold text-center mb-10">Pricing</h2>

        <div className="grid md:grid-cols-2 gap-6">

          {/* FREE */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <p className="text-zinc-400 mb-4">Limited scans</p>

            <a
              href="https://t.me/TEOS_Sovereign_Sentinel_bot"
              target="_blank"
              className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl"
            >
              Start Free
            </a>
          </div>

          {/* PRO */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <p className="text-zinc-400 mb-4">Unlimited scans + full features</p>

            <div className="flex flex-col gap-3">

              <a
                href="https://dodo.pe/ljkagv2ixcr"
                target="_blank"
                className="bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-center"
              >
                Pro Monthly
              </a>

              <a
                href="https://dodo.pe/ep9cgmojbua"
                target="_blank"
                className="bg-blue-700 hover:bg-blue-600 py-3 rounded-xl text-center"
              >
                Pro Yearly
              </a>

              <a
                href="https://dodo.pe/relh2gradr9"
                target="_blank"
                className="bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-center"
              >
                Lifetime
              </a>

            </div>
          </div>

        </div>
      </section>

      {/* ENTERPRISE */}
      <section className="text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">Enterprise</h2>
        <p className="text-zinc-400 mb-6">
          Self-hosted deployment for full control and private infrastructure.
        </p>

        <a
          href="mailto:your@email.com"
          className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-xl"
        >
          Contact Sales
        </a>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-zinc-500 mt-24 text-sm">
        © 2026 TEOS Sentinel Shield — All rights reserved
      </footer>

    </main>
  );
}