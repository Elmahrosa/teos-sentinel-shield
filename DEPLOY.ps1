# ════════════════════════════════════════════════════════════
# TEOS SENTINEL SHIELD — PowerShell Deploy Script
# Run this from: C:\Users\aams1\Projects\teos-sovereign\teos-sentinel-shield
# ════════════════════════════════════════════════════════════

# Step 1 — Set project path
$ProjectPath = "C:\Users\aams1\Projects\teos-sovereign\teos-sentinel-shield"
Set-Location $ProjectPath

Write-Host "==> TEOS Deploy Started" -ForegroundColor Cyan

# Step 2 — Read the new HTML file (download from Claude outputs first)
# Place teos-sentinel-shield.html in your Downloads folder, then:
$HtmlSource = "$env:USERPROFILE\Downloads\teos-sentinel-shield.html"
$PageTarget = "$ProjectPath\app\page.tsx"

if (-not (Test-Path $HtmlSource)) {
    Write-Host "ERROR: teos-sentinel-shield.html not found in Downloads" -ForegroundColor Red
    Write-Host "Download it from Claude first, then re-run this script." -ForegroundColor Yellow
    exit 1
}

# Step 3 — Read HTML and wrap in page.tsx
Write-Host "==> Wrapping HTML into page.tsx..." -ForegroundColor Yellow
$html = Get-Content $HtmlSource -Raw -Encoding UTF8
$html = $html -replace '\\', '\\\\'
$html = $html -replace '`', '\`'
$html = $html -replace '\$\{', '\${'

$tsx = @"
// app/page.tsx — TEOS Sentinel Shield Landing Page
export default function Page() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: ``$html``
      }}
    />
  );
}
"@

Set-Content $PageTarget $tsx -Encoding UTF8
Write-Host "==> page.tsx written ($([math]::Round((Get-Item $PageTarget).Length/1KB))KB)" -ForegroundColor Green

# Step 4 — Git add, commit, push
Write-Host "==> Committing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "feat: landing page v3 — translate AR/ID + gov targets + video placeholder"
git push origin main

Write-Host ""
Write-Host "==> DONE. Vercel will auto-deploy in ~60 seconds." -ForegroundColor Green
Write-Host "==> Check: https://teos-sentinel-shield.vercel.app" -ForegroundColor Cyan
