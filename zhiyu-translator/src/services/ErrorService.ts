import { TranslationError, TranslationErrorType, ErrorSeverity } from '../types/errors';
import { createTranslationError, getErrorSeverity } from '../utils/errorUtils';

/**
 * Interface for error subscription callbacks
 */
type ErrorCallback = (error: TranslationError) => void;

/**
 * Error service for centralized error handling
 */
class ErrorService {
  private static instance: ErrorService;
  private subscribers: Set<ErrorCallback> = new Set();
  private errors: TranslationError[] = [];
  private maxErrorHistory: number = 10;

  /**
   * Get the singleton instance of ErrorService
   */
  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() { }

  /**
   * Report an error to the error service
   * @param error Error to report
   */
  public reportError(error: Error | TranslationError): void {
    // Convert standard Error to TranslationError if needed
    const translationError = error instanceof Error && !('type' in error)
      ? createTranslationError(
        TranslationErrorType.INTERNAL_ERROR,
        error.message,
        { stack: error.stack }
      )
      : error as TranslationError;

    // Add timestamp if not present
    if (!translationError.timestamp) {
      translationError.timestamp = Date.now();
    }

    // Add to error history
    this.errors.unshift(translationError);

    // Limit error history size
    if (this.errors.length > this.maxErrorHistory) {
      this.errors = this.errors.slice(0, this.maxErrorHistory);
    }

    // Log critical errors to console
    const severity = getErrorSeverity(translationError.type);
    if (severity === ErrorSeverity.CRITICAL) {
      console.error('Critical error:', translationError);
    }

    // Notify subscribers
    this.notifySubscribers(translationError);
  }

  /**
   * Subscribe to error notifications
   * @param callback Function to call when an error occurs
   * @returns Unsubscribe function
   */
  public subscribe(callback: ErrorCallback): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of a new error
   * @param error Error to notify about
   */
  private notifySubscribers(error: TranslationError): void {
    this.subscribers.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error subscriber:', err);
      }
    });
  }

  /**
   * Get error history
   * @returns Array of recent errors
   */
  public getErrorHistory(): TranslationError[] {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errors = [];
  }
}

export default ErrorService;