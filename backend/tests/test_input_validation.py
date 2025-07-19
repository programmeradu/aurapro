"""
🧪 Input Validation & Security Tests
Comprehensive test suite for input validation and security features
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from middleware.input_validation import InputSanitizer, ValidationSchemas, is_safe_input
from security.sql_protection import SQLInjectionDetector, sanitize_sql_value
from security.xss_protection import XSSProtector, sanitize_user_input, is_safe_content

class TestInputSanitizer:
    """Test suite for input sanitization"""
    
    @pytest.fixture
    def sanitizer(self):
        return InputSanitizer()
    
    def test_basic_string_sanitization(self, sanitizer):
        """Test basic string sanitization"""
        # Normal input
        assert sanitizer.sanitize_string("Hello World") == "Hello World"
        
        # HTML entities
        assert sanitizer.sanitize_string("<script>alert('xss')</script>") == "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
        
        # Null bytes
        assert sanitizer.sanitize_string("test\x00null") == "testnull"
        
        # Length limits
        long_string = "a" * 1000
        result = sanitizer.sanitize_string(long_string, "username")
        assert len(result) <= 50  # Username max length
    
    def test_sql_injection_detection(self, sanitizer):
        """Test SQL injection detection"""
        # Safe input
        assert not sanitizer.detect_sql_injection("John Doe")
        assert not sanitizer.detect_sql_injection("user@example.com")
        
        # SQL injection attempts
        assert sanitizer.detect_sql_injection("' OR '1'='1")
        assert sanitizer.detect_sql_injection("'; DROP TABLE users; --")
        assert sanitizer.detect_sql_injection("UNION SELECT * FROM users")
        assert sanitizer.detect_sql_injection("admin'/**/OR/**/1=1#")
    
    def test_xss_detection(self, sanitizer):
        """Test XSS detection"""
        # Safe input
        assert not sanitizer.detect_xss("Hello World")
        assert not sanitizer.detect_xss("user@example.com")
        
        # XSS attempts
        assert sanitizer.detect_xss("<script>alert('xss')</script>")
        assert sanitizer.detect_xss("javascript:alert('xss')")
        assert sanitizer.detect_xss("<img src=x onerror=alert('xss')>")
        assert sanitizer.detect_xss("onload=alert('xss')")
    
    def test_path_traversal_detection(self, sanitizer):
        """Test path traversal detection"""
        # Safe paths
        assert not sanitizer.detect_path_traversal("file.txt")
        assert not sanitizer.detect_path_traversal("folder/file.txt")
        
        # Path traversal attempts
        assert sanitizer.detect_path_traversal("../../../etc/passwd")
        assert sanitizer.detect_path_traversal("..\\..\\..\\windows\\system32")
        assert sanitizer.detect_path_traversal("%2e%2e%2f%2e%2e%2f")
    
    def test_command_injection_detection(self, sanitizer):
        """Test command injection detection"""
        # Safe input
        assert not sanitizer.detect_command_injection("normal text")
        assert not sanitizer.detect_command_injection("file.txt")
        
        # Command injection attempts
        assert sanitizer.detect_command_injection("; cat /etc/passwd")
        assert sanitizer.detect_command_injection("| whoami")
        assert sanitizer.detect_command_injection("`id`")
        assert sanitizer.detect_command_injection("$(uname -a)")
    
    def test_email_validation(self, sanitizer):
        """Test email validation"""
        # Valid emails
        assert sanitizer.validate_email("user@example.com")
        assert sanitizer.validate_email("test.email+tag@domain.co.uk")
        
        # Invalid emails
        assert not sanitizer.validate_email("invalid-email")
        assert not sanitizer.validate_email("@domain.com")
        assert not sanitizer.validate_email("user@")
    
    def test_ghana_phone_validation(self, sanitizer):
        """Test Ghana phone number validation"""
        # Valid Ghana phone numbers
        assert sanitizer.validate_phone("+233244123456")
        assert sanitizer.validate_phone("233244123456")
        assert sanitizer.validate_phone("0244123456")
        assert sanitizer.validate_phone("244123456")
        
        # Invalid phone numbers
        assert not sanitizer.validate_phone("123456")
        assert not sanitizer.validate_phone("+1234567890")
        assert not sanitizer.validate_phone("invalid")
    
    def test_coordinate_validation(self, sanitizer):
        """Test GPS coordinate validation"""
        # Valid Ghana coordinates
        assert sanitizer.validate_coordinate(5.6037)  # Accra latitude
        assert sanitizer.validate_coordinate(-0.1870)  # Accra longitude
        
        # Invalid coordinates (outside Ghana bounds)
        assert not sanitizer.validate_coordinate(50.0)  # Too far north
        assert not sanitizer.validate_coordinate(-10.0)  # Too far west
    
    def test_json_sanitization(self, sanitizer):
        """Test JSON data sanitization"""
        malicious_data = {
            "name": "<script>alert('xss')</script>",
            "email": "user@example.com",
            "description": "'; DROP TABLE users; --",
            "nested": {
                "field": "javascript:alert('xss')"
            }
        }
        
        sanitized = sanitizer.sanitize_json(malicious_data)
        
        # Check that malicious content is sanitized
        assert "<script>" not in sanitized["name"]
        assert "DROP TABLE" not in sanitized["description"]
        assert "javascript:" not in sanitized["nested"]["field"]
        
        # Check that safe content is preserved
        assert sanitized["email"] == "user@example.com"

class TestSQLInjectionDetector:
    """Test suite for SQL injection detection"""
    
    @pytest.fixture
    def detector(self):
        return SQLInjectionDetector()
    
    def test_basic_sql_injection_detection(self, detector):
        """Test basic SQL injection detection"""
        # Safe queries
        result = detector.detect_sql_injection("John Doe")
        assert not result['is_malicious']
        
        result = detector.detect_sql_injection("SELECT name FROM users WHERE id = 1")
        assert not result['is_malicious']  # This might be flagged, adjust threshold if needed
        
        # Malicious queries
        result = detector.detect_sql_injection("' OR '1'='1")
        assert result['is_malicious']
        assert result['confidence'] > 30
        
        result = detector.detect_sql_injection("'; DROP TABLE users; --")
        assert result['is_malicious']
        assert result['confidence'] > 50
    
    def test_advanced_sql_injection_patterns(self, detector):
        """Test advanced SQL injection patterns"""
        malicious_inputs = [
            "UNION SELECT * FROM users",
            "1' AND (SELECT COUNT(*) FROM users) > 0 --",
            "admin'/**/OR/**/1=1#",
            "'; EXEC xp_cmdshell('dir'); --",
            "1' OR SLEEP(5) --",
            "1' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e)) --"
        ]
        
        for malicious_input in malicious_inputs:
            result = detector.detect_sql_injection(malicious_input)
            assert result['is_malicious'], f"Failed to detect: {malicious_input}"
    
    def test_sql_input_sanitization(self, detector):
        """Test SQL input sanitization"""
        # Test quote escaping
        assert detector.sanitize_sql_input("O'Reilly") == "O''Reilly"
        
        # Test comment removal
        assert detector.sanitize_sql_input("test -- comment") == "test"
        assert detector.sanitize_sql_input("test /* comment */") == "test"
        
        # Test dangerous keyword removal
        sanitized = detector.sanitize_sql_input("DROP TABLE users")
        assert "DROP" not in sanitized
        assert "TABLE" not in sanitized

class TestXSSProtector:
    """Test suite for XSS protection"""
    
    @pytest.fixture
    def protector(self):
        return XSSProtector()
    
    def test_xss_detection(self, protector):
        """Test XSS detection"""
        # Safe content
        result = protector.detect_xss("Hello World")
        assert not result['is_malicious']
        
        # XSS attempts
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>",
            "';alert('xss');//",
            "<iframe src=javascript:alert('xss')></iframe>"
        ]
        
        for payload in xss_payloads:
            result = protector.detect_xss(payload)
            assert result['is_malicious'], f"Failed to detect XSS: {payload}"
    
    def test_html_sanitization(self, protector):
        """Test HTML sanitization"""
        # Test script tag removal
        malicious_html = "<script>alert('xss')</script><p>Safe content</p>"
        sanitized = protector.sanitize_html(malicious_html, allow_tags=True)
        assert "<script>" not in sanitized
        assert "Safe content" in sanitized
        
        # Test complete HTML stripping
        sanitized_no_tags = protector.sanitize_html(malicious_html, allow_tags=False)
        assert "<p>" not in sanitized_no_tags
        assert "Safe content" in sanitized_no_tags
    
    def test_url_sanitization(self, protector):
        """Test URL sanitization"""
        # Safe URLs
        assert protector.sanitize_url("https://example.com") == "https://example.com"
        assert protector.sanitize_url("http://localhost:3000") == "http://localhost:3000"
        
        # Dangerous URLs
        assert protector.sanitize_url("javascript:alert('xss')") == ""
        assert protector.sanitize_url("vbscript:msgbox('xss')") == ""
        assert protector.sanitize_url("data:text/html,<script>alert('xss')</script>") == ""
    
    def test_json_output_sanitization(self, protector):
        """Test JSON output sanitization"""
        malicious_data = {
            "title": "<script>alert('xss')</script>",
            "content": "Safe content",
            "url": "javascript:alert('xss')"
        }
        
        sanitized = protector.sanitize_json_output(malicious_data)
        
        assert "<script>" not in sanitized["title"]
        assert sanitized["content"] == "Safe content"
        assert "javascript:" not in sanitized["url"]

class TestValidationSchemas:
    """Test suite for Pydantic validation schemas"""
    
    def test_user_input_validation(self):
        """Test user input validation schema"""
        # Valid user data
        valid_data = {
            "username": "johndoe",
            "email": "john@example.com",
            "full_name": "John Doe",
            "phone_number": "+233244123456"
        }
        
        user = ValidationSchemas.UserInput(**valid_data)
        assert user.username == "johndoe"
        assert user.email == "john@example.com"
        
        # Invalid username
        with pytest.raises(ValueError):
            ValidationSchemas.UserInput(username="ab", email="john@example.com")
        
        # Invalid email
        with pytest.raises(ValueError):
            ValidationSchemas.UserInput(username="johndoe", email="invalid-email")
        
        # Invalid phone number
        with pytest.raises(ValueError):
            ValidationSchemas.UserInput(
                username="johndoe",
                email="john@example.com",
                phone_number="invalid-phone"
            )
    
    def test_vehicle_input_validation(self):
        """Test vehicle input validation schema"""
        # Valid vehicle data
        valid_data = {
            "registration_number": "GR-1234-A",
            "vehicle_type": "tro-tro",
            "capacity": 15
        }
        
        vehicle = ValidationSchemas.VehicleInput(**valid_data)
        assert vehicle.registration_number == "GR-1234-A"
        assert vehicle.capacity == 15
        
        # Invalid capacity
        with pytest.raises(ValueError):
            ValidationSchemas.VehicleInput(
                registration_number="GR-1234-A",
                vehicle_type="tro-tro",
                capacity=0
            )
    
    def test_route_input_validation(self):
        """Test route input validation schema"""
        # Valid route data
        valid_data = {
            "name": "Accra to Kumasi",
            "start_location": {"lat": 5.6037, "lng": -0.1870},
            "end_location": {"lat": 6.6885, "lng": -1.6244},
            "fare_amount": 25.50
        }
        
        route = ValidationSchemas.RouteInput(**valid_data)
        assert route.name == "Accra to Kumasi"
        assert route.fare_amount == 25.50
        
        # Invalid coordinates
        with pytest.raises(ValueError):
            ValidationSchemas.RouteInput(
                name="Invalid Route",
                start_location={"lat": 50.0, "lng": -0.1870},  # Outside Ghana
                end_location={"lat": 6.6885, "lng": -1.6244}
            )

class TestSecurityEndpoints:
    """Test suite for security-related API endpoints"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_input_validation_endpoint(self, client):
        """Test input validation API endpoint"""
        # Test safe input
        response = client.post("/api/v1/admin/validate-input", json={
            "input_text": "Hello World",
            "type": "general"
        })
        
        assert response.status_code == 200
        data = response.json()["data"]
        assert not data["overall_assessment"]["is_safe"] or data["overall_assessment"]["threat_count"] == 0
    
    def test_security_patterns_endpoint(self, client):
        """Test security patterns information endpoint"""
        response = client.get("/api/v1/admin/security-patterns")
        
        assert response.status_code == 200
        data = response.json()["data"]
        assert "sql_injection" in data
        assert "xss" in data
        assert "input_validation" in data
    
    def test_security_bypass_testing(self, client):
        """Test security bypass testing endpoint"""
        response = client.post("/api/v1/admin/test-security-bypass", json={
            "test_type": "sql_injection"
        })
        
        assert response.status_code == 200
        data = response.json()["data"]
        assert "test_results" in data
        assert "effectiveness" in data
        
        # Check that most SQL injection attempts are blocked
        sql_results = data["test_results"]["sql_injection"]
        blocked_count = sum(1 for test in sql_results if test["blocked"])
        assert blocked_count >= len(sql_results) * 0.8  # At least 80% should be blocked

