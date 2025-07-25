import React, { useEffect, useState } from 'react';
import './ErrorNotification.css';

interface ErrorNotificationProps {
  error: Error | null;
  onDismiss: () => void;
  onRetry?: () => void;
  autoHideDuration?: number;
}

/**
 * Component for displaying user-friendly error notifications
 */
const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  autoHideDuration
}) => {
  const [visible, setVisible] = useState(false);

  // Show notification with animation when error changes
  useEffect(() => {
    if (error) {
      setVisible(true);

      // Auto-hide notification after specified duration if provided
      if (autoHideDuration) {
        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(onDismiss, 300); // Wait for exit animation to complete
        }, autoHideDuration);

        return () => clearTimeout(timer);
      }
    }
  }, [error, autoHideDuration, onDismiss]);

  // Handle close animation
  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 300); // Wait for exit animation to complete
  };

  if (!error) return null;

  // Simplified error handling - treat all errors as recoverable
  const message = error.message || '发生了未知错误';

  return (
    <div
      className={`error-notification error ${visible ? 'visible' : 'hidden'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-notification-content">
        <div className="error-notification-icon">
          ⚠️
        </div>
        <div className="error-notification-message">
          {message}
        </div>
        <div className="error-notification-actions">
          {onRetry && (
            <button
              className="error-notification-retry"
              onClick={onRetry}
              aria-label="重试"
            >
              重试
            </button>
          )}
          <button
            className="error-notification-close"
            onClick={handleClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;