#!/usr/bin/env python3
"""
Test the new health check endpoints
"""

import requests
import json

def test_health_endpoint(url, name):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name}: SUCCESS")
            print(f"   Status: {data.get('status', 'N/A')}")
            print(f"   Service: {data.get('service', 'N/A')}")
            return True
        else:
            print(f"❌ {name}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

print("🔍 TESTING NEW HEALTH CHECK ENDPOINTS")
print("=" * 50)

endpoints = [
    ("http://localhost:8000/api/v1/optimize/health", "OR-Tools Health"),
    ("http://localhost:8000/api/v1/ml/health/production-service", "Production ML Health"),
    ("http://localhost:8000/api/v1/ml/health/traffic-prediction", "Traffic Prediction Health"),
    ("http://localhost:8000/api/v1/ml/health/advanced-travel-time", "Advanced Travel Time Health"),
]

results = {}
for url, name in endpoints:
    results[name] = test_health_endpoint(url, name)
    print()

print(f"📊 SUMMARY: {sum(results.values())}/{len(results)} health endpoints working")
