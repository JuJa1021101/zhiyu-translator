import { ModelManager } from '../ModelManager';
import { TranslationErrorType } from '../../types/errors';

// Mock the Transformers.js pipeline
vi.mock('@xenova/transformers', () => {
  return {
    pipeline: vi.fn().mockImplementation((task, model, options) => {
      // Simulate model loading
      return new Promise((resolve) => {
        // Call progress callback if provided
        if (options?.progress_callback) {
          options.progress_callback({ status: 'progress', progress: 0.5 });
          options.progress_callback({ status: 'ready' });
        }

        // Return mock pipeline
        resolve({
          model_id: model,
          task,
          translate: vi.fn().mockImplementation((text) => {
            return Promise.resolve([{ translation_text: `Translated: ${text}` }]);
          })
        });
      });
    })
  };
});

describe('ModelManager', () => {
  beforeEach(() => {
    // Reset singleton instance before each test
    // @ts-ignore - accessing private static property for testing
    ModelManager['instance'] = undefined;

    // Clear all mocks
    vi.clearAllMocks();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = ModelManager.getInstance();
    const instance2 = ModelManager.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(ModelManager);
  });

  test('getPipeline loads and caches model', async () => {
    const manager = ModelManager.getInstance();
    const progressCallback = vi.fn();

    // First call should load the model
    const pipeline1 = await manager.getPipeline('translation', 'Helsinki-NLP/opus-mt-en-fr', progressCallback);

    expect(pipeline1).toBeDefined();
    expect(pipeline1.model_id).toBe('Helsinki-NLP/opus-mt-en-fr');
    expect(pipeline1.task).toBe('translation');
    expect(progressCallback).toHaveBeenCalled();

    // Reset mock to check if it's called again
    progressCallback.mockClear();

    // Second call should use cached model
    const pipeline2 = await manager.getPipeline('translation', 'Helsinki-NLP/opus-mt-en-fr', progressCallback);

    expect(pipeline2).toBe(pipeline1);
    expect(progressCallback).not.toHaveBeenCalled();
  });

  test('getPipeline with different models returns different pipelines', async () => {
    const manager = ModelManager.getInstance();

    const pipeline1 = await manager.getPipeline('translation', 'Helsinki-NLP/opus-mt-en-fr');
    const pipeline2 = await manager.getPipeline('translation', 'Helsinki-NLP/opus-mt-en-de');

    expect(pipeline1).not.toBe(pipeline2);
    expect(pipeline1.model_id).toBe('Helsinki-NLP/opus-mt-en-fr');
    expect(pipeline2.model_id).toBe('Helsinki-NLP/opus-mt-en-de');
  });

  test('handles model loading errors', async () => {
    // Mock pipeline to throw error
    const { pipeline } = await import('@xenova/transformers');
    (pipeline as jest.Mock).mockRejectedValueOnce(new Error('Model not found'));

    const manager = ModelManager.getInstance();

    await expect(manager.getPipeline('translation', 'invalid-model')).rejects.toThrow();
  });

  test('clearCache removes cached models', async () => {
    const manager = ModelManager.getInstance();

    // Load a model
    const pipeline = await manager.getPipeline('translation', 'Helsinki-NLP/opus-mt-en-fr');

    // Clear cache
    manager.clearCache();

    // Mock to verify pipeline is loaded again
    const progressCallback = vi.fn();
    await manager.getPipeline('translation', 'Helsinki-NLP/opus-mt-en-fr', progressCallback);

    // Progress callback should be called for new load
    expect(progressCallback).toHaveBeenCalled();
  });

  test('translate method uses pipeline correctly', async () => {
    const manager = ModelManager.getInstance();

    const result = await manager.translate('Hello world', 'en', 'fr');

    expect(result).toBe('Translated: Hello world');
  });

  test('getModelLoadingProgress returns current progress', async () => {
    const manager = ModelManager.getInstance();

    // Initial progress should be 0
    expect(manager.getModelLoadingProgress('Helsinki-NLP/opus-mt-en-fr')).toBe(0);

    // Start loading model
    const loadPromise = manager.getPipeline('translation', 'Helsinki-NLP/opus-mt-en-fr');

    // Progress should be updated during loading
    expect(manager.getModelLoadingProgress('Helsinki-NLP/opus-mt-en-fr')).toBeGreaterThan(0);

    // Wait for loading to complete
    await loadPromise;

    // Progress should be 100 after loading
    expect(manager.getModelLoadingProgress('Helsinki-NLP/opus-mt-en-fr')).toBe(100);
  });
});