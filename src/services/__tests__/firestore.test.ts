jest.mock('firebase/firestore');
import { firestoreService } from '../firestore';
import { firestoreDb } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { analytics } from '../analytics';

function assertDb() {
  if (!firestoreDb) throw new Error('Firestore is not initialized');
  return firestoreDb;
}

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  firestoreDb: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    addDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
  },
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('../analytics', () => ({
  analytics: {
    trackEvent: jest.fn(),
  },
}));

describe('firestoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('University operations', () => {
    it('creates a university document', async () => {
      const mockSetDoc = jest.fn();
      const mockDoc = jest.fn().mockReturnValue({ id: 'univ-1' });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      (assertDb().collection as jest.Mock).mockReturnValue(mockCollection);
      (assertDb().doc as jest.Mock).mockReturnValue({ set: mockSetDoc });

      const universityData = {
        name: 'Test University',
        branding: {
          logoUrl: 'https://example.com/logo.png',
          primaryColor: '#000000',
        },
        createdBy: 'user-1',
        adminIds: ['user-1'],
      };

      await firestoreService.createUniversity(universityData);

      expect(mockSetDoc).toHaveBeenCalledWith({
        ...universityData,
        createdAt: expect.any(Timestamp),
      });
      expect(analytics.trackEvent).toHaveBeenCalledWith({
        name: 'model_created',
        properties: {
          type: 'university',
          id: 'univ-1',
        }
      });
    });
  });

  describe('User operations', () => {
    it('creates a user document', async () => {
      const mockSetDoc = jest.fn();
      const mockDoc = jest.fn().mockReturnValue({ id: 'user-1' });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      (assertDb().collection as jest.Mock).mockReturnValue(mockCollection);
      (assertDb().doc as jest.Mock).mockReturnValue({ set: mockSetDoc });

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        pinnedSchools: [],
      };

      await firestoreService.createUser('user-1', userData);

      expect(mockSetDoc).toHaveBeenCalledWith({
        ...userData,
        createdAt: expect.any(Timestamp),
      });
      expect(analytics.trackEvent).toHaveBeenCalledWith({
        name: 'model_created',
        properties: {
          type: 'user',
          id: 'user-1',
        }
      });
    });
  });

  describe('Profile operations', () => {
    it('creates a profile document', async () => {
      const mockSetDoc = jest.fn();
      const mockDoc = jest.fn().mockReturnValue({ id: 'profile-1' });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      (assertDb().collection as jest.Mock).mockReturnValue(mockCollection);
      (assertDb().doc as jest.Mock).mockReturnValue({ set: mockSetDoc });

      const profileData = {
        name: 'Test Profile',
        universityId: 'univ-1',
        createdBy: 'user-1',
        isDeceased: false,
        status: 'draft' as const,
      };

      const profileId = await firestoreService.createProfile(profileData);

      expect(profileId).toBe('profile-1');
      expect(mockSetDoc).toHaveBeenCalledWith({
        ...profileData,
        createdAt: expect.any(Timestamp),
      });
      expect(analytics.trackEvent).toHaveBeenCalledWith({
        name: 'model_created',
        properties: {
          type: 'profile',
          id: 'profile-1',
        }
      });
    });
  });

  describe('Permission operations', () => {
    it('creates a permission document', async () => {
      const mockSetDoc = jest.fn();
      const mockDoc = jest.fn().mockReturnValue({ id: 'perm-1' });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      (assertDb().collection as jest.Mock).mockReturnValue(mockCollection);
      (assertDb().doc as jest.Mock).mockReturnValue({ set: mockSetDoc });

      const permissionData = {
        role: 'admin' as const,
        profileId: 'profile-1',
        grantedBy: 'user-1',
      };

      await firestoreService.createPermission(permissionData);

      expect(mockSetDoc).toHaveBeenCalledWith({
        ...permissionData,
        grantedAt: expect.any(Timestamp),
      });
      expect(analytics.trackEvent).toHaveBeenCalledWith({
        name: 'model_created',
        properties: {
          type: 'permission',
          id: 'perm-1',
        }
      });
    });
  });
}); 