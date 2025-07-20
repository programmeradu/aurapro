#!/usr/bin/env python3
"""
Test backend endpoints directly
"""

import requests
import json

def test_endpoint(url, name):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name}: SUCCESS")
            if isinstance(data, dict):
                if 'count' in data:
                    print(f"   📊 Count: {data['count']}")
                if 'models_status' in data:
                    print(f"   🤖 Models: {sum(data['models_status'].values())}/6 loaded")
                if 'gtfs_data_status' in data:
                    gtfs = data['gtfs_data_status']
                    print(f"   🗺️ GTFS: {gtfs.get('stops_count', 0)} stops, {gtfs.get('routes_count', 0)} routes")
            return True
        else:
            print(f"❌ {name}: HTTP {response.status_code}")
            print(f"   Error: {response.text[:100]}")
            return False
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

print("🔍 TESTING BACKEND ENDPOINTS DIRECTLY")
print("=" * 50)

endpoints = [
    ("http://localhost:8000/api/v1/gtfs/stops", "GTFS Stops"),
    ("http://localhost:8000/api/v1/ml/models-status", "Models Status"),
    ("http://localhost:8000/api/v1/gtfs/routes", "GTFS Routes"),
    ("http://localhost:8000/api/v1/gtfs/agencies", "GTFS Agencies"),
    ("http://localhost:8000/api/v1/gtfs/trips", "GTFS Trips"),
]

results = {}
for url, name in endpoints:
    results[name] = test_endpoint(url, name)

print(f"\n📊 SUMMARY: {sum(results.values())}/{len(results)} endpoints working")

# Test advanced ML endpoints
print(f"\n🧠 TESTING ADVANCED ML ENDPOINTS")
advanced_endpoints = [
    ("http://localhost:8000/api/v1/ml/advanced-travel-time", "Advanced Travel Time"),
    ("http://localhost:8000/api/v1/ml/traffic-prediction", "Traffic Prediction"),
    ("http://localhost:8000/api/v1/optimize/advanced-ghana", "Advanced Optimizer"),
]

for url, name in advanced_endpoints:
    try:
        # POST request with sample data
        sample_data = {
            "origin": {"lat": 5.5502, "lng": -0.2174},
            "destination": {"lat": 5.5731, "lng": -0.2469},
            "stops": [{"lat": 5.5502, "lng": -0.2174, "demand": 1}],
            "corridor": "N1_Highway",
            "hour": 8
        }
        response = requests.post(url, json=sample_data, timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name}: SUCCESS")
            if 'model' in data:
                print(f"   🤖 Model: {data['model']}")
        else:
            print(f"❌ {name}: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
