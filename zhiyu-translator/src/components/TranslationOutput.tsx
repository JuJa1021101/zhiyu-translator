import React, { useState } from 'react';
import { TranslationOutputProps } from '../types/components';
import './TranslationOutput.css';

/**
 * TranslationOutput component
 * A component for displaying translation results with copy functionality
 * and formatting options
 */
const TranslationOutput: React.FC<TranslationOutputProps> = ({
  value,
  isLoading = false,
  onCopy,
  className = '',
  showCopyButton = true,
  label,
  testId
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(true);

      // Reset copy success message after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);

      // Call the onCopy callback if provided
      if (onCopy) {
        onCopy();
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Format text with proper line breaks and spacing
  const formattedText = value
    ? value
      .split('\n')
      .map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)
    : '';

  return (
    <div
      className={`translation-output-container ${className}`}
      data-testid={testId}
    >
      {label && (
        <div className="translation-output-label">
          {label}
        </div>
      )}

      <div className={`translation-output-content ${isLoading ? 'loading' : ''}`}>
        {isLoading ? (
          <div className="translation-output-placeholder">
            <div className="translation-output-loading-line"></div>
            <div className="translation-output-loading-line"></div>
            <div className="translation-output-loading-line short"></div>
          </div>
        ) : value ? (
          <div className="translation-output-text">
            {formattedText}
          </div>
        ) : (
          <div className="translation-output-empty">
            翻译结果将显示在这里
          </div>
        )}
      </div>

      <div className="translation-output-footer">
        {showCopyButton && value && !isLoading && (
          <button
            className="copy-button"
            onClick={handleCopy}
            aria-label="复制翻译结果"
          >
            {copySuccess ? (
              <>
                <span className="copy-icon success">✓</span>
                已复制
              </>
            ) : (
              <>
                <span className="copy-icon">📋</span>
                复制
              </>
            )}
          </button>
        )}

        {value && !isLoading && (
          <div className="character-count">
            {value.length} 字符
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationOutput;