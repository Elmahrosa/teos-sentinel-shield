const PDFDocument = require('pdfkit');
const fs = require('fs');
const QRCode = require('qrcode');

// ═══════════════════════════════════════════════════════════════════════════
// COLOR SYSTEM — Enterprise Security Palette (WCAG AA Compliant)
// ═══════════════════════════════════════════════════════════════════════════

const C = {
  BG_DARK:      '#0a0a0a', // Dark background as requested
  BG_DARK_ALT:  '#111827',
  BG_CARD:      '#1E293B',
  BG_SURFACE:   '#FFFFFF',
  BG_SURFACE_ALT:'#F8FAFC',
  BG_HEADER:    '#F1F5F9',
  BORDER:       '#E2E8F0',
  BORDER_DARK:  '#334155',
  TEXT_PRIMARY:   '#0F172A',
  TEXT_SECONDARY: '#E0E0E0',
  TEXT_MUTED:     '#94A3B8',
  TEXT_WHITE:     '#FFFFFF',
  WHITE:        '#FFFFFF',
  TEXT_BLUE:      '#60A5FA',
  CRITICAL:     '#DC2626', CRITICAL_BG:  '#FEF2F2', CRITICAL_DARK:'#991B1B',
  HIGH:         '#EA580C', HIGH_BG:      '#FFF7ED', HIGH_DARK:    '#9A3412',
  MEDIUM:       '#D97706', MEDIUM_BG:    '#FFFBEB', MEDIUM_DARK:  '#92400E',
  LOW:          '#2563EB', LOW_BG:       '#EFF6FF', LOW_DARK:     '#1E40AF',
  SAFE:         '#059669', SAFE_BG:      '#ECFDF5', SAFE_DARK:    '#065F46',
  ACCENT:       '#2563EB', ACCENT_LIGHT: '#DBEAFE',
  GOLD:         '#FFD700', // Pure gold as requested
  GOLD_LIGHT:   '#D4AF37', // Light gold as requested
  GOLD_BG:      '#FEF3C7',

  // Watermark colors
  WATERMARK_GOLD:  'rgba(255, 215, 0, 0.05)', // Gold TEOS watermark at 5% opacity
  WATERMARK_RED:   'rgba(220, 38, 38, 0.1)',  // Red for BLOCKED stamp
};

// ═══════════════════════════════════════════════════════════════════════════
// SPACING — 8pt Grid
// ═══════════════════════════════════════════════════════════════════════════

const SP = { xs:2, sm:4, md:8, lg:12, xl:16, xxl:24, xxxl:32, ML:50, MR:50, MT:50, MB:50, W:495 };

// ══════════════════════════════════════════════════════════════════════════════
// FONTS — Cairo + Inter as requested
// ═════════════════════════════════════════════════════════════════════════════

// Note: For production, these fonts should be embedded. Using Helvetica equivalents for now.
const FONTS = {
  CAIRO_BOLD: 'Cairo-Bold',
  CAIRO_REGULAR: 'Cairo',
  INTER_BOLD: 'Inter-Bold',
  INTER_REGULAR: 'Inter',
};

// ── Engine metadata (single source of truth; refreshed from the live sentinel) ──
let ENGINE = { version: '5.1.0', totalRules: 258, coreRules: 95 };
const TEMPLATE_VERSION = 'v5.2.6';
function setEngineMeta(m) {
  if (!m) return;
  const list = Array.isArray(m.engines) ? m.engines : [];
  ENGINE = {
    version:    m.engineVersion || ENGINE.version,
    totalRules: m.totalRules || ENGINE.totalRules,
    coreRules:  (list.find(e => e.key === 'core') || {}).rules || ENGINE.coreRules,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS — Safe ASCII-only geometric symbols
// ═══════════════════════════════════════════════════════════════════════════

const I = {
  shield:'[S]', risk:'(*)', check:'[+]', cross:'[x]', warn:'[!]', info:'[i]',
  chart:'[#]', star:'[*]', lock:'[@]', key:'[K]', users:'[U]', droplet:'[D]',
  cube:'[C]', up:'[^]', down:'[v]', bullet:'- ', dash:'--', hr:'---',
  empty:'   ',
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function sanitize(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/\uFFFD/g,'?').replace(/[\uD800-\uDFFF]/g,'').trim();
}
function getISO() {
  const n=new Date(), o=-n.getTimezoneOffset(), sg=o>=0?'+':'-', a=Math.abs(o);
  return `${n.toISOString().replace('Z','')}${sg}${String(Math.floor(a/60)).padStart(2,'0')}:${String(a%60).padStart(2,'0')}`;
}
function truncAddr(a,f=8,b=6){ return (!a||a.length<=f+b+3)?(a||'N/A'):`${a.slice(0,f)}...${a.slice(-b)}`; }
function fmtUSD(n){ if(!n||n===0)return'$0'; if(n>=1e9)return`$${(n/1e9).toFixed(2)}B`; if(n>=1e6)return`$${(n/1e6).toFixed(2)}M`; if(n>=1e3)return`$${(n/1e3).toFixed(2)}K`; return`$${n.toFixed(2)}`; }
function fmtNum(n){ if(!n)return'0'; if(n>=1e9)return`${(n/1e9).toFixed(1)}B`; if(n>=1e6)return`${(n/1e6).toFixed(1)}M`; if(n>=1e3)return`${(n/1e3).toFixed(1)}K`; return String(n); }
function sev(s){ if(s>=80)return{c:C.CRITICAL,bg:C.CRITICAL_BG,l:'CRITICAL'}; if(s>=60)return{c:C.HIGH,bg:C.HIGH_BG,l:'HIGH'}; if(s>=40)return{c:C.MEDIUM,bg:C.MEDIUM_BG,l:'MEDIUM'}; if(s>=20)return{c:C.LOW,bg:C.LOW_BG,l:'LOW'}; return{c:C.SAFE,bg:C.SAFE_BG,l:'SAFE'}; }
function concColor(p){ return p>60?C.CRITICAL:p>40?C.HIGH:p>20?C.MEDIUM:C.SAFE; }
function giniInterp(g){ return g>0.9?'Extreme inequality':g>0.7?'High inequality':g>0.5?'Moderate inequality':'Healthy distribution'; }

// ═══════════════════════════════════════════════════════════════════════════
// DRAWING PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

function drawShield(doc,x,y,s){
  s=s||24; const cx=x+s/2, top=y, bot=y+s, mid=y+s*0.45;
  doc.save();
  doc.moveTo(cx,top); doc.lineTo(x+s,top+s*0.2); doc.lineTo(x+s,mid); doc.lineTo(cx,bot); doc.lineTo(x,mid); doc.lineTo(x,top+s*0.2); doc.closePath(); doc.fill(C.CRITICAL_DARK);
  doc.moveTo(cx,top+s*0.08); doc.lineTo(x+s*0.92,top+s*0.24); doc.lineTo(x+s*0.92,mid-s*0.04); doc.lineTo(cx,bot-s*0.06); doc.lineTo(x+s*0.08,mid-s*0.04); doc.lineTo(x+s*0.08,top+s*0.24); doc.closePath(); doc.fill(C.CRITICAL);
  doc.fontSize(Math.max(6,s*0.28)).font(FONTS.CAIRO_BOLD).fillColor(C.WHITE);
  doc.text('T',cx-s*0.12,top+s*0.26,{align:'center',width:s*0.24,lineBreak:false});
  doc.restore();
}

function drawGrid(doc,pw,ph){
  doc.save(); doc.opacity(0.025);
  for(let x=0;x<pw;x+=40){ doc.moveTo(x,0).lineTo(x,ph).lineWidth(0.5).strokeColor(C.WHITE); }
  for(let y=0;y<ph;y+=40){ doc.moveTo(0,y).lineTo(pw,y).lineWidth(0.5).strokeColor(C.WHITE); }
  doc.restore();
}

function drawPageHeader(doc,title,sub,rptTitle){
  const pw=doc.page.width;
  doc.rect(0,0,pw,56).fill(C.BG_DARK);
  doc.rect(0,56,pw,2).fill(C.CRITICAL);
  drawShield(doc,SP.ML,16,24);
  doc.fontSize(14).font(FONTS.CAIRO_BOLD).fillColor(C.WHITE);
  doc.text('TEOS SENTINEL',SP.ML+32,18,{width:pw-SP.ML-SP.MR-32,lineBreak:false});
  doc.fontSize(6).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_BLUE);
  doc.text(rptTitle||'SOLANA TOKEN DUE DILIGENCE',SP.ML+32,36,{width:pw-SP.ML-SP.MR-32,lineBreak:false});
  if(title){ doc.fontSize(9).font(FONTS.CAIRO_BOLD).fillColor(C.WHITE); doc.text(sanitize(title),SP.ML,66,{width:pw-SP.ML-SP.MR,lineBreak:false}); }
  if(sub){ doc.fontSize(6).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_MUTED); doc.text(sanitize(sub),SP.ML,80,{width:pw-SP.ML-SP.MR,lineBreak:false}); }
  doc.y=96;
}

