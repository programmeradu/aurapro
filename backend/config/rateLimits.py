"""
⚙️ Rate Limiting Configuration
Centralized configuration for rate limits, DDoS protection, and security policies
"""

from typing import Dict, List
import os

class RateLimitSettings:
    """Centralized rate limiting configuration"""
    
    # Redis Configuration
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_RATE_LIMIT_DB', 1))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
    
    # Global Rate Limits (requests per time window in seconds)
    GLOBAL_LIMITS = {
        'default': {
            'requests': 1000,
            'window': 3600,  # 1 hour
            'description': 'Default global limit'
        },
        'burst': {
            'requests': 50,
            'window': 60,    # 1 minute
            'description': 'Burst protection'
        }
    }
    
    # IP-based Rate Limits
    IP_LIMITS = {
        'standard': {
            'requests': 100,
            'window': 3600,
            'description': 'Standard IP limit'
        },
        'strict': {
            'requests': 50,
            'window': 3600,
            'description': 'Strict IP limit for suspicious IPs'
        },
        'login_attempts': {
            'requests': 5,
            'window': 900,   # 15 minutes
            'description': 'Login attempt limit per IP'
        }
    }
    
    # User Role-based Limits
    USER_ROLE_LIMITS = {
        'super_admin': {
            'requests': 5000,
            'window': 3600,
            'description': 'Super admin access'
        },
        'admin': {
            'requests': 3000,
            'window': 3600,
            'description': 'Admin access'
        },
        'fleet_manager': {
            'requests': 2000,
            'window': 3600,
            'description': 'Fleet manager access'
        },
        'dispatcher': {
            'requests': 1500,
            'window': 3600,
            'description': 'Dispatcher access'
        },
        'analyst': {
            'requests': 1000,
            'window': 3600,
            'description': 'Analyst access'
        },
        'maintenance': {
            'requests': 800,
            'window': 3600,
            'description': 'Maintenance staff access'
        },
        'driver': {
            'requests': 500,
            'window': 3600,
            'description': 'Driver access'
        },
        'commuter': {
            'requests': 300,
            'window': 3600,
            'description': 'Mobile app commuter access'
        },
        'viewer': {
            'requests': 200,
            'window': 3600,
            'description': 'Read-only viewer access'
        }
    }
    
    # Endpoint-specific Rate Limits
    ENDPOINT_LIMITS = {
        # Authentication endpoints
        '/api/v1/auth/login': {
            'requests': 5,
            'window': 900,   # 15 minutes
            'description': 'Login attempts'
        },
        '/api/v1/auth/register': {
            'requests': 3,
            'window': 3600,
            'description': 'Registration attempts'
        },
        '/api/v1/auth/forgot-password': {
            'requests': 3,
            'window': 3600,
            'description': 'Password reset requests'
        },
        '/api/v1/auth/verify': {
            'requests': 10,
            'window': 300,   # 5 minutes
            'description': 'Token verification'
        },
        
        # Vehicle and fleet management
        '/api/v1/vehicles': {
            'requests': 500,
            'window': 3600,
            'description': 'Vehicle data access'
        },
        '/api/v1/vehicles/create': {
            'requests': 20,
            'window': 3600,
            'description': 'Vehicle creation'
        },
        '/api/v1/vehicles/update': {
            'requests': 100,
            'window': 3600,
            'description': 'Vehicle updates'
        },
        '/api/v1/vehicles/delete': {
            'requests': 10,
            'window': 3600,
            'description': 'Vehicle deletion'
        },
        
        # Route optimization
        '/api/v1/optimize/routes': {
            'requests': 100,
            'window': 3600,
            'description': 'Route optimization requests'
        },
        '/api/v1/optimize/routes/enhanced': {
            'requests': 50,
            'window': 3600,
            'description': 'Enhanced route optimization'
        },
        
        # Predictive maintenance
        '/api/v1/maintenance/sensors': {
            'requests': 1000,
            'window': 3600,
            'description': 'Sensor data access'
        },
        '/api/v1/maintenance/predict': {
            'requests': 200,
            'window': 3600,
            'description': 'Maintenance predictions'
        },
        '/api/v1/maintenance/schedule': {
            'requests': 100,
            'window': 3600,
            'description': 'Maintenance scheduling'
        },
        
        # Traffic and real-time data
        '/api/v1/traffic/live': {
            'requests': 500,
            'window': 3600,
            'description': 'Live traffic data'
        },
        '/api/v1/traffic/predictions': {
            'requests': 300,
            'window': 3600,
            'description': 'Traffic predictions'
        },
        '/api/v1/traffic/alerts': {
            'requests': 200,
            'window': 3600,
            'description': 'Traffic alerts'
        },
        
        # Analytics and reporting
        '/api/v1/analytics': {
            'requests': 200,
            'window': 3600,
            'description': 'Analytics data'
        },
        '/api/v1/reports': {
            'requests': 50,
            'window': 3600,
            'description': 'Report generation'
        },
        '/api/v1/export': {
            'requests': 10,
            'window': 3600,
            'description': 'Data export'
        },
        
        # Mobile app specific endpoints
        '/api/v1/mobile/journey-plan': {
            'requests': 1000,
            'window': 3600,
            'description': 'Mobile journey planning'
        },
        '/api/v1/mobile/live-tracking': {
            'requests': 2000,
            'window': 3600,
            'description': 'Mobile live tracking'
        },
        '/api/v1/mobile/community-reports': {
            'requests': 100,
            'window': 3600,
            'description': 'Community reports'
        }
    }
    
    # DDoS Protection Settings
    DDOS_PROTECTION = {
        'enable': True,
        'requests_per_second_threshold': 50,
        'unique_ips_burst_threshold': 100,
        'burst_detection_window': 60,     # seconds
        'auto_ban_duration': 3600,        # 1 hour
        'manual_ban_duration': 86400,     # 24 hours
        'whitelist_ips': [
            '127.0.0.1',
            '::1',
            # Add trusted IPs here
        ],
        'suspicious_user_agents': [
            'bot', 'crawler', 'spider', 'scraper', 'hack', 'attack',
            'injection', 'xss', 'sql', 'script', 'exploit', 'nikto',
            'nmap', 'masscan', 'zap', 'burp', 'sqlmap'
        ]
    }
    
    # Geolocation-based Limits
    GEOLOCATION_LIMITS = {
        'enable': False,  # Disabled by default
        'country_limits': {
            'GH': {  # Ghana - primary market
                'requests': 2000,
                'window': 3600,
                'description': 'Ghana users'
            },
            'NG': {  # Nigeria - regional market
                'requests': 1000,
                'window': 3600,
                'description': 'Nigeria users'
            },
            'default': {  # Other countries
                'requests': 500,
                'window': 3600,
                'description': 'International users'
            }
        }
    }
    
    # API Key-based Limits
    API_KEY_LIMITS = {
        'free_tier': {
            'requests': 1000,
            'window': 86400,  # 24 hours
            'description': 'Free API tier'
        },
        'basic_tier': {
            'requests': 10000,
            'window': 86400,
            'description': 'Basic API tier'
        },
        'premium_tier': {
            'requests': 100000,
            'window': 86400,
            'description': 'Premium API tier'
        },
        'enterprise_tier': {
            'requests': 1000000,
            'window': 86400,
            'description': 'Enterprise API tier'
        }
    }
    
    # Time-based Rate Limiting
    TIME_BASED_LIMITS = {
        'peak_hours': {
            'hours': [7, 8, 9, 17, 18, 19],  # Rush hours
            'multiplier': 0.8,  # Reduce limits by 20% during peak
            'description': 'Peak hour restrictions'
        },
        'maintenance_window': {
            'hours': [2, 3, 4],  # 2-4 AM
            'multiplier': 0.5,  # Reduce limits by 50% during maintenance
            'description': 'Maintenance window restrictions'
        }
    }
    
    # Rate Limit Response Configuration
    RESPONSE_CONFIG = {
        'include_headers': True,
        'headers': {
            'X-RateLimit-Limit': True,
            'X-RateLimit-Remaining': True,
            'X-RateLimit-Reset': True,
            'Retry-After': True
        },
        'error_messages': {
            'rate_limit_exceeded': 'Rate limit exceeded. Please try again later.',
            'ddos_protection': 'Request blocked by DDoS protection.',
            'ip_banned': 'Your IP address has been temporarily banned.',
            'suspicious_activity': 'Request blocked due to suspicious activity.'
        }
    }
    
    # Monitoring and Alerting
    MONITORING = {
        'enable_metrics': True,
        'metrics_retention_hours': 24,
        'alert_thresholds': {
            'high_block_rate': 0.1,      # Alert if >10% requests blocked
            'ddos_attacks_per_hour': 5,   # Alert if >5 DDoS attacks per hour
            'banned_ips_per_hour': 20,    # Alert if >20 IPs banned per hour
        },
        'webhook_url': os.getenv('RATE_LIMIT_WEBHOOK_URL'),
        'email_alerts': os.getenv('RATE_LIMIT_EMAIL_ALERTS', '').split(',')
    }
    
    # Cache Configuration
    CACHE_CONFIG = {
        'enable_caching': True,
        'cache_ttl': 300,  # 5 minutes
        'cache_key_prefix': 'aura_rate_limit',
        'cache_backend': 'redis'  # or 'memory'
    }

