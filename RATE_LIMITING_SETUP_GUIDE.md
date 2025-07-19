# 🛡️ AURA Rate Limiting & DDoS Protection Setup Guide

## **Overview**
This guide covers the setup and configuration of the advanced rate limiting and DDoS protection system for the AURA Command Center.

---

## **🔧 Prerequisites**

### **1. Redis Installation**

#### **Windows**
```bash
# Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
# Or use Windows Subsystem for Linux (WSL):
wsl --install
# Then in WSL:
sudo apt update
sudo apt install redis-server
redis-server --daemonize yes
```

#### **macOS**
```bash
# Using Homebrew
brew install redis
brew services start redis
```

#### **Linux (Ubuntu/Debian)**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### **2. Python Dependencies**
```bash
pip install redis fastapi starlette
```

---

## **⚙️ Configuration**

### **1. Environment Variables**
Create a `.env` file in your backend directory:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here
REDIS_RATE_LIMIT_DB=1

# Rate Limiting Settings
RATE_LIMIT_ENABLE=true
DDOS_PROTECTION_ENABLE=true
RATE_LIMIT_WEBHOOK_URL=https://your-webhook-url.com/alerts
RATE_LIMIT_EMAIL_ALERTS=admin@yourdomain.com,security@yourdomain.com

# Environment
FLASK_ENV=production
```

### **2. Redis Configuration**
Edit your Redis configuration file (`/etc/redis/redis.conf` on Linux):

```conf
# Memory optimization
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (optional for rate limiting)
save 900 1
save 300 10
save 60 10000

# Security
requirepass your_redis_password_here
bind 127.0.0.1

# Performance
tcp-keepalive 300
timeout 0
```

---

## **🚀 Installation Steps**

### **1. Copy Rate Limiting Files**
Ensure these files are in your backend directory:
- `middleware/fastapi_rate_limiter.py`
- `config/rateLimits.py`
- `config/redis_setup.py`

### **2. Update Main Application**
The rate limiting middleware has been integrated into `backend/main.py`:

```python
# Rate limiting middleware is automatically added
app.add_middleware(RateLimitMiddleware, redis_url="redis://localhost:6379/1")
```

### **3. Test Redis Connection**
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis databases
redis-cli info keyspace
```

### **4. Start Redis Server**
```bash
# Windows (if using WSL)
wsl
redis-server --daemonize yes

# macOS
brew services start redis

# Linux
sudo systemctl start redis-server
```

### **5. Start the Application**
```bash
cd backend
python main.py

# Or if using uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## **📊 Monitoring and Management**

### **1. Rate Limiting Metrics Endpoint**
```http
GET /api/v1/admin/rate-limit-metrics?time_range=60
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_requests": 1250,
    "allowed_requests": 1180,
    "blocked_requests": 70,
    "block_rate": 0.056,
    "banned_ips_count": 3,
    "endpoints": {
      "/api/v1/auth/login": 45,
      "/api/v1/vehicles": 320,
      "/api/v1/traffic/live": 180
    },
    "ddos_metrics": {
      "active_ddos_detections": 0,
      "recent_burst_detections": 2
    }
  }
}
```

### **2. Security Status Endpoint**
```http
GET /api/v1/admin/security-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_status": "healthy",
    "alerts": [],
    "metrics": {
      "total_requests": 150,
      "blocked_requests": 5
    }
  }
}
```

### **3. Unban IP Address**
```http
POST /api/v1/admin/unban-ip
Content-Type: application/json

