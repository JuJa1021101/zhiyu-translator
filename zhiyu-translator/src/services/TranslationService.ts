import {
  TranslationRequest,
  TranslationResponse,
  ProgressEvent,
  TranslationError,
  TranslationOptions,
  TranslationServiceConfig
} from '../types';
import {
  WorkerMessageType,
  WorkerResponseType,
  WorkerRequest,
  WorkerResponse
} from '../types/worker';
import { TranslationErrorType } from '../types/errors';
import { createTranslationError, handleTranslationError } from '../utils/errorUtils';
import { loggers, LogLevel } from '../utils/logUtils';

/**
 * Service for handling translation requests through a Web Worker
 * 基于 Web Worker 建立独立计算线程，运用 MessageChannel 通信机制实现主线程与工作线程的解耦
 * 确保复杂模型推理期间界面交互的流畅性
 */
/**
 * Translation request queue item interface
 */
interface QueuedTranslationRequest {
  id: string;
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  options?: TranslationOptions;
  priority: number;
  resolve: (value: string) => void;
  reject: (reason: any) => void;
  timestamp: number;
  timeoutId?: NodeJS.Timeout;
}

export class TranslationService {
  private worker: Worker | null = null;
  private messageChannel: MessageChannel | null = null;
  private port: MessagePort | null = null;
  private requestMap: Map<string, {
    resolve: (value: TranslationResponse) => void;
    reject: (reason: any) => void;
    timestamp: number;
  }>;
  private progressCallback?: (progress: ProgressEvent) => void;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private logger: Console;

  // Queue management
  private requestQueue: QueuedTranslationRequest[] = [];
  private activeRequests: Set<string> = new Set();
  private isProcessingQueue: boolean = false;
  private maxConcurrentRequests: number = 1;
  private serviceConfig: TranslationServiceConfig = {
    maxConcurrentTranslations: 3, // Increase concurrent translations for speed
    timeout: 30000, // Reduce timeout for faster failure detection
    retryOptions: {
      maxRetries: 1, // Reduce retries for faster response
      retryDelay: 500, // Faster retry
      retryMultiplier: 1.2
    }
  };

  /**
   * Creates a new TranslationService instance
   * @param config Configuration options for the service
   */
  constructor(config?: Partial<TranslationServiceConfig>) {
    // Set up logging
    this.logger = loggers.service;

    // Create request tracking map
    this.requestMap = new Map();

    // Apply configuration
    if (config) {
      this.serviceConfig = { ...this.serviceConfig, ...config };
    }

    // Set max concurrent requests from config
    this.maxConcurrentRequests = this.serviceConfig.maxConcurrentTranslations || 1;

    // Initialize the worker and message channel
    this.initializeWorker();
  }

  /**
   * Initialize the worker and message channel
   * 运用 MessageChannel 通信机制实现主线程与工作线程的解耦，确保复杂模型推理期间界面交互的流畅性
   */
  private initializeWorker(): void {
    try {
      // Create a new worker for independent computation thread
      this.worker = new Worker(
        new URL('../workers/translation.worker.ts', import.meta.url),
        {
          type: 'module',
          name: 'translation-worker' // Named worker for better debugging
        }
      );

      // Create a message channel for decoupled communication
      this.messageChannel = new MessageChannel();
      this.port = this.messageChannel.port1;

      // Set up message handling on the port for decoupled communication
      this.port.onmessage = this.handleWorkerMessage.bind(this);

      // Handle port errors for robust communication
      this.port.onmessageerror = (error) => {
        this.logger.error('[TranslationService] MessageChannel communication error:', error);
        this.handleWorkerError(new ErrorEvent('messageerror', {
          message: 'MessageChannel communication failed',
          error
        }));
      };

      // Connect the worker to the message channel (transfer port2 to worker)
      this.worker.postMessage({ type: 'connect' }, [this.messageChannel.port2]);

      // Set up error handling for the worker
      this.worker.onerror = this.handleWorkerError.bind(this);

      // Handle worker termination
      this.worker.onmessageerror = (error) => {
        this.logger.error('[TranslationService] Worker message error:', error);
        this.handleWorkerError(new ErrorEvent('workererror', {
          message: 'Worker message processing failed',
          error
        }));
      };

      this.logger.info('[TranslationService] Worker and MessageChannel initialized - 主线程与工作线程解耦完成');
    } catch (error) {
      this.logger.error('[TranslationService] Failed to initialize worker:', error);
      throw new Error('Failed to initialize translation service');
    }
  }

