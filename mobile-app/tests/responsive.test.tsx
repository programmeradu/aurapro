/**
 * Mobile Responsiveness Tests
 * Tests for responsive design and mobile-specific functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import '@testing-library/jest-dom'
import { useResponsive, useGhanaDeviceDetection, useSafeArea } from '@/hooks/useResponsive'
import { ResponsiveContainer, ResponsiveGrid, ResponsiveCard, ResponsiveButton } from '@/components/ui/ResponsiveContainer'

// Mock window properties for testing
const mockWindow = (width: number, height: number, userAgent: string = '') => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: userAgent,
  })
}

// Test component for responsive hooks
function TestResponsiveComponent() {
  const responsive = useResponsive()
  const deviceInfo = useGhanaDeviceDetection()
  const safeArea = useSafeArea()

  return (
    <div>
      <div data-testid="is-mobile">{responsive.isMobile.toString()}</div>
      <div data-testid="is-tablet">{responsive.isTablet.toString()}</div>
      <div data-testid="is-desktop">{responsive.isDesktop.toString()}</div>
      <div data-testid="screen-width">{responsive.screenWidth}</div>
      <div data-testid="orientation">{responsive.orientation}</div>
      <div data-testid="is-low-end">{deviceInfo.isLowEndDevice.toString()}</div>
      <div data-testid="safe-area-top">{safeArea.top}</div>
    </div>
  )
}

describe('Responsive Hooks', () => {
  beforeEach(() => {
    // Reset window size before each test
    mockWindow(375, 667) // iPhone 6/7/8 size
  })

  describe('useResponsive', () => {
    it('should detect mobile screen size correctly', async () => {
      mockWindow(375, 667)
      
      render(<TestResponsiveComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('true')
        expect(screen.getByTestId('is-tablet')).toHaveTextContent('false')
        expect(screen.getByTestId('is-desktop')).toHaveTextContent('false')
        expect(screen.getByTestId('screen-width')).toHaveTextContent('375')
      })
    })

    it('should detect tablet screen size correctly', async () => {
      mockWindow(768, 1024)
      
      render(<TestResponsiveComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('false')
        expect(screen.getByTestId('is-tablet')).toHaveTextContent('true')
        expect(screen.getByTestId('is-desktop')).toHaveTextContent('false')
      })
    })

    it('should detect desktop screen size correctly', async () => {
      mockWindow(1280, 720)
      
      render(<TestResponsiveComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('false')
        expect(screen.getByTestId('is-tablet')).toHaveTextContent('false')
        expect(screen.getByTestId('is-desktop')).toHaveTextContent('true')
      })
    })

    it('should detect orientation correctly', async () => {
      // Portrait
      mockWindow(375, 667)
      render(<TestResponsiveComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('orientation')).toHaveTextContent('portrait')
      })

      // Landscape
      act(() => {
        mockWindow(667, 375)
        fireEvent(window, new Event('orientationchange'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('orientation')).toHaveTextContent('landscape')
      })
    })
  })

  describe('useGhanaDeviceDetection', () => {
    it('should detect low-end Android devices', async () => {
      mockWindow(375, 667, 'Mozilla/5.0 (Linux; Android 4.4; SM-G313HZ) AppleWebKit/537.36')
      
      render(<TestResponsiveComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('is-low-end')).toHaveTextContent('true')
      })
    })

    it('should detect Android Go devices', async () => {
      mockWindow(375, 667, 'Mozilla/5.0 (Linux; Android 8.1.0; Nokia 1 Go) AppleWebKit/537.36')
      
      render(<TestResponsiveComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('is-low-end')).toHaveTextContent('true')
      })
    })
  })
})

describe('Responsive Components', () => {
  describe('ResponsiveContainer', () => {
    it('should render with mobile-first classes', () => {
      render(
        <ResponsiveContainer size="mobile" data-testid="container">
          <div>Content</div>
        </ResponsiveContainer>
      )
      
      const container = screen.getByTestId('container')
      expect(container).toHaveClass('max-w-mobile')
      expect(container).toHaveClass('mx-auto')
    })

    it('should apply correct padding classes', () => {
      render(
        <ResponsiveContainer padding="lg" data-testid="container">
          <div>Content</div>
        </ResponsiveContainer>
      )
      
      const container = screen.getByTestId('container')
      expect(container).toHaveClass('px-6')
    })
  })

  describe('ResponsiveGrid', () => {
    it('should render with responsive grid classes', () => {
      render(
        <ResponsiveGrid 
          cols={{ mobile: 1, tablet: 2, desktop: 3 }}
          data-testid="grid"
        >
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      )
      
      const grid = screen.getByTestId('grid')
      expect(grid).toHaveClass('grid')
      expect(grid).toHaveClass('grid-cols-1')
    })
  })

  describe('ResponsiveCard', () => {
    it('should render with mobile-optimized styles', () => {
      render(
        <ResponsiveCard data-testid="card">
          <div>Card content</div>
        </ResponsiveCard>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-white')
      expect(card).toHaveClass('rounded-mobile')
      expect(card).toHaveClass('shadow-mobile')
    })

    it('should handle interactive states', () => {
      render(
        <ResponsiveCard interactive data-testid="card">
          <div>Interactive card</div>
        </ResponsiveCard>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('transition-all')
      expect(card).toHaveClass('hover:shadow-floating')
    })
  })

  describe('ResponsiveButton', () => {
    it('should render with mobile-friendly touch targets', () => {
      render(
        <ResponsiveButton data-testid="button">
          Click me
        </ResponsiveButton>
      )
      
      const button = screen.getByTestId('button')
      expect(button).toHaveClass('min-h-[48px]')
      expect(button).toHaveClass('btn-primary-mobile')
    })

    it('should handle loading state', () => {
      render(
        <ResponsiveButton loading data-testid="button">
          Click me
        </ResponsiveButton>
      )
      
      const button = screen.getByTestId('button')
      expect(button).toBeDisabled()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should handle full width on mobile', () => {
      render(
        <ResponsiveButton fullWidth data-testid="button">
          Full width
        </ResponsiveButton>
      )
      
      const button = screen.getByTestId('button')
      expect(button).toHaveClass('w-full')
    })
  })
})

describe('Touch and Gesture Support', () => {
  it('should handle touch events properly', () => {
    const handleClick = jest.fn()
    
    render(
      <ResponsiveButton onClick={handleClick} data-testid="button">
        Touch me
      </ResponsiveButton>
    )
    
    const button = screen.getByTestId('button')
    
    // Simulate touch
    fireEvent.touchStart(button)
    fireEvent.touchEnd(button)
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalled()
  })
})

describe('Accessibility on Mobile', () => {
  it('should have proper touch target sizes', () => {
    render(
      <ResponsiveButton data-testid="button">
        Accessible button
      </ResponsiveButton>
    )
    
    const button = screen.getByTestId('button')
    const styles = getComputedStyle(button)
    
    // Check minimum touch target size (44px)
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44)
  })

  it('should have proper focus states', () => {
    render(
      <ResponsiveButton data-testid="button">
        Focus me
      </ResponsiveButton>
    )
    
    const button = screen.getByTestId('button')
    
    fireEvent.focus(button)
    expect(button).toHaveFocus()
  })
})

describe('Performance on Low-End Devices', () => {
  it('should render efficiently with minimal DOM nodes', () => {
    const { container } = render(
      <ResponsiveContainer>
        <ResponsiveGrid cols={{ mobile: 2 }}>
          <ResponsiveCard>Item 1</ResponsiveCard>
          <ResponsiveCard>Item 2</ResponsiveCard>
        </ResponsiveGrid>
      </ResponsiveContainer>
    )
    
    // Check that we're not creating excessive DOM nodes
    const allElements = container.querySelectorAll('*')
    expect(allElements.length).toBeLessThan(20)
  })
})
