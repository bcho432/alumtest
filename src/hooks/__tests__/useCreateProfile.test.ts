import { renderHook, act } from '@testing-library/react';
import { useCreateProfile } from '../useCreateProfile';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../useAuth';

// Mock dependencies
jest.mock('firebase/firestore');
jest.mock('../useAuth');
jest.mock('../../lib/firebase', () => ({
  getDb: jest.fn().mockResolvedValue({}),
}));

describe('useCreateProfile', () => {
  const mockUser = {
    uid: 'user123',
    email: 'test@example.com',
    isAdmin: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it('should create a profile successfully when user is admin', async () => {
    const { result } = renderHook(() => useCreateProfile());

    const profileData = {
      name: 'Test Profile',
      description: 'Test Description',
      orgId: 'test-org',
    };

    await act(async () => {
      await result.current.createProfile(profileData);
    });

    expect(setDoc).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('should throw error when user is not admin', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, isAdmin: false },
    });

    const { result } = renderHook(() => useCreateProfile());

    const profileData = {
      name: 'Test Profile',
      description: 'Test Description',
      orgId: 'test-org',
    };

    let error: Error | undefined;
    await act(async () => {
      try {
        await result.current.createProfile(profileData);
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Only admins can create profiles');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('should throw error when user is not logged in', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    const { result } = renderHook(() => useCreateProfile());

    const profileData = {
      name: 'Test Profile',
      description: 'Test Description',
      orgId: 'test-org',
    };

    let error: Error | undefined;
    await act(async () => {
      try {
        await result.current.createProfile(profileData);
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('User must be authenticated to create a profile');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('should handle errors during profile creation', async () => {
    const mockError = new Error('Firestore error');
    (setDoc as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useCreateProfile());

    const profileData = {
      name: 'Test Profile',
      description: 'Test Description',
      orgId: 'test-org',
    };

    let error: Error | undefined;
    await act(async () => {
      try {
        await result.current.createProfile(profileData);
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error).toBe(mockError);
    expect(result.current.loading).toBe(false);
  });
}); 