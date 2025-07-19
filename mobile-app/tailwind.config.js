/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Ghana-inspired color palette
      colors: {
        // Primary colors (Ghana flag inspired)
        ghana: {
          red: '#CE1126',
          gold: '#FCD116', 
          green: '#006B3F',
          star: '#000000',
        },
        
        // AURA brand colors
        aura: {
          primary: '#006B3F',    // Ghana green
          secondary: '#FCD116',  // Ghana gold
          accent: '#CE1126',     // Ghana red
          dark: '#1a1a1a',
          light: '#f8f9fa',
        },
        
        // Transport-specific colors
        transport: {
          bus: '#3B82F6',        // Blue for buses
          trotro: '#F59E0B',     // Amber for tro-tros
          taxi: '#EF4444',       // Red for taxis
          walking: '#10B981',    // Green for walking
          route: '#8B5CF6',      // Purple for routes
        },
        
        // Status colors
        status: {
          online: '#10B981',     // Green
          offline: '#EF4444',    // Red
          delayed: '#F59E0B',    // Amber
          ontime: '#3B82F6',     // Blue
        },
        
        // UI colors
        ui: {
          background: '#ffffff',
          surface: '#f8f9fa',
          border: '#e5e7eb',
          text: {
            primary: '#111827',
            secondary: '#6b7280',
            muted: '#9ca3af',
          }
        }
      },
      
      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      // Spacing for mobile
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // Safe area spacing
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        // Mobile-specific spacing
        '22': '5.5rem',     // 88px
        '26': '6.5rem',     // 104px
        '30': '7.5rem',     // 120px
        '34': '8.5rem',     // 136px
        '38': '9.5rem',     // 152px
      },
      
      // Mobile-first breakpoints
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Ghana mobile device specific breakpoints
        'mobile-s': '320px',    // Small phones (Galaxy S5, iPhone 5/SE)
        'mobile-m': '375px',    // Medium phones (iPhone 6/7/8)
        'mobile-l': '425px',    // Large phones (iPhone 6/7/8 Plus)
        'tablet': '768px',      // Tablets (iPad)
        'laptop': '1024px',     // Laptops
        'laptop-l': '1440px',   // Large laptops
        '4k': '2560px',         // 4K displays
        // Orientation and interaction breakpoints
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
        'reduced-motion': { 'raw': '(prefers-reduced-motion: reduce)' },
      },
      
      // Animation and transitions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      
      // Box shadows for mobile UI
      boxShadow: {
        'mobile': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'mobile-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'floating': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      
      // Border radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      // Mobile-specific utilities
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'touch-target': '44px',
        'touch-target-large': '56px',
      },

      // Mobile-optimized max widths
      maxWidth: {
        'mobile': '425px',
        'tablet': '768px',
        'container-mobile': '100%',
        'container-tablet': '640px',
        'container-desktop': '1280px',
      },

      // Mobile typography
      fontSize: {
        'xs-mobile': ['0.75rem', { lineHeight: '1rem' }],
        'sm-mobile': ['0.875rem', { lineHeight: '1.25rem' }],
        'base-mobile': ['1rem', { lineHeight: '1.5rem' }],
        'lg-mobile': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl-mobile': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl-mobile': ['1.5rem', { lineHeight: '2rem' }],
      },
      
      // Grid templates
      gridTemplateColumns: {
        'mobile-nav': 'repeat(4, 1fr)',
        'mobile-cards': 'repeat(auto-fit, minmax(150px, 1fr))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    
    // Custom plugin for mobile utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Safe area utilities for mobile
        '.pt-safe': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.pb-safe': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.pl-safe': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.pr-safe': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        
        // Touch-friendly tap targets
        '.tap-target': {
          minHeight: '44px',
          minWidth: '44px',
        },
        
        // Mobile scrolling
        '.scroll-smooth-mobile': {
          scrollBehavior: 'smooth',
          '-webkit-overflow-scrolling': 'touch',
        },
        
        // Hide scrollbars
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        
        // Glass morphism effect
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      }
      
      addUtilities(newUtilities)
    },
  ],
}
