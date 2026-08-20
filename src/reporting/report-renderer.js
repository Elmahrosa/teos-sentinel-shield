const { getSeverityColor, getSeverityIcon, SEVERITY_ORDER } = require('./report-model');
const { getConfidenceBadge } = require('./confidence');
const { RETRIEVAL_DESCRIPTIONS } = require('./data-integrity');

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cssVars() {
  return `<style>
:root {
  --bg-primary: #09090B;
  --bg-card: #111113;
  --bg-card-hover: #18181B;
  --border: #232326;
  --border-subtle: #18181B;
  --text-primary: #FFFFFF;
  --text-secondary: #D4D4D8;
  --text-tertiary: #A1A1AA;
  --text-muted: #52525B;
  --accent: #F5C542;
  --accent-dim: rgba(245,197,66,0.08);
  --critical: #EF4444;
  --high: #F97316;
  --medium: #EAB308;
  --low: #22C55E;
  --info: #3B82F6;
  --font: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Consolas', 'SF Mono', monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: A4; margin: 0; }
body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 10px;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page {
  width: 210mm;
  min-height: 297mm;
  padding: 0;
  position: relative;
  page-break-after: always;
  overflow: hidden;
}
.page-content {
  padding: 40px 48px;
  min-height: 250mm;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.section-header .num {
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  font-family: var(--font-mono);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(245,197,66,0.3);
  border-radius: 6px;
}
.section-header h2 {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}
.score-display {
  text-align: center;
  padding: 32px 0;
}
.score-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  font-size: 36px;
  font-weight: 800;
  font-family: var(--font-mono);
  margin-bottom: 12px;
  border-width: 4px;
  border-style: solid;
}
.verdict-label {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.confidence-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-top: 8px;
}
.confidence-bar .bar-track {
  width: 120px;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.confidence-bar .bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.confidence-bar .label {
  font-size: 9px;
  color: var(--text-tertiary);
  font-weight: 500;
}
.meta-line {
  font-size: 9px;
  color: var(--text-muted);
  text-align: center;
  margin-top: 16px;
  word-break: break-all;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.cards-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}
.card-full {
  grid-column: 1 / -1;
}
.card .card-label {
  font-size: 7px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.card .card-value {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}
.card .card-sub {
  font-size: 8px;
  color: var(--text-tertiary);
  margin-top: 2px;
}
.card .card-status {
  font-size: 8px;
  color: var(--text-muted);
  margin-top: 4px;
  font-family: var(--font-mono);
}
.findings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}
.finding-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  border-left-width: 3px;
  border-left-style: solid;
}
.finding-item .f-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.finding-item .f-id {
  font-family: var(--font-mono);
  font-size: 8px;
  color: var(--text-muted);
  font-weight: 600;
}
.finding-item .f-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-primary);
}
.finding-item .f-reasons {
  font-size: 8px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.finding-item .f-score {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  margin-left: auto;
}
.empty-state {
  background: var(--bg-card);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 32px;
  text-align: center;
}
.empty-state .empty-icon {
  font-size: 24px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.empty-state .empty-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.empty-state .empty-reason {
  font-size: 8px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.empty-state .empty-status {
  display: inline-block;
  font-size: 7px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 3px 10px;
  border-radius: 8px;
  background: var(--accent-dim);
  color: var(--accent);
  font-family: var(--font-mono);
}
.data-source-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}
.info-card .ic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.info-card .ic-name {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.info-card .ic-status {
  font-size: 7px;
  font-family: var(--font-mono);
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.info-card .ic-status.verified { color: var(--low); border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.06); }
.info-card .ic-status.not-found { color: var(--text-muted); border-color: var(--border); background: transparent; }
.info-card .ic-status.unavailable { color: var(--critical); border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.06); }
.info-card .ic-status.unknown { color: var(--medium); border-color: rgba(234,179,8,0.3); background: rgba(234,179,8,0.06); }
.info-card .ic-summary {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.info-card .ic-detail {
  font-size: 8px;
  color: var(--text-muted);
}
.info-card .ic-confidence {
  font-size: 8px;
  color: var(--text-tertiary);
  margin-top: 6px;
  font-family: var(--font-mono);
}
.info-card .ic-source {
  font-size: 7px;
  color: var(--text-muted);
  margin-top: 2px;
  word-break: break-all;
}
.card-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.card-row .stat-card {
  flex: 1;
  min-width: 80px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}
.card-row .stat-card .stat-value {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-mono);
}
.card-row .stat-card .stat-label {
  font-size: 7px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-top: 2px;
}
.badge {
  display: inline-block;
  font-size: 8px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--font-mono);
}
.badge-critical { background: rgba(239,68,68,0.12); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }
.badge-high { background: rgba(249,115,22,0.12); color: #F97316; border: 1px solid rgba(249,115,22,0.2); }
.badge-medium { background: rgba(234,179,8,0.12); color: #EAB308; border: 1px solid rgba(234,179,8,0.2); }
.badge-low { background: rgba(34,197,94,0.1); color: #22C55E; border: 1px solid rgba(34,197,94,0.2); }
.badge-info { background: rgba(59,130,246,0.1); color: #3B82F6; border: 1px solid rgba(59,130,246,0.2); }
.footer-bar {
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  padding: 16px 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 7px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}
.footer-bar .footer-left { display: flex; gap: 16px; align-items: center; }
.footer-bar .footer-right { display: flex; gap: 16px; align-items: center; }
.footer-bar .brand { color: var(--accent); font-weight: 700; }
.verdict-banner {
  padding: 12px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 10px;
  line-height: 1.6;
  font-weight: 500;
}
.verdict-banner.warning {
  background: rgba(234,179,8,0.08);
  border: 1px solid rgba(234,179,8,0.2);
  color: var(--medium);
}
@media print {
  .page { page-break-after: always; }
}
</style>`;
}