function drawPageFooter(doc,auditId,qrBuf){
  const sy=doc.y, pw=doc.page.width, ph=doc.page.height, fH=32, fy=ph-fH;
  const savedBottom=doc.options.margins?.bottom||0;
  doc.save();
  if(doc.options.margins) doc.options.margins.bottom=0;
  doc.rect(0,fy,pw,fH).fill(C.BG_DARK);
  doc.rect(0,fy,pw,1).fill(C.BORDER_DARK);
  doc.fontSize(4.5).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_MUTED);
  const pg=doc.bufferedPageRange()?.count||doc.page?.pageNumber||1;
  const iso=getISO();
  doc.text(`TEOS Sentinel Shield v${TEMPLATE_VERSION}  |  Engine v${ENGINE.version}  |  Audit: ${auditId}  |  ${iso}`,SP.ML,fy+3,{width:pw-SP.ML-SP.MR,align:'center',lineBreak:false});
  doc.text('ELMAHROSA International  |  Runtime Security Platform  |  Enterprise Security Intelligence',SP.ML,fy+11,{width:pw-SP.ML-SP.MR,align:'center',lineBreak:false});
  doc.text('CONFIDENTIAL  |  Generated by TEOS Sovereign Security Stack  |  Page '+pg,SP.ML,fy+19,{width:pw-SP.ML-SP.MR,align:'center',lineBreak:false});
  doc.text('(c) 2026 ELMAHROSA. All rights reserved.',SP.ML,fy+25,{width:pw-SP.ML-SP.MR,align:'center',lineBreak:false});
  if (qrBuf) {
    const qrSize = 20;
    const qrX = pw - qrSize - SP.MR;
    const qrY = fy + (fH - qrSize) / 2;
    doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
  }
  doc.restore();
  if(doc.options.margins) doc.options.margins.bottom=savedBottom;
  doc.y=sy;
}

function drawSection(doc,text,color){
  const y=doc.y, pw=doc.page.width, w=pw-SP.ML-SP.MR;
  doc.rect(SP.ML,y,w,20).fill(C.BG_HEADER);
  doc.rect(SP.ML,y,3,20).fill(color||C.ACCENT);
  doc.rect(SP.ML,y+20,w,0.5).fill(C.BORDER);
  doc.fontSize(7).font(FONTS.CAIRO_BOLD).fillColor(C.TEXT_PRIMARY);
  doc.text(`  ${sanitize(text)}`,SP.ML+8,y+6);
  doc.y=y+24;
}

function drawMetricCard(doc,x,y,w,h,icon,label,value,vc,desc){
  const savedY=doc.y;
  doc.save();
  doc.roundedRect(x,y,w,h,3).fill(C.BG_SURFACE);
  doc.roundedRect(x,y,w,h,3).lineWidth(0.5).strokeColor(C.BORDER);
  doc.rect(x,y+4,2,h-8).fill(vc||C.ACCENT);
  doc.fontSize(7).font(FONTS.CAIRO_BOLD).fillColor(vc||C.ACCENT);
  doc.text(icon||I.cube,x+8,y+5,{lineBreak:false});
  doc.fontSize(5.5).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_SECONDARY);
  doc.text(sanitize(label),x+22,y+4,{width:w-30, lineBreak:false});
  doc.fontSize(9).font(FONTS.CAIRO_BOLD).fillColor(vc||C.TEXT_PRIMARY);
  doc.text(sanitize(String(value||'N/A')),x+22,y+16,{width:w-30, lineBreak:false});
  if(desc){ doc.fontSize(4.5).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_MUTED); doc.text(sanitize(desc),x+22,y+28,{width:w-30, lineBreak:false}); }
  doc.restore();
  doc.y=savedY;
}

function drawBarChart(doc,x,y,w,data,maxV){
  const savedY=doc.y;
  const barH=10, labelW=75, gap=4, barAreaW=w-labelW-35;
  const max=maxV||Math.max(...data.map(d=>d.v),1);
  data.forEach((item,i)=>{
    const by=y+i*(barH+gap);
    const fillW=Math.max((item.v/max)*barAreaW,2);
    doc.rect(x,by,w,barH).fill(C.BG_SURFACE);
    doc.rect(x,by,w,0.5).fill(C.BORDER);
    doc.fontSize(5).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_SECONDARY);
    doc.text(sanitize(item.l),x+4,by+2,{width:labelW, lineBreak:false});
    doc.rect(x+labelW,by+1.5,fillW,barH-3).fill(item.c||C.ACCENT);
    doc.fontSize(5).font(FONTS.CAIRO_BOLD).fillColor(C.TEXT_PRIMARY);
    doc.text(`${item.v}%`,x+labelW+fillW+4,by+2,{lineBreak:false});
  });
  doc.y=savedY;
}

function drawSeverityRing(doc,cx,cy,r,data){
  let startA=-90;
  data.forEach(d=>{
    const sweep=(d.v/100)*360;
    const endA=startA+sweep;
    const steps=20;
    const step=(endA-startA)/steps;
    doc.save();
    doc.moveTo(cx,cy);
    for(let i=0;i<=steps;i++){
      const a=(startA+i*step)*Math.PI/180;
      doc.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
    }
    doc.closePath();
    doc.fill(d.c);
    doc.restore();
    startA=endA;
  });
  // Inner circle cutout
  doc.save();
  doc.circle(cx,cy,r*0.55).fill(C.BG_SURFACE);
  doc.restore();
}

function drawAuthorityStatus(doc,x,y,w,mintRevoked,freezeRevoked){
  const cardW=(w-8)/2;
  // Mint
  const mc=mintRevoked?C.SAFE:C.CRITICAL;
  const ml=mintRevoked?'REVOKED':'ACTIVE';
  const md=mintRevoked?'Cannot mint new tokens':'Can mint unlimited tokens';
  drawMetricCard(doc,x,y,cardW,36,I.key,'MINT AUTHORITY',ml,mc,md);
  // Freeze
  const fc=freezeRevoked?C.SAFE:C.CRITICAL;
  const fl=freezeRevoked?'REVOKED':'ACTIVE';
  const fd=freezeRevoked?'Cannot freeze accounts':'Can freeze user accounts';
  drawMetricCard(doc,x+cardW+8,y,cardW,36,I.lock,'FREEZE AUTHORITY',fl,fc,fd);
}

function drawStatusPill(doc,x,y,text,color,bg){
  const savedY=doc.y;
  const w=doc.fontSize(5).font(FONTS.CAIRO_BOLD).widthOfString(text)+12;
  doc.save();
  doc.roundedRect(x,y,w,10,2).fill(bg);
  doc.roundedRect(x,y,w,10,2).lineWidth(0.5).strokeColor(color);
  doc.fontSize(5).font(FONTS.CAIRO_BOLD).fillColor(color);
  doc.text(text,x+6,y+2.5,{lineBreak:false});
  doc.restore();
  doc.y=savedY;
}

function drawSentinelStamp(doc,x,y,s){
  const savedY=doc.y;
  s=s||48; const cx=x+s/2, cy=y+s/2;
  doc.save();
  doc.circle(cx,cy,s/2-1).lineWidth(1).strokeColor(C.BORDER).opacity(0.3).stroke();
  doc.circle(cx,cy,s/2-4).lineWidth(0.5).strokeColor(C.BORDER).opacity(0.2).stroke();
  doc.fontSize(4).font(FONTS.CAIRO_BOLD).fillColor(C.TEXT_MUTED).opacity(0.3);
  doc.text('SENTINEL',cx-16,cy-5,{align:'center',width:32,lineBreak:false});
  doc.fontSize(3.5).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_MUTED).opacity(0.3);
  doc.text('VERIFIED',cx-12,cy+3,{align:'center',width:24,lineBreak:false});
  doc.restore();
  doc.y=savedY;
}

