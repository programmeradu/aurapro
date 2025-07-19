#!/usr/bin/env python3
"""
AURA Command Center - Real-Time Data Generator
Phase 2: Real-Time Infrastructure Implementation

This module generates realistic real-time data for:
- Vehicle movement simulation along GTFS routes
- Dynamic KPI calculations based on Ghana economics
- Weather-based traffic impact simulation
- Market day and holiday effects on transport
- Passenger demand fluctuations
"""

import asyncio
import random
import math
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

# Optional Mapbox routing import
try:
    from mapbox_routing import MapboxRoutingPro
    MAPBOX_AVAILABLE = True
except ImportError:
    MapboxRoutingPro = None
    MAPBOX_AVAILABLE = False
import json
import logging

logger = logging.getLogger(__name__)

@dataclass
class GhanaTransportContext:
    """Context for Ghana-specific transport patterns"""
    is_market_day: bool = False
    is_prayer_time: bool = False
    is_rush_hour: bool = False
    weather_condition: str = "clear"
    fuel_price_ghs: float = 14.34
    traffic_density: float = 0.7
    holiday_factor: float = 1.0

class AccraRouteSimulator:
    """Simulates realistic vehicle movement on Accra routes using Mapbox routing"""

    def __init__(self):
        # Initialize Mapbox routing if available
        mapbox_token = os.getenv('MAPBOX_ACCESS_TOKEN')
        self.mapbox_router = None
        if MAPBOX_AVAILABLE and mapbox_token and MapboxRoutingPro:
            try:
                self.mapbox_router = MapboxRoutingPro(mapbox_token)
            except Exception as e:
                print(f"⚠️ Failed to initialize Mapbox routing: {e}")
                self.mapbox_router = None

        # Route definitions with start/end points for Mapbox routing
        self.routes = {
            "Circle to Madina Express": {
                "waypoints": [
                    (5.5717, -0.2107),  # Circle
                    (5.5800, -0.1950),  # Intermediate
                    (5.5900, -0.1800),  # Intermediate
                    (5.6037, -0.1870),  # 37 Station
                    (5.6200, -0.1700),  # Intermediate
                    (5.6493, -0.1847),  # Legon
                    (5.6836, -0.1636),  # Madina
                ],
                "base_speed": 25,
                "distance_km": 12.5,
                "typical_passengers": 15
            },
            "Kaneshie to Tema Station": {
                "waypoints": [
                    (5.5564, -0.2367),  # Kaneshie
                    (5.5650, -0.2200),  # Intermediate
                    (5.5717, -0.2107),  # Circle
                    (5.5800, -0.1900),  # Intermediate
                    (5.5558, -0.1738),  # Osu
                    (5.6197, -0.1597),  # Tema Station
                ],
                "base_speed": 22,
                "distance_km": 15.2,
                "typical_passengers": 18
            },
            "Lapaz to Achimota": {
                "waypoints": [
                    (5.5400, -0.2600),  # Lapaz
                    (5.5500, -0.2400),  # Santa Maria
                    (5.5700, -0.2300),  # Intermediate
                    (5.6000, -0.2200),  # Achimota
                ],
                "base_speed": 20,
                "distance_km": 8.8,
                "typical_passengers": 12
            }
        }
        
        self.vehicle_positions = {}
        self.vehicle_progress = {}  # Track progress along route (0.0 to 1.0)

        # Initialize Mapbox routes for road-following
        self._initialize_mapbox_routes()

    def _initialize_mapbox_routes(self):
        """Initialize Mapbox route geometries for road-following"""
        if not self.mapbox_router:
            print("⚠️ Mapbox router not available, using fallback waypoint interpolation")
            return

        print("🗺️ Initializing Mapbox routes for road-following...")

        for route_name, route_data in self.routes.items():
            try:
                # Get start and end points from waypoints
                waypoints = route_data["waypoints"]
                start_point = (waypoints[0][1], waypoints[0][0])  # Convert to (lng, lat)
                end_point = (waypoints[-1][1], waypoints[-1][0])

                # Get Mapbox route
                mapbox_route = self.mapbox_router.get_professional_route(start_point, end_point)

                if mapbox_route.get('routes'):
                    geometry = mapbox_route['routes'][0]['geometry']
                    coordinates = geometry['coordinates']

                    # Store route geometry for interpolation
                    route_data['mapbox_geometry'] = coordinates
                    route_data['total_distance'] = mapbox_route['routes'][0]['distance']

                    print(f"✅ Loaded Mapbox route for {route_name}: {len(coordinates)} points")
                else:
                    print(f"⚠️ Failed to get Mapbox route for {route_name}, using waypoints")
                    route_data['mapbox_geometry'] = None

            except Exception as e:
                print(f"❌ Error loading Mapbox route for {route_name}: {e}")
                route_data['mapbox_geometry'] = None

    def initialize_vehicle(self, vehicle_id: str, route_name: str):
        """Initialize a vehicle on a route"""
        if route_name in self.routes:
            self.vehicle_positions[vehicle_id] = {
                "route": route_name,
                "progress": random.random(),  # Random starting position
                "direction": 1,  # 1 for forward, -1 for backward
                "last_update": datetime.now()
            }
    
    def update_vehicle_position(self, vehicle_id: str, context: GhanaTransportContext) -> Tuple[Optional[float], Optional[float], float]:
        """Update vehicle position and return (lat, lng, speed)"""
        if vehicle_id not in self.vehicle_positions:
            return None, None, 0.0
        
        vehicle = self.vehicle_positions[vehicle_id]
        route = self.routes[vehicle["route"]]
        
        # Calculate speed based on context
        base_speed = route["base_speed"]
        speed_factor = self._calculate_speed_factor(context, vehicle["route"])
        current_speed = base_speed * speed_factor
        
        # Update progress (simulate movement)
        time_delta = (datetime.now() - vehicle["last_update"]).total_seconds()
        distance_per_second = (current_speed * 1000) / 3600  # Convert km/h to m/s
        route_distance_m = route["distance_km"] * 1000
        progress_delta = (distance_per_second * time_delta) / route_distance_m
        
        # Update progress
        vehicle["progress"] += progress_delta * vehicle["direction"]
        
        # Handle route endpoints (turn around)
        if vehicle["progress"] >= 1.0:
            vehicle["progress"] = 1.0
            vehicle["direction"] = -1
        elif vehicle["progress"] <= 0.0:
            vehicle["progress"] = 0.0
            vehicle["direction"] = 1
        
        # Interpolate position along route (using Mapbox geometry if available)
        lat, lng = self._interpolate_position(route, vehicle["progress"])
        
        vehicle["last_update"] = datetime.now()
        
        return lat, lng, current_speed
    
    def _calculate_speed_factor(self, context: GhanaTransportContext, route_name: str) -> float:
        """Calculate speed factor based on Ghana-specific conditions"""
        factor = 1.0
        
        # Weather impact
        if context.weather_condition == "heavy_rain":
            factor *= 0.4  # 60% speed reduction
        elif context.weather_condition == "light_rain":
            factor *= 0.7  # 30% speed reduction
        
        # Rush hour impact
        if context.is_rush_hour:
            factor *= 0.6  # 40% speed reduction
        
        # Market day impact (especially for Kaneshie routes)
        if context.is_market_day and "Kaneshie" in route_name:
            factor *= 0.5  # 50% speed reduction
        
        # Prayer time impact (slight reduction)
        if context.is_prayer_time:
            factor *= 0.9  # 10% speed reduction
        
        # Traffic density
        factor *= (1.0 - context.traffic_density * 0.3)
        
        # Random variation (±10%)
        factor *= random.uniform(0.9, 1.1)
        
        return max(0.1, factor)  # Minimum 10% of base speed
    
    def _interpolate_position(self, route_data: Dict, progress: float) -> Tuple[float, float]:
        """Interpolate position along route based on progress (0.0 to 1.0)"""
        # Use Mapbox geometry if available for road-following
        if route_data.get('mapbox_geometry'):
            return self._interpolate_along_mapbox_route(route_data['mapbox_geometry'], progress)
        else:
            # Fallback to waypoint interpolation
            return self._interpolate_along_waypoints(route_data['waypoints'], progress)

    def _interpolate_along_mapbox_route(self, coordinates: List[List[float]], progress: float) -> Tuple[float, float]:
        """Interpolate position along Mapbox route geometry"""
        if progress <= 0:
            return coordinates[0][1], coordinates[0][0]  # Convert lng,lat to lat,lng
        if progress >= 1:
            return coordinates[-1][1], coordinates[-1][0]

        # Find position along the route
        total_points = len(coordinates)
        point_index = progress * (total_points - 1)

        # Get the two points to interpolate between
        index = int(point_index)
        if index >= total_points - 1:
            return coordinates[-1][1], coordinates[-1][0]

        # Interpolate between the two points
        t = point_index - index
        start_coord = coordinates[index]
        end_coord = coordinates[index + 1]

        lng = start_coord[0] + (end_coord[0] - start_coord[0]) * t
        lat = start_coord[1] + (end_coord[1] - start_coord[1]) * t

        return lat, lng

    def _interpolate_along_waypoints(self, waypoints: List[Tuple[float, float]], progress: float) -> Tuple[float, float]:
        """Fallback interpolation along waypoints (straight lines)"""
        if progress <= 0:
            return waypoints[0]
        if progress >= 1:
            return waypoints[-1]

        # Find which segment we're on
        segment_length = 1.0 / (len(waypoints) - 1)
        segment_index = int(progress / segment_length)
        segment_progress = (progress % segment_length) / segment_length

        # Handle edge case
        if segment_index >= len(waypoints) - 1:
            return waypoints[-1]

        # Interpolate between waypoints
        start_point = waypoints[segment_index]
        end_point = waypoints[segment_index + 1]

        lat = start_point[0] + (end_point[0] - start_point[0]) * segment_progress
        lng = start_point[1] + (end_point[1] - start_point[1]) * segment_progress

        return lat, lng

