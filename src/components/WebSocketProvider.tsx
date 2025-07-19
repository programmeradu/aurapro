'use client'

import { websocketService } from '@/services/websocket'
import { useStore } from '@/store/useStore'
import React, { createContext, useContext, useEffect } from 'react'
import { useMemoryLeakPrevention } from '../lib/memoryLeakFixes'

interface WebSocketContextType {
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = React.useState(false)
  const connectionStatus = useStore((state) => state.connectionStatus)
  const { safeSetInterval, addCleanup } = useMemoryLeakPrevention()

  useEffect(() => {
    console.log('🔌 WebSocketProvider: Initializing WebSocket connection...')
    console.log('🔌 WebSocketProvider: Current window location:', window.location.href)

    // Try multiple WebSocket URLs for better compatibility
    const tryMultipleConnections = async () => {
      const urls = [
        'http://localhost:8002',  // Default
        'http://127.0.0.1:8002',  // Alternative localhost
        `http://${window.location.hostname}:8002`  // Same host as frontend
      ]

      console.log('🔌 WebSocketProvider: Trying multiple connection URLs...')

      for (const url of urls) {
        try {
          console.log(`🔄 Attempting connection to: ${url}`)
          websocketService.connect(url)

          // Wait a bit to see if connection succeeds
          await new Promise(resolve => setTimeout(resolve, 2000))

          const status = websocketService.getConnectionStatus()
          if (status === 'connected') {
            console.log(`✅ Successfully connected to: ${url}`)
            return true
          } else {
            console.log(`❌ Connection failed for: ${url} (status: ${status})`)
          }
        } catch (error) {
          console.error(`❌ Error connecting to ${url}:`, error)
        }
      }

      console.log('❌ All connection attempts failed')
      return false
    }

    // Start connection attempts
    tryMultipleConnections()

    // Set up connection status monitoring
    const checkConnection = () => {
      const status = websocketService.getConnectionStatus()
      console.log('🔌 WebSocketProvider: Connection status check:', status)
      const connected = status === 'connected'
      setIsConnected(connected)

      // Update store connection status
      useStore.getState().setConnectionStatus(connected ? 'connected' : 'disconnected')
    }

    // Check connection status every 2 seconds with memory leak prevention
    const interval = safeSetInterval(checkConnection, 2000)

    // Initial check
    checkConnection()

    // Retry connection if initial attempts fail
    const retryTimeout = setTimeout(() => {
      const status = websocketService.getConnectionStatus()
      if (status !== 'connected') {
        console.log('🔄 WebSocketProvider: Retrying connection after delay...')
        tryMultipleConnections()
      }
    }, 5000)

    // Add cleanup for the retry timeout
    addCleanup(() => clearTimeout(retryTimeout))

    return () => {
      // Cleanup is handled automatically by useMemoryLeakPrevention
      console.log('🔌 WebSocketProvider: Cleaning up...')

      // Ensure WebSocket is properly disconnected to prevent memory leaks
      try {
        websocketService.disconnect()
      } catch (error) {
        console.warn('Error during WebSocket cleanup:', error)
      }
    }
  }, [])

  const connect = () => {
    console.log('🔌 WebSocketProvider: Manual connect requested')
    websocketService.connect('http://localhost:8002')
  }

  const disconnect = () => {
    console.log('🔌 WebSocketProvider: Manual disconnect requested')
    websocketService.disconnect()
  }

  const value: WebSocketContextType = {
    isConnected,
    connect,
    disconnect
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export default WebSocketProvider
