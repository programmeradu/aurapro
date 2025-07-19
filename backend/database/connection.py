"""
🗄️ AURA Database Connection & Management
PostgreSQL connection with TimescaleDB and PostGIS support
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any, List
import asyncpg
from asyncpg import Pool, Connection
from contextlib import asynccontextmanager
import json
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Centralized database connection and query management"""
    
    def __init__(self):
        self.pool: Optional[Pool] = None
        self.connection_params = self._get_connection_params()
        
    def _get_connection_params(self) -> Dict[str, Any]:
        """Get database connection parameters from environment"""
        return {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '5432')),
            'database': os.getenv('DB_NAME', 'aura_transport'),
            'user': os.getenv('DB_USER', 'aura_user'),
            'password': os.getenv('DB_PASSWORD', 'aura_password'),
            'min_size': int(os.getenv('DB_POOL_MIN_SIZE', '5')),
            'max_size': int(os.getenv('DB_POOL_MAX_SIZE', '20')),
            'command_timeout': int(os.getenv('DB_COMMAND_TIMEOUT', '60')),
        }
    
    async def initialize(self) -> bool:
        """Initialize database connection pool"""
        try:
            logger.info("🗄️ Initializing database connection pool...")
            
            self.pool = await asyncpg.create_pool(
                host=self.connection_params['host'],
                port=self.connection_params['port'],
                database=self.connection_params['database'],
                user=self.connection_params['user'],
                password=self.connection_params['password'],
                min_size=self.connection_params['min_size'],
                max_size=self.connection_params['max_size'],
                command_timeout=self.connection_params['command_timeout'],
            )
            
            # Test connection
            async with self.pool.acquire() as conn:
                await conn.execute('SELECT 1')
                
            logger.info("✅ Database connection pool initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize database: {e}")
            return False
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("🔌 Database connection pool closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection from pool"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        
        async with self.pool.acquire() as connection:
            yield connection
    
    async def execute_query(self, query: str, *args) -> List[Dict]:
        """Execute a SELECT query and return results as list of dicts"""
        async with self.get_connection() as conn:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]
    
    async def execute_command(self, command: str, *args) -> str:
        """Execute INSERT/UPDATE/DELETE command and return status"""
        async with self.get_connection() as conn:
            return await conn.execute(command, *args)
    
    async def execute_transaction(self, commands: List[tuple]) -> bool:
        """Execute multiple commands in a transaction"""
        async with self.get_connection() as conn:
            async with conn.transaction():
                try:
                    for command, args in commands:
                        await conn.execute(command, *args)
                    return True
                except Exception as e:
                    logger.error(f"Transaction failed: {e}")
                    raise

# Global database manager instance
db_manager = DatabaseManager()

class GTFSRepository:
    """Repository for GTFS data operations"""
    
    @staticmethod
    async def insert_agencies(agencies: List[Dict]) -> int:
        """Insert agencies data"""
        if not agencies:
            return 0
            
        commands = []
        for agency in agencies:
            commands.append((
                """INSERT INTO agencies (agency_id, agency_name, agency_url, agency_timezone, agency_lang, agency_phone)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT (agency_id) DO UPDATE SET
                   agency_name = EXCLUDED.agency_name,
                   agency_url = EXCLUDED.agency_url,
                   updated_at = NOW()""",
                (
                    agency.get('agency_id'),
                    agency.get('agency_name'),
                    agency.get('agency_url'),
                    agency.get('agency_timezone', 'Africa/Accra'),
                    agency.get('agency_lang', 'en'),
                    agency.get('agency_phone')
                )
            ))
        
        await db_manager.execute_transaction(commands)
        return len(commands)
    
    @staticmethod
    async def insert_routes(routes: List[Dict]) -> int:
        """Insert routes data"""
        if not routes:
            return 0
            
        commands = []
        for route in routes:
            commands.append((
                """INSERT INTO routes (route_id, agency_id, route_short_name, route_long_name, 
                                    route_desc, route_type, route_url, route_color, route_text_color)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                   ON CONFLICT (route_id) DO UPDATE SET
                   route_short_name = EXCLUDED.route_short_name,
                   route_long_name = EXCLUDED.route_long_name,
                   route_desc = EXCLUDED.route_desc,
                   updated_at = NOW()""",
                (
                    route.get('route_id'),
                    route.get('agency_id'),
                    route.get('route_short_name'),
                    route.get('route_long_name'),
                    route.get('route_desc'),
                    int(route.get('route_type', 3)),  # Default to bus
                    route.get('route_url'),
                    route.get('route_color', 'FFFFFF'),
                    route.get('route_text_color', '000000')
                )
            ))
        
        await db_manager.execute_transaction(commands)
        return len(commands)
    
    @staticmethod
    async def insert_stops(stops: List[Dict]) -> int:
        """Insert stops data"""
        if not stops:
            return 0
            
        commands = []
        for stop in stops:
            commands.append((
                """INSERT INTO stops (stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon,
                                   zone_id, stop_url, location_type, parent_station, wheelchair_boarding)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                   ON CONFLICT (stop_id) DO UPDATE SET
                   stop_name = EXCLUDED.stop_name,
                   stop_desc = EXCLUDED.stop_desc,
                   stop_lat = EXCLUDED.stop_lat,
                   stop_lon = EXCLUDED.stop_lon,
                   updated_at = NOW()""",
                (
                    stop.get('stop_id'),
                    stop.get('stop_code'),
                    stop.get('stop_name'),
                    stop.get('stop_desc'),
                    float(stop.get('stop_lat', 0)),
                    float(stop.get('stop_lon', 0)),
                    stop.get('zone_id'),
                    stop.get('stop_url'),
                    int(stop.get('location_type', 0)),
                    stop.get('parent_station'),
                    int(stop.get('wheelchair_boarding', 0))
                )
            ))
        
        await db_manager.execute_transaction(commands)
        return len(commands)
    
    @staticmethod
    async def get_routes() -> List[Dict]:
        """Get all routes"""
        return await db_manager.execute_query(
            "SELECT * FROM routes ORDER BY route_short_name"
        )
    
    @staticmethod
    async def get_stops() -> List[Dict]:
        """Get all stops"""
        return await db_manager.execute_query(
            "SELECT * FROM stops ORDER BY stop_name"
        )
    
    @staticmethod
    async def get_stops_near_location(lat: float, lon: float, radius_km: float = 1.0) -> List[Dict]:
        """Get stops within radius of location"""
        return await db_manager.execute_query(
            """SELECT *, ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)) as distance_m
               FROM stops 
               WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326), $3)
               ORDER BY distance_m""",
            lat, lon, radius_km * 1000  # Convert km to meters
        )

