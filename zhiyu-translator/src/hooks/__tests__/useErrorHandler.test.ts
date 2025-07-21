import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';
import { TranslationErrorType } from '../../types/errors';
import { createTranslationError } from '../../utils/errorUtils';

describe('useErrorHandler Hook', () => {
  test('initializes with null error', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBeNull();
    expect(typeof result.current.setError).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    expect(typeof result.current.handleError).toBe('function');
  });

  test('setError updates error state', () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    act(() => {
      result.current.setError(testError);
    });

    expect(result.current.error).toEqual(testError);
  });

  test('clearError resets error state to null', () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    act(() => {
      result.current.setError(testError);
    });

    expect(result.current.error).toEqual(testError);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  test('handleError converts standard Error to TranslationError', () => {
    const { result } = renderHook(() => useErrorHandler());

    const standardError = new Error('Standard error');

    act(() => {
      result.current.handleError(standardError);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.type).toBe(TranslationErrorType.UNKNOWN_ERROR);
    expect(result.current.error?.message).toBe('Standard error');
  });

  test('handleError accepts TranslationError directly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const translationError = createTranslationError(
      TranslationErrorType.NETWORK_ERROR,
      'Network error'
    );

    act(() => {
      result.current.handleError(translationError);
    });

    expect(result.current.error).toEqual(translationError);
  });

  test('auto-clears error after specified duration', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useErrorHandler({ autoClearTimeout: 2000 }));

    const testError = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    act(() => {
      result.current.setError(testError);
    });

    expect(result.current.error).toEqual(testError);

    // Advance time to trigger auto-clear
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.error).toBeNull();

    vi.useRealTimers();
  });

  test('onError callback is called when error is set', () => {
    const onErrorMock = vi.fn();
    const { result } = renderHook(() => useErrorHandler({ onError: onErrorMock }));

    const testError = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    act(() => {
      result.current.setError(testError);
    });

    expect(onErrorMock).toHaveBeenCalledWith(testError);
  });
});