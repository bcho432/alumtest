import { renderHook, act } from '@testing-library/react';
import { useTimelineEvents } from '../useTimelineEvents';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '../useAuth';
import { useAnalytics } from '../useAnalytics';

// Mock dependencies
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase');
jest.mock('../useAuth');
jest.mock('../useAnalytics');

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>;

describe('useTimelineEvents', () => {
  const mockUser = { uid: 'user123' };
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
    mockUseAnalytics.mockReturnValue({ trackEvent: mockTrackEvent } as any);
  });

  it('fetches events successfully', async () => {
    const mockEvents = [
      {
        id: '1',
        type: 'education',
        title: 'Bachelor Degree',
        startDate: '2018-09-01',
        endDate: '2022-06-30',
      },
    ];

    mockGetDocs.mockResolvedValueOnce({
      docs: mockEvents.map(event => ({
        id: event.id,
        data: () => event,
      })),
    } as any);

    const { result } = renderHook(() =>
      useTimelineEvents({
        orgId: 'org123',
        profileId: 'profile123',
      })
    );

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.events).toEqual(mockEvents);
    expect(mockTrackEvent).toHaveBeenCalledWith('timeline_loaded', {
      eventCount: mockEvents.length,
      profileId: 'profile123',
    });
  });

  it('handles fetch error', async () => {
    const mockError = new Error('Failed to fetch');
    mockGetDocs.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() =>
      useTimelineEvents({
        orgId: 'org123',
        profileId: 'profile123',
      })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch');
    expect(mockTrackEvent).toHaveBeenCalledWith('timeline_load_failed', {
      error: 'Failed to fetch',
      profileId: 'profile123',
    });
  });

  it('does not fetch when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null } as any);

    renderHook(() =>
      useTimelineEvents({
        orgId: 'org123',
        profileId: 'profile123',
      })
    );

    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('refetches events when refetch is called', async () => {
    const mockEvents = [
      {
        id: '1',
        type: 'education',
        title: 'Bachelor Degree',
        startDate: '2018-09-01',
        endDate: '2022-06-30',
      },
    ];

    mockGetDocs
      .mockResolvedValueOnce({
        docs: [],
      } as any)
      .mockResolvedValueOnce({
        docs: mockEvents.map(event => ({
          id: event.id,
          data: () => event,
        })),
      } as any);

    const { result } = renderHook(() =>
      useTimelineEvents({
        orgId: 'org123',
        profileId: 'profile123',
      })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.events).toEqual([]);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.events).toEqual(mockEvents);
  });
}); 