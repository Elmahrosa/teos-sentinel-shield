<<<<<<< HEAD
export default function Home() {
  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,.1)",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>TEOS Sentinel Shield</h1>
            <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: 12 }}>
              Sovereign AI Execution Firewall
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="#pricing" style={navLink}>
              Pricing
            </a>
            <a href="#roadmap" style={navLink}>
              Roadmap
            </a>
            <a href="#faq" style={navLink}>
              FAQ
            </a>
            <a href="https://t.me/teoslinker_bot" style={buttonGhost}>
              Open Bot
            </a>
          </div>
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
          TEOS Sentinel Shield gives you a Telegram-first security workflow with real
          scan credits and paid upgrade paths.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <a href="https://t.me/teoslinker_bot" style={buttonPrimary}>
            Start Free
          </a>
          <a href="#pricing" style={buttonGhost}>
            View Pricing
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginTop: 32,
            maxWidth: 700,
          }}
        >
          <div style={statCard}>
            <div style={statNumber}>5</div>
            <div style={statLabel}>Free scans</div>
          </div>
          <div style={statCard}>
            <div style={statNumber}>3</div>
            <div style={statLabel}>Verdicts</div>
          </div>
          <div style={statCard}>
            <div style={statNumber}>24/7</div>
            <div style={statLabel}>Bot access</div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 48px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          <div style={infoCard}>
            <h4 style={cardTitle}>1. Open the bot</h4>
            <p style={cardText}>
              Start with the Telegram bot and test the free plan before upgrading.
            </p>
          </div>
          <div style={infoCard}>
            <h4 style={cardTitle}>2. Link your email</h4>
            <p style={cardText}>
              Use <b>/email your@email.com</b> so payment activation can match your
              account correctly.
            </p>
          </div>
          <div style={infoCard}>
            <h4 style={cardTitle}>3. Pay and activate</h4>
            <p style={cardText}>
              Complete payment through Dodo and your credits activate automatically
              after success.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <h3 style={{ fontSize: 34, marginBottom: 24 }}>Pricing</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
          }}
        >
          <div style={pricingCard}>
            <h4>Free</h4>
            <p style={price}>$0</p>
            <p style={muted}>5 scans</p>
            <a href="https://t.me/teoslinker_bot" style={buyButton}>
              Start Free
            </a>
          </div>

          <div style={pricingCard}>
            <h4>Starter</h4>
            <p style={price}>$9.99</p>
            <p style={muted}>50 scans / month</p>
            <a
              href="https://checkout.dodopayments.com/buy/pdt_0NcxjnrwUDXBtoblQEyeK"
              style={buyButton}
            >
              Buy Starter
            </a>
          </div>

          <div style={pricingCardHighlight}>
            <h4>Builder</h4>
            <p style={price}>$49</p>
            <p style={muted}>500 scans / month</p>
            <a
              href="https://checkout.dodopayments.com/buy/pdt_0NcxkbT0sHGyG9pbBdzXo"
              style={buyButton}
            >
              Buy Builder
            </a>
          </div>

          <div style={pricingCard}>
            <h4>Pro</h4>
            <p style={price}>$99</p>
            <p style={muted}>1000 scans / month</p>
            <a
              href="https://checkout.dodopayments.com/buy/pdt_0NcoHFbcVOk0OeDbKtq4y"
              style={buyButton}
            >
              Buy Pro
            </a>
          </div>

          <div style={pricingCard}>
            <h4>Sovereign</h4>
            <p style={price}>$12k</p>
            <p style={muted}>Unlimited / year</p>
            <a
              href="https://checkout.dodopayments.com/buy/pdt_0NcxoGk4zm8n48TMVKOss"
              style={buyButton}
            >
              Buy Sovereign
            </a>
          </div>
        </div>

        <div style={{ ...infoCard, marginTop: 24 }}>
          <p style={{ marginTop: 0, fontWeight: 700, color: "#fff" }}>
            How to activate after payment
          </p>
          <p style={cardText}>1. Open the bot and run <b>/email your@email.com</b></p>
          <p style={cardText}>2. Choose your plan and complete payment</p>
          <p style={cardText}>3. Credits activate automatically after successful payment</p>
          <p style={{ ...cardText, color: "#a1a1aa" }}>
            All purchases are final. Free plan is available for evaluation before payment.
          </p>
        </div>
      </section>

      <section id="roadmap" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <h3 style={{ fontSize: 34, marginBottom: 24 }}>Roadmap</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          <div style={infoCard}>
            <h4 style={cardTitle}>Phase 1 — Live now</h4>
            <p style={cardText}>
              Telegram bot, real scan credits, Dodo checkout, and email-linked activation.
            </p>
          </div>

          <div style={infoCard}>
            <h4 style={cardTitle}>Phase 2 — Frontend upgrade</h4>
            <p style={cardText}>
              Landing page polish, conversion improvements, and a better upgrade flow.
            </p>
          </div>

          <div style={infoCard}>
            <h4 style={cardTitle}>Phase 3 — Product expansion</h4>
            <p style={cardText}>
              CI/CD examples, better dependency audit, and team workflows.
            </p>
          </div>

          <div style={infoCard}>
            <h4 style={cardTitle}>Phase 4 — Sovereign stack</h4>
            <p style={cardText}>
              Private deployment options, larger onboarding, and broader TEOS ecosystem integration.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <h3 style={{ fontSize: 34, marginBottom: 24 }}>FAQ</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            maxWidth: 900,
          }}
        >
          <div style={infoCard}>
            <h4 style={cardTitle}>What does it do?</h4>
            <p style={cardText}>Scans code and returns ALLOW / WARN / BLOCK.</p>
          </div>

          <div style={infoCard}>
            <h4 style={cardTitle}>How do paid plans activate?</h4>
            <p style={cardText}>
              Use <b>/email</b> in the bot, then complete payment. Credits activate
              automatically after successful payment.
            </p>
          </div>

          <div style={infoCard}>
            <h4 style={cardTitle}>Do you offer refunds?</h4>
            <p style={cardText}>
              No refunds. The free tier exists so users can evaluate before upgrading.
            </p>
          </div>

          <div style={infoCard}>
            <h4 style={cardTitle}>Support</h4>
            <p style={cardText}>
              Support: @teosegypt
              <br />
              Group: @elmahrosapi
            </p>
          </div>
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,.1)",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            color: "#a1a1aa",
            fontSize: 14,
          }}
        >
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

