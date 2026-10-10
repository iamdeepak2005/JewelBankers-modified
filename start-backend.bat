@echo off
title JewelBankers - Backend (Spring Boot)
echo ========================================================
echo Starting JewelBankers Backend (Spring Boot API)...
echo Port: 8081 | Context: /jewelbankersapi
echo ========================================================

set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d "%~dp0Backend"
call mvnw.cmd spring-boot:run
pause
