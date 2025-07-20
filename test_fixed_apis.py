#!/usr/bin/env python3
"""
Test script for the fixed APIs
"""

import requests
import json

def test_kpis():
    """Test the KPI endpoint"""
    print("🧪 Testing KPI endpoint...")
    try:
        response = requests.get("http://127.0.0.1:8000/api/v1/kpis")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ KPI endpoint working! Found {len(data['kpis'])} KPIs")
            for kpi in data['kpis']:
                print(f"   - {kpi['name']}: {kpi['value']} {kpi['unit']}")
        else:
            print(f"❌ KPI endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ KPI endpoint error: {e}")

def test_tracking():
    """Test the tracking endpoint"""
    print("\n🧪 Testing tracking endpoint...")
    try:
        # Test with Ghana coordinates (Accra)
        response = requests.get("http://127.0.0.1:8000/api/v1/tracking/nearby", params={
            "lat": 5.6037,
            "lon": -0.1870,
            "radius": 2000
        })
        if response.status_code == 200:
            data = response.json()
            vehicles = data.get('data', {}).get('vehicles', []) if 'data' in data else data.get('vehicles', [])
            print(f"✅ Tracking endpoint working! Found {len(vehicles)} vehicles")
            if vehicles:
                print(f"   - Sample vehicle: {vehicles[0]['vehicle_id']} at ({vehicles[0]['latitude']:.4f}, {vehicles[0]['longitude']:.4f})")
        else:
            print(f"❌ Tracking endpoint failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Tracking endpoint error: {e}")

def test_websocket_health():
    """Test WebSocket server health"""
    print("\n🧪 Testing WebSocket server...")
    try:
        response = requests.get("http://127.0.0.1:8002/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ WebSocket server healthy! Status: {data['status']}")
            print(f"   - Connected clients: {data['connected_clients']}")
            print(f"   - Uptime: {data['uptime']}")
        else:
            print(f"❌ WebSocket server failed: {response.status_code}")
    except Exception as e:
        print(f"❌ WebSocket server error: {e}")

def test_realtime_kpis():
    """Test real-time KPI endpoint"""
    print("\n🧪 Testing real-time KPI endpoint...")
    try:
        response = requests.get("http://127.0.0.1:8000/api/v1/kpis/realtime")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Real-time KPI endpoint working!")
            if 'kpis' in data:
                print(f"   - Found {len(data['kpis'])} real-time KPIs")
        else:
            print(f"❌ Real-time KPI endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Real-time KPI endpoint error: {e}")

if __name__ == "__main__":
    print("🚀 Testing Fixed AURA APIs")
    print("=" * 50)
    
    test_kpis()
    test_tracking()
    test_websocket_health()
    test_realtime_kpis()
    
    print("\n" + "=" * 50)
    print("✅ API Testing Complete!")