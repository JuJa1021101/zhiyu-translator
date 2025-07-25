import { TranslationError, TranslationErrorType, ErrorContext } from '../types/errors';

/**
 * Creates a TranslationError instance
 */
export function createTranslationError(
  type: TranslationErrorType,
  message: string,
  context?: ErrorContext,
  code?: string
): TranslationError {
  const error = new Error(message) as TranslationError;

  error.type = type;
  error.code = code;
  error.details = context;
  error.timestamp = new Date();
  error.retryable = isRetryableError(type);

  return error;
}

/**
 * Determines if an error type is retryable
 */
export function isRetryableError(type: TranslationErrorType): boolean {
  switch (type) {
    case TranslationErrorType.NETWORK_ERROR:
    case TranslationErrorType.TIMEOUT_ERROR:
    case TranslationErrorType.RATE_LIMIT_ERROR:
      return true;
    case TranslationErrorType.API_ERROR:
    case TranslationErrorType.VALIDATION_ERROR:
    case TranslationErrorType.INTERNAL_ERROR:
    case TranslationErrorType.AUTHENTICATION_ERROR:
    case TranslationErrorType.UNSUPPORTED_LANGUAGE:
      return false;
    default:
      return false;
  }
}

/**
 * Formats error message for display
 */
export function formatErrorMessage(error: TranslationError): string {
  switch (error.type) {
    case TranslationErrorType.NETWORK_ERROR:
      return '网络连接错误，请检查网络连接后重试';
    case TranslationErrorType.API_ERROR:
      return `API错误: ${error.message}`;
    case TranslationErrorType.VALIDATION_ERROR:
      return `输入验证错误: ${error.message}`;
    case TranslationErrorType.TIMEOUT_ERROR:
      return '请求超时，请重试';
    case TranslationErrorType.RATE_LIMIT_ERROR:
      return '请求过于频繁，请稍后再试';
    case TranslationErrorType.AUTHENTICATION_ERROR:
      return '身份验证失败，请检查API密钥';
    case TranslationErrorType.UNSUPPORTED_LANGUAGE:
      return '不支持的语言';
    case TranslationErrorType.INTERNAL_ERROR:
    default:
      return `内部错误: ${error.message}`;
  }
}

/**
 * Logs error with context
 */
export function logError(error: TranslationError, context?: Record<string, any>): void {
  console.error('Translation Error:', {
    type: error.type,
    message: error.message,
    code: error.code,
    timestamp: error.timestamp,
    retryable: error.retryable,
    details: error.details,
    context
  });
}