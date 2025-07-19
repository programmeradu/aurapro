"""
🔐 AURA Security & Authentication Module
Provides secure authentication and authorization for API endpoints
"""

import os
import hashlib
import hmac
import secrets
import time
from typing import Optional, Dict, List
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)

# Security configuration
SECURITY_CONFIG = {
    "API_KEY_LENGTH": 32,
    "TOKEN_EXPIRY_HOURS": 24,
    "MAX_REQUESTS_PER_MINUTE": 100,
    "RATE_LIMIT_WINDOW": 60,  # seconds
}

# Rate limiting storage (in production, use Redis)
rate_limit_storage: Dict[str, List[float]] = {}

class SecurityManager:
    """Centralized security management"""
    
    def __init__(self):
        # Load API keys from environment
        self.api_keys = self._load_api_keys()
        self.master_key = os.getenv("AURA_MASTER_API_KEY")
        
        if not self.master_key:
            # Generate a secure master key for development
            self.master_key = secrets.token_urlsafe(32)
            logger.warning(f"🔑 Generated temporary master API key: {self.master_key}")
            logger.warning("⚠️ Set AURA_MASTER_API_KEY environment variable for production!")
    
    def _load_api_keys(self) -> Dict[str, Dict]:
        """Load API keys from environment or generate defaults"""
        api_keys = {}
        
        # Development keys
        if os.getenv("NODE_ENV") != "production":
            api_keys.update({
                "dev_frontend": {
                    "key": "aura_dev_frontend_2025",
                    "permissions": ["read", "write"],
                    "description": "Development frontend access"
                },
                "dev_admin": {
                    "key": "aura_dev_admin_2025", 
                    "permissions": ["read", "write", "admin"],
                    "description": "Development admin access"
                }
            })
        
        # Production keys from environment
        prod_keys = os.getenv("AURA_API_KEYS", "")
        if prod_keys:
            try:
                # Format: "key1:permissions1,key2:permissions2"
                for key_config in prod_keys.split(","):
                    key, perms = key_config.split(":")
                    api_keys[key] = {
                        "key": key,
                        "permissions": perms.split("|"),
                        "description": "Production API key"
                    }
            except Exception as e:
                logger.error(f"Failed to parse AURA_API_KEYS: {e}")
        
        return api_keys
    
    def validate_api_key(self, api_key: str) -> Optional[Dict]:
        """Validate API key and return permissions"""
        # Check master key
        if api_key == self.master_key:
            return {
                "permissions": ["read", "write", "admin"],
                "description": "Master API key"
            }
        
        # Check configured keys
        for key_id, key_data in self.api_keys.items():
            if hmac.compare_digest(api_key, key_data["key"]):
                return key_data
        
        return None
    
    def check_rate_limit(self, client_id: str, max_requests: int = None) -> bool:
        """Check if client is within rate limits"""
        max_requests = max_requests or SECURITY_CONFIG["MAX_REQUESTS_PER_MINUTE"]
        window = SECURITY_CONFIG["RATE_LIMIT_WINDOW"]
        current_time = time.time()
        
        # Initialize client if not exists
        if client_id not in rate_limit_storage:
            rate_limit_storage[client_id] = []
        
        # Clean old requests outside window
        rate_limit_storage[client_id] = [
            req_time for req_time in rate_limit_storage[client_id]
            if current_time - req_time < window
        ]
        
        # Check if within limits
        if len(rate_limit_storage[client_id]) >= max_requests:
            return False
        
        # Add current request
        rate_limit_storage[client_id].append(current_time)
        return True

# Global security manager instance
security_manager = SecurityManager()

# FastAPI security scheme
security_scheme = HTTPBearer(auto_error=False)

def get_api_key(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> str:
    """Extract API key from Authorization header"""
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Include 'Authorization: Bearer <api_key>' header"
        )
    return credentials.credentials

def require_auth(permissions: List[str] = None):
    """Decorator to require authentication with optional permissions"""
    def auth_dependency(
        request: Request,
        api_key: str = Depends(get_api_key)
    ):
        # Validate API key
        key_data = security_manager.validate_api_key(api_key)
        if not key_data:
            logger.warning(f"Invalid API key attempt from {request.client.host}")
            raise HTTPException(
                status_code=401,
                detail="Invalid API key"
            )
        
        # Check permissions
        if permissions:
            user_permissions = key_data.get("permissions", [])
            if not any(perm in user_permissions for perm in permissions):
                logger.warning(f"Insufficient permissions for {request.client.host}")
                raise HTTPException(
                    status_code=403,
                    detail=f"Insufficient permissions. Required: {permissions}"
                )
        
        # Check rate limits
        client_id = f"{request.client.host}:{api_key[:8]}"
        if not security_manager.check_rate_limit(client_id):
            logger.warning(f"Rate limit exceeded for {client_id}")
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please slow down your requests."
            )
        
        return {
            "api_key": api_key,
            "permissions": key_data.get("permissions", []),
            "client_ip": request.client.host
        }
    
    return auth_dependency

# Common auth dependencies
require_read = require_auth(["read"])
require_write = require_auth(["write"]) 
require_admin = require_auth(["admin"])

def get_client_ip(request: Request) -> str:
    """Get client IP address with proxy support"""
    # Check for forwarded headers (from load balancers/proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host

def log_security_event(event_type: str, details: Dict, request: Request):
    """Log security-related events"""
    client_ip = get_client_ip(request)
    logger.info(f"🔐 Security Event: {event_type} | IP: {client_ip} | Details: {details}")

# Input validation helpers
def validate_input_length(value: str, max_length: int = 1000) -> str:
    """Validate input string length"""
    if len(value) > max_length:
        raise HTTPException(
            status_code=400,
            detail=f"Input too long. Maximum {max_length} characters allowed."
        )
    return value

def sanitize_string(value: str) -> str:
    """Basic string sanitization"""
    # Remove potential XSS characters
    dangerous_chars = ["<", ">", "\"", "'", "&", "javascript:", "data:"]
    for char in dangerous_chars:
        value = value.replace(char, "")
    return value.strip()
