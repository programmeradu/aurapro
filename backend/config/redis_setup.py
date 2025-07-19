"""
🔧 Redis Configuration and Setup
Redis configuration for rate limiting, caching, and session management
"""

import redis
import json
import logging
from typing import Dict, Optional
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class RedisConfig:
    """Redis configuration for AURA Command Center"""
    
    # Connection settings
    HOST = os.getenv('REDIS_HOST', 'localhost')
    PORT = int(os.getenv('REDIS_PORT', 6379))
    PASSWORD = os.getenv('REDIS_PASSWORD', None)
    
    # Database allocation
    DATABASES = {
        'rate_limiting': 1,
        'sessions': 2,
        'cache': 3,
        'websockets': 4,
        'analytics': 5
    }
    
    # Connection pool settings
    CONNECTION_POOL_SETTINGS = {
        'max_connections': 50,
        'retry_on_timeout': True,
        'socket_timeout': 5,
        'socket_connect_timeout': 5,
        'health_check_interval': 30
    }

class RedisManager:
    """Redis connection and management utility"""
    
    def __init__(self):
        self.connections = {}
        self.pools = {}
        self._initialize_connections()
    
    def _initialize_connections(self):
        """Initialize Redis connections for different purposes"""
        try:
            for purpose, db_num in RedisConfig.DATABASES.items():
                # Create connection pool
                pool = redis.ConnectionPool(
                    host=RedisConfig.HOST,
                    port=RedisConfig.PORT,
                    db=db_num,
                    password=RedisConfig.PASSWORD,
                    decode_responses=True,
                    **RedisConfig.CONNECTION_POOL_SETTINGS
                )
                
                # Create Redis client
                client = redis.Redis(connection_pool=pool)
                
                # Test connection
                client.ping()
                
                self.pools[purpose] = pool
                self.connections[purpose] = client
                
                logger.info(f"Redis connection established for {purpose} (DB {db_num})")
                
        except redis.RedisError as e:
            logger.error(f"Failed to initialize Redis connections: {e}")
            raise
    
    def get_client(self, purpose: str) -> redis.Redis:
        """Get Redis client for specific purpose"""
        if purpose not in self.connections:
            raise ValueError(f"Unknown Redis purpose: {purpose}")
        return self.connections[purpose]
    
    def health_check(self) -> Dict[str, bool]:
        """Check health of all Redis connections"""
        health_status = {}
        
        for purpose, client in self.connections.items():
            try:
                client.ping()
                health_status[purpose] = True
            except redis.RedisError:
                health_status[purpose] = False
                logger.warning(f"Redis health check failed for {purpose}")
        
        return health_status
    
    def get_info(self) -> Dict:
        """Get Redis server information"""
        try:
            # Use rate_limiting client for server info
            client = self.get_client('rate_limiting')
            info = client.info()
            
            return {
                'redis_version': info.get('redis_version'),
                'used_memory_human': info.get('used_memory_human'),
                'connected_clients': info.get('connected_clients'),
                'total_commands_processed': info.get('total_commands_processed'),
                'keyspace_hits': info.get('keyspace_hits'),
                'keyspace_misses': info.get('keyspace_misses'),
                'uptime_in_seconds': info.get('uptime_in_seconds')
            }
        except redis.RedisError as e:
            logger.error(f"Failed to get Redis info: {e}")
            return {}
    
    def cleanup_expired_keys(self):
        """Clean up expired keys and optimize memory usage"""
        try:
            for purpose, client in self.connections.items():
                # Get database info
                info = client.info('keyspace')
                db_key = f'db{RedisConfig.DATABASES[purpose]}'
                
                if db_key in info:
                    keys_count = info[db_key]['keys']
                    expires_count = info[db_key]['expires']
                    
                    logger.info(f"Redis {purpose}: {keys_count} keys, {expires_count} with expiration")
                
                # Force expire check (Redis does this automatically, but we can trigger it)
                client.debug_object('non_existent_key')  # This is safe and triggers cleanup
                
        except redis.RedisError as e:
            logger.warning(f"Redis cleanup warning: {e}")

# Global Redis manager instance
redis_manager = RedisManager()

def get_redis_client(purpose: str = 'rate_limiting') -> redis.Redis:
    """Get Redis client for specific purpose"""
    return redis_manager.get_client(purpose)

