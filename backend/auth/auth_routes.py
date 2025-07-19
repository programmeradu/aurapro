"""
🔐 Authentication Routes
FastAPI routes for authentication and user management
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator
import redis

from .jwt_manager import JWTManager, PasswordManager, UserRole, TokenPayload, jwt_manager
from .auth_middleware import (
    get_current_user, 
    get_current_active_user,
    require_admin,
    session_manager,
    security
)
from middleware.input_validation import validate_and_sanitize_input, is_safe_input

logger = logging.getLogger(__name__)

# Pydantic models for request/response
class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False
    
    @validator('username')
    def validate_username(cls, v):
        if not v or len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not is_safe_input(v):
            raise ValueError('Username contains invalid characters')
        return validate_and_sanitize_input(v, 'username')
    
    @validator('password')
    def validate_password(cls, v):
        if not v or len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    role: str = "viewer"
    
    @validator('username')
    def validate_username(cls, v):
        if not v or len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not is_safe_input(v):
            raise ValueError('Username contains invalid characters')
        return validate_and_sanitize_input(v, 'username')
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if not v or len(v) < 2:
            raise ValueError('Full name must be at least 2 characters')
        return validate_and_sanitize_input(v, 'name')
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = [role.value for role in UserRole]
        if v not in valid_roles:
            raise ValueError(f'Invalid role. Must be one of: {valid_roles}')
        return v
    
    @validator('password')
    def validate_password_strength(cls, v):
        validation = PasswordManager.validate_password_strength(v)
        if not validation['is_valid']:
            raise ValueError(f"Password validation failed: {', '.join(validation['issues'])}")
        return v

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        validation = PasswordManager.validate_password_strength(v)
        if not validation['is_valid']:
            raise ValueError(f"Password validation failed: {', '.join(validation['issues'])}")
        return v

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        validation = PasswordManager.validate_password_strength(v)
        if not validation['is_valid']:
            raise ValueError(f"Password validation failed: {', '.join(validation['issues'])}")
        return v

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    permissions: list
    created_at: str
    last_login: Optional[str] = None

# Create router
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# Mock user database (replace with real database in production)
MOCK_USERS = {
    "admin": {
        "id": "1",
        "username": "admin",
        "email": "admin@aura.com",
        "full_name": "System Administrator",
        "password_hash": PasswordManager.hash_password("admin123!"),
        "role": "super_admin",
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": None,
        "is_active": True
    },
    "fleet_manager": {
        "id": "2",
        "username": "fleet_manager",
        "email": "fleet@aura.com",
        "full_name": "Fleet Manager",
        "password_hash": PasswordManager.hash_password("fleet123!"),
        "role": "fleet_manager",
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": None,
        "is_active": True
    },
    "driver": {
        "id": "3",
        "username": "driver",
        "email": "driver@aura.com",
        "full_name": "Test Driver",
        "password_hash": PasswordManager.hash_password("driver123!"),
        "role": "driver",
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": None,
        "is_active": True
    }
}

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username (mock implementation)"""
    return MOCK_USERS.get(username)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email (mock implementation)"""
    for user in MOCK_USERS.values():
        if user["email"] == email:
            return user
    return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID (mock implementation)"""
    for user in MOCK_USERS.values():
        if user["id"] == user_id:
            return user
    return None

