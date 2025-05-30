import { renderHook, act } from '@testing-library/react';
import { useTimeline } from '../useTimeline';
import { useToast } from '../useToast';
import { useAnalytics } from '../useAnalytics';

// Mock the hooks
jest.mock('../useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

describe('useTimeline', () => {
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

  const mockOnEventsChange = jest.fn();
  const mockShowToast = jest.fn();
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
  });

  it('initializes with empty events', () => {
    const { result } = renderHook(() => useTimeline());
    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('initializes with provided events', () => {
    const { result } = renderHook(() =>
      useTimeline({ initialEvents: mockEvents })
    );
    expect(result.current.events).toEqual(mockEvents);
  });

  it('adds a new event', async () => {
    const { result } = renderHook(() =>
      useTimeline({ onEventsChange: mockOnEventsChange })
    );

    const newEvent = {
      type: 'education' as const,
      title: 'Master of Science',
      institution: 'University of Example',
      startDate: '2024-09-01',
    };

    await act(async () => {
      await result.current.addEvent(newEvent);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toMatchObject(newEvent);
    expect(mockOnEventsChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining(newEvent)]));
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Event Added',
      description: 'The timeline event has been added successfully.',
      status: 'success',
    });
  });

  it('updates an existing event', async () => {
    const { result } = renderHook(() =>
      useTimeline({
        initialEvents: mockEvents,
        onEventsChange: mockOnEventsChange,
      })
    );

    const updates = {
      title: 'Senior Software Engineer',
      description: 'Team Lead',
    };

    await act(async () => {
      await result.current.updateEvent('2', updates);
    });

    expect(result.current.events[1]).toMatchObject({
      ...mockEvents[1],
      ...updates,
    });
    expect(mockOnEventsChange).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Event Updated',
      description: 'The timeline event has been updated successfully.',
      status: 'success',
    });
  });

  it('deletes an event', async () => {
    const { result } = renderHook(() =>
      useTimeline({
        initialEvents: mockEvents,
        onEventsChange: mockOnEventsChange,
      })
    );

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe('2');
    expect(mockOnEventsChange).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Event Deleted',
      description: 'The timeline event has been deleted successfully.',
      status: 'success',
    });
  });

  it('reorders events', async () => {
    const { result } = renderHook(() =>
      useTimeline({
        initialEvents: mockEvents,
        onEventsChange: mockOnEventsChange,
      })
    );

    const reorderedEvents = [...mockEvents].reverse();

    await act(async () => {
      await result.current.reorderEvents(reorderedEvents);
    });

    expect(result.current.events).toEqual(reorderedEvents);
    expect(mockOnEventsChange).toHaveBeenCalledWith(reorderedEvents);
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Timeline Updated',
      description: 'The timeline events have been reordered successfully.',
      status: 'success',
    });
  });

  it('filters events by search term', () => {
    const { result } = renderHook(() =>
      useTimeline({ initialEvents: mockEvents })
    );

    act(() => {
      result.current.applyFilters({ searchTerm: 'Bachelor' });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe('Bachelor of Science');
  });

  it('filters events by type', () => {
    const { result } = renderHook(() =>
      useTimeline({ initialEvents: mockEvents })
    );

    act(() => {
      result.current.applyFilters({ eventTypes: ['job'] });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('job');
  });

  it('filters events by date range', () => {
    const { result } = renderHook(() =>
      useTimeline({ initialEvents: mockEvents })
    );

    act(() => {
      result.current.applyFilters({
        dateRange: {
          start: '2024-01-01',
        },
      });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe('Software Engineer');
  });

  it('clears filters', () => {
    const { result } = renderHook(() =>
      useTimeline({ initialEvents: mockEvents })
    );

    act(() => {
      result.current.applyFilters({ searchTerm: 'Bachelor' });
    });

    expect(result.current.events).toHaveLength(1);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.events).toEqual(mockEvents);
    expect(mockTrackEvent).toHaveBeenCalledWith('timeline_filters_cleared');
  });

  it('handles errors when adding event', async () => {
    const error = new Error('Network error');
    const { result } = renderHook(() => useTimeline());

    await act(async () => {
      await expect(result.current.addEvent({} as any)).rejects.toThrow();
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Error',
      description: expect.any(String),
      status: 'error',
    });
  });

  it('handles errors when updating event', async () => {
    const error = new Error('Network error');
    const { result } = renderHook(() =>
      useTimeline({ initialEvents: mockEvents })
    );

    await act(async () => {
      await expect(result.current.updateEvent('1', {})).rejects.toThrow();
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Error',
      description: expect.any(String),
      status: 'error',
    });
  });

  it('handles errors when deleting event', async () => {
    const error = new Error('Network error');
    const { result } = renderHook(() =>
      useTimeline({ initialEvents: mockEvents })
    );

    await act(async () => {
      await expect(result.current.deleteEvent('1')).rejects.toThrow();
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Error',
      description: expect.any(String),
      status: 'error',
    });
  });
}); 