  /**
   * Initialize the translation service
   * @param options Configuration options for the service
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(options?: {
    cacheModels?: boolean;
    quantized?: boolean;
    autoHealthCheck?: boolean;
  }): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<void>((resolve, reject) => {
      const requestId = `init-${Date.now()}`;

      // Set timeout for initialization
      const timeoutId = setTimeout(() => {
        this.requestMap.delete(requestId);
        reject(createTranslationError(
          TranslationErrorType.WORKER_INITIALIZATION_FAILED,
          'Worker initialization timed out',
          { requestId }
        ));
      }, 10000); // 10 second timeout

      // Store the promise callbacks
      this.requestMap.set(requestId, {
        resolve: () => {
          clearTimeout(timeoutId);
          this.isInitialized = true;
          this.initPromise = null;

          // Set up automatic health checks if requested
          if (options?.autoHealthCheck || this.serviceConfig.autoRecover) {
            const interval = this.serviceConfig.healthCheckInterval || 30000;
            this.setupAutoHealthCheck(interval);
          }

          resolve();
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          this.initPromise = null;
          reject(error);
        },
        timestamp: Date.now()
      });

      // Send initialization request with optimized settings
      this.sendWorkerMessage({
        id: requestId,
        type: WorkerMessageType.INIT,
        payload: {
          modelConfig: {
            cacheModels: options?.cacheModels !== undefined ? options.cacheModels : true, // Always cache for speed
            quantized: options?.quantized !== undefined ? options.quantized : true, // Always use quantized for speed
            maxCacheSize: 3, // Limit cache size for memory efficiency
            preloadCommonModels: true // Preload common translation models
          }
        }
      });
    });

    return this.initPromise;
  }

  /**
   * Reinitialize the service after a failure
   * This is different from restart as it only reinitializes without recreating the worker
   * @returns Promise that resolves when reinitialization is complete
   */
  public async reinitialize(): Promise<void> {
    this.logger.info('[TranslationService] Reinitializing service...');

    // Reset initialization state
    this.isInitialized = false;
    this.initPromise = null;

    // Reinitialize
    await this.initialize();

    this.logger.info('[TranslationService] Service reinitialized');
  }

