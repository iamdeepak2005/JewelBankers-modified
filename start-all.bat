@echo off
title JewelBankers - Launcher
echo ========================================================
echo Launching JewelBankers Backend & Frontend...
echo ========================================================

start "JewelBankers WhatsApp Engine" "%~dp0start-whatsapp.bat"
timeout /t 2 /nobreak >nul
start "JewelBankers Backend" "%~dp0start-backend.bat"
timeout /t 3 /nobreak >nul
start "JewelBankers Frontend" "%~dp0start-frontend.bat"

echo.
echo All services have been launched in separate terminal windows!
echo WhatsApp: http://localhost:3001/status
echo Backend:  http://localhost:8081/jewelbankersapi
echo Frontend: http://localhost:4200
echo.
pause