function renderCoverPage(report) {
  const score = report.securityScore;
  const scoreColor = score >= 85 ? '#EF4444' : score >= 60 ? '#EAB308' : score >= 1 ? '#F97316' : '#22C55E';
  const scoreLetter = score >= 95 ? 'A+' : score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  const conf = getConfidenceBadge(report.dataConfidenceLevel);
  const missingCount = report.missingDataSources ? report.missingDataSources.length : 0;

  return `<div class="page" style="display:flex;flex-direction:column;background:linear-gradient(160deg,#09090B 0%,#0C0C0F 40%,#111113 100%);">
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 48px;">
      <div style="margin-bottom:24px;">
        <svg viewBox="0 0 80 80" width="64" height="64" fill="none">
          <path d="M40 4L72 18V38C72 56.8 58 74 40 78C22 74 8 56.8 8 38V18L40 4Z" stroke="#F5C542" stroke-width="2" opacity="0.8"/>
          <path d="M40 10L64 20V36C64 50.4 53 63.6 40 66.8C27 63.6 16 50.4 16 36V20L40 10Z" stroke="#F5C542" stroke-width="1.5" opacity="0.4"/>
          <path d="M32 38L38 44L48 32" stroke="#F5C542" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
        </svg>
      </div>
      <div style="text-align:center;">
        <div class="score-circle" style="border-color:${scoreColor};color:${scoreColor};">
          ${score}
        </div>
        <div class="verdict-label" style="color:${scoreColor};">${report.verdict}</div>
        <div class="confidence-bar">
          <span class="label">Data Confidence</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${report.dataConfidence}%;background:${conf.color};"></div>
          </div>
          <span class="label" style="color:${conf.color};">${report.dataConfidence}%</span>
        </div>
        ${report.tokenName ? `<div style="margin-top:16px;font-size:13px;font-weight:600;color:var(--text-primary);">${escapeHtml(report.tokenName)}</div>` : ''}
        ${report.mintAddress ? `<div class="meta-line">${escapeHtml(report.mintAddress)}</div>` : ''}
        ${missingCount > 0 ? `<div style="margin-top:12px;font-size:8px;color:var(--text-muted);">${missingCount} data source(s) unavailable</div>` : ''}
      </div>
    </div>
    <div class="footer-bar">
      <div class="footer-left">
        <span class="brand">TEOS</span>
        <span>v${escapeHtml(report.engineVersion)}</span>
        <span>Page 1/4</span>
      </div>
      <div class="footer-right">
        <span>${escapeHtml(report.auditId || '')}</span>
        <span>${new Date(report.timestamp).toISOString().slice(0,10)}</span>
      </div>
    </div>
  </div>`;
}

