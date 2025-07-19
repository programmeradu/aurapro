"""
🛡️ FastAPI Rate Limiting & DDoS Protection Middleware
Advanced rate limiting and DDoS protection for FastAPI applications
"""

import time
import json
import redis
import hashlib
from typing import Dict, List, Optional, Tuple, Callable
from datetime import datetime, timedelta
import logging
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import asyncio

logger = logging.getLogger(__name__)

class FastAPIRateLimiter:
    """FastAPI-compatible rate limiter with Redis backend"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/1"):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        
        # Rate limiting configuration
        self.config = {
            'global_limit': {'requests': 1000, 'window': 3600},
            'ip_limit': {'requests': 100, 'window': 3600},
            'user_limit': {'requests': 500, 'window': 3600},
            'endpoint_limits': {
                '/api/v1/auth/login': {'requests': 5, 'window': 900},
                '/api/v1/auth/register': {'requests': 3, 'window': 3600},
                '/api/v1/optimize/routes': {'requests': 50, 'window': 3600},
                '/api/v1/maintenance/predict': {'requests': 100, 'window': 3600},
                '/api/v1/traffic/live': {'requests': 200, 'window': 3600},
            },
            'role_limits': {
                'super_admin': {'requests': 2000, 'window': 3600},
                'admin': {'requests': 1500, 'window': 3600},
                'fleet_manager': {'requests': 1000, 'window': 3600},
                'dispatcher': {'requests': 800, 'window': 3600},
                'analyst': {'requests': 600, 'window': 3600},
                'maintenance': {'requests': 400, 'window': 3600},
                'driver': {'requests': 200, 'window': 3600},
                'viewer': {'requests': 100, 'window': 3600}
            }
        }
        
        # DDoS protection settings
        self.ddos_config = {
            'requests_per_second': 50,
            'unique_ips_threshold': 100,
            'burst_window': 60,
            'ban_duration': 3600,
            'suspicious_patterns': [
                'bot', 'crawler', 'spider', 'scraper', 'hack', 'attack',
                'injection', 'xss', 'sql', 'script', 'exploit'
            ]
        }

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        # Check for forwarded IP headers
        forwarded = request.headers.get('X-Forwarded-For')
        if forwarded:
            return forwarded.split(',')[0].strip()
        
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip
        
        # Fall back to client host
        return request.client.host if request.client else 'unknown'

    def get_client_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting"""
        # Try to get user ID from request state (set by auth middleware)
        user_id = getattr(request.state, 'user_id', None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        ip = self.get_client_ip(request)
        return f"ip:{ip}"

    def get_rate_limit_key(self, identifier: str, endpoint: str = None) -> str:
        """Generate Redis key for rate limiting"""
        current_window = int(time.time() // 3600)  # Hour-based window
        if endpoint:
            return f"rate_limit:{identifier}:{endpoint}:{current_window}"
        return f"rate_limit:{identifier}:{current_window}"

    def get_applicable_limits(self, request: Request) -> Dict:
        """Get applicable rate limits for the current request"""
        endpoint = str(request.url.path)
        
        # Start with default IP limits
        limits = self.config['ip_limit'].copy()
        
        # Check for endpoint-specific limits
        if endpoint in self.config['endpoint_limits']:
            limits.update(self.config['endpoint_limits'][endpoint])
        
        # Check for user role-based limits
        user_role = getattr(request.state, 'user_role', None)
        if user_role and user_role in self.config['role_limits']:
            role_limits = self.config['role_limits'][user_role]
            # Use the higher limit between role and endpoint
            if role_limits['requests'] > limits['requests']:
                limits.update(role_limits)
        
        return limits

    async def is_request_allowed(self, request: Request) -> Tuple[bool, Dict]:
        """Check if request is allowed and return rate limit info"""
        identifier = self.get_client_identifier(request)
        endpoint = str(request.url.path)
        limits = self.get_applicable_limits(request)
        
        # Generate rate limit key
        key = self.get_rate_limit_key(identifier, endpoint)
        
        try:
            # Get current request count
            current_count = await asyncio.get_event_loop().run_in_executor(
                None, self.redis.get, key
            )
            current_count = int(current_count) if current_count else 0
            
            # Check if limit exceeded
            if current_count >= limits['requests']:
                # Get TTL for reset time
                ttl = await asyncio.get_event_loop().run_in_executor(
                    None, self.redis.ttl, key
                )
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
            await asyncio.get_event_loop().run_in_executor(None, pipe.execute)
            
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

    async def detect_ddos_patterns(self, request: Request) -> bool:
        """Detect potential DDoS attacks"""
        ip = self.get_client_ip(request)
        current_time = int(time.time())
        
        # Check requests per second
        rps_key = f"ddos:rps:{ip}:{current_time}"
        rps_count = await asyncio.get_event_loop().run_in_executor(
            None, self.redis.incr, rps_key
        )
        await asyncio.get_event_loop().run_in_executor(
            None, self.redis.expire, rps_key, 1
        )
        
        if rps_count > self.ddos_config['requests_per_second']:
            logger.warning(f"DDoS detected: {ip} exceeded RPS threshold ({rps_count} req/s)")
            return True
        
        # Check burst patterns
        burst_key = f"ddos:burst:{current_time // self.ddos_config['burst_window']}"
        await asyncio.get_event_loop().run_in_executor(
            None, self.redis.sadd, burst_key, ip
        )
        await asyncio.get_event_loop().run_in_executor(
            None, self.redis.expire, burst_key, self.ddos_config['burst_window']
        )
        
        unique_ips = await asyncio.get_event_loop().run_in_executor(
            None, self.redis.scard, burst_key
        )
        if unique_ips > self.ddos_config['unique_ips_threshold']:
            logger.warning(f"DDoS burst detected: {unique_ips} unique IPs in burst window")
            return True
        
        return False

    def is_suspicious_request(self, request: Request) -> bool:
        """Detect suspicious request patterns"""
        user_agent = request.headers.get('user-agent', '').lower()
        
        # Check for suspicious user agents
        for pattern in self.ddos_config['suspicious_patterns']:
            if pattern in user_agent:
                return True
        
        # Check for missing or suspicious headers
        if not user_agent or len(user_agent) < 10:
            return True
        
        # Check for suspicious query parameters
        for param in request.query_params:
            param_lower = param.lower()
            if any(suspicious in param_lower for suspicious in ['script', 'union', 'select', 'drop']):
                return True
        
        return False

    async def ban_ip(self, ip: str, duration: int = None) -> None:
        """Ban an IP address for specified duration"""
        duration = duration or self.ddos_config['ban_duration']
        ban_key = f"banned:{ip}"
        
        ban_data = json.dumps({
            'banned_at': datetime.now().isoformat(),
            'reason': 'DDoS protection',
            'duration': duration
        })
        
        await asyncio.get_event_loop().run_in_executor(
            None, self.redis.setex, ban_key, duration, ban_data
        )
        
        logger.warning(f"IP {ip} banned for {duration} seconds due to DDoS protection")

    async def is_ip_banned(self, ip: str) -> Tuple[bool, Optional[Dict]]:
        """Check if IP is banned"""
        ban_key = f"banned:{ip}"
        ban_info = await asyncio.get_event_loop().run_in_executor(
            None, self.redis.get, ban_key
        )
        
        if ban_info:
            try:
                ban_data = json.loads(ban_info)
                ttl = await asyncio.get_event_loop().run_in_executor(
                    None, self.redis.ttl, ban_key
                )
                ban_data['remaining_seconds'] = ttl
                return True, ban_data
            except json.JSONDecodeError:
                # Invalid ban data, remove it
                await asyncio.get_event_loop().run_in_executor(
                    None, self.redis.delete, ban_key
                )
        
        return False, None

class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting and DDoS protection"""
    
    def __init__(self, app: ASGIApp, redis_url: str = "redis://localhost:6379/1"):
        super().__init__(app)
        self.limiter = FastAPIRateLimiter(redis_url)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through rate limiting"""
        
        # Skip rate limiting for static files and health checks
        if request.url.path.startswith('/static') or request.url.path == '/health':
            return await call_next(request)
        
        ip = self.limiter.get_client_ip(request)
        
        # Check if IP is banned (with Redis fallback)
        try:
            is_banned, ban_info = await self.limiter.is_ip_banned(ip)
            if is_banned:
                return JSONResponse(
                    status_code=403,
                    content={
                        'error': 'Access denied',
                        'message': 'Your IP has been temporarily banned',
                        'ban_info': ban_info
                    }
                )
        except Exception as e:
            # Redis not available, skip ban check
            logger.warning(f"Redis not available for ban check: {e}")
            pass
        
        # Check for suspicious patterns
        if self.limiter.is_suspicious_request(request):
            logger.warning(f"Suspicious request from {ip}: {request.url}")
            # Don't ban immediately, but log for monitoring
        
        # Check for DDoS patterns (with Redis fallback)
        try:
            if await self.limiter.detect_ddos_patterns(request):
                await self.limiter.ban_ip(ip)
                return JSONResponse(
                    status_code=403,
                    content={
                        'error': 'Access denied',
                        'message': 'DDoS protection activated. Your IP has been temporarily banned.'
                    }
                )
        except Exception as e:
            # Redis not available, skip DDoS check
            logger.warning(f"Redis not available for DDoS check: {e}")
            pass

        # Apply rate limiting (with Redis fallback)
        try:
            allowed, rate_info = await self.limiter.is_request_allowed(request)
        except Exception as e:
            # Redis not available, allow request
            logger.warning(f"Redis not available for rate limiting: {e}")
            allowed, rate_info = True, {'limit': 1000, 'remaining': 999}
        
        if not allowed:
            headers = {
                'X-RateLimit-Limit': str(rate_info['limit']),
                'X-RateLimit-Remaining': str(rate_info['remaining']),
            }
            if rate_info.get('retry_after'):
                headers['Retry-After'] = str(rate_info['retry_after'])
            
            return JSONResponse(
                status_code=429,
                content={
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Limit: {rate_info["limit"]} per hour',
                    'rate_limit': rate_info
                },
                headers=headers
            )
        
        # Process the request
        response = await call_next(request)
        
        # Add rate limit headers to successful responses
        response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
        response.headers['X-RateLimit-Remaining'] = str(rate_info['remaining'])
        
        return response

# Decorator for endpoint-specific rate limiting
def endpoint_rate_limit(requests: int, window: int = 3600):
    """Decorator for applying specific rate limits to endpoints"""
    def decorator(func):
        # Store rate limit info in function metadata
        func._rate_limit = {'requests': requests, 'window': window}
        return func
    return decorator

# Dependency for FastAPI endpoints
async def rate_limit_dependency(request: Request):
    """FastAPI dependency for rate limiting"""
    limiter = FastAPIRateLimiter()
    
    # Check if request is allowed
    allowed, rate_info = await limiter.is_request_allowed(request)
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                'error': 'Rate limit exceeded',
                'rate_limit': rate_info
            },
            headers={
                'X-RateLimit-Limit': str(rate_info['limit']),
                'X-RateLimit-Remaining': str(rate_info['remaining']),
                'Retry-After': str(rate_info.get('retry_after', 3600))
            }
        )
    
    return rate_info

# Monitoring endpoint
async def get_rate_limit_metrics(redis_client, time_range_minutes: int = 60) -> Dict:
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
        
        metric_data = await asyncio.get_event_loop().run_in_executor(
            None, redis_client.hgetall, metrics_key
        )
        
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
