#!/usr/bin/env python3
"""
🛡️ ROBUST API FALLBACK SYSTEM
Comprehensive fallback mechanisms for all external APIs
Ensures demo reliability with smart caching and graceful degradation
"""

import httpx
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List
import random
import hashlib
import os
from dataclasses import dataclass
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class APIStatus:
    """Track API health and response times"""
    name: str
    is_healthy: bool
    last_check: datetime
    response_time_ms: float
    failure_count: int
    last_error: Optional[str]

class SmartCache:
    """Intelligent caching system with TTL and invalidation"""
    
    def __init__(self, default_ttl: int = 300):
        self.cache = {}
        self.default_ttl = default_ttl
    
    def _generate_key(self, endpoint: str, params: Dict) -> str:
        """Generate cache key from endpoint and parameters"""
        key_data = f"{endpoint}_{json.dumps(params, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, endpoint: str, params: Dict) -> Optional[Any]:
        """Get cached response if valid"""
        key = self._generate_key(endpoint, params)
        
        if key in self.cache:
            data, timestamp, ttl = self.cache[key]
            if datetime.now() - timestamp < timedelta(seconds=ttl):
                logger.info(f"✅ Cache hit for {endpoint}")
                return data
            else:
                # Expired
                del self.cache[key]
        
        return None
    
    def set(self, endpoint: str, params: Dict, data: Any, ttl: Optional[int] = None) -> None:
        """Cache response with TTL"""
        key = self._generate_key(endpoint, params)
        ttl = ttl or self.default_ttl
        self.cache[key] = (data, datetime.now(), ttl)
        logger.info(f"💾 Cached response for {endpoint} (TTL: {ttl}s)")
    
    def clear(self) -> None:
        """Clear all cached data"""
        self.cache.clear()
        logger.info("🗑️ Cache cleared")

