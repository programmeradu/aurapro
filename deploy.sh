#!/bin/bash

# 🚀 AURA Command Center Deployment Script
# Simple deployment script for traditional web app hosting

set -e  # Exit on any error

echo "🚀 Starting AURA Command Center Deployment..."

# Configuration
APP_NAME="aura-command-center"
APP_DIR="/var/www/$APP_NAME"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="/var/log/$APP_NAME"
USER="www-data"
PYTHON_VERSION="3.9"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is not installed"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check Redis
    if ! command -v redis-cli &> /dev/null; then
        warn "Redis CLI not found. Please install Redis server"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    log "✅ System requirements check passed"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    # Update package list
    sudo apt update
    
    # Install required packages
    sudo apt install -y \
        python3-pip \
        python3-venv \
        nginx \
        redis-server \
        supervisor \
        curl \
        wget \
        unzip
    
    # Start and enable Redis
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    log "✅ System dependencies installed"
}

# Setup application directories
setup_directories() {
    log "Setting up application directories..."
    
    # Create application directory
    sudo mkdir -p $APP_DIR
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p /etc/$APP_NAME
    
    # Set permissions
    sudo chown -R $USER:$USER $APP_DIR
    sudo chown -R $USER:$USER $LOG_DIR
    
    log "✅ Directories created"
}

# Deploy backend
deploy_backend() {
    log "Deploying backend..."
    
    # Copy backend files
    cp -r backend/* $BACKEND_DIR/
    
    # Create virtual environment
    cd $BACKEND_DIR
    python3 -m venv venv
    source venv/bin/activate
    
    # Install Python dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Install additional dependencies for rate limiting
    pip install redis fastapi uvicorn python-multipart
    
    # Create environment file
    cat > .env << EOF
# AURA Command Center Environment Configuration
FLASK_ENV=production
DEBUG=False

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_RATE_LIMIT_DB=1

# Rate Limiting
RATE_LIMIT_ENABLE=true
DDOS_PROTECTION_ENABLE=true

# Security
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Database
DATABASE_URL=sqlite:///aura.db

# Logging
LOG_LEVEL=INFO
LOG_FILE=$LOG_DIR/backend.log
EOF
    
    # Set permissions
    chmod 600 .env
    
    log "✅ Backend deployed"
}

# Deploy frontend
deploy_frontend() {
    log "Deploying frontend..."
    
    # Copy frontend files
    cp -r src/* $FRONTEND_DIR/
    
    # Install Node.js dependencies
    cd $FRONTEND_DIR
    npm install
    
    # Build production version
    npm run build
    
    log "✅ Frontend deployed"
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << EOF
server {
    listen 80;
    server_name localhost;
    
    # Frontend static files
    location / {
        root $FRONTEND_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Rate limiting headers
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Restart Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log "✅ Nginx configured"
}

# Configure Supervisor for process management
configure_supervisor() {
    log "Configuring Supervisor..."
    
    # Create Supervisor configuration
    sudo tee /etc/supervisor/conf.d/$APP_NAME.conf > /dev/null << EOF
[program:aura-backend]
command=$BACKEND_DIR/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
directory=$BACKEND_DIR
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/backend.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=5
environment=PATH="$BACKEND_DIR/venv/bin"

[program:aura-redis]
command=redis-server
user=redis
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/redis.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=5
EOF
    
    # Update Supervisor
    sudo supervisorctl reread
    sudo supervisorctl update
    
    log "✅ Supervisor configured"
}

# Setup log rotation
setup_logging() {
    log "Setting up log rotation..."
    
    # Create logrotate configuration
    sudo tee /etc/logrotate.d/$APP_NAME > /dev/null << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        supervisorctl restart aura-backend
    endscript
}
EOF
    
    log "✅ Log rotation configured"
}

# Create backup script
create_backup_script() {
    log "Creating backup script..."
    
    sudo tee /usr/local/bin/aura-backup > /dev/null << 'EOF'
#!/bin/bash

# AURA Command Center Backup Script
BACKUP_DIR="/var/backups/aura"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/aura-command-center"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $APP_DIR/backend/aura.db $BACKUP_DIR/aura_db_$DATE.db

# Backup configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C $APP_DIR backend/.env

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz -C /var/log aura-command-center/

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF
    
    sudo chmod +x /usr/local/bin/aura-backup
    
    # Add to crontab for daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/aura-backup") | crontab -
    
    log "✅ Backup script created"
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start Redis
    sudo systemctl start redis-server
    
    # Start Supervisor programs
    sudo supervisorctl start aura-backend
    
    # Start Nginx
    sudo systemctl start nginx
    
    # Check service status
    sleep 5
    
    if sudo supervisorctl status aura-backend | grep -q "RUNNING"; then
        log "✅ Backend service is running"
    else
        error "Backend service failed to start"
    fi
    
    if sudo systemctl is-active --quiet nginx; then
        log "✅ Nginx is running"
    else
        error "Nginx failed to start"
    fi
    
    if sudo systemctl is-active --quiet redis-server; then
        log "✅ Redis is running"
    else
        error "Redis failed to start"
    fi
}

# Test deployment
test_deployment() {
    log "Testing deployment..."
    
    # Test backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log "✅ Backend health check passed"
    else
        warn "Backend health check failed"
    fi
    
    # Test frontend
    if curl -f http://localhost/ > /dev/null 2>&1; then
        log "✅ Frontend is accessible"
    else
        warn "Frontend accessibility check failed"
    fi
    
    # Test Redis
    if redis-cli ping | grep -q "PONG"; then
        log "✅ Redis is responding"
    else
        warn "Redis connectivity check failed"
    fi
}

# Main deployment function
main() {
    log "🚀 AURA Command Center Deployment Starting..."
    
    check_root
    check_requirements
    install_dependencies
    setup_directories
    deploy_backend
    deploy_frontend
    configure_nginx
    configure_supervisor
    setup_logging
    create_backup_script
    start_services
    test_deployment
    
    log "🎉 Deployment completed successfully!"
    log "📊 Access your AURA Command Center at: http://localhost"
    log "📈 Backend API available at: http://localhost/api"
    log "🔧 Monitor services with: sudo supervisorctl status"
    log "📝 View logs at: $LOG_DIR"
}

# Run main function
main "$@"
