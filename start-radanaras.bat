@echo off
echo ========================================
echo    RADANARAS SYSTEM - ULTIMATE START
echo ========================================
echo.

REM 1. BACKEND LOCAL SERVER (Port 3001)
echo [1/7] Starting Backend Server (localhost:3001)...
start "Radanaras Backend" cmd /k "cd /d C:\Users\saimo\RadanarasSystem\backend && node index.js"
timeout /t 2 >nul

REM 2. FRONTEND DEV SERVER (Port 5173)
echo [2/7] Starting Frontend Dev Server (localhost:5173)...
start "Radanaras Frontend" cmd /k "cd /d C:\Users\saimo\RadanarasSystem\frontend && npm run dev"
timeout /t 3 >nul

REM 3. SSH TO PRODUCTION SERVER
echo [3/7] Connecting to Production Server (SSH)...
start "Production Server SSH" cmd /k "ssh root@76.13.76.9"
timeout /t 1 >nul

REM 4. OPEN LOCAL FRONTEND IN BROWSER
echo [4/7] Opening Local Frontend (localhost:5173)...
start "" "http://localhost:5173"
timeout /t 1 >nul

REM 5. OPEN PRODUCTION SITE IN BROWSER
echo [5/7] Opening Production Site (76.13.76.9)...
start "" "http://76.13.76.9"
timeout /t 1 >nul

REM 6. OPEN CLAUDE CODE (Desktop App - RadanarasSystem folder)
echo [6/7] Opening Claude Code in RadanarasSystem...
start "Claude Code" cmd /k "C:\Users\saimo\AppData\Roaming\npm\claude.cmd C:\Users\saimo\RadanarasSystem"
timeout /t 1 >nul

REM 7. OPEN CODEX (OpenAI Codex CLI - Interactive)
echo [7/7] Starting OpenAI Codex CLI...
start "OpenAI Codex" cmd /k "cd /d C:\Users\saimo\RadanarasSystem && codex"
timeout /t 1 >nul

echo.
echo ========================================
echo    ALL SYSTEMS STARTED!
echo ========================================
echo.
echo Running services:
echo   - Backend:     http://localhost:3001
echo   - Frontend:    http://localhost:5173
echo   - Production:  http://76.13.76.9
echo   - SSH Server:  root@76.13.76.9 (enter password)
echo   - Claude Code: RadanarasSystem folder
echo   - Codex CLI:   Interactive terminal (skip update if needed)
echo.
echo Press any key to close this window...
pause >nul