class SecurityPolicies:
    """Security policies and configurations"""
    
    # Request validation rules
    REQUEST_VALIDATION = {
        'max_request_size': 10 * 1024 * 1024,  # 10MB
        'max_json_payload': 1024 * 1024,       # 1MB
        'max_query_params': 50,
        'max_header_size': 8192,               # 8KB
        'allowed_methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'blocked_extensions': ['.php', '.asp', '.jsp', '.cgi'],
        'blocked_patterns': [
            'union select', 'drop table', 'insert into', 'delete from',
            '<script', 'javascript:', 'vbscript:', 'onload=', 'onerror='
        ]
    }
    
    # IP whitelist and blacklist
    IP_POLICIES = {
        'whitelist': [
            '127.0.0.1',      # Localhost
            '::1',            # IPv6 localhost
            # Add trusted IPs
        ],
        'blacklist': [
            # Add known malicious IPs
        ],
        'auto_blacklist': True,
        'blacklist_duration': 86400  # 24 hours
    }
    
    # User agent policies
    USER_AGENT_POLICIES = {
        'require_user_agent': True,
        'min_user_agent_length': 10,
        'blocked_user_agents': [
            'curl', 'wget', 'python-requests', 'postman',
            'bot', 'crawler', 'spider', 'scraper'
        ],
        'allowed_user_agents': [
            'Mozilla', 'Chrome', 'Safari', 'Firefox', 'Edge',
            'AURA-Mobile-App'  # Our mobile app
        ]
    }

