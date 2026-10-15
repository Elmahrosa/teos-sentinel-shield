#!/usr/bin/env node
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const W = 960, H = 540;

const C = {
  BG:       '#0B1120',
  BG_ALT:   '#111827',
  CARD:     '#1E293B',
  SURFACE:  '#F1F5F9',
  WHITE:    '#FFFFFF',
  BLUE:     '#60A5FA',
  BLUE_D:   '#2563EB',
  CYAN:     '#22D3EE',
  RED:      '#DC2626',
  ORANGE:   '#EA580C',
  AMBER:    '#D97706',
  GREEN:    '#059669',
  PURPLE:   '#A78BFA',
  PINK:     '#EC4899',
  MUTED:    '#94A3B8',
  TEXT:     '#CBD5E1',
  BORDER:   '#334155',
};

let firstPage = true;
function slide(doc, bg) {
  if (firstPage) {
    firstPage = false;
    doc.page.size = [W, H];
    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
  } else {
    doc.addPage({ size: [W, H], margin: 0 });
  }
  if (bg || bg === undefined) doc.rect(0, 0, W, H).fill(C.BG);
}

function title(doc, text, y, opts = {}) {
  doc.fontSize(opts.size || 36).font('Helvetica-Bold').fillColor(opts.color || C.WHITE);
  doc.text(text, opts.x || 60, y || 40, { width: opts.w || W - 120, align: opts.align || 'left', lineBreak: false });
}

function subtitle(doc, text, y, opts = {}) {
  doc.fontSize(opts.size || 16).font('Helvetica').fillColor(opts.color || C.TEXT);
  doc.text(text, opts.x || 60, y || 90, { width: opts.w || W - 120, align: opts.align || 'left', lineBreak: false });
}

function body(doc, text, y, opts = {}) {
  doc.fontSize(opts.size || 13).font('Helvetica').fillColor(opts.color || C.TEXT);
  doc.text(text, opts.x || 60, y || 140, { width: opts.w || W - 120, align: opts.align || 'left', lineBreak: false });
}

function label(doc, text, y, opts = {}) {
  doc.fontSize(opts.size || 9).font('Helvetica-Bold').fillColor(opts.color || C.BLUE);
  doc.text(text.toUpperCase(), opts.x || 60, y || 30, { width: opts.w || W - 120, align: opts.align || 'left', lineBreak: false });
}

function card(doc, x, y, w, h, opts = {}) {
  doc.roundedRect(x, y, w, h, 6).fill(opts.bg || C.CARD);
  if (opts.border) doc.roundedRect(x, y, w, h, 6).lineWidth(1).strokeColor(opts.border);
  if (opts.accent) doc.rect(x, y, 4, h).fill(opts.accent);
}

function bullet(doc, text, y, opts = {}) {
  const x = opts.x || 70;
  doc.fontSize(opts.size || 13).font('Helvetica').fillColor(opts.color || C.TEXT);
  doc.circle(x - 8, y + 6, 3).fill(opts.accent || C.BLUE);
  doc.text(text, x, y, { width: opts.w || W - 140, lineBreak: false });
}

function footer(doc, text) {
  doc.fontSize(7).font('Helvetica').fillColor(C.MUTED);
  doc.text(text || 'ELMAHROSA International  |  TEOS Sentinel Shield  |  Confidential', 60, H - 20, { width: W - 120, align: 'center', lineBreak: false });
}

function divider(doc, y) {
  doc.moveTo(60, y).lineTo(W - 60, y).lineWidth(0.5).strokeColor(C.BORDER);
}

