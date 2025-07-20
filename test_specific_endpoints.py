#!/usr/bin/env python3

import requests
import json
import time

def test_specific_endpoints():
    """Test the specific failing endpoints"""
    
    print("🔧 TESTING SPECIFIC FAILING ENDPOINTS")
    print("=" * 50)
    
    # Find backend port
    backend_url = None
    for port in [8001, 8000, 8002, 8003]:
        try:
            response = requests.get(f"http://localhost:{port}/api/v1/ml/models-status", timeout=3)
            if response.status_code == 200:
                backend_url = f"http://localhost:{port}"
                print(f"✅ Backend found on port {port}")
                break
        except:
            continue
    
    if not backend_url:
        print("❌ No backend found. Starting backend...")
        return False
    
    # Test 1: Travel Time Prediction
    print("\n🤖 Testing Travel Time Prediction...")
    try:
        url = f"{backend_url}/api/v1/ml/predict-travel-time"
        data = {
            "total_stops": 8,
            "departure_hour": 14,
            "is_weekend": False,
            "route_distance": 15.0
        }
        response = requests.post(url, json=data, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS: {result}")
        else:
            print(f"❌ FAILED: {response.text}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    # Test 2: Route Optimization
    print("\n🎯 Testing Route Optimization...")
    try:
        url = f"{backend_url}/api/v1/optimize/routes"
        data = {
            "num_vehicles": 3,
            "stops": [
                [5.5502, -0.2174],  # Kaneshie
                [5.6037, -0.1870],  # Circle
                [5.5731, -0.2469]   # Mallam
            ]
        }
        response = requests.post(url, json=data, timeout=15)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS: {result.get('status', 'No status')}")
        else:
            print(f"❌ FAILED: {response.text}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    # Test 3: Advanced Travel Time
    print("\n🚀 Testing Advanced Travel Time...")
    try:
        url = f"{backend_url}/api/v1/ml/advanced-travel-time"
        data = {
            "origin_lat": 5.5502,
            "origin_lng": -0.2174,
            "dest_lat": 5.6037,
            "dest_lng": -0.1870
        }
        response = requests.post(url, json=data, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS: {result}")
        else:
            print(f"❌ FAILED: {response.text}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    # Test 4: List all available endpoints
    print("\n📋 Testing Available Endpoints...")
    try:
        # Try to get OpenAPI docs
        url = f"{backend_url}/docs"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print("✅ OpenAPI docs available at /docs")
        
        # Try to get health check
        url = f"{backend_url}/health"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print("✅ Health check available at /health")
        
    except Exception as e:
        print(f"❌ Docs/Health check error: {e}")

if __name__ == "__main__":
    test_specific_endpoints()
