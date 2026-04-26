"use client";
import { useState, useEffect, useRef } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold: #d4af37;
    --gold-light: #f0d060;
    --gold-dim: rgba(212,175,55,0.12);
    --bg: #050508;
    --bg2: #080810;
    --surface: rgba(212,175,55,0.04);
    --border: rgba(212,175,55,0.15);
    --text: #e8e0cc;
    --muted: #6b6455;
    --red: #ef4444;
    --green: #22c55e;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Rajdhani', sans-serif;
    font-size: 17px;
    min-height: 100vh;
    overflow-x: hidden;
    line-height: 1.5;
  }

  /* NAV */
  .teos-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 16px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s ease;
  }
  .teos-nav.scrolled {
    background: rgba(5,5,8,0.94);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo {
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--gold);
    letter-spacing: 0.14em;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .nav-links { display: flex; gap: 28px; align-items: center; }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--gold); }
  .nav-cta {
    background: var(--gold) !important;
    color: #050508 !important;
    padding: 8px 22px !important;
    font-weight: 700 !important;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .nav-cta:hover { background: var(--gold-light) !important; }

  /* HERO */
  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 130px 24px 80px;
    overflow: hidden;
  }
  .hero-glow {
    position: absolute;
    top: 38%; left: 50%;
    transform: translate(-50%, -50%);
    width: 900px; height: 900px;
    background: radial-gradient(ellipse, rgba(212,175,55,0.09) 0%, transparent 65%);
    pointer-events: none;
    animation: heroGlow 5s ease-in-out infinite;
  }
  .hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%);
    pointer-events: none;
  }
  @keyframes heroGlow {
    0%,100% { opacity: 0.8; transform: translate(-50%,-50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%,-50%) scale(1.07); }
  }
  .hero-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--gold-dim);
    border: 1px solid var(--border);
    color: var(--gold);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 6px 20px;
    clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
    margin-bottom: 36px;
    animation: fadeUp 0.6s ease forwards;
  }
  .badge-live {
    width: 7px; height: 7px;
    background: var(--green);
    border-radius: 50%;
    animation: blink 1.6s ease-in-out infinite;
    box-shadow: 0 0 6px var(--green);
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.15} }

  .hero h1 {
    position: relative;
    font-family: 'Cinzel', serif;
    font-size: clamp(3rem, 6.5vw, 6rem);
    font-weight: 900;
    line-height: 1.02;
    letter-spacing: 0.04em;
    color: #fff;
    animation: fadeUp 0.7s 0.1s ease both;
  }
  .gold-text {
    background: linear-gradient(135deg, #b8972a 0%, var(--gold) 35%, var(--gold-light) 60%, var(--gold) 80%, #b8972a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-tagline {
    position: relative;
    margin-top: 10px;
    font-family: 'Cinzel', serif;
    font-size: clamp(0.9rem, 1.8vw, 1.4rem);
    font-weight: 400;
    color: rgba(212,175,55,0.45);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    animation: fadeUp 0.7s 0.15s ease both;
  }
  .hero-sub {
    position: relative;
    margin-top: 24px;
    font-size: 1.05rem;
    color: var(--muted);
    max-width: 480px;
    line-height: 1.75;
    animation: fadeUp 0.7s 0.2s ease both;
  }
  .hero-actions {
    position: relative;
    margin-top: 44px;
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;
    animation: fadeUp 0.7s 0.28s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .btn-gold {
    background: linear-gradient(135deg, #c9a830, var(--gold), #c9a830);
    background-size: 200%;
    background-position: right;
    color: #050508;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 14px 40px;
    border: none;
    cursor: pointer;
    clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
    text-decoration: none;
    display: inline-block;
    transition: all 0.3s;
  }
  .btn-gold:hover { background-position: left; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(212,175,55,0.35); }
  .btn-outline {
    background: transparent;
    color: var(--gold);
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 13px 40px;
    border: 1px solid var(--border);
    cursor: pointer;
    clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
    text-decoration: none;
    display: inline-block;
    transition: all 0.2s;
  }
  .btn-outline:hover { border-color: var(--gold); background: var(--gold-dim); }

  /* DEMO */
  .demo-wrapper {
    position: relative;
    margin-top: 64px;
    width: 100%;
    max-width: 640px;
    animation: fadeUp 0.7s 0.38s ease both;
  }
  .demo-label-top {
    font-size: 0.62rem;
    color: var(--muted);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 14px;
    text-align: left;
    font-weight: 600;
  }
  .demo-box {
    background: rgba(5,5,8,0.92);
    border: 1px solid var(--border);
    overflow: hidden;
    box-shadow: 0 0 60px rgba(212,175,55,0.07);
  }
  .demo-topbar {
    background: rgba(212,175,55,0.05);
    border-bottom: 1px solid var(--border);
    padding: 10px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .demo-dots { display: flex; gap: 6px; }
  .demo-dots span { width: 10px; height: 10px; border-radius: 50%; }
  .demo-title { font-size: 0.68rem; letter-spacing: 0.15em; color: var(--gold); font-weight: 700; text-transform: uppercase; }
  .demo-active { font-size: 0.65rem; color: var(--green); letter-spacing: 0.1em; display: flex; align-items: center; gap: 5px; }
  .demo-body { padding: 22px 22px 20px; }
  .demo-section { font-size: 0.62rem; color: var(--muted); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 10px; font-weight: 600; }
  .demo-code {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(239,68,68,0.2);
    border-left: 2px solid #ef4444;
    padding: 14px 16px;
    font-family: 'Courier New', monospace;
    font-size: 0.82rem;
    color: #ef4444;
    line-height: 1.5;
    word-break: break-all;
    margin-bottom: 16px;
  }
  .demo-scan-btn {
    width: 100%;
    background: linear-gradient(90deg, rgba(212,175,55,0.13), rgba(212,175,55,0.07));
    border: 1px solid var(--border);
    color: var(--gold);
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 0.82rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 12px;
    cursor: pointer;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
    transition: background 0.2s;
  }
  .demo-scan-btn:hover:not(:disabled) { background: rgba(212,175,55,0.18); }
  .demo-scan-btn:disabled { opacity: 0.5; cursor: wait; }
  .demo-result {
    margin-top: 16px;
    padding: 16px;
    background: rgba(239,68,68,0.07);
    border: 1px solid rgba(239,68,68,0.22);
    border-left: 3px solid #ef4444;
    animation: fadeUp 0.4s ease;
  }
  .demo-result-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .dr-label { font-size: 0.68rem; color: var(--muted); letter-spacing: 0.12em; text-transform: uppercase; }
  .dr-verdict { font-weight: 700; font-size: 1rem; color: #ef4444; }
  .demo-flags { display: flex; flex-wrap: wrap; gap: 6px; }
  .demo-flag {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    color: #ef4444;
    font-size: 0.68rem;
    padding: 3px 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  /* STATS */
  .stats-bar {
    display: flex;
    justify-content: center;
    background: var(--bg2);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .stat-item {
    text-align: center;
    padding: 40px 52px;
    border-right: 1px solid var(--border);
    flex: 1; min-width: 140px;
  }
  .stat-item:last-child { border-right: none; }
  .stat-num { font-family: 'Cinzel', serif; font-size: 2.2rem; font-weight: 700; color: var(--gold); line-height: 1; }
  .stat-label { margin-top: 8px; font-size: 0.68rem; color: var(--muted); letter-spacing: 0.18em; text-transform: uppercase; }

  /* SECTIONS */
  .section-wrap { max-width: 1100px; margin: 0 auto; padding: 88px 24px; }
  .section-tag { font-size: 0.62rem; letter-spacing: 0.28em; color: var(--gold); font-weight: 700; text-transform: uppercase; margin-bottom: 14px; }
  .section-title { font-family: 'Cinzel', serif; font-size: clamp(1.9rem, 3.5vw, 2.9rem); font-weight: 700; color: #fff; line-height: 1.12; }
  .section-title .gold { color: var(--gold); }
  .section-divider { width: 48px; height: 2px; background: linear-gradient(90deg, var(--gold), transparent); margin: 20px 0; }
  .section-desc { color: var(--muted); max-width: 520px; line-height: 1.75; font-size: 1rem; margin-top: 0; }

  /* FEATURES */
  .features-grid {
    margin-top: 56px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
  }
  .feature-card {
    background: var(--bg);
    padding: 36px 30px;
    position: relative;
    transition: background 0.3s;
  }
  .feature-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .feature-card:hover { background: rgba(212,175,55,0.04); }
  .feature-card:hover::before { opacity: 1; }
  .feature-icon-wrap {
    width: 46px; height: 46px;
    background: var(--gold-dim);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
    margin-bottom: 20px;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .feature-name { font-family: 'Cinzel', serif; font-size: 0.95rem; font-weight: 600; color: #fff; margin-bottom: 10px; }
  .feature-desc { color: var(--muted); font-size: 0.9rem; line-height: 1.65; }

  /* PIPELINE */
  .pipeline {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 56px;
    flex-wrap: wrap;
    border: 1px solid var(--border);
  }
  .pipe-step {
    text-align: center;
    padding: 28px 40px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    flex: 1; min-width: 140px;
  }
  .pipe-step:last-child { border-right: none; }
  .pipe-step.active { background: rgba(212,175,55,0.08); position: relative; }
  .pipe-active-tag {
    position: absolute;
    top: -11px; left: 50%;
    transform: translateX(-50%);
    background: var(--gold);
    color: #050508;
    font-size: 0.55rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    padding: 3px 12px;
    clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
    white-space: nowrap;
  }
  .pipe-icon { font-size: 1.6rem; margin-bottom: 10px; }
  .pipe-name { font-family: 'Cinzel', serif; font-size: 0.85rem; font-weight: 600; color: #fff; letter-spacing: 0.06em; }
  .pipe-arrow { color: var(--gold); font-size: 1.4rem; padding: 0 8px; opacity: 0.4; }

  /* PRICING */
  .pricing-grid {
    margin-top: 56px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(195px, 1fr));
    gap: 14px;
  }
  .tier-card {
    background: rgba(8,8,16,0.8);
    border: 1px solid var(--border);
    padding: 32px 22px 26px;
    position: relative;
    display: flex;
    flex-direction: column;
    transition: transform 0.25s, box-shadow 0.25s;
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  }
  .tier-card:hover { transform: translateY(-5px); box-shadow: 0 14px 40px rgba(0,0,0,0.45); }
  .tier-card.popular { border-color: var(--gold); box-shadow: 0 0 30px rgba(212,175,55,0.1); }
  .tier-card.enterprise { border-style: dashed; border-color: rgba(212,175,55,0.22); background: transparent; }
  .popular-tag {
    position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
    background: var(--gold); color: #050508;
    font-size: 0.6rem; font-weight: 800; letter-spacing: 0.16em;
    padding: 3px 14px;
    clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
    white-space: nowrap;
  }
  .tier-name { font-family: 'Cinzel', serif; font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; }
  .tier-scans { font-size: 0.7rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid var(--border); }
  .tier-price-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 22px; }
  .tier-price { font-family: 'Cinzel', serif; font-size: 2.4rem; font-weight: 700; line-height: 1; }
  .tier-period { font-size: 0.85rem; color: var(--muted); }
  .tier-features { list-style: none; display: flex; flex-direction: column; gap: 10px; flex: 1; margin-bottom: 26px; }
  .tier-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem; color: var(--muted); line-height: 1.4; }
  .tier-features li::before { content: '◆'; color: var(--gold); font-size: 0.48rem; margin-top: 5px; flex-shrink: 0; opacity: 0.6; }
  .tier-btn {
    display: block; text-align: center; text-decoration: none;
    font-family: 'Rajdhani', sans-serif; font-weight: 700;
    font-size: 0.82rem; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 12px;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
    transition: all 0.2s; margin-top: auto;
  }
  .tb-gold { background: var(--gold); color: #050508; }
  .tb-gold:hover { background: var(--gold-light); }
  .tb-outline { border: 1px solid var(--border); color: var(--gold); background: transparent; }
  .tb-outline:hover { border-color: var(--gold); background: var(--gold-dim); }

  /* ROADMAP */
  .roadmap-grid {
    margin-top: 56px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
  }
  .roadmap-phase { background: var(--bg); padding: 32px 26px; }
  .phase-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .phase-name { font-family: 'Cinzel', serif; font-size: 0.9rem; font-weight: 700; color: #fff; }
  .phase-status {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em;
    padding: 3px 10px;
    clip-path: polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%);
  }
  .ps-live { background: rgba(34,197,94,0.12); color: var(--green); border: 1px solid rgba(34,197,94,0.3); }
  .ps-progress { background: rgba(212,175,55,0.12); color: var(--gold); border: 1px solid var(--border); }
  .ps-planned { background: rgba(107,114,128,0.08); color: var(--muted); border: 1px solid rgba(107,114,128,0.18); }
  .phase-sub { font-size: 0.68rem; color: var(--muted); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .phase-items { list-style: none; display: flex; flex-direction: column; gap: 9px; }
  .phase-items li { font-size: 0.88rem; color: var(--muted); display: flex; align-items: center; gap: 9px; }
  .phase-items li::before { content: ''; width: 5px; height: 5px; border: 1px solid rgba(212,175,55,0.4); flex-shrink: 0; }
  .phase-items.live li::before { background: var(--green); border-color: var(--green); }
  .phase-items.live li { color: #bdb5a5; }

  /* FOOTER */
  .footer {
    background: var(--bg2);
    border-top: 1px solid var(--border);
    padding: 56px 48px 36px;
  }
  .footer-inner { max-width: 1100px; margin: 0 auto; }
  .footer-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 48px; flex-wrap: wrap;
    padding-bottom: 40px; border-bottom: 1px solid var(--border); margin-bottom: 32px;
  }
  .footer-logo { font-family: 'Cinzel', serif; font-size: 1rem; font-weight: 700; color: var(--gold); letter-spacing: 0.14em; margin-bottom: 12px; }
  .footer-tagline { color: var(--muted); font-size: 0.88rem; max-width: 280px; line-height: 1.65; }
  .footer-meta { font-size: 0.7rem; color: var(--muted); letter-spacing: 0.1em; margin-top: 14px; }
  .footer-meta span { color: rgba(212,175,55,0.3); margin: 0 8px; }
  .footer-col { display: flex; flex-direction: column; gap: 10px; }
  .footer-col h4 { font-size: 0.62rem; letter-spacing: 0.22em; color: var(--gold); font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
  .footer-col a { color: var(--muted); text-decoration: none; font-size: 0.88rem; transition: color 0.2s; }
  .footer-col a:hover { color: var(--gold); }
  .footer-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
  .footer-copy { font-size: 0.78rem; color: var(--muted); letter-spacing: 0.06em; }
  .footer-social { display: flex; gap: 18px; }
  .footer-social a { color: var(--muted); text-decoration: none; font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase; transition: color 0.2s; }
  .footer-social a:hover { color: var(--gold); }

  @media (max-width: 768px) {
    .teos-nav { padding: 14px 20px; }
    .nav-links { display: none; }
    .section-wrap { padding: 60px 20px; }
    .footer { padding: 40px 20px 28px; }
    .footer-top { flex-direction: column; }
    .stat-item { padding: 28px 20px; }
  }
`;

const DEMO_CODE = `eval(require("child_process").exec("rm -rf /"))`;

const FEATURES = [
  { icon: "⚡", name: "eval() Vulnerabilities", desc: "Detects dangerous code execution patterns before they reach your runtime environment." },
  { icon: "💣", name: "Destructive Scripts", desc: "Blocks rm -rf, DROP TABLE, and other destructive commands at the gateway layer." },
  { icon: "🐚", name: "Hidden Shell Commands", desc: "Identifies obfuscated system calls and shell injections buried in generated code." },
  { icon: "📦", name: "Dependency Abuse", desc: "Scans for malicious package installations and supply chain risks in real time." },
  { icon: "🔗", name: "CI/CD Integration", desc: "Seamlessly integrates into your deployment pipeline without adding latency." },
  { icon: "🏎", name: "Sub-Second Validation", desc: "Real-time scanning at the generation layer — cleared in milliseconds." },
];

const TIERS = [
  { name: "Free", price: "$0", period: "", scans: "5 scans / month", features: ["Basic code risk scan", "Telegram bot access", "Community support"], cta: "Start Free", link: "https://t.me/teoslinker_bot", btn: "tb-outline" },
  { name: "Starter", price: "$9.99", period: "/mo", scans: "50 scans / month", features: ["Basic risk scanning", "Audit log", "Email alerts"], cta: "Buy Starter", link: "https://dodo.pe/ljdm3j4qpid", btn: "tb-outline" },
  { name: "Builder", price: "$49", period: "/mo", scans: "500 scans / month", features: ["Dependency scanner", "Priority support", "CI/CD integration"], cta: "Buy Builder", link: "https://dodo.pe/lfbruwuaf6", btn: "tb-gold", popular: true },
  { name: "Pro", price: "$99", period: "/mo", scans: "5,000 scans / month", features: ["Advanced rule engine", "Team workflows", "Priority queue", "API access"], cta: "Buy Pro", link: "https://dodo.pe/yw9uc2qlguf", btn: "tb-outline" },
  { name: "Sovereign", price: "Custom", period: "", scans: "Unlimited scans", features: ["Private deployment", "SLA guarantee", "Compliance reporting", "Dedicated support"], cta: "Contact Sales", link: "mailto:ayman@teosegypt.com?subject=TEOS%20Sentinel%20Sovereign%20Enterprise", btn: "tb-outline", enterprise: true },
];

const ROADMAP = [
  { phase: "Phase 1", name: "Core Security Engine", status: "live", sub: "Phase 1 — Live", items: ["Agent code risk scan", "Real-time validation", "Telegram bot integration", "Basic audit logs"] },
  { phase: "Phase 2", name: "Advanced Scanning", status: "progress", sub: "Phase 2 — In Progress", items: ["Dependency scanner", "Supply chain analysis", "Enhanced rule engine", "API access"] },
  { phase: "Phase 3", name: "CI/CD Integration", status: "planned", sub: "Phase 3 — Planned", items: ["GitHub Actions", "GitLab CI", "Jenkins plugin", "Pipeline blocking"] },
  { phase: "Phase 4", name: "Enterprise Features", status: "planned", sub: "Phase 4 — Planned", items: ["Private deployment", "Custom rule engine", "Advanced compliance", "Dedicated support"] },
];

function Demo() {
  const [state, setState] = useState<"idle" | "scanning" | "done">("idle");
  const [dots, setDots] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = () => {
    if (state !== "idle") return;
    setState("scanning");
    let d = 0;
    timerRef.current = setInterval(() => { d = (d + 1) % 4; setDots(".".repeat(d)); }, 350);
    setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setState("done");
    }, 2200);
  };

  return (
    <div className="demo-box">
      <div className="demo-topbar">
        <div className="demo-dots">
          <span style={{ background: "#ef4444" }} />
          <span style={{ background: "#f59e0b" }} />
          <span style={{ background: "#22c55e" }} />
        </div>
        <span className="demo-title">teos-sentinel — live scan</span>
        <span className="demo-active">
          <span style={{ width: 6, height: 6, background: "var(--green)", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 5px #22c55e" }} />
          ACTIVE
        </span>
      </div>
      <div className="demo-body">
        <div className="demo-section">Input Code:</div>
        <div className="demo-code">{DEMO_CODE}</div>
        <button className="demo-scan-btn" onClick={run} disabled={state === "scanning"}>
          {state === "idle" ? "Run Scan →" : state === "scanning" ? `Scanning${dots}` : "✓ Scan Complete"}
        </button>
        {state === "done" && (
          <div className="demo-result">
            <div className="demo-result-row">
              <span className="dr-label">Verdict</span>
              <span className="dr-verdict">🚫 BLOCKED</span>
            </div>
            <div className="demo-flags">
              <span className="demo-flag">eval() execution</span>
              <span className="demo-flag">shell injection</span>
              <span className="demo-flag">destructive command</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const statusClass: Record<string, string> = { live: "ps-live", progress: "ps-progress", planned: "ps-planned" };
  const statusLabel: Record<string, string> = { live: "● LIVE", progress: "◐ ACTIVE", planned: "○ PLANNED" };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* NAV */}
      <nav className={`teos-nav${scrolled ? " scrolled" : ""}`}>
        <a href="#" className="nav-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L3 7v6c0 5 3.9 9.7 9 10.9C17.1 22.7 21 18 21 13V7L12 2z" />
          </svg>
          TEOS SENTINEL
        </a>
        <div className="nav-links">
          <a href="#demo">Demo</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#roadmap">Roadmap</a>
          <a href="https://t.me/teoslinker_bot" target="_blank" rel="noopener noreferrer" className="nav-cta">Open Bot</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-grid" />

        <div className="hero-badge">
          <span className="badge-live" />
          AI Execution Firewall — Live Now
        </div>

        <h1>
          TEOS<br />
          <span className="gold-text">Sentinel Shield</span>
        </h1>
        <div className="hero-tagline">AI Execution Firewall</div>
        <p className="hero-sub">Code runs only when cleared. The missing security layer between AI generation and execution.</p>

        <div className="hero-actions">
          <a href="https://t.me/teoslinker_bot" target="_blank" rel="noopener noreferrer" className="btn-gold">Start Free</a>
          <a href="#pricing" className="btn-outline">View Plans</a>
        </div>

        <div id="demo" className="demo-wrapper">
          <div className="demo-label-top">See It In Action — Real-time code scanning before execution</div>
          <Demo />
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        {[
          { num: "<10ms", label: "Scan Latency" },
          { num: "99.9%", label: "Uptime SLA" },
          { num: "75+", label: "Countries" },
          { num: "6", label: "Threat Categories" },
        ].map((s) => (
          <div key={s.label} className="stat-item">
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div id="features">
        <div className="section-wrap">
          <div className="section-tag">Protection Layer</div>
          <h2 className="section-title">The Missing Layer in<br /><span className="gold">AI Infrastructure</span></h2>
          <div className="section-divider" />
          <p className="section-desc">Traditional AI pipelines skip validation. We insert a critical security layer between generation and execution.</p>

          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.name} className="feature-card">
                <div className="feature-icon-wrap">{f.icon}</div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="pipeline">
            <div className="pipe-step">
              <div className="pipe-icon">🤖</div>
              <div className="pipe-name">Generate</div>
            </div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step active">
              <div className="pipe-active-tag">VALIDATE</div>
              <div className="pipe-icon">🛡️</div>
              <div className="pipe-name">VALIDATE</div>
            </div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step">
              <div className="pipe-icon">✅</div>
              <div className="pipe-name">Execute</div>
            </div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section-wrap">
          <div style={{ textAlign: "center" }}>
            <div className="section-tag">Pricing</div>
            <h2 className="section-title">Simple, <span className="gold">Transparent</span> Pricing</h2>
            <div className="section-divider" style={{ margin: "20px auto" }} />
            <p className="section-desc" style={{ margin: "0 auto" }}>Start free. Scale as you grow.</p>
          </div>

          <div className="pricing-grid">
            {TIERS.map((t) => (
              <div key={t.name} className={`tier-card${t.popular ? " popular" : ""}${t.enterprise ? " enterprise" : ""}`}>
                {t.popular && <div className="popular-tag">MOST CHOSEN</div>}
                <div className="tier-name" style={{ color: t.popular ? "var(--gold)" : "#fff" }}>{t.name}</div>
                <div className="tier-scans">{t.scans}</div>
                <div className="tier-price-row">
                  <span className="tier-price" style={{ color: t.popular ? "var(--gold)" : "#fff" }}>{t.price}</span>
                  <span className="tier-period">{t.period}</span>
                </div>
                <ul className="tier-features">
                  {t.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <a
                  href={t.link}
                  target={t.link.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className={`tier-btn ${t.btn}`}
                >
                  {t.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROADMAP */}
      <div id="roadmap">
        <div className="section-wrap">
          <div className="section-tag">Roadmap</div>
          <h2 className="section-title">Where We're <span className="gold">Headed</span></h2>
          <div className="section-divider" />

          <div className="roadmap-grid">
            {ROADMAP.map((phase) => (
              <div key={phase.phase} className="roadmap-phase">
                <div className="phase-head">
                  <div className="phase-name">{phase.name}</div>
                  <span className={`phase-status ${statusClass[phase.status]}`}>{statusLabel[phase.status]}</span>
                </div>
                <div className="phase-sub">{phase.sub}</div>
                <ul className={`phase-items${phase.status === "live" ? " live" : ""}`}>
                  {phase.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-logo">🛡 TEOS SENTINEL</div>
              <p className="footer-tagline">Sovereign AI security infrastructure for the next generation of autonomous systems.</p>
              <div className="footer-meta">
                Alexandria, Egypt <span>•</span> Sovereign AI Security <span>•</span> Enterprise-Grade
              </div>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#demo">Demo</a>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#roadmap">Roadmap</a>
            </div>
            <div className="footer-col">
              <h4>Connect</h4>
              <a href="https://t.me/teoslinker_bot" target="_blank" rel="noopener noreferrer">Telegram Bot</a>
              <a href="https://t.me/Elmahrosapi" target="_blank" rel="noopener noreferrer">Community</a>
              <a href="https://github.com/Elmahrosa/teos-sentinel-shield" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="mailto:ayman@teosegypt.com">Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2026 Elmahrosa International. All rights reserved.</div>
            <div className="footer-social">
              <a href="https://t.me/teoslinker_bot" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a href="https://github.com/Elmahrosa/teos-sentinel-shield" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="mailto:ayman@teosegypt.com">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}