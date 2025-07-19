-- 🗄️ AURA Transport Database Schema
-- PostgreSQL database for Ghana transport management system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- ============================================================================
-- STATIC TRANSPORT DATA (GTFS-based)
-- ============================================================================

-- Agencies (Transport operators)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id VARCHAR(50) UNIQUE NOT NULL,
    agency_name VARCHAR(255) NOT NULL,
    agency_url VARCHAR(255),
    agency_timezone VARCHAR(50) DEFAULT 'Africa/Accra',
    agency_lang VARCHAR(10) DEFAULT 'en',
    agency_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id VARCHAR(50) UNIQUE NOT NULL,
    agency_id VARCHAR(50) REFERENCES agencies(agency_id),
    route_short_name VARCHAR(50),
    route_long_name VARCHAR(255) NOT NULL,
    route_desc TEXT,
    route_type INTEGER NOT NULL, -- 3 = Bus, 0 = Tram, etc.
    route_url VARCHAR(255),
    route_color VARCHAR(6) DEFAULT 'FFFFFF',
    route_text_color VARCHAR(6) DEFAULT '000000',
    route_sort_order INTEGER,
    continuous_pickup INTEGER DEFAULT 1,
    continuous_drop_off INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stops
CREATE TABLE stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stop_id VARCHAR(50) UNIQUE NOT NULL,
    stop_code VARCHAR(50),
    stop_name VARCHAR(255) NOT NULL,
    stop_desc TEXT,
    stop_lat DECIMAL(10,8) NOT NULL,
    stop_lon DECIMAL(11,8) NOT NULL,
    location GEOGRAPHY(POINT, 4326), -- PostGIS point for spatial queries
    zone_id VARCHAR(50),
    stop_url VARCHAR(255),
    location_type INTEGER DEFAULT 0, -- 0 = stop, 1 = station
    parent_station VARCHAR(50),
    stop_timezone VARCHAR(50),
    wheelchair_boarding INTEGER DEFAULT 0,
    level_id VARCHAR(50),
    platform_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for stops
CREATE INDEX idx_stops_location ON stops USING GIST (location);

-- Shapes (Route geometries)
CREATE TABLE shapes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shape_id VARCHAR(50) NOT NULL,
    shape_pt_lat DECIMAL(10,8) NOT NULL,
    shape_pt_lon DECIMAL(11,8) NOT NULL,
    shape_pt_sequence INTEGER NOT NULL,
    shape_dist_traveled DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shape_id, shape_pt_sequence)
);

-- Trips
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id VARCHAR(50) NOT NULL REFERENCES routes(route_id),
    service_id VARCHAR(50) NOT NULL,
    trip_id VARCHAR(50) UNIQUE NOT NULL,
    trip_headsign VARCHAR(255),
    trip_short_name VARCHAR(50),
    direction_id INTEGER,
    block_id VARCHAR(50),
    shape_id VARCHAR(50),
    wheelchair_accessible INTEGER DEFAULT 0,
    bikes_allowed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stop Times
CREATE TABLE stop_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(trip_id),
    arrival_time TIME,
    departure_time TIME,
    stop_id VARCHAR(50) NOT NULL REFERENCES stops(stop_id),
    stop_sequence INTEGER NOT NULL,
    stop_headsign VARCHAR(255),
    pickup_type INTEGER DEFAULT 0,
    drop_off_type INTEGER DEFAULT 0,
    continuous_pickup INTEGER,
    continuous_drop_off INTEGER,
    shape_dist_traveled DECIMAL(10,2),
    timepoint INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, stop_sequence)
);

-- ============================================================================
-- REAL-TIME OPERATIONAL DATA
-- ============================================================================

