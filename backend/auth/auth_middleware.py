"""
🔐 Authentication Middleware and Dependencies
FastAPI authentication middleware and dependency injection
"""

import logging
from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time

from .jwt_manager import JWTManager, TokenPayload, UserRole, jwt_manager

logger = logging.getLogger(__name__)

# Security scheme for Swagger documentation
security = HTTPBearer(auto_error=False)

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Authentication middleware for automatic token validation"""
    
    def __init__(self, app: ASGIApp, jwt_manager: JWTManager = None):
        super().__init__(app)
        self.jwt_manager = jwt_manager or jwt_manager
        
        # Endpoints that don't require authentication
        self.public_endpoints = {
            '/health',
            '/docs',
            '/openapi.json',
            '/redoc',
            '/api/v1/auth/login',
            '/api/v1/auth/register',
            '/api/v1/auth/forgot-password',
            '/api/v1/auth/reset-password',
            '/api/v1/auth/verify-email',
            '/api/v1/journey/popular-destinations',
            '/api/v1/journey/saved',
            '/api/v1/journey/plan',
            '/api/v1/journey/search-places',
            '/api/v1/gtfs/stops',
            '/api/v1/gtfs/stops/near',
            '/api/v1/gtfs/routes',
            '/api/v1/gtfs/agencies',
            '/api/v1/ml/predict-travel-time',
            '/api/v1/ml/predict-traffic',
            '/api/v1/pricing/dynamic',
            '/api/v1/ml/predictive-analytics',
            '/api/v1/tracking/nearby',
            '/api/v1/optimize/routes',
            '/api/v1/health',
            '/static',
            '/favicon.ico'
        }
        
        # Endpoints that require specific roles
        self.role_protected_endpoints = {
            '/api/v1/admin': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
            '/api/v1/fleet': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FLEET_MANAGER],
            '/api/v1/dispatch': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DISPATCHER],
            '/api/v1/maintenance': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.MAINTENANCE],
            '/api/v1/analytics': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ANALYST],
        }
    
    async def dispatch(self, request: Request, call_next: Callable):
        """Process authentication for each request"""
        start_time = time.time()
        
        # Skip authentication for public endpoints
        if self._is_public_endpoint(request.url.path):
            response = await call_next(request)
            return response
        
        try:
            # Extract and validate token
            token = self._extract_token(request)
            if not token:
                return self._create_auth_error("Missing authentication token")
            
            # Verify token
            token_payload = self.jwt_manager.verify_token(token)
            if not token_payload:
                return self._create_auth_error("Invalid or expired token")
            
            # Check role-based access
            if not self._check_role_access(request.url.path, token_payload.role):
                return self._create_auth_error("Insufficient permissions")
            
            # Add user info to request state
            request.state.user_id = token_payload.user_id
            request.state.username = token_payload.username
            request.state.user_role = token_payload.role
            request.state.user_permissions = token_payload.permissions
            request.state.token_payload = token_payload
            
            # Process request
            response = await call_next(request)
            
            # Add authentication headers
            response.headers["X-User-ID"] = token_payload.user_id
            response.headers["X-User-Role"] = token_payload.role.value
            
            # Log successful authentication
            processing_time = time.time() - start_time
            logger.debug(f"Authenticated user {token_payload.username} in {processing_time:.3f}s")
            
            return response
            
        except Exception as e:
            logger.error(f"Authentication middleware error: {e}")
            return self._create_auth_error("Authentication failed")
    
    def _is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public"""
        # Exact match
        if path in self.public_endpoints:
            return True
        
        # Prefix match for static files
        for public_path in self.public_endpoints:
            if path.startswith(public_path):
                return True
        
        return False
    
    def _extract_token(self, request: Request) -> Optional[str]:
        """Extract JWT token from request"""
        # Try Authorization header first
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header[7:]  # Remove "Bearer " prefix
        
        # Try cookie (for web interface)
        token = request.cookies.get("access_token")
        if token:
            return token
        
        # Try query parameter (for WebSocket or special cases)
        token = request.query_params.get("token")
        if token:
            return token
        
        return None
    
    def _check_role_access(self, path: str, user_role: UserRole) -> bool:
        """Check if user role has access to endpoint"""
        for protected_path, allowed_roles in self.role_protected_endpoints.items():
            if path.startswith(protected_path):
                return user_role in allowed_roles
        
        # If not specifically protected, allow access
        return True
    
    def _create_auth_error(self, message: str):
        """Create authentication error response"""
        from fastapi.responses import JSONResponse
        
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": "Authentication failed",
                "message": message,
                "type": "authentication_error"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )

