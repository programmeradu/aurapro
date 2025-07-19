#!/usr/bin/env node

/**
 * AURA Transport System - Complete Startup Script
 * This script starts all required services for the AURA transport system
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const http = require('http');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    console.log('');
    log('========================================', 'green');
    log(message, 'green');
    log('========================================', 'green');
    console.log('');
}

// Function to check if a port is in use
function checkPort(port) {
    return new Promise((resolve) => {
        const server = http.createServer();
        server.listen(port, () => {
            server.close(() => resolve(false)); // Port is free
        });
        server.on('error', () => resolve(true)); // Port is in use
    });
}

// Function to make HTTP request
function makeRequest(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const request = http.get(url, { timeout }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve({ statusCode: res.statusCode });
                }
            });
        });
        
        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Function to kill process on port (Windows)
function killProcessOnPort(port) {
    return new Promise((resolve) => {
        exec(`for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTENING"') do taskkill /f /pid %a`, 
            { shell: true }, () => resolve());
    });
}

// Function to start a service
function startService(name, command, args, cwd, color = 'cyan') {
    return new Promise((resolve, reject) => {
        log(`🚀 Starting ${name}...`, color);
        
        const process = spawn(command, args, {
            cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true
        });

        let started = false;
        
        process.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Uvicorn running') || 
                output.includes('Application startup complete') ||
                output.includes('ready') ||
                output.includes('compiled successfully')) {
                if (!started) {
                    started = true;
                    log(`✅ ${name} started successfully`, 'green');
                    resolve(process);
                }
            }
        });

        process.stderr.on('data', (data) => {
            const error = data.toString();
            if (error.includes('Error') || error.includes('EADDRINUSE')) {
                log(`❌ ${name} error: ${error.trim()}`, 'red');
            }
        });

        process.on('error', (error) => {
            log(`❌ Failed to start ${name}: ${error.message}`, 'red');
            reject(error);
        });

        // Timeout fallback
        setTimeout(() => {
            if (!started) {
                log(`⚠️  ${name} started (timeout fallback)`, 'yellow');
                resolve(process);
            }
        }, 10000);
    });
}

async function main() {
    logHeader('🚀 AURA TRANSPORT SYSTEM STARTUP');

    const scriptDir = __dirname;
    const backendDir = path.join(scriptDir, 'backend');
    const frontendDir = path.join(scriptDir, 'frontend');

    log(`📁 Working directory: ${scriptDir}`, 'cyan');
    console.log('');

    // Cleanup existing processes
    log('🔄 Cleaning up existing processes...', 'yellow');
    await killProcessOnPort(8000);
    await killProcessOnPort(8002);
    await killProcessOnPort(3001);
    await new Promise(resolve => setTimeout(resolve, 2000));
    log('✅ Port cleanup complete', 'green');
    console.log('');

    const processes = [];

    try {
        // Start Backend API Server
        const backendProcess = await startService(
            'Backend API Server (Port 8000)',
            'uvicorn',
            ['main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'],
            backendDir,
            'blue'
        );
        processes.push({ name: 'Backend', process: backendProcess });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Start WebSocket Server
        const websocketProcess = await startService(
            'WebSocket Server (Port 8002)',
            'python',
            ['websocket_server.py'],
            backendDir,
            'magenta'
        );
        processes.push({ name: 'WebSocket', process: websocketProcess });

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Start Frontend
        const frontendProcess = await startService(
            'Frontend (Port 3001)',
            'npm',
            ['run', 'dev'],
            frontendDir,
            'cyan'
        );
        processes.push({ name: 'Frontend', process: frontendProcess });

        console.log('');
        log('⏳ Waiting for all services to initialize...', 'cyan');
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('');
        log('🧪 Testing service connectivity...', 'cyan');
        console.log('');

        // Test Backend API
        try {
            const backendHealth = await makeRequest('http://localhost:8000/api/v1/health');
            log(`✅ Backend API: HEALTHY - Status: ${backendHealth.status}`, 'green');
            log(`   📊 Model Loaded: ${backendHealth.model_loaded}`, 'cyan');
            log(`   📊 GTFS Loaded: ${backendHealth.gtfs_loaded}`, 'cyan');
        } catch (error) {
            log(`❌ Backend API: FAILED - ${error.message}`, 'red');
        }

        // Test WebSocket Server
        try {
            const websocketHealth = await makeRequest('http://localhost:8002/health');
            log(`✅ WebSocket Server: HEALTHY - Status: ${websocketHealth.status}`, 'green');
        } catch (error) {
            log(`❌ WebSocket Server: FAILED - ${error.message}`, 'red');
        }

        // Test Frontend
        try {
            const frontendResponse = await makeRequest('http://localhost:3001');
            if (frontendResponse.statusCode === 200) {
                log('✅ Frontend: ACCESSIBLE', 'green');
            }
        } catch (error) {
            log(`❌ Frontend: FAILED - ${error.message}`, 'red');
        }

        logHeader('🎉 AURA SYSTEM STARTUP COMPLETE!');

        log('📊 Service URLs:', 'white');
        log('   • Backend API:    http://localhost:8000', 'cyan');
        log('   • WebSocket:      http://localhost:8002', 'cyan');
        log('   • Frontend:       http://localhost:3001', 'cyan');
        console.log('');

        log('📋 API Documentation:', 'white');
        log('   • Swagger UI:     http://localhost:8000/docs', 'cyan');
        log('   • Health Check:   http://localhost:8000/api/v1/health', 'cyan');
        console.log('');

        log('🚀 AURA Transport System is now running!', 'green');
        log('Press Ctrl+C to stop all services.', 'yellow');
        console.log('');

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('');
            log('🛑 Shutting down all services...', 'yellow');
            processes.forEach(({ name, process }) => {
                log(`   Stopping ${name}...`, 'yellow');
                process.kill('SIGTERM');
            });
            setTimeout(() => {
                log('✅ All services stopped', 'green');
                process.exit(0);
            }, 2000);
        });

        // Keep the script running
        await new Promise(() => {}); // Run forever until interrupted

    } catch (error) {
        log(`❌ Startup failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
