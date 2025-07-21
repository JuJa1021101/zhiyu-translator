// Service exports
import { ProgressEvent } from '../types';

export interface ITranslationService {
  initialize(options?: { cacheModels?: boolean; quantized?: boolean; autoHealthCheck?: boolean }): Promise<void>;
  translate(text: string, from: string, to: string, options?: any): Promise<string>;
  onProgress(callback: (progress: ProgressEvent) => void): void;
  cancelTranslation(requestId: string): Promise<boolean>;
  resetService(): Promise<void>;
  checkWorkerHealth(): Promise<boolean>;
  getServiceStatus(): { isInitialized: boolean; queueLength: number; activeRequests: number; isProcessingQueue: boolean };
  updateConfig(config: any): void;
  destroy(): void;
}

export { default as TranslationService } from './TranslationService';
export { ModelManager, getModelManager } from './ModelManager';