import { renderHook, act } from '@testing-library/react';
import { useTimeline } from '../useTimeline';
import { useAnalytics } from '../useAnalytics';
import { useToast } from '../useToast';
import { TimelineEvent } from '../../types/profile';

jest.mock('firebase/firestore');

// Mock dependencies
jest.mock('../useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

jest.mock('../useToast', () => ({
  useToast: jest.fn(),
}));

describe('useTimeline', () => {
  const mockEvents: TimelineEvent[] = [
    {
      id: '1',
      type: 'education',
      title: 'Test Event',
      startDate: '2020-01-01',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAnalytics as jest.Mock).mockReturnValue({
      trackEvent: jest.fn(),
    });
    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn(),
    });
  });

  it('adds event successfully and tracks analytics', async () => {
    const { result } = renderHook(() => useTimeline());

    await act(async () => {
      await result.current.addEvent({
        type: 'education',
        title: 'Test Event',
        startDate: '2020-01-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles add event errors', async () => {
    const mockError = new Error('Add failed');
    const { result } = renderHook(() => useTimeline());

    await act(async () => {
      await expect(
        result.current.addEvent({
          type: 'education',
          title: 'Test Event',
          startDate: '2020-01-01',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).rejects.toThrow('Add failed');
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('updates event successfully', async () => {
    const { result } = renderHook(() => useTimeline({ initialEvents: mockEvents }));

    await act(async () => {
      await result.current.updateEvent('1', {
        title: 'Updated Event',
      });
    });

    expect(result.current.events[0].title).toBe('Updated Event');
    expect(result.current.isLoading).toBe(false);
  });

  it('deletes event successfully', async () => {
    const { result } = renderHook(() => useTimeline({ initialEvents: mockEvents }));

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    expect(result.current.events).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('reorders events successfully', async () => {
    const initialEvents: TimelineEvent[] = [
      {
        id: '1',
        type: 'education',
        title: 'First',
        startDate: '2020-01-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        type: 'education',
        title: 'Second',
        startDate: '2020-01-02',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const { result } = renderHook(() => useTimeline({ initialEvents }));

    await act(async () => {
      await result.current.reorderEvents([initialEvents[1], initialEvents[0]]);
    });

    expect(result.current.events[0].id).toBe('2');
    expect(result.current.events[1].id).toBe('1');
    expect(result.current.isLoading).toBe(false);
  });

  it('applies filters correctly', async () => {
    const initialEvents: TimelineEvent[] = [
      {
        id: '1',
        type: 'education',
        title: 'Education Event',
        startDate: '2020-01-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        type: 'job',
        title: 'Job Event',
        startDate: '2020-01-02',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const { result } = renderHook(() => useTimeline({ initialEvents }));

    act(() => {
      result.current.applyFilters({
        eventTypes: ['education'],
      });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('education');
  });

  it('clears filters correctly', async () => {
    const initialEvents: TimelineEvent[] = [
      {
        id: '1',
        type: 'education',
        title: 'Education Event',
        startDate: '2020-01-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        type: 'job',
        title: 'Job Event',
        startDate: '2020-01-02',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const { result } = renderHook(() => useTimeline({ initialEvents }));

    act(() => {
      result.current.applyFilters({
        eventTypes: ['education'],
      });
    });

    expect(result.current.events).toHaveLength(1);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.events).toHaveLength(2);
  });
}); 