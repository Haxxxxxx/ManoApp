import { useState, useCallback } from 'react';
import {
  httpsCallable,
} from 'firebase/functions';
import { functions } from '../firebase/config';

interface FunctionsState {
  loading: boolean;
  error: Error | null;
}

interface FunctionsActions {
  callFunction: <T = unknown, R = unknown>(name: string, data?: T) => Promise<R>;
}

/**
 * Custom hook for handling Firebase Functions
 * @returns Object containing functions state and actions
 */
export function useFunctions(): FunctionsState & FunctionsActions {
  const [state, setState] = useState<FunctionsState>({
    loading: false,
    error: null
  });

  /**
   * Call a Firebase Function
   * @param name - Name of the function to call
   * @param data - Optional data to pass to the function
   * @returns Promise resolving to the function result
   */
  const callFunction = useCallback(async <T = unknown, R = unknown>(
    name: string,
    data?: T
  ): Promise<R> => {
    if (!functions) {
      throw new Error('Functions service is not available');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const functionCall = httpsCallable<T, R>(functions, name);
      const result = await functionCall(data);

      setState(prev => ({ ...prev, loading: false }));
      return result.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Function call failed')
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    callFunction
  };
} 