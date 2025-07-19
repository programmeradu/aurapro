"""
🛡️ Advanced Rate Limiting & DDoS Protection Middleware
Comprehensive protection against abuse, spam, and DDoS attacks
"""

import time
import json
import redis
import hashlib
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
import logging

logger = logging.getLogger(__name__)

class RateLimitConfig:
    """Rate limiting configuration for different endpoints and user types"""
    
    # Default rate limits (requests per time window)
    DEFAULT_LIMITS = {
        'global': {'requests': 1000, 'window': 3600},  # 1000 requests per hour
        'per_ip': {'requests': 100, 'window': 3600},   # 100 requests per hour per IP
        'per_user': {'requests': 500, 'window': 3600}, # 500 requests per hour per user
        'login': {'requests': 5, 'window': 900},       # 5 login attempts per 15 minutes
        'api_key': {'requests': 10000, 'window': 3600} # 10k requests per hour for API keys
    }
    
    # Endpoint-specific rate limits
    ENDPOINT_LIMITS = {
        '/api/v1/auth/login': {'requests': 5, 'window': 900},
        '/api/v1/auth/register': {'requests': 3, 'window': 3600},
        '/api/v1/optimize/routes': {'requests': 50, 'window': 3600},
        '/api/v1/maintenance/predict': {'requests': 100, 'window': 3600},
        '/api/v1/traffic/live': {'requests': 200, 'window': 3600},
        '/api/v1/vehicles': {'requests': 300, 'window': 3600},
        '/api/v1/routes': {'requests': 200, 'window': 3600}
    }
    
    # User role-based limits
    ROLE_LIMITS = {
        'super_admin': {'requests': 2000, 'window': 3600},
        'admin': {'requests': 1500, 'window': 3600},
        'fleet_manager': {'requests': 1000, 'window': 3600},
        'dispatcher': {'requests': 800, 'window': 3600},
        'analyst': {'requests': 600, 'window': 3600},
        'maintenance': {'requests': 400, 'window': 3600},
        'driver': {'requests': 200, 'window': 3600},
        'viewer': {'requests': 100, 'window': 3600}
    }

