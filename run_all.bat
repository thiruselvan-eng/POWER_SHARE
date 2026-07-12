@echo off
title PowerShare Starter Script
echo ==============================================================
echo             POWERSHARE LOCAL SERVICES STARTUP
echo ==============================================================
echo.

:: 1. Start PostgreSQL custom instance on port 5433
echo [1/3] Launching PostgreSQL database on port 5433..."C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" start -D "%~dp0backend\db_data" -o "-p 5433"

echo.

:: 2. Launch Spring Boot backend in a new terminal window
echo [2/3] Starting Spring Boot backend on port 8085 (Separate Window)...
start "PowerShare Backend (Port 8085)" cmd /k "cd /d %~dp0backend && set JAVA_HOME=C:\Program Files\Java\jdk-17&& set PATH=C:\Program Files\Java\jdk-17\bin;%%PATH%%&& .\mvnw.cmd spring-boot:run"
echo.

:: 3. Launch React frontend in a new terminal window
echo [3/3] Starting React frontend on port 5173 (Separate Window)...
start "PowerShare Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.

echo ==============================================================
echo Startup commands dispatched successfully!
echo --------------------------------------------------------------
echo - Web App UI:  http://localhost:5173
echo - Buyer View:  http://localhost:5173/buyer
echo - Backend API: http://localhost:8085/api
echo ==============================================================
echo Close this window once everything is running.
pause
