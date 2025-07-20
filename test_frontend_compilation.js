#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 TESTING FRONTEND COMPILATION');
console.log('=' * 50);

// Change to mobile-app directory
process.chdir(path.join(__dirname, 'mobile-app'));

console.log('📁 Current directory:', process.cwd());

// Test TypeScript compilation
console.log('🔧 Testing TypeScript compilation...');

const tsc = spawn('npx', ['tsc', '--noEmit'], {
  stdio: 'inherit',
  shell: true
});

tsc.on('close', (code) => {
  if (code === 0) {
    console.log('✅ TypeScript compilation successful');
    
    // Try to start Next.js dev server
    console.log('🚀 Starting Next.js dev server...');
    
    const nextDev = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Let it run for a few seconds then kill it
    setTimeout(() => {
      console.log('🛑 Stopping dev server...');
      nextDev.kill();
      process.exit(0);
    }, 10000);
    
  } else {
    console.log('❌ TypeScript compilation failed with code:', code);
    process.exit(1);
  }
});

tsc.on('error', (err) => {
  console.error('❌ Failed to start TypeScript compiler:', err);
  process.exit(1);
});
