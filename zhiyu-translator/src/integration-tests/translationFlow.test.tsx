import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { TranslationProvider } from '../context/TranslationContext';
import { TranslationService } from '../services/TranslationService';

// Mock the TranslationService
vi.mock('../services/TranslationService', () => {
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

describe('Translation Flow Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressCallback = null;
  });

  test('complete translation flow from input to output', async () => {
    render(
      <TranslationProvider>
        <App />
      </TranslationProvider>
    );

    // Find the input component
    const inputTextarea = screen.getByPlaceholderText('输入要翻译的文本...');
    expect(inputTextarea).toBeInTheDocument();

    // Type text in the input
    await userEvent.type(inputTextarea, 'Hello world');

    // Find and click the translate button
    const translateButton = screen.getByRole('button', { name: /翻译/i });
    fireEvent.click(translateButton);

    // Check that the translation service was called with correct parameters
    expect(TranslationService.mock.instances[0].translate).toHaveBeenCalledWith(
      'Hello world',
      'en', // Default source language
      'zh'  // Default target language
    );

    // Simulate progress updates
    if (mockProgressCallback) {
      mockProgressCallback(25);
      mockProgressCallback(50);
      mockProgressCallback(75);
      mockProgressCallback(100);
    }

    // Wait for the translated text to appear
    await waitFor(() => {
      expect(screen.getByText('Translated: Hello world from en to zh')).toBeInTheDocument();
    });

    // Test language swap functionality
    const swapButton = screen.getByRole('button', { name: /交换语言/i });
    fireEvent.click(swapButton);

    // Check that source and target languages were swapped
    // This would require checking the state or UI elements that show the selected languages

    // Test translation cancellation
    await userEvent.type(inputTextarea, 'Another text');
    fireEvent.click(translateButton);

    // Find and click the cancel button
    const cancelButton = screen.getByRole('button', { name: /取消/i });
    fireEvent.click(cancelButton);

    // Check that the translation service's cancelTranslation was called
    expect(TranslationService.mock.instances[0].cancelTranslation).toHaveBeenCalled();
  });

  test('handles translation errors gracefully', async () => {
    // Mock the translate method to reject
    (TranslationService as jest.Mock).mockImplementationOnce(() => ({
      translate: vi.fn().mockRejectedValue(new Error('Translation failed')),
      onProgress: vi.fn().mockReturnValue(() => { }),
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      cancelTranslation: vi.fn()
    }));

    render(
      <TranslationProvider>
        <App />
      </TranslationProvider>
    );

    // Find the input component
    const inputTextarea = screen.getByPlaceholderText('输入要翻译的文本...');

    // Type text in the input
    await userEvent.type(inputTextarea, 'Hello world');

    // Find and click the translate button
    const translateButton = screen.getByRole('button', { name: /翻译/i });
    fireEvent.click(translateButton);

    // Wait for the error notification to appear
    await waitFor(() => {
      expect(screen.getByText(/Translation failed/i)).toBeInTheDocument();
    });

    // Check that the retry button appears
    const retryButton = screen.getByRole('button', { name: /重试/i });
    expect(retryButton).toBeInTheDocument();

    // Click retry and check that translation is attempted again
    fireEvent.click(retryButton);
    expect(TranslationService.mock.instances[0].translate).toHaveBeenCalledTimes(2);
  });
});