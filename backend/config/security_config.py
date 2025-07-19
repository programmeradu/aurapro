"""
🔐 Security Configuration
Centralized security configuration for AURA Command Center
"""

import os
from typing import Dict, List, Optional
from enum import Enum

class SecurityLevel(Enum):
    """Security levels for different environments"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    MAXIMUM = "maximum"

class SecurityConfig:
    """Centralized security configuration"""
    
    # Environment settings
    ENVIRONMENT = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Security level based on environment
    SECURITY_LEVELS = {
        'development': SecurityLevel.LOW,
        'testing': SecurityLevel.MEDIUM,
        'staging': SecurityLevel.HIGH,
        'production': SecurityLevel.MAXIMUM
    }
    
    CURRENT_SECURITY_LEVEL = SECURITY_LEVELS.get(ENVIRONMENT, SecurityLevel.MEDIUM)
    
    # Input validation settings
    INPUT_VALIDATION = {
        'enable': True,
        'max_request_size': 10 * 1024 * 1024,  # 10MB
        'max_json_payload': 1024 * 1024,       # 1MB
        'max_query_params': 50,
        'max_header_size': 8192,               # 8KB
        'max_field_length': {
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
    }
    
    # SQL injection protection
    SQL_INJECTION_PROTECTION = {
        'enable': True,
        'detection_threshold': 30,  # Confidence threshold for blocking
        'log_attempts': True,
        'block_malicious': True,
        'sanitize_input': True,
        'use_parameterized_queries': True
    }
    
    # XSS protection settings
    XSS_PROTECTION = {
        'enable': True,
        'detection_threshold': 25,  # Lower threshold for XSS
        'sanitize_html': True,
        'strip_dangerous_tags': True,
        'allowed_html_tags': [
            'p', 'br', 'strong', 'em', 'u', 'i', 'b',
            'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'code', 'pre'
        ],
        'allowed_attributes': {
            '*': ['class', 'id'],
            'a': ['href', 'title'],
            'img': ['src', 'alt', 'title', 'width', 'height'],
        },
        'dangerous_protocols': [
            'javascript:', 'vbscript:', 'data:', 'file:', 'ftp:'
        ]
    }
    
    # Content Security Policy
    CSP_POLICIES = {
        'development': {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "localhost:*", "127.0.0.1:*"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'font-src': ["'self'", "data:"],
            'img-src': ["'self'", "data:", "blob:", "*"],
            'connect-src': ["'self'", "localhost:*", "127.0.0.1:*", "ws:", "wss:"],
            'frame-src': ["'self'"],
            'object-src': ["'none'"],
        },
        'production': {
            'default-src': ["'self'"],
            'script-src': ["'self'"],
            'style-src': ["'self'", "https://fonts.googleapis.com"],
            'font-src': ["'self'", "https://fonts.gstatic.com"],
            'img-src': ["'self'", "data:", "https:"],
            'connect-src': ["'self'", "https://api.mapbox.com"],
            'frame-src': ["'none'"],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
            'upgrade-insecure-requests': []
        }
    }
    
    # Security headers
    SECURITY_HEADERS = {
        'X-XSS-Protection': '1; mode=block',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin'
    }
    
    # Rate limiting settings (imported from rate limiting config)
    RATE_LIMITING = {
        'enable': True,
        'global_limit': {'requests': 1000, 'window': 3600},
        'ip_limit': {'requests': 100, 'window': 3600},
        'user_limit': {'requests': 500, 'window': 3600},
        'ddos_protection': True,
        'auto_ban_duration': 3600
    }
    
    # Authentication and session security
    AUTH_SECURITY = {
        'jwt_algorithm': 'HS256',
        'jwt_expiration': 3600,  # 1 hour
        'refresh_token_expiration': 86400 * 7,  # 7 days
        'password_min_length': 8,
        'password_require_uppercase': True,
        'password_require_lowercase': True,
        'password_require_numbers': True,
        'password_require_special': True,
        'max_login_attempts': 5,
        'lockout_duration': 900,  # 15 minutes
        'session_timeout': 3600,  # 1 hour
        'secure_cookies': ENVIRONMENT == 'production',
        'httponly_cookies': True,
        'samesite_cookies': 'strict'
    }
    
    # File upload security
    FILE_UPLOAD_SECURITY = {
        'enable': True,
        'max_file_size': 5 * 1024 * 1024,  # 5MB
        'allowed_extensions': ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.csv'],
        'blocked_extensions': ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'],
        'scan_for_malware': False,  # Would require additional tools
        'quarantine_suspicious': True,
        'upload_directory': '/var/uploads/aura',
        'temp_directory': '/tmp/aura_uploads'
    }
    
    # Logging and monitoring
    SECURITY_LOGGING = {
        'enable': True,
        'log_level': 'INFO' if ENVIRONMENT == 'production' else 'DEBUG',
        'log_file': '/var/log/aura/security.log',
        'log_rotation': True,
        'log_retention_days': 30,
        'alert_on_threats': True,
        'alert_threshold': 10,  # Alert after 10 threats in 1 hour
        'webhook_url': os.getenv('SECURITY_WEBHOOK_URL'),
        'email_alerts': os.getenv('SECURITY_EMAIL_ALERTS', '').split(',')
    }
    
    # API security
    API_SECURITY = {
        'require_https': ENVIRONMENT == 'production',
        'api_key_required': False,  # Set to True for API key authentication
        'cors_origins': ['http://localhost:3000', 'http://localhost:3001'] if ENVIRONMENT == 'development' else [],
        'cors_credentials': True,
        'cors_methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'cors_headers': ['*'],
        'request_timeout': 30,  # seconds
        'max_concurrent_requests': 100
    }
    
    # Database security
    DATABASE_SECURITY = {
        'use_ssl': ENVIRONMENT == 'production',
        'encrypt_sensitive_fields': True,
        'backup_encryption': True,
        'connection_timeout': 30,
        'query_timeout': 60,
        'max_connections': 20,
        'connection_pool_size': 10
    }
    
    # Ghana-specific security considerations
    GHANA_SECURITY = {
        'validate_ghana_phone': True,
        'validate_ghana_coordinates': True,
        'ghana_phone_patterns': [
            r'^\+233[0-9]{9}$',      # +233XXXXXXXXX
            r'^233[0-9]{9}$',        # 233XXXXXXXXX
            r'^0[0-9]{9}$',          # 0XXXXXXXXX
            r'^[0-9]{9}$',           # XXXXXXXXX
        ],
        'ghana_coordinate_bounds': {
            'lat_min': 4.0,
            'lat_max': 12.0,
            'lon_min': -4.0,
            'lon_max': 2.0
        },
        'local_currency_validation': True,
        'cedis_max_amount': 10000.0  # Maximum GHS amount for transactions
    }

class SecurityConfigManager:
    """Manager for security configuration based on environment"""
    
    def __init__(self, environment: str = None):
        self.environment = environment or SecurityConfig.ENVIRONMENT
        self.config = SecurityConfig()
    
    def get_security_level(self) -> SecurityLevel:
        """Get current security level"""
        return self.config.SECURITY_LEVELS.get(self.environment, SecurityLevel.MEDIUM)
    
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment == 'development'
    
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment == 'production'
    
    def get_csp_policy(self) -> Dict[str, List[str]]:
        """Get Content Security Policy for current environment"""
        if self.is_production():
            return self.config.CSP_POLICIES['production']
        else:
            return self.config.CSP_POLICIES['development']
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins for current environment"""
        return self.config.API_SECURITY['cors_origins']
    
    def should_enforce_https(self) -> bool:
        """Check if HTTPS should be enforced"""
        return self.config.API_SECURITY['require_https']
    
    def get_rate_limits(self) -> Dict:
        """Get rate limiting configuration"""
        return self.config.RATE_LIMITING
    
    def get_input_validation_config(self) -> Dict:
        """Get input validation configuration"""
        return self.config.INPUT_VALIDATION
    
    def get_auth_config(self) -> Dict:
        """Get authentication configuration"""
        return self.config.AUTH_SECURITY
    
    def get_logging_config(self) -> Dict:
        """Get security logging configuration"""
        return self.config.SECURITY_LOGGING
    
    def validate_security_config(self) -> Dict[str, bool]:
        """Validate security configuration"""
        validation_results = {
            'input_validation_enabled': self.config.INPUT_VALIDATION['enable'],
            'sql_injection_protection': self.config.SQL_INJECTION_PROTECTION['enable'],
            'xss_protection_enabled': self.config.XSS_PROTECTION['enable'],
            'rate_limiting_enabled': self.config.RATE_LIMITING['enable'],
            'security_headers_configured': bool(self.config.SECURITY_HEADERS),
            'csp_policy_configured': bool(self.get_csp_policy()),
            'auth_security_configured': bool(self.config.AUTH_SECURITY),
            'logging_enabled': self.config.SECURITY_LOGGING['enable'],
            'https_enforced': self.should_enforce_https(),
            'cors_configured': bool(self.get_cors_origins()) or not self.is_production()
        }
        
        return validation_results
    
    def get_security_summary(self) -> Dict:
        """Get comprehensive security configuration summary"""
        validation = self.validate_security_config()
        
        return {
            'environment': self.environment,
            'security_level': self.get_security_level().value,
            'configuration_valid': all(validation.values()),
            'enabled_features': [key for key, value in validation.items() if value],
            'disabled_features': [key for key, value in validation.items() if not value],
            'recommendations': self._get_security_recommendations(validation)
        }
    
    def _get_security_recommendations(self, validation: Dict[str, bool]) -> List[str]:
        """Get security recommendations based on current configuration"""
        recommendations = []
        
        if not validation['https_enforced'] and self.is_production():
            recommendations.append("Enable HTTPS enforcement for production")
        
        if not validation['rate_limiting_enabled']:
            recommendations.append("Enable rate limiting to prevent abuse")
        
        if not validation['input_validation_enabled']:
            recommendations.append("Enable input validation to prevent injection attacks")
        
        if not validation['logging_enabled']:
            recommendations.append("Enable security logging for monitoring")
        
        if self.is_development() and validation['https_enforced']:
            recommendations.append("Consider disabling HTTPS enforcement for development")
        
        return recommendations

# Global security configuration instance
security_config = SecurityConfigManager()

# Export main components
__all__ = [
    'SecurityConfig',
    'SecurityConfigManager',
    'SecurityLevel',
    'security_config'
]