# Environment-specific configurations
class DevelopmentConfig(RateLimitSettings):
    """Development environment rate limits (more lenient)"""
    
    # Increase limits for development
    GLOBAL_LIMITS = {
        'default': {'requests': 10000, 'window': 3600},
        'burst': {'requests': 500, 'window': 60}
    }
    
    # Disable DDoS protection in development
    DDOS_PROTECTION = {**RateLimitSettings.DDOS_PROTECTION, 'enable': False}

class ProductionConfig(RateLimitSettings):
    """Production environment rate limits (strict)"""
    
    # Use default strict limits
    pass

class TestingConfig(RateLimitSettings):
    """Testing environment rate limits (very lenient)"""
    
    # Very high limits for testing
    GLOBAL_LIMITS = {
        'default': {'requests': 100000, 'window': 3600},
        'burst': {'requests': 1000, 'window': 60}
    }
    
    # Disable all protection for testing
    DDOS_PROTECTION = {**RateLimitSettings.DDOS_PROTECTION, 'enable': False}

# Configuration factory
def get_rate_limit_config(environment: str = None):
    """Get rate limiting configuration based on environment"""
    environment = environment or os.getenv('FLASK_ENV', 'development')
    
    configs = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    }
    
    return configs.get(environment, DevelopmentConfig)
