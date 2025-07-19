"""
🔄 AURA Database Migration System
Handles database schema creation, updates, and GTFS data migration
"""

import os
import asyncio
import logging
from typing import List, Dict, Any
from pathlib import Path
import pandas as pd
from .connection import db_manager, GTFSRepository

logger = logging.getLogger(__name__)

class MigrationManager:
    """Manages database migrations and schema updates"""
    
    def __init__(self):
        self.migrations_dir = Path(__file__).parent / "migrations"
        self.schema_file = Path(__file__).parent / "schema.sql"
        
    async def run_schema_migration(self) -> bool:
        """Run the main schema migration"""
        try:
            logger.info("🔄 Running database schema migration...")
            
            # Read schema file
            if not self.schema_file.exists():
                logger.error(f"Schema file not found: {self.schema_file}")
                return False
                
            with open(self.schema_file, 'r') as f:
                schema_sql = f.read()
            
            # Execute schema
            async with db_manager.get_connection() as conn:
                await conn.execute(schema_sql)
                
            logger.info("✅ Schema migration completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Schema migration failed: {e}")
            return False
    
    async def check_database_exists(self) -> bool:
        """Check if database exists and is accessible"""
        try:
            async with db_manager.get_connection() as conn:
                result = await conn.fetchval("SELECT 1")
                return result == 1
        except Exception as e:
            logger.error(f"Database check failed: {e}")
            return False
    
    async def get_table_count(self) -> int:
        """Get number of tables in database"""
        try:
            async with db_manager.get_connection() as conn:
                result = await conn.fetchval(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
                )
                return result or 0
        except Exception:
            return 0