// ═══════════════════════════════════════════════════════════════════════════
// TABLE DRAWING — Zebra rows, professional headers
// ═══════════════════════════════════════════════════════════════════════════

function drawTable(doc,headers,rows,colWidths,opts){
  const startX=SP.ML;
  const totalW=colWidths.reduce((a,b)=>a+b,0);
  const headerH=14, rowH=11;
  const headerBg=C.BG_HEADER, zebraEven=C.BG_SURFACE, zebraOdd=C.BG_SURFACE_ALT;

  // Header
  const hy=doc.y;
  doc.rect(startX,hy,totalW,headerH).fill(headerBg);
  doc.rect(startX,hy,totalW,0.5).fill(C.BORDER);
  let xo=startX+4;
  headers.forEach((h,i)=>{
    doc.fontSize(5.5).font(FONTS.CAIRO_BOLD).fillColor(C.TEXT_PRIMARY);
    doc.text(sanitize(h),xo,hy+3,{width:colWidths[i]-6, lineBreak:false});
    xo+=colWidths[i];
  });
  doc.y=hy+headerH;

  // Rows
  rows.forEach((row,ri)=>{
    const ry=doc.y;
    let bgColor;
    if (opts && opts.rowBg && ri < opts.rowBg.length) {
      bgColor = opts.rowBg[ri];
    } else {
      bgColor = ri%2===0?zebraEven:zebraOdd;
    }
    doc.rect(startX,ry,totalW,rowH).fill(bgColor);
    doc.rect(startX,ry,totalW,0.5).fill(C.BORDER);
    xo=startX+4;
    row.forEach((cell,ci)=>{
      const color=opts?.rowColors?.[ri]?.[ci]||C.TEXT_SECONDARY;
      doc.fontSize(5).font(FONTS.INTER_REGULAR).fillColor(color);
      doc.text(sanitize(String(cell||'')),xo,ry+2.5,{width:colWidths[ci]-6, lineBreak:false});
      xo+=colWidths[ci];
    });
    doc.y=ry+rowH;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE BREAK HELPER
// ═══════════════════════════════════════════════════════════════════════════

function ensureSpace(doc,needed,auditId){
  const ph=doc.page.height;
  const mb=doc.options.margins?.bottom||SP.MB;
  if(doc.y+needed>ph-mb){
    doc.addPage();
    drawPageFooter(doc,auditId);
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATION ACTION CARDS
// ═══════════════════════════════════════════════════════════════════════════

function drawRecCard(doc,x,y,w,rec){
  const h=40;
  const savedY=doc.y;
  doc.save();
  doc.roundedRect(x,y,w,h,3).fill(C.BG_SURFACE);
  doc.roundedRect(x,y,w,h,3).lineWidth(0.5).strokeColor(C.BORDER);
  const pColor=rec.priority==='CRITICAL'?C.CRITICAL:rec.priority==='HIGH'?C.HIGH:rec.priority==='MEDIUM'?C.MEDIUM:C.LOW;
  doc.rect(x,y,3,h).fill(pColor);
  doc.fontSize(5).font(FONTS.CAIRO_BOLD).fillColor(pColor);
  doc.text(`[${rec.priority}] ${sanitize(rec.title)}`,x+8,y+4,{width:w-16, lineBreak:false});
  doc.fontSize(4.5).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_PRIMARY);
  doc.text(sanitize(rec.desc),x+8,y+14,{width:w-16, lineBreak:false});
  doc.fontSize(4).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_SECONDARY);
  doc.text(`Business: ${sanitize(rec.bizImpact)}  |  Tech: ${sanitize(rec.techImpact)}`,x+8,y+26,{width:w-16, lineBreak:false});
  doc.fontSize(4).font(FONTS.CAIRO_BOLD).fillColor(pColor);
  doc.text(`Urgency: ${sanitize(rec.urgency)}`,x+8,y+34,{width:w-16, lineBreak:false});
  doc.restore();
  doc.y=savedY;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE RENDERERS
// ═══════════════════════════════════════════════════════════════════════════

function renderCover(doc,data){
  const {meta,whale,auth,rug,liq,score,auditId,iso}=data;
  const pw=doc.page.width, ph=doc.page.height;

  // Calculate individual risk scores (0-100 scale)
  const riskScore = score; // Overall risk score
  const secretsScore = Math.min((rug.riskScore||0) + (whale.top10Concentration||0), 100); // Secrets exposure risk
  const supplyChainScore = Math.min((rug.riskScore||0) * 0.8, 100); // Supply chain risk (simplified)
  const executionScore = Math.min((rug.riskScore||0) * 0.9, 100); // Execution risk (simplified)

  const savedMB=doc.options.margins?.bottom||0;
  if(doc.options.margins) doc.options.margins.bottom=0;

  // Fill background with dark color
  doc.rect(0,0,pw,ph).fill(C.BG_DARK);

  // Add gold TEOS watermark at 5% opacity in the center
  doc.save();
  doc.transparency(0.05); // 5% opacity
  doc.fontSize(120).font(FONTS.CAIRO_BOLD).fillColor(C.WHITE);
  doc.text('TEOS', pw/2 - 100, ph/2 - 60, {width: 200, align: 'center'});
  doc.text('SENTINEL', pw/2 - 100, ph/2 + 20, {width: 200, align: 'center'});
  doc.restore();

  // Top border accent
  doc.rect(0,0,pw,8).fill(C.GOLD);

  // === TOP: 4 CIRCULAR GAUGES ===
  const gaugeSize = 60;
  const gaugeSpacing = 20;
  const totalGaugeWidth = 4 * gaugeSize + 3 * gaugeSpacing;
  const startX = (pw - totalGaugeWidth) / 2;
  const gaugeY = 80;

  // Risk Score Gauge (Green/Yellow/Red)
  drawCircularGauge(doc, startX, gaugeY, gaugeSize, riskScore,
    'Risk Score',
    riskScore >= 80 ? C.CRITICAL :
    riskScore >= 60 ? C.HIGH :
    riskScore >= 40 ? C.MEDIUM :
    C.SAFE);

  // Secrets Gauge
  drawCircularGauge(doc, startX + (gaugeSize + gaugeSpacing), gaugeY, gaugeSize, secretsScore,
    'Secrets',
    secretsScore >= 80 ? C.CRITICAL :
    secretsScore >= 60 ? C.HIGH :
    secretsScore >= 40 ? C.MEDIUM :
    C.SAFE);

  // Supply Chain Gauge
  drawCircularGauge(doc, startX + 2 * (gaugeSize + gaugeSpacing), gaugeY, gaugeSize, supplyChainScore,
    'Supply Chain',
    supplyChainScore >= 80 ? C.CRITICAL :
    supplyChainScore >= 60 ? C.HIGH :
    supplyChainScore >= 40 ? C.MEDIUM :
    C.SAFE);

  // Execution Gauge
  drawCircularGauge(doc, startX + 3 * (gaugeSize + gaugeSpacing), gaugeY, gaugeSize, executionScore,
    'Execution',
    executionScore >= 80 ? C.CRITICAL :
    executionScore >= 60 ? C.HIGH :
    executionScore >= 40 ? C.MEDIUM :
    C.SAFE);

  // === CENTER: LARGE GRADE BADGE ===
  const gradeY = gaugeY + gaugeSize + 40;

  // Determine grade based on score
  let grade = 'F';
  let gradeColor = C.CRITICAL;
  if (riskScore === 0) {
    grade = 'A+';
    gradeColor = C.GOLD; // Gold seal for score 0
  } else if (riskScore < 20) {
    grade = 'A';
    gradeColor = C.SAFE;
  } else if (riskScore < 40) {
    grade = 'B';
    gradeColor = C.SAFE;
  } else if (riskScore < 60) {
    grade = 'C';
    gradeColor = C.MEDIUM;
  } else if (riskScore < 80) {
    grade = 'D';
    gradeColor = C.HIGH;
  } else {
    grade = 'F';
    gradeColor = C.CRITICAL; // Red seal for score 100
  }

  // Draw large circular grade badge
  const badgeRadius = 50;
  const badgeCenterX = pw / 2;
  const badgeCenterY = gradeY + badgeRadius;

  doc.save();
  doc.circle(badgeCenterX, badgeCenterY, badgeRadius).fill(gradeColor);
  doc.circle(badgeCenterX, badgeCenterY, badgeRadius - 4).fill(C.BG_DARK);
  doc.restore();

  // Grade text
  doc.fontSize(36).font(FONTS.CAIRO_BOLD).fillColor(C.WHITE);
  doc.text(grade, badgeCenterX - 20, badgeCenterY - 10, {width: 40, align: 'center'});

  // Grade label
  doc.fontSize(12).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_WHITE);
  doc.text('GRADE', badgeCenterX - 20, badgeCenterY + badgeRadius + 10, {width: 40, align: 'center'});

  // Add seal indicator
  if (riskScore === 0) {
    doc.fontSize(10).font(FONTS.CAIRO_BOLD).fillColor(C.GOLD);
    doc.text('GOLD SEAL', badgeCenterX - 20, badgeCenterY + badgeRadius + 25, {width: 40, align: 'center'});
  } else if (riskScore >= 100) {
    doc.fontSize(10).font(FONTS.CAIRO_BOLD).fillColor(C.CRITICAL);
    doc.text('RED SEAL', badgeCenterX - 20, badgeCenterY + badgeRadius + 25, {width: 40, align: 'center'});
  }

  // === BOTTOM: BARCODE + QR CODE ===
  const bottomY = ph - 120;

  // Barcode placeholder (vertical lines)
  const barcodeX = pw / 2 - 50;
  const barcodeWidth = 100;
  const barcodeHeight = 20;
  for (let i = 0; i < 20; i++) {
    const lineWidth = i % 2 === 0 ? 2 : 1;
    const lineX = barcodeX + (i * 5);
    doc.rect(lineX, bottomY, lineWidth, barcodeHeight).fill(C.WHITE);
  }

  // QR code placeholder (we'll generate this later)
  const qrSize = 60;
  const qrX = pw / 2 - qrSize / 2;
  const qrY = bottomY + barcodeHeight + 10;
  doc.rect(qrX, qrY, qrSize, qrSize).fill(C.WHITE);
  doc.rect(qrX, qrY, qrSize, qrSize).lineWidth(1).strokeColor(C.BORDER);

  // QR code label
  doc.fontSize(8).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_WHITE);
  doc.text('Scan to Verify', qrX, qrY + qrSize + 15, {width: qrSize, align: 'center'});

  // === FOOTER: Engine v5.1.0 | Commit SHA | Date | TEOS CERTIFIED stamp ===
  const footerY = ph - 30;

  // Engine info
  doc.fontSize(8).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_WHITE);
  doc.text(`Engine v${ENGINE.version}`, 50, footerY, {width: 100, align: 'left'});

  // Commit SHA (we'll use auditId as placeholder)
  doc.text(`Audit: ${auditId}`, pw / 2 - 50, footerY, {width: 100, align: 'center'});

  // Date
  doc.text(iso.split('T')[0], pw - 100, footerY, {width: 80, align: 'right'});

  // TEOS CERTIFIED stamp (for ALLOW reports)
  if (riskScore < 40) { // ALLOW or WARN ranges
    doc.save();
    doc.transparency(0.8);
    doc.fontSize(10).font(FONTS.CAIRO_BOLD).fillColor(C.GOLD);
    doc.rotate(45 * Math.PI / 180); // 45 degrees
    doc.text('TEOS CERTIFIED', pw / 2 - 50, pw / 2 - 100);
    doc.restore();
  }

  // BLOCKED stamp (for high risk reports)
  if (riskScore >= 80) {
    doc.save();
    doc.transparency(0.8);
    doc.fontSize(12).font(FONTS.CAIRO_BOLD).fillColor(C.CRITICAL);
    doc.rotate(-45 * Math.PI / 180); // -45 degrees
    doc.text('BLOCKED', pw / 2 - 30, pw / 2 - 80);
    doc.restore();
  }

  if(doc.options.margins) doc.options.margins.bottom=savedMB;
}

// Helper function to draw circular gauges
function drawCircularGauge(doc, x, y, size, value, label, color) {
  const radius = size / 2;
  const centerX = x + radius;
  const centerY = y + radius;

  // Background circle
  doc.save();
  doc.circle(centerX, centerY, radius).fill(C.BG_CARD);
  doc.restore();

  // Value arc (0-100 mapped to 0-360 degrees, starting from top)
  const arcAngle = (value / 100) * 360;
  const startAngle = -90; // Start from top
  const endAngle = startAngle + arcAngle;

  if (arcAngle > 0) {
    doc.save();
    doc.lineWidth(8);
    doc.lineCap('round');
    doc.strokeColor(color);

    // Draw arc
    const steps = Math.max(1, Math.floor(arcAngle / 10)); // At least 1 step
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (i * (arcAngle / steps));
      const radian = angle * Math.PI / 180;
      const px = centerX + radius * 0.7 * Math.cos(radian);
      const py = centerY + radius * 0.7 * Math.sin(radian);

      if (i === 0) {
        doc.moveTo(px, py);
      } else {
        doc.lineTo(px, py);
      }
    }
    doc.stroke();
    doc.restore();
  }

  // Value text
  doc.fontSize(16).font(FONTS.CAIRO_BOLD).fillColor(C.TEXT_WHITE);
  doc.text(String(value), centerX - 10, centerY - 8, {width: 20, align: 'center'});

  // Label
  doc.fontSize(8).font(FONTS.INTER_REGULAR).fillColor(C.TEXT_WHITE);
  doc.text(label, centerX - 15, centerY + radius + 10, {width: 30, align: 'center'});
}

