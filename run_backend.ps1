# ==========================================
# TALENTRA — Backend Development Server Launcher
# ==========================================
Write-Host "Starting TALENTRA Backend API Server..." -ForegroundColor Cyan

# Set location to workspace root
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

# Ensure virtual environment Python exists
$VenvPython = Join-Path $RootDir "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "Virtual environment not found. Creating backend\.venv..." -ForegroundColor Yellow
    & "C:\Users\Krishna Chaitanya\AppData\Local\Python\bin\python.exe" -m venv "backend\.venv"
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & $VenvPython -m pip install -r "backend\requirements.txt"
}

# Determine target port (matches .env BACKEND_PORT=8001 and vite.config.js proxy target)
$Port = 8001
$PortCheck = netstat -ano | findstr ":8001 " | findstr "LISTENING"
if ($PortCheck) {
    Write-Host "Port 8001 is currently occupied. Falling back to port 8000..." -ForegroundColor Yellow
    $Port = 8000
}

Write-Host "Backend server launching at http://127.0.0.1:$Port" -ForegroundColor Green
Write-Host "Interactive API Docs: http://127.0.0.1:$Port/docs" -ForegroundColor Gray
Write-Host "Data Summary API: http://127.0.0.1:$Port/api/v1/data/summary" -ForegroundColor Gray
Write-Host "Press Ctrl+C to terminate." -ForegroundColor DarkGray

& $VenvPython -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port $Port
