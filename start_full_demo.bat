@echo off
echo ===============================================
echo     🌟 Starting Aura Command Full Demo 🌟
echo ===============================================
echo.
echo Starting Backend Server (FastAPI)...
start "Aura Backend" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8002 --reload"
echo.
echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend Application (Streamlit)...
start "Aura Frontend" cmd /k "streamlit run app.py --server.port 8503"
echo.
echo ===============================================
echo   🚀 Aura Command is launching!
echo   
echo   Backend:  http://127.0.0.1:8002
echo   Frontend: http://localhost:8503
echo ===============================================
echo.
echo Press any key to close this window...
pause > nul 