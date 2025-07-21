import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import { TranslationErrorType } from '../../types/errors';

// Create a component that throws an error
const ErrorComponent = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  test('renders default fallback UI when an error occurs', () => {
    // We need to mock the console.error to avoid test output noise
    const spy = vi.spyOn(console, 'error');
    spy.mockImplementation(() => { });

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('应用程序出错了')).toBeInTheDocument();
    expect(screen.getByText('抱歉，应用程序遇到了问题。')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();

    spy.mockRestore();
  });

  test('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  test('calls custom fallback function when provided', () => {
    const customFallback = (error, resetError) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={resetError}>Custom reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Custom reset/i })).toBeInTheDocument();
  });

  test('calls onError callback when an error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    const [error, errorInfo] = onError.mock.calls[0];
    expect(error.message).toBe('Test error');
    expect(errorInfo).toHaveProperty('componentStack');
  });

  test('resets error state when reset button is clicked', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary>
          {shouldThrow ? (
            <ErrorComponent />
          ) : (
            <div>
              <p>Error resolved</p>
              <button onClick={() => setShouldThrow(true)}>Throw again</button>
            </div>
          )}
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Initially shows error UI
    expect(screen.getByText('应用程序出错了')).toBeInTheDocument();

    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /重试/i }));

    // Should show the recovered UI
    expect(screen.getByText('Error resolved')).toBeInTheDocument();

    // Throw error again
    fireEvent.click(screen.getByRole('button', { name: /Throw again/i }));

    // Should show error UI again
    expect(screen.getByText('应用程序出错了')).toBeInTheDocument();
  });
});