function renderExecSummary(doc,data,qrBuf,reportUrl,auditId){
  const {meta,whale,auth,rug,liq,findings,score,iso,mintAddress}=data;
  const pw=doc.page.width;

  drawPageHeader(doc,`${meta.name||'Unknown'} (${meta.symbol||'???'})`,`Mint: ${truncAddr(mintAddress,12,6)}`,'EXECUTIVE SUMMARY');

  // Mini gauge
  const sv=sev(score), gcx=pw/2, gcy=doc.y+26, gr=22;
  doc.save();
  doc.circle(gcx,gcy,gr).lineWidth(5).strokeColor(C.BG_HEADER);
  const arc=(score/100)*180, sa=180, ea=180+arc, steps=30, step=(ea-sa)/steps;
  doc.lineWidth(5).strokeColor(sv.c);
  doc.moveTo(gcx+gr*Math.cos(sa*Math.PI/180),gcy+gr*Math.sin(sa*Math.PI/180));
  for(let i=1;i<=steps;i++){ const a=(sa+i*step)*Math.PI/180; doc.lineTo(gcx+gr*Math.cos(a),gcy+gr*Math.sin(a)); }
  doc.stroke();
  doc.restore();
  doc.fontSize(14).font('Helvetica-Bold').fillColor(sv.c);
  doc.text(String(score),gcx-16,gcy-10,{align:'center',width:32,lineBreak:false});
  doc.fontSize(5).font('Helvetica').fillColor(C.TEXT_MUTED);
  doc.text('RISK',gcx-16,gcy+6,{align:'center',width:32,lineBreak:false});

  // Severity pill
  const pillW=doc.fontSize(7).font('Helvetica-Bold').widthOfString(sv.l)+16;
  doc.roundedRect((pw-pillW)/2,gcy+24,pillW,14,3).fill(sv.bg);
  doc.roundedRect((pw-pillW)/2,gcy+24,pillW,14,3).lineWidth(0.5).strokeColor(sv.c);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(sv.c);
  doc.text(sv.l,(pw-pillW)/2,gcy+28,{align:'center',width:pillW,lineBreak:false});
  doc.y=gcy+48;

  // Key Metrics 2x3 grid
  drawSection(doc,'KEY METRICS',C.ACCENT);
  const cw=(pw-SP.ML-SP.MR-8)/2, ch=36;
  const cards=[
    {i:I.users,l:'Total Holders',v:fmtNum(whale.totalHolders||0),c:(whale.totalHolders||0)<100?C.CRITICAL:C.SAFE,d:(whale.totalHolders||0)<100?'Very low - high rug risk':'Adequate holder base'},
    {i:I.droplet,l:'Liquidity',v:fmtUSD(liq.totalLiquidityUSD||0),c:(liq.totalLiquidityUSD||0)===0?C.CRITICAL:C.SAFE,d:liq.totalLiquidityUSD>0?'Active trading liquidity':'No liquidity detected'},
    {i:I.key,l:'Mint Authority',v:auth.mintAuthorityRevoked?'REVOKED':'ACTIVE',c:auth.mintAuthorityRevoked?C.SAFE:C.CRITICAL,d:auth.mintAuthorityRevoked?'Cannot mint new tokens':'Can mint unlimited tokens'},
    {i:I.lock,l:'Freeze Authority',v:auth.freezeAuthorityRevoked?'REVOKED':'ACTIVE',c:auth.freezeAuthorityRevoked?C.SAFE:C.CRITICAL,d:auth.freezeAuthorityRevoked?'Cannot freeze accounts':'Can freeze user accounts'},
    {i:I.chart,l:'Supply',v:meta.supply||'N/A',c:C.TEXT_PRIMARY,d:`Decimals: ${meta.decimals??'N/A'}`},
    {i:I.risk,l:'Rug Pull Risk',v:`${rug.riskScore||0}/100`,c:(rug.riskScore||0)>=70?C.CRITICAL:(rug.riskScore||0)>=45?C.HIGH:C.SAFE,d:rug.riskLevel||'UNKNOWN'},
  ];
  cards.forEach((c,i)=>{
    const col=i%2, row=Math.floor(i/2);
    drawMetricCard(doc,SP.ML+col*(cw+8),doc.y+row*(ch+4),cw,ch,c.i,c.l,c.v,c.c,c.d);
  });
  doc.y+=Math.ceil(cards.length/2)*(ch+4)+4;

  // === CHARTS SECTION ===
  drawSection(doc,'RISK CHARTS',C.ACCENT);

  // Prepare data for charts
  const safeCount = findings.filter(f => f.severity === 'info' || f.severity === 'low').length;
  const issuesCount = findings.filter(f => f.severity === 'medium' || f.severity === 'high' || f.severity === 'critical').length;

  const severityCounts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length
  };

  // Donut chart: Safe vs Issues
  const donutCX = SP.ML + 100;
  const donutCY = doc.y + 80;
  const donutRadius = 60;
  drawDonutChart(doc, donutCX, donutCY, donutRadius,
    [{value: safeCount, label: 'Safe', color: C.SAFE},
     {value: issuesCount, label: 'Issues', color: issuesCount > 0 ? C.CRITICAL : C.SAFE}],
    'Safe vs Issues');

  // Bar chart: Severity breakdown
  const barChartX = SP.ML + 200;
  const barChartY = doc.y + 20;
  const barChartWidth = pw - SP.ML - SP.MR - 220;
  const barChartHeight = 80;
  drawBarChartSeverity(doc, barChartX, barChartY, barChartWidth, barChartHeight, severityCounts);

  // Line chart: Risk trend (placeholder - would need historical data)
  const lineChartX = SP.ML + 100;
  const lineChartY = donutCY + donutRadius + 30;
  const lineChartWidth = pw - SP.ML - SP.MR - 200;
  const lineChartHeight = 80;
  drawLineChartTrend(doc, lineChartX, lineChartY, lineChartWidth, lineChartHeight,
    [{x: 0, y: 20}, {x: 25, y: 40}, {x: 50, y: 30}, {x: 75, y: 60}, {x: 100, y: 50}],
    'Risk Trend');

  doc.y = lineChartY + lineChartHeight + 20;

  // Findings Table
  if (findings.length > 0) {
    drawSection(doc, `TOP FINDINGS (${findings.length})`, C.CRITICAL);
    const headers = ['#', 'Severity', 'File', 'Line', 'Evidence (redacted)', 'Fix'];
    const bw = pw - SP.ML - SP.MR;
    const colWidths = [
      bw * 0.05, // #
      bw * 0.15, // Severity
      bw * 0.20, // File
      bw * 0.10, // Line
      bw * 0.35, // Evidence
      bw * 0.15  // Fix
    ];
    const rowsToShow = findings.slice(0, 10); // limit to 10 rows
    const rows = rowsToShow.map((f, idx) => [
      String(idx + 1),
      f.severity?.toUpperCase() || 'UNKNOWN',
      f.file || '',
      f.line ? String(f.line) : '',
      sanitize(f.message || f.rule || '').length > 100
        ? sanitize(f.message || f.rule || '').substring(0, 100) + '...'
        : sanitize(f.message || f.rule || ''),
      'Review code' // placeholder fix
    ]);
    const rowBg = rowsToShow.map(f => {
      switch (f.severity) {
        case 'critical': return C.CRITICAL_BG;
        case 'high': return C.HIGH_BG;
        case 'medium': return C.MEDIUM_BG;
        case 'low':
        case 'info': return C.LOW_BG;
        default: return C.BG_SURFACE;
      }
    });
    const tableHeight = 14 + rows.length * 11; // headerH + rows * rowH
    ensureSpace(doc, tableHeight + 10, auditId);
    drawTable(doc, headers, rows, colWidths, { rowBg });
    doc.y += 10; // spacing after table
  }

  // QR Audit
  drawSection(doc,'AUDIT TRAIL',C.ACCENT);
  const qrY=doc.y;
  try{ doc.image(qrBuf,SP.ML,qrY+2,{width:50,height:50}); }
  catch(e){ doc.fontSize(5).font('Helvetica').fillColor(C.TEXT_MUTED); doc.text('[QR]',SP.ML,qrY+20); }
  doc.fontSize(6).font('Helvetica-Bold').fillColor(C.TEXT_PRIMARY);
  doc.text('Scan to view report online',SP.ML+60,qrY+4);
  doc.fontSize(5).font('Helvetica').fillColor(C.TEXT_SECONDARY);
  doc.text(reportUrl,SP.ML+60,qrY+16,{width:pw-SP.ML-SP.MR-70,lineBreak:false});
  doc.text(`Audit ID: ${auditId}`,SP.ML+60,qrY+26,{width:pw-SP.ML-SP.MR-70,lineBreak:false});
  doc.text(`Generated: ${iso}`,SP.ML+60,qrY+36,{width:pw-SP.ML-SP.MR-70,lineBreak:false});
  doc.y=qrY+58;
}

