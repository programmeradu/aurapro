"""
🧪 JWT Authentication Tests
Comprehensive test suite for JWT authentication system
"""

import pytest
import jwt
import time
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import redis
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from auth.jwt_manager import JWTManager, PasswordManager, UserRole, TokenType, TokenPayload
from auth.auth_middleware import get_current_user, require_admin
from auth.auth_routes import MOCK_USERS

class TestJWTManager:
    """Test suite for JWT token management"""
    
    @pytest.fixture
    def jwt_manager(self):
        """Create JWT manager for testing"""
        # Use test Redis database
        redis_client = redis.Redis(host='localhost', port=6379, db=15, decode_responses=True)
        redis_client.flushdb()  # Clear test database
        return JWTManager(redis_client)
    
    @pytest.fixture
    def sample_user(self):
        """Sample user data for testing"""
        return {
            'id': '1',
            'username': 'testuser',
            'email': 'test@example.com',
            'role': 'admin'
        }
    
    def test_create_access_token(self, jwt_manager, sample_user):
        """Test access token creation"""
        token = jwt_manager.create_access_token(sample_user)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode and verify token
        payload = jwt.decode(
            token, 
            jwt_manager.secret_key, 
            algorithms=[jwt_manager.algorithm],
            audience='aura-users',
            issuer='aura-command-center'
        )
        
        assert payload['user_id'] == sample_user['id']
        assert payload['username'] == sample_user['username']
        assert payload['email'] == sample_user['email']
        assert payload['role'] == sample_user['role']
        assert payload['token_type'] == TokenType.ACCESS.value
        assert 'permissions' in payload
        assert 'jti' in payload
    
    def test_create_refresh_token(self, jwt_manager, sample_user):
        """Test refresh token creation"""
        token = jwt_manager.create_refresh_token(sample_user)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode and verify token
        payload = jwt.decode(
            token, 
            jwt_manager.secret_key, 
            algorithms=[jwt_manager.algorithm],
            audience='aura-users',
            issuer='aura-command-center'
        )
        
        assert payload['user_id'] == sample_user['id']
        assert payload['username'] == sample_user['username']
        assert payload['token_type'] == TokenType.REFRESH.value
        assert 'jti' in payload
    
    def test_verify_valid_token(self, jwt_manager, sample_user):
        """Test token verification with valid token"""
        token = jwt_manager.create_access_token(sample_user)
        token_payload = jwt_manager.verify_token(token)
        
        assert token_payload is not None
        assert isinstance(token_payload, TokenPayload)
        assert token_payload.user_id == sample_user['id']
        assert token_payload.username == sample_user['username']
        assert token_payload.email == sample_user['email']
        assert token_payload.role == UserRole.ADMIN
        assert token_payload.token_type == TokenType.ACCESS
    
    def test_verify_invalid_token(self, jwt_manager):
        """Test token verification with invalid token"""
        invalid_token = "invalid.token.here"
        token_payload = jwt_manager.verify_token(invalid_token)
        
        assert token_payload is None
    
    def test_verify_expired_token(self, jwt_manager, sample_user):
        """Test token verification with expired token"""
        # Create token with very short expiration
        original_expire = jwt_manager.access_token_expire_minutes
        jwt_manager.access_token_expire_minutes = 0.01  # 0.6 seconds
        
        token = jwt_manager.create_access_token(sample_user)
        
        # Wait for token to expire
        time.sleep(1)
        
        token_payload = jwt_manager.verify_token(token)
        assert token_payload is None
        
        # Restore original expiration
        jwt_manager.access_token_expire_minutes = original_expire
    
    def test_token_blacklisting(self, jwt_manager, sample_user):
        """Test token blacklisting functionality"""
        token = jwt_manager.create_access_token(sample_user)
        token_payload = jwt_manager.verify_token(token)
        
        # Token should be valid initially
        assert token_payload is not None
        
        # Blacklist token
        success = jwt_manager.blacklist_token(token_payload.jti)
        assert success is True
        
        # Token should be invalid after blacklisting
        token_payload_after = jwt_manager.verify_token(token)
        assert token_payload_after is None
    
    def test_refresh_access_token(self, jwt_manager, sample_user):
        """Test access token refresh"""
        refresh_token = jwt_manager.create_refresh_token(sample_user)
        
        result = jwt_manager.refresh_access_token(refresh_token)
        assert result is not None
        
        new_access_token, new_refresh_token = result
        
        # Verify new tokens are valid
        access_payload = jwt_manager.verify_token(new_access_token, TokenType.ACCESS)
        refresh_payload = jwt_manager.verify_token(new_refresh_token, TokenType.REFRESH)
        
        assert access_payload is not None
        assert refresh_payload is not None
        assert access_payload.user_id == sample_user['id']
        assert refresh_payload.user_id == sample_user['id']
    
    def test_role_permissions(self, jwt_manager):
        """Test role-based permissions"""
        # Test admin permissions
        admin_user = {'id': '1', 'username': 'admin', 'email': 'admin@test.com', 'role': 'admin'}
        admin_token = jwt_manager.create_access_token(admin_user)
        admin_payload = jwt_manager.verify_token(admin_token)
        
        assert jwt_manager.has_permission(admin_payload, "read:all")
        assert jwt_manager.has_permission(admin_payload, "write:all")
        assert jwt_manager.has_permission(admin_payload, "users:manage")
        
        # Test driver permissions
        driver_user = {'id': '2', 'username': 'driver', 'email': 'driver@test.com', 'role': 'driver'}
        driver_token = jwt_manager.create_access_token(driver_user)
        driver_payload = jwt_manager.verify_token(driver_token)
        
        assert jwt_manager.has_permission(driver_payload, "read:own_vehicle")
        assert jwt_manager.has_permission(driver_payload, "tracking:update")
        assert not jwt_manager.has_permission(driver_payload, "users:manage")
        assert not jwt_manager.has_permission(driver_payload, "read:all")

