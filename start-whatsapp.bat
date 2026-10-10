@echo off
title JewelBankers - WhatsApp Engine (Baileys)
echo ========================================================
echo Starting JewelBankers WhatsApp Protocol Engine (Baileys)...
echo Zero Browser, Zero GUI ^| Ultra-Low Latency (~50ms-150ms)
echo API: http://localhost:3001/message/send
echo ========================================================

cd /d "%~dp0whatsapp-service"
npm start
pause
