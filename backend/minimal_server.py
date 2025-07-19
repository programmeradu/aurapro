#!/usr/bin/env python3
"""
Minimal HTTP Server for AURA Mobile App
Uses only Python standard library - no external dependencies
"""

import json
import math
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, List, Any

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

class AURARequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        # Parse URL and query parameters
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)
        
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            if path == '/health':
                response = {
                    "status": "healthy",
                    "message": "AURA backend is running",
                    "gtfs_loaded": True,
                    "model_loaded": True,
                    "stops_count": len(MOCK_STOPS)
                }
            
            elif path == '/api/v1/gtfs/stops':
                response = {
                    "status": "success",
                    "data": {"stops": MOCK_STOPS},
                    "count": len(MOCK_STOPS)
                }
            
            elif path == '/api/v1/gtfs/stops/near':
                # Get query parameters
                lat = float(query_params.get('lat', [0])[0])
                lon = float(query_params.get('lon', [0])[0])
                radius_km = float(query_params.get('radius_km', [2.0])[0])
                
                # Find nearby stops
                nearby_stops = []
                for stop in MOCK_STOPS:
                    distance = calculate_distance(lat, lon, stop["stop_lat"], stop["stop_lon"])
                    if distance <= radius_km:
                        stop_with_distance = stop.copy()
                        stop_with_distance["distance_km"] = round(distance, 2)
                        nearby_stops.append(stop_with_distance)
                
                # Sort by distance
                nearby_stops.sort(key=lambda x: x["distance_km"])
                
                response = {
                    "status": "success",
                    "data": {"stops": nearby_stops},
                    "count": len(nearby_stops),
                    "search_params": {"lat": lat, "lon": lon, "radius_km": radius_km}
                }
            
            elif path == '/api/v1/gtfs/routes':
                response = {
                    "status": "success",
                    "data": {
                        "routes": [
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
                            }
                        ]
                    },
                    "count": 2
                }
            
            elif path == '/':
                response = {
                    "message": "AURA Transport API",
                    "status": "running",
                    "version": "1.0.0",
                    "endpoints": {
                        "health": "/health",
                        "stops": "/api/v1/gtfs/stops",
                        "nearby_stops": "/api/v1/gtfs/stops/near",
                        "routes": "/api/v1/gtfs/routes"
                    }
                }
            
            else:
                response = {"error": "Not found", "path": path}
                self.send_response(404)
            
            # Send JSON response
            self.wfile.write(json.dumps(response, indent=2).encode('utf-8'))
            
        except Exception as e:
            error_response = {"error": str(e), "path": path}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def log_message(self, format, *args):
        """Custom log format"""
        print(f"🌐 {self.address_string()} - {format % args}")

def run_server(port=8000):
    """Run the AURA backend server"""
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, AURARequestHandler)
    
    print("🚀 Starting AURA Minimal Backend Server...")
    print(f"📊 Loaded Ghana GTFS data: {len(MOCK_STOPS)} stops")
    print(f"🌐 Server running at: http://127.0.0.1:{port}")
    print("📋 Available endpoints:")
    print("   • Health: http://127.0.0.1:8000/health")
    print("   • Stops: http://127.0.0.1:8000/api/v1/gtfs/stops")
    print("   • Nearby: http://127.0.0.1:8000/api/v1/gtfs/stops/near?lat=5.6037&lon=-0.1870")
    print("   • Routes: http://127.0.0.1:8000/api/v1/gtfs/routes")
    print("\n🎯 Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
