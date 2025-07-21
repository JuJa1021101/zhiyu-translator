import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSelector from '../LanguageSelector';
import { SUPPORTED_LANGUAGES } from '../../types/languages';

describe('LanguageSelector Component', () => {
  const mockOnChange = vi.fn();
  const testLanguages = SUPPORTED_LANGUAGES;
  const defaultProps = {
    value: 'en',
    onChange: mockOnChange,
    languages: testLanguages,
    label: 'Select Language',
    testId: 'language-selector'
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renders with default props', () => {
    render(<LanguageSelector {...defaultProps} />);

    // Check if label is rendered
    expect(screen.getByText('Select Language')).toBeInTheDocument();

    // Check if selected language is displayed
    const selectedLanguage = testLanguages.find(lang => lang.code === 'en');
    expect(screen.getByText(new RegExp(selectedLanguage!.name))).toBeInTheDocument();
  });

  test('opens dropdown when clicked', async () => {
    render(<LanguageSelector {...defaultProps} />);

    // Dropdown should be closed initially
    expect(screen.queryByPlaceholderText('搜索语言...')).not.toBeInTheDocument();

    // Click to open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Dropdown should be open now
    expect(screen.getByPlaceholderText('搜索语言...')).toBeInTheDocument();

    // All languages should be in the dropdown
    testLanguages.forEach(lang => {
      expect(screen.getByText(new RegExp(lang.name))).toBeInTheDocument();
    });
  });

  test('filters languages based on search term', async () => {
    render(<LanguageSelector {...defaultProps} />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Type in search box
    const searchInput = screen.getByPlaceholderText('搜索语言...');
    await userEvent.type(searchInput, 'chin');

    // Should show Chinese but not English
    expect(screen.getByText(/Chinese/)).toBeInTheDocument();
    expect(screen.queryByText(/German/)).not.toBeInTheDocument();
  });

  test('selects a language when clicked', async () => {
    render(<LanguageSelector {...defaultProps} />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Click on a language
    fireEvent.click(screen.getByText(/Japanese/));

    // onChange should be called with the correct code
    expect(mockOnChange).toHaveBeenCalledWith('ja');

    // Dropdown should be closed
    expect(screen.queryByPlaceholderText('搜索语言...')).not.toBeInTheDocument();
  });

  test('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <LanguageSelector {...defaultProps} />
      </div>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Dropdown should be open
    expect(screen.getByPlaceholderText('搜索语言...')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside-element'));

    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('搜索语言...')).not.toBeInTheDocument();
    });
  });

  test('displays error message when provided', () => {
    render(<LanguageSelector {...defaultProps} error="Invalid selection" />);

    expect(screen.getByText('Invalid selection')).toBeInTheDocument();
    expect(screen.getByRole('button').parentElement).toHaveClass('has-error');
  });

  test('disables the selector when disabled prop is true', () => {
    render(<LanguageSelector {...defaultProps} disabled={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('displays required mark when required prop is true', () => {
    render(<LanguageSelector {...defaultProps} required={true} />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('displays custom placeholder when no language is selected', () => {
    render(<LanguageSelector {...defaultProps} value="" placeholder="Custom Placeholder" />);

    expect(screen.getByText('Custom Placeholder')).toBeInTheDocument();
  });
});