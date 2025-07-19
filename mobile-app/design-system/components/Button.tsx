'use client'

import React, { forwardRef } from 'react'
import { motion, MotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils'

// Button variants using CVA for type-safe styling
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center',
    'font-medium text-sm',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95',
    'select-none'
  ],
  {
    variants: {
      variant: {
        // Primary - Apple blue
        primary: [
          'bg-blue-600 text-white',
          'hover:bg-blue-700',
          'focus:ring-blue-500',
          'shadow-sm hover:shadow-md',
          'border border-transparent'
        ],
        
        // Secondary - Subtle gray
        secondary: [
          'bg-gray-100 text-gray-900',
          'hover:bg-gray-200',
          'focus:ring-gray-500',
          'border border-gray-200',
          'hover:border-gray-300'
        ],
        
        // Outline - Clean border
        outline: [
          'bg-transparent text-gray-700',
          'border border-gray-300',
          'hover:bg-gray-50 hover:border-gray-400',
          'focus:ring-gray-500'
        ],
        
        // Ghost - Minimal
        ghost: [
          'bg-transparent text-gray-600',
          'hover:bg-gray-100 hover:text-gray-900',
          'focus:ring-gray-500',
          'border border-transparent'
        ],
        
        // Destructive - Red
        destructive: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'focus:ring-red-500',
          'shadow-sm hover:shadow-md',
          'border border-transparent'
        ],
        
        // Success - Green
        success: [
          'bg-green-600 text-white',
          'hover:bg-green-700',
          'focus:ring-green-500',
          'shadow-sm hover:shadow-md',
          'border border-transparent'
        ]
      },
      
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-xl',
        xl: 'h-14 px-8 text-lg rounded-2xl',
        icon: 'h-10 w-10 rounded-lg'
      },
      
      fullWidth: {
        true: 'w-full'
      }
    },
    
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants>,
    Omit<MotionProps, 'children'> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={isDisabled}
        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17
        }}
        {...props}
      >
        {/* Left Icon */}
        {leftIcon && !loading && (
          <span className="mr-2 -ml-1">
            {leftIcon}
          </span>
        )}
        
        {/* Loading Spinner */}
        {loading && (
          <motion.div
            className="mr-2 -ml-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.div>
        )}
        
        {/* Button Text */}
        {children}
        
        {/* Right Icon */}
        {rightIcon && !loading && (
          <span className="ml-2 -mr-1">
            {rightIcon}
          </span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