# FastAPI Dependencies
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> TokenPayload:
    """Get current authenticated user"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token_payload = jwt_manager.verify_token(credentials.credentials)
    if not token_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return token_payload

async def get_current_active_user(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """Get current active user (can be extended to check user status)"""
    # In production, you might want to check if user is active/enabled
    return current_user

# Role-based dependencies
def require_role(allowed_roles: List[UserRole]):
    """Dependency factory for role-based access control"""
    def role_checker(current_user: TokenPayload = Depends(get_current_active_user)) -> TokenPayload:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
            )
        return current_user
    return role_checker

def require_permission(required_permission: str):
    """Dependency factory for permission-based access control"""
    def permission_checker(current_user: TokenPayload = Depends(get_current_active_user)) -> TokenPayload:
        if not jwt_manager.has_permission(current_user, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permission: {required_permission}"
            )
        return current_user
    return permission_checker

# Specific role dependencies
require_admin = require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN])
require_fleet_manager = require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FLEET_MANAGER])
require_dispatcher = require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.DISPATCHER])
require_maintenance = require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.MAINTENANCE])
require_analyst = require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ANALYST])

# Permission-based dependencies
require_read_vehicles = require_permission("read:vehicles")
require_write_vehicles = require_permission("write:vehicles")
require_read_routes = require_permission("read:routes")
require_write_routes = require_permission("write:routes")
require_analytics_view = require_permission("analytics:view")
require_system_manage = require_permission("system:manage")

# Optional authentication (for public endpoints that can benefit from user context)
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[TokenPayload]:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    
    try:
        token_payload = jwt_manager.verify_token(credentials.credentials)
        return token_payload
    except Exception:
        return None

class SessionManager:
    """Session management utilities"""
    
    def __init__(self, jwt_manager: JWTManager):
        self.jwt_manager = jwt_manager
    
    def create_session(self, user_data: dict, remember_me: bool = False) -> dict:
        """Create new user session"""
        access_token = self.jwt_manager.create_access_token(user_data)
        refresh_token = self.jwt_manager.create_refresh_token(user_data)
        
        # Adjust expiration for "remember me"
        if remember_me:
            # Extend refresh token expiration
            pass  # Could implement extended refresh tokens here
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'expires_in': self.jwt_manager.access_token_expire_minutes * 60,
            'user_id': user_data['id'],
            'username': user_data['username'],
            'role': user_data['role']
        }
    
    def refresh_session(self, refresh_token: str) -> Optional[dict]:
        """Refresh user session"""
        result = self.jwt_manager.refresh_access_token(refresh_token)
        if not result:
            return None
        
        new_access_token, new_refresh_token = result
        
        # Get user info from token
        token_payload = self.jwt_manager.verify_token(new_access_token)
        if not token_payload:
            return None
        
        return {
            'access_token': new_access_token,
            'refresh_token': new_refresh_token,
            'token_type': 'bearer',
            'expires_in': self.jwt_manager.access_token_expire_minutes * 60,
            'user_id': token_payload.user_id,
            'username': token_payload.username,
            'role': token_payload.role.value
        }
    
    def revoke_session(self, token: str) -> bool:
        """Revoke user session"""
        token_payload = self.jwt_manager.verify_token(token)
        if not token_payload:
            return False
        
        return self.jwt_manager.blacklist_token(token_payload.jti)
    
    def revoke_all_sessions(self, user_id: str) -> int:
        """Revoke all sessions for a user"""
        return self.jwt_manager.revoke_all_user_tokens(user_id)
    
    def get_user_sessions(self, user_id: str) -> List[dict]:
        """Get all active sessions for a user"""
        return self.jwt_manager.get_user_sessions(user_id)

# Global session manager
session_manager = SessionManager(jwt_manager)

# Utility functions
def extract_user_from_request(request: Request) -> Optional[TokenPayload]:
    """Extract user information from request state"""
    return getattr(request.state, 'token_payload', None)

def check_user_permission(request: Request, permission: str) -> bool:
    """Check if current user has specific permission"""
    token_payload = extract_user_from_request(request)
    if not token_payload:
        return False
    
    return jwt_manager.has_permission(token_payload, permission)

def get_user_role(request: Request) -> Optional[UserRole]:
    """Get current user role from request"""
    token_payload = extract_user_from_request(request)
    return token_payload.role if token_payload else None

# Export main components
__all__ = [
    'AuthenticationMiddleware',
    'get_current_user',
    'get_current_active_user',
    'get_optional_user',
    'require_role',
    'require_permission',
    'require_admin',
    'require_fleet_manager',
    'require_dispatcher',
    'require_maintenance',
    'require_analyst',
    'require_read_vehicles',
    'require_write_vehicles',
    'require_read_routes',
    'require_write_routes',
    'require_analytics_view',
    'require_system_manage',
    'SessionManager',
    'session_manager',
    'extract_user_from_request',
    'check_user_permission',
    'get_user_role'
]
