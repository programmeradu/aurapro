#!/usr/bin/env python3
"""
Test script for traffic prediction system
"""

from traffic_prediction_system import AccraTrafficPredictor

def test_traffic_predictions():
    print('🧪 COMPREHENSIVE TRAFFIC PREDICTION TESTING')
    print('=' * 50)

    predictor = AccraTrafficPredictor()

    # Test scenarios
    scenarios = [
        {'corridor': 'N1_Highway', 'hour': 8, 'is_weekend': 0, 'is_raining': 0, 'desc': 'Morning Rush - Dry'},
        {'corridor': 'Ring_Road_East', 'hour': 18, 'is_weekend': 0, 'is_raining': 1, 'desc': 'Evening Rush - Rain'},
        {'corridor': 'Tema_Motorway', 'hour': 14, 'is_weekend': 1, 'is_raining': 0, 'desc': 'Weekend Afternoon'},
        {'corridor': 'Spintex_Road', 'hour': 2, 'is_weekend': 0, 'is_raining': 0, 'desc': 'Night Time'},
        {'corridor': 'Liberation_Road', 'hour': 13, 'is_weekend': 0, 'day_of_week': 4, 'desc': 'Friday Prayer Time'}
    ]

    for i, scenario in enumerate(scenarios, 1):
        desc = scenario.pop('desc')
        result = predictor.predict_traffic(**scenario)
        
        print(f'\n{i}. {desc}:')
        if 'error' not in result:
            pred = result['predictions']
            congestion_desc = result['congestion_description']
            speed = pred['current_speed']
            level = pred['congestion_level']
            
            print(f'   Congestion: {congestion_desc}')
            print(f'   Speed: {speed:.1f} km/h')
            print(f'   Level: {level:.2f}')
        else:
            print(f'   Error: {result["error"]}')

    print('\n✅ All traffic prediction tests completed!')

if __name__ == "__main__":
    test_traffic_predictions()
