import { Shield, Lock, Cpu, MessageSquare, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  const tiers = [
    { 
      name: "Starter", 
      price: "1.5 SOL", 
      features: ["Basic Agent Scanning", "Standard Logging", "Community Support"] 
    },
    { 
      name: "Pro", 
      price: "12 SOL", 
      features: ["Full Engine Integration", "Private PII Redaction", "Priority 24/7 Support"], 
      popular: true 
    },
    { 
      name: "Sovereign", 
      price: "From 75 SOL", 
      features: ["Air-gapped Deployment", "Source Code Licensing", "White-glove Setup"] 
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-gold-500/30">
      {/* Hero Section - Strong Value Positioning */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-28 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gold-500">
          <ShieldCheck className="w-3 h-3" /> Sovereign AI Security Infrastructure
        </div>

        <h1 className="max-w-5xl text-6xl font-black tracking-tighter sm:text-8xl leading-[0.9] mb-6 uppercase">
          Secure AI Agents. <br />
          Protect LLM Pipelines. <br />
          <span className="text-zinc-700">Deploy Sovereign Infra.</span>
        </h1>

        <p className="mt-4 max-w-2xl text-sm font-medium uppercase tracking-[0.15em] text-zinc-500">
          Enterprise-ready • API-driven • Private infrastructure
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <a
            href="https://t.me/teoslinker_bot?start=activate_access"
            className="rounded-2xl bg-gold-500 px-10 py-5 font-black text-xs uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-gold-400 shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)]"
          >
            Activate Secure Access
          </a>
          <a
            href="https://github.com/Elmahrosa/teos-sentinel-shield"
            className="rounded-2xl border border-white/10 px-10 py-5 font-black text-xs uppercase tracking-widest text-zinc-400 transition hover:bg-white/5"
          >
            View Repository
          </a>
        </div>
      </section>

      {/* Target Audience Trust Signal */}
      <section className="border-y border-white/5 bg-white/[0.01] py-12 text-center">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-zinc-500 font-bold text-sm md:text-lg uppercase tracking-tighter">
          <span>AI Startups</span>
          <span>LLM Platforms</span>
          <span>Web3 Infrastructure</span>
          <span>Government Systems</span>
        </div>
      </section>

      {/* Pricing Section - The Monetization Funnel */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Licensing Tiers</h2>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Hard Market Positioning • Managed via Elmahrosa Gateway</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.name} className={`relative flex flex-col rounded-[2.5rem] bg-zinc-950 p-10 border ${tier.popular ? 'border-gold-500 shadow-[0_0_40px_-15px_rgba(212,175,55,0.3)]' : 'border-white/5'}`}>
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-4 py-1 text-[10px] font-black uppercase tracking-tighter text-black">
                  Recommended
                </div>
              )}
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{tier.name}</h3>
              <div className="mt-4 text-4xl font-black tracking-tight">{tier.price}</div>
              
              {tier.popular && (
                <p className="mt-3 text-[10px] text-zinc-500 uppercase tracking-widest">
                  Limited onboarding slots available
                </p>
              )}

              <ul className="mt-10 flex-grow space-y-4">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                    <CheckCircle className="h-4 w-4 text-gold-500" /> {f}
                  </li>
                ))}
              </ul>

              <a 
                href={tier.name === 'Sovereign' 
                  ? "mailto:ayman@teosegypt.com?subject=Sovereign Deployment Inquiry" 
                  : `https://t.me/teoslinker_bot?start=plan_${tier.name.toLowerCase().replace(/\s+/g, '')}`
                }
                className={`mt-10 w-full rounded-2xl py-4 text-center text-[10px] font-black uppercase tracking-widest transition-all ${
                  tier.popular ? 'bg-gold-500 text-black hover:bg-gold-400' : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {tier.name === 'Sovereign' ? 'Request Sovereign Deployment' : 'Activate Secure Access'}
              </a>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-20 text-center border-t border-white/5 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">
        © {new Date().getFullYear()} Elmahrosa International — TEOS • Alexandria, Egypt
      </footer>
    </main>
  );
}