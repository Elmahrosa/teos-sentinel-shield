// Shared visual theme for the Sentinel PDF report.
//
// Single source of truth for the report chrome: the navy/gold palette plus the
// page header and footer. report.service.js stamps these on every page.
//
// NOTE: every text() call below passes its coordinates positionally. PDFKit does
// NOT honour options.x/options.y for text() (it honours them only for image()),
// so an options-object { x, y } would silently draw at the current cursor.
const COLORS = {
  navy: '#0A1628',
  gold: '#D4AF37',
  critical: '#E53E3E',
  high: '#ED8936',
  medium: '#D69E2E',
  low: '#38A169',
  text: '#1A202C',
  muted: '#718096'
};

function drawHeader(doc, title, meta = '') {
  const w = doc.page.width;
  doc.save();
  // Navy bar + gold underline.
  doc.rect(0, 0, w, 70).fill(COLORS.navy);
  doc.rect(0, 68, w, 2).fill(COLORS.gold);

  doc.fillColor(COLORS.gold).fontSize(10).font('Helvetica-Bold')
     .text('SENTINEL SECURITY', 50, 20, { lineBreak: false });
  doc.fillColor('white').fontSize(12)
     .text(String(title || '').toUpperCase(), 50, 38, { width: 360, lineBreak: false });
  if (meta) {
    doc.fillColor(COLORS.muted).fontSize(8)
       .text(String(meta), w - 210, 40, { width: 160, align: 'right', lineBreak: false });
  }
  doc.restore();
}

function drawFooter(doc, reportId) {
  const w = doc.page.width;
  const h = doc.page.height;
  doc.save();
  doc.rect(0, h - 40, w, 40).fill(COLORS.navy);
  doc.rect(0, h - 40, w, 2).fill(COLORS.gold);

  doc.fillColor(COLORS.muted).fontSize(8).font('Helvetica')
     .text(`Report ID: ${reportId || 'TEOS-SENTINEL'}`, 50, h - 26, { lineBreak: false });
  doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
     .text('SENTINEL SECURITY', w - 210, h - 26, { width: 160, align: 'right', lineBreak: false });
  doc.restore();
}

module.exports = { COLORS, drawHeader, drawFooter };