class GhanaKPICalculator:
    """Calculates realistic KPIs based on Ghana transport economics"""
    
    def __init__(self):
        self.base_kpis = {
            "network_efficiency": 85.0,
            "driver_profitability": 12.0,
            "service_equity": 75.0,
            "co2_reduction": 20.0,
            "passenger_satisfaction": 4.0,
            "fuel_efficiency": 8.5,
            "route_coverage": 92.0,
            "revenue_per_km": 2.40
        }
        
        self.kpi_history = {kpi: [] for kpi in self.base_kpis}
    
    def calculate_realtime_kpis(self, context: GhanaTransportContext, vehicle_count: int, active_routes: int) -> Dict[str, float]:
        """Calculate real-time KPIs based on current context"""
        kpis = {}
        
        # Network Efficiency
        efficiency_factor = 1.0
        if context.is_rush_hour:
            efficiency_factor *= 0.85
        if context.weather_condition == "heavy_rain":
            efficiency_factor *= 0.70
        if context.is_market_day:
            efficiency_factor *= 0.90
        
        kpis["network_efficiency"] = self.base_kpis["network_efficiency"] * efficiency_factor
        
        # Driver Profitability (affected by fuel prices and demand)
        profitability_factor = 1.0
        if context.fuel_price_ghs > 15.0:
            profitability_factor *= 0.90
        if context.is_market_day:
            profitability_factor *= 1.15  # Higher demand
        if context.is_rush_hour:
            profitability_factor *= 1.10  # Higher fares
        
        kpis["driver_profitability"] = self.base_kpis["driver_profitability"] * profitability_factor
        
        # Service Equity (coverage and accessibility)
        equity_factor = 1.0
        if active_routes < 3:
            equity_factor *= 0.80
        if context.weather_condition == "heavy_rain":
            equity_factor *= 0.85  # Some areas become inaccessible
        
        kpis["service_equity"] = self.base_kpis["service_equity"] * equity_factor
        
        # CO2 Reduction (better with more efficient routes)
        co2_factor = 1.0
        if vehicle_count > 6:
            co2_factor *= 1.10  # More vehicles = better optimization potential
        if context.traffic_density > 0.8:
            co2_factor *= 0.90  # High traffic = more emissions
        
        kpis["co2_reduction"] = self.base_kpis["co2_reduction"] * co2_factor
        
        # Passenger Satisfaction
        satisfaction_factor = 1.0
        if context.weather_condition == "heavy_rain":
            satisfaction_factor *= 0.85
        if context.is_rush_hour:
            satisfaction_factor *= 0.90
        if context.is_market_day:
            satisfaction_factor *= 0.95  # Crowded but expected
        
        kpis["passenger_satisfaction"] = self.base_kpis["passenger_satisfaction"] * satisfaction_factor
        
        # Fuel Efficiency
        fuel_factor = 1.0
        if context.traffic_density > 0.7:
            fuel_factor *= 0.85  # Stop-and-go traffic
        if context.weather_condition in ["light_rain", "heavy_rain"]:
            fuel_factor *= 0.90  # AC usage, slower speeds
        
        kpis["fuel_efficiency"] = self.base_kpis["fuel_efficiency"] * fuel_factor
        
        # Route Coverage
        coverage_factor = 1.0
        if context.weather_condition == "heavy_rain":
            coverage_factor *= 0.90  # Some routes suspended
        if context.holiday_factor < 1.0:
            coverage_factor *= 0.85  # Reduced service on holidays
        
        kpis["route_coverage"] = self.base_kpis["route_coverage"] * coverage_factor
        
        # Revenue per KM
        revenue_factor = 1.0
        if context.is_rush_hour:
            revenue_factor *= 1.20  # Surge pricing
        if context.is_market_day:
            revenue_factor *= 1.15  # Higher demand
        if context.fuel_price_ghs > 15.0:
            revenue_factor *= 1.05  # Price adjustment
        
        kpis["revenue_per_km"] = self.base_kpis["revenue_per_km"] * revenue_factor
        
        # Add some random variation (±2%)
        for kpi in kpis:
            kpis[kpi] *= random.uniform(0.98, 1.02)
            kpis[kpi] = round(kpis[kpi], 2)
        
        # Store history for trend calculation
        for kpi, value in kpis.items():
            self.kpi_history[kpi].append(value)
            if len(self.kpi_history[kpi]) > 10:  # Keep last 10 values
                self.kpi_history[kpi].pop(0)
        
        return kpis
    
    def get_kpi_trends(self) -> Dict[str, str]:
        """Calculate trends for each KPI"""
        trends = {}
        
        for kpi, history in self.kpi_history.items():
            if len(history) < 2:
                trends[kpi] = "neutral"
            else:
                recent_avg = sum(history[-3:]) / len(history[-3:])
                older_avg = sum(history[-6:-3]) / len(history[-6:-3]) if len(history) >= 6 else history[0]
                
                if recent_avg > older_avg * 1.01:
                    trends[kpi] = "up"
                elif recent_avg < older_avg * 0.99:
                    trends[kpi] = "down"
                else:
                    trends[kpi] = "neutral"
        
        return trends

