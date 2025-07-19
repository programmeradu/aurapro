"""
🔐 JWT Authentication Manager
Comprehensive JWT token management with security features
"""

import jwt
import redis
import json
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import bcrypt
from fastapi import HTTPException, status
import uuid

logger = logging.getLogger(__name__)

class TokenType(Enum):
    """JWT token types"""
    ACCESS = "access"
    REFRESH = "refresh"
    RESET_PASSWORD = "reset_password"
    EMAIL_VERIFICATION = "email_verification"

class UserRole(Enum):
    """User roles for authorization"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    FLEET_MANAGER = "fleet_manager"
    DISPATCHER = "dispatcher"
    ANALYST = "analyst"
    MAINTENANCE = "maintenance"
    DRIVER = "driver"
    COMMUTER = "commuter"
    VIEWER = "viewer"

@dataclass
class TokenPayload:
    """JWT token payload structure"""
    user_id: str
    username: str
    email: str
    role: UserRole
    permissions: List[str]
    token_type: TokenType
    issued_at: datetime
    expires_at: datetime
    jti: str  # JWT ID for token tracking

@dataclass
class AuthResult:
    """Authentication result"""
    success: bool
    user_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    error_message: Optional[str] = None
    requires_2fa: bool = False

class JWTManager:
    """Advanced JWT token management with security features"""
    
    def __init__(self, redis_client: redis.Redis = None):
        # JWT Configuration
        self.secret_key = self._get_secret_key()
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60  # 1 hour
        self.refresh_token_expire_days = 7     # 7 days
        self.reset_token_expire_minutes = 30   # 30 minutes
        
        # Redis for token blacklisting and session management
        self.redis = redis_client or redis.Redis(
            host='localhost', 
            port=6379, 
            db=2,  # Use DB 2 for sessions
            decode_responses=True
        )
        
        # Role-based permissions
        self.role_permissions = {
            UserRole.SUPER_ADMIN: [
                "read:all", "write:all", "delete:all", "admin:all",
                "system:manage", "users:manage", "security:manage"
            ],
            UserRole.ADMIN: [
                "read:all", "write:all", "delete:vehicles", "delete:routes",
                "users:manage", "reports:generate", "analytics:view"
            ],
            UserRole.FLEET_MANAGER: [
                "read:vehicles", "write:vehicles", "read:routes", "write:routes",
                "read:drivers", "write:drivers", "maintenance:schedule", "analytics:view"
            ],
            UserRole.DISPATCHER: [
                "read:vehicles", "read:routes", "read:trips", "write:trips",
                "dispatch:manage", "tracking:view"
            ],
            UserRole.ANALYST: [
                "read:all", "analytics:view", "reports:generate", "data:export"
            ],
            UserRole.MAINTENANCE: [
                "read:vehicles", "write:maintenance", "maintenance:schedule",
                "sensors:read", "predictions:view"
            ],
            UserRole.DRIVER: [
                "read:own_vehicle", "write:trip_status", "read:routes",
                "tracking:update", "maintenance:report"
            ],
            UserRole.COMMUTER: [
                "read:routes", "read:schedules", "tracking:view",
                "reports:create", "feedback:submit"
            ],
            UserRole.VIEWER: [
                "read:public", "tracking:view"
            ]
        }
    
    def _get_secret_key(self) -> str:
        """Get or generate JWT secret key"""
        import os
        
        # Try to get from environment
        secret = os.getenv('JWT_SECRET_KEY')
        if secret:
            return secret
        
        # Generate a secure random key
        secret = secrets.token_urlsafe(64)
        logger.warning("JWT_SECRET_KEY not found in environment. Generated temporary key.")
        logger.warning("Set JWT_SECRET_KEY environment variable for production!")
        
        return secret
    
    def create_access_token(self, user_data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=self.access_token_expire_minutes)
        jti = str(uuid.uuid4())
        
        # Get user role and permissions
        role = UserRole(user_data.get('role', 'viewer'))
        permissions = self.role_permissions.get(role, [])
        
        payload = {
            'user_id': str(user_data['id']),
            'username': user_data['username'],
            'email': user_data['email'],
            'role': role.value,
            'permissions': permissions,
            'token_type': TokenType.ACCESS.value,
            'iat': now.timestamp(),
            'exp': expires_at.timestamp(),
            'jti': jti,
            'iss': 'aura-command-center',
            'aud': 'aura-users'
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        
        # Store token metadata in Redis
        self._store_token_metadata(jti, user_data['id'], TokenType.ACCESS, expires_at)
        
        logger.info(f"Access token created for user {user_data['username']} (ID: {user_data['id']})")
        return token
    
    def create_refresh_token(self, user_data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=self.refresh_token_expire_days)
        jti = str(uuid.uuid4())
        
        payload = {
            'user_id': str(user_data['id']),
            'username': user_data['username'],
            'token_type': TokenType.REFRESH.value,
            'iat': now.timestamp(),
            'exp': expires_at.timestamp(),
            'jti': jti,
            'iss': 'aura-command-center',
            'aud': 'aura-users'
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        
        # Store token metadata in Redis
        self._store_token_metadata(jti, user_data['id'], TokenType.REFRESH, expires_at)
        
        logger.info(f"Refresh token created for user {user_data['username']} (ID: {user_data['id']})")
        return token
    
    def verify_token(self, token: str, token_type: TokenType = TokenType.ACCESS) -> Optional[TokenPayload]:
        """Verify and decode JWT token"""
        try:
            # Decode token
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                audience='aura-users',
                issuer='aura-command-center'
            )
            
            # Verify token type
            if payload.get('token_type') != token_type.value:
                logger.warning(f"Token type mismatch: expected {token_type.value}, got {payload.get('token_type')}")
                return None
            
            # Check if token is blacklisted
            jti = payload.get('jti')
            if jti and self._is_token_blacklisted(jti):
                logger.warning(f"Blacklisted token used: {jti}")
                return None
            
            # Create TokenPayload object
            token_payload = TokenPayload(
                user_id=payload['user_id'],
                username=payload['username'],
                email=payload.get('email', ''),
                role=UserRole(payload['role']),
                permissions=payload.get('permissions', []),
                token_type=TokenType(payload['token_type']),
                issued_at=datetime.fromtimestamp(payload['iat'], timezone.utc),
                expires_at=datetime.fromtimestamp(payload['exp'], timezone.utc),
                jti=jti
            )
            
            return token_payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[Tuple[str, str]]:
        """Refresh access token using refresh token"""
        # Verify refresh token
        payload = self.verify_token(refresh_token, TokenType.REFRESH)
        if not payload:
            return None
        
        # Get user data (in production, fetch from database)
        user_data = {
            'id': payload.user_id,
            'username': payload.username,
            'email': payload.email,
            'role': payload.role.value
        }
        
        # Create new tokens
        new_access_token = self.create_access_token(user_data)
        new_refresh_token = self.create_refresh_token(user_data)
        
        # Blacklist old refresh token
        self.blacklist_token(payload.jti)
        
        logger.info(f"Tokens refreshed for user {payload.username}")
        return new_access_token, new_refresh_token
    
    def blacklist_token(self, jti: str) -> bool:
        """Add token to blacklist"""
        try:
            blacklist_key = f"blacklist:{jti}"
            # Set with expiration (tokens expire anyway, but this ensures cleanup)
            self.redis.setex(blacklist_key, 86400 * 7, "blacklisted")  # 7 days
            logger.info(f"Token blacklisted: {jti}")
            return True
        except Exception as e:
            logger.error(f"Failed to blacklist token {jti}: {e}")
            return False
    
    def _is_token_blacklisted(self, jti: str) -> bool:
        """Check if token is blacklisted"""
        try:
            blacklist_key = f"blacklist:{jti}"
            return self.redis.exists(blacklist_key) > 0
        except Exception as e:
            logger.error(f"Failed to check blacklist for token {jti}: {e}")
            return False
    
    def _store_token_metadata(self, jti: str, user_id: str, token_type: TokenType, expires_at: datetime):
        """Store token metadata in Redis"""
        try:
            metadata = {
                'user_id': user_id,
                'token_type': token_type.value,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'expires_at': expires_at.isoformat()
            }
            
            metadata_key = f"token_meta:{jti}"
            ttl = int((expires_at - datetime.now(timezone.utc)).total_seconds())
            
            self.redis.setex(metadata_key, ttl, json.dumps(metadata))
        except Exception as e:
            logger.error(f"Failed to store token metadata: {e}")
    
    def get_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all active sessions for a user"""
        try:
            sessions = []
            pattern = "token_meta:*"
            
            for key in self.redis.scan_iter(match=pattern):
                metadata_json = self.redis.get(key)
                if metadata_json:
                    metadata = json.loads(metadata_json)
                    if metadata['user_id'] == str(user_id):
                        jti = key.replace("token_meta:", "")
                        sessions.append({
                            'jti': jti,
                            'token_type': metadata['token_type'],
                            'created_at': metadata['created_at'],
                            'expires_at': metadata['expires_at'],
                            'is_blacklisted': self._is_token_blacklisted(jti)
                        })
            
            return sessions
        except Exception as e:
            logger.error(f"Failed to get user sessions: {e}")
            return []
    
    def revoke_all_user_tokens(self, user_id: str) -> int:
        """Revoke all tokens for a user"""
        sessions = self.get_user_sessions(user_id)
        revoked_count = 0
        
        for session in sessions:
            if not session['is_blacklisted']:
                if self.blacklist_token(session['jti']):
                    revoked_count += 1
        
        logger.info(f"Revoked {revoked_count} tokens for user {user_id}")
        return revoked_count
    
    def has_permission(self, token_payload: TokenPayload, required_permission: str) -> bool:
        """Check if user has required permission"""
        if not token_payload or not token_payload.permissions:
            return False
        
        # Check for exact permission match
        if required_permission in token_payload.permissions:
            return True
        
        # Check for wildcard permissions
        permission_parts = required_permission.split(':')
        if len(permission_parts) == 2:
            resource, action = permission_parts
            
            # Check for resource:all permission
            if f"{resource}:all" in token_payload.permissions:
                return True
            
            # Check for read:all, write:all, etc.
            if f"{action}:all" in token_payload.permissions:
                return True
        
        return False
    
    def create_password_reset_token(self, user_data: Dict[str, Any]) -> str:
        """Create password reset token"""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=self.reset_token_expire_minutes)
        jti = str(uuid.uuid4())
        
        payload = {
            'user_id': str(user_data['id']),
            'email': user_data['email'],
            'token_type': TokenType.RESET_PASSWORD.value,
            'iat': now.timestamp(),
            'exp': expires_at.timestamp(),
            'jti': jti,
            'iss': 'aura-command-center',
            'aud': 'aura-users'
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        
        # Store token metadata
        self._store_token_metadata(jti, user_data['id'], TokenType.RESET_PASSWORD, expires_at)
        
        logger.info(f"Password reset token created for user {user_data.get('username', user_data['email'])}")
        return token
    
    def verify_password_reset_token(self, token: str) -> Optional[str]:
        """Verify password reset token and return user ID"""
        payload = self.verify_token(token, TokenType.RESET_PASSWORD)
        if payload:
            # Blacklist token after use
            self.blacklist_token(payload.jti)
            return payload.user_id
        return None

class PasswordManager:
    """Secure password management"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """Validate password strength"""
        result = {
            'is_valid': True,
            'score': 0,
            'issues': []
        }
        
        # Length check
        if len(password) < 8:
            result['issues'].append("Password must be at least 8 characters long")
            result['is_valid'] = False
        else:
            result['score'] += 1
        
        # Uppercase check
        if not any(c.isupper() for c in password):
            result['issues'].append("Password must contain at least one uppercase letter")
            result['is_valid'] = False
        else:
            result['score'] += 1
        
        # Lowercase check
        if not any(c.islower() for c in password):
            result['issues'].append("Password must contain at least one lowercase letter")
            result['is_valid'] = False
        else:
            result['score'] += 1
        
        # Number check
        if not any(c.isdigit() for c in password):
            result['issues'].append("Password must contain at least one number")
            result['is_valid'] = False
        else:
            result['score'] += 1
        
        # Special character check
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            result['issues'].append("Password must contain at least one special character")
            result['is_valid'] = False
        else:
            result['score'] += 1
        
        # Common password check
        common_passwords = [
            'password', '123456', 'password123', 'admin', 'qwerty',
            'letmein', 'welcome', 'monkey', '1234567890'
        ]
        if password.lower() in common_passwords:
            result['issues'].append("Password is too common")
            result['is_valid'] = False
        else:
            result['score'] += 1
        
        # Calculate strength
        if result['score'] >= 5:
            result['strength'] = 'strong'
        elif result['score'] >= 3:
            result['strength'] = 'medium'
        else:
            result['strength'] = 'weak'
        
        return result

# Global JWT manager instance
jwt_manager = JWTManager()

# Export main components
__all__ = [
    'JWTManager',
    'PasswordManager',
    'TokenType',
    'UserRole',
    'TokenPayload',
    'AuthResult',
    'jwt_manager'
]
