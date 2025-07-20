#!/usr/bin/env python3
"""
Test OR-Tools endpoint directly
"""

import requests
import json

def test_ortools():
    test_data = {
        "num_vehicles": 3,
        "stops": [
            {"lat": 5.5502, "lng": -0.2174, "name": "Accra Central"},
            {"lat": 5.5731, "lng": -0.2469, "name": "Kaneshie Market"},
            {"lat": 5.6037, "lng": -0.1870, "name": "Madina"}
        ]
    }
    
    try:
        print("🔄 Testing OR-Tools optimization...")
        response = requests.post(
            "http://localhost:8000/api/v1/optimize/routes",
            json=test_data,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS!")
            print(f"Response keys: {list(data.keys())}")
            print(f"Status: {data.get('status')}")
            print(f"Algorithm: {data.get('algorithm')}")
            print(f"Models loaded: {data.get('models_loaded')}")
            print(f"JSON: {json.dumps(data, indent=2)[:500]}...")
        else:
            print("❌ FAILED!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_ortools()
