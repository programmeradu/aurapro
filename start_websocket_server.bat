@echo off
echo ========================================
echo    AURA Command Center - Phase 2
echo    Real-Time WebSocket Server
echo ========================================
echo.
echo Starting WebSocket server on port 8002...
echo Frontend should connect to: http://localhost:8002
echo.

cd backend
python websocket_server.py

pause
