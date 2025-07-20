#!/usr/bin/env python3
"""
Test script for Live Uber API Integration
Tests the new /api/v1/uber/price_estimate endpoint
"""

import requests
import json
from datetime import datetime

def test_uber_api():
    """Test the live Uber API integration"""
    
    print("🚗 Testing Live Uber API Integration")
    print("=" * 50)
    
    # Test coordinates (Accra Central to Kaneshie Market)
    test_data = {
        "start_latitude": 5.5502,
        "start_longitude": -0.2174,
        "end_latitude": 5.5731,
        "end_longitude": -0.2469
    }
    
    print(f"📍 From: Accra Central ({test_data['start_latitude']}, {test_data['start_longitude']})")
    print(f"📍 To: Kaneshie Market ({test_data['end_latitude']}, {test_data['end_longitude']})")
    print()
    
    try:
        # Test the new live Uber API endpoint
        print("🔄 Testing Live Uber API endpoint...")
        response = requests.post(
            "http://localhost:8000/api/v1/uber/price_estimate",
            json=test_data,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                print("✅ Live Uber API SUCCESS!")
                print()
                print("🚗 Uber Price Estimate:")
                print(f"   Product: {data.get('product', 'N/A')}")
                print(f"   Estimated Fare: {data.get('estimated_fare', 'N/A')}")
                duration_min = data.get('duration_seconds', 0) // 60
                print(f"   Duration: {duration_min} minutes ({data.get('duration_seconds', 'N/A')} seconds)")
                print(f"   Distance: {data.get('distance_km', 'N/A')} km")
                print(f"   Currency: {data.get('currency_code', 'N/A')}")

                # Format estimates based on currency
                currency = data.get('currency_code', 'USD')
                if currency == 'GHS':
                    low_est = data.get('low_estimate', 0) / 100  # Convert pesewas to cedis
                    high_est = data.get('high_estimate', 0) / 100
                    print(f"   Low Estimate: GH₵{low_est:.2f}")
                    print(f"   High Estimate: GH₵{high_est:.2f}")
                else:
                    print(f"   Low Estimate: ${data.get('low_estimate', 'N/A')}")
                    print(f"   High Estimate: ${data.get('high_estimate', 'N/A')}")

                print(f"   Surge Multiplier: {data.get('surge_multiplier', 'N/A')}")
                print(f"   API Source: {data.get('api_source', 'N/A')}")
                
            else:
                print("❌ Live Uber API FAILED!")
                print(f"Error: {data.get('error_message', 'Unknown error')}")
                print(f"API Source: {data.get('api_source', 'N/A')}")
                
        else:
            print("❌ HTTP Error!")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend not running on localhost:8000")
    except requests.exceptions.Timeout:
        print("❌ Request Timeout: Uber API took too long to respond")
    except Exception as e:
        print(f"❌ Unexpected Error: {str(e)}")
    
    print()
    print("=" * 50)
    
    # Also test the existing fallback endpoint for comparison
    print("🔄 Testing Fallback Uber API endpoint for comparison...")
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/uber/estimate",
            json=test_data,
            timeout=10
        )
        
        print(f"📡 Fallback Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Fallback Uber API SUCCESS!")
            print(f"   Trip Type: {data.get('trip_type', 'N/A')}")
            print(f"   Estimated Fare: {data.get('estimated_fare_ghs', 'N/A')}")
            print(f"   ETA: {data.get('eta_minutes', 'N/A')} minutes")
            print(f"   Distance: {data.get('distance_km', 'N/A')} km")
            print(f"   API Source: {data.get('api_source', 'N/A')}")
        else:
            print(f"❌ Fallback API Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Fallback API Error: {str(e)}")

if __name__ == "__main__":
    test_uber_api()
