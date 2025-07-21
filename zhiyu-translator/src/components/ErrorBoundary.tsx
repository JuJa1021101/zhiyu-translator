import React, { Component, ErrorInfo, ReactNode } from 'react';
import { TranslationError, TranslationErrorType } from '../types/errors';
import { createTranslationError } from '../utils/errorUtils';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: TranslationError, resetError: () => void) => ReactNode);
  onError?: (error: TranslationError, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: TranslationError | null;
  hasError: boolean;
}

/**
 * Error Boundary component to catch and handle React errors
 * Prevents the entire application from crashing when an error occurs in a component
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert standard error to TranslationError
    const translationError = error instanceof Error
      ? createTranslationError(
        TranslationErrorType.INTERNAL_ERROR,
        error.message,
        { stack: error.stack }
      )
      : error as TranslationError;

    // Update state to trigger fallback UI
    return {
      hasError: true,
      error: translationError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Convert standard error to TranslationError if needed
    const translationError = error instanceof Error
      ? createTranslationError(
        TranslationErrorType.INTERNAL_ERROR,
        error.message,
        { stack: error.stack, componentStack: errorInfo.componentStack }
      )
      : error as TranslationError;

    // Log error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(translationError, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // If a custom fallback is provided, use it
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.resetError);
        }
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <h2>应用程序出错了</h2>
            <p>抱歉，应用程序遇到了问题。</p>
            <p className="error-message">{error.message}</p>
            <button
              className="error-reset-button"
              onClick={this.resetError}
            >
              重试
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;