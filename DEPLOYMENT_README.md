# 🚀 AURA Command Center - Simple Deployment Guide

## **Quick Start (Development)**

### **1. Prerequisites**
- Python 3.9+ installed
- Node.js 16+ installed (for frontend)
- Redis server installed
- Git installed

### **2. Clone and Start**
```bash
# Clone the repository
git clone <your-repo-url>
cd aura

# Start development environment (automatic setup)
./start_dev.sh
```

That's it! The script will:
- ✅ Check and start Redis
- ✅ Create Python virtual environment
- ✅ Install all dependencies
- ✅ Setup environment variables
- ✅ Start backend server at http://localhost:8000
- ✅ Start frontend server at http://localhost:3000 (if available)

---

## **Manual Setup (If Needed)**

### **1. Install Redis**

#### **Windows**
```bash
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use WSL:
wsl --install
sudo apt update && sudo apt install redis-server
redis-server --daemonize yes
```

#### **macOS**
```bash
brew install redis
brew services start redis
```

#### **Linux**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

### **2. Setup Backend**
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### **3. Setup Frontend (Optional)**
```bash
cd src  # or frontend directory

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## **Production Deployment**

### **1. Automated Production Deployment**
```bash
# Run the deployment script (requires sudo for system setup)
sudo ./deploy.sh
```

This will:
- ✅ Install system dependencies (Nginx, Supervisor, etc.)
- ✅ Setup application directories
- ✅ Configure production environment
- ✅ Setup process management
- ✅ Configure reverse proxy
- ✅ Setup logging and backups
- ✅ Start all services

### **2. Manual Production Setup**

#### **Install System Dependencies**
```bash
sudo apt update
sudo apt install -y python3-pip python3-venv nginx redis-server supervisor
```

#### **Setup Application**
```bash
# Create application directory
sudo mkdir -p /var/www/aura-command-center
sudo chown $USER:$USER /var/www/aura-command-center

# Copy files
cp -r backend /var/www/aura-command-center/
cp -r src /var/www/aura-command-center/frontend/

# Setup backend
cd /var/www/aura-command-center/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/aura
# Copy configuration from deploy.sh

sudo ln -s /etc/nginx/sites-available/aura /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### **Configure Supervisor**
```bash
sudo nano /etc/supervisor/conf.d/aura.conf
# Copy configuration from deploy.sh

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start aura-backend
```

---

## **Environment Configuration**

### **Development (.env)**
```env
FLASK_ENV=development
DEBUG=True
REDIS_HOST=localhost
REDIS_PORT=6379
RATE_LIMIT_ENABLE=true
DDOS_PROTECTION_ENABLE=false
```

### **Production (.env)**
```env
FLASK_ENV=production
DEBUG=False
REDIS_HOST=localhost
REDIS_PORT=6379
RATE_LIMIT_ENABLE=true
DDOS_PROTECTION_ENABLE=true
SECRET_KEY=your-secure-secret-key
JWT_SECRET_KEY=your-secure-jwt-key
```

---

## **Service Management**

### **Development**
```bash
# Start development environment
./start_dev.sh

# Start backend only
./start_dev.sh --backend-only

# Setup environment only
./start_dev.sh --setup-only
```

### **Production**
```bash
# Check service status
sudo supervisorctl status

# Restart backend
sudo supervisorctl restart aura-backend

# View logs
sudo tail -f /var/log/aura-command-center/backend.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## **Monitoring & Maintenance**

### **Health Checks**
- **Backend Health:** http://localhost:8000/health
- **API Documentation:** http://localhost:8000/docs
- **Rate Limiting Metrics:** http://localhost:8000/api/v1/admin/rate-limit-metrics
- **Security Status:** http://localhost:8000/api/v1/admin/security-status

### **Log Files**
- **Backend:** `/var/log/aura-command-center/backend.log`
- **Nginx:** `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **Redis:** `/var/log/redis/redis-server.log`

### **Backup**
```bash
# Manual backup
sudo /usr/local/bin/aura-backup

# Backups are stored in: /var/backups/aura/
```

---

## **Troubleshooting**

### **Common Issues**

#### **Redis Connection Failed**
```bash
# Check Redis status
redis-cli ping

# Start Redis
sudo systemctl start redis-server
# or
redis-server --daemonize yes
```

#### **Backend Won't Start**
```bash
# Check logs
sudo tail -f /var/log/aura-command-center/backend.log

# Check if port is in use
sudo netstat -tlnp | grep :8000

# Restart backend
sudo supervisorctl restart aura-backend
```

#### **Frontend Build Issues**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 16+
```

#### **Permission Issues**
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/aura-command-center
sudo chown -R $USER:$USER /var/log/aura-command-center
```

### **Performance Issues**
```bash
# Check Redis memory usage
redis-cli info memory

# Check system resources
htop
df -h

# Monitor backend performance
curl http://localhost:8000/api/v1/admin/rate-limit-metrics
```

---

## **Security Checklist**

### **Production Security**
- [ ] Change default secret keys
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure firewall (UFW)
- [ ] Set up fail2ban
- [ ] Regular security updates
- [ ] Monitor rate limiting metrics
- [ ] Review banned IPs regularly

### **Basic Firewall Setup**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 8000  # Block direct backend access
```

---

## **Development vs Production**

| Feature | Development | Production |
|---------|-------------|------------|
| **Debug Mode** | Enabled | Disabled |
| **Rate Limiting** | Relaxed | Strict |
| **DDoS Protection** | Disabled | Enabled |
| **HTTPS** | Optional | Required |
| **Process Management** | Manual | Supervisor |
| **Web Server** | Uvicorn | Nginx + Uvicorn |
| **Logging** | Console | Files + Rotation |
| **Backups** | Manual | Automated |

---

## **Quick Commands Reference**

```bash
# Development
./start_dev.sh                    # Start everything
./start_dev.sh --backend-only     # Backend only
redis-cli ping                    # Test Redis

# Production
sudo supervisorctl status         # Check services
sudo supervisorctl restart aura-backend  # Restart backend
sudo systemctl restart nginx     # Restart web server
sudo /usr/local/bin/aura-backup  # Manual backup

# Monitoring
curl http://localhost/health      # Health check
curl http://localhost/api/v1/admin/rate-limit-metrics  # Metrics
sudo tail -f /var/log/aura-command-center/backend.log  # Logs
```

---

**🎉 Your AURA Command Center is now ready for deployment!**

For support or questions, check the logs first, then refer to the troubleshooting section above.
