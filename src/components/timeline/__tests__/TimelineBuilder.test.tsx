import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimelineBuilder } from '../TimelineBuilder';
import { useToast } from '../../../hooks/useToast';
import { useAnalytics } from '../../../hooks/useAnalytics';

// Mock the hooks
jest.mock('../../../hooks/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

describe('TimelineBuilder', () => {
  const mockOnUpdate = jest.fn();
  const mockShowToast = jest.fn();
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
  });

  it('renders empty state correctly', () => {
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Add Event')).toBeInTheDocument();
    expect(screen.queryByText('Timeline Preview')).not.toBeInTheDocument();
  });

  it('shows form when Add Event is clicked', () => {
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Event'));
    
    expect(screen.getByLabelText('Event Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Institution')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Event'));
    fireEvent.click(screen.getByText('Save Event'));
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Start date is required')).toBeInTheDocument();
    });
  });

  it('validates field length limits', async () => {
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Event'));
    
    const longTitle = 'a'.repeat(101);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: longTitle },
    });
    
    fireEvent.click(screen.getByText('Save Event'));
    
    await waitFor(() => {
      expect(screen.getByText('Title must be less than 100 characters')).toBeInTheDocument();
    });
  });

  it('validates end date is in the future', async () => {
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Event'));
    
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Title' },
    });
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2020-01-01' },
    });
    fireEvent.change(screen.getByLabelText('End Date'), {
      target: { value: pastDate.toISOString().split('T')[0] },
    });
    
    fireEvent.click(screen.getByText('Save Event'));
    
    await waitFor(() => {
      expect(screen.getByText('End date must be in the future')).toBeInTheDocument();
    });
  });

  it('submits form with valid data and tracks analytics', async () => {
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Event'));
    
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Bachelor of Science' },
    });
    fireEvent.change(screen.getByLabelText('Institution'), {
      target: { value: 'University of Example' },
    });
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2020-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Example City' },
    });
    
    fireEvent.click(screen.getByText('Save Event'));
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Timeline Updated',
        description: 'Your timeline has been saved successfully.',
        status: 'success',
      });
      expect(mockTrackEvent).toHaveBeenCalledWith('timeline_event_added', {
        eventType: 'education',
        hasEndDate: false,
        hasLocation: true,
        hasDescription: false,
      });
    });
  });

  it('displays existing events with proper ARIA attributes', () => {
    const existingEvents = [
      {
        id: '1',
        type: 'education' as const,
        title: 'Bachelor of Science',
        institution: 'University of Example',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        location: 'Example City',
      },
    ];
    
    render(<TimelineBuilder existingEvents={existingEvents} onUpdate={mockOnUpdate} />);
    
    expect(screen.getByText('Timeline Preview')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Science')).toBeInTheDocument();
    expect(screen.getByText('University of Example')).toBeInTheDocument();
    expect(screen.getByText('Example City')).toBeInTheDocument();
    
    const eventArticle = screen.getByRole('article');
    expect(eventArticle).toHaveAttribute('aria-labelledby', 'event-1-title');
  });

  it('removes event and tracks analytics', async () => {
    const existingEvents = [
      {
        id: '1',
        type: 'education' as const,
        title: 'Bachelor of Science',
        institution: 'University of Example',
        startDate: '2020-01-01',
      },
    ];
    
    render(<TimelineBuilder existingEvents={existingEvents} onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByLabelText('Remove Bachelor of Science event'));
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith([]);
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Event Removed',
        description: 'The timeline event has been removed.',
        status: 'success',
      });
      expect(mockTrackEvent).toHaveBeenCalledWith('timeline_event_removed', {
        eventId: '1',
        remainingEvents: 0,
      });
    });
  });

  it('handles save errors with specific error message', async () => {
    const error = new Error('Network error');
    mockOnUpdate.mockRejectedValueOnce(error);
    
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Event'));
    
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Bachelor of Science' },
    });
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2020-01-01' },
    });
    
    fireEvent.click(screen.getByText('Save Event'));
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Network error',
        status: 'error',
      });
    });
  });

  it('changes institution/company label based on event type', () => {
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Event'));
    
    expect(screen.getByLabelText('Institution')).toBeInTheDocument();
    
    fireEvent.change(screen.getByLabelText('Event Type'), {
      target: { value: 'job' },
    });
    
    expect(screen.getByLabelText('Company')).toBeInTheDocument();
  });

  it('closes form on escape key', () => {
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Event'));
    expect(screen.getByLabelText('Event Type')).toBeInTheDocument();
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(screen.queryByLabelText('Event Type')).not.toBeInTheDocument();
  });

  it('focuses first input when form opens', () => {
    render(<TimelineBuilder onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Event'));
    
    const eventTypeSelect = screen.getByLabelText('Event Type');
    expect(eventTypeSelect).toHaveFocus();
  });
}); 