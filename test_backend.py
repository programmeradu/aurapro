#!/usr/bin/env python3
"""
Simple test script to verify our backend API is working
"""
import requests
import json
import time

def test_backend_connection():
    backend_url = "http://127.0.0.1:8002"
    
    print("🧪 Testing Aura Command Backend Connection...")
    print(f"🔗 Backend URL: {backend_url}")
    print("-" * 50)
    
    # Test root endpoint
    try:
        print("📡 Testing root endpoint...")
        response = requests.get(f"{backend_url}/", timeout=5)
        print(f"✅ Root Status: {response.status_code}")
        print(f"📄 Response: {response.json()}")
        print()
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False
    
    # Test routes endpoint
    try:
        print("📡 Testing routes endpoint...")
        response = requests.get(f"{backend_url}/api/v1/routes", timeout=5)
        print(f"✅ Routes Status: {response.status_code}")
        data = response.json()
        print(f"📊 Routes found: {len(data['routes'])}")
        print(f"🔢 Version: {data['version']}")
        print(f"⏰ Generated at: {data['generated_at']}")
        print()
    except Exception as e:
        print(f"❌ Routes endpoint failed: {e}")
        return False
    
    # Test real-time KPIs endpoint
    try:
        print("📡 Testing real-time KPIs endpoint...")
        response = requests.get(f"{backend_url}/api/v1/kpis/realtime", timeout=5)
        print(f"✅ KPIs Status: {response.status_code}")
        kpi_data = response.json()
        print(f"📈 Network Efficiency: +{kpi_data['network_efficiency']}%")
        print(f"💰 Driver Profitability: +{kpi_data['driver_profitability']}%")
        print(f"⚖️ Service Equity: {kpi_data['service_equity_score']} ({kpi_data['service_equity_numeric']})")
        print(f"🌱 CO₂ Reduction: -{kpi_data['co2_reduction_tonnes_per_week']} tonnes/week")
        print(f"🕐 Last Updated: {kpi_data['last_updated']}")
        print()
    except Exception as e:
        print(f"❌ KPIs endpoint failed: {e}")
        return False
    
    # Test comprehensive external API integrations
    print("🌍 Testing Comprehensive External API Integrations...")
    print("-" * 50)
    
    # Test CO₂ calculation endpoint
    try:
        print("🌿 Testing CO₂ calculation endpoint...")
        co2_payload = {"distance_km": 15.5}
        response = requests.post(f"{backend_url}/api/v1/calculate_co2", json=co2_payload, timeout=10)
        print(f"✅ CO₂ Status: {response.status_code}")
        co2_data = response.json()
        print(f"🚗 Distance: {co2_data['distance_km']}km")
        print(f"🌿 Emissions: {co2_data['carbon_kg']}kg CO₂e")
        print(f"📊 Source: {co2_data['api_source']}")
        print()
    except Exception as e:
        print(f"❌ CO₂ endpoint failed: {e}")
        return False
    
    # Test isochrone endpoint
    try:
        print("🗺️ Testing isochrone endpoint...")
        isochrone_payload = {"latitude": 5.6037, "longitude": -0.1870, "time_seconds": 1800}
        response = requests.post(f"{backend_url}/api/v1/get_isochrone", json=isochrone_payload, timeout=10)
        print(f"✅ Isochrone Status: {response.status_code}")
        isochrone_data = response.json()
        print(f"📍 Center: {isochrone_data['center_point']}")
        print(f"⏰ Time: {isochrone_data['time_seconds']}s")
        print(f"📊 Source: {isochrone_data['api_source']}")
        print()
    except Exception as e:
        print(f"❌ Isochrone endpoint failed: {e}")
        return False
        
    # Test holiday check endpoint
    try:
        print("📅 Testing holiday check endpoint...")
        response = requests.get(f"{backend_url}/api/v1/check_holiday/GH", timeout=10)
        print(f"✅ Holiday Status: {response.status_code}")
        holiday_data = response.json()
        print(f"🎉 Is Holiday: {holiday_data['is_holiday']}")
        if holiday_data['is_holiday']:
            print(f"🏆 Holiday: {holiday_data['holiday_name']}")
        print(f"📅 Date: {holiday_data['date']}")
        print(f"📊 Source: {holiday_data['api_source']}")
        print()
    except Exception as e:
        print(f"❌ Holiday endpoint failed: {e}")
        return False
        
    # Test live events endpoint
    try:
        print("📢 Testing live events endpoint...")
        response = requests.get(f"{backend_url}/api/v1/live_events", timeout=5)
        print(f"✅ Events Status: {response.status_code}")
        events_data = response.json()
        print(f"🎪 Events Found: {len(events_data['events'])}")
        for event in events_data['events'][:2]:  # Show first 2 events
            print(f"   📍 {event['name']} - {event['predicted_impact']} impact")
        print(f"📊 Source: {events_data['api_source']}")
        print()
    except Exception as e:
        print(f"❌ Events endpoint failed: {e}")
        return False
        
    # Test Uber estimate endpoint
    try:
        print("🚗 Testing Uber estimate endpoint...")
        uber_payload = {
            "start_latitude": 5.6037, "start_longitude": -0.1870,
            "end_latitude": 5.5717, "end_longitude": -0.2107
        }
        response = requests.post(f"{backend_url}/api/v1/uber/estimate", json=uber_payload, timeout=5)
        print(f"✅ Uber Status: {response.status_code}")
        uber_data = response.json()
        print(f"🚖 Trip Type: {uber_data['trip_type']}")
        print(f"💰 Fare: {uber_data['estimated_fare_ghs']} GHS")
        print(f"⏰ ETA: {uber_data['eta_minutes']} minutes")
        print(f"📏 Distance: {uber_data['distance_km']}km")
        print(f"📊 Source: {uber_data['api_source']}")
        print()
        return True
    except Exception as e:
        print(f"❌ Uber endpoint failed: {e}")
        return False

if __name__ == "__main__":
    # Give server time to start
    print("⏳ Waiting for server to start...")
    time.sleep(3)
    
    success = test_backend_connection()
    
    if success:
        print("🎉 Backend test completed successfully!")
        print("✅ Ready for frontend integration!")
    else:
        print("💥 Backend test failed!")
        print("⚠️  Please check if the server is running") 