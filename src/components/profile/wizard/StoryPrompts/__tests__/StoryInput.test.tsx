import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StoryInput } from '../StoryInput';

describe('StoryInput', () => {
  const defaultProps = {
    id: 'test-input',
    value: 'initial value',
    onChange: jest.fn(),
    placeholder: 'Enter your story',
    maxLength: 2000,
    isSaving: false,
    hasError: false,
    onRetry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial value', () => {
    render(<StoryInput {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('initial value');
  });

  it('calls onChange when value changes', () => {
    render(<StoryInput {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'new value' } });
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('new value');
  });

  it('shows loading state when saving', () => {
    render(<StoryInput {...defaultProps} isSaving={true} />);
    expect(screen.getByRole('textbox')).toHaveClass('opacity-50');
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows saved indicator after successful save', () => {
    const { rerender } = render(<StoryInput {...defaultProps} isSaving={true} />);
    
    // Simulate save completion
    rerender(<StoryInput {...defaultProps} isSaving={false} />);
    
    expect(screen.getByText('Saved')).toBeInTheDocument();
    
    // Indicator should disappear after 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('shows retry button when there is an error', () => {
    render(<StoryInput {...defaultProps} hasError={true} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(defaultProps.onRetry).toHaveBeenCalled();
  });

  it('shows character count', () => {
    render(<StoryInput {...defaultProps} value="test" maxLength={100} />);
    expect(screen.getByText('4 / 100 characters')).toBeInTheDocument();
  });

  it('applies error styles when hasError is true', () => {
    render(<StoryInput {...defaultProps} hasError={true} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('border-red-300');
  });
}); 