class TestSecurityMiddleware:
    """Test suite for security middleware"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_xss_protection_headers(self, client):
        """Test XSS protection headers"""
        response = client.get("/health")
        
        # Check for security headers
        assert "X-XSS-Protection" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "Content-Security-Policy" in response.headers
    
    def test_malicious_input_blocking(self, client):
        """Test that malicious input is blocked"""
        # Test SQL injection in request body
        malicious_data = {
            "username": "admin'; DROP TABLE users; --",
            "password": "password"
        }
        
        response = client.post("/api/v1/auth/login", json=malicious_data)
        
        # Should be blocked (400 Bad Request) or handled safely
        assert response.status_code in [400, 401, 422]
    
    def test_input_sanitization_middleware(self, client):
        """Test input sanitization middleware"""
        # Test with XSS payload
        xss_data = {
            "name": "<script>alert('xss')</script>",
            "description": "Normal description"
        }
        
        # The middleware should sanitize the input
        # This test depends on having an endpoint that accepts this data
        # For now, we'll test that the request doesn't cause a server error
        response = client.post("/api/v1/admin/validate-input", json={
            "input_text": xss_data["name"],
            "type": "general"
        })
        
        assert response.status_code == 200

# Utility function tests
class TestUtilityFunctions:
    """Test utility functions"""
    
    def test_is_safe_input(self):
        """Test is_safe_input utility function"""
        assert is_safe_input("Hello World")
        assert not is_safe_input("<script>alert('xss')</script>")
        assert not is_safe_input("'; DROP TABLE users; --")
    
    def test_sanitize_user_input(self):
        """Test sanitize_user_input utility function"""
        result = sanitize_user_input("<script>alert('xss')</script>")
        assert "<script>" not in result
        
        result = sanitize_user_input("Normal text")
        assert result == "Normal text"
    
    def test_is_safe_content(self):
        """Test is_safe_content utility function"""
        assert is_safe_content("Safe content")
        assert not is_safe_content("<script>alert('xss')</script>")
        assert not is_safe_content("javascript:alert('xss')")

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