class RateLimiter:
    """Advanced rate limiter with Redis backend and DDoS protection"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client or redis.Redis(
            host='localhost', 
            port=6379, 
            db=1,  # Use separate DB for rate limiting
            decode_responses=True
        )
        self.config = RateLimitConfig()
        
        # DDoS detection thresholds
        self.ddos_thresholds = {
            'requests_per_second': 50,      # 50 requests per second triggers DDoS detection
            'unique_ips_threshold': 100,    # 100 unique IPs in burst triggers detection
            'burst_window': 60,             # 1 minute window for burst detection
            'ban_duration': 3600            # 1 hour ban for DDoS sources
        }
        
        # Suspicious patterns
        self.suspicious_patterns = [
            'bot', 'crawler', 'spider', 'scraper', 'hack', 'attack',
            'injection', 'xss', 'sql', 'script', 'exploit'
        ]

    def get_client_identifier(self) -> str:
        """Get unique identifier for the client"""
        # Try to get user ID if authenticated
        user_id = getattr(g, 'user_id', None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        ip = self.get_client_ip()
        return f"ip:{ip}"

    def get_client_ip(self) -> str:
        """Get client IP address, handling proxies and load balancers"""
        # Check for forwarded IP headers
        forwarded_ips = request.headers.get('X-Forwarded-For')
        if forwarded_ips:
            # Take the first IP in the chain
            return forwarded_ips.split(',')[0].strip()
        
        # Check other common headers
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip
        
        # Fall back to remote address
        return request.remote_addr or 'unknown'

    def get_rate_limit_key(self, identifier: str, endpoint: str = None) -> str:
        """Generate Redis key for rate limiting"""
        current_window = int(time.time() // 3600)  # Hour-based window
        if endpoint:
            return f"rate_limit:{identifier}:{endpoint}:{current_window}"
        return f"rate_limit:{identifier}:{current_window}"

    def get_applicable_limits(self, endpoint: str) -> Dict:
        """Get applicable rate limits for the current request"""
        # Start with default limits
        limits = self.config.DEFAULT_LIMITS['per_ip'].copy()
        
        # Check for endpoint-specific limits
        if endpoint in self.config.ENDPOINT_LIMITS:
            limits.update(self.config.ENDPOINT_LIMITS[endpoint])
        
        # Check for user role-based limits
        user_role = getattr(g, 'user_role', None)
        if user_role and user_role in self.config.ROLE_LIMITS:
            role_limits = self.config.ROLE_LIMITS[user_role]
            # Use the higher limit between role and endpoint
            if role_limits['requests'] > limits['requests']:
                limits.update(role_limits)
        
        return limits

    def is_request_allowed(self, identifier: str, endpoint: str) -> Tuple[bool, Dict]:
        """Check if request is allowed and return rate limit info"""
        limits = self.get_applicable_limits(endpoint)
        
        # Generate rate limit key
        key = self.get_rate_limit_key(identifier, endpoint)
        
        try:
            # Get current request count
            current_count = self.redis.get(key)
            current_count = int(current_count) if current_count else 0
            
            # Check if limit exceeded
            if current_count >= limits['requests']:
                # Get TTL for reset time
                ttl = self.redis.ttl(key)
                reset_time = datetime.now() + timedelta(seconds=ttl) if ttl > 0 else None
                
                return False, {
                    'allowed': False,
                    'limit': limits['requests'],
                    'remaining': 0,
                    'reset_time': reset_time.isoformat() if reset_time else None,
                    'retry_after': ttl
                }
            
            # Increment counter
            pipe = self.redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, limits['window'])
            pipe.execute()
            
            remaining = limits['requests'] - (current_count + 1)
            
            return True, {
                'allowed': True,
                'limit': limits['requests'],
                'remaining': remaining,
                'reset_time': (datetime.now() + timedelta(seconds=limits['window'])).isoformat()
            }
            
        except redis.RedisError as e:
            logger.error(f"Redis error in rate limiting: {e}")
            # Fail open - allow request if Redis is down
            return True, {
                'allowed': True,
                'limit': limits['requests'],
                'remaining': limits['requests'] - 1,
                'error': 'Rate limiting service unavailable'
            }

    def detect_ddos_patterns(self, ip: str) -> bool:
        """Detect potential DDoS attacks"""
        current_time = int(time.time())
        
        # Check requests per second
        rps_key = f"ddos:rps:{ip}:{current_time}"
        rps_count = self.redis.incr(rps_key)
        self.redis.expire(rps_key, 1)  # 1 second expiry
        
        if rps_count > self.ddos_thresholds['requests_per_second']:
            logger.warning(f"DDoS detected: {ip} exceeded RPS threshold ({rps_count} req/s)")
            return True
        
        # Check burst patterns
        burst_key = f"ddos:burst:{current_time // self.ddos_thresholds['burst_window']}"
        self.redis.sadd(burst_key, ip)
        self.redis.expire(burst_key, self.ddos_thresholds['burst_window'])
        
        unique_ips = self.redis.scard(burst_key)
        if unique_ips > self.ddos_thresholds['unique_ips_threshold']:
            logger.warning(f"DDoS burst detected: {unique_ips} unique IPs in burst window")
            return True
        
        return False

    def is_suspicious_request(self) -> bool:
        """Detect suspicious request patterns"""
        user_agent = request.headers.get('User-Agent', '').lower()
        
        # Check for suspicious user agents
        for pattern in self.suspicious_patterns:
            if pattern in user_agent:
                return True
        
        # Check for missing or suspicious headers
        if not user_agent or len(user_agent) < 10:
            return True
        
        # Check for suspicious query parameters
        for param in request.args:
            param_lower = param.lower()
            if any(suspicious in param_lower for suspicious in ['script', 'union', 'select', 'drop']):
                return True
        
        return False

    def ban_ip(self, ip: str, duration: int = None) -> None:
        """Ban an IP address for specified duration"""
        duration = duration or self.ddos_thresholds['ban_duration']
        ban_key = f"banned:{ip}"
        
        self.redis.setex(ban_key, duration, json.dumps({
            'banned_at': datetime.now().isoformat(),
            'reason': 'DDoS protection',
            'duration': duration
        }))
        
        logger.warning(f"IP {ip} banned for {duration} seconds due to DDoS protection")

    def is_ip_banned(self, ip: str) -> Tuple[bool, Optional[Dict]]:
        """Check if IP is banned"""
        ban_key = f"banned:{ip}"
        ban_info = self.redis.get(ban_key)
        
        if ban_info:
            try:
                ban_data = json.loads(ban_info)
                ttl = self.redis.ttl(ban_key)
                ban_data['remaining_seconds'] = ttl
                return True, ban_data
            except json.JSONDecodeError:
                # Invalid ban data, remove it
                self.redis.delete(ban_key)
        
        return False, None

    def log_request_metrics(self, identifier: str, endpoint: str, allowed: bool) -> None:
        """Log request metrics for monitoring"""
        timestamp = int(time.time())
        
        # Log to Redis for real-time monitoring
        metrics_key = f"metrics:{timestamp // 60}"  # Per-minute metrics
        
        pipe = self.redis.pipeline()
        pipe.hincrby(metrics_key, 'total_requests', 1)
        pipe.hincrby(metrics_key, 'allowed_requests' if allowed else 'blocked_requests', 1)
        pipe.hincrby(metrics_key, f'endpoint:{endpoint}', 1)
        pipe.expire(metrics_key, 3600)  # Keep metrics for 1 hour
        pipe.execute()

# Rate limiting decorators
def rate_limit(requests_per_hour: int = None, per_user: bool = True):
    """Decorator for applying rate limits to specific endpoints"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            limiter = RateLimiter()
            
            # Get client identifier
            if per_user:
                identifier = limiter.get_client_identifier()
            else:
                identifier = f"ip:{limiter.get_client_ip()}"
            
            # Get endpoint
            endpoint = request.endpoint or request.path
            
            # Check if request is allowed
            allowed, rate_info = limiter.is_request_allowed(identifier, endpoint)
            
            # Log metrics
            limiter.log_request_metrics(identifier, endpoint, allowed)
            
            if not allowed:
                response = jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Limit: {rate_info["limit"]} per hour',
                    'rate_limit': rate_info
                })
                response.status_code = 429
                response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
                response.headers['X-RateLimit-Remaining'] = str(rate_info['remaining'])
                if rate_info.get('retry_after'):
                    response.headers['Retry-After'] = str(rate_info['retry_after'])
                return response
            
            # Add rate limit headers to successful responses
            response = f(*args, **kwargs)
            if hasattr(response, 'headers'):
                response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
                response.headers['X-RateLimit-Remaining'] = str(rate_info['remaining'])
            
            return response
        return decorated_function
    return decorator