def update_user_last_login(user_id: str):
    """Update user's last login timestamp"""
    for user in MOCK_USERS.values():
        if user["id"] == user_id:
            user["last_login"] = datetime.utcnow().isoformat() + "Z"
            break

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, response: Response):
    """Authenticate user and return JWT tokens"""
    try:
        # Get user by username
        user = get_user_by_username(request.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Verify password
        if not PasswordManager.verify_password(request.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled"
            )
        
        # Create session
        session_data = session_manager.create_session(user, request.remember_me)
        
        # Update last login
        update_user_last_login(user["id"])
        
        # Set secure cookie for web interface
        response.set_cookie(
            key="access_token",
            value=session_data["access_token"],
            max_age=session_data["expires_in"],
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax"
        )
        
        logger.info(f"User {user['username']} logged in successfully")
        
        return AuthResponse(
            access_token=session_data["access_token"],
            refresh_token=session_data["refresh_token"],
            expires_in=session_data["expires_in"],
            user={
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"],
                "last_login": user.get("last_login")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest, current_user: TokenPayload = Depends(require_admin)):
    """Register new user (admin only)"""
    try:
        # Check if username already exists
        if get_user_by_username(request.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Check if email already exists
        if get_user_by_email(request.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        
        # Hash password
        password_hash = PasswordManager.hash_password(request.password)
        
        # Create new user
        new_user_id = str(len(MOCK_USERS) + 1)
        new_user = {
            "id": new_user_id,
            "username": request.username,
            "email": request.email,
            "full_name": request.full_name,
            "password_hash": password_hash,
            "role": request.role,
            "phone_number": request.phone_number,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "last_login": None,
            "is_active": True
        }
        
        # Add to mock database
        MOCK_USERS[request.username] = new_user
        
        logger.info(f"New user {request.username} registered by {current_user.username}")
        
        return UserResponse(
            id=new_user["id"],
            username=new_user["username"],
            email=new_user["email"],
            full_name=new_user["full_name"],
            role=new_user["role"],
            permissions=jwt_manager.role_permissions.get(UserRole(new_user["role"]), []),
            created_at=new_user["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        session_data = session_manager.refresh_session(request.refresh_token)
        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user data
        user = get_user_by_id(session_data["user_id"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        logger.info(f"Token refreshed for user {user['username']}")
        
        return AuthResponse(
            access_token=session_data["access_token"],
            refresh_token=session_data["refresh_token"],
            expires_in=session_data["expires_in"],
            user={
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"],
                "last_login": user.get("last_login")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed"
        )

@router.post("/logout")
async def logout(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: TokenPayload = Depends(get_current_user)
):
    """Logout user and invalidate token"""
    try:
        # Blacklist current token
        if credentials:
            session_manager.revoke_session(credentials.credentials)
        
        # Clear cookie
        response.delete_cookie(key="access_token")
        
        logger.info(f"User {current_user.username} logged out")
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.post("/logout-all")
async def logout_all(
    response: Response,
    current_user: TokenPayload = Depends(get_current_user)
):
    """Logout from all devices"""
    try:
        # Revoke all user tokens
        revoked_count = session_manager.revoke_all_sessions(current_user.user_id)
        
        # Clear cookie
        response.delete_cookie(key="access_token")
        
        logger.info(f"User {current_user.username} logged out from all devices ({revoked_count} sessions)")
        
        return {"message": f"Logged out from all devices ({revoked_count} sessions)"}
        
    except Exception as e:
        logger.error(f"Logout all error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: TokenPayload = Depends(get_current_active_user)):
    """Get current user information"""
    try:
        user = get_user_by_id(current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            permissions=current_user.permissions,
            created_at=user["created_at"],
            last_login=user.get("last_login")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user info error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )

@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: TokenPayload = Depends(get_current_active_user)
):
    """Change user password"""
    try:
        user = get_user_by_id(current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not PasswordManager.verify_password(request.current_password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_password_hash = PasswordManager.hash_password(request.new_password)
        
        # Update password in mock database
        user["password_hash"] = new_password_hash
        
        # Revoke all existing sessions (force re-login)
        session_manager.revoke_all_sessions(current_user.user_id)
        
        logger.info(f"Password changed for user {current_user.username}")
        
        return {"message": "Password changed successfully. Please log in again."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )

@router.get("/sessions")
async def get_user_sessions(current_user: TokenPayload = Depends(get_current_active_user)):
    """Get all active sessions for current user"""
    try:
        sessions = session_manager.get_user_sessions(current_user.user_id)
        return {"sessions": sessions}
        
    except Exception as e:
        logger.error(f"Get sessions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get sessions"
        )

@router.post("/validate-token")
async def validate_token(current_user: TokenPayload = Depends(get_current_user)):
    """Validate current token"""
    return {
        "valid": True,
        "user_id": current_user.user_id,
        "username": current_user.username,
        "role": current_user.role.value,
        "expires_at": current_user.expires_at.isoformat()
    }

# Export router
__all__ = ["router"]
