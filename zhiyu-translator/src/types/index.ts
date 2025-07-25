// Re-export all types from their respective files
export * from './languages';

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