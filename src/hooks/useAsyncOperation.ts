import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/storageHelpers';

interface UseAsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseAsyncOperationReturn {
  loading: boolean;
  error: string | null;
  execute: <T>(operation: () => Promise<T>) => Promise<T | null>;
  clearError: () => void;
}

/**
 * Custom hook for managing async operations with loading and error states
 * Provides consistent error handling and state management
 */
export function useAsyncOperation(
  options: UseAsyncOperationOptions = {}
): UseAsyncOperationReturn {
  const { onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T,>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      onSuccess?.();
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Operation failed');
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
}

