import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ErrorNotification from '../ErrorNotification';
import { TranslationError, TranslationErrorType } from '../../types/errors';
import { createTranslationError } from '../../utils/errorUtils';

describe('ErrorNotification Component', () => {
  const mockOnDismiss = vi.fn();
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
    mockOnRetry.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders nothing when error is null', () => {
    const { container } = render(
      <ErrorNotification
        error={null}
        onDismiss={mockOnDismiss}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders error message when error is provided', () => {
    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    render(
      <ErrorNotification
        error={error}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Translation failed')).toBeInTheDocument();
  });

  test('applies correct severity class based on error type', () => {
    const criticalError = createTranslationError(
      TranslationErrorType.INTERNAL_ERROR,
      'Critical error'
    );

    const { rerender } = render(
      <ErrorNotification
        error={criticalError}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByRole('alert')).toHaveClass('critical');

    const warningError = createTranslationError(
      TranslationErrorType.NETWORK_ERROR,
      'Network error'
    );

    rerender(
      <ErrorNotification
        error={warningError}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByRole('alert')).toHaveClass('warning');
  });

  test('shows retry button for recoverable errors', () => {
    const recoverableError = createTranslationError(
      TranslationErrorType.NETWORK_ERROR,
      'Network error'
    );

    render(
      <ErrorNotification
        error={recoverableError}
        onDismiss={mockOnDismiss}
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /重试/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalled();
  });

  test('does not show retry button for non-recoverable errors', () => {
    const nonRecoverableError = createTranslationError(
      TranslationErrorType.INVALID_INPUT,
      'Invalid input'
    );

    render(
      <ErrorNotification
        error={nonRecoverableError}
        onDismiss={mockOnDismiss}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.queryByRole('button', { name: /重试/i })).not.toBeInTheDocument();
  });

  test('calls onDismiss when close button is clicked', async () => {
    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    render(
      <ErrorNotification
        error={error}
        onDismiss={mockOnDismiss}
      />
    );

    const closeButton = screen.getByRole('button', { name: /关闭/i });
    fireEvent.click(closeButton);

    // Wait for animation to complete
    vi.advanceTimersByTime(300);

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  test('auto-dismisses after specified duration', async () => {
    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    render(
      <ErrorNotification
        error={error}
        onDismiss={mockOnDismiss}
        autoHideDuration={2000}
      />
    );

    // Auto-hide should not have been triggered yet
    expect(mockOnDismiss).not.toHaveBeenCalled();

    // Advance time to trigger auto-hide
    vi.advanceTimersByTime(2000);

    // Wait for animation to complete
    vi.advanceTimersByTime(300);

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  test('has visible class when mounted with error', () => {
    const error = createTranslationError(
      TranslationErrorType.TRANSLATION_FAILED,
      'Translation failed'
    );

    render(
      <ErrorNotification
        error={error}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByRole('alert')).toHaveClass('visible');
    expect(screen.getByRole('alert')).not.toHaveClass('hidden');
  });
});