/**
 * ModelManager.ts
 * 
 * Singleton class for managing Transformers.js model pipelines.
 * Handles model loading, caching, and progress tracking.
 */

import { pipeline, PipelineType } from '@xenova/transformers';
import { TranslationErrorType, TranslationException } from '../types/errors';
import { loggers } from '../utils/logUtils';

// Logger for model operations
const logger = loggers.model;

/**
 * Model configuration options
 */
export interface ModelConfig {
  /** Whether to cache loaded models */
  cacheModels: boolean;
  /** Whether to use quantized models */
  quantized: boolean;
  /** Maximum number of models to keep in cache */
  maxCacheSize?: number;
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Model loading options
 */
export interface ModelLoadingOptions {
  /** Progress callback function */
  progressCallback?: ProgressCallback;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * ModelManager singleton class
 * Manages Transformers.js pipelines with lazy loading and caching
 */
export class ModelManager {
  private static instance: ModelManager;
  private pipelines: Map<string, any>;
  private modelConfig: ModelConfig;
  private activeRequests: Map<string, AbortController>;
  private loadingProgress: Map<string, number>;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.pipelines = new Map();
    this.activeRequests = new Map();
    this.loadingProgress = new Map();
    this.modelConfig = {
      cacheModels: true,
      quantized: true,
      maxCacheSize: 5
    };

    logger.info('ModelManager initialized');
  }

  /**
   * Get the singleton instance
   * @returns The ModelManager instance
   */
  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  /**
   * Update model configuration
   * @param config Partial configuration to update
   */
  public setConfig(config: Partial<ModelConfig>): void {
    this.modelConfig = { ...this.modelConfig, ...config };
    logger.info('Model config updated', this.modelConfig);
  }

  /**
   * Get current model configuration
   * @returns Current model configuration
   */
  public getConfig(): ModelConfig {
    return { ...this.modelConfig };
  }

