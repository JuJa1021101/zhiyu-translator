import { ErrorService } from '../ErrorService';
import { TranslationErrorType } from '../../types/errors';
import { createTranslationError } from '../../utils/errorUtils';

describe('ErrorService', () => {
  let errorService: ErrorService;

  beforeEach(() => {
    errorService = new ErrorService();
  });

  test('registers and notifies error listeners', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    // Register listeners
    const unsubscribe1 = errorService.onError(listener1);
    const unsubscribe2 = errorService.onError(listener2);

    // Create test error
    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    // Report error
    errorService.reportError(error);

    // Both listeners should be called
    expect(listener1).toHaveBeenCalledWith(error);
    expect(listener2).toHaveBeenCalledWith(error);

    // Unsubscribe first listener
    unsubscribe1();

    // Report another error
    const error2 = createTranslationError(
      TranslationErrorType.NETWORK_ERROR,
      'Network error'
    );
    errorService.reportError(error2);

    // Only second listener should be called
    expect(listener1).not.toHaveBeenCalledWith(error2);
    expect(listener2).toHaveBeenCalledWith(error2);
  });

  test('getLastError returns most recent error', () => {
    // Initially no error
    expect(errorService.getLastError()).toBeNull();

    // Report error
    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );
    errorService.reportError(error);

    // Should return the error
    expect(errorService.getLastError()).toEqual(error);

    // Report another error
    const error2 = createTranslationError(
      TranslationErrorType.NETWORK_ERROR,
      'Network error'
    );
    errorService.reportError(error2);

    // Should return the latest error
    expect(errorService.getLastError()).toEqual(error2);
  });

  test('clearError clears the last error', () => {
    // Report error
    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );
    errorService.reportError(error);

    // Error should be set
    expect(errorService.getLastError()).toEqual(error);

    // Clear error
    errorService.clearError();

    // Error should be null
    expect(errorService.getLastError()).toBeNull();
  });

  test('handles standard Error objects', () => {
    const standardError = new Error('Standard error');

    // Report standard error
    errorService.reportError(standardError);

    // Should convert to TranslationError
    const lastError = errorService.getLastError();
    expect(lastError).not.toBeNull();
    expect(lastError?.type).toBe(TranslationErrorType.UNKNOWN_ERROR);
    expect(lastError?.message).toBe('Standard error');
  });

  test('logs errors to console when enabled', () => {
    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => { });

    // Create service with logging enabled
    const loggingErrorService = new ErrorService({ logToConsole: true });

    // Report error
    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );
    loggingErrorService.reportError(error);

    // Console.error should be called
    expect(consoleSpy).toHaveBeenCalled();

    // Restore console.error
    consoleSpy.mockRestore();
  });

  test('does not log errors when disabled', () => {
    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => { });

    // Create service with logging disabled
    const nonLoggingErrorService = new ErrorService({ logToConsole: false });

    // Report error
    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );
    nonLoggingErrorService.reportError(error);

    // Console.error should not be called
    expect(consoleSpy).not.toHaveBeenCalled();

    // Restore console.error
    consoleSpy.mockRestore();
  });
});