@echo off
TITLE TelecomPulse AI - Startup Launcher
color 0B

echo ==============================================================================
echo    TelecomPulse AI -- Real-Time SMS and Voice Traffic Monitoring
echo    Big Data Stream Processing NOC Dashboard Launcher
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Verifying Python Environment...
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python 3.10+.
    pause
    exit /b 1
)

echo [2/3] Checking Frontend Build...
if not exist "frontend\dist" (
    echo Compiling React frontend with Vite...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

echo [3/3] Starting TelecomPulse AI Backend on http://localhost:8000 ...
echo Both the API and interactive React Dashboard will be available at http://localhost:8000
echo.
start "" http://localhost:8000

cd backend
python run_backend.py
pause
