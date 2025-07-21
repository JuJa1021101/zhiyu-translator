import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, TranslationOptions, TranslationServiceConfig } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils';
import { translationReducer, initialState, TranslationAction } from './translationReducer';

// Define the context type
interface TranslationContextType {
  state: AppState;
  dispatch: React.Dispatch<TranslationAction>;
}

// Create the context
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Props for the provider component
interface TranslationProviderProps {
  children: React.ReactNode;
  initialLanguages?: {
    source: string;
    target: string;
  };
  serviceConfig?: TranslationServiceConfig;
}

/**
 * Provider component for translation state
 */
export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  initialLanguages,
  serviceConfig
}) => {
  // Initialize state with custom initial languages if provided
  const customInitialState = {
    ...initialState,
    sourceLanguage: initialLanguages?.source || initialState.sourceLanguage,
    targetLanguage: initialLanguages?.target || initialState.targetLanguage,
    serviceConfig: serviceConfig || initialState.serviceConfig
  };

  // Create reducer
  const [state, dispatch] = useReducer(translationReducer, customInitialState);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('translationState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);

        // Only restore certain parts of the state to avoid conflicts
        dispatch({
          type: 'RESTORE_STATE',
          payload: {
            sourceLanguage: parsedState.sourceLanguage,
            targetLanguage: parsedState.targetLanguage,
            settings: parsedState.settings
          }
        });
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }, []);

  // Persist state to localStorage when it changes
  useEffect(() => {
    try {
      // Only save specific parts of the state
      const stateToSave = {
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        settings: state.settings
      };
      localStorage.setItem('translationState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }, [state.sourceLanguage, state.targetLanguage, state.settings]);

  return (
    <TranslationContext.Provider value={{ state, dispatch }}>
      {children}
    </TranslationContext.Provider>
  );
};

/**
 * Hook for accessing the translation context
 */
export const useTranslationContext = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};

export default TranslationContext;