#!/usr/bin/env python3
"""
🗄️ AURA Database Installation Script
Automated setup for PostgreSQL + TimescaleDB + PostGIS + GTFS data migration
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from backend.database.setup import setup_database
from backend.database.migrations import run_full_migration

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main installation function"""
    logger.info("🚀 AURA Database Installation Starting...")
    
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║                    🗄️ AURA DATABASE SETUP                    ║
    ║                                                              ║
    ║  This script will install and configure:                    ║
    ║  • PostgreSQL Database                                       ║
    ║  • TimescaleDB (Time-series extension)                      ║
    ║  • PostGIS (Spatial extension)                              ║
    ║  • AURA Transport Schema                                     ║
    ║  • GTFS Data Migration                                       ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    # Check if user wants to proceed
    response = input("Do you want to proceed with the installation? (y/N): ")
    if response.lower() not in ['y', 'yes']:
        print("Installation cancelled.")
        return
    
    try:
        # Step 1: Setup PostgreSQL and extensions
        logger.info("📋 Step 1: Setting up PostgreSQL...")
        setup_database()
        
        # Step 2: Run database migrations
        logger.info("📋 Step 2: Running database migrations...")
        gtfs_dir = os.getenv('GTFS_DIR', 'gtfs-accra-ghana-2016')
        
        if not os.path.exists(gtfs_dir):
            logger.warning(f"⚠️ GTFS directory not found: {gtfs_dir}")
            logger.info("You can run GTFS migration later with: python -m backend.database.migrations")
            gtfs_dir = None
        
        # Run async migration
        async def run_migration():
            return await run_full_migration(gtfs_dir)
        
        results = asyncio.run(run_migration())
        
        # Display results
        if results.get('schema_created'):
            logger.info("✅ Database schema created successfully")
        
        if results.get('gtfs_migrated'):
            logger.info("✅ GTFS data migrated successfully")
            gtfs_counts = results.get('gtfs_counts', {})
            for entity, count in gtfs_counts.items():
                logger.info(f"   • {entity}: {count} records")
        
        print("""
        ╔══════════════════════════════════════════════════════════════╗
        ║                    🎉 INSTALLATION COMPLETE!                 ║
        ║                                                              ║
        ║  Your AURA database is ready! Next steps:                   ║
        ║                                                              ║
        ║  1. Start the backend server:                               ║
        ║     cd backend && python main.py                            ║
        ║                                                              ║
        ║  2. Start the frontend:                                      ║
        ║     npm run dev                                              ║
        ║                                                              ║
        ║  3. Access the dashboard:                                    ║
        ║     http://localhost:3000                                    ║
        ║                                                              ║
        ║  Database Features Available:                                ║
        ║  • Real-time vehicle tracking                               ║
        ║  • Time-series KPI storage                                  ║
        ║  • Spatial queries for stops/routes                         ║
        ║  • ML prediction storage                                     ║
        ║  • Historical analytics                                      ║
        ╚══════════════════════════════════════════════════════════════╝
        """)
        
    except Exception as e:
        logger.error(f"❌ Installation failed: {e}")
        print(f"""
        ╔══════════════════════════════════════════════════════════════╗
        ║                    ❌ INSTALLATION FAILED                     ║
        ║                                                              ║
        ║  Error: {str(e):<54} ║
        ║                                                              ║
        ║  Troubleshooting:                                            ║
        ║  1. Check PostgreSQL is installed                           ║
        ║  2. Verify database credentials in .env                     ║
        ║  3. Ensure TimescaleDB extension is available               ║
        ║  4. Check logs above for specific errors                    ║
        ║                                                              ║
        ║  Manual Setup:                                               ║
        ║  python backend/database/setup.py                           ║
        ║  python -m backend.database.migrations                      ║
        ╚══════════════════════════════════════════════════════════════╝
        """)
        sys.exit(1)

def check_requirements():
    """Check if required packages are installed"""
    required_packages = [
        'asyncpg',
        'psycopg2-binary',
        'pandas'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.error(f"❌ Missing required packages: {', '.join(missing_packages)}")
        logger.info("Install them with: pip install " + " ".join(missing_packages))
        return False
    
    return True

if __name__ == "__main__":
    # Check requirements first
    if not check_requirements():
        sys.exit(1)
    
    main()
