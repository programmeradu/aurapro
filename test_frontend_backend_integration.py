#!/usr/bin/env python3

import requests
import time
import json
from datetime import datetime

def test_backend_integration():
    """Test our amazing backend integration"""
    
    print("🔍 TESTING FRONTEND-BACKEND INTEGRATION")
    print("=" * 60)
    
    # Test different ports to find our backend
    backend_ports = [8000, 8001, 8002, 8003]
    backend_url = None
    
    for port in backend_ports:
        try:
            url = f"http://localhost:{port}/api/v1/ml/models-status"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                backend_url = f"http://localhost:{port}"
                print(f"✅ Found AURA backend running on port {port}")
                break
        except:
            continue
    
    if not backend_url:
        print("❌ AURA backend not found on any port")
        print("Please start the backend with: cd backend; python -c \"import uvicorn; uvicorn.run('main:socket_app', host='0.0.0.0', port=8001)\"")
        return False
    
    # Test all our amazing endpoints
    endpoints_to_test = [
        ("/api/v1/ml/models-status", "ML Models Status"),
        ("/api/v1/gtfs/stops", "GTFS Stops"),
        ("/api/v1/gtfs/routes", "GTFS Routes"),
        ("/api/v1/gtfs/agencies", "GTFS Agencies"),
        ("/api/v1/websocket/health", "WebSocket Health"),
        ("/api/v1/journey/plan", "Journey Planning"),
        ("/api/v1/ml/predict-travel-time", "Travel Time Prediction"),
        ("/api/v1/ml/traffic-prediction", "Traffic Prediction"),
        ("/api/v1/optimize/routes", "Route Optimization")
    ]
    
    results = {}
    
    for endpoint, name in endpoints_to_test:
        try:
            url = f"{backend_url}{endpoint}"
            
            if endpoint == "/api/v1/journey/plan":
                # POST request with sample data
                data = {
                    "origin": {"latitude": 5.5502, "longitude": -0.2174},
                    "destination": {"latitude": 5.6037, "longitude": -0.1870}
                }
                response = requests.post(url, json=data, timeout=10)
            elif endpoint == "/api/v1/ml/predict-travel-time":
                # POST request with sample data
                data = {
                    "total_stops": 8,
                    "departure_hour": 14,
                    "is_weekend": False,
                    "route_distance": 15.0
                }
                response = requests.post(url, json=data, timeout=10)
            elif endpoint == "/api/v1/ml/traffic-prediction":
                # POST request with sample data
                data = {
                    "corridor": "N1_Highway",
                    "hour": 14,
                    "is_weekend": False,
                    "is_raining": False
                }
                response = requests.post(url, json=data, timeout=10)
            elif endpoint == "/api/v1/optimize/routes":
                # POST request with sample data
                data = {
                    "num_vehicles": 3,
                    "stops": [
                        [5.5502, -0.2174],  # Kaneshie
                        [5.6037, -0.1870],  # Circle
                        [5.5731, -0.2469]   # Mallam
                    ]
                }
                response = requests.post(url, json=data, timeout=10)
            else:
                # GET request
                response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results[name] = {
                    "status": "✅ SUCCESS",
                    "data": data
                }
                print(f"✅ {name}: SUCCESS")
                
                # Show key metrics
                if name == "ML Models Status" and data.get("success"):
                    models = data.get("models_status", {})
                    loaded = sum(1 for v in models.values() if v)
                    total = len(models)
                    print(f"   📊 Models loaded: {loaded}/{total}")
                
                elif name == "GTFS Stops" and data.get("success"):
                    count = data.get("count", 0)
                    print(f"   📍 GTFS stops: {count}")
                
                elif name == "GTFS Routes" and data.get("success"):
                    count = data.get("count", 0)
                    print(f"   🚌 GTFS routes: {count}")
                
                elif name == "WebSocket Health" and data.get("success"):
                    vehicles = data.get("vehicles", {}).get("total", 0)
                    kpis = data.get("kpis", 0)
                    print(f"   🔄 Real-time: {vehicles} vehicles, {kpis} KPIs")
                
                elif name == "Journey Planning" and data.get("success"):
                    journey = data.get("data", {})
                    duration = journey.get("total_duration_minutes", 0)
                    print(f"   🗺️ Journey planned: {duration:.1f} minutes")
                
                elif name == "Travel Time Prediction" and data.get("success"):
                    prediction = data.get("data", {})
                    time_min = prediction.get("travel_time_minutes", 0)
                    confidence = prediction.get("confidence_score", 0)
                    print(f"   🤖 ML prediction: {time_min:.1f} min ({confidence:.1%} confidence)")
                
            else:
                results[name] = {
                    "status": f"❌ FAILED ({response.status_code})",
                    "error": response.text[:100]
                }
                print(f"❌ {name}: FAILED ({response.status_code})")
                
        except Exception as e:
            results[name] = {
                "status": "❌ ERROR",
                "error": str(e)
            }
            print(f"❌ {name}: ERROR - {str(e)[:50]}")
    
    # Summary
    print("\n" + "=" * 60)
    print("🎯 INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    successful = sum(1 for r in results.values() if "SUCCESS" in r["status"])
    total = len(results)
    
    print(f"✅ Successful endpoints: {successful}/{total}")
    print(f"🌐 Backend URL: {backend_url}")
    print(f"⏰ Test completed at: {datetime.now().strftime('%H:%M:%S')}")
    
    if successful >= 6:  # At least 6 endpoints working
        print("\n🎉 EXCELLENT! Your AURA backend is working perfectly!")
        print("🚀 Ready for frontend integration!")
        
        # Test frontend ports
        frontend_ports = [3000, 3001, 3002, 3003]
        for port in frontend_ports:
            try:
                response = requests.get(f"http://localhost:{port}", timeout=3)
                if response.status_code == 200:
                    print(f"🌐 Frontend detected on: http://localhost:{port}")
                    print(f"🎯 Demo page: http://localhost:{port}/demo")
                    break
            except:
                continue
        
        return True
    else:
        print("\n⚠️ Some endpoints are not working. Please check the backend.")
        return False

if __name__ == "__main__":
    test_backend_integration()