class GhanaContextAnalyzer:
    """Analyzes current Ghana-specific context"""
    
    def __init__(self):
        self.last_weather_check = datetime.now() - timedelta(hours=1)
        self.current_weather = "clear"
    
    def get_current_context(self) -> GhanaTransportContext:
        """Get current Ghana transport context"""
        now = datetime.now()
        
        context = GhanaTransportContext()
        
        # Market day detection (Wednesday and Saturday)
        context.is_market_day = now.weekday() in [2, 5]  # Wednesday, Saturday
        
        # Prayer time detection (Friday 12-2 PM)
        context.is_prayer_time = (now.weekday() == 4 and 12 <= now.hour <= 14)
        
        # Rush hour detection
        context.is_rush_hour = (7 <= now.hour <= 9) or (17 <= now.hour <= 19)
        
        # Weather simulation
        context.weather_condition = self._simulate_weather()
        
        # Fuel price (with small fluctuations)
        context.fuel_price_ghs = 14.34 + random.uniform(-0.50, 0.50)
        
        # Traffic density based on time of day
        if context.is_rush_hour:
            context.traffic_density = random.uniform(0.8, 1.0)
        elif 10 <= now.hour <= 16:
            context.traffic_density = random.uniform(0.5, 0.7)
        else:
            context.traffic_density = random.uniform(0.2, 0.5)
        
        # Holiday factor (simplified)
        context.holiday_factor = 0.7 if now.weekday() == 6 else 1.0  # Sunday
        
        return context
    
    def _simulate_weather(self) -> str:
        """Simulate Ghana weather patterns"""
        now = datetime.now()
        
        # Rainy season probability (April-July, September-November)
        if now.month in [4, 5, 6, 7, 9, 10, 11]:
            rain_prob = 0.3
        else:
            rain_prob = 0.1
        
        # Higher rain probability in afternoon/evening
        if 14 <= now.hour <= 18:
            rain_prob *= 1.5
        
        rand = random.random()
        if rand < rain_prob * 0.3:
            return "heavy_rain"
        elif rand < rain_prob:
            return "light_rain"
        else:
            return "clear"