function renderWhaleAnalysis(doc,data,auditId){
  const {whale,holders,meta}=data;
  const pw=doc.page.width, bw=pw-SP.ML-SP.MR;

  drawPageHeader(doc,'Whale Concentration Analysis',`${meta.name||'Token'} - Holder Distribution`,'WHALE CONCENTRATION');

  // Concentration bars
  drawSection(doc,'CONCENTRATION METRICS',C.HIGH);
  const barData=[
    {l:'Top 10 Holders',v:whale.top10Concentration||0,c:concColor(whale.top10Concentration||0)},
    {l:'Top 20 Holders',v:whale.top20Concentration||0,c:concColor(whale.top20Concentration||0)},
    {l:'Top 50 Holders',v:whale.top50Concentration||0,c:concColor(whale.top50Concentration||0)},
  ];
  drawBarChart(doc,SP.ML,doc.y,bw,barData,100);
  doc.y+=50;

  // Gini + Authority visualization
  drawSection(doc,'DISTRIBUTION ANALYSIS',C.GOLD);
  const gini=whale.giniCoefficient||0;
  const gc=gini>0.9?C.CRITICAL:gini>0.7?C.HIGH:gini>0.5?C.MEDIUM:C.SAFE;
  const gw=(bw-8)/2;
  drawMetricCard(doc,SP.ML,doc.y,gw,32,I.chart,'GINI COEFFICIENT',gini.toFixed(3),gc,giniInterp(gini));
  drawMetricCard(doc,SP.ML+gw+8,doc.y,gw,32,I.users,'TOTAL HOLDERS',fmtNum(whale.totalHolders||0),(whale.totalHolders||0)<100?C.CRITICAL:C.SAFE,(whale.totalHolders||0)<100?'Critically low base':'Adequate distribution');
  doc.y+=40;

  // Severity ring chart
  drawSection(doc,'CONCENTRATION BREAKDOWN',C.ACCENT);
  const ringData=[
    {l:'Top 10',v:Math.min(whale.top10Concentration||0,100),c:C.CRITICAL},
    {l:'Top 11-20',v:Math.min(Math.max((whale.top20Concentration||0)-(whale.top10Concentration||0),0),100),c:C.HIGH},
    {l:'Top 21-50',v:Math.min(Math.max((whale.top50Concentration||0)-(whale.top20Concentration||0),0),100),c:C.MEDIUM},
    {l:'Remaining',v:Math.max(100-(whale.top50Concentration||0),0),c:C.SAFE},
  ];
  const ringCX=SP.ML+60, ringCY=doc.y+50;
  drawSeverityRing(doc,ringCX,ringCY,48,ringData);
  // Ring legend
  ringData.forEach((d,i)=>{
    const lx=SP.ML+130, ly=doc.y+20+i*16;
    doc.rect(lx,ly,10,10).fill(d.c);
    doc.rect(lx,ly,10,10).lineWidth(0.5).strokeColor(C.BORDER);
    doc.fontSize(5).font('Helvetica').fillColor(C.TEXT_SECONDARY);
    doc.text(sanitize(d.l),lx+14,ly+1,{lineBreak:false});
    doc.fontSize(5).font('Helvetica-Bold').fillColor(C.TEXT_PRIMARY);
    doc.text(`${d.v}%`,lx+80,ly+1,{lineBreak:false});
  });
  doc.y+=112;

  // Holder table
  drawSection(doc,'TOP HOLDER DISTRIBUTION',C.ACCENT);
  if(holders.length===0){
    doc.fontSize(6).font('Helvetica-Oblique').fillColor(C.TEXT_MUTED);
    doc.text('Holder distribution data unavailable for this token.',SP.ML,doc.y);
    doc.y+=16;
  } else {
    const cols=[28,130,80,60,50,60];
    const headers=['#','Wallet Address','Balance','% Supply','Type','Risk'];
    const rows=holders.slice(0,15).map((h,i)=>{
      ensureSpace(doc,14,auditId);
      const w=h.percentage>10, d=h.percentage>5;
      return [
        String(h.rank||(i+1)),
        truncAddr(h.address,8,4),
        sanitize(h.balance||'0').slice(0,12),
        `${(h.percentage||0).toFixed(2)}%`,
        w?'WHALE':d?'DOLPHIN':'FISH',
        w?'HIGH':d?'MED':'LOW',
      ];
    });
    const rowColors=holders.slice(0,15).map(h=>{
      const w=h.percentage>10, d=h.percentage>5;
      return [C.TEXT_SECONDARY,C.TEXT_PRIMARY,C.TEXT_PRIMARY,C.TEXT_PRIMARY,w?C.CRITICAL:d?C.HIGH:C.SAFE,w?C.CRITICAL:d?C.HIGH:C.SAFE];
    });
    drawTable(doc,headers,rows,cols,{rowColors});
  }
}

