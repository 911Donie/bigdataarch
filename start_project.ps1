# TelecomPulse AI PowerShell Startup Script
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "   TelecomPulse AI -- Real-Time SMS and Voice Traffic Monitoring" -ForegroundColor Cyan
Write-Host "   Big Data Stream Processing NOC Dashboard Launcher" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check Frontend Build
if (-not (Test-Path "frontend\dist")) {
    Write-Host "[1/2] Compiling React frontend with Vite..." -ForegroundColor Yellow
    Set-Location "frontend"
    npm install
    npm run build
    Set-Location $ScriptDir
} else {
    Write-Host "[1/2] Frontend bundle verified." -ForegroundColor Green
}

Write-Host "[2/2] Starting TelecomPulse AI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process "http://localhost:8000"

Set-Location "backend"
python run_backend.py
