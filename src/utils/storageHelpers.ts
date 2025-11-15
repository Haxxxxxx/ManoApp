import { STORAGE_KEYS } from './constants';

// Re-export STORAGE_KEYS for convenience
export { STORAGE_KEYS };

/**
 * Safe localStorage operations with error handling
 */
export const storageHelpers = {
  /**
   * Get item from localStorage with error handling
   */
  getItem: <T = unknown>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      // Silently fail for localStorage operations
      return null;
    }
  },

  /**
   * Set item in localStorage with error handling
   */
  setItem: <T = unknown>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      // Silently fail for localStorage operations
      return false;
    }
  },

  /**
   * Remove item from localStorage with error handling
   */
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      // Silently fail for localStorage operations
      return false;
    }
  },

  /**
   * Clear all localStorage items
   */
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  }
};

/**
 * Helper to extract error message from various error types
 */
export function getErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}

/**
 * Helper to create error object from various error types
 */
export function toError(error: unknown, defaultMessage: string = 'An error occurred'): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error(defaultMessage);
}