class RobustAPIManager:
    """
    🏆 ENTERPRISE-GRADE API MANAGER
    Handles all external APIs with intelligent fallbacks
    """
    
    def __init__(self):
        self.cache = SmartCache(default_ttl=300)
        self.api_status = {}
        self.max_retries = 3
        self.timeout = 10
        
        # Initialize API status tracking
        apis = [
            "carbon_interface", "openrouteservice", "public_holidays", 
            "openweather", "uber", "mapbox"
        ]
        
        for api in apis:
            self.api_status[api] = APIStatus(
                name=api,
                is_healthy=True,
                last_check=datetime.now(),
                response_time_ms=0.0,
                failure_count=0,
                last_error=None
            )
    
    async def _make_request(self, url: str, headers: Dict = None, params: Dict = None, 
                           json_data: Dict = None, method: str = "GET", timeout: int = None) -> Optional[Dict]:
        """Make HTTP request with timeout and error handling"""
        
        timeout = timeout or self.timeout
        start_time = datetime.now()
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                if method.upper() == "POST":
                    response = await client.post(url, headers=headers, params=params, json=json_data)
                else:
                    response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                
                # Calculate response time
                response_time = (datetime.now() - start_time).total_seconds() * 1000
                
                return {
                    "data": response.json(),
                    "response_time_ms": response_time,
                    "status_code": response.status_code
                }
                
        except Exception as e:
            logger.error(f"❌ API request failed: {e}")
            return None
    
    def _update_api_status(self, api_name: str, success: bool, 
                          response_time: float = 0, error: str = None):
        """Update API health status"""
        
        if api_name in self.api_status:
            status = self.api_status[api_name]
            status.last_check = datetime.now()
            status.response_time_ms = response_time
            
            if success:
                status.is_healthy = True
                status.failure_count = 0
                status.last_error = None
            else:
                status.failure_count += 1
                status.last_error = error
                
                # Mark as unhealthy after 3 failures
                if status.failure_count >= 3:
                    status.is_healthy = False
    
    # ===================================================================
    # 🌱 CARBON INTERFACE API (CO₂ Emissions)
    # ===================================================================
    
    async def calculate_co2_emissions_robust(self, distance_km: float) -> Dict:
        """Robust CO₂ emissions calculation with fallbacks"""
        
        endpoint = "carbon_interface"
        params = {"distance_km": distance_km}
        
        # Check cache first
        cached = self.cache.get(endpoint, params)
        if cached:
            return cached
        
        # Try real API if healthy
        if self.api_status["carbon_interface"].is_healthy:
            try:
                api_key = "r6Ozqh2Ia3Yyt2Dv5fjhA"  # Real API key working
                
                url = "https://www.carboninterface.com/api/v1/estimates"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "type": "vehicle",
                    "distance_unit": "km",
                    "distance_value": distance_km,
                    "vehicle_model_id": "7268a9b7-17e8-4c8d-acca-57059252afe9"  # Toyota Corolla 1993
                }
                
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, headers=headers, json=payload)
                    
                    if response.status_code == 201:
                        data = response.json()
                        
                        result = {
                            "distance_km": distance_km,
                            "carbon_kg": data["data"]["attributes"]["carbon_kg"],
                            "carbon_mt": data["data"]["attributes"]["carbon_mt"],
                            "api_source": "Carbon Interface API",
                            "timestamp": datetime.now().isoformat(),
                            "is_live_data": True
                        }
                        
                        self._update_api_status("carbon_interface", True, 
                                              response.elapsed.total_seconds() * 1000)
                        self.cache.set(endpoint, params, result, ttl=1800)  # 30 min cache
                        
                        logger.info(f"✅ Carbon Interface: {result['carbon_kg']:.3f} kg CO₂")
                        return result
                        
            except Exception as e:
                logger.error(f"❌ Carbon Interface API failed: {e}")
                self._update_api_status("carbon_interface", False, error=str(e))
        
        # Fallback calculation
        logger.info("🔄 Using fallback CO₂ calculation")
        
        # Realistic Ghana vehicle emissions: 196g CO₂/km for tro-tro
        carbon_kg = distance_km * 0.196
        carbon_mt = carbon_kg / 1000
        
        result = {
            "distance_km": distance_km,
            "carbon_kg": round(carbon_kg, 3),
            "carbon_mt": round(carbon_mt, 6),
            "api_source": "Local Estimation (Ghana Transport)",
            "timestamp": datetime.now().isoformat(),
            "is_live_data": False,
            "fallback_reason": "API unavailable - using Ghana vehicle emission factors"
        }
        
        self.cache.set(endpoint, params, result, ttl=600)  # 10 min cache for fallback
        return result
    
    # ===================================================================
    # 🗺️ OPENROUTESERVICE API (Isochrones)
    # ===================================================================
    
    async def get_isochrone_robust(self, latitude: float, longitude: float, 
                                  time_seconds: int = 1800) -> Dict:
        """Robust isochrone calculation with fallbacks"""
        
        endpoint = "openrouteservice"
        params = {"lat": latitude, "lon": longitude, "time": time_seconds}
        
        # Check cache first
        cached = self.cache.get(endpoint, params)
        if cached:
            return cached
        
        # Try real API if healthy
        if self.api_status["openrouteservice"].is_healthy:
            try:
                api_key = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImJjMWJlYWJhZGNkOTRlODJiMWI5NjI3YzhlYWRkMmJhIiwiaCI6Im11cm11cjY0In0="
                
                url = "https://api.openrouteservice.org/v2/isochrones/driving-car"
                headers = {
                    "Authorization": api_key,
                    "Content-Type": "application/json"
                }
                json_data = {
                    "locations": [[longitude, latitude]],
                    "range": [time_seconds],
                    "range_type": "time"
                }
                
                response_data = await self._make_request(url, headers, None, json_data, "POST")
                
                if response_data and response_data["data"]:
                    data = response_data["data"]
                    
                    result = {
                        "geojson": data,
                        "center_point": [latitude, longitude],
                        "time_seconds": time_seconds,
                        "api_source": "OpenRouteService",
                        "timestamp": datetime.now().isoformat(),
                        "is_live_data": True
                    }
                    
                    self._update_api_status("openrouteservice", True, response_data["response_time_ms"])
                    self.cache.set(endpoint, params, result, ttl=3600)  # 1 hour cache
                    
                    logger.info(f"✅ OpenRouteService: Isochrone for {time_seconds}s")
                    return result
                    
            except Exception as e:
                logger.error(f"❌ OpenRouteService API failed: {e}")
                self._update_api_status("openrouteservice", False, error=str(e))
        
        # Fallback: Generate synthetic isochrone
        logger.info("🔄 Using fallback isochrone generation")
        
        # Create approximate circular isochrone based on average Accra speeds
        radius_km = (time_seconds / 3600) * 15  # 15 km/h average speed in Accra
        radius_degrees = radius_km / 111  # Rough conversion to degrees
        
        # Generate hexagonal approximation (more realistic than circle)
        import math
        coordinates = []
        for i in range(7):  # 7 points for hexagon + closing
            angle = (i * 60) * (math.pi / 180)  # 60 degrees in radians
            lat = latitude + radius_degrees * math.cos(angle)
            lon = longitude + radius_degrees * math.sin(angle)
            coordinates.append([lon, lat])
        
        synthetic_geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "value": time_seconds,
                    "center": [longitude, latitude]
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coordinates]
                }
            }]
        }
        
        result = {
            "geojson": synthetic_geojson,
            "center_point": [latitude, longitude],
            "time_seconds": time_seconds,
            "api_source": "Local Generation (Accra Traffic Model)",
            "timestamp": datetime.now().isoformat(),
            "is_live_data": False,
            "fallback_reason": "API unavailable - using traffic-adjusted radius model"
        }
        
        self.cache.set(endpoint, params, result, ttl=1800)  # 30 min cache for fallback
        return result
    
    # ===================================================================
    # 🎉 PUBLIC HOLIDAYS API (Ghana)
    # ===================================================================
    
    async def check_ghana_holiday_robust(self) -> Dict:
        """Robust Ghana holiday checking with fallbacks"""
        
        endpoint = "public_holidays"
        today = datetime.now().date()
        params = {"date": today.isoformat()}
        
        # Check cache first
        cached = self.cache.get(endpoint, params)
        if cached:
            return cached
        
        # Try real API if healthy
        if self.api_status["public_holidays"].is_healthy:
            try:
                api_key = "0bacaafc915c4845ae635160e9ca79d8"
                
                url = f"https://holidayapi.com/v1/holidays"
                params_api = {
                    "key": api_key,
                    "country": "GH",
                    "year": today.year,
                    "month": today.month,
                    "day": today.day
                }
                
                response_data = await self._make_request(url, params=params_api)
                
                if response_data and response_data["data"]:
                    data = response_data["data"]
                    holidays = data.get("holidays", [])
                    
                    result = {
                        "is_holiday": len(holidays) > 0,
                        "holiday_name": holidays[0]["name"] if holidays else None,
                        "date": today.isoformat(),
                        "api_source": "Holiday API",
                        "timestamp": datetime.now().isoformat(),
                        "is_live_data": True
                    }
                    
                    self._update_api_status("public_holidays", True, response_data["response_time_ms"])
                    self.cache.set(endpoint, params, result, ttl=86400)  # 24 hour cache
                    
                    logger.info(f"✅ Holiday API: {'Holiday' if result['is_holiday'] else 'Not a holiday'}")
                    return result
                    
            except Exception as e:
                logger.error(f"❌ Holiday API failed: {e}")
                self._update_api_status("public_holidays", False, error=str(e))
        
        # Fallback: Known Ghana holidays
        logger.info("🔄 Using fallback holiday database")
        
        # Common Ghana holidays (basic calendar)
        known_holidays = {
            f"{today.year}-01-01": "New Year's Day",
            f"{today.year}-03-06": "Independence Day",
            f"{today.year}-05-01": "Labour Day",
            f"{today.year}-07-01": "Republic Day",
            f"{today.year}-08-04": "Founders' Day",
            f"{today.year}-12-25": "Christmas Day",
            f"{today.year}-12-26": "Boxing Day"
        }
        
        is_holiday = today.isoformat() in known_holidays
        holiday_name = known_holidays.get(today.isoformat())
        
        result = {
            "is_holiday": is_holiday,
            "holiday_name": holiday_name,
            "date": today.isoformat(),
            "api_source": "Local Ghana Calendar",
            "timestamp": datetime.now().isoformat(),
            "is_live_data": False,
            "fallback_reason": "API unavailable - using offline Ghana holiday calendar"
        }
        
        self.cache.set(endpoint, params, result, ttl=43200)  # 12 hour cache for fallback
        return result
    
    # ===================================================================
    # 🌤️ OPENWEATHER API (Accra Weather)
    # ===================================================================
    
    async def get_accra_weather_robust(self) -> Dict:
        """Robust Accra weather with fallbacks"""
        
        endpoint = "openweather"
        params = {"city": "accra"}
        
        # Check cache first
        cached = self.cache.get(endpoint, params)
        if cached:
            return cached
        
        # Try real API if healthy
        if self.api_status["openweather"].is_healthy:
            try:
                # Try multiple weather APIs
                weather_apis = [
                    "http://wttr.in/Accra?format=j1",  # Free wttr.in service
                    # OpenWeatherMap would need API key: f"http://api.openweathermap.org/data/2.5/weather?q=Accra,GH&appid={api_key}&units=metric"
                ]
                
                for api_url in weather_apis:
                    try:
                        response_data = await self._make_request(api_url)
                        
                        if response_data and response_data["data"]:
                            data = response_data["data"]
                            
                            # Parse wttr.in format
                            if "current_condition" in data:
                                current = data["current_condition"][0]
                                
                                result = {
                                    "temperature": float(current["temp_C"]),
                                    "weather_status": current["weatherDesc"][0]["value"],
                                    "description": current["weatherDesc"][0]["value"],
                                    "humidity": int(current["humidity"]),
                                    "wind_speed": float(current["windspeedKmph"]) * 0.277778,  # Convert to m/s
                                    "is_rainy": "rain" in current["weatherDesc"][0]["value"].lower(),
                                    "rain_intensity": "light" if "rain" in current["weatherDesc"][0]["value"].lower() else "none",
                                    "api_source": "wttr.in Weather Service",
                                    "timestamp": datetime.now().isoformat(),
                                    "is_live_data": True
                                }
                                
                                self._update_api_status("openweather", True, response_data["response_time_ms"])
                                self.cache.set(endpoint, params, result, ttl=600)  # 10 min cache
                                
                                logger.info(f"✅ Weather API: {result['temperature']}°C, {result['weather_status']}")
                                return result
                                
                    except Exception as e:
                        continue  # Try next API
                        
            except Exception as e:
                logger.error(f"❌ Weather APIs failed: {e}")
                self._update_api_status("openweather", False, error=str(e))
        
        # Fallback: Realistic Accra weather simulation
        logger.info("🔄 Using fallback weather simulation")
        
        # Accra weather patterns (tropical savanna climate)
        hour = datetime.now().hour
        month = datetime.now().month
        
        # Seasonal temperature variation
        if month in [12, 1, 2]:  # Dry season
            base_temp = 26 + random.uniform(-2, 3)
            rain_chance = 0.1
        elif month in [3, 4, 5]:  # Hot dry season
            base_temp = 30 + random.uniform(-2, 4)
            rain_chance = 0.2
        elif month in [6, 7, 8, 9]:  # Rainy season
            base_temp = 25 + random.uniform(-1, 3)
            rain_chance = 0.6
        else:  # October, November
            base_temp = 27 + random.uniform(-2, 3)
            rain_chance = 0.3
        
        # Daily temperature variation
        if 6 <= hour <= 12:  # Morning warming
            temp = base_temp + (hour - 6) * 1.5
        elif 12 <= hour <= 16:  # Afternoon peak
            temp = base_temp + 6 + random.uniform(-1, 2)
        else:  # Evening cooling
            temp = base_temp + max(0, 6 - (hour - 16) * 0.8)
        
        is_rainy = random.random() < rain_chance
        
        weather_conditions = [
            "Partly cloudy", "Sunny", "Overcast", "Light clouds"
        ]
        
        if is_rainy:
            weather_conditions = ["Light rain", "Heavy rain", "Thunderstorms", "Drizzle"]
        
        result = {
            "temperature": round(temp, 1),
            "weather_status": random.choice(weather_conditions),
            "description": f"Typical Accra weather for {datetime.now().strftime('%B')}",
            "humidity": random.randint(65, 90),  # High humidity in Accra
            "wind_speed": random.uniform(2, 8),  # m/s
            "is_rainy": is_rainy,
            "rain_intensity": random.choice(["light", "moderate", "heavy"]) if is_rainy else "none",
            "api_source": "Local Accra Climate Model",
            "timestamp": datetime.now().isoformat(),
            "is_live_data": False,
            "fallback_reason": "API unavailable - using Accra climate simulation"
        }
        
        self.cache.set(endpoint, params, result, ttl=900)  # 15 min cache for fallback
        return result
    
    # ===================================================================
    # 🚗 UBER API (Price Estimates)
    # ===================================================================
    
    async def get_uber_estimate_robust(self, start_lat: float, start_lon: float,
                                      end_lat: float, end_lon: float) -> Dict:
        """Robust Uber price estimation with fallbacks"""
        
        endpoint = "uber"
        params = {"start_lat": start_lat, "start_lon": start_lon, "end_lat": end_lat, "end_lon": end_lon}
        
        # Check cache first
        cached = self.cache.get(endpoint, params)
        if cached:
            return cached
        
        # Note: Real Uber API requires complex OAuth - using smart fallback
        logger.info("🔄 Using Uber pricing model for Ghana")
        
        # Calculate distance using Haversine formula
        import math
        
        R = 6371  # Earth's radius in km
        lat1, lon1, lat2, lon2 = map(math.radians, [start_lat, start_lon, end_lat, end_lon])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance_km = R * c
        
        # Ghana Uber/Bolt pricing model (realistic)
        base_fare = 4.0  # GHS
        per_km_rate = 2.5  # GHS per km
        per_minute_rate = 0.3  # GHS per minute
        
        # Estimate travel time based on Accra traffic
        avg_speed_kmh = 20  # Average speed in Accra
        travel_time_minutes = (distance_km / avg_speed_kmh) * 60
        
        # Calculate fare
        distance_cost = distance_km * per_km_rate
        time_cost = travel_time_minutes * per_minute_rate
        subtotal = base_fare + distance_cost + time_cost
        
        # Surge multiplier (time-based)
        hour = datetime.now().hour
        if hour in [7, 8, 17, 18, 19]:  # Peak hours
            surge = random.uniform(1.3, 2.0)
        elif hour in [6, 9, 16, 20]:  # Semi-peak
            surge = random.uniform(1.1, 1.4)
        else:
            surge = 1.0
        
        total_fare = subtotal * surge
        
        result = {
            "trip_type": "rideshare",
            "estimated_fare_ghs": f"GH₵ {total_fare:.2f}",
            "eta_minutes": int(travel_time_minutes + random.uniform(2, 8)),  # Add pickup time
            "distance_km": round(distance_km, 2),
            "surge_multiplier": round(surge, 1),
            "api_source": "Ghana Rideshare Pricing Model",
            "timestamp": datetime.now().isoformat(),
            "is_live_data": False,
            "fallback_reason": "Using local Ghana rideshare pricing algorithm"
        }
        
        self.cache.set(endpoint, params, result, ttl=600)  # 10 min cache
        logger.info(f"✅ Uber Estimate: {result['estimated_fare_ghs']} for {distance_km:.1f}km")
        return result
    
    # ===================================================================
    # 📊 API HEALTH & MANAGEMENT
    # ===================================================================
    
    def get_api_health_dashboard(self) -> Dict:
        """Get comprehensive API health dashboard"""
        
        dashboard = {
            "overall_health": "healthy",
            "timestamp": datetime.now().isoformat(),
            "apis": {},
            "cache_stats": {
                "total_cached_items": len(self.cache.cache),
                "cache_hit_rate": "N/A"  # Would need tracking for accurate rate
            }
        }
        
        healthy_count = 0
        total_count = len(self.api_status)
        
        for api_name, status in self.api_status.items():
            dashboard["apis"][api_name] = {
                "name": status.name,
                "is_healthy": status.is_healthy,
                "last_check": status.last_check.isoformat(),
                "response_time_ms": status.response_time_ms,
                "failure_count": status.failure_count,
                "last_error": status.last_error,
                "status_icon": "✅" if status.is_healthy else "❌"
            }
            
            if status.is_healthy:
                healthy_count += 1
        
        # Overall health calculation
        health_percentage = (healthy_count / total_count) * 100
        
        if health_percentage >= 80:
            dashboard["overall_health"] = "healthy"
        elif health_percentage >= 50:
            dashboard["overall_health"] = "degraded"
        else:
            dashboard["overall_health"] = "unhealthy"
        
        dashboard["health_percentage"] = health_percentage
        
        return dashboard
    
    async def health_check_all_apis(self) -> Dict:
        """Perform health check on all APIs"""
        
        logger.info("🔍 Performing comprehensive API health check...")
        
        # Test each API with minimal requests
        tasks = [
            self.calculate_co2_emissions_robust(10.0),
            self.get_isochrone_robust(5.6037, -0.1870, 1800),
            self.check_ghana_holiday_robust(),
            self.get_accra_weather_robust(),
            self.get_uber_estimate_robust(5.6037, -0.1870, 5.5558, -0.2238)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        api_names = ["carbon_interface", "openrouteservice", "public_holidays", "openweather", "uber"]
        
        for i, (api_name, result) in enumerate(zip(api_names, results)):
            if isinstance(result, Exception):
                self._update_api_status(api_name, False, error=str(result))
            else:
                # API returned successfully
                is_live = result.get("is_live_data", False)
                self._update_api_status(api_name, is_live)
        
        return self.get_api_health_dashboard()

# Global instance
api_manager = RobustAPIManager()

# Convenience functions for backend integration
async def get_robust_co2(distance_km: float) -> Dict:
    return await api_manager.calculate_co2_emissions_robust(distance_km)

async def get_robust_isochrone(lat: float, lon: float, time_seconds: int) -> Dict:
    return await api_manager.get_isochrone_robust(lat, lon, time_seconds)

async def get_robust_holiday() -> Dict:
    return await api_manager.check_ghana_holiday_robust()

async def get_robust_weather() -> Dict:
    return await api_manager.get_accra_weather_robust()

async def get_robust_uber(start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> Dict:
    return await api_manager.get_uber_estimate_robust(start_lat, start_lon, end_lat, end_lon)

async def get_api_health() -> Dict:
    return api_manager.get_api_health_dashboard()

async def health_check_all() -> Dict:
    return await api_manager.health_check_all_apis()

if __name__ == "__main__":
    # Test the fallback system
    async def test_fallbacks():
        print("🛡️ Testing Robust API Fallback System")
        print("=" * 50)
        
        # Test all APIs
        co2_result = await get_robust_co2(15.5)
        print(f"✅ CO₂: {co2_result['carbon_kg']} kg ({co2_result['api_source']})")
        
        weather_result = await get_robust_weather()
        print(f"✅ Weather: {weather_result['temperature']}°C ({weather_result['api_source']})")
        
        holiday_result = await get_robust_holiday()
        print(f"✅ Holiday: {'Yes' if holiday_result['is_holiday'] else 'No'} ({holiday_result['api_source']})")
        
        uber_result = await get_robust_uber(5.6037, -0.1870, 5.5558, -0.2238)
        print(f"✅ Uber: {uber_result['estimated_fare_ghs']} ({uber_result['api_source']})")
        
        isochrone_result = await get_robust_isochrone(5.6037, -0.1870, 1800)
        print(f"✅ Isochrone: Generated for 30min ({isochrone_result['api_source']})")
        
        # Health dashboard
        health = await health_check_all()
        print(f"\n📊 Overall API Health: {health['overall_health']} ({health['health_percentage']:.1f}%)")
        
        print("\n🛡️ Fallback system ready for hackathon demo!")
    
    asyncio.run(test_fallbacks()) 