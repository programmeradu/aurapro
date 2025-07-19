'use client'

import React, { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

// Input variants
const inputVariants = cva(
  [
    'w-full',
    'border border-gray-300',
    'transition-all duration-200',
    'placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'disabled:border-gray-200'
  ],
  {
    variants: {
      variant: {
        default: 'bg-white',
        filled: 'bg-gray-50 border-gray-200 focus:bg-white',
        ghost: 'bg-transparent border-transparent focus:border-gray-300 focus:bg-white'
      },
      
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-base rounded-lg',
        lg: 'h-12 px-5 text-lg rounded-xl'
      },
      
      state: {
        default: '',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
        warning: 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500'
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default'
    }
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  helperText?: string
  errorMessage?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  onClear?: () => void
  showClearButton?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    variant,
    size,
    state,
    type = 'text',
    label,
    helperText,
    errorMessage,
    leftIcon,
    rightIcon,
    loading = false,
    disabled,
    onClear,
    showClearButton = false,
    value,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    // Determine the actual input type
    const inputType = type === 'password' && showPassword ? 'text' : type
    
    // Determine the state based on error
    const inputState = errorMessage ? 'error' : state
    
    // Check if input has value
    const hasValue = value !== undefined && value !== ''
    
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <motion.label
            className={cn(
              'block text-sm font-medium mb-2 transition-colors duration-200',
              inputState === 'error' ? 'text-red-700' : 'text-gray-700',
              disabled && 'text-gray-500'
            )}
            animate={{
              color: isFocused 
                ? inputState === 'error' 
                  ? '#b91c1c' 
                  : '#2563eb'
                : inputState === 'error'
                ? '#b91c1c'
                : '#374151'
            }}
          >
            {label}
          </motion.label>
        )}
        
        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          {/* Input Field */}
          <motion.input
            ref={ref}
            type={inputType}
            value={value}
            disabled={disabled || loading}
            className={cn(
              inputVariants({ variant, size, state: inputState }),
              leftIcon && 'pl-10',
              (rightIcon || type === 'password' || showClearButton || loading) && 'pr-10',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            whileFocus={{ scale: 1.01 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17
            }}
            {...props}
          />
          
          {/* Right Side Icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {/* Loading Spinner */}
            {loading && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"
              />
            )}
            
            {/* Clear Button */}
            {showClearButton && hasValue && !loading && (
              <button
                type="button"
                onClick={onClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {/* Password Toggle */}
            {type === 'password' && !loading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            )}
            
            {/* Custom Right Icon */}
            {rightIcon && !loading && (
              <div className="text-gray-400">
                {rightIcon}
              </div>
            )}
            
            {/* Error Icon */}
            {inputState === 'error' && !loading && (
              <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        
        {/* Helper Text / Error Message */}
        {(helperText || errorMessage) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-2 text-sm',
              errorMessage ? 'text-red-600' : 'text-gray-600'
            )}
          >
            {errorMessage || helperText}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

// Textarea Component
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Pick<InputProps, 'label' | 'helperText' | 'errorMessage' | 'variant' | 'state'> {
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className,
    variant = 'default',
    state = 'default',
    label,
    helperText,
    errorMessage,
    resize = 'vertical',
    disabled,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const inputState = errorMessage ? 'error' : state
    
    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    }[resize]
    
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <motion.label
            className={cn(
              'block text-sm font-medium mb-2 transition-colors duration-200',
              inputState === 'error' ? 'text-red-700' : 'text-gray-700',
              disabled && 'text-gray-500'
            )}
            animate={{
              color: isFocused 
                ? inputState === 'error' 
                  ? '#b91c1c' 
                  : '#2563eb'
                : inputState === 'error'
                ? '#b91c1c'
                : '#374151'
            }}
          >
            {label}
          </motion.label>
        )}
        
        {/* Textarea */}
        <motion.textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            inputVariants({ variant, state: inputState }),
            'min-h-[80px] py-3',
            resizeClass,
            className
          )}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          whileFocus={{ scale: 1.01 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 17
          }}
          {...props}
        />
        
        {/* Helper Text / Error Message */}
        {(helperText || errorMessage) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-2 text-sm',
              errorMessage ? 'text-red-600' : 'text-gray-600'
            )}
          >
            {errorMessage || helperText}
          </motion.p>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Input, Textarea, inputVariants }
