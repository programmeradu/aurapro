#!/usr/bin/env python3
"""
Test script for Uber Authentication
Tests the Uber OAuth flow directly
"""

import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/.env")

def test_uber_auth():
    """Test Uber authentication directly"""
    
    print("🔐 Testing Uber Authentication")
    print("=" * 40)
    
    # Get credentials
    client_id = os.getenv("UBER_CLIENT_ID", "CaToIvoee4CsslgJ3cedYU3pTSEuHGal")
    client_secret = os.getenv("UBER_CLIENT_SECRET", "yCfdI6g1iEjnQZ3xuK7BV-Shx-IF0TJLT8t-3HNi")
    
    print(f"Client ID: {client_id[:10]}...")
    print(f"Client Secret: {client_secret[:10]}...")
    print()
    
    # Test authentication (using sandbox endpoints)
    auth_url = "https://sandbox-login.uber.com/oauth/v2/token"
    auth_payload = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials',
        'scope': 'request'  # Add required scope
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    try:
        print("🔄 Attempting Uber authentication...")
        response = requests.post(auth_url, data=auth_payload, headers=headers, timeout=10)
        
        print(f"📡 Response Status: {response.status_code}")
        print(f"📡 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Authentication Successful!")
            print(f"Access Token: {token_data.get('access_token', 'N/A')[:20]}...")
            print(f"Token Type: {token_data.get('token_type', 'N/A')}")
            print(f"Expires In: {token_data.get('expires_in', 'N/A')} seconds")
            
            # Test a simple API call with the token
            access_token = token_data.get('access_token')
            if access_token:
                print()
                print("🔄 Testing API call with token...")
                test_api_call(access_token)
                
        else:
            print("❌ Authentication Failed!")
            print(f"Response: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                print(f"Error Code: {error_data.get('error', 'N/A')}")
                print(f"Error Description: {error_data.get('error_description', 'N/A')}")
            except:
                pass
                
    except Exception as e:
        print(f"❌ Authentication Error: {str(e)}")

def test_api_call(access_token):
    """Test a simple API call with the access token"""
    
    # Test coordinates (Accra Central to Kaneshie Market)
    api_url = "https://test-api.uber.com/v1.2/estimates/price"
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {
        'start_latitude': 5.5502,
        'start_longitude': -0.2174,
        'end_latitude': 5.5731,
        'end_longitude': -0.2469
    }
    
    try:
        response = requests.get(api_url, headers=headers, params=params, timeout=10)
        
        print(f"📡 API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            estimates = data.get("prices", [])
            print(f"✅ API Call Successful! Found {len(estimates)} estimates")
            
            for estimate in estimates:
                print(f"   - {estimate.get('display_name')}: {estimate.get('estimate')}")
                
        else:
            print("❌ API Call Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ API Call Error: {str(e)}")

if __name__ == "__main__":
    test_uber_auth()
