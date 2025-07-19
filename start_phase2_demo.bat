@echo off
echo ========================================
echo    AURA Command Center - Phase 2
echo    Real-Time Infrastructure Demo
echo ========================================
echo.
echo This will start:
echo - Backend API Server (port 8000)
echo - WebSocket Server (port 8002)
echo - Frontend Development Server (port 3000)
echo.
echo Press any key to continue...
pause >nul

echo.
echo Starting Backend API Server...
start "AURA Backend API" cmd /k "cd backend && python main.py"

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting WebSocket Server...
start "AURA WebSocket Server" cmd /k "cd backend && python websocket_server.py"

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Development Server...
start "AURA Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo All servers are starting up!
echo.
echo Backend API:     http://localhost:8000
echo WebSocket:       http://localhost:8002
echo Frontend:        http://localhost:3000
echo.
echo Wait for all servers to fully start,
echo then open http://localhost:3000
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
