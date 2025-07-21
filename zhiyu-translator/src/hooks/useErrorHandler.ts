import { useState, useEffect, useCallback } from 'react';
import { TranslationError } from '../types/errors';
import ErrorService from '../services/ErrorService';

/**
 * Hook for handling errors using the ErrorService
 * @param autoHideDuration Optional duration in ms to automatically hide errors
 * @returns Object with error state and error handling functions
 */
export function useErrorHandler(autoHideDuration?: number) {
  const [currentError, setCurrentError] = useState<TranslationError | null>(null);
  const [errorQueue, setErrorQueue] = useState<TranslationError[]>([]);
  const errorService = ErrorService.getInstance();

  // Handle new errors
  const handleError = useCallback((error: TranslationError) => {
    setErrorQueue(prev => [...prev, error]);
  }, []);

  // Process error queue
  useEffect(() => {
    if (errorQueue.length > 0 && !currentError) {
      // Take the first error from the queue
      const nextError = errorQueue[0];
      setCurrentError(nextError);

      // Remove the processed error from the queue
      setErrorQueue(prev => prev.slice(1));
    }
  }, [errorQueue, currentError]);

  // Subscribe to error service
  useEffect(() => {
    const unsubscribe = errorService.subscribe(handleError);
    return unsubscribe;
  }, [errorService, handleError]);

  // Clear current error
  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  // Report a new error
  const reportError = useCallback((error: Error | TranslationError) => {
    errorService.reportError(error);
  }, [errorService]);

  // Get error history
  const getErrorHistory = useCallback(() => {
    return errorService.getErrorHistory();
  }, [errorService]);

  return {
    error: currentError,
    clearError,
    reportError,
    getErrorHistory,
    hasQueuedErrors: errorQueue.length > 0,
    queueLength: errorQueue.length,
    autoHideDuration
  };
}

export default useErrorHandler;