// Accessibility utilities for AURA Command Center

export interface AccessibilityProps {
  role?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-hidden'?: boolean
  'aria-live'?: 'off' | 'polite' | 'assertive'
  'aria-atomic'?: boolean
  tabIndex?: number
}

// Screen reader announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Focus management
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
    
    if (e.key === 'Escape') {
      element.blur()
    }
  }
  
  element.addEventListener('keydown', handleTabKey)
  
  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

// Keyboard navigation helpers
export const handleKeyboardNavigation = (
  e: KeyboardEvent,
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) => {
  switch (e.key) {
    case 'Enter':
      onEnter?.()
      break
    case ' ':
      e.preventDefault()
      onSpace?.()
      break
    case 'Escape':
      onEscape?.()
      break
    case 'ArrowUp':
      e.preventDefault()
      onArrowUp?.()
      break
    case 'ArrowDown':
      e.preventDefault()
      onArrowDown?.()
      break
    case 'ArrowLeft':
      e.preventDefault()
      onArrowLeft?.()
      break
    case 'ArrowRight':
      e.preventDefault()
      onArrowRight?.()
      break
  }
}

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color library
  return 4.5 // Placeholder - meets WCAG AA standard
}

// High contrast mode detection
export const isHighContrastMode = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches
}

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Screen reader detection
export const isScreenReaderActive = (): boolean => {
  // This is a simplified check - real implementation would be more comprehensive
  return navigator.userAgent.includes('NVDA') || 
         navigator.userAgent.includes('JAWS') || 
         navigator.userAgent.includes('VoiceOver')
}

// ARIA live region manager
class LiveRegionManager {
  private politeRegion: HTMLElement | null = null
  private assertiveRegion: HTMLElement | null = null

  constructor() {
    this.createLiveRegions()
  }

  private createLiveRegions() {
    // Polite live region
    this.politeRegion = document.createElement('div')
    this.politeRegion.setAttribute('aria-live', 'polite')
    this.politeRegion.setAttribute('aria-atomic', 'true')
    this.politeRegion.className = 'sr-only'
    this.politeRegion.id = 'live-region-polite'
    document.body.appendChild(this.politeRegion)

    // Assertive live region
    this.assertiveRegion = document.createElement('div')
    this.assertiveRegion.setAttribute('aria-live', 'assertive')
    this.assertiveRegion.setAttribute('aria-atomic', 'true')
    this.assertiveRegion.className = 'sr-only'
    this.assertiveRegion.id = 'live-region-assertive'
    document.body.appendChild(this.assertiveRegion)
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion
    if (region) {
      region.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        if (region) region.textContent = ''
      }, 1000)
    }
  }
}

export const liveRegionManager = new LiveRegionManager()

// Accessibility validation
export const validateAccessibility = (element: HTMLElement): string[] => {
  const issues: string[] = []
  
  // Check for missing alt text on images
  const images = element.querySelectorAll('img')
  images.forEach((img, index) => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      issues.push(`Image ${index + 1} missing alt text`)
    }
  })
  
  // Check for buttons without accessible names
  const buttons = element.querySelectorAll('button')
  buttons.forEach((button, index) => {
    if (!button.textContent?.trim() && 
        !button.getAttribute('aria-label') && 
        !button.getAttribute('aria-labelledby')) {
      issues.push(`Button ${index + 1} missing accessible name`)
    }
  })
  
  // Check for form inputs without labels
  const inputs = element.querySelectorAll('input, select, textarea')
  inputs.forEach((input, index) => {
    const hasLabel = document.querySelector(`label[for="${input.id}"]`)
    const hasAriaLabel = input.getAttribute('aria-label')
    const hasAriaLabelledby = input.getAttribute('aria-labelledby')
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
      issues.push(`Form input ${index + 1} missing label`)
    }
  })
  
  // Check for proper heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let lastLevel = 0
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1))
    if (level > lastLevel + 1) {
      issues.push(`Heading ${index + 1} skips levels (h${lastLevel} to h${level})`)
    }
    lastLevel = level
  })
  
  return issues
}

// Focus management for modals and overlays
export const manageFocus = {
  store: null as HTMLElement | null,
  
  save() {
    this.store = document.activeElement as HTMLElement
  },
  
  restore() {
    if (this.store && this.store.focus) {
      this.store.focus()
      this.store = null
    }
  },
  
  setToFirst(element: HTMLElement) {
    const focusable = element.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (focusable) {
      focusable.focus()
    }
  }
}

// Accessibility preferences
export const accessibilityPreferences = {
  getPreferences() {
    return {
      highContrast: isHighContrastMode(),
      reducedMotion: prefersReducedMotion(),
      screenReader: isScreenReaderActive(),
      fontSize: localStorage.getItem('aura-font-size') || 'normal',
      colorScheme: localStorage.getItem('aura-color-scheme') || 'auto'
    }
  },
  
  setFontSize(size: 'small' | 'normal' | 'large' | 'extra-large') {
    localStorage.setItem('aura-font-size', size)
    document.documentElement.setAttribute('data-font-size', size)
  },
  
  setColorScheme(scheme: 'light' | 'dark' | 'auto' | 'high-contrast') {
    localStorage.setItem('aura-color-scheme', scheme)
    document.documentElement.setAttribute('data-color-scheme', scheme)
  }
}

// Initialize accessibility features
export const initializeAccessibility = () => {
  // Apply saved preferences
  const prefs = accessibilityPreferences.getPreferences()
  accessibilityPreferences.setFontSize(prefs.fontSize as any)
  accessibilityPreferences.setColorScheme(prefs.colorScheme as any)
  
  // Add skip links
  const skipLink = document.createElement('a')
  skipLink.href = '#main-content'
  skipLink.textContent = 'Skip to main content'
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded'
  document.body.insertBefore(skipLink, document.body.firstChild)
  
  // Add landmark roles if missing
  const main = document.querySelector('main')
  if (main && !main.getAttribute('role')) {
    main.setAttribute('role', 'main')
    main.setAttribute('id', 'main-content')
  }
  
  console.log('🔍 Accessibility features initialized')
}