-- Vehicles (Real-time fleet)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(50) UNIQUE NOT NULL,
    route_id VARCHAR(50) REFERENCES routes(route_id),
    trip_id VARCHAR(50) REFERENCES trips(trip_id),
    license_plate VARCHAR(20),
    vehicle_type VARCHAR(50) DEFAULT 'bus',
    capacity INTEGER DEFAULT 50,
    fuel_type VARCHAR(20) DEFAULT 'diesel',
    year_manufactured INTEGER,
    status VARCHAR(20) DEFAULT 'active', -- active, maintenance, retired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Positions (Time-series data)
CREATE TABLE vehicle_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(vehicle_id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    bearing DECIMAL(5,2), -- 0-360 degrees
    speed DECIMAL(5,2), -- km/h
    passengers INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_transit', -- in_transit, at_stop, idle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert to TimescaleDB hypertable for time-series optimization
SELECT create_hypertable('vehicle_positions', 'timestamp');

-- Create spatial index for vehicle positions
CREATE INDEX idx_vehicle_positions_location ON vehicle_positions USING GIST (location);
CREATE INDEX idx_vehicle_positions_vehicle_timestamp ON vehicle_positions (vehicle_id, timestamp DESC);

-- KPIs (Key Performance Indicators)
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(50),
    category VARCHAR(50), -- efficiency, financial, environmental, social
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert KPIs to hypertable
SELECT create_hypertable('kpis', 'timestamp');
CREATE INDEX idx_kpis_category_timestamp ON kpis (category, timestamp DESC);

-- ============================================================================
-- ANALYTICS & ML DATA
-- ============================================================================

-- ML Predictions
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_type VARCHAR(50) NOT NULL, -- travel_time, demand, delay
    route_id VARCHAR(50) REFERENCES routes(route_id),
    stop_id VARCHAR(50) REFERENCES stops(stop_id),
    predicted_value DECIMAL(15,4) NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    model_version VARCHAR(20),
    features JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT create_hypertable('ml_predictions', 'timestamp');

-- Anomalies
CREATE TABLE anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    entity_type VARCHAR(50), -- vehicle, route, stop
    entity_id VARCHAR(50),
    description TEXT,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT create_hypertable('anomalies', 'detected_at');

-- ============================================================================
-- USER & SYSTEM DATA
-- ============================================================================

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(20) NOT NULL, -- info, warning, error, success
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    route_id VARCHAR(50) REFERENCES routes(route_id),
    stop_id VARCHAR(50) REFERENCES stops(stop_id),
    priority INTEGER DEFAULT 1, -- 1-5
    is_read BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Preferences (for future user system)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Route-related indexes
CREATE INDEX idx_routes_agency ON routes(agency_id);
CREATE INDEX idx_routes_type ON routes(route_type);

-- Trip-related indexes
CREATE INDEX idx_trips_route ON trips(route_id);
CREATE INDEX idx_trips_service ON trips(service_id);

-- Stop times indexes
CREATE INDEX idx_stop_times_trip ON stop_times(trip_id);
CREATE INDEX idx_stop_times_stop ON stop_times(stop_id);
CREATE INDEX idx_stop_times_sequence ON stop_times(trip_id, stop_sequence);

-- Vehicle indexes
CREATE INDEX idx_vehicles_route ON vehicles(route_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- Alert indexes
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_read ON alerts(is_read);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stops_updated_at BEFORE UPDATE ON stops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set location from lat/lon
CREATE OR REPLACE FUNCTION set_location_from_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.stop_lon, NEW.stop_lat), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply location trigger to stops
CREATE TRIGGER set_stops_location BEFORE INSERT OR UPDATE ON stops FOR EACH ROW EXECUTE FUNCTION set_location_from_coordinates();

-- Function for vehicle positions location
CREATE OR REPLACE FUNCTION set_vehicle_location_from_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply location trigger to vehicle positions
CREATE TRIGGER set_vehicle_positions_location BEFORE INSERT OR UPDATE ON vehicle_positions FOR EACH ROW EXECUTE FUNCTION set_vehicle_location_from_coordinates();