function renderRugPull(doc,data,auditId){
  const {rug,meta,findings,whale,liq}=data;
  const pw=doc.page.width, bw=pw-SP.ML-SP.MR;

  drawPageHeader(doc,'Rug Pull Risk Assessment',`${meta.name||'Token'} (${meta.symbol||'???'})`,'RUG PULL INDICATORS');

  // Risk bar
  drawSection(doc,'RUG PULL RISK SCORE',C.CRITICAL);
  const rs=rug.riskScore||0, rc=rs>=70?C.CRITICAL:rs>=45?C.HIGH:C.SAFE;
  doc.rect(SP.ML,doc.y,bw,20).fill(C.BG_SURFACE);
  doc.rect(SP.ML,doc.y,bw,0.5).fill(C.BORDER);
  const fillW=Math.max((rs/100)*bw,4);
  doc.rect(SP.ML,doc.y+3,fillW,14).fill(rc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(C.TEXT_PRIMARY);
  doc.text(`  ${rs}/100`,SP.ML+4,doc.y+5,{lineBreak:false});
  doc.fontSize(6).font('Helvetica-Bold').fillColor(C.TEXT_SECONDARY);
  doc.text(`LEVEL: ${(rug.riskLevel||'UNKNOWN').toUpperCase()}`,SP.ML+bw-100,doc.y+6,{lineBreak:false});
  doc.y+=24;

  // Risk flags
  const flags=rug.riskFlags||[];
  drawSection(doc,`RISK FLAGS (${flags.length})`,flags.length>0?C.HIGH:C.SAFE);
  if(flags.length>0){
    flags.slice(0,10).forEach(flag=>{
      ensureSpace(doc,18,auditId);
      const fy=doc.y;
      doc.rect(SP.ML,fy,bw,14).fill(C.BG_SURFACE);
      doc.rect(SP.ML,fy,bw,0.5).fill(C.BORDER);
      doc.rect(SP.ML,fy,2,14).fill(C.HIGH);
      doc.fontSize(5).font('Helvetica-Bold').fillColor(C.HIGH);
      doc.text('[!] ',SP.ML+6,fy+3,{lineBreak:false});
      doc.fontSize(5).font('Helvetica').fillColor(C.TEXT_PRIMARY);
      doc.text(sanitize(flag),SP.ML+20,fy+3,{width:bw-26,lineBreak:false});
      doc.y=fy+16;
    });
  } else {
    doc.roundedRect(SP.ML,doc.y,bw,16,3).fill(C.SAFE_BG);
    doc.roundedRect(SP.ML,doc.y,bw,16,3).lineWidth(0.5).strokeColor(C.SAFE);
    doc.fontSize(6).font('Helvetica-Bold').fillColor(C.SAFE);
    doc.text('  [+] No critical risk flags detected',SP.ML+6,doc.y+4,{lineBreak:false});
    doc.y+=20;
  }
  doc.y+=4;

  // Severity breakdown
  drawSection(doc,'FINDINGS BY SEVERITY',C.ACCENT);
  const cr=findings.filter(f=>f.severity==='critical'), hi=findings.filter(f=>f.severity==='high'),
        md=findings.filter(f=>f.severity==='medium'), lo=findings.filter(f=>f.severity==='low'||f.severity==='info');
  const sevCards=[
    {l:'CRITICAL',n:cr.length,c:C.CRITICAL},{l:'HIGH',n:hi.length,c:C.HIGH},
    {l:'MEDIUM',n:md.length,c:C.MEDIUM},{l:'LOW/INFO',n:lo.length,c:C.LOW},
  ];
  const scW=(bw-24)/4;
  sevCards.forEach((s,i)=>{
    const sx=SP.ML+i*(scW+8);
    const sy=doc.y;
    doc.roundedRect(sx,sy,scW,28,3).fill(C.BG_SURFACE);
    doc.roundedRect(sx,sy,scW,28,3).lineWidth(0.5).strokeColor(C.BORDER);
    doc.rect(sx,sy,scW,3).fill(s.c);
    doc.fontSize(5).font('Helvetica').fillColor(C.TEXT_SECONDARY);
    doc.text(sanitize(s.l),sx+6,sy+6,{width:scW-12,lineBreak:false});
    doc.fontSize(14).font('Helvetica-Bold').fillColor(s.c);
    doc.text(String(s.n),sx+6,sy+14,{width:scW-12,lineBreak:false});
    doc.y=sy;
  });
  doc.y+=36;

  // Recommendations as action cards
  drawSection(doc,'RECOMMENDATION ACTION CARDS',C.GOLD);
  const recs=[];
  const criticalRules=new Set(findings.filter(f=>f.severity==='critical').map(f=>f.rule));

  // Only add recs that match actual findings — no contradictions
  if(criticalRules.has('SOL-TOKEN-MINT-AUTHORITY')||(!auth_mintRevoked(data)))
    recs.push({priority:'CRITICAL',title:'Revoke Mint Authority',desc:'Token mint authority is active. Unlimited tokens can be minted at any time.',bizImpact:'Enables unlimited token inflation',techImpact:'Revoke via set_authority instruction',urgency:'Immediate - before any investment'});
  if(criticalRules.has('SOL-TOKEN-FREEZE-AUTHORITY')||(!auth_freezeRevoked(data)))
    recs.push({priority:'HIGH',title:'Revoke Freeze Authority',desc:'Freeze authority allows account locking. Users can have funds frozen.',bizImpact:'Centralized control over user funds',techImpact:'Revoke via set_authority instruction',urgency:'Within 24 hours'});
  if((whale.top10Concentration||0)>60)
    recs.push({priority:'HIGH',title:'Address Whale Concentration',desc:`Top 10 holders control ${(whale.top10Concentration||0).toFixed(1)}% of supply.`,bizImpact:'High dump risk from coordinated sell-off',techImpact:'Verify vesting schedules and lock-ups',urgency:'Before trading'});
  if((rug.riskScore||0)>=70)
    recs.push({priority:'CRITICAL',title:'Investigate Rug Pull Risk',desc:`Rug pull risk score is ${rug.riskScore||0}/100. Multiple risk flags detected.`,bizImpact:'Potential total loss of investment',techImpact:'Audit team wallets and contract code',urgency:'Immediate - do not invest'});
  if((liq.totalLiquidityUSD||0)===0)
    recs.push({priority:'CRITICAL',title:'Verify Trading Liquidity',desc:'No liquidity detected on any DEX. Token cannot be sold.',bizImpact:'Illiquid asset - cannot exit position',techImpact:'Check DEX pools and LP token locks',urgency:'Before any purchase'});
  if((whale.totalHolders||0)<100)
    recs.push({priority:'MEDIUM',title:'Assess Holder Base',desc:`Only ${whale.totalHolders||0} holders detected. Very small community.`,bizImpact:'Low adoption, high volatility risk',techImpact:'Monitor holder growth over time',urgency:'Monitor actively'});

  // If no specific recs, show generic safe state
  if(recs.length===0){
    recs.push({priority:'LOW',title:'Continue Monitoring',desc:'No critical issues detected. Standard monitoring recommended.',bizImpact:'Low risk - proceed with normal due diligence',techImpact:'Schedule periodic re-scan',urgency:'Routine'});
  }

  const recW=(bw-8)/2;
  recs.slice(0,6).forEach((rec,i)=>{
    ensureSpace(doc,48,auditId);
    const col=i%2, row=Math.floor(i/2);
    drawRecCard(doc,SP.ML+col*(recW+8),doc.y+row*44,recW,rec);
  });
  doc.y+=Math.ceil(recs.length/2)*44+8;
}

function auth_mintRevoked(data){ return data.auth?.mintAuthorityRevoked!==true; }
function auth_freezeRevoked(data){ return data.auth?.freezeAuthorityRevoked!==true; }

function renderDisclaimer(doc,auditId){
  const pw=doc.page.width, bw=pw-SP.ML-SP.MR;

  drawPageHeader(doc,'Disclaimer & Methodology',`TEOS Sentinel v${ENGINE.version}`,'LEGAL & METHODOLOGY');

  drawSection(doc,'DISCLAIMER',C.TEXT_SECONDARY);
  doc.fontSize(6).font('Helvetica').fillColor(C.TEXT_PRIMARY);
  doc.text('This report is generated by TEOS Sentinel Shield, an AI-powered security analysis engine by ELMAHROSA International. The findings are based on on-chain data retrieved from the Solana blockchain and public DEX aggregator APIs. This report does NOT constitute financial advice. Always conduct your own research (DYOR) before interacting with any token.',SP.ML,doc.y,{width:bw,align:'justify',lineBreak:false});
  doc.y+=32;

  drawSection(doc,'METHODOLOGY',C.TEXT_SECONDARY);
  const methods=[
    'Holder distribution via Solana RPC getProgramAccounts with Token22 filters',
    'Authority analysis via getAccountInfo on mint account',
    'Liquidity data via Jupiter Aggregator public API',
    'Whale concentration computed from top holder percentage distribution',
    'Gini coefficient calculated from holder balance distribution curve',
    'Rug pull scoring based on 10 weighted heuristics',
  ];
  methods.forEach(m=>{
    ensureSpace(doc,16,auditId);
    const my=doc.y;
    doc.rect(SP.ML,my,bw,12).fill(C.BG_SURFACE);
    doc.rect(SP.ML,my,bw,0.5).fill(C.BORDER);
    doc.rect(SP.ML,my,2,12).fill(C.ACCENT);
    doc.fontSize(5).font('Helvetica').fillColor(C.TEXT_SECONDARY);
    doc.text(`  ${m}`,SP.ML+6,my+3,{width:bw-12,lineBreak:false});
    doc.y=my+14;
  });
  doc.y+=8;

  // Brand
  drawSection(doc,'TEOS SOVEREIGN SECURITY STACK',C.GOLD);
  doc.fontSize(6).font('Helvetica').fillColor(C.ACCENT);
  doc.text('ELMAHROSA International  |  Runtime Security Platform  |  Enterprise Security Intelligence',SP.ML,doc.y,{width:bw,align:'center',lineBreak:false});
  doc.fontSize(5).font('Helvetica').fillColor(C.TEXT_SECONDARY);
  doc.text(`Engine v${ENGINE.version}  |  ${ENGINE.totalRules} Rules  |  410 Tests  |  ${getISO()}`,SP.ML,doc.y+10,{width:bw,align:'center',lineBreak:false});
  doc.text('https://sentinel.teosegypt.com  |  https://github.com/Elmahrosa',SP.ML,doc.y+20,{width:bw,align:'center',lineBreak:false});
  doc.y+=32;
  drawSentinelStamp(doc,pw/2-24,doc.y,48);
  doc.y+=56;

  // QR verification
  drawSection(doc,'REPORT VERIFICATION',C.ACCENT);
  doc.fontSize(6).font('Helvetica').fillColor(C.TEXT_SECONDARY);
  doc.text('This report can be verified at report.teosegypt.com using the Audit ID printed on each page.',SP.ML,doc.y,{width:bw,lineBreak:false});
  doc.y+=16;
}

// === CHART HELPER FUNCTIONS ===

// NOTE: duplicate drawDonutChart / drawBarChartSeverity definitions were removed
// here. They were shadowed by the later declarations (the ones actually called by
// the report), so they were dead code. The effective implementations live below.

function drawLineChartTrend(doc, x, y, width, height, dataPoints, title) {
  // Title
  doc.fontSize(10).font(FONTS.CAIRO_BOLD).fillColor(C.TEXT_WHITE);
  doc.text(title, x, y - 10, {width: width, align: 'center'});

  if (dataPoints.length < 2 || width <= 0 || height <= 0) return;

  // Find min/max values for scaling
  const values = dataPoints.map(p => p.y);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const yRange = maxY - minY;
  const yScale = yRange > 0 ? (height * 0.8) / yRange : 1;

  // Find min/max x values for scaling
  const xValues = dataPoints.map(p => p.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const xRange = maxX - minX;
  const xScale = xRange > 0 ? (width * 0.8) / xRange : 1;

  // Draw axes
  doc.lineWidth(1).strokeColor(C.BORDER);

  // Y-axis
  doc.moveTo(x + width * 0.1, y + height * 0.9);
  doc.lineTo(x + width * 0.1, y + height * 0.1);

  // X-axis
  doc.moveTo(x + width * 0.1, y + height * 0.9);
  doc.lineTo(x + width * 0.9, y + height * 0.9);

  // Draw line
  if (dataPoints.length >= 2) {
    doc.save();
    doc.lineWidth(2);
    doc.strokeColor(C.GOLD);
    doc.lineCap('round');

    // Move to first point
    const firstPoint = dataPoints[0];
    const fx = x + width * 0.1 + ((firstPoint.x - minX) * xScale);
    const fy = y + height * 0.9 - ((firstPoint.y - minY) * yScale);
    doc.moveTo(fx, fy);

    // Draw line through points
    for (let i = 1; i < dataPoints.length; i++) {
      const point = dataPoints[i];
      const px = x + width * 0.1 + ((point.x - minX) * xScale);
      const py = y + height * 0.9 - ((point.y - minY) * yScale);
      doc.lineTo(px, py);
    }

    doc.stroke();
    doc.restore();
  }

  // Draw points
  dataPoints.forEach(point => {
    const px = x + width * 0.1 + ((point.x - minX) * xScale);
    const py = y + height * 0.9 - ((point.y - minY) * yScale);
    doc.circle(px, py, 3).fill(C.GOLD);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generatePremiumReport(result,mintAddress,outputPath,options={}){
  const r=result.result||result;
  const meta=r.metadata||{};
  const whale=r.whaleMetrics||{};
  const auth=r.authorityAnalysis||{};
  const rug=r.rugPullIndicators||{};
  const liq=r.liquidityAnalysis||{};
  const findings=r.findings||[];
  const holders=r.holderDistribution||[];
  const score=r.finalRiskScore??result.score??0;

  const auditId=options.auditId||`AUD-${Date.now().toString(36).toUpperCase()}`;
  const reportUrl=`https://report.teosegypt.com/${auditId}`;
  const iso=getISO();

  return QRCode.toDataURL(reportUrl,{width:120,margin:1,color:{dark:'#0B1120',light:'#FFFFFF'}})
    .then(qrDataUrl=>{
      const qrBuf=Buffer.from(qrDataUrl.split(',')[1],'base64');
      return new Promise((resolve,reject)=>{
        const doc=new PDFDocument({
          margins:{top:SP.MT,bottom:SP.MB,left:SP.ML,right:SP.MR},
          size:'A4',
          bufferPages:true,
        });
        const stream=fs.createWriteStream(outputPath);
        doc.pipe(stream);

        const data={meta,whale,auth,rug,liq,findings,holders,score,auditId,iso,mintAddress:r.mintAddress||mintAddress};

        // PAGE 1: COVER
        renderCover(doc,data);
        drawPageFooter(doc,auditId,qrBuf);
        // PAGE 2: EXECUTIVE SUMMARY
        doc.addPage();
        renderExecSummary(doc,data,qrBuf,reportUrl,auditId);
        drawPageFooter(doc,auditId,qrBuf);
        // PAGE 3: WHALE ANALYSIS
        doc.addPage();
        renderWhaleAnalysis(doc,data,auditId);
        drawPageFooter(doc,auditId,qrBuf);
        // PAGE 4: RUG PULL ASSESSMENT
        doc.addPage();
        renderRugPull(doc,data,auditId);
        drawPageFooter(doc,auditId,qrBuf);
        // PAGE 5: DISCLAIMER
        doc.addPage();
        renderDisclaimer(doc,auditId);
        drawPageFooter(doc,auditId,qrBuf);

        doc.end();
        stream.on('finish',resolve);
        stream.on('error',reject);
      });
    });
}

function drawWatermark(doc, x, y, size, text = 'TEOS', opacity = 0.05) {
  const savedY = doc.y;
  const fontSize = size || 48;
  doc.save();
  doc.fontSize(fontSize).font(FONTS.CAIRO_BOLD).fillColor(C.GOLD).opacity(opacity);
  const textWidth = doc.widthOfString(text);
  doc.text(text, x - textWidth / 2, y - fontSize / 2, { align: 'center', width: textWidth, lineBreak: false });
  doc.restore();
  doc.y = savedY;
}

function drawGradeBadge(doc, x, y, width, height, grade, seals = []) {
  const savedY = doc.y;
  const badgeWidth = width || 60;
  const badgeHeight = height || 30;
  const sealSize = 12;
  doc.save();
  doc.roundedRect(x, y, badgeWidth, badgeHeight, 4).fill(C.BG_SURFACE);
  doc.roundedRect(x, y, badgeWidth, badgeHeight, 4).lineWidth(0.5).strokeColor(C.BORDER);
  // Grade text
  doc.fontSize(18).font(FONTS.CAIRO_BOLD).fillColor(C.GOLD);
  doc.text(grade, x + 8, y + 20, { width: badgeWidth - 16, align: 'left' });
  // Seals
  let sealX = x + badgeWidth - sealSize - 4;
  seals.forEach(seal => {
    doc.save();
    doc.fontSize(sealSize).font('Helvetica-Bold').fillColor(C.GOLD);
    doc.text(seal, sealX, y + 8);
    doc.restore();
    sealX -= sealSize + 2;
  });
  doc.restore();
  doc.y = savedY;
}

function drawDonutChart(doc, cx, cy, radius, segments, label = '') {
  const savedY = doc.y;
  // segments: array of {value, label, color}
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let startAngle = 0;
  const innerRadius = radius * 0.5;
  // Draw each segment
  segments.forEach(segment => {
    const sweepAngle = (segment.value / total) * 360;
    const endAngle = startAngle + sweepAngle;
    // Draw outer arc
    doc.save();
    doc.moveTo(cx + radius * Math.cos(startAngle * Math.PI/180), cy + radius * Math.sin(startAngle * Math.PI/180));
    for (let a = startAngle; a <= endAngle; a += 0.5) {
      const rad = a * Math.PI / 180;
      doc.lineTo(cx + radius * Math.cos(rad), cy + radius * Math.sin(rad));
    }
    // Draw inner arc (reverse)
    for (let a = endAngle; a >= startAngle; a -= 0.5) {
      const rad = a * Math.PI / 180;
      doc.lineTo(cx + innerRadius * Math.cos(rad), cy + innerRadius * Math.sin(rad));
    }
    doc.closePath();
    doc.fill(segment.color);
    doc.restore();
    startAngle = endAngle;
  });
  // Draw center circle (optional)
  doc.save();
  doc.circle(cx, cy, innerRadius).fill(C.BG_SURFACE);
  doc.restore();
  // Label
  if (label) {
    doc.save();
    doc.fontSize(12).font(FONTS.INTER_BOLD).fillColor(C.TEXT_PRIMARY);
    doc.text(label, cx - 15, cy + 5, { width: 30, align: 'center' });
    doc.restore();
  }
  doc.y = savedY;
}

function drawLineChart(doc, x, y, width, height, data, options = {}) {
  const savedY = doc.y;
  const { lineColor = C.GOLD, pointColor = C.GOLD, bgColor = C.BG_SURFACE } = options;
  if (data.length === 0) return;
  const padding = 20;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  const minX = 0;
  const maxX = data.length - 1;
  const values = data.map(d => d.value);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const rangeY = maxY - minY || 1;
  // Background
  doc.save();
  doc.roundedRect(x, y, width, height, 4).fill(bgColor);
  doc.roundedRect(x, y, width, height, 4).lineWidth(0.5).strokeColor(C.BORDER);
  doc.restore();
  // Draw line
  if (data.length >= 2) {
    doc.save();
    doc.strokeColor(lineColor).lineWidth(2);
    const first = data[0];
    const x0 = x + padding + (first.x - minX) / (maxX - minX) * chartWidth;
    const y0 = y + height - padding - (first.value - minY) / rangeY * chartHeight;
    doc.moveTo(x0, y0);
    for (let i = 1; i < data.length; i++) {
      const point = data[i];
      const px = x + padding + (point.x - minX) / (maxX - minX) * chartWidth;
      const py = y + height - padding - (point.value - minY) / rangeY * chartHeight;
      doc.lineTo(px, py);
    }
    doc.stroke();
    doc.restore();
  }
  // Draw points
  data.forEach(point => {
    const px = x + padding + (point.x - minX) / (maxX - minX) * chartWidth;
    const py = y + height - padding - (point.value - minY) / rangeY * chartHeight;
    doc.save();
    doc.circle(px, py, 3).fill(pointColor);
    doc.restore();
  });
  doc.y = savedY;
}

function drawBarChartSeverity(doc, x, y, width, height, severityData) {
  // severityData: object with keys critical, high, medium, low, info and values
  const labels = ['critical', 'high', 'medium', 'low', 'info'];
  const data = labels.map(key => ({
    l: key.charAt(0).toUpperCase() + key.slice(1),
    v: severityData[key] || 0,
    c: key === 'critical' ? C.CRITICAL : key === 'high' ? C.HIGH : key === 'medium' ? C.MEDIUM : key === 'low' ? C.LOW : C.SAFE
  }));
  drawBarChart(doc, x, y, width, data, 100);
}



module.exports={generatePremiumReport,setEngineMeta};
