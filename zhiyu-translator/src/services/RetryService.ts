import { TranslationError, TranslationErrorType } from '../types/errors';
import { isErrorRecoverable } from '../utils/errorUtils';

/**
 * Interface for retry options
 */
export interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  retryMultiplier: number;
  maxDelay?: number;
  shouldRetry?: (error: TranslationError) => boolean;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  retryMultiplier: 1.5,
  maxDelay: 10000
};

/**
 * Service for handling retry logic
 */
export class RetryService {
  /**
   * Execute a function with retry logic
   * @param fn Function to execute
   * @param options Retry options
   * @returns Promise that resolves with the function result
   */
  public static async withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    // Merge with default options
    const retryOptions: RetryOptions = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options
    };

    let lastError: TranslationError | Error | null = null;
    let attempt = 0;

    while (attempt <= retryOptions.maxRetries) {
      try {
        // Execute the function
        return await fn();
      } catch (error) {
        lastError = error as TranslationError | Error;
        attempt++;

        // Check if we should retry
        const shouldRetry = RetryService.shouldRetry(lastError, attempt, retryOptions);

        if (!shouldRetry) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = RetryService.calculateDelay(attempt, retryOptions);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    throw lastError;
  }

  /**
   * Determine if a retry should be attempted
   * @param error Error that occurred
   * @param attempt Current attempt number
   * @param options Retry options
   * @returns Boolean indicating if retry should be attempted
   */
  private static shouldRetry(
    error: TranslationError | Error,
    attempt: number,
    options: RetryOptions
  ): boolean {
    // Check if max retries exceeded
    if (attempt > options.maxRetries) {
      return false;
    }

    // Use custom retry predicate if provided
    if (options.shouldRetry) {
      return options.shouldRetry(error as TranslationError);
    }

    // Default logic: retry for recoverable errors
    if ('type' in error) {
      return isErrorRecoverable(error.type);
    }

    // For standard errors, only retry network errors
    return error instanceof Error &&
      (error.name === 'NetworkError' || error.message.includes('network'));
  }

  /**
   * Calculate delay for next retry with exponential backoff
   * @param attempt Current attempt number
   * @param options Retry options
   * @returns Delay in milliseconds
   */
  private static calculateDelay(attempt: number, options: RetryOptions): number {
    const { retryDelay, retryMultiplier, maxDelay } = options;

    // Calculate exponential backoff
    const delay = retryDelay * Math.pow(retryMultiplier, attempt - 1);

    // Add jitter to prevent synchronized retries
    const jitter = Math.random() * 300;

    // Apply max delay if specified
    return Math.min(delay + jitter, maxDelay || Number.MAX_SAFE_INTEGER);
  }
}

export default RetryService;