"""
🔒 HTTPS & Security Headers Implementation
Production-ready HTTPS enforcement and security headers
"""

import os
import logging
from typing import Dict, List, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class HTTPSSecurityMiddleware(BaseHTTPMiddleware):
    """Middleware for HTTPS enforcement and security headers"""
    
    def __init__(self, app: ASGIApp, environment: str = "development"):
        super().__init__(app)
        self.environment = environment
        self.enforce_https = environment == "production"
        
        # Security headers configuration
        self.security_headers = {
            # XSS Protection
            "X-XSS-Protection": "1; mode=block",
            
            # Content Type Options
            "X-Content-Type-Options": "nosniff",
            
            # Frame Options
            "X-Frame-Options": "DENY",
            
            # Referrer Policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Permissions Policy
            "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
            
            # Cross-Origin Policies (relaxed for development)
            # "Cross-Origin-Embedder-Policy": "require-corp",
            # "Cross-Origin-Opener-Policy": "same-origin",
            # "Cross-Origin-Resource-Policy": "same-origin",
            
            # Security Headers
            "X-Permitted-Cross-Domain-Policies": "none",
            "X-Download-Options": "noopen",
        }
        
        # HTTPS Strict Transport Security
        if self.enforce_https:
            self.security_headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Content Security Policy
        self.csp_policy = self._get_csp_policy()
    
    async def dispatch(self, request: Request, call_next):
        """Process request with HTTPS and security headers"""
        
        # HTTPS Enforcement
        if self.enforce_https and not self._is_secure_request(request):
            return self._redirect_to_https(request)
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        self._add_security_headers(response)
        
        return response
    
    def _is_secure_request(self, request: Request) -> bool:
        """Check if request is secure (HTTPS)"""
        # Check scheme
        if request.url.scheme == "https":
            return True
        
        # Check forwarded headers (for reverse proxy)
        forwarded_proto = request.headers.get("X-Forwarded-Proto")
        if forwarded_proto == "https":
            return True
        
        # Check if behind load balancer
        forwarded_ssl = request.headers.get("X-Forwarded-SSL")
        if forwarded_ssl == "on":
            return True
        
        return False
    
    def _redirect_to_https(self, request: Request):
        """Redirect HTTP to HTTPS"""
        from fastapi.responses import RedirectResponse
        
        https_url = str(request.url).replace("http://", "https://", 1)
        return RedirectResponse(url=https_url, status_code=301)
    
    def _add_security_headers(self, response: Response):
        """Add security headers to response"""
        for header, value in self.security_headers.items():
            response.headers[header] = value
        
        # Add CSP header
        if self.csp_policy:
            response.headers["Content-Security-Policy"] = self.csp_policy
    
    def _get_csp_policy(self) -> str:
        """Get Content Security Policy based on environment"""
        if self.environment == "production":
            return (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://api.mapbox.com; "
                "frame-src 'none'; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'; "
                "upgrade-insecure-requests"
            )
        else:
            return (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* 127.0.0.1:* https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
                "font-src 'self' data: https://fonts.gstatic.com; "
                "img-src 'self' data: blob: * https://fastapi.tiangolo.com; "
                "connect-src 'self' localhost:* 127.0.0.1:* ws: wss:; "
                "frame-src 'self'; "
                "object-src 'none'"
            )

class CORSSecurityManager:
    """Enhanced CORS management with security"""
    
    def __init__(self, environment: str = "development"):
        self.environment = environment
    
    def get_cors_config(self) -> Dict:
        """Get CORS configuration based on environment"""
        if self.environment == "production":
            return {
                "allow_origins": [
                    "https://aura.transport.gov.gh",  # Production domain
                    "https://app.aura.transport.gov.gh",  # Mobile app domain
                ],
                "allow_credentials": True,
                "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": [
                    "Authorization",
                    "Content-Type",
                    "X-Requested-With",
                    "Accept",
                    "Origin",
                    "User-Agent",
                    "DNT",
                    "Cache-Control",
                    "X-Mx-ReqToken",
                    "Keep-Alive",
                    "X-Requested-With",
                    "If-Modified-Since",
                ],
                "expose_headers": [
                    "X-RateLimit-Limit",
                    "X-RateLimit-Remaining",
                    "X-RateLimit-Reset",
                    "X-User-ID",
                    "X-User-Role",
                ],
                "max_age": 86400,  # 24 hours
            }
        else:
            return {
                "allow_origins": [
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:3001",
                ],
                "allow_credentials": True,
                "allow_methods": ["*"],
                "allow_headers": ["*"],
                "expose_headers": ["*"],
                "max_age": 600,  # 10 minutes
            }

def setup_ssl_context():
    """Setup SSL context for production"""
    import ssl
    
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    
    # SSL certificate paths (update for production)
    cert_file = os.getenv("SSL_CERT_FILE", "/etc/ssl/certs/aura.crt")
    key_file = os.getenv("SSL_KEY_FILE", "/etc/ssl/private/aura.key")
    
    if os.path.exists(cert_file) and os.path.exists(key_file):
        ssl_context.load_cert_chain(cert_file, key_file)
        logger.info("SSL certificates loaded successfully")
        return ssl_context
    else:
        logger.warning("SSL certificates not found. Using HTTP in development.")
        return None

# Security configuration
SECURITY_CONFIG = {
    "development": {
        "enforce_https": False,
        "hsts_max_age": 0,
        "secure_cookies": False,
        "csp_report_only": True,
    },
    "production": {
        "enforce_https": True,
        "hsts_max_age": 31536000,  # 1 year
        "secure_cookies": True,
        "csp_report_only": False,
    }
}

def get_security_config(environment: str = "development") -> Dict:
    """Get security configuration for environment"""
    return SECURITY_CONFIG.get(environment, SECURITY_CONFIG["development"])

# Export main components
__all__ = [
    "HTTPSSecurityMiddleware",
    "CORSSecurityManager", 
    "setup_ssl_context",
    "get_security_config"
]