const navLink = {
  color: "#d4d4d8",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.08)",
};

const buttonPrimary = {
  background: "#fff",
  color: "#000",
  textDecoration: "none",
  padding: "14px 18px",
  borderRadius: 12,
  fontWeight: 700,
};

const buttonGhost = {
  color: "#fff",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.2)",
  padding: "14px 18px",
  borderRadius: 12,
};

const statCard = {
  background: "#18181b",
  borderRadius: 16,
  padding: 18,
  border: "1px solid rgba(255,255,255,.08)",
};

const statNumber = {
  fontSize: 28,
  fontWeight: 700,
};

const statLabel = {
  color: "#a1a1aa",
  marginTop: 6,
};

const infoCard = {
  background: "#18181b",
  borderRadius: 16,
  padding: 24,
  border: "1px solid rgba(255,255,255,.08)",
};

const cardTitle = {
  margin: "0 0 10px",
};

const cardText = {
  color: "#aaa",
  margin: 0,
  lineHeight: 1.6,
};

const pricingCard = {
  background: "#18181b",
  borderRadius: 16,
  padding: 24,
  border: "1px solid rgba(255,255,255,.08)",
};

const pricingCardHighlight = {
  background: "rgba(16,185,129,.08)",
  borderRadius: 16,
  padding: 24,
  border: "1px solid rgba(16,185,129,.6)",
};

const price = {
  fontSize: 28,
  margin: "10px 0",
};

const muted = {
  color: "#aaa",
};

const buyButton = {
  display: "block",
  marginTop: 18,
  color: "#fff",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.2)",
  padding: 10,
  borderRadius: 10,
  textAlign: "center" as const,
};
=======
PASTE_THE_CODE_HERE
>>>>>>> b0cbc2a (fix: clean app page syntax)