  /**
   * Get a pipeline for the specified task and model
   * Implements lazy loading and caching
   * 
   * @param task Pipeline task type
   * @param model Model identifier
   * @param requestId Unique request identifier
   * @param options Loading options
   * @returns The pipeline instance
   * @throws TranslationException if loading fails
   */
  public async getPipeline(
    task: PipelineType | string,
    model: string,
    requestId: string,
    options: ModelLoadingOptions = {}
  ): Promise<any> {
    const { progressCallback, signal } = options;

    // Create a key for this pipeline configuration
    const key = `${task}-${model}${this.modelConfig.quantized ? '-quantized' : ''}`;

    // Create abort controller for this request
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    // Combine external signal with our controller
    const combinedSignal = signal
      ? this.createCombinedAbortSignal(controller.signal, signal)
      : controller.signal;

    try {
      // Check if we already have this pipeline cached
      if (this.pipelines.has(key) && this.modelConfig.cacheModels) {
        logger.info(`Using cached model pipeline: ${key}`);

        // Remove from active requests since we're using cached model
        this.activeRequests.delete(requestId);

        return this.pipelines.get(key);
      }

      // Initialize progress tracking
      this.loadingProgress.set(key, 0);

      // Create progress callback wrapper
      const sendProgress = (progress: number) => {
        // Store progress for potential status queries
        this.loadingProgress.set(key, progress);

        // Call external progress callback if provided
        if (progressCallback) {
          progressCallback(progress, `Loading ${model} model...`);
        }

        logger.debug(`Model loading progress for ${key}: ${progress.toFixed(1)}%`);
      };

      logger.info(`Loading model pipeline: ${key}`);

      // Load the model with progress callback
      const pipelineOptions = {
        progress_callback: sendProgress,
        quantized: this.modelConfig.quantized,
        signal: combinedSignal
      };

      const pipe = await pipeline(task, model, pipelineOptions);

      // Cache the pipeline if caching is enabled
      if (this.modelConfig.cacheModels) {
        this.addToCache(key, pipe);
        logger.info(`Model pipeline cached: ${key}`);
      }

      // Clear progress tracking
      this.loadingProgress.delete(key);

      return pipe;
    } catch (error) {
      // Clear progress tracking
      this.loadingProgress.delete(key);

      // Check if this was an abort
      if (error.name === 'AbortError') {
        logger.info(`Model loading aborted for request ${requestId}`);
        throw error;
      }

      logger.error(`Error loading model: ${key}`, error);

      throw new TranslationException({
        type: TranslationErrorType.MODEL_LOAD_FAILED,
        message: `Failed to load model: ${error.message || 'Unknown error'}`,
        details: error,
        recoverable: true
      });
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Cancel an active model loading request
   * @param requestId Request ID to cancel
   * @returns True if request was found and cancelled, false otherwise
   */
  public cancelRequest(requestId: string): boolean {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      logger.info(`Request ${requestId} cancelled`);
      return true;
    }
    return false;
  }

  /**
   * Get the loading progress for a specific model
   * @param task Pipeline task type
   * @param model Model identifier
   * @returns Progress percentage (0-100) or -1 if not loading
   */
  public getLoadingProgress(task: string, model: string): number {
    const key = `${task}-${model}${this.modelConfig.quantized ? '-quantized' : ''}`;
    return this.loadingProgress.has(key) ? this.loadingProgress.get(key)! : -1;
  }

  /**
   * Check if a model is currently being loaded
   * @param task Pipeline task type
   * @param model Model identifier
   * @returns True if the model is loading, false otherwise
   */
  public isModelLoading(task: string, model: string): boolean {
    const key = `${task}-${model}${this.modelConfig.quantized ? '-quantized' : ''}`;
    return this.loadingProgress.has(key);
  }

  /**
   * Check if a model is cached
   * @param task Pipeline task type
   * @param model Model identifier
   * @returns True if the model is cached, false otherwise
   */
  public isModelCached(task: string, model: string): boolean {
    const key = `${task}-${model}${this.modelConfig.quantized ? '-quantized' : ''}`;
    return this.pipelines.has(key);
  }

  /**
   * Clear the entire model cache
   */
  public clearCache(): void {
    this.pipelines.clear();
    logger.info('Model cache cleared');
  }

  /**
   * Remove a specific model from the cache
   * @param task Pipeline task type
   * @param model Model identifier
   * @returns True if the model was removed, false if not found
   */
  public removeFromCache(task: string, model: string): boolean {
    const key = `${task}-${model}${this.modelConfig.quantized ? '-quantized' : ''}`;
    const result = this.pipelines.delete(key);
    if (result) {
      logger.info(`Model removed from cache: ${key}`);
    }
    return result;
  }

  /**
   * Get the number of models currently in the cache
   * @returns Number of cached models
   */
  public getCacheSize(): number {
    return this.pipelines.size;
  }

  /**
   * Get a list of all cached models
   * @returns Array of cached model keys
   */
  public getCachedModels(): string[] {
    return Array.from(this.pipelines.keys());
  }

  /**
   * Add a pipeline to the cache, respecting the max cache size
   * @param key Cache key
   * @param pipeline Pipeline instance
   */
  private addToCache(key: string, pipeline: any): void {
    // If we've reached max cache size, remove the oldest entry
    if (this.modelConfig.maxCacheSize && this.pipelines.size >= this.modelConfig.maxCacheSize) {
      const oldestKey = this.pipelines.keys().next().value;
      this.pipelines.delete(oldestKey);
      logger.info(`Cache full, removed oldest model: ${oldestKey}`);
    }

    // Add the new pipeline to the cache
    this.pipelines.set(key, pipeline);
  }

  /**
   * Create a combined AbortSignal from multiple signals
   * @param signals AbortSignals to combine
   * @returns A new AbortSignal that aborts when any input signal aborts
   */
  private createCombinedAbortSignal(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }

      signal.addEventListener('abort', () => {
        controller.abort(signal.reason);
      }, { once: true });
    }

    return controller.signal;
  }
}

// Export the singleton instance getter
export const getModelManager = ModelManager.getInstance;

// Export default for convenience
export default ModelManager;