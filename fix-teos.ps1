Write-Host "TEOS Sentinel Booting..." -ForegroundColor Cyan

Set-Location $PSScriptRoot

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Checking structure..." -ForegroundColor Yellow

if (!(Test-Path "./server/api.js")) {
    Write-Host "ERROR: server/api.js not found" -ForegroundColor Red
    exit 1
}

Write-Host "Starting Sentinel Engine..." -ForegroundColor Green
node server/api.js