import {
  TranslationError,
  TranslationErrorType,
  ErrorSeverity,
  TranslationException
} from '../types/errors';

/**
 * Create a translation error object
 * @param type Error type
 * @param message Error message
 * @param details Additional error details
 * @returns TranslationError object
 */
export function createTranslationError(
  type: TranslationErrorType,
  message: string,
  details?: any
): TranslationError {
  return {
    type,
    message,
    details,
    timestamp: Date.now(),
    recoverable: isErrorRecoverable(type)
  };
}

/**
 * Determine if an error is recoverable
 * @param errorType Error type
 * @returns Boolean indicating if the error is recoverable
 */
export function isErrorRecoverable(errorType: TranslationErrorType): boolean {
  // Define which error types are recoverable
  const recoverableErrors = [
    TranslationErrorType.NETWORK_ERROR,
    TranslationErrorType.TRANSLATION_TIMEOUT,
    TranslationErrorType.WORKER_ERROR
  ];

  return recoverableErrors.includes(errorType);
}

/**
 * Get error severity based on error type
 * @param errorType Error type
 * @returns Error severity level
 */
export function getErrorSeverity(errorType: TranslationErrorType): ErrorSeverity {
  // Critical errors
  if ([
    TranslationErrorType.MODEL_INITIALIZATION_FAILED,
    TranslationErrorType.WORKER_INITIALIZATION_FAILED,
    TranslationErrorType.INTERNAL_ERROR
  ].includes(errorType)) {
    return ErrorSeverity.CRITICAL;
  }

  // Warning level errors
  if ([
    TranslationErrorType.TRANSLATION_TIMEOUT,
    TranslationErrorType.NETWORK_ERROR
  ].includes(errorType)) {
    return ErrorSeverity.WARNING;
  }

  // Default to standard error
  return ErrorSeverity.ERROR;
}

/**
 * Format error message for user display
 * @param error Translation error
 * @returns User-friendly error message
 */
export function formatErrorMessage(error: TranslationError): string {
  // Map technical error types to user-friendly messages
  const errorMessages: Record<TranslationErrorType, string> = {
    [TranslationErrorType.MODEL_LOAD_FAILED]: 'Failed to load translation model',
    [TranslationErrorType.MODEL_NOT_FOUND]: 'Translation model not found',
    [TranslationErrorType.MODEL_INITIALIZATION_FAILED]: 'Could not initialize translation model',
    [TranslationErrorType.TRANSLATION_FAILED]: 'Translation failed',
    [TranslationErrorType.TRANSLATION_TIMEOUT]: 'Translation timed out',
    [TranslationErrorType.INVALID_INPUT]: 'Invalid input text',
    [TranslationErrorType.UNSUPPORTED_LANGUAGE_PAIR]: 'This language pair is not supported',
    [TranslationErrorType.WORKER_ERROR]: 'Worker process error',
    [TranslationErrorType.WORKER_INITIALIZATION_FAILED]: 'Failed to start translation service',
    [TranslationErrorType.WORKER_COMMUNICATION_ERROR]: 'Communication error with translation service',
    [TranslationErrorType.NETWORK_ERROR]: 'Network error',
    [TranslationErrorType.MODEL_DOWNLOAD_FAILED]: 'Failed to download translation model',
    [TranslationErrorType.UNKNOWN_ERROR]: 'Unknown error occurred',
    [TranslationErrorType.INTERNAL_ERROR]: 'Internal application error'
  };

  return errorMessages[error.type] || error.message;
}

/**
 * Handle and log translation errors
 * @param error Error object
 * @param logToConsole Whether to log to console
 */
export function handleTranslationError(error: TranslationError | Error, logToConsole: boolean = true): TranslationError {
  // Convert standard Error to TranslationError if needed
  const translationError = error instanceof Error && !(error instanceof TranslationException)
    ? createTranslationError(
      TranslationErrorType.UNKNOWN_ERROR,
      error.message,
      { stack: error.stack }
    )
    : error as TranslationError;

  if (logToConsole) {
    console.error(
      `Translation Error [${translationError.type}]: ${translationError.message}`,
      translationError.details
    );
  }

  return translationError;
}