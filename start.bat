@echo off
title QTest Platform - Backend
color 0A

echo.
echo  =========================================
echo    QTest Platform - Starting Backend
echo  =========================================
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install Python 3.8+ first.
    pause & exit /b 1
)

cd /d "%~dp0backend"
echo [INFO] Installing dependencies...
pip install flask flask-cors selenium --quiet

echo.
echo [INFO] Starting backend on http://localhost:8080
echo [INFO] Keep this window open while using the app.
echo.
python app.py
pause
