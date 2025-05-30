import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StoryPromptPage } from '../StoryPromptPage';
import { useToast } from '../../../hooks/useToast';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { StoryAnswer } from '../../../types/profile';

// Mock the hooks
jest.mock('../../../hooks/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

describe('StoryPromptPage', () => {
  const mockOnUpdate = jest.fn();
  const mockShowToast = jest.fn();
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
  });

  it('renders all categories', () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    expect(screen.getByText('professional')).toBeInTheDocument();
    expect(screen.getByText('academic')).toBeInTheDocument();
    expect(screen.getByText('philosophical')).toBeInTheDocument();
    expect(screen.getByText('personal')).toBeInTheDocument();
    expect(screen.getByText('fun')).toBeInTheDocument();
  });

  it('expands and collapses categories', () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    // Initially collapsed
    expect(screen.queryByText('What inspired you to pursue your current career path?')).not.toBeInTheDocument();
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    expect(screen.getByText('What inspired you to pursue your current career path?')).toBeInTheDocument();
    
    // Collapse professional category
    fireEvent.click(screen.getByText('professional'));
    expect(screen.queryByText('What inspired you to pursue your current career path?')).not.toBeInTheDocument();
  });

  it('validates answer length', async () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    
    // Enter a long answer
    const longAnswer = 'a'.repeat(1001);
    fireEvent.change(screen.getByLabelText('What inspired you to pursue your current career path?'), {
      target: { value: longAnswer },
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Save Answers'));
    
    await waitFor(() => {
      expect(screen.getByText('Answer must be less than 1,000 characters')).toBeInTheDocument();
    });
  });

  it('submits valid answers and tracks analytics', async () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    
    // Enter valid answers
    fireEvent.change(screen.getByLabelText('What inspired you to pursue your current career path?'), {
      target: { value: 'My passion for technology' },
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Save Answers'));
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith([
        {
          id: 'prof-1',
          questionId: 'prof-1',
          question: 'What inspired you to pursue your current career path?',
          answer: 'My passion for technology',
        },
      ]);
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Answers Saved',
        description: 'Your story prompt answers have been saved successfully.',
        status: 'success',
      });
      expect(mockTrackEvent).toHaveBeenCalledWith('story_answer_submitted', {
        answerCount: 1,
        categories: ['professional'],
      });
    });
  });

  it('loads existing answers', () => {
    const existingAnswers: StoryAnswer[] = [
      {
        id: 'prof-1',
        questionId: 'prof-1',
        question: 'What inspired you to pursue your current career path?',
        answer: 'Existing answer',
      },
    ];
    
    render(<StoryPromptPage existingAnswers={existingAnswers} onUpdate={mockOnUpdate} />);
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    
    expect(screen.getByLabelText('What inspired you to pursue your current career path?')).toHaveValue('Existing answer');
  });

  it('handles submission errors', async () => {
    const error = new Error('Network error');
    mockOnUpdate.mockRejectedValueOnce(error);
    
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    
    // Enter valid answer
    fireEvent.change(screen.getByLabelText('What inspired you to pursue your current career path?'), {
      target: { value: 'My passion for technology' },
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Save Answers'));
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Network error',
        status: 'error',
      });
    });
  });

  it('tracks page view on mount', () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    expect(mockTrackEvent).toHaveBeenCalledWith('story_prompt_viewed');
  });

  it('shows character count', () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    
    // Enter some text
    fireEvent.change(screen.getByLabelText('What inspired you to pursue your current career path?'), {
      target: { value: 'Test answer' },
    });
    
    expect(screen.getByText('11/1000')).toBeInTheDocument();
  });

  it('disables submit button when no changes', () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    expect(screen.getByText('Save Answers')).toBeDisabled();
  });

  it('disables submit button while submitting', async () => {
    mockOnUpdate.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    
    // Enter valid answer
    fireEvent.change(screen.getByLabelText('What inspired you to pursue your current career path?'), {
      target: { value: 'My passion for technology' },
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Save Answers'));
    
    expect(screen.getByText('Saving...')).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('Save Answers')).not.toBeDisabled();
    });
  });

  it('closes expanded categories on escape key', () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    expect(screen.getByText('What inspired you to pursue your current career path?')).toBeInTheDocument();
    
    // Press escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Category should be collapsed
    expect(screen.queryByText('What inspired you to pursue your current career path?')).not.toBeInTheDocument();
  });

  it('focuses first input when category is expanded', () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    
    // First input should be focused
    expect(document.activeElement).toHaveAttribute('id', 'answer-prof-1');
  });

  it('announces character count changes', () => {
    render(<StoryPromptPage onUpdate={mockOnUpdate} />);
    
    // Expand professional category
    fireEvent.click(screen.getByText('professional'));
    
    // Enter some text
    fireEvent.change(screen.getByLabelText('What inspired you to pursue your current career path?'), {
      target: { value: 'Test answer' },
    });
    
    // Character count should be announced
    expect(screen.getByText('11/1000')).toHaveAttribute('aria-live', 'polite');
  });
}); 