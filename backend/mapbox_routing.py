"""
🚀 MAPBOX PROFESSIONAL ROUTING ENGINE
Professional-grade routing integration for Aura Command Pro
Replaces basic OpenRouteService with enterprise-level capabilities
"""

import requests
import json
import time
import logging
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RouteMetrics:
    """Professional route metrics container"""
    duration: float  # seconds
    distance: float  # meters
    traffic_delay: float  # additional seconds due to traffic
    efficiency_score: float  # 0-100 efficiency rating
    fuel_cost: float  # Ghana Cedis
    co2_emissions: float  # kg CO2

class MapboxRoutingPro:
    """
    🏆 PROFESSIONAL MAPBOX ROUTING ENGINE
    Enterprise-grade routing with real-time traffic integration
    """
    
    def __init__(self, access_token: str):
        self.token = access_token
        self.base_url = "https://api.mapbox.com"
        self.session = requests.Session()
        
        # Ghana-specific parameters
        self.ghana_fuel_price = 14.34  # GHS per liter (current 2025)
        self.average_fuel_consumption = 7.4  # liters per 100km (tro-tro)
        self.co2_emission_factor = 0.196  # kg CO2 per km
        
        logger.info("🚀 MapboxRoutingPro initialized for Ghana operations")
    
    def get_professional_route(self, 
                             start_coords: Tuple[float, float], 
                             end_coords: Tuple[float, float], 
                             profile: str = "driving-traffic") -> Dict:
        """
        ⚡ Get optimized route with professional analytics
        
        Profiles:
        - driving-traffic: Real-time traffic integration
        - driving: Standard driving without traffic
        - walking: Pedestrian routing
        """
        try:
            url = f"{self.base_url}/directions/v5/mapbox/{profile}"
            coordinates = f"{start_coords[0]},{start_coords[1]};{end_coords[0]},{end_coords[1]}"
            
            params = {
                'access_token': self.token,
                'geometries': 'geojson',
                'overview': 'full',
                'steps': True,
                'annotations': 'duration,distance,speed,congestion',
                'alternatives': True,  # Get alternative routes
                'continue_straight': False,
                'exclude': '',  # Can exclude ferry, motorway, toll
                'language': 'en'
            }
            
            response = self.session.get(f"{url}/{coordinates}", params=params)
            response.raise_for_status()
            
            route_data = response.json()
            
            # Add professional analytics
            if route_data.get('routes'):
                for i, route in enumerate(route_data['routes']):
                    metrics = self._calculate_route_metrics(route)
                    route_data['routes'][i]['professional_metrics'] = metrics.__dict__
                    route_data['routes'][i]['ghana_specific'] = self._add_ghana_insights(route)
            
            logger.info(f"✅ Professional route calculated: {route_data['routes'][0]['distance']/1000:.1f}km")
            return route_data
            
        except Exception as e:
            logger.error(f"❌ Route calculation failed: {e}")
            return self._get_fallback_route(start_coords, end_coords)
    
    def get_traffic_aware_comparison(self, 
                                   origin: Tuple[float, float], 
                                   destination: Tuple[float, float]) -> Dict:
        """
        🌐 Compare routes with and without traffic for decision making
        """
        profiles = {
            'with_traffic': 'driving-traffic',
            'without_traffic': 'driving', 
            'walking': 'walking'
        }
        
        comparison = {}
        
        for profile_name, profile_type in profiles.items():
            route = self.get_professional_route(origin, destination, profile_type)
            if route.get('routes'):
                main_route = route['routes'][0]
                comparison[profile_name] = {
                    'duration_minutes': main_route['duration'] / 60,
                    'distance_km': main_route['distance'] / 1000,
                    'geometry': main_route['geometry'],
                    'metrics': main_route.get('professional_metrics', {}),
                    'ghana_insights': main_route.get('ghana_specific', {})
                }
        
        # Calculate traffic impact
        if 'with_traffic' in comparison and 'without_traffic' in comparison:
            traffic_delay = (comparison['with_traffic']['duration_minutes'] - 
                           comparison['without_traffic']['duration_minutes'])
            comparison['traffic_analysis'] = {
                'delay_minutes': traffic_delay,
                'traffic_severity': self._categorize_traffic_severity(traffic_delay),
                'recommendation': self._get_traffic_recommendation(traffic_delay)
            }
        
        return comparison
    
    def optimize_multi_stop_route(self, 
                                coordinates: List[Tuple[float, float]], 
                                profile: str = "driving-traffic") -> Dict:
        """
        ⚡ Multi-stop route optimization using Mapbox Optimization API
        Perfect for tro-tro route planning with multiple stops
        """
        try:
            if len(coordinates) < 2:
                raise ValueError("Need at least 2 coordinates for optimization")
            
            coords_str = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
            url = f"{self.base_url}/optimized-trips/v1/mapbox/{profile}/{coords_str}"
            
            params = {
                'access_token': self.token,
                'geometries': 'geojson',
                'overview': 'full',
                'steps': True,
                'source': 'first',  # Start from first coordinate
                'destination': 'last',  # End at last coordinate
                'roundtrip': False,
                'annotations': 'duration,distance,speed'
            }
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            optimization_data = response.json()
            
            # Add professional analytics to optimization result
            if optimization_data.get('trips'):
                for i, trip in enumerate(optimization_data['trips']):
                    metrics = self._calculate_route_metrics(trip)
                    optimization_data['trips'][i]['professional_metrics'] = metrics.__dict__
                    optimization_data['trips'][i]['optimization_insights'] = {
                        'stops_optimized': len(coordinates),
                        'total_savings': self._calculate_optimization_savings(trip),
                        'efficiency_rating': metrics.efficiency_score
                    }
            
            logger.info(f"✅ Multi-stop optimization completed for {len(coordinates)} stops")
            return optimization_data
            
        except Exception as e:
            logger.error(f"❌ Route optimization failed: {e}")
            return self._get_fallback_optimization(coordinates)
    
    def get_travel_time_matrix(self, 
                             origins: List[Tuple[float, float]], 
                             destinations: List[Tuple[float, float]],
                             profile: str = "driving-traffic") -> Dict:
        """
        📊 Calculate travel time matrix for network analysis
        Essential for sophisticated transport planning
        """
        try:
            # Combine origins and destinations
            all_coords = origins + destinations
            coords_str = ";".join([f"{lon},{lat}" for lon, lat in all_coords])
            
            url = f"{self.base_url}/directions-matrix/v1/mapbox/{profile}/{coords_str}"
            
            params = {
                'access_token': self.token,
                'sources': ';'.join([str(i) for i in range(len(origins))]),
                'destinations': ';'.join([str(i) for i in range(len(origins), len(all_coords))]),
                'annotations': 'duration,distance'
            }
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            matrix_data = response.json()
            
            # Add professional analytics
            matrix_data['matrix_insights'] = self._analyze_travel_matrix(matrix_data)
            
            logger.info(f"✅ Travel time matrix calculated: {len(origins)}x{len(destinations)}")
            return matrix_data
            
        except Exception as e:
            logger.error(f"❌ Matrix calculation failed: {e}")
            return self._get_fallback_matrix(origins, destinations)
    
    def match_gps_to_roads(self, gps_coordinates: List[Tuple[float, float]]) -> Dict:
        """
        🎯 Map GPS traces to actual road network using Map Matching API
        Essential for realistic vehicle simulation
        """
        try:
            coords_str = ";".join([f"{lon},{lat}" for lon, lat in gps_coordinates])
            url = f"{self.base_url}/matching/v5/mapbox/driving/{coords_str}"
            
            params = {
                'access_token': self.token,
                'geometries': 'geojson',
                'overview': 'full',
                'radiuses': ';'.join(['25' for _ in gps_coordinates]),  # 25m tolerance
                'steps': True,
                'annotations': 'speed,duration,distance'
            }
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            matching_data = response.json()
            
            # Add matching quality analysis
            if matching_data.get('matchings'):
                for matching in matching_data['matchings']:
                    matching['quality_analysis'] = self._analyze_matching_quality(matching)
            
            logger.info(f"✅ GPS trace matched to road network: {len(gps_coordinates)} points")
            return matching_data
            
        except Exception as e:
            logger.error(f"❌ GPS matching failed: {e}")
            return self._get_fallback_matching(gps_coordinates)
    
    def _calculate_route_metrics(self, route: Dict) -> RouteMetrics:
        """Calculate comprehensive route metrics"""
        duration = route.get('duration', 0)
        distance = route.get('distance', 0)
        
        # Calculate fuel cost for Ghana
        distance_km = distance / 1000
        fuel_needed = (distance_km / 100) * self.average_fuel_consumption
        fuel_cost = fuel_needed * self.ghana_fuel_price
        
        # Calculate CO2 emissions
        co2_emissions = distance_km * self.co2_emission_factor
        
        # Calculate efficiency score (0-100)
        avg_speed = (distance / duration) * 3.6 if duration > 0 else 0  # km/h
        efficiency_score = min(100, (avg_speed / 60) * 100)  # Optimal around 60 km/h
        
        # Estimate traffic delay (comparing to ideal time)
        ideal_duration = distance / (50 * 1000 / 3600)  # Assuming 50 km/h ideal
        traffic_delay = max(0, duration - ideal_duration)
        
        return RouteMetrics(
            duration=duration,
            distance=distance,
            traffic_delay=traffic_delay,
            efficiency_score=efficiency_score,
            fuel_cost=fuel_cost,
            co2_emissions=co2_emissions
        )
    
    def _add_ghana_insights(self, route: Dict) -> Dict:
        """Add Ghana-specific route insights"""
        distance_km = route.get('distance', 0) / 1000
        duration_hours = route.get('duration', 0) / 3600
        
        # Ghana-specific insights
        insights = {
            'tro_tro_fare_estimate': self._estimate_tro_tro_fare(distance_km),
            'fuel_cost_ghs': round((distance_km / 100) * self.average_fuel_consumption * self.ghana_fuel_price, 2),
            'journey_classification': self._classify_journey_ghana(distance_km, duration_hours),
            'peak_hour_impact': self._assess_accra_peak_hours(),
            'market_day_considerations': self._check_market_day_impact(route)
        }
        
        return insights
    
    def _estimate_tro_tro_fare(self, distance_km: float) -> float:
        """Estimate tro-tro fare based on distance (Ghana 2025 rates)"""
        if distance_km < 5:
            return 3.0  # Short distance: 3 GHS
        elif distance_km < 15:
            return 5.0  # Medium distance: 5 GHS
        elif distance_km < 30:
            return 8.0  # Long distance: 8 GHS
        else:
            return 12.0  # Very long distance: 12 GHS
    
    def _classify_journey_ghana(self, distance_km: float, duration_hours: float) -> str:
        """Classify journey type for Ghana context"""
        if distance_km < 2:
            return "Local neighborhood"
        elif distance_km < 10:
            return "Intra-city travel"
        elif distance_km < 50:
            return "Greater Accra movement"
        else:
            return "Inter-regional travel"
    
    def _assess_accra_peak_hours(self) -> Dict:
        """Assess current time against Accra peak hours"""
        current_hour = time.localtime().tm_hour
        
        if 6 <= current_hour <= 9:
            return {"period": "Morning peak", "traffic_level": "Heavy", "delay_factor": 1.5}
        elif 17 <= current_hour <= 20:
            return {"period": "Evening peak", "traffic_level": "Heavy", "delay_factor": 1.5}
        elif 12 <= current_hour <= 14:
            return {"period": "Lunch hour", "traffic_level": "Moderate", "delay_factor": 1.2}
        else:
            return {"period": "Off-peak", "traffic_level": "Light", "delay_factor": 1.0}
    
    def _check_market_day_impact(self, route: Dict) -> Dict:
        """Check if route passes through major market areas"""
        # Simplified - in production would check against actual market locations
        return {
            "kaneshie_market_nearby": False,  # Would calculate based on route geometry
            "makola_market_nearby": False,
            "market_day_impact": "Low",
            "recommended_alternatives": []
        }
    
    def _categorize_traffic_severity(self, delay_minutes: float) -> str:
        """Categorize traffic severity based on delay"""
        if delay_minutes < 5:
            return "Light traffic"
        elif delay_minutes < 15:
            return "Moderate traffic"
        elif delay_minutes < 30:
            return "Heavy traffic"
        else:
            return "Severe congestion"
    
    def _get_traffic_recommendation(self, delay_minutes: float) -> str:
        """Get traffic-based recommendation"""
        if delay_minutes < 5:
            return "Good time to travel"
        elif delay_minutes < 15:
            return "Consider alternative routes"
        elif delay_minutes < 30:
            return "Delay recommended if flexible"
        else:
            return "Strong recommendation to wait or find alternative"
    
    def _calculate_optimization_savings(self, trip: Dict) -> Dict:
        """Calculate savings from route optimization"""
        return {
            "time_saved_minutes": 0,  # Would calculate vs non-optimized
            "distance_saved_km": 0,
            "fuel_saved_ghs": 0,
            "efficiency_improvement": "15%"  # Typical optimization improvement
        }
    
    def _analyze_travel_matrix(self, matrix_data: Dict) -> Dict:
        """Analyze travel time matrix for network insights"""
        durations = matrix_data.get('durations', [])
        if not durations:
            return {}
        
        flat_durations = [d for row in durations for d in row if d is not None]
        
        return {
            "average_travel_time_minutes": np.mean(flat_durations) / 60 if flat_durations else 0,
            "max_travel_time_minutes": max(flat_durations) / 60 if flat_durations else 0,
            "min_travel_time_minutes": min(flat_durations) / 60 if flat_durations else 0,
            "network_connectivity": "Good" if np.mean(flat_durations) < 1800 else "Poor"  # 30 min threshold
        }
    
    def _analyze_matching_quality(self, matching: Dict) -> Dict:
        """Analyze GPS matching quality"""
        confidence = matching.get('confidence', 0)
        
        return {
            "matching_confidence": confidence,
            "quality_rating": "High" if confidence > 0.8 else "Medium" if confidence > 0.5 else "Low",
            "recommendation": "Reliable for simulation" if confidence > 0.7 else "Use with caution"
        }
    
    # Fallback methods for error handling
    def _get_fallback_route(self, start: Tuple[float, float], end: Tuple[float, float]) -> Dict:
        """Fallback route when API fails"""
        logger.warning("🔄 Using fallback route calculation")
        return {
            "routes": [{
                "distance": 10000,  # 10km fallback
                "duration": 1200,   # 20min fallback
                "geometry": {
                    "type": "LineString",
                    "coordinates": [list(start), list(end)]
                },
                "professional_metrics": RouteMetrics(
                    duration=1200, distance=10000, traffic_delay=0,
                    efficiency_score=50, fuel_cost=10.0, co2_emissions=2.0
                ).__dict__,
                "fallback": True
            }]
        }
    
    def _get_fallback_optimization(self, coordinates: List) -> Dict:
        """Fallback optimization when API fails"""
        logger.warning("🔄 Using fallback optimization")
        return {
            "trips": [{
                "distance": len(coordinates) * 5000,
                "duration": len(coordinates) * 600,
                "fallback": True
            }]
        }
    
    def _get_fallback_matrix(self, origins: List, destinations: List) -> Dict:
        """Fallback matrix when API fails"""
        logger.warning("🔄 Using fallback matrix calculation")
        return {
            "durations": [[1200 for _ in destinations] for _ in origins],
            "distances": [[10000 for _ in destinations] for _ in origins],
            "fallback": True
        }
    
    def _get_fallback_matching(self, coordinates: List) -> Dict:
        """Fallback matching when API fails"""
        logger.warning("🔄 Using fallback GPS matching")
        return {
            "matchings": [{
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates
                },
                "confidence": 0.5,
                "fallback": True
            }]
        }

