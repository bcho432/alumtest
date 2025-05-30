import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimelineView } from '../TimelineView';
import { useToast } from '../../../hooks/useToast';
import { useAnalytics } from '../../../hooks/useAnalytics';

// Mock the hooks
jest.mock('../../../hooks/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

describe('TimelineView', () => {
  const mockEvents = [
    {
      id: '1',
      type: 'education' as const,
      title: 'Bachelor of Science',
      institution: 'University of Example',
      startDate: '2020-01-01',
      endDate: '2024-01-01',
      location: 'Example City',
      description: 'Computer Science',
    },
    {
      id: '2',
      type: 'job' as const,
      title: 'Software Engineer',
      company: 'Tech Corp',
      startDate: '2024-02-01',
      location: 'Tech City',
      description: 'Full-stack development',
    },
  ];

  const mockOnEventClick = jest.fn();
  const mockOnEventEdit = jest.fn();
  const mockOnEventDelete = jest.fn();
  const mockShowToast = jest.fn();
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
  });

  it('renders events correctly', () => {
    render(
      <TimelineView
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onEventEdit={mockOnEventEdit}
        onEventDelete={mockOnEventDelete}
      />
    );

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Science')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TimelineView events={[]} isLoading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    render(<TimelineView events={[]} isEditable={true} />);
    expect(screen.getByText(/No events found/)).toBeInTheDocument();
    expect(screen.getByText(/Try adding some events/)).toBeInTheDocument();
  });

  it('handles event click', () => {
    render(
      <TimelineView
        events={mockEvents}
        onEventClick={mockOnEventClick}
      />
    );

    fireEvent.click(screen.getByText('Bachelor of Science'));
    expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('handles event edit', () => {
    render(
      <TimelineView
        events={mockEvents}
        onEventEdit={mockOnEventEdit}
        isEditable={true}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    fireEvent.click(editButtons[0]);
    expect(mockOnEventEdit).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('handles event delete', () => {
    render(
      <TimelineView
        events={mockEvents}
        onEventDelete={mockOnEventDelete}
        isEditable={true}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    fireEvent.click(deleteButtons[0]);
    expect(mockOnEventDelete).toHaveBeenCalledWith(mockEvents[0].id);
  });

  it('filters events by search term', async () => {
    render(<TimelineView events={mockEvents} />);

    // Open filter panel
    fireEvent.click(screen.getByText('Filter'));

    // Enter search term
    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Bachelor' } });

    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));

    await waitFor(() => {
      expect(screen.getByText('Bachelor of Science')).toBeInTheDocument();
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });

  it('filters events by type', async () => {
    render(<TimelineView events={mockEvents} />);

    // Open filter panel
    fireEvent.click(screen.getByText('Filter'));

    // Uncheck job type
    const jobCheckbox = screen.getByLabelText('job');
    fireEvent.click(jobCheckbox);

    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));

    await waitFor(() => {
      expect(screen.getByText('Bachelor of Science')).toBeInTheDocument();
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });

  it('filters events by date range', async () => {
    render(<TimelineView events={mockEvents} />);

    // Open filter panel
    fireEvent.click(screen.getByText('Filter'));

    // Set date range
    const startDateInput = screen.getByLabelText('Start Date');
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));

    await waitFor(() => {
      expect(screen.queryByText('Bachelor of Science')).not.toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
  });

  it('tracks analytics when filters are applied', async () => {
    render(<TimelineView events={mockEvents} />);

    // Open filter panel
    fireEvent.click(screen.getByText('Filter'));

    // Set filters
    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Bachelor' } });

    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith('timeline_filter_applied', {
        filterCount: expect.any(Number),
        eventTypes: expect.any(Array),
        hasDateRange: false,
      });
    });
  });

  it('closes filter panel on cancel', () => {
    render(<TimelineView events={mockEvents} />);

    // Open filter panel
    fireEvent.click(screen.getByText('Filter'));
    expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();

    // Close filter panel
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Search events...')).not.toBeInTheDocument();
  });
}); 