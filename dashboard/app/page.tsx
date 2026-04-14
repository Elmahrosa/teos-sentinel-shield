export const metadata = {
  title: "TEOS Sentinel Shield — Sovereign AI Execution Firewall",
  description:
    "Scan AI-generated code before execution. Deterministic ALLOW / WARN / BLOCK decisions for agents, CI pipelines, and sovereign deployments.",
};

export default function HomePage() {
  return (
    <>
      <style>{`
        :root{
          --bg:#09111f;
          --bg2:#0d172a;
          --card:#101b30;
          --line:rgba(255,255,255,.10);
          --soft:rgba(255,255,255,.72);
          --muted:rgba(255,255,255,.55);
          --text:#f5f7fb;
          --gold:#e7b64c;
          --gold2:#ffd977;
          --green:#28d17c;
          --orange:#ff9a3d;
          --red:#ff6464;
          --blue:#7eb6ff;
          --max:1180px;
          --shadow:0 20px 60px rgba(0,0,0,.35);
          --radius:22px;
        }
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{
          margin:0;
          font-family:Inter,system-ui,sans-serif;
          color:var(--text);
          background:
            radial-gradient(circle at top right, rgba(231,182,76,.12), transparent 28%),
            radial-gradient(circle at top left, rgba(126,182,255,.08), transparent 22%),
            linear-gradient(180deg, #08101d 0%, #0a1322 100%);
        }
        a{color:inherit}
        .mono{font-family:"Space Mono", monospace}
        .wrap{width:min(var(--max), calc(100% - 32px)); margin:0 auto}
        .nav{
          position:sticky; top:0; z-index:20;
          backdrop-filter: blur(12px);
          background:rgba(8,16,29,.78);
          border-bottom:1px solid var(--line);
        }
        .nav-inner{
          width:min(var(--max), calc(100% - 32px));
          margin:0 auto;
          min-height:72px;
          display:flex; align-items:center; justify-content:space-between; gap:16px;
        }
        .brand{display:flex; align-items:center; gap:12px; text-decoration:none}
        .brand-mark{
          width:40px; height:40px; border-radius:12px;
          display:grid; place-items:center;
          background:linear-gradient(135deg, rgba(231,182,76,.28), rgba(126,182,255,.20));
          border:1px solid rgba(255,255,255,.12);
          box-shadow:var(--shadow);
          font-weight:800;
        }
        .brand-text small{
          display:block;
          color:var(--gold2);
          letter-spacing:.12em;
          text-transform:uppercase;
          font-size:11px
        }
        .brand-text strong{display:block; font-size:15px}
        .nav-links{display:flex; gap:20px; align-items:center}
        .nav-links a{text-decoration:none; color:var(--muted); font-size:14px}
        .nav-links a:hover{color:var(--text)}
        .btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          padding:13px 18px;
          border-radius:14px;
          text-decoration:none;
          font-weight:700;
          transition:.18s ease;
          border:1px solid transparent;
        }
        .btn:hover{transform:translateY(-1px)}
        .btn-primary{
          background:linear-gradient(135deg, var(--gold), var(--gold2));
          color:#1a1406;
          box-shadow:var(--shadow)
        }
        .btn-secondary{
          border-color:var(--line);
          background:rgba(255,255,255,.03)
        }
        .hero{padding:56px 0 34px}
        .hero-grid{
          display:grid;
          grid-template-columns:1.15fr .85fr;
          gap:28px;
          align-items:center;
        }
        .eyebrow{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding:10px 14px;
          border-radius:999px;
          border:1px solid rgba(231,182,76,.28);
          background:rgba(231,182,76,.08);
          color:var(--gold2);
          font-size:12px;
          letter-spacing:.12em;
          text-transform:uppercase;
        }
        .pulse{
          width:9px;
          height:9px;
          border-radius:50%;
          background:var(--green);
          box-shadow:0 0 0 0 rgba(40,209,124,.7);
          animation:pulse 2s infinite
        }
        @keyframes pulse{
          0%{box-shadow:0 0 0 0 rgba(40,209,124,.65)}
          70%{box-shadow:0 0 0 14px rgba(40,209,124,0)}
          100%{box-shadow:0 0 0 0 rgba(40,209,124,0)}
        }
        h1{
          margin:18px 0 16px;
          line-height:.95;
          font-size:clamp(42px, 9vw, 82px);
          letter-spacing:-.04em;
        }
        .lead{
          color:var(--soft);
          font-size:18px;
          line-height:1.7;
          max-width:760px;
          margin:0 0 26px;
        }
        .hero-actions{
          display:flex;
          gap:14px;
          flex-wrap:wrap;
          margin-bottom:18px
        }
        .micro{
          color:var(--muted);
          font-size:13px;
          line-height:1.7;
        }
        .panel{
          background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.025));
          border:1px solid var(--line);
          border-radius:var(--radius);
          box-shadow:var(--shadow);
        }
        .terminal{overflow:hidden}
        .terminal-top{
          display:flex;
          align-items:center;
          gap:8px;
          padding:14px 16px;
          border-bottom:1px solid var(--line);
          background:rgba(255,255,255,.03)
        }
        .dot{width:10px; height:10px; border-radius:50%}
        .terminal-body{
          padding:20px 22px;
          font:14px/1.9 "Space Mono", monospace;
          color:#d7e3ff
        }
        .allow{color:var(--green); font-weight:700}
        .warn{color:var(--orange); font-weight:700}
        .block{color:var(--red); font-weight:700}
        .section{padding:28px 0}
        .section-head{margin-bottom:20px}
        .section-kicker{
          color:var(--gold2);
          font-size:12px;
          text-transform:uppercase;
          letter-spacing:.14em;
          margin-bottom:8px
        }
        .section h2{
          margin:0;
          font-size:clamp(28px, 5vw, 50px);
          letter-spacing:-.03em
        }
        .section p{color:var(--soft); line-height:1.8}
        .grid-3{display:grid; grid-template-columns:repeat(3,1fr); gap:18px}
        .grid-4{display:grid; grid-template-columns:repeat(4,1fr); gap:18px}
        .card{padding:22px}
        .card h3{margin:0 0 8px; font-size:18px}
        .card p{margin:0; color:var(--muted); font-size:14px; line-height:1.8}
        .mini{
          display:inline-block;
          margin-bottom:12px;
          padding:6px 10px;
          border-radius:999px;
          background:rgba(126,182,255,.09);
          border:1px solid rgba(126,182,255,.22);
          color:var(--blue);
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.12em;
        }
        .pricing .card{display:flex; flex-direction:column; min-height:280px}
        .price{
          font-size:40px;
          font-weight:800;
          letter-spacing:-.03em;
          margin:8px 0
        }
        .price small{
          font-size:15px;
          color:var(--muted);
          font-weight:600
        }
        .list{
          padding:0;
          margin:14px 0 0;
          list-style:none
        }
        .list li{
          padding:8px 0;
          border-top:1px solid rgba(255,255,255,.06);
          color:var(--soft);
          font-size:14px
        }
        .featured{
          outline:1px solid rgba(231,182,76,.35);
          background:linear-gradient(180deg, rgba(231,182,76,.08), rgba(255,255,255,.03))
        }
        .arch{display:grid; gap:14px}
        .arch-row{
          display:grid;
          grid-template-columns:190px 1fr;
          gap:18px;
          align-items:start;
          padding:18px 20px;
        }
        .arch-label{
          font-size:12px;
          letter-spacing:.14em;
          text-transform:uppercase;
          color:var(--gold2)
        }
        .arch-row strong{display:block; margin-bottom:4px; font-size:18px}
        .arch-row p{margin:0 0 10px; color:var(--muted)}
        .chips{display:flex; flex-wrap:wrap; gap:8px}
        .chip{
          font:12px "Space Mono", monospace;
          padding:7px 10px;
          border-radius:999px;
          border:1px solid var(--line);
          background:rgba(255,255,255,.03);
          color:#d7e3ff
        }
        .note{
          padding:18px 20px;
          border-left:3px solid var(--gold);
          background:rgba(231,182,76,.06);
          color:var(--soft);
          border-radius:16px;
        }
        .cta{padding:34px; text-align:center}
        footer{
          padding:26px 0 40px;
          color:var(--muted);
          font-size:13px
        }
        .foot{
          display:flex;
          justify-content:space-between;
          gap:16px;
          align-items:center;
          border-top:1px solid var(--line);
          padding-top:20px
        }
        @media (max-width: 980px){
          .hero-grid,.grid-4,.grid-3{grid-template-columns:1fr}
          .arch-row{grid-template-columns:1fr}
        }
        @media (max-width: 760px){
          .nav-links{display:none}
          .hero{padding-top:34px}
          .hero-actions{flex-direction:column; align-items:stretch}
          .btn{width:100%}
          .foot{flex-direction:column; align-items:flex-start}
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="#top">
            <div className="brand-mark">T</div>
            <div className="brand-text">
              <small className="mono">Elmahrosa International</small>
              <strong>TEOS Sentinel Shield</strong>
            </div>
          </a>
          <nav className="nav-links">
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#architecture">Architecture</a>
            <a href="#ready">Ready</a>
            <a
              className="btn btn-primary"
              href="https://t.me/teoslinker_bot?start=scan"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Bot
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <div className="eyebrow mono">
                <span className="pulse"></span>
                Live now · local core tested · launch-ready page
              </div>
              <h1>
                Sovereign AI
                <br />
                Execution Firewall
              </h1>
              <p className="lead">
                Scan AI-generated code before it runs. TEOS Sentinel Shield gives deterministic
                <strong> ALLOW / WARN / BLOCK</strong> decisions for agents, bots, and CI pipelines —
                with a Telegram-first entry point and a sovereign architecture you can scale later.
              </p>
              <div className="hero-actions">
                <a
                  className="btn btn-primary"
                  href="https://t.me/teoslinker_bot?start=scan"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Start free scan
                </a>
                <a className="btn btn-secondary" href="#pricing">
                  See pricing
                </a>
              </div>
              <div className="micro mono">
                Free tier: 5 scans · USDC-only paid activation · Sovereign onboarding available
              </div>
            </div>

            <div className="panel terminal">
              <div className="terminal-top">
                <div className="dot" style={{ background: "#ff6464" }}></div>
                <div className="dot" style={{ background: "#ffb84d" }}></div>
                <div className="dot" style={{ background: "#28d17c" }}></div>
                <span className="mono" style={{ marginLeft: 8, color: "var(--muted)" }}>
                  scan preview
                </span>
              </div>
              <div className="terminal-body">
                {"$ teos-scan incoming_agent_patch.py"}
                <br />
                {"> secret exposure: false"}
                <br />
                {"> shell destruction risk: true"}
                <br />
                {"> dependency chain risk: medium"}
                <br />
                {"> policy verdict: "}
                <span className="block">BLOCK</span>
                <br />
                <br />

                {"$ teos-scan autopatch_worker.py"}
                <br />
                {"> secret exposure: false"}
                <br />
                {"> unsafe eval: false"}
                <br />
                {"> network exfiltration: false"}
                <br />
                {"> policy verdict: "}
                <span className="allow">ALLOW</span>
                <br />
                <br />

                {"$ teos-scan plugin_update.ts"}
                <br />
                {"> dependency anomaly: true"}
                <br />
                {"> policy verdict: "}
                <span className="warn">WARN</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <div className="wrap">
            <div className="section-head">
              <div className="section-kicker mono">How it works</div>
              <h2>Simple first-run flow for real users</h2>
            </div>
            <div className="grid-4">
              <div className="panel card">
                <span className="mini mono">1</span>
                <h3>Open the bot</h3>
                <p>User starts in Telegram, taps the scan entry point, and pastes code or repo content.</p>
              </div>
              <div className="panel card">
                <span className="mini mono">2</span>
                <h3>Risk engine runs</h3>
                <p>
                  <strong>agent-code-risk-mcp</strong> analyzes the payload and returns a deterministic decision.
                </p>
              </div>
              <div className="panel card">
                <span className="mini mono">3</span>
                <h3>Verdict is returned</h3>
                <p>The bot sends back <strong>ALLOW</strong>, <strong>WARN</strong>, or <strong>BLOCK</strong> with short reasoning.</p>
              </div>
              <div className="panel card">
                <span className="mini mono">4</span>
                <h3>Upgrade on limit</h3>
                <p>After 5 free scans, the user upgrades to a paid plan. Enterprise leads go to Sovereign.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section pricing" id="pricing">
          <div className="wrap">
            <div className="section-head">
              <div className="section-kicker mono">Pricing</div>
              <h2>Clean launch pricing</h2>
            </div>
            <div className="grid-3">
              <div className="panel card">
                <div
                  className="mono"
                  style={{ color: "var(--gold2)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em" }}
                >
                  Free
                </div>
                <div className="price">
                  5 <small>scans</small>
                </div>
                <p>No card. Best for trying the firewall and seeing real verdicts in Telegram.</p>
                <ul className="list">
                  <li>5 total scans</li>
                  <li>ALLOW / WARN / BLOCK verdicts</li>
                  <li>Telegram access</li>
                </ul>
              </div>

              <div className="panel card">
                <div
                  className="mono"
                  style={{ color: "var(--gold2)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em" }}
                >
                  Starter
                </div>
                <div className="price">$9</div>
                <p>Good for early users who want more scans and simple manual activation.</p>
                <ul className="list">
                  <li>50 scans</li>
                  <li>USDC-only activation</li>
                  <li>Telegram-first flow</li>
                </ul>
              </div>

              <div className="panel card featured">
                <div
                  className="mono"
                  style={{ color: "var(--gold2)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em" }}
                >
                  Builder
                </div>
                <div className="price">$49</div>
                <p>Best fit for active builders who want higher volume and a clearer upgrade path.</p>
                <ul className="list">
                  <li>500 scans</li>
                  <li>USDC-only activation</li>
                  <li>Most practical upgrade</li>
                </ul>
              </div>

              <div className="panel card">
                <div
                  className="mono"
                  style={{ color: "var(--gold2)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em" }}
                >
                  Pro
                </div>
                <div className="price">$99</div>
                <p>Designed for heavier usage and dependency-aware workflows.</p>
                <ul className="list">
                  <li>1000 scans</li>
                  <li>Dependency analysis path</li>
                  <li>Manual USDC onboarding</li>
                </ul>
              </div>

              <div className="panel card">
                <div
                  className="mono"
                  style={{ color: "var(--gold2)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em" }}
                >
                  Sovereign
                </div>
                <div className="price">Custom</div>
                <p>Custom enterprise onboarding for teams that need support, governance, and deployment scope alignment.</p>
                <ul className="list">
                  <li>Custom pricing</li>
                  <li>Custom support scope</li>
                  <li>Direct contact onboarding</li>
                </ul>
              </div>
            </div>

            <div className="note mono" style={{ marginTop: 18 }}>
              TEOS Sentinel Shield currently uses a USDC-only activation flow for paid plans. Sovereign pricing is custom based on deployment scope, governance, and support requirements.
            </div>
          </div>
        </section>

        <section className="section" id="architecture">
          <div className="wrap">
            <div className="section-head">
              <div className="section-kicker mono">Architecture</div>
              <h2>Current stack + future layers</h2>
            </div>
            <div className="arch">
              <div className="panel arch-row">
                <div className="arch-label mono">Frontend</div>
                <div>
                  <strong>teos-sentinel-shield</strong>
                  <p>Vercel landing page and control plane entry point.</p>
                  <div className="chips">
                    <span className="chip">Landing page</span>
                    <span className="chip">Pricing</span>
                    <span className="chip">Bot CTA</span>
                  </div>
                </div>
              </div>

              <div className="panel arch-row">
                <div className="arch-label mono">Gateway</div>
                <div>
                  <strong>teoslinker-bot</strong>
                  <p>Telegram bot for scan intake, plan upgrade, and manual activation flow.</p>
                  <div className="chips">
                    <span className="chip">Telegram</span>
                    <span className="chip">Scan UI</span>
                    <span className="chip">Upgrade flow</span>
                  </div>
                </div>
              </div>

              <div className="panel arch-row">
                <div className="arch-label mono">Core</div>
                <div>
                  <strong>agent-code-risk-mcp + teosmcp-ci-example</strong>
                  <p>Deterministic code risk engine and CI/CD integration path for B2B teams.</p>
                  <div className="chips">
                    <span className="chip">ALLOW / WARN / BLOCK</span>
                    <span className="chip">CI integration</span>
                    <span className="chip">Policy gating</span>
                  </div>
                </div>
              </div>

              <div className="panel arch-row">
                <div className="arch-label mono">Future</div>
                <div>
                  <strong>
                    safe-ingestion-engine · teos-comply-crawl · teos-civic-mixer ·
                    Teos-Sovereign-System · governance law layer
                  </strong>
                  <p>Expansion into secure data intake, compliance crawling, privacy, sovereign orchestration, and governance alignment.</p>
                  <div className="chips">
                    <span className="chip">Data firewall</span>
                    <span className="chip">Compliance crawler</span>
                    <span className="chip">Privacy layer</span>
                    <span className="chip">Control hub</span>
                    <span className="chip">Governance</span>
                  </div>
                </div>
              </div>

              <div className="panel arch-row">
                <div className="arch-label mono">Governance</div>
                <div>
                  <strong>TEOS law layer · TESL non-fork license</strong>
                  <p>Governance stays framed as your legal and licensing layer, not as speculative public marketing language.</p>
                  <div className="chips">
                    <span className="chip">Governance root</span>
                    <span className="chip">Non-fork license</span>
                    <span className="chip">Institutional framing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="ready">
          <div className="wrap">
            <div className="section-head">
              <div className="section-kicker mono">Ready to start</div>
              <h2>Built for fast risk checks before execution</h2>
            </div>

            <div className="grid-3">
              <div className="panel card">
                <span className="mini mono">Use case</span>
                <h3>AI agent safety</h3>
                <p>Scan generated code before execution and stop risky actions before they run.</p>
              </div>

              <div className="panel card">
                <span className="mini mono">Access</span>
                <h3>Telegram-first workflow</h3>
                <p>Start free, review plans, and request activation directly from the bot.</p>
              </div>

              <div className="panel card">
                <span className="mini mono">Upgrade</span>
                <h3>Sovereign ready</h3>
                <p>Move from free scans to paid plans or custom Sovereign onboarding as your usage grows.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="panel cta">
              <div className="section-kicker mono">Launch now</div>
              <h2 style={{ marginTop: 0 }}>Your AI agent needs a firewall.</h2>
              <p style={{ maxWidth: 760, margin: "0 auto 18px", color: "var(--soft)" }}>
                Start with 5 free scans, then move to Starter, Builder, Pro, or Sovereign as your usage grows.
              </p>
              <a
                className="btn btn-primary"
                href="https://t.me/teoslinker_bot?start=scan"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open @teoslinker_bot
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot">
          <div>© TEOS Sentinel Shield · Elmahrosa International</div>
          <div className="mono">Sovereign AI Execution Firewall</div>
        </div>
      </footer>
    </>
  );
}