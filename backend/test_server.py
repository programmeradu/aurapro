#!/usr/bin/env python3
"""
Simple test server to debug the WebSocket server issues
"""

import asyncio
import logging
import socketio
import uvicorn
from fastapi import FastAPI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="AURA Test Server")

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins="*",
    cors_credentials=True,
    logger=True,
    engineio_logger=True,
    async_mode='asgi'
)

# Mount Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Test server is running"}

@sio.event
async def connect(sid, environ):
    logger.info(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    logger.info(f"Client {sid} disconnected")

if __name__ == "__main__":
    logger.info("🚀 Starting AURA Test Server...")
    print("🚀 Starting AURA Test Server...")
    try:
        uvicorn.run(
            socket_app,
            host="0.0.0.0",
            port=8002,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        logger.error(f"Error starting server: {e}")
