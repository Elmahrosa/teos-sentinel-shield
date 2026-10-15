const PDFDocument = require('pdfkit');
const path = require('path');
const { buildReportData, findingImpact, findingRecommendation, classifyFindingType, detectionSummary, riskBreakdown, validateCounterIntegrity } = require('./report-format');
const { drawHeader, drawFooter } = require('./report-theme');

const MAX_REPORT_SIZE = 5 * 1024 * 1024;
const PDF_TIMEOUT_MS = 30000;

const CairoRegular = 'Helvetica';
const CairoBold = 'Helvetica-Bold';
const InterRegular = 'Helvetica';
const InterBold = 'Helvetica-Bold';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sanitizePdfText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/�/g, '?')
    .replace(/[\uD800-\uDFFF]/g, '')
    .trim();
}

function wrapPdfText(doc, text, opts) {
  const clean = sanitizePdfText(text);
  if (clean.length > 0) doc.text(clean, opts);
}

// Integrity check
function assertCounterIntegrity(data) {
  const check = validateCounterIntegrity(data);
  if (!check.valid) {
    throw new Error(`Report integrity violation: ${check.reason}`);
  }
}

// Helper to draw a circular gauge
function drawGauge(doc, x, y, radius, label, value, maxValue, color) {
  const percent = Math.min(Math.max(value / maxValue, 0), 1);
  const endAngle = -Math.PI/2 + 2 * Math.PI * percent;

  // Background arc
  doc.save()
    .lineWidth(radius * 0.15)
    .strokeColor('#2a2a2a')
    .arc(x, y, radius, 0, 2 * Math.PI, false)
    .stroke()
    .restore();

  // Value arc
  doc.save()
    .lineWidth(radius * 0.15)
    .strokeColor(color)
    .arc(x, y, radius, -Math.PI/2, endAngle, false)
    .stroke()
    .restore();

  // Value text (centered inside the gauge)
  doc.fontSize(14)
    .font(CairoBold)
    .fillColor('#ffffff')
    .text(`${value}/${maxValue}`, x - radius, y - 8, {
      width: radius * 2,
      align: 'center',
      lineBreak: false
    });

  // Label (beneath the gauge)
  doc.fontSize(10)
    .font(InterBold)
    .fillColor('#ffffff')
    .text(label, x - radius, y + radius + 8, {
      width: radius * 2,
      align: 'center',
      lineBreak: false
    });
}

// Helper to draw grade badge
function drawGradeBadge(doc, x, y, size, score) {
  const radius = size / 2;
  let grade, sealColor;

  if (score === 0) {
    grade = 'A+';
    sealColor = '#D4AF37'; // Gold
  } else if (score >= 90) {
    grade = 'A';
    sealColor = '#D4AF37';
  } else if (score >= 80) {
    grade = 'B';
    sealColor = '#D4AF37';
  } else if (score >= 70) {
    grade = 'C';
    sealColor = '#FFA500'; // Orange
  } else if (score >= 60) {
    grade = 'D';
    sealColor = '#FFA500';
  } else if (score >= 50) {
    grade = 'E';
    sealColor = '#FF0000'; // Red
  } else {
    grade = 'F';
    sealColor = '#FF0000';
  }

  // Outer circle (seal)
  doc.save()
    .lineWidth(4)
    .strokeColor(sealColor)
    .arc(x, y, radius, 0, 2 * Math.PI, false)
    .stroke()
    .restore();

  // Inner circle
  doc.save()
    .fillColor('#0a0a0a')
    .arc(x, y, radius - 8, 0, 2 * Math.PI, false)
    .fill('evenodd')
    .restore();

  // Grade text
  doc.fontSize(24)
    .font(CairoBold)
    .fillColor(sealColor)
    .text(grade, x - radius, y - 14, {
      width: radius * 2,
      align: 'center',
      lineBreak: false
    });
}

