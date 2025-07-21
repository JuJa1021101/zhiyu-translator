import { renderHook, act } from '@testing-library/react';
import { useTranslationService } from '../useTranslationService';
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

describe('useTranslationService Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressCallback = null;
  });

  test('initializes and returns TranslationService instance', () => {
    const { result } = renderHook(() => useTranslationService());

    expect(result.current).toBeDefined();
    expect(TranslationService).toHaveBeenCalled();
    expect(result.current.initialize).toHaveBeenCalled();
  });

  test('cleans up TranslationService on unmount', () => {
    const { unmount } = renderHook(() => useTranslationService());

    unmount();

    expect(TranslationService.mock.instances[0].destroy).toHaveBeenCalled();
  });

  test('translate method calls service translate', async () => {
    const { result } = renderHook(() => useTranslationService());

    const translationPromise = result.current.translate('Hello', 'en', 'fr');
    const translatedText = await translationPromise;

    expect(TranslationService.mock.instances[0].translate).toHaveBeenCalledWith('Hello', 'en', 'fr');
    expect(translatedText).toBe('Translated: Hello from en to fr');
  });

  test('onProgress registers callback correctly', () => {
    const { result } = renderHook(() => useTranslationService());

    const mockCallback = vi.fn();
    const unsubscribe = result.current.onProgress(mockCallback);

    expect(TranslationService.mock.instances[0].onProgress).toHaveBeenCalledWith(mockCallback);
    expect(typeof unsubscribe).toBe('function');
  });

  test('passes options to TranslationService constructor', () => {
    const options = {
      workerUrl: '/custom-worker.js',
      modelOptions: { quantized: true }
    };

    renderHook(() => useTranslationService(options));

    expect(TranslationService).toHaveBeenCalledWith(options);
  });
});