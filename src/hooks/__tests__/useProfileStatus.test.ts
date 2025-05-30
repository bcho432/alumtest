import { renderHook, act } from '@testing-library/react';
import { useProfileStatus } from '../useProfileStatus';
import { useAuth } from '../useAuth';
import { useAnalytics } from '../useAnalytics';
import { useToast } from '../useToast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock dependencies
jest.mock('../useAuth');
jest.mock('../useAnalytics');
jest.mock('../useToast');
jest.mock('firebase/firestore');

describe('useProfileStatus', () => {
  const mockOrgId = 'org-1';
  const mockProfileId = 'profile-1';
  const mockUser = { isAdmin: true };
  const mockTrackEvent = jest.fn();
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it('initializes with provided status', () => {
    const { result } = renderHook(() =>
      useProfileStatus({
        orgId: mockOrgId,
        profileId: mockProfileId,
        initialStatus: 'draft',
      })
    );

    expect(result.current.status).toBe('draft');
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isAdmin).toBe(true);
  });

  it('allows admin to update status', async () => {
    const { result } = renderHook(() =>
      useProfileStatus({
        orgId: mockOrgId,
        profileId: mockProfileId,
        initialStatus: 'draft',
      })
    );

    await act(async () => {
      await result.current.updateStatus('published');
    });

    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        status: 'published',
      })
    );
    expect(mockTrackEvent).toHaveBeenCalledWith('profile_status_updated', {
      profileId: mockProfileId,
      newStatus: 'published',
    });
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Profile published.',
    });
  });

  it('prevents non-admin from updating status', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { isAdmin: false } });

    const { result } = renderHook(() =>
      useProfileStatus({
        orgId: mockOrgId,
        profileId: mockProfileId,
        initialStatus: 'draft',
      })
    );

    await act(async () => {
      await result.current.updateStatus('published');
    });

    expect(updateDoc).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'Only administrators can change profile status.',
    });
  });

  it('handles update errors', async () => {
    const error = new Error('Update failed');
    (updateDoc as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useProfileStatus({
        orgId: mockOrgId,
        profileId: mockProfileId,
        initialStatus: 'draft',
      })
    );

    await act(async () => {
      await expect(result.current.updateStatus('published')).rejects.toThrow('Update failed');
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'Failed to update profile status. Please try again.',
    });
  });
}); 