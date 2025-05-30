import { renderHook, act } from '@testing-library/react';
import { useProfilePublish } from '../useProfilePublish';
import { usePermissions } from '../usePermissions';
import { useToast } from '../useToast';
import { useAnalytics } from '../useAnalytics';
import { useAuth } from '../useAuth';
import { doc, updateDoc, collection, addDoc, getDoc } from 'firebase/firestore';

// Mock dependencies
jest.mock('firebase/firestore');
jest.mock('../usePermissions');
jest.mock('../useToast');
jest.mock('../useAnalytics');
jest.mock('../useAuth');

describe('useProfilePublish', () => {
  const mockOrgId = 'org-1';
  const mockProfileId = 'profile-1';
  const mockShowToast = jest.fn();
  const mockTrackEvent = jest.fn();
  const mockIsAdmin = jest.fn();
  const mockUser = {
    uid: 'user-1',
    displayName: 'Test Admin',
  };

  const mockProfile = {
    firstName: 'John',
    lastName: 'Doe',
    graduationYear: 2020,
    degree: 'Bachelor',
    major: 'Computer Science',
    storyAnswers: {
      'question-1': 'Answer 1',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
    (usePermissions as jest.Mock).mockReturnValue({ isAdmin: mockIsAdmin });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    (addDoc as jest.Mock).mockResolvedValue({ id: 'log-1' });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockProfile,
    });
  });

  it('publishes profile when user is admin and profile is valid', async () => {
    mockIsAdmin.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useProfilePublish({ orgId: mockOrgId, profileId: mockProfileId })
    );

    await act(async () => {
      await result.current.publishProfile();
    });

    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        status: 'published',
      })
    );

    expect(addDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'profilePublished',
        orgId: mockOrgId,
        profileId: mockProfileId,
        metadata: {
          publishedBy: mockUser.uid,
          publishedByName: mockUser.displayName,
          validationStatus: 'passed',
        },
      })
    );

    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'Profile published successfully',
      type: 'success',
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('profile_published', {
      orgId: mockOrgId,
      profileId: mockProfileId,
      publishedBy: mockUser.uid,
    });
  });

  it('throws error when user is not admin', async () => {
    mockIsAdmin.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useProfilePublish({ orgId: mockOrgId, profileId: mockProfileId })
    );

    await expect(
      act(async () => {
        await result.current.publishProfile();
      })
    ).rejects.toThrow('You do not have permission to publish profiles');

    expect(updateDoc).not.toHaveBeenCalled();
    expect(addDoc).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'You do not have permission to publish profiles',
      type: 'error',
    });
  });

  it('throws error when profile validation fails', async () => {
    mockIsAdmin.mockResolvedValue(true);
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        // Missing required fields
        firstName: '',
        lastName: '',
      }),
    });

    const { result } = renderHook(() =>
      useProfilePublish({ orgId: mockOrgId, profileId: mockProfileId })
    );

    await expect(
      act(async () => {
        await result.current.publishProfile();
      })
    ).rejects.toThrow('Profile validation failed');

    expect(updateDoc).not.toHaveBeenCalled();
    expect(addDoc).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      message: expect.stringContaining('Profile validation failed'),
      type: 'error',
    });
  });

  it('throws error when profile does not exist', async () => {
    mockIsAdmin.mockResolvedValue(true);
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
    });

    const { result } = renderHook(() =>
      useProfilePublish({ orgId: mockOrgId, profileId: mockProfileId })
    );

    await expect(
      act(async () => {
        await result.current.publishProfile();
      })
    ).rejects.toThrow('Profile not found');

    expect(updateDoc).not.toHaveBeenCalled();
    expect(addDoc).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'Profile not found',
      type: 'error',
    });
  });

  it('handles errors during profile update', async () => {
    mockIsAdmin.mockResolvedValue(true);
    (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() =>
      useProfilePublish({ orgId: mockOrgId, profileId: mockProfileId })
    );

    await expect(
      act(async () => {
        await result.current.publishProfile();
      })
    ).rejects.toThrow('Update failed');

    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'Update failed',
      type: 'error',
    });

    expect(mockTrackEvent).toHaveBeenCalledWith('profile_publish_error', {
      orgId: mockOrgId,
      profileId: mockProfileId,
      error: 'Update failed',
      publishedBy: mockUser.uid,
    });
  });
}); 