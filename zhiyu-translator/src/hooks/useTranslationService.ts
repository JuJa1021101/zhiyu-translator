import { useEffect, useCallback, useRef } from 'react';
import { TranslationService } from '../services';
import { ProgressEvent, TranslationOptions } from '../types';
import { useTranslationContext } from '../context/TranslationContext';

/**
 * Hook for using the translation service with the global context
 */
export default function useTranslationService() {
  const { state, dispatch } = useTranslationContext();
  const serviceRef = useRef<TranslationService | null>(null);
  const currentRequestId = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize the service
  useEffect(() => {
    const service = new TranslationService(state.serviceConfig);
    serviceRef.current = service;

    const initService = async () => {
      try {
        await service.initialize({
          cacheModels: state.serviceConfig?.cacheModels,
          quantized: state.serviceConfig?.useQuantized
        });
        dispatch({ type: 'SET_SERVICE_READY', payload: true });
      } catch (err) {
        console.error('Failed to initialize translation service:', err);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize translation service' });
      }
    };

    initService();

    // Set up progress callback
    service.onProgress((event: ProgressEvent) => {
      dispatch({ type: 'SET_PROGRESS', payload: event.progress });
    });

    // Clean up service on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      service.destroy();
    };
  }, []);

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

  // Translation function
  const translate = useCallback(async (options?: TranslationOptions) => {
    if (!state.inputText.trim() || !state.isServiceReady || !serviceRef.current) {
      if (!state.inputText.trim()) {
        dispatch({ type: 'SET_TRANSLATED_TEXT', payload: '' });
      }
      return;
    }

    // Cancel any pending translation
    if (currentRequestId.current) {
      await serviceRef.current.cancelTranslation(currentRequestId.current)
        .catch(console.error);
    }

    // Generate a new request ID
    currentRequestId.current = `translate-${Date.now()}`;

    dispatch({ type: 'START_TRANSLATION' });

    try {
      const result = await serviceRef.current.translate(
        state.inputText,
        state.sourceLanguage,
        state.targetLanguage,
        {
          ...options,
          timeout: options?.timeout || state.serviceConfig?.timeout,
        }
      );
      dispatch({ type: 'FINISH_TRANSLATION', payload: result });
    } catch (err: any) {
      // Format error message for display
      const errorMessage = err.type
        ? err.message
        : (err instanceof Error ? err.message : 'Translation failed');

      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Translation error:', err);
    } finally {
      currentRequestId.current = null;
    }
  }, [state.inputText, state.sourceLanguage, state.targetLanguage, state.isServiceReady, state.serviceConfig]);

  // Cancel current translation
  const cancelTranslation = useCallback(async () => {
    if (currentRequestId.current && serviceRef.current) {
      try {
        await serviceRef.current.cancelTranslation(currentRequestId.current);
        currentRequestId.current = null;
        dispatch({ type: 'CANCEL_TRANSLATION' });
      } catch (err) {
        console.error('Failed to cancel translation:', err);
      }
    }
  }, []);

  // Update service configuration
  const updateServiceConfig = useCallback((config: Partial<typeof state.serviceConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateConfig(config);
    }
    dispatch({ type: 'UPDATE_SERVICE_CONFIG', payload: config });
  }, []);

  return {
    translate,
    cancelTranslation,
    updateServiceConfig,
    isServiceReady: state.isServiceReady
  };
}