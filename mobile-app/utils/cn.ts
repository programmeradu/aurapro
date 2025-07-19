/**
 * Simple utility function to merge CSS classes
 * Fallback implementation without external dependencies
 */
export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs
    .filter(Boolean)
    .join(' ')
    .trim()
}

// Type for class values (compatible with clsx)
export type ClassValue = string | number | boolean | undefined | null | ClassArray | ClassDictionary
export interface ClassDictionary {
  [id: string]: any
}
export interface ClassArray extends Array<ClassValue> {}
