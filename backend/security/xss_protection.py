"""
🛡️ XSS Protection and Content Security Policy
Advanced XSS prevention and content security implementation
"""

import re
import html
import json
import logging
from typing import Dict, List, Optional, Any, Union
from urllib.parse import quote, unquote
import bleach
from markupsafe import Markup
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class XSSProtector:
    """Advanced XSS protection and content sanitization"""
    
    def __init__(self):
        # XSS attack patterns
        self.xss_patterns = [
            # Script tags
            r'<script[^>]*>.*?</script>',
            r'<script[^>]*>',
            r'</script>',
            
            # Event handlers
            r'on\w+\s*=\s*["\'][^"\']*["\']',
            r'on\w+\s*=\s*[^"\'\s>]+',
            
            # JavaScript URLs
            r'javascript\s*:',
            r'vbscript\s*:',
            r'data\s*:.*base64',
            
            # HTML tags that can execute JavaScript
            r'<iframe[^>]*>',
            r'<object[^>]*>',
            r'<embed[^>]*>',
            r'<applet[^>]*>',
            r'<meta[^>]*>',
            r'<link[^>]*>',
            r'<style[^>]*>.*?</style>',
            r'<form[^>]*>',
            
            # Expression and eval
            r'expression\s*\(',
            r'eval\s*\(',
            r'setTimeout\s*\(',
            r'setInterval\s*\(',
            
            # HTML entities that could be dangerous
            r'&#x[0-9a-f]+;',
            r'&#[0-9]+;',
            
            # CSS injection
            r'@import',
            r'url\s*\(',
            r'expression\s*\(',
            
            # SVG XSS
            r'<svg[^>]*>',
            r'<foreignObject[^>]*>',
            
            # Data URIs
            r'data:text/html',
            r'data:image/svg\+xml',
        ]
        
        # Compile patterns for better performance
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE | re.DOTALL) for pattern in self.xss_patterns]
        
        # Safe HTML tags and attributes (very restrictive)
        self.allowed_tags = [
            'p', 'br', 'strong', 'em', 'u', 'i', 'b',
            'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'code', 'pre'
        ]
        
        self.allowed_attributes = {
            '*': ['class', 'id'],
            'a': ['href', 'title'],
            'img': ['src', 'alt', 'title', 'width', 'height'],
        }
        
        # Dangerous protocols
        self.dangerous_protocols = [
            'javascript:', 'vbscript:', 'data:', 'file:', 'ftp:'
        ]
    
    def detect_xss(self, content: str) -> Dict[str, Any]:
        """Detect XSS attempts in content"""
        if not isinstance(content, str):
            return {'is_malicious': False, 'confidence': 0, 'patterns': []}
        
        detected_patterns = []
        confidence_score = 0
        
        # Check against known XSS patterns
        for i, pattern in enumerate(self.compiled_patterns):
            matches = pattern.findall(content)
            if matches:
                detected_patterns.append({
                    'pattern_index': i,
                    'pattern': self.xss_patterns[i],
                    'matches': matches,
                    'severity': self._get_xss_severity(i)
                })
                confidence_score += self._get_xss_severity(i)
        
        # Additional heuristic checks
        confidence_score += self._xss_heuristic_analysis(content)
        
        # Normalize confidence score
        confidence_score = min(confidence_score, 100)
        
        is_malicious = confidence_score > 25  # Lower threshold for XSS
        
        if is_malicious:
            logger.warning(f"XSS attempt detected: {content[:100]}... (confidence: {confidence_score})")
        
        return {
            'is_malicious': is_malicious,
            'confidence': confidence_score,
            'patterns': detected_patterns,
            'content_length': len(content)
        }
    
    def _get_xss_severity(self, pattern_index: int) -> int:
        """Get severity score for XSS pattern"""
        # Critical severity (50 points)
        critical = [0, 1, 2, 3, 4, 5, 6, 13, 14, 15, 16]  # script tags, eval, etc.
        
        # High severity (35 points)
        high = [7, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21, 22]  # iframe, object, etc.
        
        # Medium severity (20 points)
        medium = [23, 24, 25, 26, 27, 28]  # CSS injection, SVG
        
        if pattern_index in critical:
            return 50
        elif pattern_index in high:
            return 35
        elif pattern_index in medium:
            return 20
        else:
            return 10
    
    def _xss_heuristic_analysis(self, content: str) -> int:
        """Additional heuristic analysis for XSS detection"""
        score = 0
        content_lower = content.lower()
        
        # Check for suspicious JavaScript keywords
        js_keywords = ['alert', 'confirm', 'prompt', 'document', 'window', 'location', 'cookie']
        keyword_count = sum(1 for keyword in js_keywords if keyword in content_lower)
        if keyword_count > 1:
            score += 20
        
        # Check for HTML tag density
        tag_count = len(re.findall(r'<[^>]+>', content))
        if tag_count > 5 and len(content) < 500:  # High tag density in short content
            score += 15
        
        # Check for encoded characters
        if '&' in content and any(entity in content for entity in ['&lt;', '&gt;', '&quot;', '&amp;']):
            score += 10
        
        # Check for suspicious attribute patterns
        if re.search(r'\w+\s*=\s*["\'][^"\']*["\']', content):
            score += 15
        
        return score
    
    def sanitize_html(self, content: str, allow_tags: bool = False) -> str:
        """Sanitize HTML content to prevent XSS"""
        if not isinstance(content, str):
            return str(content)
        
        if not allow_tags:
            # Strip all HTML tags
            content = bleach.clean(content, tags=[], attributes={}, strip=True)
        else:
            # Allow only safe tags and attributes
            content = bleach.clean(
                content,
                tags=self.allowed_tags,
                attributes=self.allowed_attributes,
                strip=True
            )
        
        # HTML escape any remaining special characters
        content = html.escape(content)
        
        return content
    
    def sanitize_url(self, url: str) -> str:
        """Sanitize URL to prevent XSS through href attributes"""
        if not isinstance(url, str):
            return ''
        
        url = url.strip()
        
        # Check for dangerous protocols
        for protocol in self.dangerous_protocols:
            if url.lower().startswith(protocol):
                logger.warning(f"Dangerous protocol in URL: {url}")
                return ''
        
        # URL encode special characters
        url = quote(url, safe=':/?#[]@!$&\'()*+,;=')
        
        return url
    
    def sanitize_json_output(self, data: Any) -> Any:
        """Sanitize JSON output to prevent XSS in API responses"""
        if isinstance(data, str):
            return self.sanitize_html(data, allow_tags=False)
        elif isinstance(data, dict):
            return {key: self.sanitize_json_output(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self.sanitize_json_output(item) for item in data]
        else:
            return data
    
    def create_safe_html_response(self, content: str, content_type: str = "text/html") -> str:
        """Create safe HTML response with XSS protection"""
        # Sanitize content
        safe_content = self.sanitize_html(content, allow_tags=True)
        
        # Add XSS protection meta tag
        if content_type == "text/html" and '<head>' in safe_content:
            xss_protection = '<meta http-equiv="X-XSS-Protection" content="1; mode=block">'
            safe_content = safe_content.replace('<head>', f'<head>\n{xss_protection}')
        
        return safe_content

class ContentSecurityPolicy:
    """Content Security Policy implementation"""
    
    def __init__(self):
        # Default CSP policy for AURA Command Center (relaxed for FastAPI docs)
        self.default_policy = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "localhost:*", "127.0.0.1:*"],
            'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
            'img-src': ["'self'", "data:", "https:", "https://fastapi.tiangolo.com"],
            'connect-src': ["'self'", "https://api.mapbox.com", "wss:", "localhost:*", "127.0.0.1:*"],
            'frame-src': ["'none'"],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
            'upgrade-insecure-requests': []
        }
    
    def generate_csp_header(self, custom_policy: Dict[str, List[str]] = None) -> str:
        """Generate CSP header string"""
        policy = self.default_policy.copy()
        
        if custom_policy:
            policy.update(custom_policy)
        
        csp_parts = []
        for directive, sources in policy.items():
            if sources:
                sources_str = ' '.join(sources)
                csp_parts.append(f"{directive} {sources_str}")
            else:
                csp_parts.append(directive)
        
        return '; '.join(csp_parts)
    
    def get_development_policy(self) -> Dict[str, List[str]]:
        """Get relaxed CSP policy for development"""
        return {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "localhost:*", "127.0.0.1:*"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'font-src': ["'self'", "data:"],
            'img-src': ["'self'", "data:", "blob:", "*"],
            'connect-src': ["'self'", "localhost:*", "127.0.0.1:*", "ws:", "wss:"],
            'frame-src': ["'self'"],
            'object-src': ["'none'"],
        }
    
    def get_production_policy(self) -> Dict[str, List[str]]:
        """Get strict CSP policy for production"""
        return {
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

class XSSProtectionMiddleware(BaseHTTPMiddleware):
    """Middleware for XSS protection and CSP headers"""
    
    def __init__(self, app: ASGIApp, environment: str = "development"):
        super().__init__(app)
        self.xss_protector = XSSProtector()
        self.csp = ContentSecurityPolicy()
        self.environment = environment
    
    async def dispatch(self, request: Request, call_next):
        """Add XSS protection headers and validate content"""
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        self._add_security_headers(response)
        
        return response
    
    def _add_security_headers(self, response: Response):
        """Add XSS protection and CSP headers"""
        
        # X-XSS-Protection header
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # X-Content-Type-Options header
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options header
        response.headers["X-Frame-Options"] = "DENY"
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy
        if self.environment == "production":
            csp_policy = self.csp.get_production_policy()
        else:
            csp_policy = self.csp.get_development_policy()
        
        csp_header = self.csp.generate_csp_header(csp_policy)
        response.headers["Content-Security-Policy"] = csp_header
        
        # Additional security headers (relaxed for development)
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # Disabled for FastAPI docs compatibility
        # response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        # response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        # response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

# Utility functions
def sanitize_user_input(content: str, allow_html: bool = False) -> str:
    """Sanitize user input to prevent XSS"""
    protector = XSSProtector()
    return protector.sanitize_html(content, allow_tags=allow_html)

def is_safe_content(content: str) -> bool:
    """Check if content is safe from XSS"""
    protector = XSSProtector()
    result = protector.detect_xss(content)
    return not result['is_malicious']

def create_safe_json_response(data: Any) -> Any:
    """Create safe JSON response with XSS protection"""
    protector = XSSProtector()
    return protector.sanitize_json_output(data)

def validate_url_safety(url: str) -> bool:
    """Validate URL for safety"""
    protector = XSSProtector()
    sanitized_url = protector.sanitize_url(url)
    return sanitized_url == url and len(sanitized_url) > 0

# Template filters for safe rendering
def safe_html_filter(content: str) -> Markup:
    """Template filter for safe HTML rendering"""
    protector = XSSProtector()
    safe_content = protector.sanitize_html(content, allow_tags=True)
    return Markup(safe_content)

def safe_url_filter(url: str) -> str:
    """Template filter for safe URL rendering"""
    protector = XSSProtector()
    return protector.sanitize_url(url)

# Export main components
__all__ = [
    'XSSProtector',
    'ContentSecurityPolicy',
    'XSSProtectionMiddleware',
    'sanitize_user_input',
    'is_safe_content',
    'create_safe_json_response',
    'validate_url_safety',
    'safe_html_filter',
    'safe_url_filter'
]
