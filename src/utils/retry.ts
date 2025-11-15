/**
 * Retry utility for async operations with exponential backoff
 * Implements best practices for retry logic with configurable attempts and delays
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryableErrors'>> & { retryableErrors?: (error: Error) => boolean } = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Determines if an error is retryable
 */
const isRetryableError = (error: Error): boolean => {
  // Network errors, timeouts, and 5xx errors are typically retryable
  const retryableMessages = [
    'network',
    'timeout',
    'failed to fetch',
    'network error',
    'connection',
  ];
  
  const message = error.message.toLowerCase();
  return retryableMessages.some(keyword => message.includes(keyword));
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retries an async operation with exponential backoff
 * @param operation The async operation to retry
 * @param options Retry configuration options
 * @returns Promise resolving to the operation result
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { maxAttempts, initialDelay, maxDelay, backoffMultiplier, retryableErrors } = config;
  
  let lastError: Error | null = null;
  let delay = initialDelay;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const shouldRetry = retryableErrors 
        ? retryableErrors(lastError)
        : isRetryableError(lastError);
      
      // Don't retry if error is not retryable or we've exhausted attempts
      if (!shouldRetry || attempt === maxAttempts) {
        throw lastError;
      }
      
      // Wait before retrying with exponential backoff
      await sleep(Math.min(delay, maxDelay));
      delay *= backoffMultiplier;
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