function renderFindingsBar(report) {
  const summary = report.findingsSummary || {};
  const total = summary.total || 0;

  return `<div class="page-content">
    <div class="section-header">
      <span class="num">01</span>
      <h2>Key Findings</h2>
    </div>
    <div class="cards-grid" style="margin-bottom:20px;">
      <div class="card">
        <div class="card-label">Security Score</div>
        <div class="card-value" style="color:${report.securityScore >= 85 ? '#EF4444' : report.securityScore >= 60 ? '#EAB308' : '#22C55E'}">${report.securityScore}/100</div>
        <div class="card-sub">${report.verdict}</div>
      </div>
      <div class="card">
        <div class="card-label">Data Confidence</div>
        <div class="card-value" style="color:${getConfidenceBadge(report.dataConfidenceLevel).color}">${report.dataConfidence}%</div>
        <div class="card-sub">${report.dataConfidenceLevel}</div>
      </div>
      <div class="card">
        <div class="card-label">Total Findings</div>
        <div class="card-value">${total}</div>
        <div class="card-sub">security rules evaluated</div>
      </div>
    </div>

    ${report.verdictMessage ? `<div class="verdict-banner warning">${escapeHtml(report.verdictMessage)}</div>` : ''}

    <div class="card-row" style="margin-bottom:20px;">
      ${SEVERITY_ORDER.filter(s => summary[s] > 0 || s === 'critical' || s === 'high' || s === 'medium' || s === 'low').map(s => `
      <div class="stat-card">
        <div class="stat-value" style="color:${getSeverityColor(s)}">${summary[s] || 0}</div>
        <div class="stat-label">${s.charAt(0).toUpperCase() + s.slice(1)}</div>
      </div>`).join('')}
    </div>

    <div class="findings-list">
      ${report.findings && report.findings.length > 0 ? report.findings.map(f => `
      <div class="finding-item" style="border-left-color:${getSeverityColor(f.severity)}">
        <div class="f-header">
          <span class="badge badge-${f.severity}">${f.severity}</span>
          <span class="f-name">${escapeHtml(f.name)}</span>
          <span class="f-score" style="color:${getSeverityColor(f.severity)}">${f.score}</span>
        </div>
        <div class="f-id">${escapeHtml(f.ruleId)}</div>
        ${f.reasons && f.reasons.length > 0 ? `<div class="f-reasons">${escapeHtml(f.reasons.join('; '))}</div>` : ''}
      </div>`).join('') : `
      <div class="card card-full" style="text-align:center;padding:24px;">
        <div style="font-size:11px;color:var(--text-tertiary);">No security findings detected</div>
      </div>`}
    </div>
  </div>`;
}

