import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimelineBuilder } from '../index';
import { LifeEvent } from '@/types/profile';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';

// Mock hooks
jest.mock('@/hooks/useTimelineEvents');
const mockUseTimelineEvents = useTimelineEvents as jest.MockedFunction<typeof useTimelineEvents>;

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => children,
  Droppable: ({ children }: { children: (props: any) => React.ReactNode }) =>
    children({
      draggableProps: {
        style: {},
      },
      innerRef: jest.fn(),
    }),
  Draggable: ({ children }: { children: (props: any) => React.ReactNode }) =>
    children({
      draggableProps: {
        style: {},
      },
      innerRef: jest.fn(),
      dragHandleProps: {},
    }),
}));

describe('TimelineBuilder', () => {
  const mockEvents: LifeEvent[] = [
    {
      id: '1',
      type: 'education',
      title: 'Bachelor Degree',
      description: 'Computer Science',
      startDate: '2018-09-01',
      endDate: '2022-06-30',
    },
  ];

  const mockOnEventsChange = jest.fn();
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimelineEvents.mockReturnValue({
      events: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders initial events in create mode', () => {
    render(
      <TimelineBuilder
        initialEvents={mockEvents}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
      />
    );

    expect(screen.getByText('Bachelor Degree')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
  });

  it('renders fetched events in edit mode', () => {
    mockUseTimelineEvents.mockReturnValue({
      events: mockEvents,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <TimelineBuilder
        initialEvents={[]}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
        isEditMode={true}
      />
    );

    expect(screen.getByText('Bachelor Degree')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseTimelineEvents.mockReturnValue({
      events: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <TimelineBuilder
        initialEvents={[]}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
        isEditMode={true}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const mockError = new Error('Failed to fetch');
    const mockRefetch = jest.fn();

    mockUseTimelineEvents.mockReturnValue({
      events: [],
      isLoading: false,
      error: mockError,
      refetch: mockRefetch,
    });

    render(
      <TimelineBuilder
        initialEvents={[]}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
        isEditMode={true}
      />
    );

    expect(screen.getByText('Failed to load timeline')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('opens form when Add Event button is clicked', () => {
    render(
      <TimelineBuilder
        initialEvents={mockEvents}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
      />
    );

    fireEvent.click(screen.getByText('Add Event'));
    expect(screen.getByLabelText('Event Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
  });

  it('validates required fields when submitting form', async () => {
    render(
      <TimelineBuilder
        initialEvents={mockEvents}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
      />
    );

    fireEvent.click(screen.getByText('Add Event'));
    fireEvent.click(screen.getByText('Add Event')); // Submit empty form

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Start date is required')).toBeInTheDocument();
    });
  });

  it('calls onNext when Next Step button is clicked', () => {
    render(
      <TimelineBuilder
        initialEvents={mockEvents}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
      />
    );

    fireEvent.click(screen.getByText('Next Step'));
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('disables Next Step button when no events exist', () => {
    render(
      <TimelineBuilder
        initialEvents={[]}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
      />
    );

    expect(screen.getByText('Next Step')).toBeDisabled();
  });

  it('allows editing an existing event', async () => {
    render(
      <TimelineBuilder
        initialEvents={mockEvents}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
      />
    );

    // Click edit button
    fireEvent.click(screen.getByLabelText('Edit event'));

    // Form should be open with existing data
    expect(screen.getByDisplayValue('Bachelor Degree')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Computer Science')).toBeInTheDocument();
  });

  it('allows deleting an event', () => {
    render(
      <TimelineBuilder
        initialEvents={mockEvents}
        onEventsChange={mockOnEventsChange}
        onNext={mockOnNext}
        orgId="org123"
        profileId="profile123"
      />
    );

    fireEvent.click(screen.getByLabelText('Delete event'));
    expect(mockOnEventsChange).toHaveBeenCalledWith([]);
  });
}); 