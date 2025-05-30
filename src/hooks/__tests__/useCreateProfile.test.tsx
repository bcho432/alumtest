import { renderHook, act } from '@testing-library/react';
import { useCreateProfile } from '../useCreateProfile';
import { useAuth } from '../useAuth';
import { useToast } from '../useToast';
import { useAnalytics } from '../useAnalytics';
import { getDb } from '@/lib/firebase';
import { AlumniProfile, CreateProfileData } from '@/types/profile';
import { Timestamp, serverTimestamp } from 'firebase/firestore';

// Mock dependencies
jest.mock('@/lib/firebase', () => ({
  getDb: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  serverTimestamp: jest.fn().mockReturnValue('mock-timestamp'),
  Timestamp: {
    now: jest.fn().mockReturnValue('mock-timestamp'),
  },
}));

jest.mock('../useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

describe('useCreateProfile', () => {
  const mockUser = { uid: 'test-uid' };
  const mockShowToast = jest.fn();
  const mockTrackEvent = jest.fn();
  const mockSetDoc = jest.fn();
  const mockDb = {};

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (useAnalytics as jest.Mock).mockReturnValue({ trackEvent: mockTrackEvent });
    (getDb as jest.Mock).mockResolvedValue(mockDb);
    (mockDb as any).setDoc = mockSetDoc;
  });

  it('should create a new profile', async () => {
    const { result } = renderHook(() => useCreateProfile());

    const profileData: CreateProfileData = {
      orgId: 'test-org',
      name: 'Test User',
      bio: 'Test bio',
      location: 'Test location'
    };

    await act(async () => {
      await result.current.createProfile(profileData);
    });

    expect(mockSetDoc).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith('profile_created', expect.any(Object));
    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Profile created successfully',
      status: 'success'
    });
  });

  it('should handle errors', async () => {
    const error = new Error('Test error');
    (mockDb as any).setDoc.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateProfile());

    const profileData: CreateProfileData = {
      orgId: 'test-org',
      name: 'Test User',
      bio: 'Test bio',
      location: 'Test location'
    };

    await act(async () => {
      await expect(result.current.createProfile(profileData)).rejects.toThrow('Test error');
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to create profile',
      status: 'error'
    });
  });
}); 