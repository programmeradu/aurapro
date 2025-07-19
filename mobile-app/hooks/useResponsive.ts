'use client'

import { useState, useEffect } from 'react'

interface BreakpointConfig {
  mobile: number
  tablet: number
  desktop: number
}

interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  screenHeight: number
  orientation: 'portrait' | 'landscape'
  isTouch: boolean
  devicePixelRatio: number
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
}

/**
 * Hook for responsive design and device detection
 * Optimized for Ghana's mobile device ecosystem
 */
export function useResponsive(breakpoints: BreakpointConfig = defaultBreakpoints): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: true, // Default to mobile-first
    isTablet: false,
    isDesktop: false,
    screenWidth: 375, // Default mobile width
    screenHeight: 667, // Default mobile height
    orientation: 'portrait',
    isTouch: true, // Default to touch device
    devicePixelRatio: 1,
  })

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const orientation = width > height ? 'landscape' : 'portrait'
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const devicePixelRatio = window.devicePixelRatio || 1

      setState({
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
        isDesktop: width >= breakpoints.desktop,
        screenWidth: width,
        screenHeight: height,
        orientation,
        isTouch,
        devicePixelRatio,
      })
    }

    // Initial update
    updateState()

    // Listen for resize events
    window.addEventListener('resize', updateState)
    window.addEventListener('orientationchange', updateState)

    return () => {
      window.removeEventListener('resize', updateState)
      window.removeEventListener('orientationchange', updateState)
    }
  }, [breakpoints])

  return state
}

/**
 * Hook for detecting specific Ghana mobile devices
 */
export function useGhanaDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isLowEndDevice: false,
    isSlowConnection: false,
    batteryLevel: null as number | null,
    memoryInfo: null as any,
  })

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      // Detect low-end devices common in Ghana
      const isLowEndDevice = 
        /android.*4\.[0-4]/.test(userAgent) || // Old Android versions
        /android.*go/.test(userAgent) || // Android Go devices
        navigator.hardwareConcurrency <= 2 || // Low CPU cores
        (navigator as any).deviceMemory <= 2 // Low RAM

      // Detect slow connections
      const isSlowConnection = 
        connection?.effectiveType === 'slow-2g' ||
        connection?.effectiveType === '2g' ||
        connection?.downlink < 1

      setDeviceInfo({
        isLowEndDevice,
        isSlowConnection,
        batteryLevel: null,
        memoryInfo: (navigator as any).deviceMemory || null,
      })
    }

    detectDevice()

    // Listen for connection changes
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', detectDevice)
      return () => connection.removeEventListener('change', detectDevice)
    }
  }, [])

  return deviceInfo
}

/**
 * Hook for safe area insets (notches, home indicators)
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement)
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)
    window.addEventListener('orientationchange', updateSafeArea)

    return () => {
      window.removeEventListener('resize', updateSafeArea)
      window.removeEventListener('orientationchange', updateSafeArea)
    }
  }, [])

  return safeArea
}

/**
 * Hook for viewport height handling (mobile browser address bar)
 */
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState({
    vh: window.innerHeight,
    dvh: window.innerHeight, // Dynamic viewport height
    svh: window.screen.height, // Static viewport height
  })

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight({
        vh: window.innerHeight,
        dvh: window.visualViewport?.height || window.innerHeight,
        svh: window.screen.height,
      })
    }

    updateHeight()

    window.addEventListener('resize', updateHeight)
    window.visualViewport?.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
      window.visualViewport?.removeEventListener('resize', updateHeight)
    }
  }, [])

  return viewportHeight
}

/**
 * Hook for touch gesture detection
 */
export function useTouchGestures() {
  const [gestures, setGestures] = useState({
    isSwipeEnabled: true,
    swipeThreshold: 50,
    tapTimeout: 300,
  })

  const handleSwipe = (
    element: HTMLElement,
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    onSwipeUp?: () => void,
    onSwipeDown?: () => void
  ) => {
    let startX = 0
    let startY = 0
    let startTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!gestures.isSwipeEnabled) return

      const touch = e.changedTouches[0]
      const endX = touch.clientX
      const endY = touch.clientY
      const endTime = Date.now()

      const deltaX = endX - startX
      const deltaY = endY - startY
      const deltaTime = endTime - startTime

      // Ignore if too slow or too short
      if (deltaTime > 500 || (Math.abs(deltaX) < gestures.swipeThreshold && Math.abs(deltaY) < gestures.swipeThreshold)) {
        return
      }

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.()
        } else {
          onSwipeUp?.()
        }
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }

  return { gestures, setGestures, handleSwipe }
}

/**
 * Hook for responsive font scaling
 */
export function useResponsiveFontSize() {
  const { screenWidth, isMobile } = useResponsive()
  
  const getFontScale = () => {
    if (screenWidth < 320) return 0.85 // Very small phones
    if (screenWidth < 375) return 0.9  // Small phones
    if (screenWidth < 414) return 1.0  // Medium phones
    if (screenWidth < 768) return 1.1  // Large phones
    return 1.0 // Tablets and desktop
  }

  const scale = getFontScale()

  return {
    scale,
    isMobile,
    getScaledSize: (baseSize: number) => Math.round(baseSize * scale),
  }
}