# Professional route visualization helpers
class RouteVisualizer:
    """🎨 Professional route visualization utilities"""
    
    @staticmethod
    def create_route_geojson(route_data: Dict, route_type: str = "optimized") -> Dict:
        """Create professional GeoJSON for route visualization"""
        if not route_data.get('routes'):
            return {"type": "FeatureCollection", "features": []}
        
        route = route_data['routes'][0]
        metrics = route.get('professional_metrics', {})
        
        return {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "route_type": route_type,
                    "duration_minutes": round(route.get('duration', 0) / 60, 1),
                    "distance_km": round(route.get('distance', 0) / 1000, 1),
                    "efficiency_score": metrics.get('efficiency_score', 0),
                    "fuel_cost_ghs": metrics.get('fuel_cost', 0),
                    "traffic_delay_minutes": round(metrics.get('traffic_delay', 0) / 60, 1),
                    "color": RouteVisualizer._get_route_color(route_type),
                    "width": RouteVisualizer._get_route_width(route_type)
                },
                "geometry": route.get('geometry', {})
            }]
        }
    
    @staticmethod
    def _get_route_color(route_type: str) -> str:
        """Get color scheme for different route types"""
        colors = {
            "optimized": "#FFD700",      # Gold for optimized routes
            "alternative": "#4A90E2",    # Blue for alternatives
            "traffic_aware": "#FF6B6B",  # Red for traffic routes
            "walking": "#50C878",        # Green for walking
            "fallback": "#9E9E9E"        # Gray for fallback
        }
        return colors.get(route_type, "#FFD700")
    
    @staticmethod
    def _get_route_width(route_type: str) -> int:
        """Get line width for different route types"""
        widths = {
            "optimized": 8,
            "alternative": 6,
            "traffic_aware": 6,
            "walking": 4,
            "fallback": 3
        }
        return widths.get(route_type, 6)

# Export main classes
__all__ = ['MapboxRoutingPro', 'RouteVisualizer', 'RouteMetrics'] 