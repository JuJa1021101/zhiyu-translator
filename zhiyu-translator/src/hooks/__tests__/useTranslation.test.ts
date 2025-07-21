import { renderHook, act } from '@testing-library/react';
import { useTranslation } from '../useTranslation';
import { TranslationService } from '../../services/TranslationService';

// Mock the TranslationService
vi.mock('../../services/TranslationService', () => {
  return {
    TranslationService: vi.fn().mockImplementation(() => ({
      translate: vi.fn().mockImplementation((text, from, to) =>
        Promise.resolve(`Translated: ${text} from ${from} to ${to}`)),
      onProgress: vi.fn().mockImplementation(callback => {
        // Store the callback for later use in tests
        mockProgressCallback = callback;
        return () => { }; // Return unsubscribe function
      }),
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn()
    }))
  };
});

// Store the progress callback for testing
let mockProgressCallback: ((progress: number) => void) | null = null;

describe('useTranslation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressCallback = null;
  });

  test('initializes with default values', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.translatedText).toBe('');
    expect(result.current.isTranslating).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.translate).toBe('function');
    expect(typeof result.current.cancelTranslation).toBe('function');
  });

  test('translate function updates state correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTranslation());

    // Start translation
    act(() => {
      result.current.translate('Hello', 'en', 'fr');
    });

    // Check loading state
    expect(result.current.isTranslating).toBe(true);

    // Wait for translation to complete
    await waitForNextUpdate();

    // Check final state
    expect(result.current.isTranslating).toBe(false);
    expect(result.current.translatedText).toBe('Translated: Hello from en to fr');
    expect(result.current.error).toBeNull();
  });

  test('handles progress updates', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTranslation());

    // Start translation
    act(() => {
      result.current.translate('Hello', 'en', 'fr');
    });

    // Simulate progress updates
    if (mockProgressCallback) {
      act(() => {
        mockProgressCallback(25);
      });
      expect(result.current.progress).toBe(25);

      act(() => {
        mockProgressCallback(50);
      });
      expect(result.current.progress).toBe(50);

      act(() => {
        mockProgressCallback(100);
      });
      expect(result.current.progress).toBe(100);
    }

    // Wait for translation to complete
    await waitForNextUpdate();

    expect(result.current.isTranslating).toBe(false);
  });

  test('handles translation errors', async () => {
    // Mock the translate method to reject
    (TranslationService as jest.Mock).mockImplementationOnce(() => ({
      translate: vi.fn().mockRejectedValue(new Error('Translation failed')),
      onProgress: vi.fn().mockReturnValue(() => { }),
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn()
    }));

    const { result, waitForNextUpdate } = renderHook(() => useTranslation());

    // Start translation
    act(() => {
      result.current.translate('Hello', 'en', 'fr');
    });

    // Wait for error to be caught
    await waitForNextUpdate();

    // Check error state
    expect(result.current.isTranslating).toBe(false);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Translation failed');
  });

  test('cancelTranslation resets state', async () => {
    const { result } = renderHook(() => useTranslation());

    // Start translation
    act(() => {
      result.current.translate('Hello', 'en', 'fr');
    });

    // Check loading state
    expect(result.current.isTranslating).toBe(true);

    // Cancel translation
    act(() => {
      result.current.cancelTranslation();
    });

    // Check state after cancellation
    expect(result.current.isTranslating).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  test('initializes and cleans up TranslationService', () => {
    const { unmount } = renderHook(() => useTranslation());

    // Check that initialize was called
    expect(TranslationService.mock.instances[0].initialize).toHaveBeenCalled();

    // Unmount the hook
    unmount();

    // Check that destroy was called
    expect(TranslationService.mock.instances[0].destroy).toHaveBeenCalled();
  });
});