export default function Home() {
  return (
    <main style={{ background: "#0a0a0a", color: "#fff", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,.1)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>TEOS Sentinel Shield</h1>
            <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: 12 }}>Sovereign AI Execution Firewall</p>
          </div>
          <a
            href="https://t.me/teoslinker_bot"
            style={{ color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.2)", padding: "10px 16px", borderRadius: 12 }}
          >
            Open Bot
          </a>
        </div>
      </header>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ color: "#34d399", fontSize: 12, marginBottom: 16 }}>
          LIVE • TELEGRAM BOT • REAL SCANS • DODO PAYMENTS
        </div>

        <h2 style={{ fontSize: 58, lineHeight: 1.05, margin: 0 }}>
          Secure AI execution
          <br />
          before risky code runs
        </h2>

        <p style={{ marginTop: 24, color: "#c4c4c4", fontSize: 20, maxWidth: 760 }}>
          Scan code instantly and get a clear verdict: <b>ALLOW, WARN, or BLOCK</b>.
          TEOS Sentinel Shield gives you a Telegram-first security workflow with real scan credits and paid upgrade paths.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <a
            href="https://t.me/teoslinker_bot"
            style={{ background: "#fff", color: "#000", textDecoration: "none", padding: "14px 18px", borderRadius: 12, fontWeight: 700 }}
          >
            Start Free
          </a>
          <a
            href="#pricing"
            style={{ color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.2)", padding: "14px 18px", borderRadius: 12 }}
          >
            View Pricing
          </a>
        </div>
      </section>

      <section id="pricing" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <h3 style={{ fontSize: 34, marginBottom: 24 }}>Pricing</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          <div style={{ background: "#18181b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,.08)" }}>
            <h4>Free</h4>
            <p style={{ fontSize: 28 }}>$0</p>
            <p style={{ color: "#aaa" }}>5 scans</p>
            <a href="https://t.me/teoslinker_bot" style={{ display: "block", marginTop: 18, color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.2)", padding: 10, borderRadius: 10, textAlign: "center" }}>Start Free</a>
          </div>

          <div style={{ background: "#18181b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,.08)" }}>
            <h4>Starter</h4>
            <p style={{ fontSize: 28 }}>$9.99</p>
            <p style={{ color: "#aaa" }}>50 scans / month</p>
            <a href="https://checkout.dodopayments.com/buy/pdt_0NcxjnrwUDXBtoblQEyeK" style={{ display: "block", marginTop: 18, color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.2)", padding: 10, borderRadius: 10, textAlign: "center" }}>Buy Starter</a>
          </div>

          <div style={{ background: "rgba(16,185,129,.08)", borderRadius: 16, padding: 24, border: "1px solid rgba(16,185,129,.6)" }}>
            <h4>Builder</h4>
            <p style={{ fontSize: 28 }}>$49</p>
            <p style={{ color: "#aaa" }}>500 scans / month</p>
            <a href="https://checkout.dodopayments.com/buy/pdt_0NcxkbT0sHGyG9pbBdzXo" style={{ display: "block", marginTop: 18, color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.2)", padding: 10, borderRadius: 10, textAlign: "center" }}>Buy Builder</a>
          </div>

          <div style={{ background: "#18181b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,.08)" }}>
            <h4>Pro</h4>
            <p style={{ fontSize: 28 }}>$99</p>
            <p style={{ color: "#aaa" }}>1000 scans / month</p>
            <a href="https://checkout.dodopayments.com/buy/pdt_0NcoHFbcVOk0OeDbKtq4y" style={{ display: "block", marginTop: 18, color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.2)", padding: 10, borderRadius: 10, textAlign: "center" }}>Buy Pro</a>
          </div>

          <div style={{ background: "#18181b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,.08)" }}>
            <h4>Sovereign</h4>
            <p style={{ fontSize: 28 }}>$12k</p>
            <p style={{ color: "#aaa" }}>Unlimited / year</p>
            <a href="https://checkout.dodopayments.com/buy/pdt_0NcxoGk4zm8n48TMVKOss" style={{ display: "block", marginTop: 18, color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.2)", padding: 10, borderRadius: 10, textAlign: "center" }}>Buy Sovereign</a>
          </div>
        </div>

        <div style={{ marginTop: 24, background: "#18181b", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,.08)", color: "#d4d4d8" }}>
          <p style={{ marginTop: 0, fontWeight: 700, color: "#fff" }}>How to activate after payment</p>
          <p>1. Open the bot and run <b>/email your@email.com</b></p>
          <p>2. Choose your plan and complete payment</p>
          <p>3. Credits activate automatically after successful payment</p>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <h3 style={{ fontSize: 34, marginBottom: 24 }}>Roadmap</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div style={{ background: "#18181b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,.08)" }}>
            <h4>Phase 1 — Live now</h4>
            <p style={{ color: "#aaa" }}>Telegram bot, real scan credits, Dodo checkout, email-linked activation.</p>
          </div>
          <div style={{ background: "#18181b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,.08)" }}>
            <h4>Phase 2 — Frontend upgrade</h4>
            <p style={{ color: "#aaa" }}>Landing page polish, conversion improvements, better upgrade flow.</p>
          </div>
          <div style={{ background: "#18181b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,.08)" }}>
            <h4>Phase 3 — Product expansion</h4>
            <p style={{ color: "#aaa" }}>CI/CD examples, better dependency audit, team workflows.</p>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,.1)", padding: "24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", color: "#a1a1aa", fontSize: 14 }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700 }}>TEOS Sentinel Shield</div>
            <div>Powered by Elmahrosa International</div>
          </div>
          <div>
            Support: @teosegypt
            <br />
            Group: @elmahrosapi
          </div>
        </div>
      </footer>
    </main>
  );
}
