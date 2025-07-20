#!/usr/bin/env python3
"""
Quick test of models status
"""

import requests
import json

try:
    response = requests.get("http://localhost:8000/api/v1/ml/models-status", timeout=10)
    if response.status_code == 200:
        data = response.json()
        print("🎯 MODELS STATUS:")
        print(json.dumps(data, indent=2))
    else:
        print(f"❌ Error: HTTP {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Error: {e}")

# Test routes endpoint
try:
    response = requests.get("http://localhost:8000/api/v1/gtfs/routes", timeout=10)
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ ROUTES: {data.get('count', 0)} routes loaded")
    else:
        print(f"\n❌ ROUTES ERROR: HTTP {response.status_code}")
        print(response.text[:200])
except Exception as e:
    print(f"\n❌ ROUTES ERROR: {e}")