class VehicleRepository:
    """Repository for vehicle operations"""
    
    @staticmethod
    async def insert_vehicle_position(vehicle_id: str, lat: float, lon: float, 
                                    speed: float = 0, passengers: int = 0, 
                                    status: str = 'in_transit') -> bool:
        """Insert vehicle position update"""
        try:
            await db_manager.execute_command(
                """INSERT INTO vehicle_positions (vehicle_id, latitude, longitude, speed, passengers, status)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                vehicle_id, lat, lon, speed, passengers, status
            )
            return True
        except Exception as e:
            logger.error(f"Failed to insert vehicle position: {e}")
            return False
    
    @staticmethod
    async def get_latest_vehicle_positions() -> List[Dict]:
        """Get latest position for all vehicles"""
        return await db_manager.execute_query(
            """SELECT DISTINCT ON (vehicle_id) 
                   vehicle_id, latitude, longitude, speed, passengers, status, timestamp
               FROM vehicle_positions 
               ORDER BY vehicle_id, timestamp DESC"""
        )
    
    @staticmethod
    async def get_vehicle_history(vehicle_id: str, hours: int = 24) -> List[Dict]:
        """Get vehicle position history"""
        return await db_manager.execute_query(
            """SELECT * FROM vehicle_positions 
               WHERE vehicle_id = $1 AND timestamp > NOW() - INTERVAL '%s hours'
               ORDER BY timestamp DESC""",
            vehicle_id, hours
        )

class KPIRepository:
    """Repository for KPI operations"""
    
    @staticmethod
    async def insert_kpi(kpi_id: str, name: str, value: float, unit: str, category: str, metadata: Dict = None) -> bool:
        """Insert KPI value"""
        try:
            await db_manager.execute_command(
                """INSERT INTO kpis (kpi_id, name, value, unit, category, metadata)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                kpi_id, name, value, unit, category, json.dumps(metadata) if metadata else None
            )
            return True
        except Exception as e:
            logger.error(f"Failed to insert KPI: {e}")
            return False
    
    @staticmethod
    async def get_latest_kpis() -> List[Dict]:
        """Get latest KPI values"""
        return await db_manager.execute_query(
            """SELECT DISTINCT ON (kpi_id) 
                   kpi_id, name, value, unit, category, timestamp, metadata
               FROM kpis 
               ORDER BY kpi_id, timestamp DESC"""
        )
    
    @staticmethod
    async def get_kpi_history(kpi_id: str, hours: int = 24) -> List[Dict]:
        """Get KPI history"""
        return await db_manager.execute_query(
            """SELECT * FROM kpis 
               WHERE kpi_id = $1 AND timestamp > NOW() - INTERVAL '%s hours'
               ORDER BY timestamp DESC""",
            kpi_id, hours
        )

# Initialize database on module import
async def init_database():
    """Initialize database connection"""
    return await db_manager.initialize()

async def close_database():
    """Close database connection"""
    await db_manager.close()

# Export repositories
__all__ = [
    'db_manager',
    'GTFSRepository', 
    'VehicleRepository',
    'KPIRepository',
    'init_database',
    'close_database'
]
