import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TranslationInput from '../TranslationInput';

// Mock the debounce function to execute immediately in tests
vi.mock('../../utils/performanceUtils', () => ({
  debounce: (fn: Function) => fn
}));

describe('TranslationInput Component', () => {
  const mockOnChange = vi.fn();
  const mockOnKeyDown = vi.fn();

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    testId: 'translation-input'
  };

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnKeyDown.mockClear();
  });

  test('renders with default props', () => {
    render(<TranslationInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', '输入要翻译的文本...');
  });

  test('displays the provided value', () => {
    render(<TranslationInput {...defaultProps} value="Hello world" />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Hello world');
  });

  test('calls onChange when text is entered', async () => {
    render(<TranslationInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'Hello');

    expect(mockOnChange).toHaveBeenCalledWith('Hello');
  });

  test('shows clear button when text is entered', () => {
    render(<TranslationInput {...defaultProps} value="Hello world" />);

    const clearButton = screen.getByRole('button', { name: /清除文本/i });
    expect(clearButton).toBeInTheDocument();
  });

  test('clears text when clear button is clicked', () => {
    render(<TranslationInput {...defaultProps} value="Hello world" />);

    const clearButton = screen.getByRole('button', { name: /清除文本/i });
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  test('does not show clear button when text is empty', () => {
    render(<TranslationInput {...defaultProps} value="" />);

    expect(screen.queryByRole('button', { name: /清除文本/i })).not.toBeInTheDocument();
  });

  test('displays character count when maxLength is provided', () => {
    render(<TranslationInput {...defaultProps} value="Hello" maxLength={100} />);

    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  test('applies near-limit class when close to character limit', () => {
    render(<TranslationInput {...defaultProps} value="Hello world" maxLength={20} />);

    const counter = screen.getByText('11/20');
    expect(counter).toHaveClass('near-limit');
  });

  test('applies at-limit class when at character limit', () => {
    render(<TranslationInput {...defaultProps} value="This is exactly 20 chars" maxLength={20} />);

    const counter = screen.getByText('20/20');
    expect(counter).toHaveClass('at-limit');
  });

  test('prevents input beyond maxLength', async () => {
    render(<TranslationInput {...defaultProps} value="Hello" maxLength={10} />);

    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, ' world is too long');

    // onChange should not be called with text longer than maxLength
    expect(mockOnChange).not.toHaveBeenCalledWith('Hello world is too long');
  });

  test('displays error message when provided', () => {
    render(<TranslationInput {...defaultProps} error="Input is invalid" />);

    expect(screen.getByText('Input is invalid')).toBeInTheDocument();
    expect(screen.getByRole('textbox').parentElement).toHaveClass('has-error');
  });

  test('disables the textarea when disabled prop is true', () => {
    render(<TranslationInput {...defaultProps} disabled={true} />);

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /清除文本/i })).not.toBeInTheDocument();
  });

  test('calls onKeyDown when key is pressed', () => {
    render(<TranslationInput {...defaultProps} onKeyDown={mockOnKeyDown} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(mockOnKeyDown).toHaveBeenCalled();
  });

  test('displays label when provided', () => {
    render(<TranslationInput {...defaultProps} label="Translation Input" />);

    expect(screen.getByText('Translation Input')).toBeInTheDocument();
  });
});