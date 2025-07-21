import { useState, useEffect, useCallback, useRef } from 'react';
import { TranslationService } from '../services';
import { ProgressEvent, TranslationOptions, TranslationServiceConfig } from '../types';
import { formatErrorMessage } from '../utils/errorUtils';

export interface UseTranslationOptions {
  autoTranslate?: boolean;
  debounceMs?: number;
  initialSourceLanguage?: string;
  initialTargetLanguage?: string;
  serviceConfig?: TranslationServiceConfig;
}

export default function useTranslation(options: UseTranslationOptions = {}) {
  const {
    autoTranslate = false,
    debounceMs = 500,
    initialSourceLanguage = 'en',
    initialTargetLanguage = 'zh',
    serviceConfig
  } = options;

  // Create service instance
  const [service] = useState(() => new TranslationService());
  const [isServiceReady, setIsServiceReady] = useState(false);

  // Translation state
  const [sourceLanguage, setSourceLanguage] = useState(initialSourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState(initialTargetLanguage);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Track current translation request
  const currentRequestId = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize the service
  useEffect(() => {
    const initService = async () => {
      try {
        await service.initialize({
          cacheModels: serviceConfig?.cacheModels,
          quantized: serviceConfig?.useQuantized
        });
        setIsServiceReady(true);
      } catch (err) {
        console.error('Failed to initialize translation service:', err);
        setError('Failed to initialize translation service');
      }
    };

    initService();
  }, [service, serviceConfig]);

  // Set up progress callback
  useEffect(() => {
    service.onProgress((event: ProgressEvent) => {
      setProgress(event.progress);
    });

    // Clean up service on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      service.destroy();
    };
  }, [service]);

  // Auto-translate effect
  useEffect(() => {
    if (autoTranslate && inputText.trim() && isServiceReady) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        translate();
      }, debounceMs);

      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }
  }, [autoTranslate, inputText, sourceLanguage, targetLanguage, isServiceReady]);

  // Cancel current translation if languages change
  useEffect(() => {
    if (currentRequestId.current && isTranslating) {
      service.cancelTranslation(currentRequestId.current)
        .then(() => {
          currentRequestId.current = null;
          if (autoTranslate && inputText.trim()) {
            translate();
          }
        })
        .catch(console.error);
    }
  }, [sourceLanguage, targetLanguage]);

  // Translation function
  const translate = useCallback(async (options?: TranslationOptions) => {
    if (!inputText.trim() || !isServiceReady) {
      if (!inputText.trim()) {
        setTranslatedText('');
      }
      return;
    }

    // Cancel any pending translation
    if (currentRequestId.current) {
      await service.cancelTranslation(currentRequestId.current)
        .catch(console.error);
    }

    // Generate a new request ID
    currentRequestId.current = `translate-${Date.now()}`;

    setIsTranslating(true);
    setError(null);
    setProgress(0);

    try {
      const result = await service.translate(
        inputText,
        sourceLanguage,
        targetLanguage,
        {
          ...options,
          timeout: options?.timeout || serviceConfig?.timeout,
        }
      );
      setTranslatedText(result);
    } catch (err: any) {
      // Format error message for display
      const errorMessage = err.type
        ? formatErrorMessage(err)
        : (err instanceof Error ? err.message : 'Translation failed');

      setError(errorMessage);
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
      currentRequestId.current = null;
    }
  }, [inputText, sourceLanguage, targetLanguage, service, isServiceReady, serviceConfig]);

  // Cancel current translation
  const cancelTranslation = useCallback(async () => {
    if (currentRequestId.current) {
      try {
        await service.cancelTranslation(currentRequestId.current);
        currentRequestId.current = null;
        setIsTranslating(false);
      } catch (err) {
        console.error('Failed to cancel translation:', err);
      }
    }
  }, [service]);

  return {
    sourceLanguage,
    setSourceLanguage,
    targetLanguage,
    setTargetLanguage,
    inputText,
    setInputText,
    translatedText,
    isTranslating,
    progress,
    error,
    translate,
    cancelTranslation,
    isServiceReady
  };
}