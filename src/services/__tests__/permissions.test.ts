jest.mock('firebase/functions');
jest.mock('@/lib/firebase');
import { db } from '@/lib/firebase';
import { permissionsService } from '../permissions';
import { analytics } from '../analytics';
import { getDoc, setDoc, deleteDoc } from 'firebase/firestore';

// Mock Firestore and Analytics
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
}));

jest.mock('../analytics', () => ({
  analytics: {
    trackEvent: jest.fn(),
  },
}));

describe('permissionsService', () => {
  const mockPermission = {
    role: 'editor' as const,
    grantedAt: new Date(),
    grantedBy: 'test-admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserUniversityPermission', () => {
    it('should return permission when it exists', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => ({
          role: mockPermission.role,
          grantedAt: { toDate: () => mockPermission.grantedAt },
          grantedBy: mockPermission.grantedBy
        })
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await permissionsService.getUserUniversityPermission('test-uni', 'test-user');
      expect(result).toEqual(mockPermission);
    });

    it('should return null when permission does not exist', async () => {
      const mockDoc = {
        exists: () => false
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await permissionsService.getUserUniversityPermission('test-uni', 'test-user');
      expect(result).toBeNull();
    });
  });

  describe('setUserUniversityPermission', () => {
    it('should set permission and log analytics', async () => {
      const universityId = 'test-uni';
      const userId = 'test-user';
      const role = 'editor' as const;

      await permissionsService.setUserUniversityPermission(universityId, userId, role);

      expect(setDoc).toHaveBeenCalled();
      expect(analytics.trackEvent).toHaveBeenCalledWith({
        name: 'role_assigned',
        properties: {
          universityId,
          userId,
          role
        }
      });
    });
  });

  describe('removeUserUniversityPermission', () => {
    it('should remove permission and log analytics', async () => {
      const universityId = 'test-uni';
      const userId = 'test-user';

      await permissionsService.removeUserUniversityPermission(universityId, userId);

      expect(deleteDoc).toHaveBeenCalled();
      expect(analytics.trackEvent).toHaveBeenCalledWith({
        name: 'role_removed',
        properties: {
          universityId,
          userId
        }
      });
    });
  });
}); 