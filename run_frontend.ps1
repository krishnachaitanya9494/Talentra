# ==========================================
# TALENTRA — Frontend Development Server Launcher
# ==========================================
Write-Host "Starting TALENTRA React + Vite Development Server..." -ForegroundColor Cyan

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $RootDir "frontend"
Set-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Installing frontend dependencies..." -ForegroundColor Yellow
    npm.cmd install
}

Write-Host "Frontend server launching at http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate." -ForegroundColor DarkGray

npm.cmd run dev -- --host 127.0.0.1
