"""
🛡️ Input Sanitization & Validation Middleware
Comprehensive input validation, sanitization, and security protection
"""

import re
import html
import json
import logging
from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime
from decimal import Decimal, InvalidOperation
import bleach
from pydantic import BaseModel, ValidationError, validator
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import sqlparse
from urllib.parse import unquote

logger = logging.getLogger(__name__)

class SecurityConfig:
    """Security configuration for input validation"""
    
    # XSS Protection
    ALLOWED_HTML_TAGS = []  # No HTML tags allowed by default
    ALLOWED_HTML_ATTRIBUTES = {}
    
    # SQL Injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)",
        r"(--|#|/\*|\*/)",
        r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
        r"(\b(OR|AND)\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?)",
        r"(UNION\s+SELECT)",
        r"(INSERT\s+INTO)",
        r"(DROP\s+TABLE)",
        r"(EXEC\s*\()",
        r"(SCRIPT\s*>)",
    ]
    
    # XSS patterns
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"vbscript:",
        r"onload\s*=",
        r"onerror\s*=",
        r"onclick\s*=",
        r"onmouseover\s*=",
        r"onfocus\s*=",
        r"onblur\s*=",
        r"<iframe[^>]*>",
        r"<object[^>]*>",
        r"<embed[^>]*>",
        r"<link[^>]*>",
        r"<meta[^>]*>",
    ]
    
    # Path traversal patterns
    PATH_TRAVERSAL_PATTERNS = [
        r"\.\./",
        r"\.\.\\",
        r"%2e%2e%2f",
        r"%2e%2e%5c",
        r"..%2f",
        r"..%5c",
    ]
    
    # Command injection patterns
    COMMAND_INJECTION_PATTERNS = [
        r"[;&|`$(){}[\]<>]",
        r"\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|wget|curl|nc|telnet|ssh|ftp)\b",
        r"(\||&&|\|\||;|`|\$\(|\${)",
    ]
    
    # Maximum field lengths
    MAX_LENGTHS = {
        'username': 50,
        'email': 254,
        'password': 128,
        'name': 100,
        'description': 1000,
        'comment': 500,
        'address': 200,
        'phone': 20,
        'url': 2048,
        'general': 255
    }

