/**
 * 🎨 AURA Design System
 * Apple-level aesthetics and modern design principles
 * 
 * Export all design system components, tokens, and utilities
 */

// Design Tokens
export * from './tokens'

// Utilities
export * from './utils'

// Components
export * from './components/Button'
export * from './components/Card'
export * from './components/Input'

// Re-export commonly used types
export type { VariantProps } from 'class-variance-authority'

// Design System Configuration
export const designSystem = {
  name: 'AURA Design System',
  version: '1.0.0',
  description: 'Apple-level aesthetics for Ghana transport solutions',
  
  // Core principles
  principles: [
    'Clarity - Clear visual hierarchy and intuitive interactions',
    'Deference - Content takes priority over interface elements', 
    'Depth - Realistic motion and layering create understanding',
    'Accessibility - Inclusive design for all users',
    'Performance - Smooth 60fps animations and interactions',
    'Consistency - Unified experience across all touchpoints'
  ],
  
  // Color philosophy
  colors: {
    philosophy: 'Colors should enhance usability and create emotional connection',
    primary: 'Blue represents trust, reliability, and technology',
    secondary: 'Gray provides neutral foundation and professional feel',
    semantic: 'Green for success, red for errors, yellow for warnings',
    ghana: 'National colors for cultural connection and pride'
  },
  
  // Typography philosophy  
  typography: {
    philosophy: 'Typography should be readable, accessible, and hierarchical',
    system: 'San Francisco (iOS) / Roboto (Android) / System fonts',
    scale: 'Modular scale for consistent rhythm and hierarchy',
    weights: 'Strategic use of weight for emphasis and hierarchy'
  },
  
  // Spacing philosophy
  spacing: {
    philosophy: '8px grid system for consistent rhythm and alignment',
    base: '8px',
    scale: 'Multiples of 4px for fine-tuning, 8px for major spacing'
  },
  
  // Animation philosophy
  animation: {
    philosophy: 'Meaningful motion that guides attention and provides feedback',
    duration: '200-300ms for micro-interactions, 500ms+ for transitions',
    easing: 'Apple-style spring animations for natural feel',
    performance: 'GPU-accelerated transforms for smooth 60fps'
  },
  
  // Component philosophy
  components: {
    philosophy: 'Composable, accessible, and consistent building blocks',
    variants: 'Multiple variants for different contexts and hierarchies',
    states: 'Clear visual feedback for all interactive states',
    responsive: 'Mobile-first design with progressive enhancement'
  }
} as const

// Theme configuration
export const theme = {
  // Breakpoints (mobile-first)
  screens: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Color palette
  colors: {
    // Brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe', 
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    
    // Neutral colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db', 
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    },
    
    // Semantic colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    },
    
    warning: {
      50: '#fffbeb', 
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309'
    },
    
    error: {
      50: '#fef2f2',
      500: '#ef4444', 
      600: '#dc2626',
      700: '#b91c1c'
    },
    
    // Ghana colors
    ghana: {
      gold: '#FFD700',
      green: '#006B3C', 
      red: '#CE1126',
      black: '#000000'
    }
  },
  
  // Typography
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont', 
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ],
    mono: [
      'SF Mono',
      'Monaco', 
      'Inconsolata',
      'Roboto Mono',
      'monospace'
    ]
  },
  
  // Spacing (8px grid)
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px', 
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px'
  },
  
  // Border radius
  borderRadius: {
    none: '0px',
    sm: '2px',
    base: '4px',
    md: '6px', 
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px'
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  },
  
  // Animation
  transitionDuration: {
    75: '75ms',
    100: '100ms',
    150: '150ms', 
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms'
  },
  
  transitionTimingFunction: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)', 
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    apple: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
  }
} as const

// Export theme type
export type Theme = typeof theme