function renderTechnicalAnalysis(report) {
  const sources = report.dataSources || {};
  const sourceKeys = [
    { key: 'authorities', label: 'Authorities' },
    { key: 'liquidity', label: 'Liquidity' },
    { key: 'holders', label: 'Holder Distribution' },
    { key: 'ownership', label: 'Ownership' },
    { key: 'metadata', label: 'Token Metadata' },
    { key: 'dexData', label: 'DEX Listings' },
    { key: 'marketData', label: 'Market Data' },
  ];

  function renderStatusClass(status) {
    switch (status) {
      case 'VERIFIED': return 'verified';
      case 'NOT_FOUND': return 'not-found';
      case 'API_UNAVAILABLE': return 'unavailable';
      case 'RATE_LIMITED': return 'unavailable';
      default: return 'unknown';
    }
  }

  function renderStatusLabel(status) {
    switch (status) {
      case 'VERIFIED': return 'Verified';
      case 'NOT_FOUND': return 'No Data';
      case 'API_UNAVAILABLE': return 'Unavailable';
      case 'RATE_LIMITED': return 'Rate Limited';
      default: return 'Unknown';
    }
  }

  function renderFieldIcon(status) {
    switch (status) {
      case 'VERIFIED': return '\u2713';
      case 'NOT_FOUND': return '\u2014';
      case 'API_UNAVAILABLE': return '\u2717';
      case 'RATE_LIMITED': return '\u26A0';
      default: return '?';
    }
  }

  function renderEmptyState(field, status) {
    const desc = RETRIEVAL_DESCRIPTIONS[status] || 'No information could be retrieved';
    return `<div class="empty-state">
      <div class="empty-icon">${renderFieldIcon(status)}</div>
      <div class="empty-title">${escapeHtml(field)}</div>
      <div class="empty-reason">${desc}</div>
      <div class="empty-status">${renderStatusLabel(status)}</div>
    </div>`;
  }

  return `<div class="page">
    <div class="page-content">
      <div class="section-header">
        <span class="num">02</span>
        <h2>Technical Analysis</h2>
      </div>
      <div class="data-source-grid">
        ${sourceKeys.map(({key, label}) => {
          const field = sources[key];
          if (!field) {
            return `<div class="info-card">
              <div class="ic-header">
                <span class="ic-name">${escapeHtml(label)}</span>
                <span class="ic-status unknown">Unknown</span>
              </div>
              <div class="empty-state" style="border:none;padding:16px;background:transparent;">
                <div class="empty-icon">?</div>
                <div class="empty-title">${escapeHtml(label)}</div>
                <div class="empty-reason">No data available</div>
              </div>
            </div>`;
          }
          if (field.status !== 'VERIFIED') {
            return `<div class="info-card">
              <div class="ic-header">
                <span class="ic-name">${escapeHtml(label)}</span>
                <span class="ic-status ${renderStatusClass(field.status)}">${renderStatusLabel(field.status)}</span>
              </div>
              ${renderEmptyState(label, field.status)}
            </div>`;
          }
          return `<div class="info-card">
            <div class="ic-header">
              <span class="ic-name">${escapeHtml(label)}</span>
              <span class="ic-status verified">Verified</span>
            </div>
            <div class="ic-summary">${escapeHtml(String(field.value ?? 'Data available'))}</div>
            <div class="ic-detail">Source: ${escapeHtml(field.source)}</div>
            <div class="ic-confidence">Confidence: ${Math.round(field.confidence * 100)}%</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="footer-bar">
      <div class="footer-left">
        <span class="brand">TEOS</span>
        <span>v${escapeHtml(report.engineVersion)}</span>
        <span>Page 2/4</span>
      </div>
      <div class="footer-right">
        <span>${escapeHtml(report.auditId || '')}</span>
        <span>${new Date(report.timestamp).toISOString().slice(0,10)}</span>
      </div>
    </div>
  </div>`;
}

function renderDetailedFindings(report) {
  const grouped = {};
  for (const f of (report.findings || [])) {
    if (!grouped[f.severity]) grouped[f.severity] = [];
    grouped[f.severity].push(f);
  }

  const severityOrder = ['critical', 'high', 'medium', 'low', 'informational'];

  return `<div class="page">
    <div class="page-content">
      <div class="section-header">
        <span class="num">03</span>
        <h2>Detailed Findings</h2>
      </div>
      ${severityOrder.filter(s => grouped[s] && grouped[s].length > 0).map(sev => `
      <div style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span class="badge badge-${sev}">${sev.toUpperCase()}</span>
          <span style="font-size:9px;color:var(--text-muted);font-family:var(--font-mono);">${grouped[sev].length} finding(s)</span>
        </div>
        ${grouped[sev].map(f => `
        <div class="finding-item" style="border-left-color:${getSeverityColor(f.severity)};margin-bottom:8px;">
          <div class="f-header">
            <span class="f-id">${escapeHtml(f.ruleId)}</span>
            <span class="f-name">${escapeHtml(f.name)}</span>
            <span class="f-score" style="color:${getSeverityColor(f.severity)}">${f.score}</span>
          </div>
          ${f.reasons && f.reasons.length > 0 ? `<div class="f-reasons">${escapeHtml(f.reasons.join('; '))}</div>` : ''}
          ${f.matchedPattern ? `<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-muted);margin-top:4px;word-break:break-all;background:var(--bg-primary);padding:6px 8px;border-radius:4px;border:1px solid var(--border);">${escapeHtml(f.matchedPattern)}</div>` : ''}
          ${f.recommendation ? `<div style="font-size:8px;color:var(--accent);margin-top:4px;">${escapeHtml(f.recommendation)}</div>` : ''}
        </div>`).join('')}
      </div>`).join('')}
      ${report.findings && report.findings.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">\u2713</div>
        <div class="empty-title">No Findings</div>
        <div class="empty-reason">No security issues detected by deterministic rules</div>
      </div>` : ''}
    </div>
    <div class="footer-bar">
      <div class="footer-left">
        <span class="brand">TEOS</span>
        <span>v${escapeHtml(report.engineVersion)}</span>
        <span>Page 3/4</span>
      </div>
      <div class="footer-right">
        <span>${escapeHtml(report.auditId || '')}</span>
        <span>${new Date(report.timestamp).toISOString().slice(0,10)}</span>
      </div>
    </div>
  </div>`;
}

function renderAppendix(report) {
  return `<div class="page" style="display:flex;flex-direction:column;justify-content:space-between;">
    <div class="page-content">
      <div class="section-header">
        <span class="num">04</span>
        <h2>Report Metadata</h2>
      </div>
      <div class="cards-grid-2">
        <div class="card">
          <div class="card-label">Audit ID</div>
          <div class="card-sub" style="font-family:var(--font-mono);font-size:9px;word-break:break-all;">${escapeHtml(report.auditId || 'N/A')}</div>
        </div>
        <div class="card">
          <div class="card-label">Timestamp</div>
          <div class="card-sub" style="font-size:9px;">${new Date(report.timestamp).toISOString()}</div>
        </div>
        <div class="card">
          <div class="card-label">Engine Version</div>
          <div class="card-sub" style="font-size:9px;">${escapeHtml(report.engineVersion)}</div>
        </div>
        <div class="card">
          <div class="card-label">Rule Pack</div>
          <div class="card-sub" style="font-size:9px;">${escapeHtml(report.rulePackVersion)}</div>
        </div>
        <div class="card">
          <div class="card-label">Policy Version</div>
          <div class="card-sub" style="font-size:9px;">${escapeHtml(report.policyVersion)}</div>
        </div>
        <div class="card">
          <div class="card-label">Engine</div>
          <div class="card-sub" style="font-size:9px;">${escapeHtml(report.engine)}</div>
        </div>
      </div>
      ${report.verdictValidation && !report.verdictValidation.valid ? `
      <div class="card card-full" style="margin-top:16px;">
        <div class="card-label">Verdict Consistency Check</div>
        <div style="font-size:9px;color:var(--medium);">${report.verdictValidation.warnings.length} warning(s)</div>
        ${report.verdictValidation.messages.map(m => `<div style="font-size:8px;color:var(--text-secondary);margin-top:4px;">\u2022 ${escapeHtml(m)}</div>`).join('')}
      </div>` : `
      <div class="card card-full" style="margin-top:16px;">
        <div class="card-label">Verdict Consistency</div>
        <div style="font-size:9px;color:var(--low);">\u2713 Consistent</div>
      </div>`}
    </div>
    <div class="footer-bar">
      <div class="footer-left">
        <span class="brand">TEOS</span>
        <span>v${escapeHtml(report.engineVersion)}</span>
        <span>Page 4/4</span>
      </div>
      <div class="footer-right">
        <span>${escapeHtml(report.auditId || '')}</span>
        <span>${new Date(report.timestamp).toISOString().slice(0,10)}</span>
        <span>SHA256:${escapeHtml((report.auditId || '').slice(0,12))}</span>
      </div>
    </div>
  </div>`;
}

function renderHtmlReport(report) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TEOS Security Report — ${escapeHtml(report.auditId || 'N/A')}</title>
${cssVars()}
</head>
<body>
  ${renderCoverPage(report)}
  <div class="page">
    ${renderFindingsBar(report)}
    <div class="footer-bar">
      <div class="footer-left">
        <span class="brand">TEOS</span>
        <span>v${escapeHtml(report.engineVersion)}</span>
        <span>Page 2/4</span>
      </div>
      <div class="footer-right">
        <span>${escapeHtml(report.auditId || '')}</span>
        <span>${new Date(report.timestamp).toISOString().slice(0,10)}</span>
      </div>
    </div>
  </div>
  ${renderTechnicalAnalysis(report)}
  ${renderDetailedFindings(report)}
  ${renderAppendix(report)}
</body>
</html>`;
}

function renderJsonReport(report) {
  const result = {
    securityScore: report.securityScore,
    verdict: report.verdict,
    dataConfidence: {
      percentage: report.dataConfidence,
      level: report.dataConfidenceLevel,
      missingSources: report.missingDataSources,
    },
    findingsSummary: report.findingsSummary,
    findings: report.findings.map(f => ({
      ruleId: f.ruleId,
      name: f.name,
      severity: f.severity,
      score: f.score,
      reasons: f.reasons,
      matchedPattern: f.matchedPattern,
    })),
    dataSources: {},
    verdictConsistency: report.verdictValidation ? {
      valid: report.verdictValidation.valid,
      warnings: report.verdictValidation.warnings,
      message: report.verdictMessage,
    } : { valid: true, warnings: [], message: null },
    metadata: {
      auditId: report.auditId,
      timestamp: report.timestamp,
      engineVersion: report.engineVersion,
      rulePackVersion: report.rulePackVersion,
      policyVersion: report.policyVersion,
      engine: report.engine,
    },
  };

  if (report.tokenName) result.tokenName = report.tokenName;
  if (report.mintAddress) result.mintAddress = report.mintAddress;

  for (const [key, field] of Object.entries(report.dataSources || {})) {
    result.dataSources[key] = {
      value: field.value,
      source: field.source,
      timestamp: field.timestamp,
      status: field.status,
      confidence: field.confidence,
    };
  }

  return result;
}

module.exports = { renderHtmlReport, renderJsonReport };
