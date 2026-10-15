Write-Host "`nTEOS Sentinel Health Check" -ForegroundColor Cyan
Write-Host "================================"

$services = @(
    @{ Name="Activation"; Url="http://localhost:8080/health" },
    @{ Name="MCP Engine"; Url="http://localhost:8081/health" },
    @{ Name="Bot API";    Url="http://localhost:8082/health" }
)

foreach ($s in $services) {
    try {
        $r = Invoke-RestMethod -Uri $s.Url -ErrorAction Stop
        Write-Host "  OK $($s.Name)" -ForegroundColor Green
        $r | ConvertTo-Json -Depth 1 | ForEach-Object { Write-Host "     $_" }
    } catch {
        Write-Host "  FAIL $($s.Name) -- OFFLINE" -ForegroundColor Red
    }
}

Write-Host "================================"
pm2 status | Select-String "online|stopped|errored" | ForEach-Object { Write-Host "  $_" }
Write-Host "================================`n"