class PassengerDemandSimulator:
    """Simulates realistic passenger demand patterns"""
    
    def __init__(self):
        self.base_demand = {
            "Circle to Madina Express": 15,
            "Kaneshie to Tema Station": 18,
            "Lapaz to Achimota": 12
        }
    
    def calculate_passenger_demand(self, route_name: str, context: GhanaTransportContext) -> int:
        """Calculate current passenger demand for a route"""
        base = self.base_demand.get(route_name, 15)
        
        # Time-based demand
        hour = datetime.now().hour
        if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
            demand_factor = 1.5
        elif 10 <= hour <= 16:  # Day time
            demand_factor = 1.0
        elif 19 <= hour <= 22:  # Evening
            demand_factor = 1.2
        else:  # Night/early morning
            demand_factor = 0.3
        
        # Context-based adjustments
        if context.is_market_day and "Kaneshie" in route_name:
            demand_factor *= 1.4
        
        if context.weather_condition == "heavy_rain":
            demand_factor *= 1.3  # More people use transport
        
        if context.is_prayer_time:
            demand_factor *= 0.8
        
        # Random variation
        demand_factor *= random.uniform(0.8, 1.2)
        
        final_demand = int(base * demand_factor)
        return max(1, min(final_demand, 25))  # Cap between 1-25

