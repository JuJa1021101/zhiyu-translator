import React from 'react';
import { render, screen } from '@testing-library/react';
import ProgressIndicator from '../ProgressIndicator';

describe('ProgressIndicator Component', () => {
  const defaultProps = {
    progress: 50,
    message: 'Loading...',
    isVisible: true,
    testId: 'progress-indicator'
  };

  test('renders linear progress indicator with default props', () => {
    render(<ProgressIndicator {...defaultProps} />);

    // Check if message is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Check if percentage is displayed
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Check if progress bar exists
    const progressBar = screen.getByTestId('progress-indicator');
    expect(progressBar).toHaveClass('linear-indicator');
  });

  test('renders circular progress indicator when variant is circular', () => {
    render(<ProgressIndicator {...defaultProps} variant="circular" />);

    // Check if message is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Check if percentage is displayed
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Check if circular progress exists
    const progressIndicator = screen.getByTestId('progress-indicator');
    expect(progressIndicator).toHaveClass('circular-indicator');

    // Check if SVG exists
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  test('does not render when isVisible is false', () => {
    render(<ProgressIndicator {...defaultProps} isVisible={false} />);

    // Component should not be in the document
    expect(screen.queryByTestId('progress-indicator')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  test('does not show percentage when showPercentage is false', () => {
    render(<ProgressIndicator {...defaultProps} showPercentage={false} />);

    // Message should be displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Percentage should not be displayed
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  test('applies custom size class', () => {
    render(<ProgressIndicator {...defaultProps} size="small" />);

    const progressIndicator = screen.getByTestId('progress-indicator');
    expect(progressIndicator).toHaveClass('progress-small');
  });

  test('applies custom color style', () => {
    render(<ProgressIndicator {...defaultProps} color="#ff0000" />);

    const progressIndicator = screen.getByTestId('progress-indicator');
    expect(progressIndicator).toHaveStyle('--progress-color: #ff0000');
  });

  test('applies custom className', () => {
    render(<ProgressIndicator {...defaultProps} className="custom-class" />);

    const progressIndicator = screen.getByTestId('progress-indicator');
    expect(progressIndicator).toHaveClass('custom-class');
  });

  test('handles progress at 0%', () => {
    render(<ProgressIndicator {...defaultProps} progress={0} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('handles progress at 100%', () => {
    render(<ProgressIndicator {...defaultProps} progress={100} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});