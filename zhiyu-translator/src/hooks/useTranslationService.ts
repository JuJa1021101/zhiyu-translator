import { useEffect, useCallback, useRef } from 'react';
import { YoudaoTranslationService } from '../services/YoudaoTranslationService';
import { ProgressEvent, TranslationOptions } from '../types';
import { useTranslationContext } from '../context/TranslationContext';

/**
 * Hook for using the translation service with the global context
 */
export default function useTranslationService() {
  const { state, dispatch } = useTranslationContext();
  const serviceRef = useRef<YoudaoTranslationService | null>(null);
  const currentRequestId = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize the Youdao translation service
  useEffect(() => {
    let isMounted = true;

    const initService = async () => {
      try {
        console.log('Initializing Youdao translation service...');

        // Create the Youdao translation service
        const service = new YoudaoTranslationService();

        if (!isMounted) return;
        serviceRef.current = service;

        // Set up progress callback
        service.onProgress((event: ProgressEvent) => {
          if (isMounted) {
            dispatch({ type: 'SET_PROGRESS', payload: event.progress });
          }
        });

        // Initialize the service (fast initialization)
        await service.initialize();

        if (isMounted) {
          console.log('Youdao translation service initialized successfully');
          dispatch({ type: 'SET_SERVICE_READY', payload: true });
        }
      } catch (err) {
        console.error('Failed to initialize Youdao translation service:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error
            ? `Translation service initialization failed: ${err.message}`
            : 'Failed to initialize translation service';
          dispatch({ type: 'SET_ERROR', payload: errorMessage });
        }
      }
    };

    initService();

    // Clean up service on unmount
    return () => {
      isMounted = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (serviceRef.current) {
        try {
          serviceRef.current.destroy();
        } catch (err) {
          console.error('Error destroying translation service:', err);
        }
      }
    };
  }, [dispatch]);

  // Auto-translate effect
  useEffect(() => {
    if (state.settings.autoTranslate && state.inputText.trim() && state.isServiceReady) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        translate();
      }, state.settings.debounceMs);

      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }
  }, [state.settings.autoTranslate, state.inputText, state.sourceLanguage, state.targetLanguage, state.isServiceReady]);

  // Cancel current translation if languages change
  useEffect(() => {
    if (currentRequestId.current && state.isTranslating) {
      cancelTranslation().then(() => {
        if (state.settings.autoTranslate && state.inputText.trim()) {
          translate();
        }
      }).catch(console.error);
    }
  }, [state.sourceLanguage, state.targetLanguage]);

  // Translation function - 无状态实时翻译，仿有道词典体验
  const translate = useCallback(async (options?: TranslationOptions) => {
    if (!state.inputText.trim() || !state.isServiceReady || !serviceRef.current) {
      if (!state.inputText.trim()) {
        dispatch({ type: 'SET_TRANSLATED_TEXT', payload: '' });
      }
      return;
    }

    // 静默取消任何正在进行的翻译，不显示状态变化
    if (currentRequestId.current) {
      await serviceRef.current.cancelTranslation()
        .catch(console.error);
    }

    // 生成新的请求ID
    currentRequestId.current = `translate-${Date.now()}`;

    try {
      // 对于自动翻译模式，我们需要确保翻译结果是实时的
      const isAutoTranslate = state.settings.autoTranslate;

      // 直接翻译，不设置任何中间状态
      const result = await serviceRef.current.translate(
        state.inputText,
        state.sourceLanguage,
        state.targetLanguage
      );

      // 确保结果不是空的或者只是带前缀的原文
      const isValidResult = result &&
        !result.startsWith(`【${state.targetLanguage}翻译】`) &&
        !result.startsWith(`[${state.targetLanguage.toUpperCase()}]`);

      // 直接设置结果，不经过中间状态
      if (isValidResult) {
        dispatch({ type: 'SET_TRANSLATED_TEXT', payload: result });
      } else if (!isAutoTranslate) {
        // 如果不是自动翻译模式，且结果无效，至少显示一些内容
        dispatch({ type: 'SET_TRANSLATED_TEXT', payload: result || '翻译失败，请重试' });
      }
    } catch (err: any) {
      // 静默处理错误，不显示错误状态
      console.error('Translation error:', err);

      // 如果不是自动翻译模式，显示错误信息
      if (!state.settings.autoTranslate) {
        const errorMessage = err instanceof Error ? err.message : '翻译失败，请重试';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    } finally {
      currentRequestId.current = null;
    }
  }, [state.inputText, state.sourceLanguage, state.targetLanguage, state.isServiceReady, state.settings.autoTranslate]);

  // Cancel current translation
  const cancelTranslation = useCallback(async () => {
    if (currentRequestId.current && serviceRef.current) {
      try {
        await serviceRef.current.cancelTranslation();
        currentRequestId.current = null;
        dispatch({ type: 'CANCEL_TRANSLATION' });
      } catch (err) {
        console.error('Failed to cancel translation:', err);
      }
    }
  }, []);

  // Update service configuration (simplified for modern service)
  const updateServiceConfig = useCallback((config: Partial<typeof state.serviceConfig>) => {
    // Modern service doesn't need complex configuration updates
    dispatch({ type: 'UPDATE_SERVICE_CONFIG', payload: config });
  }, []);

  return {
    translate,
    cancelTranslation,
    updateServiceConfig,
    isServiceReady: state.isServiceReady
  };
}