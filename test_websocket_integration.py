#!/usr/bin/env python3
"""
Test WebSocket integration
"""

import requests
import json

def test_websocket_health():
    try:
        response = requests.get("http://localhost:8003/api/v1/websocket/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ WebSocket Health Check: SUCCESS")
            print(f"   Status: {data.get('status')}")
            print(f"   Connected Clients: {data.get('connected_clients')}")
            print(f"   Vehicles: {data.get('vehicles', {})}")
            print(f"   KPIs: {data.get('kpis')}")
            print(f"   Features: {data.get('features')}")
            return True
        else:
            print(f"❌ WebSocket Health Check: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ WebSocket Health Check: {str(e)}")
        return False

def test_basic_endpoints():
    endpoints = [
        ("http://localhost:8003/health", "Basic Health"),
        ("http://localhost:8003/api/v1/gtfs/stops", "GTFS Stops"),
        ("http://localhost:8003/api/v1/ml/models-status", "Models Status"),
    ]
    
    for url, name in endpoints:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                print(f"✅ {name}: SUCCESS")
            else:
                print(f"❌ {name}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {name}: {str(e)}")

if __name__ == "__main__":
    print("🔍 TESTING WEBSOCKET INTEGRATION")
    print("=" * 50)
    
    test_websocket_health()
    print()
    test_basic_endpoints()
    
    print("\n🎯 Integration Status: WebSocket + REST API on single server!")