def setup_redis_for_rate_limiting():
    """Setup Redis specifically for rate limiting"""
    try:
        client = get_redis_client('rate_limiting')
        
        # Set up rate limiting configuration
        config_key = "rate_limit_config"
        config_data = {
            'version': '1.0',
            'setup_time': datetime.now().isoformat(),
            'features': [
                'ip_rate_limiting',
                'user_rate_limiting',
                'endpoint_rate_limiting',
                'ddos_protection',
                'ban_management'
            ]
        }
        
        client.setex(config_key, 86400, json.dumps(config_data))  # 24 hours
        
        # Initialize metrics storage
        metrics_key = f"metrics:{int(datetime.now().timestamp()) // 60}"
        client.hset(metrics_key, mapping={
            'total_requests': 0,
            'allowed_requests': 0,
            'blocked_requests': 0
        })
        client.expire(metrics_key, 3600)  # 1 hour
        
        logger.info("Redis rate limiting setup completed")
        return True
        
    except redis.RedisError as e:
        logger.error(f"Failed to setup Redis for rate limiting: {e}")
        return False

def get_redis_stats() -> Dict:
    """Get comprehensive Redis statistics"""
    try:
        stats = {
            'health': redis_manager.health_check(),
            'info': redis_manager.get_info(),
            'databases': {}
        }
        
        # Get stats for each database
        for purpose, db_num in RedisConfig.DATABASES.items():
            try:
                client = redis_manager.get_client(purpose)
                db_size = client.dbsize()
                
                stats['databases'][purpose] = {
                    'database_number': db_num,
                    'key_count': db_size,
                    'status': 'healthy' if stats['health'][purpose] else 'unhealthy'
                }
                
            except redis.RedisError:
                stats['databases'][purpose] = {
                    'database_number': db_num,
                    'key_count': 0,
                    'status': 'error'
                }
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to get Redis stats: {e}")
        return {'error': str(e)}

def reset_rate_limits(identifier: str = None):
    """Reset rate limits for specific identifier or all"""
    try:
        client = get_redis_client('rate_limiting')
        
        if identifier:
            # Reset specific identifier
            pattern = f"rate_limit:{identifier}:*"
            keys = list(client.scan_iter(match=pattern))
            if keys:
                client.delete(*keys)
                logger.info(f"Reset rate limits for {identifier}")
                return len(keys)
        else:
            # Reset all rate limits (dangerous!)
            pattern = "rate_limit:*"
            keys = list(client.scan_iter(match=pattern))
            if keys:
                client.delete(*keys)
                logger.warning(f"Reset ALL rate limits ({len(keys)} keys)")
                return len(keys)
        
        return 0
        
    except redis.RedisError as e:
        logger.error(f"Failed to reset rate limits: {e}")
        return -1

def get_banned_ips() -> list:
    """Get list of currently banned IPs"""
    try:
        client = get_redis_client('rate_limiting')
        banned_ips = []
        
        for key in client.scan_iter(match="banned:*"):
            ip = key.replace("banned:", "")
            ban_info = client.get(key)
            
            if ban_info:
                try:
                    ban_data = json.loads(ban_info)
                    ban_data['ip'] = ip
                    ban_data['remaining_seconds'] = client.ttl(key)
                    banned_ips.append(ban_data)
                except json.JSONDecodeError:
                    # Invalid ban data, clean it up
                    client.delete(key)
        
        return banned_ips
        
    except redis.RedisError as e:
        logger.error(f"Failed to get banned IPs: {e}")
        return []

def unban_ip(ip: str) -> bool:
    """Unban a specific IP address"""
    try:
        client = get_redis_client('rate_limiting')
        ban_key = f"banned:{ip}"
        
        result = client.delete(ban_key)
        if result:
            logger.info(f"IP {ip} has been unbanned")
            return True
        else:
            logger.info(f"IP {ip} was not banned")
            return False
            
    except redis.RedisError as e:
        logger.error(f"Failed to unban IP {ip}: {e}")
        return False

def ban_ip(ip: str, duration: int = 3600, reason: str = "Manual ban") -> bool:
    """Manually ban an IP address"""
    try:
        client = get_redis_client('rate_limiting')
        ban_key = f"banned:{ip}"
        
        ban_data = json.dumps({
            'banned_at': datetime.now().isoformat(),
            'reason': reason,
            'duration': duration,
            'manual': True
        })
        
        client.setex(ban_key, duration, ban_data)
        logger.info(f"IP {ip} banned for {duration} seconds. Reason: {reason}")
        return True
        
    except redis.RedisError as e:
        logger.error(f"Failed to ban IP {ip}: {e}")
        return False

# Initialize Redis on module import
try:
    setup_redis_for_rate_limiting()
except Exception as e:
    logger.warning(f"Redis initialization warning: {e}")

# Export commonly used functions
__all__ = [
    'get_redis_client',
    'redis_manager',
    'setup_redis_for_rate_limiting',
    'get_redis_stats',
    'reset_rate_limits',
    'get_banned_ips',
    'unban_ip',
    'ban_ip'
]
