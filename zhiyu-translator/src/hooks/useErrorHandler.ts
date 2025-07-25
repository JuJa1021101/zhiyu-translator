import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for handling errors with simple state management
 * @param autoHideDuration Optional duration in ms to automatically hide errors
 * @returns Object with error state and error handling functions
 */
export function useErrorHandler(autoHideDuration?: number) {
  const [currentError, setCurrentError] = useState<Error | null>(null);
  const [errorHistory, setErrorHistory] = useState<Error[]>([]);

  // Auto-hide error after specified duration
  useEffect(() => {
    if (currentError && autoHideDuration) {
      const timer = setTimeout(() => {
        setCurrentError(null);
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [currentError, autoHideDuration]);

  // Clear current error
  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  // Report a new error
  const reportError = useCallback((error: Error) => {
    console.error('Error reported:', error);
    setCurrentError(error);

    // Add to history (keep last 10 errors)
    setErrorHistory(prev => [error, ...prev.slice(0, 9)]);
  }, []);

  // Get error history
  const getErrorHistory = useCallback(() => {
    return errorHistory;
  }, [errorHistory]);

  return {
    error: currentError,
    clearError,
    reportError,
    getErrorHistory,
    autoHideDuration
  };
}

export default useErrorHandler;