function smallCard(doc, x, y, w, h, opts) {
  card(doc, x, y, w, h, opts);
  doc.fontSize(opts.titleSize || 10).font('Helvetica-Bold').fillColor(opts.titleColor || opts.accent || C.WHITE);
  doc.text(opts.title, x + 12, y + 8, { width: w - 24, lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(opts.descColor || C.TEXT);
  doc.text(opts.desc, x + 12, y + (opts.titleSize ? 28 : 26), { width: w - 24, lineBreak: false });
}

function generate() {
  const doc = new PDFDocument({ size: [W, H], margin: 0, bufferPages: true, info: {
    Title: 'TEOS Sentinel Shield – Investor Pitch Deck',
    Author: 'ELMAHROSA International',
    Subject: 'Seed Round – $1.5M',
  }});
  const outPath = path.join(__dirname, '..', 'TEOS-Sentinel-Pitch-Deck.pdf');
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  // ════════════════════════════════════════════
  // SLIDE 1 – COVER
  // ════════════════════════════════════════════
  slide(doc);
  doc.rect(0, 0, W, 4).fill(C.RED);
  doc.rect(0, 4, W, 60).fill(C.BG_ALT);

  doc.fontSize(28).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('TEOS SENTINEL SHIELD', 60, 18, { lineBreak: false });
  doc.fontSize(11).font('Helvetica').fillColor(C.BLUE);
  doc.text('BUILDING THE TRUST LAYER FOR AUTONOMOUS AI', 60, 48, { lineBreak: false });

  doc.fontSize(42).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('Building the Trust Layer', 60, 140, { width: W - 120, lineBreak: false });
  doc.text('for Autonomous AI', 60, 192, { width: W - 120, lineBreak: false });

  divider(doc, 252);
  subtitle(doc, 'AI agents are becoming autonomous.', 268, { size: 15 });
  subtitle(doc, 'Every autonomous agent needs governance.', 292, { size: 15, color: C.BLUE });

  doc.fontSize(11).font('Helvetica').fillColor(C.MUTED);
  doc.text('Seed Round  |  $1.5M  |  July 2026', 60, 340, { lineBreak: false });

  card(doc, 60, 390, 200, 50, { accent: C.BLUE });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.BLUE);
  doc.text('AYMAN SEIF', 80, 402, { lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(C.MUTED);
  doc.text('Founder & CEO', 80, 418, { lineBreak: false });

  doc.fontSize(9).font('Helvetica').fillColor(C.MUTED);
  doc.text('CONFIDENTIAL  |  July 2026', 60, H - 24, { width: W - 120, align: 'right', lineBreak: false });

  // ════════════════════════════════════════════
  // SLIDE 2 – CURRENT STATUS — COMPANY
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Current Status', 30);
  title(doc, 'Company', 50, { size: 30 });

  divider(doc, 92);

  // Company
  smallCard(doc, 60, 108, W - 120, 80, {
    accent: C.BLUE, title: 'ELMAHROSA International', desc: 'Egypt 🇪🇬\nMENA-focused AI Security Company', titleSize: 14 });
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.BLUE);
  doc.text('Registered Member, Anthropic Claude Partner Network', 80, 170, { width: W - 160, lineBreak: false });

  // Programs
  doc.fontSize(13).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('Programs', 60, 210, { lineBreak: false });

  const progs = [
    'TEOS Sentinel Shield  —  AI execution firewall, pre-execution governance',
    'TEOS AI Engine  —  Multi-model orchestration (Groq, Claude, OpenAI)',
    'TEOS Sovereign Security Stack  —  Policy engine, MCP, Railway production infra',
  ];
  progs.forEach((p, i) => {
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(p, 60, 232 + i * 20, { width: W - 120, lineBreak: false });
  });

  // Technology
  doc.fontSize(13).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('Technology', 60, 310, { lineBreak: false });

  const techs = [
    '121+ Security Rules  |  Pre-Execution AI Validation',
    'Deterministic Risk Engine  |  MCP Integration',
    'Railway Production Infrastructure  |  Redis  |  PostgreSQL',
  ];
  techs.forEach((t, i) => {
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(t, 60, 332 + i * 18, { width: W - 120, lineBreak: false });
  });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 3 – PROBLEM
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'The Problem', 30);
  title(doc, 'Autonomous Systems Without Governance', 50, { size: 28 });

  divider(doc, 92);

  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('Organizations are deploying:', 60, 108, { lineBreak: false });

  const deploys = [
    'AI Agents  —  autonomous executors making production decisions',
    'MCP Servers  —  model-context-protocol servers with system access',
    'Autonomous Workflows  —  multi-step AI pipelines without human oversight',
    'Code Generation Systems  —  AI code running in production environments',
  ];
  deploys.forEach((d, i) => {
    doc.fontSize(10).font('Helvetica').fillColor(C.TEXT);
    doc.circle(68, 136 + i * 24 + 4, 3).fill(C.RED);
    doc.text(d, 80, 136 + i * 24, { width: W - 160, lineBreak: false });
  });

  card(doc, 60, 256, W - 120, 50, { bg: '#1C1017', border: C.RED });
  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.RED);
  doc.text('Most security tools operate AFTER execution.', 80, 270, { lineBreak: false });
  doc.fontSize(10).font('Helvetica').fillColor(C.TEXT);
  doc.text('By the time they alert, the damage is already done.', 80, 290, { width: W - 160, lineBreak: false });

  doc.fontSize(13).font('Helvetica-Bold').fillColor(C.BLUE);
  doc.text('TEOS focuses on: Prevent Before Execution', 60, 326, { lineBreak: false });

  const detects = [
    ['Secret Exposure', C.RED], ['Dangerous Commands', C.ORANGE],
    ['Supply Chain Risk', C.AMBER], ['Prompt Injection', C.PURPLE],
    ['Data Exfiltration', C.PINK], ['Policy Violations', C.RED],
  ];
  detects.forEach((d, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * ((W - 160) / 2 + 40);
    const y = 358 + row * 24;
    doc.circle(x + 4, y + 6, 3).fill(d[1]);
    doc.fontSize(10).font('Helvetica').fillColor(d[1]);
    doc.text(d[0], x + 12, y, { width: (W - 160) / 2, lineBreak: false });
  });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 4 – MARKET OPPORTUNITY
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Market Opportunity', 30);
  title(doc, 'Verified Market Signals', 50, { size: 30 });

  divider(doc, 92);

  doc.fontSize(10).font('Helvetica').fillColor(C.TEXT);
  doc.text('These are publicly reported trends from leading analyst firms. Not projections — signals.', 60, 108, { width: W - 120, lineBreak: false });

  const signals = [
    { source: 'Gartner', signal: 'Enterprise AI spending continues to grow globally. AI Governance is emerging as a mandatory procurement category.', color: C.BLUE },
    { source: 'IDC', signal: 'AI Governance spending is projected to grow as organizations deploying AI require auditability and runtime controls.', color: C.CYAN },
    { source: 'McKinsey', signal: 'Governments worldwide are introducing AI regulations (EU AI Act, US Executive Order) requiring governance infrastructure.', color: C.GREEN },
    { source: 'Deloitte', signal: 'Enterprises need auditability and execution controls for AI agents. Without governance, autonomous systems introduce unacceptable risk.', color: C.PURPLE },
  ];

  signals.forEach((s, i) => {
    const y = 140 + i * 72;
    card(doc, 60, y, W - 120, 60, { accent: s.color });
    doc.fontSize(9).font('Helvetica-Bold').fillColor(s.color);
    doc.text(s.source.toUpperCase(), 80, y + 6, { lineBreak: false });
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(s.signal, 80, y + 22, { width: W - 180, lineBreak: false });
  });

  card(doc, 60, 435, W - 120, 30, { bg: C.BG_ALT, border: C.BORDER });
  doc.fontSize(7).font('Helvetica').fillColor(C.MUTED);
  doc.text('Sources: Gartner "AI Governance Market Forecast"  |  IDC "Worldwide AI Spending Guide"  |  McKinsey "State of AI"  |  Deloitte "AI Risk Management"', 80, 442, { width: W - 180, lineBreak: false });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 5 – SOLUTION
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Our Solution', 30);
  title(doc, 'Governance Before Execution', 50, { size: 30 });

  divider(doc, 92);

  body(doc, 'TEOS Sentinel Shield is a runtime policy engine for AI agents.', 112, { size: 14, color: C.BLUE });
  body(doc, 'It prevents dangerous actions before they execute.', 136, { size: 13, color: C.BLUE });

  const steps = [
    { icon: '01', title: 'Detect', desc: '121+ rules analyze agent behavior, code, and commands in real time before execution', color: C.BLUE },
    { icon: '02', title: 'Block', desc: 'Policy engine prevents dangerous actions — binary ALLOW/BLOCK in under 100ms', color: C.CYAN },
    { icon: '03', title: 'Report', desc: 'Audit trails, compliance reports, and governance logs for CISOs', color: C.GREEN },
  ];

  steps.forEach((s, i) => {
    const x = 60 + i * (W / 3 - 40);
    card(doc, x, 175, W / 3 - 60, 130, { accent: s.color });
    doc.fontSize(20).font('Helvetica-Bold').fillColor(s.color);
    doc.text(s.icon, x + 16, 191, { lineBreak: false });
    doc.fontSize(14).font('Helvetica-Bold').fillColor(C.WHITE);
    doc.text(s.title, x + 16, 219, { width: W / 3 - 92, lineBreak: false });
    doc.fontSize(10).font('Helvetica').fillColor(C.TEXT);
    doc.text(s.desc, x + 16, 243, { width: W / 3 - 92, lineBreak: false });
  });

  card(doc, 60, 330, W - 120, 70, { bg: '#0B2018', border: C.GREEN });
  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.GREEN);
  doc.text('Key Differentiator', 80, 344, { lineBreak: false });
  doc.fontSize(10).font('Helvetica').fillColor(C.TEXT);
  doc.text('Most security tools audit after execution. We block before damage occurs.', 80, 366, { width: W - 160, lineBreak: false });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 6 – PRODUCT
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Product', 30);
  title(doc, 'Enterprise Power, Three Surfaces', 50, { size: 30 });

  divider(doc, 92);

  const features = [
    { title: 'Telegram Bot', desc: 'Scan code, commands, or tokens by pasting. Zero learning curve, enterprise power.', color: C.BLUE },
    { title: 'Enforcement API', desc: 'RESTful API for enterprise integration. Real-time policy callbacks.', color: C.CYAN },
    { title: 'PDF Reports', desc: 'Due diligence reports with risk gauges, analysis, and audit trails.', color: C.GREEN },
    { title: 'MCP Integration', desc: 'Native Model-Context-Protocol support. Govern at the protocol level.', color: C.PURPLE },
    { title: 'Policy Engine', desc: 'Configurable policies — block, flag, or allow based on severity.', color: C.PINK },
    { title: 'Audit Trail', desc: 'Immutable governance logs. Every scan, every decision, timestamped.', color: C.RED },
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * ((W - 140) / 2 + 20);
    const y = 110 + row * 80;
    card(doc, x, y, (W - 140) / 2, 65, { accent: f.color });
    doc.fontSize(11).font('Helvetica-Bold').fillColor(f.color);
    doc.text(f.title, x + 16, y + 10, { width: (W - 140) / 2 - 32, lineBreak: false });
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(f.desc, x + 16, y + 28, { width: (W - 140) / 2 - 32, lineBreak: false });
  });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 7 – TECHNOLOGY
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Technology', 30);
  title(doc, 'Built for Scale, Engineered for Trust', 50, { size: 30 });

  divider(doc, 92);

  const techs2 = [
    { title: '121+ Governance Rules', desc: 'Deterministic engine — no LLM latency, no hallucination, binary decisions.', color: C.BLUE },
    { title: 'Pre-Execution Validation', desc: 'Actions classified and blocked before execution. Preventive, not reactive.', color: C.CYAN },
    { title: 'Multi-Model AI', desc: 'Groq, Claude, OpenAI — automatic failover, cost-optimized routing.', color: C.GREEN },
    { title: 'MCP Integration', desc: 'Native protocol-level governance for AI agents.', color: C.PURPLE },
  ];

  techs2.forEach((t, i) => {
    const y = 110 + i * 62;
    card(doc, 60, y, W - 120, 50, { accent: t.color });
    doc.fontSize(11).font('Helvetica-Bold').fillColor(t.color);
    doc.text(t.title, 80, y + 8, { width: 240, lineBreak: false });
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(t.desc, 330, y + 8, { width: W - 410, lineBreak: false });
  });

  card(doc, 60, 370, W - 120, 60, { bg: C.BG_ALT, border: C.BLUE });
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.BLUE);
  doc.text('INFRASTRUCTURE', 80, 382, { lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(C.TEXT);
  doc.text('Node.js 24  |  PDFKit  |  Redis  |  PostgreSQL  |  Railway Cloud  |  Telegram Bot API  |  Solana RPC  |  Jupiter/Birdeye  |  GitHub API', 80, 398, { width: W - 160, lineBreak: false });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 8 – COMPETITIVE POSITIONING
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Competitive Positioning', 30);
  title(doc, 'Categories, Not Companies', 50, { size: 30 });

  divider(doc, 92);

  const table = [
    { header: 'Category', col1: 'Focus', col2: 'When', col3: 'TEOS Advantage' },
    { header: 'LLM Providers', col1: 'Generate outputs', col2: 'During inference', col3: 'No governance built-in' },
    { header: 'Security Scanners', col1: 'Scan after execution', col2: 'Post-incident', col3: 'We prevent before execution' },
    { header: 'SIEM Platforms', col1: 'Monitor events', col2: 'After the fact', col3: 'We block in real time' },
    { header: 'AI Code Assistants', col1: 'Suggest code', col2: 'At development', col3: 'We govern at runtime' },
    { header: 'TEOS Sentinel Shield', col1: 'Govern before execution', col2: 'Pre-action', col3: 'Deterministic enforcement' },
  ];

  const colW = (W - 290) / 3;
  const sx = 170;

  table.forEach((row, ri) => {
    const y = 112 + ri * 42;
    const isH = ri === 0;
    const isTEOS = ri === table.length - 1;
    const bg = isH ? C.CARD : (ri % 2 === 0 ? '#131B2E' : C.BG);
    const cb = isTEOS ? C.BLUE : C.BORDER;

    // Highlight TEOS row
    if (isTEOS) {
      doc.roundedRect(60, y - 2, W - 120, 46, 4).lineWidth(1).strokeColor(C.BLUE);
    }

    // Category label
    doc.fontSize(isH ? 9 : 9).font('Helvetica-Bold').fillColor(isTEOS ? C.BLUE : (isH ? C.MUTED : C.WHITE));
    doc.text(row.header, 70, y + (isH ? 13 : 15), { width: 90, lineBreak: false });

    // Focus column
    const c1x = sx;
    doc.roundedRect(c1x, y, colW, 36, 3).fill(bg);
    if (isTEOS) doc.roundedRect(c1x, y, colW, 36, 3).lineWidth(0.5).strokeColor(C.BLUE + '40');
    doc.fontSize(isH ? 9 : 8).font(isH ? 'Helvetica-Bold' : 'Helvetica').fillColor(isTEOS ? C.BLUE : C.TEXT);
    doc.text(row.col1, c1x + 6, y + (isH ? 13 : 11), { width: colW - 12, lineBreak: false });

    // When column
    const c2x = sx + colW + 8;
    doc.roundedRect(c2x, y, colW, 36, 3).fill(bg);
    if (isTEOS) doc.roundedRect(c2x, y, colW, 36, 3).lineWidth(0.5).strokeColor(C.BLUE + '40');
    doc.fontSize(isH ? 9 : 8).font(isH ? 'Helvetica-Bold' : 'Helvetica').fillColor(isTEOS ? C.BLUE : C.TEXT);
    doc.text(row.col2, c2x + 6, y + (isH ? 13 : 11), { width: colW - 12, lineBreak: false });

    // TEOS advantage
    const c3x = sx + (colW + 8) * 2;
    doc.roundedRect(c3x, y, colW, 36, 3).fill(bg);
    if (isTEOS) doc.roundedRect(c3x, y, colW, 36, 3).lineWidth(0.5).strokeColor(C.BLUE + '40');
    doc.fontSize(isH ? 9 : 8).font(isH ? 'Helvetica-Bold' : 'Helvetica').fillColor(isTEOS ? C.GREEN : C.MUTED);
    doc.text(row.col3, c3x + 6, y + (isH ? 13 : 11), { width: colW - 12, lineBreak: false });
  });

  card(doc, 60, 370, W - 120, 60, { accent: C.BLUE });
  doc.fontSize(11).font('Helvetica-Bold').fillColor(C.BLUE);
  doc.text('TEOS Sentinel Shield occupies a unique category.', 80, 384, { width: W - 160, lineBreak: false });
  doc.fontSize(10).font('Helvetica').fillColor(C.TEXT);
  doc.text('Not a scanner. Not a monitor. A pre-execution governance engine — no other product does this.', 80, 404, { width: W - 160, lineBreak: false });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 9 – MOAT
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Defensible Advantages', 30);
  title(doc, 'Why We Win', 50, { size: 32 });

  divider(doc, 92);

  const moats = [
    { title: 'Deterministic Policy Engine', desc: '121 rules in <100ms. No LLM latency, no hallucination.', color: C.BLUE },
    { title: 'Pre-Execution Enforcement', desc: 'Blocks BEFORE damage. Preventive, not post-incident.', color: C.CYAN },
    { title: 'Multi-Model AI', desc: 'Groq + Claude + OpenAI. Auto failover. No single vendor.', color: C.GREEN },
    { title: 'Enterprise Audit Trail', desc: 'Immutable logs, compliance reports, CISO-ready.', color: C.PURPLE },
    { title: 'Multi-Channel', desc: 'Telegram + API + MCP. Same engine, three surfaces.', color: C.PINK },
    { title: 'Anthropic Partner', desc: 'Registered member, Claude integration, co-marketing.', color: C.AMBER },
  ];

  moats.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * ((W - 140) / 2 + 20);
    const y = 110 + row * 72;
    card(doc, x, y, (W - 140) / 2, 60, { accent: m.color });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(m.color);
    doc.text(m.title, x + 16, y + 8, { width: (W - 140) / 2 - 32, lineBreak: false });
    doc.fontSize(8).font('Helvetica').fillColor(C.TEXT);
    doc.text(m.desc, x + 16, y + 26, { width: (W - 140) / 2 - 32, lineBreak: false });
  });

  card(doc, 60, 340, W - 120, 60, { bg: '#0B2018', border: C.GREEN });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.GREEN);
  doc.text('The Moat Deepens With Scale', 80, 354, { lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(C.TEXT);
  doc.text('More scans → better rules  |  More data → better AI  |  More integrations → switching costs', 80, 374, { width: W - 160, lineBreak: false });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 10 – BUSINESS MODEL
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Business Model', 30);
  title(doc, 'SaaS + Services', 50, { size: 30 });

  divider(doc, 92);

  const bmCols = [
    {
      name: 'STARTER', price: '$69', period: '/mo', opts: '$690/yr',
      items: ['100 scans/month', 'Full PDF reports', 'Whale analysis', 'Priority support'],
      color: C.BLUE,
    },
    {
      name: 'TEAM', price: '$199', period: '/mo', opts: '$1,990/yr',
      items: ['500 scans/month', 'API access', 'Custom policies', 'Dedicated support'],
      color: C.PURPLE,
    },
    {
      name: 'ENTERPRISE', price: 'Custom', period: '',
      items: ['Unlimited scans', 'On-prem deployment', 'SLA guarantee', 'White-glove onboarding'],
      color: C.CYAN,
    },
    {
      name: 'GOVERNMENT', price: 'Custom', period: '',
      items: ['Air-gapped deployment', 'Compliance packages', 'Dedicated SLAs', 'Security assessments'],
      color: C.GREEN,
    },
  ];

  const cw = (W - 180) / 4;
  bmCols.forEach((p, i) => {
    const x = 60 + i * (cw + 20);
    card(doc, x, 110, cw, 180, { border: p.color });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(p.color);
    doc.text(p.name, x + 12, 124, { lineBreak: false });
    doc.fontSize(26).font('Helvetica-Bold').fillColor(C.WHITE);
    doc.text(p.price, x + 12, 142, { lineBreak: false });
    if (p.period) {
      doc.fontSize(9).font('Helvetica').fillColor(C.MUTED);
      doc.text(p.period, x + 72, 158, { lineBreak: false });
    }
    if (p.opts) {
      doc.fontSize(8).font('Helvetica').fillColor(C.MUTED);
      doc.text(p.opts, x + 12, 170, { lineBreak: false });
    }
    p.items.forEach((f, fi) => {
      doc.fontSize(8).font('Helvetica').fillColor(C.TEXT);
      doc.circle(x + 18, 192 + fi * 18, 2).fill(p.color);
      doc.text(f, x + 26, 188 + fi * 18, { width: cw - 38, lineBreak: false });
    });
  });

  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('Additional Revenue', 60, 310, { lineBreak: false });

  const extras = [
    'Deployment Services', 'Security Assessments',
    'Compliance Packages', 'Training',
    'Air-Gapped Installations',
  ];
  extras.forEach((e, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * 200;
    const y = 334 + row * 20;
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(e, x, y, { lineBreak: false });
  });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 11 – CURRENT TRACTION
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Current Traction', 30);
  title(doc, 'What We Have Built', 50, { size: 30 });

  divider(doc, 92);

  doc.fontSize(10).font('Helvetica').fillColor(C.TEXT);
  doc.text('Only what is true. No fabricated numbers.', 60, 108, { width: W - 120, lineBreak: false });

  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.BLUE);
  doc.text('Product', 60, 132, { lineBreak: false });

  const prod = [
    { ok: true, text: 'Railway Deployment  —  production infrastructure active' },
    { ok: true, text: 'MCP Infrastructure  —  protocol integration live' },
    { ok: true, text: 'Telegram Operations Bot  —  scanning and governance bot active' },
    { ok: true, text: 'Security Rule Engine  —  121+ rules, deterministic enforcement' },
    { ok: true, text: 'Production Checkout System  —  billing and payments integrated' },
  ];
  prod.forEach((p, i) => {
    const y = 156 + i * 22;
    doc.circle(70, y + 6, 4).fill(p.ok ? C.GREEN : C.MUTED);
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(p.text, 84, y, { width: W - 144, lineBreak: false });
  });

  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.CYAN);
  doc.text('Community', 60, 280, { lineBreak: false });

  const comm = [
    { ok: true, text: 'Active Development Community  —  ongoing contributions' },
    { ok: true, text: 'MENA Focus  —  regional presence and engagement' },
    { ok: true, text: 'Global Early Access Program  —  beta users onboarded' },
  ];
  comm.forEach((c, i) => {
    const y = 300 + i * 22;
    doc.circle(70, y + 6, 4).fill(c.ok ? C.GREEN : C.MUTED);
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(c.text, 84, y, { width: W - 144, lineBreak: false });
  });

  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.PURPLE);
  doc.text('Partnerships', 60, 380, { lineBreak: false });

  const parts = [
    { ok: true, text: 'Anthropic Claude Partner Network  —  registered member' },
  ];
  parts.forEach((p, i) => {
    const y = 400 + i * 22;
    doc.circle(70, y + 6, 4).fill(p.ok ? C.GREEN : C.MUTED);
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(p.text, 84, y, { width: W - 144, lineBreak: false });
  });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 12 – THE ASK + USE OF FUNDS
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'The Ask', 30);
  title(doc, 'Seed Round: $1.5M', 50, { size: 36 });

  divider(doc, 92);

  body(doc, 'Building the governance layer for autonomous AI.', 112, { size: 14, color: C.BLUE });

  doc.fontSize(13).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('Use of Funds', 60, 150, { lineBreak: false });

  const funds = [
    { label: 'Engineering', pct: 35, amount: '$525K', color: C.BLUE },
    { label: 'Enterprise Sales', pct: 20, amount: '$300K', color: C.CYAN },
    { label: 'Security & Compliance', pct: 15, amount: '$225K', color: C.GREEN },
    { label: 'Cloud Infrastructure', pct: 10, amount: '$150K', color: C.PURPLE },
    { label: 'Marketing', pct: 10, amount: '$150K', color: C.PINK },
    { label: 'Working Capital', pct: 10, amount: '$150K', color: C.AMBER },
  ];

  let barX = 60;
  const barW = W - 120;
  funds.forEach((f) => {
    const w = (f.pct / 100) * barW;
    doc.rect(barX, 182, w, 14).fill(f.color);
    barX += w;
  });

  funds.forEach((f, i) => {
    const y = 206 + i * 30;
    doc.circle(68, y + 6, 4).fill(f.color);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(f.color);
    doc.text(`${f.label}  ${f.amount}  (${f.pct}%)`, 80, y, { width: 400, lineBreak: false });
  });

  doc.fontSize(13).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('12-Month Targets', 60, 400, { lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(C.MUTED);
  doc.text('These are goals, not actuals.', 60, 418, { width: W - 120, lineBreak: false });

  const targets = [
    '10 Enterprise Pilots', '3 Government Pilots',
    '100 Paying Teams', '1,000 Developer Accounts',
    'Expansion Across MENA',
  ];
  targets.forEach((t, i) => {
    const y = 435 + i * 16;
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(t, 60 + (i % 2) * 280, Math.floor(y - Math.floor(i / 2) * 48), { width: 260, lineBreak: false });
  });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 13 – TEAM
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Team', 30);
  title(doc, 'Solo Founder, Full-Stack Builder', 50, { size: 30 });

  divider(doc, 92);

  card(doc, 60, 108, (W - 160) / 2, 165, { accent: C.BLUE });
  doc.fontSize(16).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('Ayman Seif', 80, 124, { lineBreak: false });
  doc.fontSize(10).font('Helvetica').fillColor(C.BLUE);
  doc.text('Founder & CEO  |  Sole Engineer', 80, 148, { lineBreak: false });
  doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
  ['Serial entrepreneur. 10K+ users across MENA.',
   'Full-stack: Node.js, Python, React, Solidity.',
   'Built v4.0 GA solo (121 rules, PDF reports,',
   'billing, bot, API, dashboard).',
   'Deep expertise in blockchain, AI/ML,',
   'distributed systems.',
  ].forEach((l, i) => doc.text(l, 80, 174 + i * 18, { width: (W - 160) / 2 - 40, lineBreak: false }));

  card(doc, 60 + (W - 160) / 2 + 40, 108, (W - 160) / 2, 165, { border: C.PURPLE });
  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.PURPLE);
  doc.text('Key Hires (Post-Seed)', 80 + (W - 160) / 2 + 40, 124, { lineBreak: false });

  const hires = [
    { role: 'AI / ML Engineer', count: '1st', when: 'Month 1-3', color: C.BLUE },
    { role: 'Backend Engineer', count: '1st', when: 'Month 3-6', color: C.CYAN },
    { role: 'Security Researcher', count: '1st', when: 'Month 6-9', color: C.RED },
    { role: 'Enterprise Sales', count: '1st', when: 'Month 6-12', color: C.AMBER },
    { role: 'Frontend Engineer', count: '1st', when: 'Month 9-12', color: C.GREEN },
  ];

  hires.forEach((h, i) => {
    const y = 148 + i * 22;
    doc.fontSize(8).font('Helvetica').fillColor(C.TEXT);
    doc.text(h.role, 80 + (W - 160) / 2 + 48, y, { width: 140, lineBreak: false });
    doc.fontSize(7).font('Helvetica').fillColor(C.MUTED);
    doc.text(h.when, 80 + (W - 160) / 2 + 48, y + 10, { width: 140, lineBreak: false });
    doc.fontSize(8).font('Helvetica-Bold').fillColor(h.color);
    doc.text(h.count, 80 + (W - 160) / 2 + 280, y, { lineBreak: false });
  });

  doc.fontSize(12).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('Advisory (Recruiting)', 60, 300, { lineBreak: false });

  bullet(doc, 'CTO Advisor — DeFi/security, enterprise AI experience', 326, { accent: C.PURPLE, size: 10 });
  bullet(doc, 'Board Advisor — Former CISO at fintech company', 348, { accent: C.BLUE, size: 10 });
  bullet(doc, 'University partnerships for AI model research & talent', 370, { accent: C.CYAN, size: 10 });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 14 – RISKS
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Risks & Mitigation', 30);
  title(doc, 'We Know the Risks', 50, { size: 32 });

  divider(doc, 92);

  const risks = [
    { risk: 'Regulatory uncertainty in AI governance', mitigation: 'Governance-first architecture. Multi-vertical positioning avoids single-regulation dependency.', color: C.RED },
    { risk: 'Competition from well-funded vendors', mitigation: 'First-mover in pre-execution governance. Deep technical moat. Deterministic engine is hard to replicate.', color: C.ORANGE },
    { risk: 'Single founder risk', mitigation: 'Aggressive hiring post-seed. Advisory board underway. Product already in production (v4.0 GA).', color: C.AMBER },
    { risk: 'Market adoption slower than projected', mitigation: 'Lean burn rate extends runway. Multiple go-to-market channels (Telegram, API, MCP).', color: C.PURPLE },
  ];

  risks.forEach((r, i) => {
    const y = 110 + i * 82;
    card(doc, 60, y, W - 120, 70, { accent: r.color });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(r.color);
    doc.text(`RISK: ${r.risk}`, 80, y + 8, { width: W - 160, lineBreak: false });
    doc.fontSize(9).font('Helvetica').fillColor(C.TEXT);
    doc.text(`MITIGATION: ${r.mitigation}`, 80, y + 28, { width: W - 160, lineBreak: false });
  });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 15 – VISION
  // ════════════════════════════════════════════
  slide(doc);
  label(doc, 'Vision', 30);
  title(doc, 'The Future We Are Building', 50, { size: 32 });

  divider(doc, 92);

  const vl = [
    { text: 'Every enterprise will deploy AI agents.', color: C.TEXT, sz: 18 },
    { text: 'Every AI agent will require governance.', color: C.BLUE, sz: 18 },
    { text: 'TEOS Sentinel Shield is building', color: C.WHITE, sz: 20 },
    { text: 'the trust infrastructure for autonomous AI.', color: C.CYAN, sz: 20 },
  ];

  let vy = 130;
  vl.forEach((v) => {
    doc.fontSize(v.sz).font('Helvetica-Bold').fillColor(v.color);
    doc.text(v.text, 60, vy, { width: W - 120, align: 'center', lineBreak: false });
    vy += 40;
  });

  divider(doc, vy + 10);
  body(doc, 'From code security to enterprise AI governance.', vy + 30, { size: 13, align: 'center', w: W - 120 });
  body(doc, 'The same engine. The same trust layer.', vy + 55, { size: 13, align: 'center', w: W - 120 });

  footer(doc);

  // ════════════════════════════════════════════
  // SLIDE 16 – CLOSING
  // ════════════════════════════════════════════
  slide(doc);
  doc.rect(0, 0, W, 4).fill(C.RED);
  doc.rect(0, 4, W, 60).fill(C.BG_ALT);

  doc.fontSize(28).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('TEOS SENTINEL SHIELD', 60, 18, { lineBreak: false });
  doc.fontSize(11).font('Helvetica').fillColor(C.BLUE);
  doc.text('BUILDING THE TRUST LAYER FOR AUTONOMOUS AI', 60, 48, { lineBreak: false });

  title(doc, 'Every Agent Will Need', 160, { size: 36, align: 'center', w: W - 120 });
  title(doc, 'Governance.', 205, { size: 36, align: 'center', w: W - 120, color: C.BLUE });

  divider(doc, 265);
  body(doc, 'We are building the trust layer for autonomous AI.', 285, { size: 16, align: 'center', w: W - 120 });

  card(doc, W / 2 - 200, 330, 400, 80, { border: C.BLUE });
  doc.fontSize(14).font('Helvetica-Bold').fillColor(C.WHITE);
  doc.text('Ayman Seif  |  Founder & CEO', W / 2 - 180, 344, { width: 360, align: 'center', lineBreak: false });
  doc.fontSize(10).font('Helvetica').fillColor(C.BLUE);
  doc.text('ayman@teosegypt.com', W / 2 - 180, 368, { width: 360, align: 'center', lineBreak: false });
  doc.fontSize(9).font('Helvetica').fillColor(C.MUTED);
  doc.text('Raise: $1.5M Seed  |  Sent from Cairo, Shipping Globally', W / 2 - 180, 388, { width: 360, align: 'center', lineBreak: false });

  doc.fontSize(10).font('Helvetica').fillColor(C.MUTED);
  doc.text('https://sentinel.teosegypt.com  |  https://github.com/Elmahrosa', 60, 440, { width: W - 120, align: 'center', lineBreak: false });

  doc.fontSize(7).font('Helvetica').fillColor(C.MUTED);
  doc.text('CONFIDENTIAL  |  ELMAHROSA International', 60, H - 24, { width: W - 120, align: 'center', lineBreak: false });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      const size = fs.statSync(outPath).size;
      console.log(`Pitch deck generated: ${outPath}`);
      console.log(`Size: ${(size / 1024).toFixed(1)} KB, Pages: 16`);
      resolve(outPath);
    });
    stream.on('error', reject);
  });
}

generate().catch(console.error);
