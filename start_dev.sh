#!/bin/bash

# 🚀 AURA Command Center Development Startup Script
# Simple script to start the application in development mode

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

# Check if Redis is running
check_redis() {
    log "Checking Redis connection..."
    
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            log "✅ Redis is running"
        else
            warn "Redis is not responding. Attempting to start..."
            start_redis
        fi
    else
        error "Redis CLI not found. Please install Redis server"
    fi
}

# Start Redis server
start_redis() {
    if command -v redis-server &> /dev/null; then
        log "Starting Redis server..."
        
        # Try to start Redis in background
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew services start redis
            else
                redis-server --daemonize yes
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            if systemctl is-active --quiet redis-server; then
                log "Redis is already running via systemd"
            else
                sudo systemctl start redis-server || redis-server --daemonize yes
            fi
        else
            # Windows/WSL or other
            redis-server --daemonize yes
        fi
        
        # Wait a moment for Redis to start
        sleep 2
        
        if redis-cli ping &> /dev/null; then
            log "✅ Redis started successfully"
        else
            error "Failed to start Redis"
        fi
    else
        error "Redis server not found. Please install Redis"
    fi
}

# Setup Python virtual environment
setup_venv() {
    log "Setting up Python virtual environment..."
    
    cd backend
    
    if [ ! -d "venv" ]; then
        log "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    log "Activating virtual environment..."
    source venv/bin/activate
    
    log "Installing/updating dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    log "✅ Virtual environment ready"
}

# Setup environment variables
setup_env() {
    log "Setting up environment variables..."
    
    if [ ! -f "backend/.env" ]; then
        log "Creating .env file..."
        cat > backend/.env << EOF
# AURA Command Center Development Environment
FLASK_ENV=development
DEBUG=True

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_RATE_LIMIT_DB=1

# Rate Limiting (Relaxed for development)
RATE_LIMIT_ENABLE=true
DDOS_PROTECTION_ENABLE=false

# Security (Development keys - change in production!)
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production

# Database
DATABASE_URL=sqlite:///aura_dev.db

# Logging
LOG_LEVEL=DEBUG
LOG_FILE=logs/backend.log

# Development settings
RELOAD=true
HOST=0.0.0.0
PORT=8000
EOF
        log "✅ Environment file created"
    else
        log "✅ Environment file already exists"
    fi
}

# Initialize database
init_database() {
    log "Initializing database..."
    
    cd backend
    source venv/bin/activate
    
    # Create logs directory
    mkdir -p logs
    
    # Run any database initialization scripts
    if [ -f "init_db.py" ]; then
        python init_db.py
    fi
    
    log "✅ Database initialized"
}

# Start backend server
start_backend() {
    log "Starting backend server..."
    
    cd backend
    source venv/bin/activate
    
    # Start the FastAPI server
    info "🚀 Starting AURA Command Center Backend..."
    info "📊 API will be available at: http://localhost:8000"
    info "📚 API docs will be available at: http://localhost:8000/docs"
    info "🔧 Rate limiting metrics: http://localhost:8000/api/v1/admin/rate-limit-metrics"
    info "🛡️ Security status: http://localhost:8000/api/v1/admin/security-status"
    echo ""
    info "Press Ctrl+C to stop the server"
    echo ""
    
    # Start with uvicorn
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

# Start frontend (if available)
start_frontend() {
    if [ -d "frontend" ] || [ -d "src" ]; then
        log "Frontend directory found. Starting frontend..."
        
        # Determine frontend directory
        FRONTEND_DIR="src"
        if [ -d "frontend" ]; then
            FRONTEND_DIR="frontend"
        fi
        
        cd $FRONTEND_DIR
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            log "Installing frontend dependencies..."
            npm install
        fi
        
        # Start development server
        info "🎨 Starting frontend development server..."
        info "🌐 Frontend will be available at: http://localhost:3000"
        
        npm run dev &
        FRONTEND_PID=$!
        
        cd ..
        log "✅ Frontend started (PID: $FRONTEND_PID)"
    else
        warn "No frontend directory found. Skipping frontend startup."
    fi
}

# Cleanup function
cleanup() {
    log "Shutting down services..."
    
    # Kill frontend if it was started
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        log "Frontend stopped"
    fi
    
    log "Backend stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main function
main() {
    echo ""
    log "🚀 AURA Command Center Development Startup"
    echo ""
    
    # Check system requirements
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is not installed"
    fi
    
    if ! command -v node &> /dev/null; then
        warn "Node.js not found. Frontend will not be available."
    fi
    
    # Setup and start services
    check_redis
    setup_venv
    setup_env
    init_database
    
    # Start frontend in background if available
    if command -v node &> /dev/null; then
        start_frontend
    fi
    
    # Start backend (this will block)
    start_backend
}

# Help function
show_help() {
    echo "AURA Command Center Development Startup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --backend-only Start only the backend server"
    echo "  --setup-only   Only setup environment, don't start servers"
    echo ""
    echo "Examples:"
    echo "  $0                 # Start full development environment"
    echo "  $0 --backend-only  # Start only backend"
    echo "  $0 --setup-only    # Setup environment only"
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --backend-only)
        log "Starting backend only..."
        check_redis
        setup_venv
        setup_env
        init_database
        start_backend
        ;;
    --setup-only)
        log "Setting up environment only..."
        check_redis
        setup_venv
        setup_env
        init_database
        log "✅ Setup complete. Run '$0' to start servers."
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1. Use --help for usage information."
        ;;
esac
