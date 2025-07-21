import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TranslationProvider, useTranslationContext } from '../TranslationContext';
import { TranslationService } from '../../services/TranslationService';

// Mock the TranslationService
vi.mock('../../services/TranslationService', () => {
  return {
    TranslationService: vi.fn().mockImplementation(() => ({
      translate: vi.fn().mockImplementation((text, from, to) =>
        Promise.resolve(`Translated: ${text} from ${from} to ${to}`)),
      onProgress: vi.fn().mockImplementation(callback => {
        // Store the callback for later use in tests
        mockProgressCallback = callback;
        return () => { }; // Return unsubscribe function
      }),
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      cancelTranslation: vi.fn()
    }))
  };
});

// Store the progress callback for testing
let mockProgressCallback: ((progress: number) => void) | null = null;

// Test component that uses the context
const TestComponent = () => {
  const {
    state,
    setSourceLanguage,
    setTargetLanguage,
    setInputText,
    translate,
    cancelTranslation,
    swapLanguages,
    clearError,
    resetTranslation
  } = useTranslationContext();

  return (
    <div>
      <div data-testid="source-language">{state.sourceLanguage}</div>
      <div data-testid="target-language">{state.targetLanguage}</div>
      <div data-testid="input-text">{state.inputText}</div>
      <div data-testid="translated-text">{state.translatedText}</div>
      <div data-testid="is-translating">{state.isTranslating.toString()}</div>
      <div data-testid="progress">{state.progress}</div>

      <button onClick={() => setSourceLanguage('fr')}>Set Source</button>
      <button onClick={() => setTargetLanguage('de')}>Set Target</button>
      <button onClick={() => setInputText('Hello world')}>Set Input</button>
      <button onClick={() => translate()}>Translate</button>
      <button onClick={() => cancelTranslation()}>Cancel</button>
      <button onClick={() => swapLanguages()}>Swap</button>
      <button onClick={() => clearError()}>Clear Error</button>
      <button onClick={() => resetTranslation()}>Reset</button>
    </div>
  );
};

describe('TranslationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressCallback = null;
  });

  test('provides initial state', () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    expect(screen.getByTestId('source-language')).toHaveTextContent('en');
    expect(screen.getByTestId('target-language')).toHaveTextContent('zh');
    expect(screen.getByTestId('input-text')).toHaveTextContent('');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('');
    expect(screen.getByTestId('is-translating')).toHaveTextContent('false');
    expect(screen.getByTestId('progress')).toHaveTextContent('0');
  });

  test('updates source language', () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    fireEvent.click(screen.getByText('Set Source'));

    expect(screen.getByTestId('source-language')).toHaveTextContent('fr');
  });

  test('updates target language', () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    fireEvent.click(screen.getByText('Set Target'));

    expect(screen.getByTestId('target-language')).toHaveTextContent('de');
  });

  test('updates input text', () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    fireEvent.click(screen.getByText('Set Input'));

    expect(screen.getByTestId('input-text')).toHaveTextContent('Hello world');
  });

  test('performs translation', async () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    // Set input text
    fireEvent.click(screen.getByText('Set Input'));

    // Start translation
    fireEvent.click(screen.getByText('Translate'));

    // Check loading state
    expect(screen.getByTestId('is-translating')).toHaveTextContent('true');

    // Simulate progress updates
    if (mockProgressCallback) {
      mockProgressCallback(50);
      expect(screen.getByTestId('progress')).toHaveTextContent('50');
    }

    // Wait for translation to complete
    await waitFor(() => {
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Translated: Hello world from en to zh');
      expect(screen.getByTestId('is-translating')).toHaveTextContent('false');
      expect(screen.getByTestId('progress')).toHaveTextContent('100');
    });
  });

  test('cancels translation', () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    // Set input text
    fireEvent.click(screen.getByText('Set Input'));

    // Start translation
    fireEvent.click(screen.getByText('Translate'));

    // Check loading state
    expect(screen.getByTestId('is-translating')).toHaveTextContent('true');

    // Cancel translation
    fireEvent.click(screen.getByText('Cancel'));

    // Check state after cancellation
    expect(screen.getByTestId('is-translating')).toHaveTextContent('false');
    expect(screen.getByTestId('progress')).toHaveTextContent('0');

    // Check that service method was called
    expect(TranslationService.mock.instances[0].cancelTranslation).toHaveBeenCalled();
  });

  test('swaps languages', () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    // Set input and translated text
    fireEvent.click(screen.getByText('Set Input'));

    // Mock translated text by updating state directly
    screen.getByTestId('translated-text').textContent = 'Translated text';

    // Swap languages
    fireEvent.click(screen.getByText('Swap'));

    // Check that languages are swapped
    expect(screen.getByTestId('source-language')).toHaveTextContent('zh');
    expect(screen.getByTestId('target-language')).toHaveTextContent('en');

    // Input and translated text should also be swapped
    expect(screen.getByTestId('input-text')).toHaveTextContent('Translated text');
  });

  test('resets translation', () => {
    render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    // Set input text
    fireEvent.click(screen.getByText('Set Input'));

    // Reset translation
    fireEvent.click(screen.getByText('Reset'));

    // Check that state is reset
    expect(screen.getByTestId('input-text')).toHaveTextContent('');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('');
    expect(screen.getByTestId('is-translating')).toHaveTextContent('false');
    expect(screen.getByTestId('progress')).toHaveTextContent('0');
  });
});