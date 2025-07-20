#!/usr/bin/env python3
"""
Debug GTFS response structure
"""

import requests
import json

def debug_endpoint(url, name):
    try:
        response = requests.get(url, timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name}: SUCCESS")
            print(f"   Raw response structure: {type(data)}")
            print(f"   Keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            if isinstance(data, dict):
                if 'count' in data:
                    print(f"   📊 Count field: {data['count']}")
                if 'data' in data:
                    print(f"   📊 Data field: {type(data['data'])}")
                    if isinstance(data['data'], dict):
                        print(f"   📊 Data keys: {list(data['data'].keys())}")
                        for key, value in data['data'].items():
                            if isinstance(value, list):
                                print(f"   📊 {key}: {len(value)} items")
            elif isinstance(data, list):
                print(f"   📊 List length: {len(data)}")
            
            print(f"   Raw JSON (first 200 chars): {json.dumps(data)[:200]}...")
            return True
        else:
            print(f"❌ {name}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

print("🔍 DEBUGGING GTFS RESPONSE STRUCTURE")
print("=" * 50)

endpoints = [
    ("http://localhost:8000/api/v1/gtfs/routes", "GTFS Routes"),
    ("http://localhost:8000/api/v1/gtfs/agencies", "GTFS Agencies"),
    ("http://localhost:8000/api/v1/gtfs/trips", "GTFS Trips"),
    ("http://localhost:8000/api/v1/ml/models-status", "Models Status"),
]

for url, name in endpoints:
    debug_endpoint(url, name)
    print()
