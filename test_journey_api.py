#!/usr/bin/env python3
"""
🧪 Test Real Journey Planning API
Tests the new ML-powered journey planning functionality
"""

import requests
import json
from datetime import datetime

def test_journey_planning():
    """Test the real journey planning API"""
    
    # Test data - real Ghana locations
    test_request = {
        "from": {
            "name": "Accra Central",
            "lat": 5.5502,
            "lng": -0.2174
        },
        "to": {
            "name": "Kaneshie Market", 
            "lat": 5.5731,
            "lng": -0.2469
        },
        "departure_time": "2025-01-18T12:00:00Z"
    }
    
    print("🧪 Testing Real Journey Planning API")
    print("=" * 50)
    print(f"📍 From: {test_request['from']['name']}")
    print(f"📍 To: {test_request['to']['name']}")
    print(f"🕐 Departure: {test_request['departure_time']}")
    print()
    
    try:
        # Make API request
        response = requests.post(
            "http://localhost:8000/api/v1/journey/plan",
            json=test_request,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()

            if data.get("success") == True:
                journey_plan = data.get("data", {})
                
                print("✅ Journey Planning SUCCESS!")
                print()
                
                # Display journey options
                options = journey_plan.get("options", [])
                print(f"🛣️ Found {len(options)} journey option(s):")
                
                for i, option in enumerate(options, 1):
                    print(f"\n--- Option {i} ---")
                    print(f"Duration: {option.get('totalDuration', 0)} minutes")
                    print(f"Fare: ₵{option.get('totalFare', 0):.2f}")
                    print(f"Distance: {option.get('totalDistance', 0)} km")
                    print(f"Reliability: {option.get('reliability', 0)*100:.1f}%")
                    
                    # ML and optimization info
                    if option.get('algorithm_used'):
                        print(f"🤖 Algorithm: {option['algorithm_used']}")
                    if option.get('ml_confidence'):
                        print(f"🎯 ML Confidence: {option['ml_confidence']*100:.1f}%")
                    if option.get('co2Emissions'):
                        print(f"🌱 CO₂ Emissions: {option['co2Emissions']} kg")
                    
                    # Segments
                    segments = option.get('segments', [])
                    print(f"📋 Journey segments: {len(segments)}")
                    for j, segment in enumerate(segments, 1):
                        print(f"  {j}. {segment.get('type', 'unknown').title()}: {segment.get('duration', 0)} min")
                        if segment.get('ml_prediction'):
                            ml_info = segment['ml_prediction']
                            print(f"     🤖 ML Prediction: {ml_info.get('predicted_time', 0)} min (confidence: {ml_info.get('confidence', 0)*100:.1f}%)")
                
                # Metadata
                metadata = journey_plan.get("metadata", {})
                if metadata:
                    print(f"\n📊 Metadata:")
                    print(f"ML Models Used: {len(metadata.get('ml_models_used', []))}")
                    for model in metadata.get('ml_models_used', []):
                        print(f"  - {model}")
                    
                    print(f"Data Sources: {len(metadata.get('data_sources', []))}")
                    for source in metadata.get('data_sources', []):
                        print(f"  - {source}")
                    
                    print(f"Optimization Applied: {metadata.get('optimization_applied', False)}")
                    print(f"Confidence Score: {metadata.get('confidence_score', 0)*100:.1f}%")
                
            else:
                print("❌ Journey Planning FAILED!")
                print(f"Error: {data.get('message', 'Unknown error')}")
                print(f"Full response: {json.dumps(data, indent=2)}")
                
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

if __name__ == "__main__":
    test_journey_planning()
