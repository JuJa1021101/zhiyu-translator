import { translationReducer, initialState } from '../translationReducer';
import { TranslationActionType } from '../../types';
import { TranslationErrorType } from '../../types/errors';
import { createTranslationError } from '../../utils/errorUtils';

describe('translationReducer', () => {
  test('returns initial state when no action is provided', () => {
    const newState = translationReducer(initialState, {} as any);
    expect(newState).toEqual(initialState);
  });

  test('handles SET_SOURCE_LANGUAGE action', () => {
    const action = {
      type: TranslationActionType.SET_SOURCE_LANGUAGE,
      payload: 'fr'
    };

    const newState = translationReducer(initialState, action);

    expect(newState.sourceLanguage).toBe('fr');
  });

  test('handles SET_TARGET_LANGUAGE action', () => {
    const action = {
      type: TranslationActionType.SET_TARGET_LANGUAGE,
      payload: 'de'
    };

    const newState = translationReducer(initialState, action);

    expect(newState.targetLanguage).toBe('de');
  });

  test('handles SET_INPUT_TEXT action', () => {
    const action = {
      type: TranslationActionType.SET_INPUT_TEXT,
      payload: 'Hello world'
    };

    const newState = translationReducer(initialState, action);

    expect(newState.inputText).toBe('Hello world');
  });

  test('handles SET_TRANSLATED_TEXT action', () => {
    const action = {
      type: TranslationActionType.SET_TRANSLATED_TEXT,
      payload: 'Bonjour le monde'
    };

    const newState = translationReducer(initialState, action);

    expect(newState.translatedText).toBe('Bonjour le monde');
  });

  test('handles START_TRANSLATION action', () => {
    const action = {
      type: TranslationActionType.START_TRANSLATION
    };

    const newState = translationReducer(initialState, action);

    expect(newState.isTranslating).toBe(true);
    expect(newState.progress).toBe(0);
    expect(newState.error).toBeNull();
  });

  test('handles TRANSLATION_PROGRESS action', () => {
    const action = {
      type: TranslationActionType.TRANSLATION_PROGRESS,
      payload: 75
    };

    const newState = translationReducer(initialState, action);

    expect(newState.progress).toBe(75);
  });

  test('handles TRANSLATION_COMPLETE action', () => {
    const startState = {
      ...initialState,
      isTranslating: true,
      progress: 50
    };

    const action = {
      type: TranslationActionType.TRANSLATION_COMPLETE,
      payload: 'Translated text'
    };

    const newState = translationReducer(startState, action);

    expect(newState.isTranslating).toBe(false);
    expect(newState.progress).toBe(100);
    expect(newState.translatedText).toBe('Translated text');
  });

  test('handles TRANSLATION_ERROR action', () => {
    const startState = {
      ...initialState,
      isTranslating: true,
      progress: 50
    };

    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    const action = {
      type: TranslationActionType.TRANSLATION_ERROR,
      payload: error
    };

    const newState = translationReducer(startState, action);

    expect(newState.isTranslating).toBe(false);
    expect(newState.error).toEqual(error);
  });

  test('handles CLEAR_ERROR action', () => {
    const startState = {
      ...initialState,
      error: createTranslationError(
        TranslationErrorType.TRANSLATION_FAILED,
        'Translation failed'
      )
    };

    const action = {
      type: TranslationActionType.CLEAR_ERROR
    };

    const newState = translationReducer(startState, action);

    expect(newState.error).toBeNull();
  });

  test('handles SWAP_LANGUAGES action', () => {
    const startState = {
      ...initialState,
      sourceLanguage: 'en',
      targetLanguage: 'fr',
      inputText: 'Hello',
      translatedText: 'Bonjour'
    };

    const action = {
      type: TranslationActionType.SWAP_LANGUAGES
    };

    const newState = translationReducer(startState, action);

    expect(newState.sourceLanguage).toBe('fr');
    expect(newState.targetLanguage).toBe('en');
    expect(newState.inputText).toBe('Bonjour');
    expect(newState.translatedText).toBe('Hello');
  });

  test('handles RESET_TRANSLATION action', () => {
    const startState = {
      ...initialState,
      inputText: 'Hello',
      translatedText: 'Bonjour',
      isTranslating: true,
      progress: 50,
      error: createTranslationError(
        TranslationErrorType.TRANSLATION_FAILED,
        'Translation failed'
      )
    };

    const action = {
      type: TranslationActionType.RESET_TRANSLATION
    };

    const newState = translationReducer(startState, action);

    expect(newState.inputText).toBe('');
    expect(newState.translatedText).toBe('');
    expect(newState.isTranslating).toBe(false);
    expect(newState.progress).toBe(0);
    expect(newState.error).toBeNull();
  });

  test('handles CANCEL_TRANSLATION action', () => {
    const startState = {
      ...initialState,
      isTranslating: true,
      progress: 50
    };

    const action = {
      type: TranslationActionType.CANCEL_TRANSLATION
    };

    const newState = translationReducer(startState, action);

    expect(newState.isTranslating).toBe(false);
    expect(newState.progress).toBe(0);
  });
});