"""
🚀 AURA Database Setup & Installation
Automated PostgreSQL + TimescaleDB + PostGIS setup for development
"""

import os
import sys
import subprocess
import asyncio
import logging
from pathlib import Path
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseSetup:
    """Handles database installation and configuration"""
    
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '5432')),
            'database': os.getenv('DB_NAME', 'aura_transport'),
            'user': os.getenv('DB_USER', 'aura_user'),
            'password': os.getenv('DB_PASSWORD', 'aura_password'),
            'admin_user': os.getenv('DB_ADMIN_USER', 'postgres'),
            'admin_password': os.getenv('DB_ADMIN_PASSWORD', 'postgres'),
        }
    
    def check_postgresql_installed(self) -> bool:
        """Check if PostgreSQL is installed"""
        try:
            result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                logger.info(f"✅ PostgreSQL found: {result.stdout.strip()}")
                return True
            return False
        except FileNotFoundError:
            return False
    
    def install_postgresql_windows(self):
        """Install PostgreSQL on Windows using chocolatey"""
        logger.info("🔄 Installing PostgreSQL on Windows...")
        
        try:
            # Check if chocolatey is installed
            subprocess.run(['choco', '--version'], check=True, capture_output=True)
            
            # Install PostgreSQL
            subprocess.run([
                'choco', 'install', 'postgresql', 
                '--params', f"'/Password:{self.db_config['admin_password']}'",
                '-y'
            ], check=True)
            
            logger.info("✅ PostgreSQL installed successfully")
            
        except subprocess.CalledProcessError:
            logger.error("❌ Failed to install PostgreSQL via chocolatey")
            logger.info("Please install PostgreSQL manually from https://www.postgresql.org/download/windows/")
            sys.exit(1)
        except FileNotFoundError:
            logger.error("❌ Chocolatey not found. Installing PostgreSQL manually...")
            self._manual_postgresql_install()
    
    def _manual_postgresql_install(self):
        """Provide manual installation instructions"""
        logger.info("""
        📋 Manual PostgreSQL Installation Required:
        
        1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
        2. Run the installer and follow the setup wizard
        3. Set the superuser password to: {admin_password}
        4. Install on default port: {port}
        5. Install Stack Builder components: TimescaleDB, PostGIS
        
        After installation, run this script again.
        """.format(**self.db_config))
        sys.exit(1)
    
    def create_database_and_user(self):
        """Create database and user"""
        try:
            logger.info("🔄 Creating database and user...")
            
            # Connect as admin user
            conn = psycopg2.connect(
                host=self.db_config['host'],
                port=self.db_config['port'],
                database='postgres',  # Connect to default database
                user=self.db_config['admin_user'],
                password=self.db_config['admin_password']
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Create user if not exists
            cursor.execute(f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '{self.db_config['user']}') THEN
                        CREATE USER {self.db_config['user']} WITH PASSWORD '{self.db_config['password']}';
                    END IF;
                END
                $$;
            """)
            
            # Create database if not exists
            cursor.execute(f"""
                SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{self.db_config['database']}'
            """)
            
            if not cursor.fetchone():
                cursor.execute(f"CREATE DATABASE {self.db_config['database']} OWNER {self.db_config['user']}")
                logger.info(f"✅ Created database: {self.db_config['database']}")
            else:
                logger.info(f"✅ Database already exists: {self.db_config['database']}")
            
            # Grant privileges
            cursor.execute(f"GRANT ALL PRIVILEGES ON DATABASE {self.db_config['database']} TO {self.db_config['user']}")
            
            cursor.close()
            conn.close()
            
            logger.info("✅ Database and user setup completed")
            
        except Exception as e:
            logger.error(f"❌ Failed to create database and user: {e}")
            raise
    
    def install_extensions(self):
        """Install required PostgreSQL extensions"""
        try:
            logger.info("🔄 Installing PostgreSQL extensions...")
            
            # Connect to the new database
            conn = psycopg2.connect(
                host=self.db_config['host'],
                port=self.db_config['port'],
                database=self.db_config['database'],
                user=self.db_config['admin_user'],
                password=self.db_config['admin_password']
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Install extensions
            extensions = [
                'uuid-ossp',
                'postgis',
                'timescaledb'
            ]
            
            for ext in extensions:
                try:
                    cursor.execute(f"CREATE EXTENSION IF NOT EXISTS \"{ext}\"")
                    logger.info(f"✅ Installed extension: {ext}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not install {ext}: {e}")
                    if ext == 'timescaledb':
                        logger.info("TimescaleDB may need to be installed separately")
                    elif ext == 'postgis':
                        logger.info("PostGIS may need to be installed separately")
            
            cursor.close()
            conn.close()
            
            logger.info("✅ Extensions installation completed")
            
        except Exception as e:
            logger.error(f"❌ Failed to install extensions: {e}")
            raise
    
    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            conn = psycopg2.connect(
                host=self.db_config['host'],
                port=self.db_config['port'],
                database=self.db_config['database'],
                user=self.db_config['user'],
                password=self.db_config['password']
            )
            cursor = conn.cursor()
            cursor.execute('SELECT version()')
            version = cursor.fetchone()[0]
            logger.info(f"✅ Database connection successful: {version}")
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def create_env_file(self):
        """Create .env file with database configuration"""
        env_content = f"""# AURA Database Configuration
DB_HOST={self.db_config['host']}
DB_PORT={self.db_config['port']}
DB_NAME={self.db_config['database']}
DB_USER={self.db_config['user']}
DB_PASSWORD={self.db_config['password']}

# Connection Pool Settings
DB_POOL_MIN_SIZE=5
DB_POOL_MAX_SIZE=20
DB_COMMAND_TIMEOUT=60

# GTFS Data Directory
GTFS_DIR=../gtfs-accra-ghana-2016
"""
        
        env_file = Path(__file__).parent.parent / '.env'
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        logger.info(f"✅ Created environment file: {env_file}")

def setup_database():
    """Main setup function"""
    logger.info("🚀 Starting AURA Database Setup...")
    
    setup = DatabaseSetup()
    
    # Check if PostgreSQL is installed
    if not setup.check_postgresql_installed():
        if sys.platform.startswith('win'):
            setup.install_postgresql_windows()
        else:
            logger.error("❌ PostgreSQL not found. Please install PostgreSQL manually.")
            sys.exit(1)
    
    try:
        # Create database and user
        setup.create_database_and_user()
        
        # Install extensions
        setup.install_extensions()
        
        # Test connection
        if setup.test_connection():
            logger.info("✅ Database setup completed successfully!")
            
            # Create environment file
            setup.create_env_file()
            
            logger.info("""
            🎉 Setup Complete! Next steps:
            
            1. Run migrations: python -m database.migrations
            2. Start the backend server: python main.py
            3. The database is ready for GTFS data import
            """)
        else:
            logger.error("❌ Database setup failed - connection test failed")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Database setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_database()
