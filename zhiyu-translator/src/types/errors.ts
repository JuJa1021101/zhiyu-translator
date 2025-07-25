/**
 * Translation error types and interfaces
 */

export enum TranslationErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE'
}

export interface TranslationError extends Error {
  type: TranslationErrorType;
  code?: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
}

export interface ErrorContext {
  stack?: string;
  componentStack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}