class TestPasswordManager:
    """Test suite for password management"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123!"
        
        # Hash password
        hashed = PasswordManager.hash_password(password)
        assert isinstance(hashed, str)
        assert len(hashed) > 0
        assert hashed != password
        
        # Verify correct password
        assert PasswordManager.verify_password(password, hashed) is True
        
        # Verify incorrect password
        assert PasswordManager.verify_password("wrongpassword", hashed) is False
    
    def test_password_strength_validation(self):
        """Test password strength validation"""
        # Strong password
        strong_result = PasswordManager.validate_password_strength("StrongPass123!")
        assert strong_result['is_valid'] is True
        assert strong_result['strength'] == 'strong'
        assert len(strong_result['issues']) == 0
        
        # Weak password
        weak_result = PasswordManager.validate_password_strength("weak")
        assert weak_result['is_valid'] is False
        assert weak_result['strength'] == 'weak'
        assert len(weak_result['issues']) > 0
        
        # Common password
        common_result = PasswordManager.validate_password_strength("password")
        assert common_result['is_valid'] is False
        assert "too common" in str(common_result['issues'])

class TestAuthenticationEndpoints:
    """Test suite for authentication API endpoints"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_login_success(self, client):
        """Test successful login"""
        response = client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "admin123!"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        assert "user" in data
        assert data["user"]["username"] == "admin"
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]
    
    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user"""
        response = client.post("/api/v1/auth/login", json={
            "username": "nonexistent",
            "password": "password123"
        })
        
        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]
    
    def test_get_current_user_info(self, client):
        """Test getting current user information"""
        # First login to get token
        login_response = client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "admin123!"
        })
        
        token = login_response.json()["access_token"]
        
        # Get user info
        response = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["username"] == "admin"
        assert data["email"] == "admin@aura.com"
        assert data["role"] == "super_admin"
        assert "permissions" in data
    
    def test_refresh_token(self, client):
        """Test token refresh"""
        # First login to get tokens
        login_response = client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "admin123!"
        })
        
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh token
        response = client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_logout(self, client):
        """Test user logout"""
        # First login to get token
        login_response = client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "admin123!"
        })
        
        token = login_response.json()["access_token"]
        
        # Logout
        response = client.post("/api/v1/auth/logout", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        assert "Logged out successfully" in response.json()["message"]
    
    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token"""
        response = client.get("/api/v1/admin/rate-limit-metrics")
        
        assert response.status_code == 401
        assert "Authentication failed" in response.json()["error"]
    
    def test_protected_endpoint_with_token(self, client):
        """Test accessing protected endpoint with valid token"""
        # First login to get token
        login_response = client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "admin123!"
        })
        
        token = login_response.json()["access_token"]
        
        # Access protected endpoint
        response = client.get("/api/v1/admin/rate-limit-metrics", headers={
            "Authorization": f"Bearer {token}"
        })
        
        # Should succeed (admin has access)
        assert response.status_code == 200
    
    def test_role_based_access_control(self, client):
        """Test role-based access control"""
        # Login as driver (lower privilege)
        login_response = client.post("/api/v1/auth/login", json={
            "username": "driver",
            "password": "driver123!"
        })
        
        token = login_response.json()["access_token"]
        
        # Try to access admin endpoint
        response = client.get("/api/v1/admin/rate-limit-metrics", headers={
            "Authorization": f"Bearer {token}"
        })
        
        # Should be forbidden (driver doesn't have admin access)
        assert response.status_code == 401  # Will be 401 due to middleware
    
    def test_token_validation(self, client):
        """Test token validation endpoint"""
        # First login to get token
        login_response = client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "admin123!"
        })
        
        token = login_response.json()["access_token"]
        
        # Validate token
        response = client.post("/api/v1/auth/validate-token", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] is True
        assert data["username"] == "admin"
        assert data["role"] == "super_admin"
        assert "expires_at" in data

class TestAuthenticationMiddleware:
    """Test suite for authentication middleware"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_public_endpoint_access(self, client):
        """Test access to public endpoints without authentication"""
        # Health check should be accessible
        response = client.get("/health")
        assert response.status_code == 200
        
        # API docs should be accessible
        response = client.get("/docs")
        assert response.status_code == 200
    
    def test_authentication_headers(self, client):
        """Test authentication headers in responses"""
        # Login to get token
        login_response = client.post("/api/v1/auth/login", json={
            "username": "admin",
            "password": "admin123!"
        })
        
        token = login_response.json()["access_token"]
        
        # Make authenticated request
        response = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        assert "X-User-ID" in response.headers
        assert "X-User-Role" in response.headers
        assert response.headers["X-User-Role"] == "super_admin"

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
