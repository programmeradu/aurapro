@echo off
echo.
echo ========================================
echo 🚀 AURA TRANSPORT SYSTEM STARTUP
echo ========================================
echo.

REM Set colors for better visibility
color 0A

echo 📋 Starting all AURA services concurrently...
echo.

REM Kill any existing processes on the ports we need
echo 🔄 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8002" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo ✅ Port cleanup complete
echo.

REM Start Backend API Server (Port 8000)
echo 🔧 Starting Backend API Server on port 8000...
start "AURA Backend API" cmd /k "cd /d %~dp0backend && echo 🚀 Starting AURA Backend API Server... && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start WebSocket Server (Port 8002)
echo 🔌 Starting WebSocket Server on port 8002...
start "AURA WebSocket" cmd /k "cd /d %~dp0backend && echo 🔌 Starting AURA WebSocket Server... && python websocket_server.py"

REM Wait a moment for websocket to start
timeout /t 3 /nobreak >nul

REM Start Frontend (Port 3001)
echo 🌐 Starting Frontend on port 3001...
start "AURA Frontend" cmd /k "cd /d %~dp0frontend && echo 🌐 Starting AURA Frontend... && npm run dev"

echo.
echo ⏳ Waiting for all services to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 🧪 Testing service connectivity...
echo.

REM Test Backend API
powershell -Command "try { $result = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/health' -Method Get -TimeoutSec 5; Write-Host '✅ Backend API: HEALTHY - Status:' $result.status; Write-Host '   📊 Model Loaded:' $result.model_loaded; Write-Host '   📊 GTFS Loaded:' $result.gtfs_loaded } catch { Write-Host '❌ Backend API: FAILED -' $_.Exception.Message }"

REM Test WebSocket Server
powershell -Command "try { $result = Invoke-RestMethod -Uri 'http://localhost:8002/health' -Method Get -TimeoutSec 5; Write-Host '✅ WebSocket Server: HEALTHY - Status:' $result.status; Write-Host '   👥 Connected Clients:' $result.connected_clients } catch { Write-Host '❌ WebSocket Server: FAILED -' $_.Exception.Message }"

REM Test Frontend
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001' -Method Get -TimeoutSec 5 -UseBasicParsing; if ($response.StatusCode -eq 200) { Write-Host '✅ Frontend: ACCESSIBLE' } } catch { Write-Host '❌ Frontend: FAILED -' $_.Exception.Message }"

REM Run WebSocket Connection Test
echo.
echo 🔌 Running comprehensive WebSocket connection test...
python test_websocket_connection.py

echo.
echo ========================================
echo 🎉 AURA SYSTEM STARTUP COMPLETE!
echo ========================================
echo.
echo 📊 Service URLs:
echo   • Backend API:    http://localhost:8000
echo   • WebSocket:      http://localhost:8002  
echo   • Frontend:       http://localhost:3001
echo.
echo 📋 API Documentation:
echo   • Swagger UI:     http://localhost:8000/docs
echo   • Health Check:   http://localhost:8000/api/v1/health
echo.
echo 🔧 To stop all services:
echo   • Close all terminal windows or press Ctrl+C in each
echo.
echo Press any key to open the frontend in your browser...
pause >nul
start http://localhost:3001

echo.
echo 🚀 AURA Transport System is now running!
echo Keep this window open to monitor the startup process.
echo.
pause
