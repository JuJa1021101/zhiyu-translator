// Re-export all types from their respective files
export * from './errors';
export * from './languages';
export * from './worker';

// Core application types
export interface AppState {
  sourceLanguage: string;
  targetLanguage: string;
  inputText: string;
  translatedText: string;
  isTranslating: boolean;
  progress: number;
  error: string | null;
  isServiceReady: boolean;
  settings: {
    autoTranslate: boolean;
    debounceMs: number;
    useQuantized: boolean;
    cacheModels: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  serviceConfig: TranslationServiceConfig;
}

// Translation options type
export interface TranslationOptions {
  maxLength?: number;
  temperature?: number;
  beamSize?: number;
  topK?: number;
  topP?: number;
  timeout?: number;
  abortSignal?: AbortSignal;
}

// Translation request/response types
export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  options?: TranslationOptions;
}

export interface TranslationResponse {
  translatedText: string;
  confidence?: number;
  processingTime: number;
  sourceLanguage: string;
  targetLanguage: string;
  model?: string;
}

// Progress event types
export interface ProgressEvent {
  type: 'model-loading' | 'translating';
  progress: number;
  message: string;
  details?: {
    modelName?: string;
    step?: number;
    totalSteps?: number;
    bytesLoaded?: number;
    bytesTotal?: number;
  };
}

// Service configuration types
export interface TranslationServiceConfig {
  workerUrl?: string;
  cacheModels?: boolean;
  useQuantized?: boolean;
  maxConcurrentTranslations?: number;
  timeout?: number;
  retryOptions?: {
    maxRetries: number;
    retryDelay: number;
    retryMultiplier: number;
  };
  healthCheckInterval?: number;
  queuePriorities?: {
    shortText?: number;
    mediumText?: number;
    longText?: number;
    userInitiated?: number;
    background?: number;
  };
  autoRecover?: boolean;
}

// Hook options
export interface TranslationHookOptions {
  autoTranslate?: boolean;
  debounceMs?: number;
  initialSourceLanguage?: string;
  initialTargetLanguage?: string;
  serviceConfig?: TranslationServiceConfig;
}

// Model management types
export interface ModelInfo {
  id: string;
  name: string;
  languages: {
    source: string[];
    target: string[];
  };
  size: number;
  quantized: boolean;
  lastUsed?: Date;
  loadTime?: number;
}

export interface ModelManagerConfig {
  maxCachedModels?: number;
  preferQuantized?: boolean;
  preloadModels?: string[];
  modelCacheTTL?: number;
}

// Performance metrics
export interface PerformanceMetrics {
  modelLoadTime: number;
  translationTime: number;
  tokensPerSecond?: number;
  memoryUsage?: number;
}