class GTFSMigrator:
    """Handles GTFS data migration to database"""
    
    def __init__(self, gtfs_dir: str):
        self.gtfs_dir = Path(gtfs_dir)
        
    async def migrate_gtfs_data(self) -> Dict[str, int]:
        """Migrate all GTFS data to database"""
        results = {}
        
        try:
            logger.info("📊 Starting GTFS data migration...")
            
            # Migrate agencies
            agencies_count = await self._migrate_agencies()
            results['agencies'] = agencies_count
            
            # Migrate routes
            routes_count = await self._migrate_routes()
            results['routes'] = routes_count
            
            # Migrate stops
            stops_count = await self._migrate_stops()
            results['stops'] = stops_count
            
            # Migrate shapes
            shapes_count = await self._migrate_shapes()
            results['shapes'] = shapes_count
            
            # Migrate trips
            trips_count = await self._migrate_trips()
            results['trips'] = trips_count
            
            # Migrate stop times
            stop_times_count = await self._migrate_stop_times()
            results['stop_times'] = stop_times_count
            
            logger.info(f"✅ GTFS migration completed: {results}")
            return results
            
        except Exception as e:
            logger.error(f"❌ GTFS migration failed: {e}")
            raise
    
    async def _migrate_agencies(self) -> int:
        """Migrate agency.txt"""
        file_path = self.gtfs_dir / "agency.txt"
        if not file_path.exists():
            logger.warning(f"Agency file not found: {file_path}")
            return 0
            
        try:
            df = pd.read_csv(file_path)
            agencies = df.to_dict('records')
            count = await GTFSRepository.insert_agencies(agencies)
            logger.info(f"✅ Migrated {count} agencies")
            return count
        except Exception as e:
            logger.error(f"Failed to migrate agencies: {e}")
            return 0
    
    async def _migrate_routes(self) -> int:
        """Migrate routes.txt"""
        file_path = self.gtfs_dir / "routes.txt"
        if not file_path.exists():
            logger.warning(f"Routes file not found: {file_path}")
            return 0
            
        try:
            df = pd.read_csv(file_path)
            routes = df.to_dict('records')
            count = await GTFSRepository.insert_routes(routes)
            logger.info(f"✅ Migrated {count} routes")
            return count
        except Exception as e:
            logger.error(f"Failed to migrate routes: {e}")
            return 0
    
    async def _migrate_stops(self) -> int:
        """Migrate stops.txt"""
        file_path = self.gtfs_dir / "stops.txt"
        if not file_path.exists():
            logger.warning(f"Stops file not found: {file_path}")
            return 0
            
        try:
            df = pd.read_csv(file_path)
            stops = df.to_dict('records')
            count = await GTFSRepository.insert_stops(stops)
            logger.info(f"✅ Migrated {count} stops")
            return count
        except Exception as e:
            logger.error(f"Failed to migrate stops: {e}")
            return 0
    
    async def _migrate_shapes(self) -> int:
        """Migrate shapes.txt"""
        file_path = self.gtfs_dir / "shapes.txt"
        if not file_path.exists():
            logger.warning(f"Shapes file not found: {file_path}")
            return 0
            
        try:
            df = pd.read_csv(file_path)
            
            # Batch insert shapes for better performance
            commands = []
            for _, shape in df.iterrows():
                commands.append((
                    """INSERT INTO shapes (shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled)
                       VALUES ($1, $2, $3, $4, $5)
                       ON CONFLICT (shape_id, shape_pt_sequence) DO NOTHING""",
                    (
                        shape.get('shape_id'),
                        float(shape.get('shape_pt_lat', 0)),
                        float(shape.get('shape_pt_lon', 0)),
                        int(shape.get('shape_pt_sequence', 0)),
                        float(shape.get('shape_dist_traveled', 0)) if pd.notna(shape.get('shape_dist_traveled')) else None
                    )
                ))
            
            await db_manager.execute_transaction(commands)
            logger.info(f"✅ Migrated {len(commands)} shape points")
            return len(commands)
            
        except Exception as e:
            logger.error(f"Failed to migrate shapes: {e}")
            return 0
    
    async def _migrate_trips(self) -> int:
        """Migrate trips.txt"""
        file_path = self.gtfs_dir / "trips.txt"
        if not file_path.exists():
            logger.warning(f"Trips file not found: {file_path}")
            return 0
            
        try:
            df = pd.read_csv(file_path)
            
            commands = []
            for _, trip in df.iterrows():
                commands.append((
                    """INSERT INTO trips (route_id, service_id, trip_id, trip_headsign, trip_short_name, 
                                       direction_id, block_id, shape_id, wheelchair_accessible, bikes_allowed)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                       ON CONFLICT (trip_id) DO UPDATE SET
                       trip_headsign = EXCLUDED.trip_headsign,
                       updated_at = NOW()""",
                    (
                        trip.get('route_id'),
                        trip.get('service_id'),
                        trip.get('trip_id'),
                        trip.get('trip_headsign'),
                        trip.get('trip_short_name'),
                        int(trip.get('direction_id', 0)) if pd.notna(trip.get('direction_id')) else None,
                        trip.get('block_id'),
                        trip.get('shape_id'),
                        int(trip.get('wheelchair_accessible', 0)),
                        int(trip.get('bikes_allowed', 0))
                    )
                ))
            
            await db_manager.execute_transaction(commands)
            logger.info(f"✅ Migrated {len(commands)} trips")
            return len(commands)
            
        except Exception as e:
            logger.error(f"Failed to migrate trips: {e}")
            return 0
    
    async def _migrate_stop_times(self) -> int:
        """Migrate stop_times.txt"""
        file_path = self.gtfs_dir / "stop_times.txt"
        if not file_path.exists():
            logger.warning(f"Stop times file not found: {file_path}")
            return 0
            
        try:
            # Read in chunks for large files
            chunk_size = 10000
            total_count = 0
            
            for chunk in pd.read_csv(file_path, chunksize=chunk_size):
                commands = []
                for _, stop_time in chunk.iterrows():
                    commands.append((
                        """INSERT INTO stop_times (trip_id, arrival_time, departure_time, stop_id, stop_sequence,
                                                 stop_headsign, pickup_type, drop_off_type, shape_dist_traveled, timepoint)
                           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                           ON CONFLICT (trip_id, stop_sequence) DO NOTHING""",
                        (
                            stop_time.get('trip_id'),
                            stop_time.get('arrival_time'),
                            stop_time.get('departure_time'),
                            stop_time.get('stop_id'),
                            int(stop_time.get('stop_sequence', 0)),
                            stop_time.get('stop_headsign'),
                            int(stop_time.get('pickup_type', 0)),
                            int(stop_time.get('drop_off_type', 0)),
                            float(stop_time.get('shape_dist_traveled', 0)) if pd.notna(stop_time.get('shape_dist_traveled')) else None,
                            int(stop_time.get('timepoint', 1))
                        )
                    ))
                
                await db_manager.execute_transaction(commands)
                total_count += len(commands)
                logger.info(f"✅ Migrated {total_count} stop times so far...")
            
            logger.info(f"✅ Completed migration of {total_count} stop times")
            return total_count
            
        except Exception as e:
            logger.error(f"Failed to migrate stop times: {e}")
            return 0

async def run_full_migration(gtfs_dir: str = None) -> Dict[str, Any]:
    """Run complete database migration"""
    results = {
        'schema_created': False,
        'gtfs_migrated': False,
        'gtfs_counts': {}
    }
    
    try:
        # Initialize database connection
        if not await db_manager.initialize():
            raise Exception("Failed to initialize database connection")
        
        # Run schema migration
        migration_manager = MigrationManager()
        results['schema_created'] = await migration_manager.run_schema_migration()
        
        if not results['schema_created']:
            raise Exception("Schema migration failed")
        
        # Run GTFS migration if directory provided
        if gtfs_dir and os.path.exists(gtfs_dir):
            gtfs_migrator = GTFSMigrator(gtfs_dir)
            results['gtfs_counts'] = await gtfs_migrator.migrate_gtfs_data()
            results['gtfs_migrated'] = True
        else:
            logger.warning("GTFS directory not provided or doesn't exist, skipping GTFS migration")
        
        logger.info("🎉 Full migration completed successfully!")
        return results
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        results['error'] = str(e)
        return results
    
    finally:
        await db_manager.close()

if __name__ == "__main__":
    # Run migration from command line
    import sys
    
    gtfs_dir = sys.argv[1] if len(sys.argv) > 1 else os.getenv('GTFS_DIR', '../gtfs-accra-ghana-2016')
    
    async def main():
        results = await run_full_migration(gtfs_dir)
        print(f"Migration results: {results}")
    
    asyncio.run(main())
