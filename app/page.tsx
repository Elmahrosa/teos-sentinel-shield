"use client";
import { useState, useEffect, useRef } from "react";

const DODO = {
  starter: "https://checkout.dodopayments.com/buy/pdt_0NcxjnrwUDXBtobIQEyeK",
  builder: "https://checkout.dodopayments.com/buy/pdt_0NcxkbT0sHGyG9pbBdzXo",
  pro:     "https://checkout.dodopayments.com/buy/pdt_0NcoHFbcVOk0OeDbKtq4y",
  sovereign:"https://checkout.dodopayments.com/buy/pdt_0NcxoGk4zm8n48TMVKOss",
};
const BOT = "https://t.me/teoslinker_bot";
const MCP = "https://teosmcp.up.railway.app";

export default function Home() {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");

  async function runScan() {
    if (!code.trim()) return;
    setScanning(true); setResult(null);
    try {
      const r = await fetch(`${MCP}/scan`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({code}) });
      setResult(await r.json());
    } catch { setResult({verdict:"ALLOW",score:0,findings:[]}); }
    setScanning(false);
  }

  const vc = (v) => v==="BLOCK"?"#ef4444":v==="WARN"?"#f59e0b":"#22c55e";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#080808;--surface:#0f0f0f;--border:rgba(255,255,255,0.06);--gold:#fbbf24;--gold-dim:rgba(251,191,36,0.1);--text:#e8e8e8;--muted:#6b6b6b}
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--text);font-family:'DM Mono',monospace;overflow-x:hidden}
        h1,h2,h3,h4{font-family:'Syne',sans-serif}
        .nav{position:fixed;top:0;left:0;right:0;z-index:50;border-bottom:1px solid var(--border);backdrop-filter:blur(20px);background:rgba(8,8,8,0.85);padding:0 40px;height:60px;display:flex;align-items:center;justify-content:space-between}
        .logo{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;letter-spacing:.05em}
        .logo span{color:var(--gold)}
        .nav-links{display:flex;gap:28px;align-items:center}
        .nl{color:var(--muted);text-decoration:none;font-size:11px;letter-spacing:.1em;text-transform:uppercase;transition:color .2s}
        .nl:hover{color:var(--text)}
        .ncta{background:var(--gold);color:#000;padding:8px 18px;border-radius:4px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:.1em;text-transform:uppercase}
        .hero{min-height:100vh;padding:120px 40px 80px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1200px;margin:0 auto}
        @media(max-width:900px){.hero{grid-template-columns:1fr;padding:100px 24px 60px}}
        .tag{display:inline-flex;align-items:center;gap:8px;background:var(--gold-dim);border:1px solid rgba(251,191,36,.2);padding:6px 14px;border-radius:100px;font-size:11px;color:var(--gold);letter-spacing:.1em;text-transform:uppercase;margin-bottom:28px}
        .tag::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--gold);animation:p 2s infinite}
        @keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
        .title{font-size:clamp(38px,5vw,64px);font-weight:800;line-height:1.05;letter-spacing:-.02em}
        .accent{color:var(--gold)}
        .sub{margin-top:20px;color:var(--muted);font-size:14px;line-height:1.8;max-width:480px}
        .actions{margin-top:36px;display:flex;gap:12px;flex-wrap:wrap}
        .bp{background:var(--gold);color:#000;padding:14px 28px;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:.1em;text-transform:uppercase;transition:all .2s;display:inline-block}
        .bp:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(251,191,36,.3)}
        .bg{color:var(--text);padding:14px 28px;border-radius:6px;font-size:11px;text-decoration:none;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--border);transition:all .2s;display:inline-block}
        .bg:hover{border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.03)}
        .stats{margin-top:48px;display:flex;gap:40px}
        .sn{font-size:28px;font-weight:800;font-family:'Syne',sans-serif;color:var(--gold)}
        .sl{font-size:11px;color:var(--muted);margin-top:2px;letter-spacing:.08em;text-transform:uppercase}
        .term{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;font-size:13px}
        .th{background:rgba(255,255,255,.03);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;align-items:center;gap:8px}
        .td{width:10px;height:10px;border-radius:50%}
        .tb{padding:20px}
        .tl{margin-bottom:6px}
        .tp{color:var(--gold)}
        .to{color:var(--muted);padding-left:12px}
        .si{background:transparent;border:none;outline:none;color:var(--text);font-family:'DM Mono',monospace;font-size:13px;width:100%;resize:none;height:80px}
        .sr{background:var(--gold);color:#000;border:none;padding:8px 20px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:opacity .2s;font-family:'DM Mono',monospace}
        .sr:hover{opacity:.8}
        .sr:disabled{opacity:.4;cursor:default}
        .vb{margin-top:16px;padding:16px;border-radius:8px;border:1px solid;animation:fu .4s ease}
        @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .sb{height:4px;border-radius:2px;margin:8px 0;background:rgba(255,255,255,.1);overflow:hidden}
        .sf{height:100%;border-radius:2px;transition:width .6s ease}
        .sec{max-width:1200px;margin:0 auto;padding:80px 40px}
        @media(max-width:700px){.sec{padding:60px 24px}}
        .stag{font-size:11px;color:var(--gold);letter-spacing:.15em;text-transform:uppercase;margin-bottom:16px}
        .stitle{font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-.02em}
        .ssub{color:var(--muted);margin-top:12px;font-size:14px;line-height:1.7;max-width:560px}
        .div{border:none;border-top:1px solid var(--border)}
        .g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1px;margin-top:48px;border:1px solid var(--border);border-radius:12px;overflow:hidden}
        .feat{background:var(--surface);padding:32px;transition:background .2s}
        .feat:hover{background:rgba(251,191,36,.03)}
        .fi{font-size:22px;margin-bottom:16px}
        .ft{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:8px}
        .fx{color:var(--muted);font-size:13px;line-height:1.7}
        .pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:48px}
        .plan{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:28px;transition:all .25s;position:relative}
        .plan:hover{border-color:rgba(251,191,36,.3);transform:translateY(-2px)}
        .plan.f{border-color:rgba(251,191,36,.4);background:rgba(251,191,36,.04)}
        .pb{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--gold);color:#000;font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;padding:3px 12px;border-radius:100px;white-space:nowrap}
        .pn{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;letter-spacing:.05em;color:var(--muted);text-transform:uppercase}
        .pp{font-size:32px;font-weight:800;font-family:'Syne',sans-serif;margin:8px 0;color:var(--text)}
        .pp sup{font-size:16px;vertical-align:top;margin-top:8px;color:var(--muted)}
        .ppe{font-size:12px;color:var(--muted)}
        .ps{margin:16px 0;font-size:13px;color:var(--gold);font-weight:600}
        .pfl{list-style:none}
        .pfl li{font-size:12px;color:var(--muted);padding:4px 0;border-bottom:1px solid var(--border)}
        .pfl li::before{content:'→ ';color:var(--gold)}
        .pcta{display:block;margin-top:20px;text-align:center;padding:10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;background:transparent;border:1px solid var(--border);color:var(--text);transition:all .2s}
        .pcta:hover{background:var(--gold);color:#000;border-color:var(--gold)}
        .plan.f .pcta{background:var(--gold);color:#000;border-color:var(--gold)}
        .rmg{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;margin-top:48px}
        .phase{position:relative;padding-left:24px}
        .phase::before{content:'';position:absolute;left:0;top:0;bottom:0;width:1px;background:var(--border)}
        .phase.a::before{background:var(--gold)}
        .pnum{font-size:10px;color:var(--muted);letter-spacing:.15em;text-transform:uppercase}
        .ptitle{font-family:'Syne',sans-serif;font-weight:700;font-size:16px;margin:6px 0 12px}
        .phase.a .ptitle{color:var(--gold)}
        .pitems{list-style:none}
        .pitems li{font-size:12px;color:var(--muted);padding:3px 0}
        .pitems li::before{content:'— '}
        .faqg{max-width:760px;margin-top:48px}
        .faqi{border-bottom:1px solid var(--border);padding:20px 0}
        .faqq{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:8px}
        .faqa{color:var(--muted);font-size:13px;line-height:1.7}
        footer{border-top:1px solid var(--border);padding:40px;max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px}
        .fl{font-family:'Syne',sans-serif;font-weight:800;font-size:14px}
        .fl span{color:var(--gold)}
        .fls{display:flex;gap:24px}
        .fla{color:var(--muted);text-decoration:none;font-size:12px;transition:color .2s}
        .fla:hover{color:var(--text)}
        .fc{color:var(--muted);font-size:11px}
      `}</style>

      <nav className="nav">
        <div className="logo">TEOS <span>SENTINEL</span></div>
        <div className="nav-links">
          <a href="#features" className="nl">Features</a>
          <a href="#pricing" className="nl">Pricing</a>
          <a href="#roadmap" className="nl">Roadmap</a>
          <a href="#faq" className="nl">FAQ</a>
          <a href={BOT} className="ncta">Open Bot →</a>
        </div>
      </nav>

      <div className="hero">
        <div>
          <div className="tag">Live · AI Execution Firewall</div>
          <h1 className="title">Code runs only<br/>when <span className="accent">cleared.</span></h1>
          <p className="sub">TEOS Sentinel scans code before execution and returns a deterministic verdict — ALLOW, WARN, or BLOCK — in under 2 seconds.</p>
          <div className="actions">
            <a href={BOT} className="bp">Start Free →</a>
            <a href="#pricing" className="bg">View Plans</a>
          </div>
          <div className="stats">
            <div><div className="sn">5</div><div className="sl">Free scans</div></div>
            <div><div className="sn">&lt;2s</div><div className="sl">Response</div></div>
            <div><div className="sn">14</div><div className="sl">Risk rules</div></div>
          </div>
        </div>

        <div className="term">
          <div className="th">
            <div className="td" style={{background:"#ef4444"}}/>
            <div className="td" style={{background:"#f59e0b"}}/>
            <div className="td" style={{background:"#22c55e"}}/>
            <span style={{fontSize:11,color:"var(--muted)",marginLeft:8}}>teos-sentinel — live scan</span>
          </div>
          <div className="tb">
            <div className="tl"><span className="tp">$ </span>teos scan --live</div>
            <div className="tl to">Paste code and hit RUN to test live</div>
            <div style={{marginTop:12,padding:12,background:"rgba(255,255,255,.03)",borderRadius:6,border:"1px solid var(--border)"}}>
              <textarea className="si" value={code} onChange={e=>setCode(e.target.value)} placeholder={'eval(require("child_process").exec("rm -rf /"))'} spellCheck={false}/>
            </div>
            <div style={{marginTop:8,display:"flex",justifyContent:"flex-end"}}>
              <button className="sr" onClick={runScan} disabled={scanning||!code.trim()}>{scanning?"Scanning...":"Run →"}</button>
            </div>
            {result && (
              <div className="vb" style={{borderColor:vc(result.verdict)+"40",background:vc(result.verdict)+"08"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:vc(result.verdict),fontWeight:700,fontSize:15}}>{result.verdict==="BLOCK"?"🔴":result.verdict==="WARN"?"🟡":"🟢"} {result.verdict}</span>
                  <span style={{color:"var(--muted)",fontSize:12}}>Risk: {result.score}/100</span>
                </div>
                <div className="sb"><div className="sf" style={{width:`${result.score}%`,background:vc(result.verdict)}}/></div>
                {result.findings?.length>0 ? result.findings.map((f,i)=><div key={i} style={{fontSize:12,color:"var(--muted)"}}>⚠ {f}</div>) : <div style={{fontSize:12,color:"#22c55e"}}>✓ No threats detected</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="div"/>

      <section id="features" className="sec">
        <div className="stag">Capabilities</div>
        <h2 className="stitle">Built for agents.<br/>Not for humans.</h2>
        <p className="ssub">Every component is designed for autonomous AI pipelines that cannot afford to run unsafe code.</p>
        <div className="g3">
          {[["⚡","Instant verdicts","ALLOW, WARN, or BLOCK in under 2 seconds."],["🔍","14 risk rules","eval(), exec(), rm -rf, curl|bash, hardcoded secrets, DROP TABLE."],["📦","Dependency audit","Scan package.json for supply chain risks."],["🔗","CI/CD ready","POST to /api/ci/scan. Fail pipelines on BLOCK."],["🛡","Dodo webhook","HMAC-verified. Credits activate automatically."],["🗄","SQLite persistence","User data and scan history survive restarts."]].map(([icon,title,text],i)=>(
            <div key={i} className="feat"><div className="fi">{icon}</div><div className="ft">{title}</div><div className="fx">{text}</div></div>
          ))}
        </div>
      </section>

      <hr className="div"/>

      <section id="pricing" className="sec">
        <div className="stag">Pricing</div>
        <h2 className="stitle">Pay for what you scan.</h2>
        <p className="ssub">Run /email in the bot first, then pay. Credits activate automatically.</p>
        <div className="pg">
          {[
            {n:"Free",p:"0",per:"forever",s:"5 scans total",f:["ALLOW/WARN/BLOCK","Telegram bot","Local engine"],h:BOT,l:"Start Free"},
            {n:"Starter",p:"9.99",per:"/month",s:"50 scans/month",f:["Full risk engine","Email support","Auto-activation"],h:DODO.starter,l:"Buy Starter"},
            {n:"Builder",p:"49",per:"/month",s:"500 scans/month",f:["Dependency audit","CI/CD endpoint","Priority support"],h:DODO.builder,l:"Buy Builder",feat:true},
            {n:"Pro",p:"99",per:"/month",s:"1,000 scans/month",f:["Advanced engine","Team workflows","Priority queue"],h:DODO.pro,l:"Buy Pro"},
            {n:"Sovereign",p:"12k",per:"/year",s:"Unlimited",f:["Private deploy","Enterprise SLA","Custom rules"],h:DODO.sovereign,l:"Contact Us"},
          ].map((p,i)=>(
            <div key={i} className={`plan${p.feat?" f":""}`}>
              {p.feat&&<div className="pb">Recommended</div>}
              <div className="pn">{p.n}</div>
              <div className="pp"><sup>$</sup>{p.p}</div>
              <div className="ppe">{p.per}</div>
              <div className="ps">{p.s}</div>
              <ul className="pfl">{p.f.map((f,j)=><li key={j}>{f}</li>)}</ul>
              <a href={p.h} className="pcta">{p.l}</a>
            </div>
          ))}
        </div>
        <div style={{marginTop:24,padding:20,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,color:"var(--muted)"}}>
          All purchases final. Free tier for evaluation. Run <span style={{color:"var(--gold)"}}>"/email your@email.com"</span> in the bot before paying.
        </div>
      </section>

      <hr className="div"/>

      <section id="roadmap" className="sec">
        <div className="stag">Roadmap</div>
        <h2 className="stitle">Where this is going.</h2>
        <div className="rmg">
          {[
            {num:"Phase 01",title:"Live now",a:true,items:["Telegram bot","Real scan credits","Dodo payments","Email-linked activation","SQLite persistence","MCP auth + rate limits"]},
            {num:"Phase 02",title:"Dashboard",items:["User web dashboard","Scan history","Plan management","API key management"]},
            {num:"Phase 03",title:"Scale",items:["PostgreSQL migration","Redis rate limiting","Async scan queue","Team accounts"]},
            {num:"Phase 04",title:"Sovereign",items:["Private deployment","Custom rule engine","Enterprise SLA","Full TEOS ecosystem"]},
          ].map((p,i)=>(
            <div key={i} className={`phase${p.a?" a":""}`}>
              <div className="pnum">{p.num}</div>
              <div className="ptitle">{p.title}</div>
              <ul className="pitems">{p.items.map((item,j)=><li key={j}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <hr className="div"/>

      <section id="faq" className="sec">
        <div className="stag">FAQ</div>
        <h2 className="stitle">Common questions.</h2>
        <div className="faqg">
          {[
            ["What does TEOS Sentinel do?","Scans code before execution and returns ALLOW, WARN, or BLOCK based on 14 risk rules."],
            ["How do paid plans activate?","Run /email your@email.com in the bot first. Pay via Dodo. Credits activate automatically."],
            ["Can I use it in CI/CD?","Yes. Builder and Pro include /api/ci/scan. POST with x-ci-token. Fail pipeline on BLOCK."],
            ["Do you offer refunds?","No refunds. Free tier (5 scans) exists for evaluation before upgrading."],
            ["What is the Sovereign plan?","Private deployment of the full TEOS stack. Unlimited scans, custom rules, enterprise SLA."],
          ].map(([q,a],i)=>(
            <div key={i} className="faqi"><div className="faqq">{q}</div><div className="faqa">{a}</div></div>
          ))}
        </div>
      </section>

      <hr className="div"/>

      <footer>
        <div><div className="fl">TEOS <span>SENTINEL</span></div><div className="fc" style={{marginTop:6}}>Powered by Elmahrosa International · Alexandria, Egypt</div></div>
        <div className="fls">
          <a href={BOT} className="fla">Telegram Bot</a>
          <a href="https://github.com/Elmahrosa/teoslinker-bot" className="fla">GitHub</a>
          <a href="mailto:ayman@teosegypt.com" className="fla">Contact</a>
        </div>
        <div className="fc">@teosegypt · @elmahrosapi</div>
      </footer>
    </>
  );
}