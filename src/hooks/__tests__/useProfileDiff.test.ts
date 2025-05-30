import { renderHook, act } from '@testing-library/react-hooks';
import { useProfileDiff } from '../useProfileDiff';
import { doc, getDoc } from 'firebase/firestore';
import { Profile } from '@/types/profile';

jest.mock('firebase/firestore');

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

describe('useProfileDiff', () => {
  const mockProfileId = 'test-profile-id';
  const mockPublishedProfile: Profile = {
    id: '1',
    name: 'John Doe',
    status: 'published',
    isPublic: true,
    isVerified: true,
    orgId: 'org1',
    createdBy: 'user1',
    privacy: 'public',
    invitedEmails: [],
    shareableUrl: 'https://example.com/profile/1',
    createdAt: '2020-01-01',
    updatedAt: '2020-01-01',
    stories: [
      {
        id: '1',
        question: 'What was your favorite class?',
        answer: 'Computer Science',
        authorId: 'user1',
        createdAt: '2020-01-01',
      },
    ],
  };

  const mockDraftProfile: Profile = {
    ...mockPublishedProfile,
    name: 'John A. Doe',
    status: 'draft',
    stories: [
      {
        id: '1',
        question: 'What was your favorite class?',
        answer: 'Advanced Computer Science',
        authorId: 'user1',
        createdAt: '2020-01-01',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    (getDoc as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useProfileDiff(mockProfileId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.diffs).toBeNull();
  });

  it('should handle successful profile fetch', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ data: () => mockPublishedProfile })
      .mockResolvedValueOnce({ data: () => mockDraftProfile });

    const { result, waitForNextUpdate } = renderHook(() => useProfileDiff(mockProfileId));

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.diffs).not.toBeNull();
  });

  it('should handle missing published version', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ data: () => null })
      .mockResolvedValueOnce({ data: () => mockDraftProfile });

    const { result, waitForNextUpdate } = renderHook(() => useProfileDiff(mockProfileId));

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('No published version found');
    expect(result.current.diffs).toBeNull();
  });

  it('should handle missing draft version', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ data: () => mockPublishedProfile })
      .mockResolvedValueOnce({ data: () => null });

    const { result, waitForNextUpdate } = renderHook(() => useProfileDiff(mockProfileId));

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('No draft version found');
    expect(result.current.diffs).toBeNull();
  });

  it('should handle fetch error', async () => {
    (getDoc as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    const { result, waitForNextUpdate } = renderHook(() => useProfileDiff(mockProfileId));

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to load changes');
    expect(result.current.diffs).toBeNull();
  });

  it('should refetch when profileId changes', async () => {
    const newProfileId = 'new-profile-id';
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ data: () => mockPublishedProfile })
      .mockResolvedValueOnce({ data: () => mockDraftProfile })
      .mockResolvedValueOnce({ data: () => mockPublishedProfile })
      .mockResolvedValueOnce({ data: () => mockDraftProfile });

    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ id }) => useProfileDiff(id),
      { initialProps: { id: mockProfileId } }
    );

    await waitForNextUpdate();

    rerender({ id: newProfileId });

    await waitForNextUpdate();

    expect(getDoc).toHaveBeenCalledTimes(4);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.diffs).not.toBeNull();
  });
}); 