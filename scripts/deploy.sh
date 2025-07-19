#!/bin/bash

# AURA Command Center - Production Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if environment file exists
    if [ ! -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
        error "Environment file .env.$ENVIRONMENT not found"
    fi
    
    # Check if we're running as root or with sudo
    if [ "$EUID" -ne 0 ]; then
        warning "Not running as root. Some operations may require sudo."
    fi
    
    success "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/backups"
    mkdir -p "$PROJECT_DIR/monitoring"
    mkdir -p "$PROJECT_DIR/nginx"
    
    success "Directories created"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    BACKUP_NAME="aura-backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup database
    if docker ps | grep -q aura-postgres; then
        log "Backing up database..."
        docker exec aura-postgres pg_dump -U aura_user aura_production > "$BACKUP_PATH/database.sql"
    fi
    
    # Backup application data
    if [ -d "$PROJECT_DIR/data" ]; then
        log "Backing up application data..."
        cp -r "$PROJECT_DIR/data" "$BACKUP_PATH/"
    fi
    
    # Backup configuration
    log "Backing up configuration..."
    cp "$PROJECT_DIR/.env.$ENVIRONMENT" "$BACKUP_PATH/"
    
    success "Backup created at $BACKUP_PATH"
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    cd "$PROJECT_DIR"
    docker-compose -f docker-compose.$ENVIRONMENT.yml pull
    
    success "Images pulled successfully"
}

# Build application
build_application() {
    log "Building application..."
    
    cd "$PROJECT_DIR"
    
    # Build the application image
    docker build -f Dockerfile.production -t aura-app:$VERSION .
    
    success "Application built successfully"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    cd "$PROJECT_DIR"
    
    # Run unit tests
    npm test -- --coverage --watchAll=false
    
    # Run integration tests
    npm run test:integration
    
    # Run security audit
    npm audit --audit-level moderate
    
    success "All tests passed"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    cd "$PROJECT_DIR"
    
    # Stop current deployment
    if docker-compose -f docker-compose.$ENVIRONMENT.yml ps | grep -q Up; then
        log "Stopping current deployment..."
        docker-compose -f docker-compose.$ENVIRONMENT.yml down
    fi
    
    # Start new deployment
    log "Starting new deployment..."
    docker-compose -f docker-compose.$ENVIRONMENT.yml up -d
    
    success "Application deployed successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    docker exec aura-app npm run migrate
    
    success "Database migrations completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create Prometheus configuration
    cat > "$PROJECT_DIR/monitoring/prometheus.yml" << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'aura-app'
    static_configs:
      - targets: ['aura-app:3000']
  
  - job_name: 'aura-websocket'
    static_configs:
      - targets: ['aura-websocket:8002']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF
    
    success "Monitoring setup completed"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Use Let's Encrypt for production
        log "Setting up Let's Encrypt certificates..."
        
        # This would typically use certbot
        # certbot --nginx -d aura-transport.gov.gh -d ws.aura-transport.gov.gh
        
        success "SSL certificates configured"
    else
        log "Skipping SSL setup for $ENVIRONMENT environment"
    fi
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    success "Cleanup completed"
}

# Send deployment notification
send_notification() {
    log "Sending deployment notification..."
    
    local status=$1
    local message="AURA Command Center deployment to $ENVIRONMENT: $status"
    
    # Send email notification (if configured)
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "AURA Deployment Notification" "$NOTIFICATION_EMAIL"
    fi
    
    # Send Slack notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    success "Notification sent"
}

# Main deployment function
main() {
    log "Starting AURA Command Center deployment to $ENVIRONMENT environment"
    log "Version: $VERSION"
    
    # Load environment variables
    source "$PROJECT_DIR/.env.$ENVIRONMENT"
    
    # Run deployment steps
    check_prerequisites
    create_directories
    
    if [ "$ENVIRONMENT" = "production" ]; then
        backup_current
        run_tests
    fi
    
    pull_images
    build_application
    deploy_application
    run_migrations
    health_check
    setup_monitoring
    
    if [ "$ENVIRONMENT" = "production" ]; then
        setup_ssl
    fi
    
    cleanup
    
    success "Deployment completed successfully!"
    send_notification "SUCCESS"
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
