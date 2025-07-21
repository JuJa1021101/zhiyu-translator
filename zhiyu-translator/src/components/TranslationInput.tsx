import React, { useRef, useEffect, useCallback } from 'react';
import { TranslationInputProps } from '../types/components';
import { debounce } from '../utils/performanceUtils';
import './TranslationInput.css';

/**
 * TranslationInput component
 * A text input component for entering text to be translated
 * Supports auto-resizing, character count, and error display
 * Includes debouncing for input changes to improve performance
 */
const TranslationInput: React.FC<TranslationInputProps> = ({
  value,
  onChange,
  placeholder = '输入要翻译的文本...',
  disabled = false,
  maxLength,
  autoFocus = false,
  className = '',
  label,
  error,
  onKeyDown,
  testId,
  debounceTime = 300 // Default debounce time in ms
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set the height to scrollHeight to fit all content
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Auto-resize on value change
  useEffect(() => {
    autoResize();
  }, [value]);

  // Auto-focus when component mounts if autoFocus is true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Create debounced onChange handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, debounceTime),
    [onChange, debounceTime]
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // If maxLength is defined, limit the input
    if (maxLength !== undefined && newValue.length > maxLength) {
      return;
    }

    // Update the UI immediately for responsiveness
    if (textareaRef.current) {
      textareaRef.current.value = newValue;
      autoResize();
    }

    // Use debounced function for the actual state update
    debouncedOnChange(newValue);
  };

  // Calculate remaining characters if maxLength is defined
  const remainingChars = maxLength !== undefined ? maxLength - value.length : undefined;
  const isNearLimit = remainingChars !== undefined && remainingChars < 20;
  const isAtLimit = remainingChars !== undefined && remainingChars <= 0;

  return (
    <div
      className={`translation-input-container ${className}`}
      data-testid={testId}
    >
      {label && (
        <label htmlFor="translation-input" className="translation-input-label">
          {label}
        </label>
      )}

      <div className={`translation-textarea-wrapper ${error ? 'has-error' : ''}`}>
        <textarea
          ref={textareaRef}
          id="translation-input"
          className="translation-textarea"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={onKeyDown}
          aria-invalid={!!error}
          aria-describedby={error ? "translation-input-error" : undefined}
        />

        {/* Clear button */}
        {value.length > 0 && !disabled && (
          <button
            type="button"
            className="clear-button"
            onClick={() => onChange('')}
            aria-label="清除文本"
          >
            ×
          </button>
        )}
      </div>

      <div className="translation-input-footer">
        {/* Error message */}
        {error && (
          <div
            id="translation-input-error"
            className="translation-input-error"
          >
            {error}
          </div>
        )}

        {/* Character counter */}
        {maxLength !== undefined && (
          <div className={`character-counter ${isNearLimit ? 'near-limit' : ''} ${isAtLimit ? 'at-limit' : ''}`}>
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationInput;