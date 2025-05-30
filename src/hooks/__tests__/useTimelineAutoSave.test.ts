import { renderHook, act } from '@testing-library/react';
import { useTimelineAutoSave } from '../useTimelineAutoSave';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAnalytics } from '../useAnalytics';
import { useToast } from '../useToast';
import { LifeEvent } from '@/types/profile';

// Mock dependencies
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase');
jest.mock('../useAnalytics');
jest.mock('../useToast');

const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockUseAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('useTimelineAutoSave', () => {
  const mockEvents: LifeEvent[] = [
    {
      id: '1',
      type: 'education',
      title: 'Bachelor Degree',
      startDate: '2018-09-01',
      endDate: '2022-06-30',
    },
  ];

  const mockTrackEvent = jest.fn();
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseAnalytics.mockReturnValue({ trackEvent: mockTrackEvent } as any);
    mockUseToast.mockReturnValue({ showToast: mockShowToast } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('saves events after delay', async () => {
    const { result } = renderHook(() =>
      useTimelineAutoSave({
        orgId: 'org123',
        profileId: 'profile123',
        events: mockEvents,
      })
    );

    expect(result.current.isSaving).toBe(false);
    expect(result.current.lastSavedAt).toBeNull();

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await act(async () => {
      await Promise.resolve(); // Wait for promises to resolve
    });

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith('timeline_autosave_success', {
      eventCount: mockEvents.length,
      profileId: 'profile123',
    });
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Changes saved',
      status: 'success',
    });
    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
  });

  it('retries on failure with exponential backoff', async () => {
    const mockError = new Error('Failed to save');
    mockSetDoc.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() =>
      useTimelineAutoSave({
        orgId: 'org123',
        profileId: 'profile123',
        events: mockEvents,
      })
    );

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // First retry after 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSetDoc).toHaveBeenCalledTimes(2);
    expect(mockTrackEvent).toHaveBeenCalledWith('timeline_autosave_failure', {
      error: 'Failed to save',
      profileId: 'profile123',
    });

    // Second retry after 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSetDoc).toHaveBeenCalledTimes(3);
  });

  it('shows error toast after max retries', async () => {
    const mockError = new Error('Failed to save');
    mockSetDoc.mockRejectedValue(mockError);

    renderHook(() =>
      useTimelineAutoSave({
        orgId: 'org123',
        profileId: 'profile123',
        events: mockEvents,
      })
    );

    // Fast-forward through all retries
    act(() => {
      jest.advanceTimersByTime(5000 + 1000 + 2000 + 4000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to save changes. Please try again.',
      status: 'error',
    });
  });

  it('saves on window blur', async () => {
    const { result } = renderHook(() =>
      useTimelineAutoSave({
        orgId: 'org123',
        profileId: 'profile123',
        events: mockEvents,
      })
    );

    // Trigger blur event
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
  });

  it('clears timeout on unmount', () => {
    const { unmount } = renderHook(() =>
      useTimelineAutoSave({
        orgId: 'org123',
        profileId: 'profile123',
        events: mockEvents,
      })
    );

    unmount();

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockSetDoc).not.toHaveBeenCalled();
  });
}); 