{
  "ip_address": "192.168.1.100",
  "reason": "False positive - legitimate user"
}
```

---

## **🔧 Rate Limiting Configuration**

### **Default Rate Limits**

#### **Global Limits**
- **Default:** 1000 requests per hour
- **Burst Protection:** 50 requests per minute

#### **User Role Limits (per hour)**
- **Super Admin:** 2000 requests
- **Admin:** 1500 requests
- **Fleet Manager:** 1000 requests
- **Dispatcher:** 800 requests
- **Analyst:** 600 requests
- **Maintenance:** 400 requests
- **Driver:** 200 requests
- **Viewer:** 100 requests

#### **Endpoint-Specific Limits**
- **Login:** 5 attempts per 15 minutes
- **Registration:** 3 attempts per hour
- **Route Optimization:** 50 requests per hour
- **Traffic Data:** 200 requests per hour
- **Vehicle Data:** 300 requests per hour

### **DDoS Protection Settings**
- **RPS Threshold:** 50 requests per second
- **Burst Detection:** 100 unique IPs in 60 seconds
- **Auto-ban Duration:** 1 hour
- **Suspicious Patterns:** Automatic detection of bot traffic

---

## **🛠️ Customization**

### **1. Modify Rate Limits**
Edit `config/rateLimits.py`:

```python
# Custom endpoint limits
ENDPOINT_LIMITS = {
    '/api/v1/custom-endpoint': {
        'requests': 100,
        'window': 3600,
        'description': 'Custom endpoint limit'
    }
}
```

### **2. Add Custom User Roles**
```python
USER_ROLE_LIMITS = {
    'custom_role': {
        'requests': 750,
        'window': 3600,
        'description': 'Custom role access'
    }
}
```

### **3. Whitelist IPs**
```python
DDOS_PROTECTION = {
    'whitelist_ips': [
        '192.168.1.0/24',  # Local network
        '10.0.0.0/8',      # Private network
        '203.0.113.0/24'   # Trusted external network
    ]
}
```

---

## **🔍 Troubleshooting**

### **Common Issues**

#### **1. Redis Connection Failed**
```bash
# Check Redis status
sudo systemctl status redis-server

# Check Redis logs
sudo journalctl -u redis-server -f

# Test connection
redis-cli ping
```

#### **2. High Memory Usage**
```bash
# Check Redis memory usage
redis-cli info memory

# Clear expired keys
redis-cli --scan --pattern "rate_limit:*" | xargs redis-cli del
```

#### **3. Rate Limiting Not Working**
```python
# Check middleware order in main.py
# Rate limiting middleware should be added before CORS

app.add_middleware(RateLimitMiddleware)  # First
app.add_middleware(CORSMiddleware)       # Second
```

#### **4. False Positive Bans**
```bash
# Unban IP via Redis CLI
redis-cli del "banned:192.168.1.100"

# Or use the API endpoint
curl -X POST http://localhost:8000/api/v1/admin/unban-ip \
  -H "Content-Type: application/json" \
  -d '{"ip_address": "192.168.1.100"}'
```

---

## **📈 Performance Optimization**

### **1. Redis Optimization**
```conf
# Increase max connections
tcp-backlog 511

# Optimize for rate limiting workload
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
```

### **2. Application Optimization**
```python
# Use connection pooling
REDIS_CONNECTION_POOL_SETTINGS = {
    'max_connections': 50,
    'retry_on_timeout': True,
    'socket_timeout': 5
}
```

### **3. Monitoring Setup**
```bash
# Monitor Redis performance
redis-cli --latency-history -i 1

# Monitor memory usage
watch -n 1 'redis-cli info memory | grep used_memory_human'
```

---

## **🔐 Security Best Practices**

### **1. Redis Security**
- Use strong passwords
- Bind to localhost only
- Enable AUTH
- Disable dangerous commands

### **2. Rate Limiting Security**
- Regularly review banned IPs
- Monitor for false positives
- Adjust limits based on traffic patterns
- Set up alerting for security events

### **3. Application Security**
- Use HTTPS in production
- Implement proper authentication
- Log security events
- Regular security audits

---

## **📊 Monitoring Dashboard**

### **Key Metrics to Monitor**
1. **Request Volume:** Total requests per hour
2. **Block Rate:** Percentage of blocked requests
3. **Banned IPs:** Number of currently banned IPs
4. **DDoS Detections:** Active DDoS protection triggers
5. **Redis Performance:** Memory usage and response times

### **Alerting Thresholds**
- **High Block Rate:** >10% of requests blocked
- **DDoS Attacks:** >5 attacks per hour
- **Banned IPs:** >50 IPs banned per hour
- **Redis Memory:** >80% memory usage

---

## **✅ Verification Checklist**

- [ ] Redis server is running and accessible
- [ ] Rate limiting middleware is properly integrated
- [ ] Environment variables are configured
- [ ] Test endpoints return rate limit headers
- [ ] DDoS protection triggers correctly
- [ ] Monitoring endpoints are accessible
- [ ] Banned IP management works
- [ ] Logs show rate limiting activity

---

**Setup Complete!** 🎉

Your AURA Command Center now has enterprise-grade rate limiting and DDoS protection. Monitor the metrics endpoints regularly and adjust limits based on your traffic patterns.
