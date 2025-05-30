import { renderHook, act } from '@testing-library/react';
import { useProfileEdit } from '../useProfileEdit';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../useToast';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('firebase/firestore');
jest.mock('../useToast');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

describe('useProfileEdit', () => {
  const mockProfileId = 'test-profile';
  const mockProfile = {
    id: mockProfileId,
    name: 'Test Profile',
    status: 'draft',
    orgId: 'test-org',
    createdBy: 'test-user',
    editors: ['test-user'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Firestore
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    // Mock useToast
    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn(),
    });

    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });

  it('should save profile data successfully', async () => {
    const { result } = renderHook(() => useProfileEdit({ profileId: mockProfileId }));

    const profileData = {
      displayName: 'Updated Name',
      bio: 'Updated Bio',
    };

    await act(async () => {
      await result.current.saveProfile(profileData);
    });

    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        ...profileData,
        updatedAt: expect.any(String),
      })
    );
    expect(result.current.isSaving).toBe(false);
  });

  it('should handle save errors', async () => {
    const mockError = new Error('Save failed');
    (updateDoc as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useProfileEdit({ profileId: mockProfileId }));

    const profileData = {
      displayName: 'Updated Name',
      bio: 'Updated Bio',
    };

    await act(async () => {
      await result.current.saveProfile(profileData);
    });

    expect(result.current.isSaving).toBe(false);
  });

  it('should upload avatar successfully', async () => {
    const { result } = renderHook(() => useProfileEdit({ profileId: mockProfileId }));

    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

    await act(async () => {
      await result.current.uploadAvatar(mockFile);
    });

    expect(result.current.isUploading).toBe(false);
  });

  it('should handle avatar upload errors', async () => {
    const mockError = new Error('Upload failed');
    (updateDoc as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useProfileEdit({ profileId: mockProfileId }));

    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

    await act(async () => {
      await result.current.uploadAvatar(mockFile);
    });

    expect(result.current.isUploading).toBe(false);
  });
}); 