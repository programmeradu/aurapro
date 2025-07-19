#!/usr/bin/env python3
"""
WebSocket Connection Test Script
Tests the AURA WebSocket server connection independently
"""

import asyncio
import socketio
import requests
import time
import sys

async def test_websocket_connection():
    """Test WebSocket connection to AURA server"""
    
    print("🧪 AURA WebSocket Connection Test")
    print("=" * 50)
    
    # Test 1: HTTP Health Check
    print("\n1️⃣ Testing HTTP Health Endpoint...")
    try:
        response = requests.get("http://localhost:8002/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ HTTP Health Check: {health_data['status']}")
            print(f"   📊 Connected Clients: {health_data['connected_clients']}")
            print(f"   ⏰ Timestamp: {health_data['timestamp']}")
        else:
            print(f"❌ HTTP Health Check Failed: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ HTTP Health Check Failed: {e}")
        return False
    
    # Test 2: Socket.IO Connection
    print("\n2️⃣ Testing Socket.IO Connection...")
    
    # Create Socket.IO client
    sio = socketio.AsyncClient(
        logger=True,
        engineio_logger=True
    )
    
    connection_success = False
    received_data = {
        'vehicles': False,
        'routes': False,
        'kpis': False,
        'trips': False
    }
    
    @sio.event
    async def connect():
        nonlocal connection_success
        connection_success = True
        print("✅ Socket.IO Connected Successfully!")
        print(f"   🆔 Session ID: {sio.sid}")
    
    @sio.event
    async def disconnect():
        print("🔌 Socket.IO Disconnected")
    
    @sio.event
    async def connect_error(data):
        print(f"❌ Socket.IO Connection Error: {data}")
    
    @sio.event
    async def vehicles_update(data):
        nonlocal received_data
        received_data['vehicles'] = True
        print(f"📊 Received vehicles update: {len(data)} vehicles")
    
    @sio.event
    async def routes_update(data):
        nonlocal received_data
        received_data['routes'] = True
        print(f"🛣️  Received routes update: {len(data)} routes")
    
    @sio.event
    async def kpis_update(data):
        nonlocal received_data
        received_data['kpis'] = True
        print(f"📈 Received KPIs update: {len(data)} KPIs")
    
    @sio.event
    async def trips_update(data):
        nonlocal received_data
        received_data['trips'] = True
        print(f"🚌 Received trips update: {len(data)} trips")
    
    try:
        # Connect to WebSocket server
        print("🔄 Attempting Socket.IO connection...")
        await sio.connect('http://localhost:8002')
        
        # Wait for initial data
        print("⏳ Waiting for initial data...")
        await asyncio.sleep(5)
        
        # Check if we received all expected data
        print("\n3️⃣ Data Reception Test:")
        for data_type, received in received_data.items():
            status = "✅" if received else "❌"
            print(f"   {status} {data_type.capitalize()}: {'Received' if received else 'Not received'}")
        
        # Test bidirectional communication
        print("\n4️⃣ Testing Bidirectional Communication...")
        await sio.emit('request_vehicles')
        await sio.emit('request_routes')
        await sio.emit('request_kpis')
        await sio.emit('request_trips')
        print("📤 Sent data requests to server")
        
        # Wait for responses
        await asyncio.sleep(3)
        
        await sio.disconnect()
        
        # Summary
        print("\n" + "=" * 50)
        print("📋 TEST SUMMARY:")
        print(f"   🔗 Connection: {'✅ Success' if connection_success else '❌ Failed'}")
        
        data_received_count = sum(received_data.values())
        total_data_types = len(received_data)
        print(f"   📊 Data Reception: {data_received_count}/{total_data_types} types received")
        
        if connection_success and data_received_count >= 2:
            print("🎉 WebSocket connection test PASSED!")
            return True
        else:
            print("❌ WebSocket connection test FAILED!")
            return False
            
    except Exception as e:
        print(f"❌ Socket.IO Connection Failed: {e}")
        return False

def test_server_ports():
    """Test if required ports are accessible"""
    print("\n🔍 Testing Server Ports...")
    
    ports_to_test = [
        (8000, "Backend API"),
        (8002, "WebSocket Server"),
        (3001, "Frontend (if running)")
    ]
    
    for port, service in ports_to_test:
        try:
            response = requests.get(f"http://localhost:{port}", timeout=2)
            print(f"✅ Port {port} ({service}): Accessible")
        except requests.exceptions.ConnectionError:
            print(f"❌ Port {port} ({service}): Not accessible")
        except requests.exceptions.Timeout:
            print(f"⚠️  Port {port} ({service}): Timeout")
        except Exception as e:
            print(f"❓ Port {port} ({service}): {e}")

if __name__ == "__main__":
    print("🚀 Starting AURA WebSocket Connection Test...")
    
    # Test server ports first
    test_server_ports()
    
    # Run WebSocket test
    try:
        success = asyncio.run(test_websocket_connection())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1)
