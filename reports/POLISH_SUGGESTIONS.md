# PDF Report — Polish Suggestions

## High Priority

1. **Fix SVG chart rendering in Puppeteer**
   - The severity bar chart uses hardcoded `y` positions — currently works but fragile. Refactor to use `<g>` transform groups:
   ```svg
   <g transform="translate(40, __BASE_Y__)">
     <rect y="0" width="__CRIT_BAR_W__" height="24" rx="4" fill="#EF4444"/>
     <text x="8" y="16" fill="white" font-size="9" font-weight="600">Critical</text>
   </g>
   ```
   This makes the chart responsive and easier to maintain.

2. **Page number footer for all content pages**
   - For pages 2-6, add `@bottom-center` with `counter(page)` and `page-count` for:
     ```
     Page X of Y
     ```
   - Cover page should omit page numbers.

3. **Graceful Puppeteer failure message**
   - In `report-generator.js`, when Chromium starts but PDF generation fails, return the HTML with a `__PDF_RENDER_ERROR__` placeholder that renders as a yellow banner:
     ```html
     <div style="background:#FEF3C7;padding:12px;border-radius:6px;margin-bottom:16px;">
       PDF rendering unavailable — showing HTML preview
     </div>
     ```

## Medium Priority

4. **Caching generated PDFs**
   - Add a `reports/generated/` directory and cache PDFs by `reportId` hash (MD5 of target + date + tier).
   - Cache expiry: 24 hours.
   - Prevents regenerating the same report on dashboard refresh.

5. **Custom branding via env vars**
   - Add `REPORT_LOGO_URL`, `REPORT_COMPANY_NAME`, `REPORT_FOOTER_TEXT` env vars.
   - The cover shield SVG is hardcoded — make it replaceable with a logo URL.

6. **ThreatIntel highlighting**
   - Recommendation: add a severity band to the right of each vuln table row (color strip along the edge):
   ```css
   .vuln-row-critical { border-left: 3px solid #EF4444; }
   .vuln-row-high    { border-left: 3px solid #F97316; }
   .vuln-row-medium  { border-left: 3px solid #EAB308; }
   .vuln-row-low     { border-left: 3px solid #22C55E; }
   ```

7. **"Remediation progress" second chart**
   - Add a horizontal progress bar per category in the Action Plan section. Shows: `API Security (4/8 fixed — 50%)` with a progress bar fill.

## Low Priority / Future

8. **Multi-language reports**
   - The templates are English-only. Add `__LOCALE__` placeholder to allow switching between `en`, `ar` (Egypt), and `zh` (future). Arabic RTL layout would need separate CSS.

9. **QR code on cover page**
   - Generate a QR code SVG linking to the verification URL (`https://teos-sentinel-shield.vercel.app/verify/__REPORT_ID__`). Use a small JS snippet that renders a QR code from the report ID.

10. **Download as ZIP (report + assets)**
    - Include the raw findings JSON, the SVG chart, and the PDF in a ZIP download. Useful for compliance audits (need proof of raw data).

## Implementation Notes

```javascript
// In report-generator.js, add before populateTemplate:
const chartConfig = {
  crit: { count: findings.critical || 0, color: '#EF4444' },
  high: { count: findings.high || 0, color: '#F97316' },
  med:  { count: findings.medium || 0, color: '#EAB308' },
  low:  { count: findings.low || 0, color: '#22C55E' },
};

// Calculate bar widths proportional to max count
const max = Math.max(1, ...Object.values(chartConfig).map(c => c.count));
const MAX_BAR_WIDTH = 320;
for (const [key, cfg] of Object.entries(chartConfig)) {
  cfg.width = Math.round((cfg.count / max) * MAX_BAR_WIDTH);
}
```
