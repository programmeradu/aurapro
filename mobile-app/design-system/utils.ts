/**
 * 🛠️ Design System Utilities
 * Helper functions for consistent styling and behavior
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate consistent focus ring styles
 */
export function focusRing(color: string = 'blue') {
  return `focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2`
}

/**
 * Generate consistent hover transition styles
 */
export function hoverTransition() {
  return 'transition-all duration-200 ease-in-out'
}

/**
 * Generate consistent shadow styles based on elevation
 */
export function elevation(level: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md') {
  const shadows = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  }
  return shadows[level]
}

/**
 * Generate responsive padding classes
 */
export function responsivePadding(
  mobile: string = 'p-4',
  tablet: string = 'md:p-6',
  desktop: string = 'lg:p-8'
) {
  return `${mobile} ${tablet} ${desktop}`
}

/**
 * Generate consistent border radius for different component types
 */
export function borderRadius(type: 'button' | 'card' | 'input' | 'modal' = 'button') {
  const radii = {
    button: 'rounded-lg',
    card: 'rounded-xl',
    input: 'rounded-lg',
    modal: 'rounded-2xl'
  }
  return radii[type]
}

/**
 * Generate consistent spacing between elements
 */
export function spacing(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md') {
  const spaces = {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  }
  return spaces[size]
}

/**
 * Generate consistent text styles
 */
export function textStyle(
  variant: 'heading' | 'subheading' | 'body' | 'caption' | 'overline' = 'body'
) {
  const styles = {
    heading: 'text-2xl font-bold text-gray-900',
    subheading: 'text-lg font-semibold text-gray-800',
    body: 'text-base text-gray-700',
    caption: 'text-sm text-gray-600',
    overline: 'text-xs font-medium text-gray-500 uppercase tracking-wide'
  }
  return styles[variant]
}

/**
 * Generate consistent animation classes
 */
export function animation(type: 'fadeIn' | 'slideUp' | 'slideDown' | 'scaleIn' | 'bounce' = 'fadeIn') {
  const animations = {
    fadeIn: 'animate-in fade-in duration-200',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    slideDown: 'animate-in slide-in-from-top-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200',
    bounce: 'animate-bounce'
  }
  return animations[type]
}

/**
 * Generate consistent grid layouts
 */
export function gridLayout(
  columns: 1 | 2 | 3 | 4 | 6 | 12 = 1,
  gap: 'sm' | 'md' | 'lg' = 'md'
) {
  const cols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  }
  
  const gaps = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  }
  
  return `grid ${cols[columns]} ${gaps[gap]}`
}

/**
 * Generate consistent flex layouts
 */
export function flexLayout(
  direction: 'row' | 'col' = 'row',
  align: 'start' | 'center' | 'end' | 'stretch' = 'center',
  justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' = 'start',
  gap: 'sm' | 'md' | 'lg' = 'md'
) {
  const directions = {
    row: 'flex-row',
    col: 'flex-col'
  }
  
  const alignments = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }
  
  const justifications = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }
  
  const gaps = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }
  
  return `flex ${directions[direction]} ${alignments[align]} ${justifications[justify]} ${gaps[gap]}`
}

/**
 * Generate consistent container styles
 */
export function container(
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' = 'lg',
  padding: boolean = true
) {
  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }
  
  const paddingClass = padding ? 'px-4 sm:px-6 lg:px-8' : ''
  
  return `mx-auto ${widths[maxWidth]} ${paddingClass}`
}

/**
 * Generate consistent backdrop blur styles
 */
export function backdropBlur(intensity: 'sm' | 'md' | 'lg' | 'xl' = 'md') {
  const blurs = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  }
  return blurs[intensity]
}

/**
 * Generate consistent glassmorphism effect
 */
export function glassmorphism(
  background: string = 'bg-white/80',
  blur: 'sm' | 'md' | 'lg' = 'md',
  border: boolean = true
) {
  const borderClass = border ? 'border border-white/20' : ''
  return `${background} ${backdropBlur(blur)} ${borderClass}`
}

/**
 * Generate consistent loading skeleton styles
 */
export function skeleton(
  width: string = 'w-full',
  height: string = 'h-4',
  rounded: boolean = true
) {
  const roundedClass = rounded ? 'rounded' : ''
  return `${width} ${height} ${roundedClass} bg-gray-200 animate-pulse`
}

/**
 * Generate consistent truncation styles
 */
export function truncate(lines: 1 | 2 | 3 | 4 = 1) {
  if (lines === 1) {
    return 'truncate'
  }
  return `line-clamp-${lines}`
}

/**
 * Generate consistent screen reader only styles
 */
export function srOnly() {
  return 'sr-only'
}

/**
 * Generate consistent visually hidden styles
 */
export function visuallyHidden() {
  return 'absolute w-px h-px p-0 -m-px overflow-hidden clip-rect(0,0,0,0) whitespace-nowrap border-0'
}