  /**
   * Handle messages from the worker
   * @param event Message event from the worker
   */
  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, type, payload } = event.data;

    if (!id || !type) {
      this.logger.warn('[TranslationService] Received invalid message from worker:', event.data);
      return;
    }

    this.logger.debug(`[TranslationService] Received ${type} message for request ${id}`);

    switch (type) {
      case WorkerResponseType.RESULT: {
        const request = this.requestMap.get(id);
        if (request) {
          request.resolve(payload);
          this.requestMap.delete(id);
        } else {
          this.logger.warn(`[TranslationService] No pending request found for ID: ${id}`);
        }
        break;
      }

      case WorkerResponseType.ERROR: {
        const request = this.requestMap.get(id);
        if (request) {
          const error = handleTranslationError(payload, false);
          request.reject(error);
          this.requestMap.delete(id);
        } else {
          this.logger.warn(`[TranslationService] No pending request found for ID: ${id}`);
        }
        break;
      }

      case WorkerResponseType.PROGRESS: {
        if (this.progressCallback) {
          this.progressCallback(payload);
        }
        break;
      }

      case WorkerResponseType.READY: {
        // Handle ready response for initialization
        const request = this.requestMap.get(id);
        if (request) {
          request.resolve(payload);
          this.requestMap.delete(id);
          this.logger.info('[TranslationService] Worker ready:', payload);
        }
        break;
      }

      default:
        this.logger.warn(`[TranslationService] Unknown message type: ${type}`);
    }
  }

  /**
   * Handle worker errors
   * @param event Error event from the worker
   */
  private handleWorkerError(event: ErrorEvent): void {
    this.logger.error('[TranslationService] Worker error:', event);

    // Track error for recovery
    const errorDetails = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: Date.now()
    };

    // Notify all pending requests of the error
    this.requestMap.forEach((request, id) => {
      const error = createTranslationError(
        TranslationErrorType.WORKER_ERROR,
        `Worker error: ${event.message}`,
        errorDetails
      );

      request.reject(error);
    });

    // Clear all pending requests
    this.requestMap.clear();

    // Attempt to restart the worker with recovery
    this.restartWorker(true);
  }

  /**
   * Restart the worker after an error
   * @param attemptRecovery Whether to attempt recovery of pending requests
   * @param maxRetries Maximum number of restart attempts
   * @returns Promise that resolves when worker is restarted
   */
  private async restartWorker(attemptRecovery: boolean = false, maxRetries: number = 3): Promise<boolean> {
    // Save current queue for recovery
    const pendingQueue = [...this.requestQueue];
    this.requestQueue = [];

    // Track active requests for recovery
    const activeRequestIds = new Set(this.activeRequests);
    this.activeRequests.clear();

    try {
      this.logger.info('[TranslationService] Restarting worker...');

      // Clean up existing worker
      this.destroy();

      // Reinitialize
      this.initializeWorker();
      this.isInitialized = false;

      // Wait for initialization to complete
      await this.initialize();

      this.logger.info('[TranslationService] Worker restarted successfully');

      // Recover pending requests if requested
      if (attemptRecovery) {
        this.logger.info(`[TranslationService] Recovering ${pendingQueue.length} pending requests`);

        // Re-queue pending requests with higher priority
        for (const request of pendingQueue) {
          // Clear existing timeout
          if (request.timeoutId) {
            clearTimeout(request.timeoutId);
          }

          // Re-queue with higher priority for recovery
          this.queueTranslationRequest(
            request.text,
            request.sourceLanguage,
            request.targetLanguage,
            request.options,
            request.priority + 1 // Increase priority for recovered requests
          ).then(request.resolve)
            .catch(request.reject);
        }

        // Restart queue processing
        if (this.requestQueue.length > 0) {
          this.processQueue();
        }
      }

      return true;
    } catch (error) {
      this.logger.error('[TranslationService] Failed to restart worker:', error);

      // Retry with exponential backoff if we haven't exceeded max retries
      if (maxRetries > 0) {
        const retryDelay = 1000 * Math.pow(2, 3 - maxRetries); // Exponential backoff

        this.logger.info(`[TranslationService] Retrying worker restart in ${retryDelay}ms (${maxRetries} attempts left)`);

        return new Promise<boolean>((resolve) => {
          setTimeout(() => {
            resolve(this.restartWorker(attemptRecovery, maxRetries - 1));
          }, retryDelay);
        });
      }

      // If we've exhausted retries, reject all pending requests
      if (pendingQueue.length > 0) {
        this.logger.error(`[TranslationService] Failed to recover ${pendingQueue.length} requests after worker restart`);

        const fatalError = createTranslationError(
          TranslationErrorType.WORKER_INITIALIZATION_FAILED,
          'Failed to restart translation service after multiple attempts',
          error
        );

        for (const request of pendingQueue) {
          if (request.timeoutId) {
            clearTimeout(request.timeoutId);
          }
          request.reject(fatalError);
        }
      }

      return false;
    }
  }

  /**
   * Check worker health and restart if necessary
   * @returns Promise that resolves with worker health status
   */
  public async checkWorkerHealth(): Promise<boolean> {
    if (!this.worker) {
      this.logger.warn('[TranslationService] Worker not initialized during health check');
      return this.restartWorker(true);
    }

    // Send a ping message to check if worker is responsive
    try {
      const pingId = `ping-${Date.now()}`;

      const pingResult = await new Promise<boolean>((resolve, reject) => {
        // Set timeout for ping response
        const timeoutId = setTimeout(() => {
          this.requestMap.delete(pingId);
          resolve(false); // Worker is not responsive
        }, 2000);

        // Store ping callbacks
        this.requestMap.set(pingId, {
          resolve: () => {
            clearTimeout(timeoutId);
            resolve(true); // Worker is responsive
          },
          reject: () => {
            clearTimeout(timeoutId);
            resolve(false); // Worker had an error
          },
          timestamp: Date.now()
        });

        // Send ping message
        this.sendWorkerMessage({
          id: pingId,
          type: WorkerMessageType.INIT, // Reuse INIT as a ping
          payload: { ping: true }
        });
      });

      if (!pingResult) {
        this.logger.warn('[TranslationService] Worker not responsive, restarting');
        return this.restartWorker(true);
      }

      return true;
    } catch (error) {
      this.logger.error('[TranslationService] Error checking worker health:', error);
      return this.restartWorker(true);
    }
  }

  /**
   * Send a message to the worker
   * @param message Message to send to the worker
   */
  private sendWorkerMessage(message: WorkerRequest): void {
    try {
      if (this.port) {
        this.port.postMessage(message);
      } else if (this.worker) {
        this.worker.postMessage(message);
      } else {
        throw new Error('Neither port nor worker is initialized');
      }
    } catch (error) {
      this.logger.error(`[TranslationService] Failed to send message to worker:`, error);

      // Handle the error for this specific request
      const request = this.requestMap.get(message.id);
      if (request) {
        const translationError = createTranslationError(
          TranslationErrorType.WORKER_COMMUNICATION_ERROR,
          'Failed to communicate with translation service',
          error
        );

        request.reject(translationError);
        this.requestMap.delete(message.id);
      }
    }
  }

  /**
   * Add a translation request to the queue
   * @param request Translation request to queue
   * @param priority Priority of the request (higher number = higher priority)
   * @returns Promise that resolves with the request ID
   */
  private queueTranslationRequest(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    options?: TranslationOptions,
    priority: number = 1
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const id = `translate-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create timeout for the queued request
      const timeoutMs = options?.timeout || this.serviceConfig.timeout || 60000;
      const timeoutId = setTimeout(() => {
        // Remove from queue if still there
        this.requestQueue = this.requestQueue.filter(req => req.id !== id);
        // Remove from active requests if started
        this.activeRequests.delete(id);

        reject(createTranslationError(
          TranslationErrorType.TRANSLATION_TIMEOUT,
          'Translation request timed out in queue',
          { requestId: id }
        ));
      }, timeoutMs);

      // Create queue item
      const queueItem: QueuedTranslationRequest = {
        id,
        text,
        sourceLanguage,
        targetLanguage,
        options,
        priority,
        resolve,
        reject,
        timestamp: Date.now(),
        timeoutId
      };

      // Add to queue and sort by priority (higher first) then timestamp (older first)
      this.requestQueue.push(queueItem);
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp - b.timestamp; // Older requests first
      });

      this.logger.debug(`[TranslationService] Request ${id} added to queue (${this.requestQueue.length} total)`);

      // Start processing the queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the translation request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process queue until empty or max concurrent requests reached
      while (this.requestQueue.length > 0 && this.activeRequests.size < this.maxConcurrentRequests) {
        // Get next request from queue
        const request = this.requestQueue.shift();

        if (!request) {
          continue;
        }

        // Mark as active
        this.activeRequests.add(request.id);

        // Process the request
        this.executeTranslation(request).finally(() => {
          // Remove from active requests when done
          this.activeRequests.delete(request.id);

          // Continue processing queue
          if (this.requestQueue.length > 0) {
            this.processQueue();
          }
        });
      }
    } finally {
      // If no active requests, mark queue as not processing
      if (this.activeRequests.size === 0) {
        this.isProcessingQueue = false;
      }
    }
  }

  /**
   * Execute a translation request
   * @param request Translation request to execute
   */
  private async executeTranslation(request: QueuedTranslationRequest): Promise<void> {
    const { id, text, sourceLanguage, targetLanguage, options, resolve, reject, timeoutId } = request;

    try {
      this.logger.debug(`[TranslationService] Executing translation request ${id}`);

      // Ensure the service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      const translationRequest: TranslationRequest = {
        text,
        sourceLanguage,
        targetLanguage,
        options
      };

      // Store the promise callbacks in the request map
      this.requestMap.set(id, {
        resolve: (response: TranslationResponse) => {
          if (timeoutId) clearTimeout(timeoutId);
          resolve(response.translatedText);
        },
        reject: (error) => {
          if (timeoutId) clearTimeout(timeoutId);
          reject(error);
        },
        timestamp: Date.now()
      });

      // Send the request to the worker
      this.sendWorkerMessage({
        id,
        type: WorkerMessageType.TRANSLATE,
        payload: translationRequest
      });
    } catch (error) {
      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Handle error
      const translationError = error instanceof Error
        ? createTranslationError(
          TranslationErrorType.TRANSLATION_FAILED,
          error.message,
          error
        )
        : error;

      reject(translationError);
    }
  }

  /**
   * Translate text from one language to another
   * @param text Text to translate
   * @param sourceLanguage Source language code
   * @param targetLanguage Target language code
   * @param options Translation options
   * @returns Promise that resolves with the translated text
   */
  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    options?: TranslationOptions
  ): Promise<string> {
    // Ensure the service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.logger.debug(`[TranslationService] Queueing translation request`, {
      sourceLanguage,
      targetLanguage,
      textLength: text.length
    });

    // Add request to queue with priority based on text length (shorter texts get higher priority)
    const priority = options?.priority || 1;
    return this.queueTranslationRequest(text, sourceLanguage, targetLanguage, options, priority);
  }

  /**
   * Register a callback for translation progress events
   * @param callback Function to call with progress updates
   */
  onProgress(callback: (progress: ProgressEvent) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Cancel a pending translation request
   * @param requestId ID of the request to cancel
   * @returns Promise that resolves with a boolean indicating if the request was cancelled
   */
  async cancelTranslation(requestId: string): Promise<boolean> {
    const id = `cancel-${Date.now()}`;

    return new Promise<boolean>((resolve, reject) => {
      // Set timeout for cancel request
      const timeoutId = setTimeout(() => {
        this.requestMap.delete(id);
        resolve(false);
      }, 5000);

      // Store the promise callbacks
      this.requestMap.set(id, {
        resolve: (response: any) => {
          clearTimeout(timeoutId);
          resolve(response.cancelled || false);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        timestamp: Date.now()
      });

      // Send cancel request to worker
      this.sendWorkerMessage({
        id,
        type: WorkerMessageType.CANCEL,
        payload: {
          requestId
        }
      });
    });
  }

  /**
   * Set up automatic health checks for the worker
   * @param intervalMs Interval between health checks in milliseconds
   * @returns Interval ID that can be used to clear the health check
   */
  public setupAutoHealthCheck(intervalMs: number = 30000): NodeJS.Timeout {
    this.logger.info(`[TranslationService] Setting up automatic health checks every ${intervalMs}ms`);

    return setInterval(async () => {
      try {
        await this.checkWorkerHealth();
      } catch (error) {
        this.logger.error('[TranslationService] Error during automatic health check:', error);
      }
    }, intervalMs);
  }

  /**
   * Get the current status of the translation service
   * @returns Object containing service status information
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    queueLength: number;
    activeRequests: number;
    isProcessingQueue: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      isProcessingQueue: this.isProcessingQueue
    };
  }

  /**
   * Reset the service to its initial state
   * This will cancel all pending requests and restart the worker
   * @returns Promise that resolves when the service is reset
   */
  public async resetService(): Promise<void> {
    this.logger.info('[TranslationService] Resetting service...');

    // Cancel all pending requests
    const pendingRequests = [...this.requestQueue];
    this.requestQueue = [];

    // Reject all pending requests
    for (const request of pendingRequests) {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }

      request.reject(createTranslationError(
        TranslationErrorType.WORKER_ERROR,
        'Translation service was reset',
        { requestId: request.id }
      ));
    }

    // Clear active requests
    this.activeRequests.clear();
    this.isProcessingQueue = false;

    // Restart worker
    await this.restartWorker(false);

    // Re-initialize
    this.isInitialized = false;
    await this.initialize();

    this.logger.info('[TranslationService] Service reset complete');
  }

  /**
   * Update service configuration
   * @param config New configuration options
   */
  public updateConfig(config: Partial<TranslationServiceConfig>): void {
    this.serviceConfig = { ...this.serviceConfig, ...config };

    // Update max concurrent requests
    if (config.maxConcurrentTranslations !== undefined) {
      this.maxConcurrentRequests = config.maxConcurrentTranslations;
    }

    this.logger.info('[TranslationService] Configuration updated', this.serviceConfig);
  }

  /**
   * Clean up resources used by the service
   */
  public destroy(): void {
    try {
      // Cancel all pending requests
      for (const request of this.requestQueue) {
        if (request.timeoutId) {
          clearTimeout(request.timeoutId);
        }
      }

      // Clear queues and maps
      this.requestQueue = [];
      this.activeRequests.clear();
      this.requestMap.clear();

      // Close the message port
      if (this.port) {
        this.port.close();
      }

      // Terminate the worker
      if (this.worker) {
        this.worker.terminate();
      }

      this.logger.info('[TranslationService] Resources cleaned up');
    } catch (error) {
      this.logger.error('[TranslationService] Error during cleanup:', error);
    }
  }
}

export default TranslationService;