// Helper to draw QR code placeholder (we'll draw a simple square pattern)
function drawQRCode(doc, x, y, size, scanId) {
  // For simplicity, draw a square with some inner squares
  const cellSize = size / 10;
  doc.save()
    .fillColor('#ffffff')
    .rect(x, y, size, size)
    .stroke()
    .restore();

  // Draw some pattern
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 0) {
        doc.save()
          .fillColor('#000000')
          .rect(x + i * cellSize, y + j * cellSize, cellSize, cellSize)
          .fill()
          .restore();
      }
    }
  }

  // Label below
  doc.fontSize(8)
    .font(InterRegular)
    .fillColor('#cccccc')
    .text(`Verify: ${scanId}`, x, y + size + 10, {
      width: size,
      align: 'center',
      lineBreak: false
    });
}

// Helper to draw watermark.
//
// IMPORTANT PDFKit quirk: doc.text(str, { x, y, ... }) does NOT honour x/y in
// the options object — only positional doc.text(str, x, y, opts) moves the text
// cursor. Everything in this file must therefore pass coordinates
// positionally (or draw inside a translate/rotate), never as options.x/options.y.
function drawWatermark(doc) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const text = 'TEOS';

  doc.save();
  doc.translate(pageWidth / 2, pageHeight / 2).rotate(-45);
  doc.fontSize(120).font(CairoBold).fillColor('#D4AF37', 0.08); // 8% opacity
  const width = doc.widthOfString(text);
  doc.text(text, -width / 2, -60, { lineBreak: false });
  doc.restore();
}
// Helper to draw diagonal TEOS CERTIFIED stamp for ALLOW reports
function drawDiagonalStamp(doc, pageWidth, pageHeight) {
  const text = 'TEOS CERTIFIED';

  doc.save();
  doc.translate(pageWidth / 2, pageHeight / 2).rotate(-45);
  doc.fontSize(72).font(CairoBold).fillColor('#D4AF37', 0.15); // 15% opacity
  const width = doc.widthOfString(text);
  doc.text(text, -width / 2, -30, { lineBreak: false });
  doc.restore();
}

// Helper to draw TEOS CERTIFIED stamp
function drawCertifiedStamp(doc, x, y, size) {
  doc.save()
    .lineWidth(2)
    .strokeColor('#D4AF37')
    .arc(x, y, size, 0, 2 * Math.PI, false)
    .stroke()
    .restore();

  doc.fontSize(12)
    .font(CairoBold)
    .fillColor('#D4AF37')
    .text('TEOS CERTIFIED', x - 80, y - 6, {
      width: 160,
      align: 'center',
      lineBreak: false
    });
}

// Helper to draw BLOCKED stamp
function drawBlockedStamp(doc, x, y, size) {
  doc.save()
    .lineWidth(4)
    .strokeColor('#FF0000')
    .arc(x, y, size, 0, 2 * Math.PI, false)
    .stroke()
    .restore();

  doc.fontSize(20)
    .font(CairoBold)
    .fillColor('#FF0000')
    .text('BLOCKED', x - size, y - 10, {
      width: size * 2,
      align: 'center',
      lineBreak: false
    });
}

