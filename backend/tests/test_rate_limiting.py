"""
🧪 Rate Limiting & DDoS Protection Tests
Comprehensive test suite for rate limiting functionality
"""

import pytest
import asyncio
import time
import json
import redis
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from middleware.fastapi_rate_limiter import FastAPIRateLimiter, RateLimitMiddleware

class TestRateLimiting:
    """Test suite for rate limiting functionality"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def redis_client(self):
        """Create Redis test client"""
        try:
            client = redis.Redis(host='localhost', port=6379, db=15, decode_responses=True)  # Use test DB
            client.flushdb()  # Clear test database
            yield client
            client.flushdb()  # Clean up after test
        except redis.ConnectionError:
            pytest.skip("Redis not available for testing")
    
    @pytest.fixture
    def rate_limiter(self, redis_client):
        """Create rate limiter instance"""
        return FastAPIRateLimiter(redis_url="redis://localhost:6379/15")
    
    def test_redis_connection(self, redis_client):
        """Test Redis connection"""
        assert redis_client.ping() == True
        
        # Test basic operations
        redis_client.set("test_key", "test_value")
        assert redis_client.get("test_key") == "test_value"
        
        redis_client.delete("test_key")
        assert redis_client.get("test_key") is None
    
    def test_rate_limit_headers(self, client):
        """Test that rate limit headers are included in responses"""
        response = client.get("/health")
        
        # Check for rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        
        # Verify header values are numeric
        limit = int(response.headers["X-RateLimit-Limit"])
        remaining = int(response.headers["X-RateLimit-Remaining"])
        
        assert limit > 0
        assert remaining >= 0
        assert remaining <= limit
    
    def test_basic_rate_limiting(self, client):
        """Test basic rate limiting functionality"""
        # Make multiple requests quickly
        responses = []
        for i in range(10):
            response = client.get("/health")
            responses.append(response)
            
            # Check that remaining count decreases
            if i > 0:
                prev_remaining = int(responses[i-1].headers["X-RateLimit-Remaining"])
                curr_remaining = int(responses[i].headers["X-RateLimit-Remaining"])
                assert curr_remaining <= prev_remaining
    
    def test_endpoint_specific_limits(self, client):
        """Test endpoint-specific rate limits"""
        # Test login endpoint (should have stricter limits)
        login_data = {"username": "test", "password": "test"}
        
        # Make multiple login attempts
        for i in range(6):  # Login limit is 5 per 15 minutes
            response = client.post("/api/v1/auth/login", json=login_data)
            
            if i < 5:
                # First 5 should be allowed (even if they fail authentication)
                assert response.status_code in [200, 401, 422]  # Not rate limited
            else:
                # 6th should be rate limited
                assert response.status_code == 429
                assert "Rate limit exceeded" in response.json()["error"]
    
    def test_ip_based_rate_limiting(self, client):
        """Test IP-based rate limiting"""
        # Simulate requests from different IPs
        headers_ip1 = {"X-Forwarded-For": "192.168.1.100"}
        headers_ip2 = {"X-Forwarded-For": "192.168.1.101"}
        
        # Make requests from IP1
        response1 = client.get("/health", headers=headers_ip1)
        remaining1 = int(response1.headers["X-RateLimit-Remaining"])
        
        # Make requests from IP2
        response2 = client.get("/health", headers=headers_ip2)
        remaining2 = int(response2.headers["X-RateLimit-Remaining"])
        
        # Both IPs should have independent rate limits
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Remaining counts should be similar (both are new IPs)
        assert abs(remaining1 - remaining2) <= 1
    
    @pytest.mark.asyncio
    async def test_ddos_detection(self, rate_limiter):
        """Test DDoS detection functionality"""
        from fastapi import Request
        from unittest.mock import MagicMock
        
        # Mock request object
        request = MagicMock(spec=Request)
        request.client.host = "192.168.1.100"
        request.headers = {"user-agent": "test-agent"}
        request.query_params = {}
        
        # Simulate rapid requests (should trigger DDoS detection)
        for i in range(60):  # 60 requests in quick succession
            detected = await rate_limiter.detect_ddos_patterns(request)
            if detected:
                break
        
        # Should detect DDoS after enough rapid requests
        assert detected == True
    
    def test_suspicious_request_detection(self, rate_limiter):
        """Test suspicious request pattern detection"""
        from fastapi import Request
        from unittest.mock import MagicMock
        
        # Test suspicious user agent
        request = MagicMock(spec=Request)
        request.headers = {"user-agent": "bot-crawler-spider"}
        request.query_params = {}
        
        assert rate_limiter.is_suspicious_request(request) == True
        
        # Test normal user agent
        request.headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        assert rate_limiter.is_suspicious_request(request) == False
        
        # Test suspicious query parameters
        request.headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        request.query_params = {"script": "alert('xss')"}
        assert rate_limiter.is_suspicious_request(request) == True
    
    @pytest.mark.asyncio
    async def test_ip_banning(self, rate_limiter, redis_client):
        """Test IP banning functionality"""
        test_ip = "192.168.1.100"
        
        # Initially IP should not be banned
        is_banned, ban_info = await rate_limiter.is_ip_banned(test_ip)
        assert is_banned == False
        
        # Ban the IP
        await rate_limiter.ban_ip(test_ip, duration=60)
        
        # Now IP should be banned
        is_banned, ban_info = await rate_limiter.is_ip_banned(test_ip)
        assert is_banned == True
        assert ban_info is not None
        assert ban_info["reason"] == "DDoS protection"
        assert ban_info["remaining_seconds"] <= 60
    
    def test_rate_limit_metrics_endpoint(self, client):
        """Test rate limiting metrics endpoint"""
        # Make some requests to generate metrics
        for i in range(5):
            client.get("/health")
        
        # Get metrics
        response = client.get("/api/v1/admin/rate-limit-metrics?time_range=5")
        
        assert response.status_code == 200
        data = response.json()["data"]
        
        # Check metrics structure
        assert "total_requests" in data
        assert "allowed_requests" in data
        assert "blocked_requests" in data
        assert "block_rate" in data
        assert "banned_ips_count" in data
        assert "endpoints" in data
        assert "ddos_metrics" in data
        
        # Verify metrics values
        assert data["total_requests"] >= 5
        assert data["allowed_requests"] >= 5
        assert data["block_rate"] >= 0
    
    def test_security_status_endpoint(self, client):
        """Test security status endpoint"""
        response = client.get("/api/v1/admin/security-status")
        
        assert response.status_code == 200
        data = response.json()["data"]
        
        # Check status structure
        assert "overall_status" in data
        assert "alerts" in data
        assert "metrics" in data
        assert "timestamp" in data
        
        # Verify status values
        assert data["overall_status"] in ["healthy", "warning", "critical"]
        assert isinstance(data["alerts"], list)
    
    def test_unban_ip_endpoint(self, client, redis_client):
        """Test IP unbanning endpoint"""
        test_ip = "192.168.1.100"
        
        # Manually ban IP in Redis
        ban_data = json.dumps({
            "banned_at": "2023-01-01T00:00:00",
            "reason": "Test ban",
            "duration": 3600
        })
        redis_client.setex(f"banned:{test_ip}", 3600, ban_data)
        
        # Unban via API
        response = client.post("/api/v1/admin/unban-ip", json={
            "ip_address": test_ip,
            "reason": "Test unban"
        })
        
        assert response.status_code == 200
        data = response.json()["data"]
        
        assert data["ip_address"] == test_ip
        assert data["status"] == "unbanned"
        
        # Verify IP is no longer banned in Redis
        assert redis_client.get(f"banned:{test_ip}") is None
    
    def test_rate_limit_bypass_for_health_check(self, client):
        """Test that health checks bypass rate limiting"""
        # Make many health check requests
        for i in range(200):  # Well above normal rate limits
            response = client.get("/health")
            assert response.status_code == 200
        
        # Health endpoint should never be rate limited
        assert response.status_code == 200
    
    def test_rate_limit_configuration_loading(self):
        """Test rate limiting configuration loading"""
        from config.rateLimits import get_rate_limit_config
        
        # Test different environments
        dev_config = get_rate_limit_config('development')
        prod_config = get_rate_limit_config('production')
        test_config = get_rate_limit_config('testing')
        
        # Development should have higher limits
        assert dev_config.GLOBAL_LIMITS['default']['requests'] > prod_config.GLOBAL_LIMITS['default']['requests']
        
        # Testing should have very high limits
        assert test_config.GLOBAL_LIMITS['default']['requests'] > dev_config.GLOBAL_LIMITS['default']['requests']
    
    def test_redis_connection_failure_handling(self, client):
        """Test graceful handling of Redis connection failures"""
        with patch('redis.Redis') as mock_redis:
            # Simulate Redis connection failure
            mock_redis.side_effect = redis.ConnectionError("Connection failed")
            
            # Requests should still work (fail open)
            response = client.get("/health")
            assert response.status_code == 200
    
    def test_concurrent_requests(self, client):
        """Test rate limiting under concurrent load"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request():
            try:
                response = client.get("/health")
                results.put(response.status_code)
            except Exception as e:
                results.put(str(e))
        
        # Create multiple threads making concurrent requests
        threads = []
        for i in range(20):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Collect results
        status_codes = []
        while not results.empty():
            status_codes.append(results.get())
        
        # Most requests should succeed
        success_count = sum(1 for code in status_codes if code == 200)
        assert success_count >= 15  # At least 75% should succeed

# Performance tests
class TestRateLimitingPerformance:
    """Performance tests for rate limiting"""
    
    def test_rate_limiting_overhead(self, client):
        """Test performance overhead of rate limiting"""
        import time
        
        # Measure time for requests with rate limiting
        start_time = time.time()
        for i in range(100):
            response = client.get("/health")
            assert response.status_code == 200
        end_time = time.time()
        
        total_time = end_time - start_time
        avg_time_per_request = total_time / 100
        
        # Rate limiting should add minimal overhead (< 10ms per request)
        assert avg_time_per_request < 0.01  # 10ms
        
        print(f"Average time per request with rate limiting: {avg_time_per_request:.4f}s")

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
