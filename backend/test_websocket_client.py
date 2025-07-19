#!/usr/bin/env python3
"""
Simple WebSocket client to test the AURA WebSocket server
"""

import socketio
import asyncio
import time

# Create a Socket.IO client
sio = socketio.AsyncClient()

@sio.event
async def connect():
    print("✅ Connected to WebSocket server!")
    print("🔄 Requesting vehicle data...")
    await sio.emit('request_vehicles')

@sio.event
async def disconnect():
    print("❌ Disconnected from WebSocket server")

@sio.event
async def vehicles_update(data):
    print(f"🚌 Received {len(data)} vehicles:")
    for i, vehicle in enumerate(data[:5]):  # Show first 5 vehicles
        print(f"  {i+1}. {vehicle['id']} - {vehicle['route']} - Status: {vehicle['status']}")
    if len(data) > 5:
        print(f"  ... and {len(data) - 5} more vehicles")

@sio.event
async def routes_update(data):
    print(f"🛣️  Received {len(data)} routes")

@sio.event
async def kpis_update(data):
    print(f"📊 Received {len(data)} KPIs")

async def test_connection():
    try:
        print("🚀 Testing AURA WebSocket Server...")
        await sio.connect('http://localhost:8002')
        
        # Wait for data
        await asyncio.sleep(5)
        
        print("✅ Test completed successfully!")
        await sio.disconnect()
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
