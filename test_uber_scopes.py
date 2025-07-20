#!/usr/bin/env python3
"""
Test different Uber API scopes to find the correct one
"""

import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/.env")

def test_uber_scope(scope):
    """Test Uber authentication with a specific scope"""
    
    print(f"🔐 Testing scope: '{scope}'")
    print("-" * 40)
    
    # Get credentials
    client_id = os.getenv("UBER_CLIENT_ID", "CaToIvoee4CsslgJ3cedYU3pTSEuHGal")
    client_secret = os.getenv("UBER_CLIENT_SECRET", "yCfdI6g1iEjnQZ3xuK7BV-Shx-IF0TJLT8t-3HNi")
    
    # Test authentication
    auth_url = "https://sandbox-login.uber.com/oauth/v2/token"
    auth_payload = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials'
    }
    
    # Add scope if provided
    if scope:
        auth_payload['scope'] = scope
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    try:
        response = requests.post(auth_url, data=auth_payload, headers=headers, timeout=10)
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Authentication Successful!")
            print(f"Access Token: {token_data.get('access_token', 'N/A')[:20]}...")
            print(f"Token Type: {token_data.get('token_type', 'N/A')}")
            print(f"Expires In: {token_data.get('expires_in', 'N/A')} seconds")
            print(f"Scope: {token_data.get('scope', 'N/A')}")
            return token_data.get('access_token')
        else:
            print("❌ Authentication Failed!")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('error', 'N/A')}")
                print(f"Description: {error_data.get('error_description', 'N/A')}")
            except:
                print(f"Response: {response.text}")
            return None
                
    except Exception as e:
        print(f"❌ Authentication Error: {str(e)}")
        return None

def main():
    """Test different scopes"""
    
    print("🚗 Testing Uber API Scopes")
    print("=" * 50)
    
    # List of scopes to try
    scopes_to_try = [
        None,  # No scope
        "",    # Empty scope
        "request",
        "request.estimate", 
        "request.receipt",
        "profile",
        "history",
        "places",
        "all_trips",
        "request request.estimate",  # Multiple scopes
        "profile request",
        "request.estimate profile"
    ]
    
    successful_scopes = []
    
    for scope in scopes_to_try:
        scope_name = scope if scope else "No scope"
        print(f"\n🔄 Testing: {scope_name}")
        
        token = test_uber_scope(scope)
        if token:
            successful_scopes.append(scope_name)
        
        print()
    
    print("=" * 50)
    print("📊 SUMMARY:")
    if successful_scopes:
        print("✅ Successful scopes:")
        for scope in successful_scopes:
            print(f"   - {scope}")
    else:
        print("❌ No scopes worked")
        print("\n💡 NEXT STEPS:")
        print("1. Check your Uber Developer Dashboard")
        print("2. Ensure Privacy Policy and Redirect URI are set")
        print("3. Verify your app is configured for the correct environment")
        print("4. Check if your credentials are for sandbox or production")

if __name__ == "__main__":
    main()