class InputSanitizer:
    """Advanced input sanitization and validation"""
    
    def __init__(self):
        self.config = SecurityConfig()
        
    def sanitize_string(self, value: str, field_type: str = 'general') -> str:
        """Sanitize string input"""
        if not isinstance(value, str):
            return str(value)
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Normalize unicode
        value = value.encode('utf-8', errors='ignore').decode('utf-8')
        
        # HTML escape
        value = html.escape(value)
        
        # Remove potentially dangerous HTML
        value = bleach.clean(
            value,
            tags=self.config.ALLOWED_HTML_TAGS,
            attributes=self.config.ALLOWED_HTML_ATTRIBUTES,
            strip=True
        )
        
        # Enforce length limits
        max_length = self.config.MAX_LENGTHS.get(field_type, self.config.MAX_LENGTHS['general'])
        if len(value) > max_length:
            value = value[:max_length]
            logger.warning(f"Input truncated for field type '{field_type}': length {len(value)} > {max_length}")
        
        return value.strip()
    
    def detect_sql_injection(self, value: str) -> bool:
        """Detect SQL injection attempts"""
        if not isinstance(value, str):
            return False
        
        value_lower = value.lower()
        
        for pattern in self.config.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                logger.warning(f"SQL injection pattern detected: {pattern}")
                return True
        
        # Check for SQL keywords in suspicious contexts
        try:
            parsed = sqlparse.parse(value)
            for statement in parsed:
                if statement.get_type() in ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER']:
                    logger.warning(f"Suspicious SQL statement type detected: {statement.get_type()}")
                    return True
        except Exception:
            pass  # Not valid SQL, continue with other checks
        
        return False
    
    def detect_xss(self, value: str) -> bool:
        """Detect XSS attempts"""
        if not isinstance(value, str):
            return False
        
        value_lower = value.lower()
        
        for pattern in self.config.XSS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                logger.warning(f"XSS pattern detected: {pattern}")
                return True
        
        return False
    
    def detect_path_traversal(self, value: str) -> bool:
        """Detect path traversal attempts"""
        if not isinstance(value, str):
            return False
        
        # URL decode first
        decoded_value = unquote(value)
        
        for pattern in self.config.PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, decoded_value, re.IGNORECASE):
                logger.warning(f"Path traversal pattern detected: {pattern}")
                return True
        
        return False
    
    def detect_command_injection(self, value: str) -> bool:
        """Detect command injection attempts"""
        if not isinstance(value, str):
            return False
        
        for pattern in self.config.COMMAND_INJECTION_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                logger.warning(f"Command injection pattern detected: {pattern}")
                return True
        
        return False
    
    def validate_email(self, email: str) -> bool:
        """Validate email format"""
        if not isinstance(email, str):
            return False
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_pattern, email) is not None
    
    def validate_phone(self, phone: str) -> bool:
        """Validate phone number (Ghana format)"""
        if not isinstance(phone, str):
            return False
        
        # Remove spaces and common separators
        phone_clean = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Ghana phone number patterns
        ghana_patterns = [
            r'^\+233[0-9]{9}$',      # +233XXXXXXXXX
            r'^233[0-9]{9}$',        # 233XXXXXXXXX
            r'^0[0-9]{9}$',          # 0XXXXXXXXX
            r'^[0-9]{9}$',           # XXXXXXXXX
        ]
        
        for pattern in ghana_patterns:
            if re.match(pattern, phone_clean):
                return True
        
        return False
    
    def validate_coordinate(self, coord: Union[str, float]) -> bool:
        """Validate GPS coordinates"""
        try:
            coord_float = float(coord)
            # Ghana coordinates roughly: Lat 4.5-11.5, Lon -3.5-1.5
            if isinstance(coord, str) and ('lat' in coord.lower() or 'latitude' in coord.lower()):
                return 4.0 <= coord_float <= 12.0
            elif isinstance(coord, str) and ('lon' in coord.lower() or 'longitude' in coord.lower()):
                return -4.0 <= coord_float <= 2.0
            else:
                # Generic coordinate validation
                return -180.0 <= coord_float <= 180.0
        except (ValueError, TypeError):
            return False
    
    def sanitize_json(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively sanitize JSON data"""
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                # Sanitize key
                clean_key = self.sanitize_string(str(key))
                
                # Sanitize value
                if isinstance(value, str):
                    sanitized[clean_key] = self.sanitize_string(value)
                elif isinstance(value, (dict, list)):
                    sanitized[clean_key] = self.sanitize_json(value)
                else:
                    sanitized[clean_key] = value
            return sanitized
        elif isinstance(data, list):
            return [self.sanitize_json(item) for item in data]
        elif isinstance(data, str):
            return self.sanitize_string(data)
        else:
            return data

class ValidationSchemas:
    """Pydantic validation schemas for different data types"""
    
    class UserInput(BaseModel):
        username: str
        email: str
        full_name: Optional[str] = None
        phone_number: Optional[str] = None
        
        @validator('username')
        def validate_username(cls, v):
            if not v or len(v) < 3:
                raise ValueError('Username must be at least 3 characters')
            if not re.match(r'^[a-zA-Z0-9_-]+$', v):
                raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
            return v
        
        @validator('email')
        def validate_email(cls, v):
            sanitizer = InputSanitizer()
            if not sanitizer.validate_email(v):
                raise ValueError('Invalid email format')
            return v
        
        @validator('phone_number')
        def validate_phone(cls, v):
            if v:
                sanitizer = InputSanitizer()
                if not sanitizer.validate_phone(v):
                    raise ValueError('Invalid Ghana phone number format')
            return v
    
    class VehicleInput(BaseModel):
        registration_number: str
        vehicle_type: str
        capacity: int
        driver_id: Optional[str] = None
        
        @validator('registration_number')
        def validate_registration(cls, v):
            if not v or len(v) < 3:
                raise ValueError('Registration number must be at least 3 characters')
            # Ghana vehicle registration pattern (simplified)
            if not re.match(r'^[A-Z]{2,3}[-\s]?\d{1,4}[-\s]?[A-Z]{0,2}$', v.upper()):
                raise ValueError('Invalid Ghana vehicle registration format')
            return v.upper()
        
        @validator('capacity')
        def validate_capacity(cls, v):
            if v < 1 or v > 100:
                raise ValueError('Vehicle capacity must be between 1 and 100')
            return v
    
    class RouteInput(BaseModel):
        name: str
        start_location: Dict[str, float]
        end_location: Dict[str, float]
        waypoints: Optional[List[Dict[str, float]]] = []
        fare_amount: Optional[Decimal] = None
        
        @validator('start_location', 'end_location')
        def validate_location(cls, v):
            if not isinstance(v, dict) or 'lat' not in v or 'lng' not in v:
                raise ValueError('Location must have lat and lng coordinates')
            
            sanitizer = InputSanitizer()
            if not sanitizer.validate_coordinate(v['lat']) or not sanitizer.validate_coordinate(v['lng']):
                raise ValueError('Invalid GPS coordinates for Ghana')
            return v
        
        @validator('fare_amount')
        def validate_fare(cls, v):
            if v is not None and (v < 0 or v > 1000):
                raise ValueError('Fare amount must be between 0 and 1000 GHS')
            return v

class InputValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for automatic input validation and sanitization"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.sanitizer = InputSanitizer()
        
        # Endpoints that require special validation
        self.validation_rules = {
            '/api/v1/auth/login': self._validate_login,
            '/api/v1/auth/register': self._validate_registration,
            '/api/v1/vehicles': self._validate_vehicle,
            '/api/v1/routes': self._validate_route,
            '/api/v1/users': self._validate_user,
        }
    
    async def dispatch(self, request: Request, call_next: Callable):
        """Process request through input validation"""
        
        # Skip validation for GET requests and health checks
        if request.method == 'GET' or request.url.path in ['/health', '/docs', '/openapi.json']:
            return await call_next(request)
        
        try:
            # Validate request body if present
            if request.method in ['POST', 'PUT', 'PATCH']:
                await self._validate_request_body(request)
            
            # Validate query parameters
            self._validate_query_params(request)
            
            # Validate headers
            self._validate_headers(request)
            
            # Process request
            response = await call_next(request)
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Input validation error: {e}")
            raise HTTPException(status_code=400, detail="Invalid input data")
    
    async def _validate_request_body(self, request: Request):
        """Validate request body"""
        try:
            # Read body
            body = await request.body()
            if not body:
                return
            
            # Parse JSON
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON format")
            
            # Check for malicious patterns
            self._check_malicious_patterns(data)
            
            # Sanitize data
            sanitized_data = self.sanitizer.sanitize_json(data)
            
            # Apply endpoint-specific validation
            endpoint = request.url.path
            if endpoint in self.validation_rules:
                self.validation_rules[endpoint](sanitized_data)
            
            # Replace request body with sanitized data
            request._body = json.dumps(sanitized_data).encode()
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Request body validation error: {e}")
            raise HTTPException(status_code=400, detail="Invalid request body")
    
    def _validate_query_params(self, request: Request):
        """Validate query parameters"""
        for key, value in request.query_params.items():
            # Check for malicious patterns
            if (self.sanitizer.detect_sql_injection(key) or 
                self.sanitizer.detect_sql_injection(value) or
                self.sanitizer.detect_xss(key) or 
                self.sanitizer.detect_xss(value) or
                self.sanitizer.detect_path_traversal(key) or 
                self.sanitizer.detect_path_traversal(value) or
                self.sanitizer.detect_command_injection(key) or 
                self.sanitizer.detect_command_injection(value)):
                
                logger.warning(f"Malicious query parameter detected: {key}={value}")
                raise HTTPException(status_code=400, detail="Invalid query parameters")
    
    def _validate_headers(self, request: Request):
        """Validate request headers"""
        dangerous_headers = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url']
        
        for header_name, header_value in request.headers.items():
            # Check for header injection
            if '\n' in header_value or '\r' in header_value:
                logger.warning(f"Header injection attempt detected: {header_name}")
                raise HTTPException(status_code=400, detail="Invalid headers")
            
            # Check dangerous headers
            if header_name.lower() in dangerous_headers:
                logger.warning(f"Dangerous header detected: {header_name}")
                raise HTTPException(status_code=400, detail="Forbidden header")
    
    def _check_malicious_patterns(self, data: Any):
        """Check for malicious patterns in data"""
        if isinstance(data, str):
            if (self.sanitizer.detect_sql_injection(data) or
                self.sanitizer.detect_xss(data) or
                self.sanitizer.detect_path_traversal(data) or
                self.sanitizer.detect_command_injection(data)):
                raise HTTPException(status_code=400, detail="Malicious input detected")
        elif isinstance(data, dict):
            for key, value in data.items():
                self._check_malicious_patterns(key)
                self._check_malicious_patterns(value)
        elif isinstance(data, list):
            for item in data:
                self._check_malicious_patterns(item)
    
    def _validate_login(self, data: Dict[str, Any]):
        """Validate login data"""
        required_fields = ['username', 'password']
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Additional login validation
        username = data['username']
        if len(username) < 3 or len(username) > 50:
            raise HTTPException(status_code=400, detail="Invalid username length")
    
    def _validate_registration(self, data: Dict[str, Any]):
        """Validate registration data"""
        try:
            ValidationSchemas.UserInput(**data)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Validation error: {e}")
    
    def _validate_vehicle(self, data: Dict[str, Any]):
        """Validate vehicle data"""
        try:
            ValidationSchemas.VehicleInput(**data)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Validation error: {e}")
    
    def _validate_route(self, data: Dict[str, Any]):
        """Validate route data"""
        try:
            ValidationSchemas.RouteInput(**data)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Validation error: {e}")
    
    def _validate_user(self, data: Dict[str, Any]):
        """Validate user data"""
        try:
            ValidationSchemas.UserInput(**data)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Validation error: {e}")

# Utility functions for manual validation
def validate_and_sanitize_input(data: Any, field_type: str = 'general') -> Any:
    """Manually validate and sanitize input"""
    sanitizer = InputSanitizer()
    
    if isinstance(data, str):
        return sanitizer.sanitize_string(data, field_type)
    elif isinstance(data, dict):
        return sanitizer.sanitize_json(data)
    elif isinstance(data, list):
        return [validate_and_sanitize_input(item, field_type) for item in data]
    else:
        return data

def is_safe_input(data: str) -> bool:
    """Check if input is safe from common attacks"""
    sanitizer = InputSanitizer()
    
    return not (
        sanitizer.detect_sql_injection(data) or
        sanitizer.detect_xss(data) or
        sanitizer.detect_path_traversal(data) or
        sanitizer.detect_command_injection(data)
    )

# Export main components
__all__ = [
    'InputValidationMiddleware',
    'InputSanitizer',
    'ValidationSchemas',
    'validate_and_sanitize_input',
    'is_safe_input'
]
