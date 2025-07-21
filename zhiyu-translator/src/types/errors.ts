/**
 * Enum defining all possible error types in the translation system
 */
export enum TranslationErrorType {
  // Model related errors
  MODEL_LOAD_FAILED = 'MODEL_LOAD_FAILED',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  MODEL_INITIALIZATION_FAILED = 'MODEL_INITIALIZATION_FAILED',

  // Translation process errors
  TRANSLATION_FAILED = 'TRANSLATION_FAILED',
  TRANSLATION_TIMEOUT = 'TRANSLATION_TIMEOUT',
  INVALID_INPUT = 'INVALID_INPUT',
  UNSUPPORTED_LANGUAGE_PAIR = 'UNSUPPORTED_LANGUAGE_PAIR',

  // Worker related errors
  WORKER_ERROR = 'WORKER_ERROR',
  WORKER_INITIALIZATION_FAILED = 'WORKER_INITIALIZATION_FAILED',
  WORKER_COMMUNICATION_ERROR = 'WORKER_COMMUNICATION_ERROR',

  // Network related errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  MODEL_DOWNLOAD_FAILED = 'MODEL_DOWNLOAD_FAILED',

  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Interface for translation errors
 */
export interface TranslationError {
  type: TranslationErrorType;
  message: string;
  details?: any;
  timestamp?: number;
  recoverable?: boolean;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Extended error interface with severity
 */
export interface TranslationErrorWithSeverity extends TranslationError {
  severity: ErrorSeverity;
}

/**
 * Interface for error handling options
 */
export interface ErrorHandlingOptions {
  retryCount?: number;
  retryDelay?: number;
  fallbackLanguage?: string;
  logErrors?: boolean;
  suppressWarnings?: boolean;
}

/**
 * Custom error class for translation errors
 */
export class TranslationException extends Error {
  type: TranslationErrorType;
  details?: any;
  timestamp: number;
  recoverable: boolean;

  constructor(error: TranslationError) {
    super(error.message);
    this.name = 'TranslationException';
    this.type = error.type;
    this.details = error.details;
    this.timestamp = error.timestamp || Date.now();
    this.recoverable = error.recoverable || false;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TranslationException);
    }
  }
}