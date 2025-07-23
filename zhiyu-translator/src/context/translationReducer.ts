import { AppState, TranslationServiceConfig } from '../types';

// Define the initial state
export const initialState: AppState = {
  sourceLanguage: 'en',
  targetLanguage: 'zh',
  inputText: '',
  translatedText: '',
  isTranslating: false,
  progress: 0,
  error: null,
  isServiceReady: false,
  settings: {
    autoTranslate: true, // 默认开启自动翻译
    debounceMs: 150, // 减少防抖时间到150ms，实现更接近有道词典的实时翻译体验
    useQuantized: true,
    cacheModels: true,
    theme: 'system'
  },
  serviceConfig: {
    cacheModels: true,
    useQuantized: true,
    maxConcurrentTranslations: 1,
    timeout: 60000
  }
};

// Define action types
export type TranslationAction =
  | { type: 'SET_SOURCE_LANGUAGE'; payload: string }
  | { type: 'SET_TARGET_LANGUAGE'; payload: string }
  | { type: 'SWAP_LANGUAGES' }
  | { type: 'SET_INPUT_TEXT'; payload: string }
  | { type: 'SET_TRANSLATED_TEXT'; payload: string }
  | { type: 'START_TRANSLATION' }
  | { type: 'FINISH_TRANSLATION'; payload: string }
  | { type: 'CANCEL_TRANSLATION' }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SERVICE_READY'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'UPDATE_SERVICE_CONFIG'; payload: Partial<TranslationServiceConfig> }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> }
  | { type: 'RESET_STATE' };

/**
 * Reducer function for translation state
 * @param state Current state
 * @param action Action to perform
 * @returns New state
 */
export function translationReducer(state: AppState, action: TranslationAction): AppState {
  switch (action.type) {
    case 'SET_SOURCE_LANGUAGE':
      return {
        ...state,
        sourceLanguage: action.payload
      };

    case 'SET_TARGET_LANGUAGE':
      return {
        ...state,
        targetLanguage: action.payload
      };

    case 'SWAP_LANGUAGES':
      return {
        ...state,
        sourceLanguage: state.targetLanguage,
        targetLanguage: state.sourceLanguage,
        // Clear translation when swapping languages
        translatedText: ''
      };

    case 'SET_INPUT_TEXT':
      return {
        ...state,
        inputText: action.payload,
        // 只有在自动翻译关闭时才清空翻译结果，避免频繁清空影响用户体验
        translatedText: state.settings.autoTranslate ? state.translatedText : '',
        // 如果正在翻译且输入发生变化，重置进度
        progress: state.isTranslating ? 0 : state.progress
      };

    case 'SET_TRANSLATED_TEXT':
      return {
        ...state,
        translatedText: action.payload
      };

    case 'START_TRANSLATION':
      return {
        ...state,
        // 完全无状态翻译，不设置任何中间状态
        isTranslating: false,
        error: null
      };

    case 'FINISH_TRANSLATION':
      return {
        ...state,
        isTranslating: false,
        translatedText: action.payload
      };

    case 'CANCEL_TRANSLATION':
      return {
        ...state,
        isTranslating: false
      };

    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isTranslating: false
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'SET_SERVICE_READY':
      return {
        ...state,
        isServiceReady: action.payload
      };



    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };

    case 'UPDATE_SERVICE_CONFIG':
      return {
        ...state,
        serviceConfig: {
          ...state.serviceConfig,
          ...action.payload
        }
      };

    case 'RESTORE_STATE':
      return {
        ...state,
        ...action.payload
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        // Keep service ready state
        isServiceReady: state.isServiceReady
      };

    default:
      return state;
  }
}