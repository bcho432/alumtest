import { db } from '@/lib/firebase';
import { universitiesService } from '../universities';
import { analytics } from '../analytics';
import { collection, doc, getDoc, getDocs, addDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');

// Mock Firestore and Analytics
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
}));

jest.mock('../analytics', () => ({
  analytics: {
    logUniversityCreated: jest.fn(),
  },
}));

describe('universitiesService', () => {
  const mockUniversity = {
    id: 'test-university',
    name: 'Test University',
    createdAt: new Date(),
    createdBy: 'test-admin',
    adminIds: ['test-admin'],
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUniversity', () => {
    it('should return a university when it exists', async () => {
      const mockDoc = {
        exists: () => true,
        id: mockUniversity.id,
        data: () => ({
          name: mockUniversity.name,
          createdAt: { toDate: () => mockUniversity.createdAt },
          createdBy: mockUniversity.createdBy,
          adminIds: mockUniversity.adminIds,
          isActive: mockUniversity.isActive,
        }),
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await universitiesService.getUniversity(mockUniversity.id);
      expect(result).toEqual(mockUniversity);
    });

    it('should throw an error when university does not exist', async () => {
      const mockDoc = {
        exists: () => false,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      await expect(universitiesService.getUniversity('non-existent')).rejects.toThrow('University not found');
    });
  });

  describe('listUniversities', () => {
    it('should return a list of universities', async () => {
      const mockDocs = [{
        id: mockUniversity.id,
        data: () => ({
          name: mockUniversity.name,
          createdAt: { toDate: () => mockUniversity.createdAt },
          createdBy: mockUniversity.createdBy,
          adminIds: mockUniversity.adminIds,
          isActive: mockUniversity.isActive,
        }),
      }];

      (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs });

      const result = await universitiesService.listUniversities();
      expect(result).toEqual([mockUniversity]);
    });
  });

  describe('createUniversity', () => {
    it('should create a university and log analytics', async () => {
      const universityData = {
        name: mockUniversity.name,
        createdBy: mockUniversity.createdBy,
        adminIds: mockUniversity.adminIds,
        isActive: mockUniversity.isActive,
      };

      (addDoc as jest.Mock).mockResolvedValue({ id: mockUniversity.id });

      const result = await universitiesService.createUniversity(universityData);

      expect(result).toBe(mockUniversity.id);
      expect(analytics.logUniversityCreated).toHaveBeenCalledWith(
        mockUniversity.id,
        mockUniversity.createdBy
      );
    });
  });
}); 