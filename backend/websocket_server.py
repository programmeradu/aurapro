#!/usr/bin/env python3
"""
AURA Command Center - Real-Time WebSocket Server
Phase 2: Real-Time Infrastructure Implementation

This server provides real-time data streaming for:
- Vehicle tracking and position updates
- Live KPI calculations and streaming
- Alert broadcasting system
- Ghana-specific event handling
- Connection management with auto-reconnection
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import math
import pandas as pd
from dataclasses import dataclass, asdict
from enum import Enum
from realtime_data_generator import get_data_generator
from streaming_ml_service import get_streaming_ml_service
from gtfs_parser import load_gtfs

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app for WebSocket server
app = FastAPI(title="AURA WebSocket Server", version="2.0.0")

# SECURE CORS Configuration - No wildcards allowed
import os

# Get allowed origins from environment or use secure defaults
ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
).split(",")

# Add production origins if in production
if os.getenv("NODE_ENV") == "production":
    ALLOWED_ORIGINS.extend([
        "https://aura-transport.gov.gh",
        "https://www.aura-transport.gov.gh"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Requested-With"
    ],
)

# Create Socket.IO server with secure configuration
sio = socketio.AsyncServer(
    cors_allowed_origins=ALLOWED_ORIGINS,
    cors_credentials=True,
    logger=True,
    engineio_logger=True,
    async_mode='asgi',
    ping_timeout=60,
    ping_interval=25
)

# Mount Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

# Data Models
@dataclass
class Vehicle:
    id: str
    route: str
    lat: float
    lng: float
    speed: float
    passengers: int
    capacity: int
    status: str
    lastUpdate: str
    busType: str = "city"  # Default to city bus

@dataclass
class Route:
    id: str
    name: str
    color: str
    stops: List[Dict]
    vehicles: List[str]
    status: str

@dataclass
class KPI:
    id: str
    name: str
    value: float
    change: float
    trend: str
    unit: str
    category: str

@dataclass
class Alert:
    id: str
    type: str
    title: str
    message: str
    timestamp: str
    read: bool

class AlertType(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"

# Global state
connected_clients = set()
vehicles_data: Dict[str, Vehicle] = {}
routes_data: Dict[str, Route] = {}
kpis_data: Dict[str, KPI] = {}
alerts_data: List[Alert] = []

# Initialize data generator and ML service
data_generator = get_data_generator()
ml_service = get_streaming_ml_service()

# Load real GTFS data
BASE_DIR = os.path.dirname(__file__)
GTFS_DIR = os.getenv('GTFS_DIR', os.path.join(BASE_DIR, '..', 'gtfs-accra-ghana-2016'))

def load_real_gtfs_data():
    """Load real GTFS data and convert to our format"""
    try:
        gtfs_data = load_gtfs(GTFS_DIR)
        logger.info(f"✅ Loaded GTFS data from {GTFS_DIR}")
        logger.info(f"📊 Routes: {len(gtfs_data.routes) if gtfs_data.routes is not None else 0}")
        logger.info(f"🚏 Stops: {len(gtfs_data.stops) if gtfs_data.stops is not None else 0}")
        logger.info(f"🚗 Trips: {len(gtfs_data.trips) if gtfs_data.trips is not None else 0}")
        logger.info(f"📅 Stop Times: {len(gtfs_data.stop_times) if gtfs_data.stop_times is not None else 0}")

        # Convert GTFS routes to our format
        routes = []
        colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

        if gtfs_data.routes is not None and not gtfs_data.routes.empty:
            # Take first 10 routes for demo
            for i, (_, route) in enumerate(gtfs_data.routes.head(10).iterrows()):
                route_id = route['route_id']
                route_name = route.get('route_long_name', route.get('route_short_name', f'Route {route_id}'))

                # Get stops for this route from stop_times and trips
                route_stops = []
                if (gtfs_data.trips is not None and gtfs_data.stop_times is not None and
                    gtfs_data.stops is not None):

                    # Find trips for this route
                    route_trips = gtfs_data.trips[gtfs_data.trips['route_id'] == route_id]
                    if not route_trips.empty:
                        # Get first trip's stops
                        first_trip = route_trips.iloc[0]['trip_id']
                        trip_stops = gtfs_data.stop_times[gtfs_data.stop_times['trip_id'] == first_trip]
                        trip_stops = trip_stops.sort_values('stop_sequence')

                        for _, stop_time in trip_stops.head(5).iterrows():  # Limit to 5 stops
                            stop_info = gtfs_data.stops[gtfs_data.stops['stop_id'] == stop_time['stop_id']]
                            if not stop_info.empty:
                                stop = stop_info.iloc[0]
                                if pd.notna(stop['stop_lat']) and pd.notna(stop['stop_lon']):
                                    route_stops.append({
                                        "id": stop['stop_id'],
                                        "name": stop['stop_name'],
                                        "lat": float(stop['stop_lat']),
                                        "lng": float(stop['stop_lon']),
                                        "passengers_waiting": random.randint(5, 25)
                                    })

                if route_stops:  # Only add routes with stops
                    routes.append({
                        "id": route_id,
                        "name": route_name,
                        "color": colors[i % len(colors)],
                        "stops": route_stops,
                        "vehicles": [f"TT-{route_id}-{j+1}" for j in range(2)],  # 2 vehicles per route
                        "status": "active"
                    })

        logger.info(f"✅ Converted {len(routes)} GTFS routes to internal format")
        return routes

    except Exception as e:
        logger.error(f"❌ Failed to load GTFS data: {e}")
        # Fallback to minimal mock data
        return [
            {
                "id": "fallback_1",
                "name": "Circle to Madina (Fallback)",
                "color": "#3B82F6",
                "stops": [
                    {"id": "stop_1", "name": "Circle", "lat": 5.5717, "lng": -0.2107, "passengers_waiting": 8},
                    {"id": "stop_2", "name": "Madina", "lat": 5.6836, "lng": -0.1636, "passengers_waiting": 15}
                ],
                "vehicles": ["TT-001"],
                "status": "active"
            }
        ]

# Load real GTFS routes
ACCRA_ROUTES = load_real_gtfs_data()

def get_real_time_trips():
    """Generate real-time trip information from GTFS data"""
    try:
        gtfs_data = load_gtfs(GTFS_DIR)
        logger.info(f"🚌 Loading trips data from GTFS...")

        if gtfs_data.trips is None or gtfs_data.trips.empty:
            logger.warning("❌ No trips data found in GTFS")
            return []

        logger.info(f"✅ Found {len(gtfs_data.trips)} trips in GTFS data")

        # Get active trips (limit to first 10 for performance)
        active_trips = []
        for i, (_, trip) in enumerate(gtfs_data.trips.head(10).iterrows()):
            # Get stop times for this trip
            trip_stop_times = []
            if gtfs_data.stop_times is not None:
                trip_stops = gtfs_data.stop_times[gtfs_data.stop_times['trip_id'] == trip['trip_id']]
                trip_stops = trip_stops.sort_values('stop_sequence')

                for _, stop_time in trip_stops.iterrows():
                    trip_stop_times.append({
                        'stop_id': str(stop_time['stop_id']),
                        'arrival_time': str(stop_time['arrival_time']),
                        'departure_time': str(stop_time['departure_time']),
                        'stop_sequence': int(stop_time['stop_sequence']) if pd.notna(stop_time['stop_sequence']) else 0
                    })

            # Get route information
            route_info = {}
            if gtfs_data.routes is not None:
                route_data = gtfs_data.routes[gtfs_data.routes['route_id'] == trip['route_id']]
                if not route_data.empty:
                    route = route_data.iloc[0]
                    route_info = {
                        'route_short_name': str(route.get('route_short_name', '')),
                        'route_long_name': str(route.get('route_long_name', '')),
                        'route_type': int(route.get('route_type', 3)) if pd.notna(route.get('route_type')) else 3
                    }

            active_trips.append({
                'trip_id': str(trip['trip_id']),
                'route_id': str(trip['route_id']),
                'service_id': str(trip.get('service_id', 'service')),
                'shape_id': str(trip.get('shape_id', '')),
                'route_info': route_info,
                'stop_times': trip_stop_times,
                'status': 'active',
                'last_updated': datetime.now().isoformat()
            })

        logger.info(f"✅ Generated {len(active_trips)} active trips")
        return active_trips
    except Exception as e:
        logger.error(f"❌ Error generating trip data: {e}")
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        return []

def generate_vehicles_from_routes():
    """Generate vehicles based on real GTFS routes"""
    vehicles = []
    vehicle_counter = 1

    for route in ACCRA_ROUTES:
        route_name = route['name']
        stops = route['stops']

        if stops:  # Only create vehicles for routes with stops
            # Create 2 vehicles per route
            for i in range(2):
                # Place vehicle at random stop along the route
                stop = random.choice(stops)

                # Determine bus type based on route name
                bus_type = "mini"
                if "Station" in route_name or "Terminal" in route_name:
                    bus_type = "city"
                elif "Express" in route_name or "Highway" in route_name:
                    bus_type = "express"

                vehicle = Vehicle(
                    id=f"TT-{vehicle_counter:03d}",
                    route=route_name,
                    lat=stop['lat'],
                    lng=stop['lng'],
                    speed=random.randint(25, 55), # Increased speed range
                    passengers=random.randint(5, 18),
                    capacity=20,
                    status="active" if random.random() > 0.1 else "idle",
                    lastUpdate=datetime.now().isoformat(),
                    busType=bus_type  # Add bus type
                )
                vehicles.append(vehicle)
                vehicle_counter += 1

    logger.info(f"✅ Generated {len(vehicles)} vehicles from GTFS routes")
    return vehicles

# Generate vehicles from real routes
INITIAL_VEHICLES = generate_vehicles_from_routes()

INITIAL_KPIS = [
    KPI("network_efficiency", "Network Efficiency", 87.5, 2.3, "up", "%", "efficiency"),
    KPI("driver_profitability", "Driver Profitability", 12.8, 1.2, "up", "%", "financial"),
    KPI("service_equity", "Service Equity", 77.5, -0.8, "down", "Score", "social"),
    KPI("co2_reduction", "CO₂ Reduction", 21.0, 3.2, "up", "tonnes/week", "environmental"),
    KPI("passenger_satisfaction", "Passenger Satisfaction", 4.2, 0.1, "up", "/5", "social"),
    KPI("fuel_efficiency", "Fuel Efficiency", 8.5, -0.3, "down", "km/L", "environmental"),
    KPI("route_coverage", "Route Coverage", 94.2, 1.8, "up", "%", "efficiency"),
    KPI("revenue_per_km", "Revenue per KM", 2.45, 0.15, "up", "GH₵", "financial"),
]

# Initialize data
def initialize_data():
    """Initialize the global data structures"""
    global vehicles_data, routes_data, kpis_data
    
    # Initialize vehicles
    for vehicle in INITIAL_VEHICLES:
        vehicles_data[vehicle.id] = vehicle
    
    # Initialize routes
    for route_data in ACCRA_ROUTES:
        route = Route(**route_data)
        routes_data[route.id] = route
    
    # Initialize KPIs
    for kpi in INITIAL_KPIS:
        kpis_data[kpi.id] = kpi
    
    logger.info(f"Initialized {len(vehicles_data)} vehicles, {len(routes_data)} routes, {len(kpis_data)} KPIs")

# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    connected_clients.add(sid)

    # Log detailed connection info for debugging
    client_info = {
        'sid': sid,
        'remote_addr': environ.get('REMOTE_ADDR', 'unknown'),
        'user_agent': environ.get('HTTP_USER_AGENT', 'unknown'),
        'origin': environ.get('HTTP_ORIGIN', 'unknown'),
        'referer': environ.get('HTTP_REFERER', 'unknown'),
        'host': environ.get('HTTP_HOST', 'unknown')
    }

    logger.info(f"🔌 Client connected: {sid}")
    logger.info(f"📍 Client details: {client_info}")
    logger.info(f"👥 Total connected clients: {len(connected_clients)}")

    # Send initial data to the newly connected client
    try:
        await sio.emit('vehicles_update', [asdict(v) for v in vehicles_data.values()], room=sid)
        await sio.emit('routes_update', [asdict(r) for r in routes_data.values()], room=sid)
        await sio.emit('kpis_update', [asdict(k) for k in kpis_data.values()], room=sid)
        await sio.emit('trips_update', get_real_time_trips(), room=sid)
        logger.info(f"✅ Initial data sent to client {sid}")
    except Exception as e:
        logger.error(f"❌ Error sending initial data to client {sid}: {e}")
    
    # Send welcome alert
    welcome_alert = Alert(
        id=f"welcome_{sid[:8]}",
        type="success",
        title="Connected to AURA Command Center",
        message="Real-time data streaming is now active. Welcome to Ghana's premier transport intelligence system!",
        timestamp=datetime.now().isoformat(),
        read=False
    )
    await sio.emit('alert', asdict(welcome_alert), room=sid)

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    connected_clients.discard(sid)
    logger.info(f"Client {sid} disconnected. Total clients: {len(connected_clients)}")

# ML Streaming Callback
async def ml_streaming_callback(event_type: str, data: dict):
    """Callback function for ML streaming service to send data via WebSocket"""
    try:
        await sio.emit(event_type, data)
        logger.debug(f"Sent ML {event_type} to all clients")
    except Exception as e:
        logger.error(f"Error sending ML data: {e}")

@sio.event
async def request_vehicles(sid):
    """Handle request for vehicle data"""
    await sio.emit('vehicles_update', [asdict(v) for v in vehicles_data.values()], room=sid)

@sio.event
async def request_routes(sid):
    """Handle request for route data"""
    await sio.emit('routes_update', [asdict(r) for r in routes_data.values()], room=sid)

@sio.event
async def request_kpis(sid):
    """Handle request for KPI data"""
    await sio.emit('kpis_update', [asdict(k) for k in kpis_data.values()], room=sid)

@sio.event
async def request_trips(sid):
    """Handle request for trip data"""
    trips_data = get_real_time_trips()
    await sio.emit('trips_update', trips_data, room=sid)
    logger.info(f"📅 Sent {len(trips_data)} trips to client {sid}")

@sio.event
async def activate_scenario(sid, data):
    """Handle scenario activation"""
    scenario_id = data.get('scenarioId')
    parameters = data.get('parameters', {})
    
    logger.info(f"Activating scenario {scenario_id} with parameters {parameters}")
    
    # Apply scenario effects
    if scenario_id == "flood_scenario":
        await handle_flood_scenario()
    elif scenario_id == "market_day_scenario":
        await handle_market_day_scenario()
    elif scenario_id == "graduation_scenario":
        await handle_graduation_scenario()
    
    # Broadcast scenario activation
    scenario_alert = Alert(
        id=f"scenario_{scenario_id}_{datetime.now().timestamp()}",
        type="warning",
        title=f"Scenario Activated: {scenario_id.replace('_', ' ').title()}",
        message=f"Transport network adapting to {scenario_id.replace('_', ' ')} conditions.",
        timestamp=datetime.now().isoformat(),
        read=False
    )
    await broadcast_alert(scenario_alert)

@sio.event
async def user_preferences(sid, data):
    """Handle user preference updates"""
    logger.info(f"User preferences updated for {sid}: {data}")
    # Store preferences (in production, save to database)

# Real-time data simulation functions using realistic data generator
async def simulate_vehicle_movement():
    """Generate realistic vehicle movement using data generator"""
    while True:
        try:
            # Get realistic vehicle updates from data generator
            vehicle_updates = data_generator.generate_vehicle_updates()
            
            for update in vehicle_updates:
                vehicle_id = update["id"]
                
                # Update local vehicle data
                if vehicle_id in vehicles_data:
                    vehicle = vehicles_data[vehicle_id]
                    vehicle.lat = update["lat"]
                    vehicle.lng = update["lng"]
                    vehicle.speed = update["speed"]
                    vehicle.passengers = update["passengers"]
                    vehicle.status = update["status"]
                    vehicle.lastUpdate = update["lastUpdate"]
                else:
                    # Create new vehicle if it doesn't exist
                    vehicles_data[vehicle_id] = Vehicle(
                        id=update["id"],
                        route=update["route"],
                        lat=update["lat"],
                        lng=update["lng"],
                        speed=update["speed"],
                        passengers=update["passengers"],
                        capacity=update["capacity"],
                        status=update["status"],
                        lastUpdate=update["lastUpdate"]
                    )
                
                # Broadcast individual vehicle update
                await sio.emit('vehicle_update', {
                    'id': vehicle_id,
                    'updates': {
                        'lat': update["lat"],
                        'lng': update["lng"],
                        'speed': update["speed"],
                        'passengers': update["passengers"],
                        'status': update["status"],
                        'lastUpdate': update["lastUpdate"]
                    }
                })
            
            await asyncio.sleep(1)  # Update every 1 second for faster movement
            
        except Exception as e:
            logger.error(f"Error in vehicle simulation: {e}")
            await asyncio.sleep(10)

async def update_kpis():
    """Update KPIs using realistic data generator"""
    while True:
        try:
            # Get realistic KPI updates from data generator
            kpi_updates = data_generator.generate_kpi_updates()
            
            for update in kpi_updates:
                kpi_id = update["id"]
                
                # Update local KPI data
                if kpi_id in kpis_data:
                    kpi = kpis_data[kpi_id]
                    kpi.value = update["value"]
                    kpi.change = update["change"]
                    kpi.trend = update["trend"]
                else:
                    # Create new KPI if it doesn't exist
                    kpis_data[kpi_id] = KPI(
                        id=update["id"],
                        name=update["name"],
                        value=update["value"],
                        change=update["change"],
                        trend=update["trend"],
                        unit=update["unit"],
                        category=update["category"]
                    )
                
                # Broadcast KPI update
                await sio.emit('kpi_update', {
                    'id': kpi_id,
                    'updates': {
                        'value': update["value"],
                        'change': update["change"],
                        'trend': update["trend"]
                    }
                })
            
            await asyncio.sleep(30)  # Update every 30 seconds
            
        except Exception as e:
            logger.error(f"Error in KPI updates: {e}")
            await asyncio.sleep(60)

async def update_trips():
    """Update trip information periodically"""
    while True:
        try:
            # Get fresh trip data
            trips_data = get_real_time_trips()

            # Broadcast updated trips to all clients
            await sio.emit('trips_update', trips_data)
            logger.info(f"📅 Broadcasted {len(trips_data)} trip updates")

            await asyncio.sleep(60)  # Update every 60 seconds
        except Exception as e:
            logger.error(f"Error updating trips: {e}")
            await asyncio.sleep(60)

async def ghana_weather_monitor():
    """Monitor Ghana weather and send alerts"""
    while True:
        try:
            # Simulate weather conditions
            hour = datetime.now().hour
            
            # Higher chance of rain during rainy season (April-July, September-November)
            month = datetime.now().month
            rain_probability = 0.3 if month in [4, 5, 6, 7, 9, 10, 11] else 0.1
            
            if random.random() < rain_probability:
                # Rain detected
                intensity = random.choice(["light", "moderate", "heavy"])
                
                weather_alert = Alert(
                    id=f"weather_{datetime.now().timestamp()}",
                    type="warning" if intensity == "heavy" else "info",
                    title=f"{intensity.title()} Rain Alert",
                    message=f"{intensity.title()} rainfall detected in Accra. Expect potential traffic delays and route adjustments.",
                    timestamp=datetime.now().isoformat(),
                    read=False
                )
                
                await broadcast_alert(weather_alert)
                
                # Send weather update
                await sio.emit('ghana_weather_update', {
                    'temperature': random.randint(24, 32),
                    'humidity': random.randint(70, 95),
                    'is_rainy': True,
                    'rain_intensity': intensity,
                    'wind_speed': random.randint(10, 25)
                })
            
            await asyncio.sleep(1800)  # Check every 30 minutes
            
        except Exception as e:
            logger.error(f"Error in weather monitoring: {e}")
            await asyncio.sleep(3600)

async def ghana_context_monitor():
    """Monitor Ghana context and send intelligent alerts using data generator"""
    while True:
        try:
            # Get context-based alerts from data generator
            context_alerts = data_generator.generate_context_alerts()
            
            for alert_data in context_alerts:
                alert = Alert(
                    id=f"context_{datetime.now().timestamp()}_{hash(alert_data['message']) % 1000}",
                    type=alert_data["type"],
                    title=alert_data["title"],
                    message=alert_data["message"],
                    timestamp=alert_data["timestamp"],
                    read=alert_data["read"]
                )
                await broadcast_alert(alert)
            
            await asyncio.sleep(1800)  # Check every 30 minutes
            
        except Exception as e:
            logger.error(f"Error in context monitoring: {e}")
            await asyncio.sleep(3600)

# Scenario handlers
async def handle_flood_scenario():
    """Handle flood scenario effects"""
    # Affect vehicles in flood-prone areas
    for vehicle in vehicles_data.values():
        if "Circle" in vehicle.route or "Kaneshie" in vehicle.route:
            vehicle.speed = max(5, vehicle.speed * 0.4)  # Significantly reduce speed
            vehicle.status = "disrupted" if vehicle.status == "active" else vehicle.status
    
    flood_alert = Alert(
        id=f"flood_{datetime.now().timestamp()}",
        type="error",
        title="Flood Alert - Circle Area",
        message="Heavy flooding reported in Circle area. Multiple routes affected. Emergency response activated.",
        timestamp=datetime.now().isoformat(),
        read=False
    )
    await broadcast_alert(flood_alert)

async def handle_market_day_scenario():
    """Handle market day scenario effects"""
    # Increase passenger demand
    for vehicle in vehicles_data.values():
        if "Kaneshie" in vehicle.route:
            vehicle.passengers = min(vehicle.capacity, vehicle.passengers + random.randint(3, 8))
            vehicle.speed = max(10, vehicle.speed * 0.7)  # Reduce speed due to congestion
    
    market_alert = Alert(
        id=f"market_day_{datetime.now().timestamp()}",
        type="warning",
        title="Market Day Surge",
        message="High passenger demand detected at Kaneshie Market. Dynamic pricing activated.",
        timestamp=datetime.now().isoformat(),
        read=False
    )
    await broadcast_alert(market_alert)

async def handle_graduation_scenario():
    """Handle graduation ceremony scenario effects"""
    # Affect routes near University of Ghana
    for vehicle in vehicles_data.values():
        if "Legon" in vehicle.route or "Madina" in vehicle.route:
            vehicle.speed = max(8, vehicle.speed * 0.5)  # Significant speed reduction
            vehicle.passengers = min(vehicle.capacity, vehicle.passengers + random.randint(5, 10))
    
    graduation_alert = Alert(
        id=f"graduation_{datetime.now().timestamp()}",
        type="warning",
        title="University Graduation Event",
        message="Major graduation ceremony at University of Ghana. Expect heavy traffic on Legon-Madina routes.",
        timestamp=datetime.now().isoformat(),
        read=False
    )
    await broadcast_alert(graduation_alert)

async def broadcast_alert(alert: Alert):
    """Broadcast alert to all connected clients"""
    alerts_data.append(alert)
    await sio.emit('alert', asdict(alert))
    logger.info(f"Broadcasted alert: {alert.title}")

# Background tasks
async def start_background_tasks():
    """Start all background tasks"""
    # Start ML streaming service with callback
    asyncio.create_task(ml_service.start_streaming(ml_streaming_callback))

    tasks = [
        asyncio.create_task(simulate_vehicle_movement()),
        asyncio.create_task(update_kpis()),
        asyncio.create_task(update_trips()),
        asyncio.create_task(ghana_weather_monitor()),
        asyncio.create_task(ghana_context_monitor()),
    ]

    logger.info("Started all background tasks including ML streaming")
    return tasks

# FastAPI routes
@app.get("/")
async def root():
    return {
        "service": "AURA WebSocket Server",
        "version": "2.0.0",
        "status": "running",
        "connected_clients": len(connected_clients),
        "vehicles": len(vehicles_data),
        "routes": len(routes_data),
        "kpis": len(kpis_data)
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "connected_clients": len(connected_clients),
        "uptime": "running"
    }

@app.get("/stats")
async def get_stats():
    return {
        "connected_clients": len(connected_clients),
        "vehicles": {
            "total": len(vehicles_data),
            "active": len([v for v in vehicles_data.values() if v.status == "active"]),
            "idle": len([v for v in vehicles_data.values() if v.status == "idle"])
        },
        "routes": {
            "total": len(routes_data),
            "active": len([r for r in routes_data.values() if r.status == "active"])
        },
        "kpis": len(kpis_data),
        "alerts": len(alerts_data)
    }

# Application startup
@app.on_event("startup")
async def startup_event():
    """Initialize data and start background tasks on startup"""
    logger.info("🚀 Starting AURA WebSocket Server...")
    initialize_data()
    await start_background_tasks()
    logger.info("✅ AURA WebSocket Server ready for real-time transport intelligence!")

if __name__ == "__main__":
    # Run the server
    logger.info("🚀 Starting AURA WebSocket Server...")
    print("🚀 Starting AURA WebSocket Server...")
    try:
        uvicorn.run(
            socket_app,
            host="0.0.0.0",
            port=8002,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        logger.error(f"Error starting server: {e}")
