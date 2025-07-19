'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  size?: 'mobile' | 'tablet' | 'desktop' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: boolean
  center?: boolean
}

export function ResponsiveContainer({
  children,
  className,
  size = 'mobile',
  padding = 'md',
  spacing = 'md',
  maxWidth = true,
  center = true,
}: ResponsiveContainerProps) {
  const sizeClasses = {
    mobile: maxWidth ? 'max-w-mobile' : 'w-full',
    tablet: maxWidth ? 'max-w-tablet' : 'w-full',
    desktop: maxWidth ? 'max-w-container-desktop' : 'w-full',
    full: 'w-full',
  }

  const paddingClasses = {
    none: '',
    sm: 'px-2 md:px-4',
    md: 'px-mobile',
    lg: 'px-6 md:px-8',
    xl: 'px-8 md:px-12',
  }

  const spacingClasses = {
    none: '',
    sm: 'space-y-2 md:space-y-3',
    md: 'space-mobile',
    lg: 'space-y-6 md:space-y-8',
    xl: 'space-y-8 md:space-y-12',
  }

  return (
    <div
      className={cn(
        'w-full',
        sizeClasses[size],
        paddingClasses[padding],
        spacingClasses[spacing],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2 md:gap-3',
    md: 'gap-mobile',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-12',
  }

  const gridCols = `grid-cols-${cols.mobile || 1} md:grid-cols-${cols.tablet || 2} lg:grid-cols-${cols.desktop || 3}`

  return (
    <div
      className={cn(
        'grid',
        gridCols,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
  href?: string
}

export function ResponsiveCard({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  interactive = false,
  href,
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
    xl: 'p-8 md:p-12',
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-mobile',
    lg: 'shadow-mobile-lg',
  }

  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-mobile',
    lg: 'rounded-mobile-lg',
    xl: 'rounded-mobile-xl',
  }

  const baseClasses = cn(
    'bg-white border border-ui-border',
    paddingClasses[padding],
    shadowClasses[shadow],
    roundedClasses[rounded],
    interactive && 'transition-all duration-200 hover:shadow-floating active:scale-[0.98] tap-target',
    className
  )

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {children}
      </a>
    )
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  )
}

interface ResponsiveButtonProps {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export function ResponsiveButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
}: ResponsiveButtonProps) {
  const variantClasses = {
    primary: 'btn-primary-mobile',
    secondary: 'btn-secondary-mobile',
    ghost: 'btn-ghost-mobile',
    outline: 'border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
  }

  const sizeClasses = {
    sm: 'py-2 px-4 text-sm min-h-[40px]',
    md: 'py-3 px-6 text-base min-h-[48px]',
    lg: 'py-4 px-8 text-lg min-h-[56px]',
    xl: 'py-5 px-10 text-xl min-h-[64px]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

interface ResponsiveInputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ResponsiveInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  error,
  className,
  size = 'md',
}: ResponsiveInputProps) {
  const sizeClasses = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-base',
    lg: 'py-4 px-5 text-lg',
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-ui-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          'input-mobile',
          sizeClasses[size],
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

interface ResponsiveTextareaProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  rows?: number
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
  maxLength?: number
}

export function ResponsiveTextarea({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  required = false,
  disabled = false,
  error,
  className,
  maxLength,
}: ResponsiveTextareaProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-ui-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        className={cn(
          'textarea-mobile',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      
      <div className="flex justify-between items-center">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {maxLength && (
          <p className="text-xs text-gray-500 ml-auto">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