def ddos_protection():
    """Decorator for DDoS protection"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            limiter = RateLimiter()
            ip = limiter.get_client_ip()
            
            # Check if IP is banned
            is_banned, ban_info = limiter.is_ip_banned(ip)
            if is_banned:
                response = jsonify({
                    'error': 'Access denied',
                    'message': 'Your IP has been temporarily banned due to suspicious activity',
                    'ban_info': ban_info
                })
                response.status_code = 403
                return response
            
            # Check for suspicious patterns
            if limiter.is_suspicious_request():
                logger.warning(f"Suspicious request from {ip}: {request.url}")
                # Don't ban immediately, but log for monitoring
            
            # Check for DDoS patterns
            if limiter.detect_ddos_patterns(ip):
                limiter.ban_ip(ip)
                response = jsonify({
                    'error': 'Access denied',
                    'message': 'DDoS protection activated. Your IP has been temporarily banned.'
                })
                response.status_code = 403
                return response
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Global rate limiting middleware
class GlobalRateLimitMiddleware:
    """Global middleware for applying rate limiting to all requests"""
    
    def __init__(self, app=None):
        self.app = app
        self.limiter = RateLimiter()
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """Apply rate limiting before each request"""
        # Skip rate limiting for static files and health checks
        if request.path.startswith('/static') or request.path == '/health':
            return
        
        ip = self.limiter.get_client_ip()
        
        # Check if IP is banned
        is_banned, ban_info = self.limiter.is_ip_banned(ip)
        if is_banned:
            return jsonify({
                'error': 'Access denied',
                'message': 'Your IP has been temporarily banned',
                'ban_info': ban_info
            }), 403
        
        # Apply global rate limiting
        identifier = self.limiter.get_client_identifier()
        allowed, rate_info = self.limiter.is_request_allowed(identifier, 'global')
        
        if not allowed:
            return jsonify({
                'error': 'Global rate limit exceeded',
                'message': 'Too many requests from your IP/account',
                'rate_limit': rate_info
            }), 429
        
        # Store rate info for response headers
        g.rate_limit_info = rate_info
    
    def after_request(self, response):
        """Add rate limiting headers to response"""
        if hasattr(g, 'rate_limit_info'):
            rate_info = g.rate_limit_info
            response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
            response.headers['X-RateLimit-Remaining'] = str(rate_info['remaining'])
        
        return response

# Usage examples and configuration
def setup_rate_limiting(app):
    """Setup rate limiting for the Flask app"""
    
    # Initialize global middleware
    GlobalRateLimitMiddleware(app)
    
    # Configure Redis connection
    redis_client = redis.Redis(
        host=app.config.get('REDIS_HOST', 'localhost'),
        port=app.config.get('REDIS_PORT', 6379),
        db=app.config.get('REDIS_RATE_LIMIT_DB', 1),
        decode_responses=True
    )
    
    # Store limiter in app context
    app.rate_limiter = RateLimiter(redis_client)
    
    logger.info("Rate limiting and DDoS protection initialized")

# Monitoring and metrics functions
def get_rate_limit_metrics(redis_client, time_range_minutes: int = 60) -> Dict:
    """Get rate limiting metrics for monitoring"""
    current_time = int(time.time())
    metrics = {
        'total_requests': 0,
        'allowed_requests': 0,
        'blocked_requests': 0,
        'endpoints': {},
        'time_range_minutes': time_range_minutes
    }
    
    # Aggregate metrics from the specified time range
    for i in range(time_range_minutes):
        timestamp = current_time - (i * 60)
        metrics_key = f"metrics:{timestamp // 60}"
        
        metric_data = redis_client.hgetall(metrics_key)
        if metric_data:
            metrics['total_requests'] += int(metric_data.get('total_requests', 0))
            metrics['allowed_requests'] += int(metric_data.get('allowed_requests', 0))
            metrics['blocked_requests'] += int(metric_data.get('blocked_requests', 0))
            
            # Aggregate endpoint metrics
            for key, value in metric_data.items():
                if key.startswith('endpoint:'):
                    endpoint = key.replace('endpoint:', '')
                    metrics['endpoints'][endpoint] = metrics['endpoints'].get(endpoint, 0) + int(value)
    
    return metrics
