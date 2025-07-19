#!/usr/bin/env python3
"""
Simple AURA Backend Server for Mobile App
Provides essential GTFS endpoints without complex dependencies
"""

import json
import math
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="AURA Transport API",
    description="Simple backend for AURA mobile app",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock GTFS data for Ghana
MOCK_STOPS = [
    {
        "stop_id": "ACCRA_CENTRAL_01",
        "stop_name": "Accra Central Terminal",
        "stop_lat": 5.5502,
        "stop_lon": -0.2174,
        "stop_desc": "Main transport hub in Accra Central"
    },
    {
        "stop_id": "KANESHIE_TERMINAL",
        "stop_name": "Kaneshie Terminal",
        "stop_lat": 5.5731,
        "stop_lon": -0.2469,
        "stop_desc": "Major market and transport terminal"
    },
    {
        "stop_id": "TEMA_TERMINAL",
        "stop_name": "Tema Station Terminal",
        "stop_lat": 5.6698,
        "stop_lon": -0.0166,
        "stop_desc": "Tema main transport terminal"
    },
    {
        "stop_id": "CIRCLE_TERMINAL",
        "stop_name": "Circle Terminal",
        "stop_lat": 5.5717,
        "stop_lon": -0.1969,
        "stop_desc": "Circle interchange and transport hub"
    },
    {
        "stop_id": "MADINA_TERMINAL",
        "stop_name": "Madina Terminal",
        "stop_lat": 5.6837,
        "stop_lon": -0.1669,
        "stop_desc": "Madina transport terminal"
    },
    {
        "stop_id": "OKAISHIE_STOP",
        "stop_name": "Okaishie Bus Stop",
        "stop_lat": 5.5560,
        "stop_lon": -0.2040,
        "stop_desc": "Okaishie market area bus stop"
    },
    {
        "stop_id": "LAPAZ_STOP",
        "stop_name": "Lapaz Bus Stop",
        "stop_lat": 5.6050,
        "stop_lon": -0.2580,
        "stop_desc": "Lapaz junction bus stop"
    },
    {
        "stop_id": "ACHIMOTA_STOP",
        "stop_name": "Achimota Bus Stop",
        "stop_lat": 5.6180,
        "stop_lon": -0.2370,
        "stop_desc": "Achimota forest area bus stop"
    },
    {
        "stop_id": "DANSOMAN_STOP",
        "stop_name": "Dansoman Bus Stop",
        "stop_lat": 5.5390,
        "stop_lon": -0.2890,
        "stop_desc": "Dansoman residential area bus stop"
    },
    {
        "stop_id": "EAST_LEGON_STOP",
        "stop_name": "East Legon Bus Stop",
        "stop_lat": 5.6500,
        "stop_lon": -0.1500,
        "stop_desc": "East Legon residential area bus stop"
    },
    {
        "stop_id": "KOTOKA_STATION",
        "stop_name": "Kotoka Airport Station",
        "stop_lat": 5.6052,
        "stop_lon": -0.1668,
        "stop_desc": "Kotoka International Airport transport station"
    },
    {
        "stop_id": "UNIVERSITY_STATION",
        "stop_name": "University of Ghana Station",
        "stop_lat": 5.6515,
        "stop_lon": -0.1870,
        "stop_desc": "University of Ghana transport station"
    }
]

MOCK_ROUTES = [
    {
        "route_id": "ACCRA_TEMA_01",
        "route_short_name": "Accra-Tema",
        "route_long_name": "Accra Central to Tema Station",
        "route_type": 3,
        "route_color": "FF6B35"
    },
    {
        "route_id": "CIRCLE_KANESHIE_01",
        "route_short_name": "Circle-Kaneshie",
        "route_long_name": "Circle to Kaneshie Market",
        "route_type": 3,
        "route_color": "2E86AB"
    },
    {
        "route_id": "MADINA_CENTRAL_01",
        "route_short_name": "Madina-Central",
        "route_long_name": "Madina to Accra Central",
        "route_type": 3,
        "route_color": "A23B72"
    }
]

MOCK_AGENCIES = [
    {
        "agency_id": "GPRTU",
        "agency_name": "Ghana Private Road Transport Union",
        "agency_url": "https://gprtu.gov.gh",
        "agency_timezone": "Africa/Accra"
    },
    {
        "agency_id": "STC",
        "agency_name": "State Transport Corporation",
        "agency_url": "https://stc.gov.gh",
        "agency_timezone": "Africa/Accra"
    }
]

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in kilometers"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

@app.get("/")
async def root():
    return {
        "message": "AURA Transport API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "stops": "/api/v1/gtfs/stops",
            "nearby_stops": "/api/v1/gtfs/stops/near",
            "routes": "/api/v1/gtfs/routes",
            "agencies": "/api/v1/gtfs/agencies"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "AURA backend is running",
        "gtfs_loaded": True,
        "model_loaded": True,
        "stops_count": len(MOCK_STOPS),
        "routes_count": len(MOCK_ROUTES)
    }

@app.get("/api/v1/gtfs/stops")
async def get_stops():
    """Get all GTFS stops"""
    return {
        "status": "success",
        "data": {
            "stops": MOCK_STOPS
        },
        "count": len(MOCK_STOPS)
    }

@app.get("/api/v1/gtfs/stops/near")
async def get_nearby_stops(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius_km: float = Query(2.0, description="Search radius in kilometers")
):
    """Get stops near a location"""
    nearby_stops = []
    
    for stop in MOCK_STOPS:
        distance = calculate_distance(lat, lon, stop["stop_lat"], stop["stop_lon"])
        if distance <= radius_km:
            stop_with_distance = stop.copy()
            stop_with_distance["distance_km"] = round(distance, 2)
            nearby_stops.append(stop_with_distance)
    
    # Sort by distance
    nearby_stops.sort(key=lambda x: x["distance_km"])
    
    return {
        "status": "success",
        "data": {
            "stops": nearby_stops
        },
        "count": len(nearby_stops),
        "search_params": {
            "lat": lat,
            "lon": lon,
            "radius_km": radius_km
        }
    }

@app.get("/api/v1/gtfs/routes")
async def get_routes():
    """Get all GTFS routes"""
    return {
        "status": "success",
        "data": {
            "routes": MOCK_ROUTES
        },
        "count": len(MOCK_ROUTES)
    }

@app.get("/api/v1/gtfs/agencies")
async def get_agencies():
    """Get all GTFS agencies"""
    return {
        "status": "success",
        "data": {
            "agencies": MOCK_AGENCIES
        },
        "count": len(MOCK_AGENCIES)
    }

@app.get("/api/v1/gtfs/trips")
async def get_trips():
    """Get sample trips data"""
    return {
        "status": "success",
        "data": {
            "trips": [
                {
                    "trip_id": "TRIP_001",
                    "route_id": "ACCRA_TEMA_01",
                    "service_id": "WEEKDAY",
                    "trip_headsign": "Tema Station"
                }
            ]
        },
        "count": 1
    }

if __name__ == "__main__":
    print("🚀 Starting AURA Simple Backend Server...")
    print("📊 Loaded Ghana GTFS data:")
    print(f"   • {len(MOCK_STOPS)} stops")
    print(f"   • {len(MOCK_ROUTES)} routes")
    print(f"   • {len(MOCK_AGENCIES)} agencies")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📋 API Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
