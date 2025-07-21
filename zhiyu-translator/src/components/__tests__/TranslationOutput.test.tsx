import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TranslationOutput from '../TranslationOutput';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve())
  }
});

describe('TranslationOutput Component', () => {
  const mockOnCopy = vi.fn();

  const defaultProps = {
    value: '',
    testId: 'translation-output'
  };

  beforeEach(() => {
    mockOnCopy.mockClear();
    vi.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<TranslationOutput {...defaultProps} />);

    expect(screen.getByText('翻译结果将显示在这里')).toBeInTheDocument();
  });

  test('displays translation value when provided', () => {
    render(<TranslationOutput {...defaultProps} value="Hello world" />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  test('displays loading placeholder when isLoading is true', () => {
    render(<TranslationOutput {...defaultProps} isLoading={true} />);

    // Check for loading animation elements
    const loadingLines = screen.getAllByClassName(/translation-output-loading-line/);
    expect(loadingLines.length).toBeGreaterThan(0);

    // Empty message should not be shown
    expect(screen.queryByText('翻译结果将显示在这里')).not.toBeInTheDocument();
  });

  test('shows copy button when there is content', () => {
    render(<TranslationOutput {...defaultProps} value="Hello world" />);

    expect(screen.getByRole('button', { name: /复制/i })).toBeInTheDocument();
  });

  test('does not show copy button when showCopyButton is false', () => {
    render(<TranslationOutput {...defaultProps} value="Hello world" showCopyButton={false} />);

    expect(screen.queryByRole('button', { name: /复制/i })).not.toBeInTheDocument();
  });

  test('copies text to clipboard when copy button is clicked', async () => {
    render(<TranslationOutput {...defaultProps} value="Hello world" onCopy={mockOnCopy} />);

    const copyButton = screen.getByRole('button', { name: /复制/i });
    fireEvent.click(copyButton);

    // Check if clipboard API was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello world');

    // Check if onCopy callback was called
    expect(mockOnCopy).toHaveBeenCalled();

    // Check if success message is shown
    await waitFor(() => {
      expect(screen.getByText('已复制')).toBeInTheDocument();
    });
  });

  test('shows character count when there is content', () => {
    render(<TranslationOutput {...defaultProps} value="Hello world" />);

    expect(screen.getByText('11 字符')).toBeInTheDocument();
  });

  test('handles multiline text correctly', () => {
    render(<TranslationOutput {...defaultProps} value="Line 1\nLine 2" />);

    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
  });

  test('displays label when provided', () => {
    render(<TranslationOutput {...defaultProps} label="Translation Result" />);

    expect(screen.getByText('Translation Result')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<TranslationOutput {...defaultProps} className="custom-class" />);

    const container = screen.getByTestId('translation-output');
    expect(container).toHaveClass('custom-class');
  });
});