# Main data generator class
class RealtimeDataGenerator:
    """Main class that orchestrates all real-time data generation"""
    
    def __init__(self):
        self.route_simulator = AccraRouteSimulator()
        self.kpi_calculator = GhanaKPICalculator()
        self.context_analyzer = GhanaContextAnalyzer()
        self.demand_simulator = PassengerDemandSimulator()
        
        # Initialize vehicles - match WebSocket server count (20 vehicles)
        self.vehicles = [f"TT-{i:03d}" for i in range(1, 21)]  # TT-001 to TT-020

        # Distribute vehicles across routes
        route_names = [
            "Circle to Madina Express",
            "Kaneshie to Tema Station",
            "Lapaz to Achimota",
            "37 Station to New Town Station",
            "Abeka lapaz to Race Course",
            "C to Kaneshie Mamprobi Station"
        ]

        self.vehicle_routes = {}
        for i, vehicle_id in enumerate(self.vehicles):
            route_name = route_names[i % len(route_names)]
            self.vehicle_routes[vehicle_id] = route_name
        
        # Initialize all vehicles
        for vehicle_id, route_name in self.vehicle_routes.items():
            self.route_simulator.initialize_vehicle(vehicle_id, route_name)
    
    def generate_vehicle_updates(self) -> List[Dict]:
        """Generate real-time vehicle updates"""
        context = self.context_analyzer.get_current_context()
        updates = []
        
        for vehicle_id, route_name in self.vehicle_routes.items():
            lat, lng, speed = self.route_simulator.update_vehicle_position(vehicle_id, context)
            
            if lat is not None and lng is not None:
                passengers = self.demand_simulator.calculate_passenger_demand(route_name, context)
                
                # Determine status
                status = "active" if speed > 5 else "idle"
                if context.weather_condition == "heavy_rain" and random.random() < 0.2:
                    status = "disrupted"
                
                updates.append({
                    "id": vehicle_id,
                    "route": route_name,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "speed": round(speed, 1),
                    "passengers": min(passengers, 20),  # Max capacity 20
                    "capacity": 20,
                    "status": status,
                    "lastUpdate": datetime.now().isoformat()
                })
        
        return updates
    
    def generate_kpi_updates(self) -> List[Dict]:
        """Generate real-time KPI updates"""
        context = self.context_analyzer.get_current_context()
        # Use actual vehicle count (20 vehicles, ~90% active)
        active_vehicles = len([v for v in self.vehicles if random.random() > 0.1])  # ~18 active vehicles
        active_routes = 6  # Match the number of route types we have

        kpi_values = self.kpi_calculator.calculate_realtime_kpis(context, active_vehicles, active_routes)
        trends = self.kpi_calculator.get_kpi_trends()
        
        kpi_updates = []
        kpi_mapping = {
            "network_efficiency": ("Network Efficiency", "%", "efficiency"),
            "driver_profitability": ("Driver Profitability", "%", "financial"),
            "service_equity": ("Service Equity", "Score", "social"),
            "co2_reduction": ("CO₂ Reduction", "tonnes/week", "environmental"),
            "passenger_satisfaction": ("Passenger Satisfaction", "/5", "social"),
            "fuel_efficiency": ("Fuel Efficiency", "km/L", "environmental"),
            "route_coverage": ("Route Coverage", "%", "efficiency"),
            "revenue_per_km": ("Revenue per KM", "GH₵", "financial")
        }
        
        for kpi_id, (name, unit, category) in kpi_mapping.items():
            value = kpi_values.get(kpi_id, 0)
            trend = trends.get(kpi_id, "neutral")
            
            # Calculate change from previous value
            history = self.kpi_calculator.kpi_history.get(kpi_id, [])
            change = 0
            if len(history) >= 2:
                change = history[-1] - history[-2]
            
            kpi_updates.append({
                "id": kpi_id,
                "name": name,
                "value": value,
                "change": round(change, 2),
                "trend": trend,
                "unit": unit,
                "category": category
            })
        
        return kpi_updates
    
    def generate_context_alerts(self) -> List[Dict]:
        """Generate context-based alerts"""
        context = self.context_analyzer.get_current_context()
        alerts = []
        
        # Weather alerts
        if context.weather_condition == "heavy_rain":
            alerts.append({
                "type": "warning",
                "title": "Heavy Rain Alert",
                "message": "Heavy rainfall detected in Accra. Expect traffic delays and potential flooding in low-lying areas.",
                "timestamp": datetime.now().isoformat(),
                "read": False
            })
        
        # Market day alerts
        if context.is_market_day:
            alerts.append({
                "type": "info", 
                "title": "Market Day Notice",
                "message": "Today is a major market day. Increased passenger demand expected, especially on Kaneshie routes.",
                "timestamp": datetime.now().isoformat(),
                "read": False
            })
        
        # Rush hour alerts
        if context.is_rush_hour:
            alerts.append({
                "type": "info",
                "title": "Rush Hour Active",
                "message": "Peak travel time detected. Dynamic pricing and route optimization activated.",
                "timestamp": datetime.now().isoformat(),
                "read": False
            })
        
        # Fuel price alerts
        if context.fuel_price_ghs > 15.0:
            alerts.append({
                "type": "warning",
                "title": "Fuel Price Alert",
                "message": f"Fuel price increased to GH₵{context.fuel_price_ghs:.2f}/L. Route profitability may be affected.",
                "timestamp": datetime.now().isoformat(),
                "read": False
            })
        
        return alerts

# Singleton instance
_generator_instance = None

def get_data_generator() -> RealtimeDataGenerator:
    """Get singleton instance of data generator"""
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = RealtimeDataGenerator()
    return _generator_instance

if __name__ == "__main__":
    # Test the data generator
    generator = get_data_generator()
    
    print("=== Testing Real-time Data Generator ===")
    
    # Test vehicle updates
    print("\n--- Vehicle Updates ---")
    vehicle_updates = generator.generate_vehicle_updates()
    for update in vehicle_updates[:2]:  # Show first 2
        print(json.dumps(update, indent=2))
    
    # Test KPI updates
    print("\n--- KPI Updates ---")
    kpi_updates = generator.generate_kpi_updates()
    for update in kpi_updates[:3]:  # Show first 3
        print(json.dumps(update, indent=2))
    
    # Test context alerts
    print("\n--- Context Alerts ---")
    alerts = generator.generate_context_alerts()
    for alert in alerts:
        print(json.dumps(alert, indent=2))