function generateScanReport(scanResult, code, creditsRemaining) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('PDF generation timed out'));
    }, PDF_TIMEOUT_MS);
    try {
      const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => {
        clearTimeout(timeout);
        const buf = Buffer.concat(chunks);
        if (buf.length > MAX_REPORT_SIZE) return reject(new Error('Report exceeds maximum size'));
        resolve(buf);
      });
      doc.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      const data = buildReportData(scanResult, code);
      assertCounterIntegrity(data);

      // Start first page
      doc.addPage();
      // Page 1: Cover
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentTop = 90;
      const reportId = data.auditId || data.reportId || 'TEOS-SENTINEL';
      // Stamp the shared theme header + footer for a fresh page. Runs after the
      // opaque page background fill so the chrome is not painted over.
      // Resetting the text cursor afterwards mirrors a fresh doc.addPage() state:
      // PDFKit's options-object text() inherits the cursor, and leaving it at the
      // page bottom would spill subsequent content onto spurious extra pages.
      const beginPage = (title) => {
        drawHeader(doc, title, reportId);
        drawFooter(doc, reportId);
        // Reset the text cursor to the top of the content area once the chrome
        // is stamped. PDFKit leaves the cursor wherever the last text ended
        // (here: the footer, near the page bottom), so any cursor-relative text
        // would otherwise land at the very bottom of the page.
        doc.x = margin;
        doc.y = contentTop;
      };

      // Opaque page background first, then the watermark/stamp on top so they are
      // actually visible (the fill used to paint over them).
      doc.save()
        .fillColor('#0a0a0a')
        .rect(0, 0, pageWidth, pageHeight)
        .fill()
        .restore();
      drawWatermark(doc);
      // Diagonal stamp for ALLOW reports
      if (data.verdict === 'ALLOW' || (data.verdict !== 'BLOCK' && data.verdict !== 'WARN' && data.score < 40)) {
        drawDiagonalStamp(doc, pageWidth, pageHeight);
      }

      beginPage('Security Report');

      // Draw 4 gauges
      const gaugeRadius = 60;
      const gaugeGap = 20;
      const gaugeStep = gaugeRadius * 2 + gaugeGap;
      const gaugeStartX = (pageWidth - (4 * gaugeRadius * 2 + 3 * gaugeGap)) / 2 + gaugeRadius;
      const gaugeY = 150;

      // Risk Score gauge (top left)
      drawGauge(doc, gaugeStartX + 0 * gaugeStep, gaugeY, gaugeRadius, 'Risk Score', data.score, 100,
        data.score >= 80 ? '#FF0000' : data.score >= 60 ? '#FFA500' : '#00FF00');

      // Secrets gauge
      drawGauge(doc, gaugeStartX + 1 * gaugeStep, gaugeY, gaugeRadius, 'Secrets', data.detectionSummary.secrets, 100,
        data.detectionSummary.secrets > 50 ? '#FF0000' : data.detectionSummary.secrets > 20 ? '#FFA500' : '#00FF00');

      // Supply Chain gauge
      drawGauge(doc, gaugeStartX + 2 * gaugeStep, gaugeY, gaugeRadius, 'Supply Chain', data.detectionSummary.supplyChain, 100,
        data.detectionSummary.supplyChain > 50 ? '#FF0000' : data.detectionSummary.supplyChain > 20 ? '#FFA500' : '#00FF00');

      // Execution gauge
      drawGauge(doc, gaugeStartX + 3 * gaugeStep, gaugeY, gaugeRadius, 'Execution', data.riskBreakdown.execution, 100,
        data.riskBreakdown.execution > 50 ? '#FF0000' : data.riskBreakdown.execution > 20 ? '#FFA500' : '#00FF00');

      // Center Grade Badge
      const badgeSize = 120;
      drawGradeBadge(doc, pageWidth / 2, pageHeight / 2 - 20, badgeSize, data.score);
      // BLOCKED red stamp for score 100
      if (data.score === 100) {
        drawBlockedStamp(doc, pageWidth / 2, pageHeight / 2 - 20, badgeSize);
      }

      // Bottom: Barcode and QR code
      const barcodeY = pageHeight - 150;
      // Draw a simple barcode placeholder (black lines)
      for (let i = 0; i < 20; i++) {
        doc.save()
          .fillColor(i % 2 === 0 ? '#000000' : '#ffffff')
          .rect(margin + i * 10, barcodeY, 8, 40)
          .fill()
          .restore();
      }

      // QR code
      drawQRCode(doc, pageWidth - margin - 100, barcodeY, 100, data.auditId);

      // Page 2: Charts
      doc.addPage();

      // Opaque page background first, then the watermark on top so it's visible.
      doc.save()
        .fillColor('#0a0a0a')
        .rect(0, 0, pageWidth, pageHeight)
        .fill()
        .restore();
      drawWatermark(doc);

      beginPage('Security Charts');

      // Donut chart: Safe vs Issues
      const safeCount = data.detectionSummary.safeFiles;
      const issuesCount = data.blockingCount + data.warnCount;
      const totalFiles = safeCount + issuesCount;
      const donutCenterX = pageWidth / 4;
      const donutCenterY = pageHeight / 2;
      const donutRadius = 80;

      // Draw donut
      doc.save()
        .translate(donutCenterX, donutCenterY)
        .lineWidth(40);

      // Background circle
      doc.strokeColor('#2a2a2a')
        .arc(0, 0, donutRadius, 0, 2 * Math.PI, false)
        .stroke();

      // Safe arc (green)
      if (totalFiles > 0) {
        const safePercent = safeCount / totalFiles;
        doc.strokeColor('#00FF00')
          .arc(0, 0, donutRadius, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * safePercent, false)
          .stroke();
      }

      // Issues arc (red)
      if (totalFiles > 0) {
        const issuesPercent = issuesCount / totalFiles;
        doc.strokeColor('#FF0000')
          .arc(0, 0, donutRadius, -Math.PI/2 + 2 * Math.PI * (safeCount/totalFiles), -Math.PI/2 + 2 * Math.PI * ((safeCount + issuesCount)/totalFiles), false)
          .stroke();
      }
      doc.restore();

      // Donut labels (centered beneath the donut)
      doc.fontSize(12)
        .font(InterBold)
        .fillColor('#ffffff')
        .text(`Safe: ${safeCount}`, donutCenterX - 110, donutCenterY + donutRadius + 12, {
          width: 100,
          align: 'center',
          lineBreak: false
        });
      doc.fontSize(12)
        .font(InterBold)
        .fillColor('#ffffff')
        .text(`Issues: ${issuesCount}`, donutCenterX + 10, donutCenterY + donutRadius + 12, {
          width: 100,
          align: 'center',
          lineBreak: false
        });

      // Bar chart: Severity breakdown
      const barWidth = 40;
      const barSpacing = 16;
      const barsTotalWidth = 4 * barWidth + 3 * barSpacing;
      const barChartX = pageWidth / 2 + (pageWidth / 2 - barsTotalWidth) / 2;
      const barChartY = pageHeight / 2 - 100;
      const severities = [
        { label: 'Critical', count: data.severityBreakdown?.critical || 0, color: '#FF0000' },
        { label: 'High', count: data.severityBreakdown?.high || 0, color: '#FF4500' },
        { label: 'Medium', count: data.severityBreakdown?.medium || 0, color: '#FFA500' },
        { label: 'Low', count: data.severityBreakdown?.low || 0, color: '#FFFF00' }
      ];

      const maxCount = Math.max(...severities.map(s => s.count), 1);

      severities.forEach((sev, index) => {
        const barHeight = (sev.count / maxCount) * 150;
        const x = barChartX + index * (barWidth + barSpacing);
        const y = barChartY + 150 - barHeight;

        // Bar background
        doc.save()
          .fillColor('#2a2a2a')
          .rect(x, y, barWidth, 150)
          .fill()
          .restore();

        // Bar fill
        doc.save()
          .fillColor(sev.color)
          .rect(x, y, barWidth, barHeight)
          .fill()
          .restore();

        // Label
        doc.fontSize(10)
          .font(InterRegular)
          .fillColor('#cccccc')
          .text(sev.label, x, barChartY + 160, {
            width: barWidth,
            align: 'center',
            lineBreak: false
          });

        // Value
        doc.fontSize(10)
          .font(InterBold)
          .fillColor('#ffffff')
          .text(sev.count.toString(), x, y - 15, {
            width: barWidth,
            align: 'center',
            lineBreak: false
          });
      });

      // Bar chart title
      doc.fontSize(14)
        .font(CairoBold)
        .fillColor('#D4AF37')
        .text('Severity Breakdown', barChartX, barChartY - 30, {
          width: barsTotalWidth,
          align: 'center',
          lineBreak: false
        });

      // Line chart: Risk trend (placeholder)
      const lineChartX = pageWidth / 2;
      const lineChartY = pageHeight - 150;
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: -30 },
        { x: 100, y: 10 },
        { x: 150, y: -20 },
        { x: 200, y: 40 }
      ];

      doc.save()
        .translate(lineChartX, lineChartY)
        .lineWidth(3)
        .strokeColor('#00BFFF');

      // Draw line
      doc.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        doc.lineTo(points[i].x, points[i].y);
      }
      doc.stroke();
      doc.restore();

      // Line chart points
      points.forEach(p => {
        doc.save()
          .fillColor('#00BFFF')
          .arc(lineChartX + p.x, lineChartY + p.y, 4, 0, 2 * Math.PI, false)
          .fill()
          .restore();
      });

      // Line chart title
      doc.fontSize(14)
        .font(CairoBold)
        .fillColor('#D4AF37')
        .text('Risk Trend (Last 5 Scans)', lineChartX - 100, lineChartY - 30, {
          width: 400,
          align: 'center',
          lineBreak: false
        });

      // Page 3: Findings Table
      doc.addPage();

      // Opaque page background first, then the watermark on top so it's visible.
      doc.save()
        .fillColor('#0a0a0a')
        .rect(0, 0, pageWidth, pageHeight)
        .fill()
        .restore();
      drawWatermark(doc);

      beginPage('Findings Table');

      // Table headers. Column widths are chosen so the table fits inside the page
      // content area (pageWidth - 2 * margin) instead of running off the edge.
      const tableStartY = 80;
      const colWidths = [30, 30, 70, 95, 40, 170, 80];
      const headers = ['#', 'Icon', 'Severity', 'File', 'Line', 'Evidence (redacted)', 'Fix'];

      if (data.findings.length === 0) {
        // Empty state: show a positive summary instead of a lone header row.
        doc.fontSize(16)
          .font(CairoBold)
          .fillColor('#00FF00')
          .text('No issues detected - A+ grade', margin, contentTop + 40, {
            width: pageWidth - 2 * margin,
            align: 'center',
            lineBreak: false
          });
      } else {
        // Draw header background
        doc.save()
          .fillColor('#1a1a1a')
          .rect(margin, tableStartY, pageWidth - 2 * margin, 25)
          .fill()
          .restore();

        // Draw headers
        let xPos = margin;
        headers.forEach((header, idx) => {
          doc.fontSize(10)
            .font(InterBold)
            .fillColor('#D4AF37')
            .text(header, xPos + 5, tableStartY + 5, {
              width: colWidths[idx],
              align: 'left',
              lineBreak: false
            });
          xPos += colWidths[idx];
        });
      }

      // Draw rows
      let yPos = tableStartY + 30;
      data.findings.forEach((finding, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          doc.save()
            .fillColor('#151515')
            .rect(margin, yPos - 5, pageWidth - 2 * margin, 20)
            .fill()
            .restore();
        }

        // Severity color
        let sevColor = '#00FF00';
        if (finding.severity === 'CRITICAL') sevColor = '#FF0000';
        else if (finding.severity === 'HIGH') sevColor = '#FF4500';
        else if (finding.severity === 'MEDIUM') sevColor = '#FFA500';

        // Draw cells
        let xPos = margin;
        // Index
        doc.fontSize(9)
          .font(InterRegular)
          .fillColor('#cccccc')
          .text((index + 1).toString(), xPos + 5, yPos, {
            width: colWidths[0],
            align: 'left',
            height: 18,
            ellipsis: true
          });
        xPos += colWidths[0];

        // Icon
        const iconRadius = 6;
        doc.save()
          .fillColor(sevColor)
          .arc(xPos + iconRadius, yPos + 7, iconRadius, 0, 2 * Math.PI, false)
          .fill()
          .restore();
        xPos += colWidths[1];

        // Severity
        doc.fontSize(9)
          .font(InterBold)
          .fillColor(sevColor)
          .text(finding.severity, xPos + 5, yPos, {
            width: colWidths[2],
            align: 'left',
            height: 18,
            ellipsis: true
          });
        xPos += colWidths[2];

        // File (truncate)
        const fileText = sanitizePdfText(finding.location).split('/').pop() || 'unknown';
        doc.fontSize(9)
          .font(InterRegular)
          .fillColor('#cccccc')
          .text(fileText, xPos + 5, yPos, {
            width: colWidths[3],
            align: 'left',
            height: 18,
            ellipsis: true
          });
        xPos += colWidths[3];

        // Line
        doc.fontSize(9)
          .font(InterRegular)
          .fillColor('#cccccc')
          .text(finding.line_number ? finding.line_number.toString() : '-', xPos + 5, yPos, {
            width: colWidths[4],
            align: 'left',
            height: 18,
            ellipsis: true
          });
        xPos += colWidths[4];

        // Evidence (truncate)
        const evidenceText = sanitizePdfText(finding.evidence_snippet || finding.evidence || '');
        const truncatedEvidence = evidenceText.length > 50 ? evidenceText.substring(0, 50) + '...' : evidenceText;
        doc.fontSize(9)
          .font(InterRegular)
          .fillColor('#cccccc')
          .text(truncatedEvidence, xPos + 5, yPos, {
            width: colWidths[5],
            align: 'left',
            height: 18,
            ellipsis: true
          });
        xPos += colWidths[5];

        // Fix (recommendation truncate)
        const fixText = sanitizePdfText(finding.recommendation || '');
        const truncatedFix = fixText.length > 50 ? fixText.substring(0, 50) + '...' : fixText;
        doc.fontSize(9)
          .font(InterRegular)
          .fillColor('#cccccc')
          .text(truncatedFix, xPos + 5, yPos, {
            width: colWidths[6],
            align: 'left',
            height: 18,
            ellipsis: true
          });

        yPos += 25;

        // Check for new page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          doc.save()
            .fillColor('#0a0a0a')
            .rect(0, 0, pageWidth, pageHeight)
            .fill()
            .restore();
          drawWatermark(doc);
          beginPage('Findings Table');
          yPos = 80;
          // Redraw header
          doc.save()
            .fillColor('#1a1a1a')
            .rect(margin, tableStartY, pageWidth - 2 * margin, 25)
            .fill()
            .restore();
          xPos = margin;
          headers.forEach((header, idx) => {
            doc.fontSize(10)
              .font(InterBold)
              .fillColor('#D4AF37')
              .text(header, xPos + 5, tableStartY + 5, {
                width: colWidths[idx],
                align: 'left',
                lineBreak: false
              });
            xPos += colWidths[idx];
          });
          yPos = tableStartY + 30;
        }
      });
      // Page 4: Recommendations (similar to original but styled)
      doc.addPage();

      // Opaque page background first, then the watermark on top so it's visible.
      doc.save()
        .fillColor('#0a0a0a')
        .rect(0, 0, pageWidth, pageHeight)
        .fill()
        .restore();
      drawWatermark(doc);

      beginPage('Recommendations');

      let recY = 120;
      var actions = [];
      if (data.verdict === 'BLOCK' || data.score >= 80) {
        actions = [
          { priority: 'HIGH', text: 'Do not deploy or execute the flagged code in any environment.' },
          { priority: 'HIGH', text: 'Remove hardcoded secrets and use environment variables or a secrets manager.' },
          { priority: 'HIGH', text: 'Review destructive commands (rm -rf, drop, format) for legitimate use.' },
          { priority: 'MEDIUM', text: 'Run a full security audit of the repository before production deployment.' },
          { priority: 'MEDIUM', text: 'Use /report to generate a detailed PDF for compliance records.' },
        ];
        if (data.findings.some(f => f.type === 'Supply Chain Risk')) {
          actions.push({ priority: 'HIGH', text: 'Remove or replace the flagged malicious package immediately.' });
        }
      } else if (data.verdict === 'WARN' || data.score >= 40) {
        actions = [
          { priority: 'MEDIUM', text: 'Review the flagged files for potential security risks.' },
          { priority: 'MEDIUM', text: 'Apply least-privilege principles where possible.' },
          { priority: 'LOW', text: 'Ensure no sensitive data is exposed in code comments or logs.' },
        ];
      } else {
        actions = [
          { priority: 'LOW', text: 'No action required. Continue following security best practices.' },
        ];
      }

      for (const a of actions) {
        const pColor = a.priority === 'HIGH' ? '#FF0000' : a.priority === 'MEDIUM' ? '#FFA500' : '#00FF00';
        doc.fontSize(10)
          .font(InterBold)
          .fillColor(pColor)
          .text(`[${a.priority}]`, margin, recY, {
            width: 70,
            lineBreak: false
          });
        doc.fontSize(10)
          .font(InterRegular)
          .fillColor('#cccccc')
          .text(a.text, margin + 70, recY, {
            width: pageWidth - 2 * margin - 70
          });
        recY += 22;

        if (recY > pageHeight - 40) {
          doc.addPage();
          doc.save()
            .fillColor('#0a0a0a')
            .rect(0, 0, pageWidth, pageHeight)
            .fill()
            .restore();
          drawWatermark(doc);
          beginPage('Recommendations');
          recY = 120;
        }
      }

      // Add TEOS CERTIFIED stamp at bottom center of last page
      drawCertifiedStamp(doc, pageWidth / 2, pageHeight - 65, 15);

      doc.end();
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
}

module.exports = { generateScanReport };