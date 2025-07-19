# AURA Transport System - Complete Startup Script
# This script starts all required services for the AURA transport system

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🚀 AURA TRANSPORT SYSTEM STARTUP" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($processId in $processes) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✅ Cleaned up port $Port" -ForegroundColor Yellow
    } catch {
        # Port not in use, which is fine
    }
}

# Cleanup existing processes
Write-Host "🔄 Cleaning up existing processes..." -ForegroundColor Yellow
Stop-ProcessOnPort 8000
Stop-ProcessOnPort 8002  
Stop-ProcessOnPort 3001
Start-Sleep -Seconds 2

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend"
$frontendDir = Join-Path $scriptDir "frontend"

Write-Host "📁 Working directory: $scriptDir" -ForegroundColor Cyan
Write-Host ""

# Start Backend API Server
Write-Host "🔧 Starting Backend API Server on port 8000..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    & uvicorn main:app --host 127.0.0.1 --port 8000 --reload
} -ArgumentList $backendDir

Start-Sleep -Seconds 5

# Start WebSocket Server  
Write-Host "🔌 Starting WebSocket Server on port 8002..." -ForegroundColor Yellow
$websocketJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    & python websocket_server.py
} -ArgumentList $backendDir

Start-Sleep -Seconds 5

# Start Frontend
Write-Host "🌐 Starting Frontend on port 3001..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    & npm run dev
} -ArgumentList $frontendDir

Write-Host ""
Write-Host "⏳ Waiting for all services to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "🧪 Testing service connectivity..." -ForegroundColor Cyan
Write-Host ""

# Test Backend API
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend API: HEALTHY - Status: $($backendHealth.status)" -ForegroundColor Green
    Write-Host "   📊 Model Loaded: $($backendHealth.model_loaded)" -ForegroundColor Cyan
    Write-Host "   📊 GTFS Loaded: $($backendHealth.gtfs_loaded)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Backend API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test WebSocket Server
try {
    $websocketHealth = Invoke-RestMethod -Uri "http://localhost:8002/health" -Method Get -TimeoutSec 5
    Write-Host "✅ WebSocket Server: HEALTHY - Status: $($websocketHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ WebSocket Server: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3001" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend: ACCESSIBLE" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 AURA SYSTEM STARTUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Service URLs:" -ForegroundColor White
Write-Host "   • Backend API:    http://localhost:8000" -ForegroundColor Cyan
Write-Host "   • WebSocket:      http://localhost:8002" -ForegroundColor Cyan  
Write-Host "   • Frontend:       http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 API Documentation:" -ForegroundColor White
Write-Host "   • Swagger UI:     http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   • Health Check:   http://localhost:8000/api/v1/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔧 Job Management:" -ForegroundColor White
Write-Host "   • Backend Job ID: $($backendJob.Id)" -ForegroundColor Cyan
Write-Host "   • WebSocket Job ID: $($websocketJob.Id)" -ForegroundColor Cyan
Write-Host "   • Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Cyan
Write-Host ""

Write-Host "🛑 To stop all services, run: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Yellow
Write-Host ""

# Ask user if they want to open the frontend
$openBrowser = Read-Host "Would you like to open the frontend in your browser? (y/n)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "http://localhost:3001"
    Write-Host "🌐 Frontend opened in browser!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 AURA Transport System is now running!" -ForegroundColor Green
Write-Host "Keep this PowerShell window open to monitor the services." -ForegroundColor Yellow
Write-Host ""

# Keep the script running and show job status
Write-Host "📊 Monitoring services... (Press Ctrl+C to stop monitoring)" -ForegroundColor Cyan
try {
    while ($true) {
        Start-Sleep -Seconds 30
        $runningJobs = Get-Job | Where-Object { $_.State -eq "Running" }
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Running services: $($runningJobs.Count)/3" -ForegroundColor Gray
    }
} catch {
    Write-Host "Monitoring stopped." -ForegroundColor Yellow
}
