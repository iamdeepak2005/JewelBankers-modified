@echo off
title JewelBankers - Frontend (Angular)
echo ========================================================
echo Starting JewelBankers Frontend (Angular Dev Server)...
echo URL: http://localhost:4200
echo ========================================================

cd /d "%~dp0Frontend"
call npm start
pause
