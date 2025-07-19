@echo off
echo Starting Aura Command Backend Server...
cd backend
uvicorn main:app --reload --port 8000 