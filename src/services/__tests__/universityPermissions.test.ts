import { universityPermissionsService } from '../universityPermissions';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';

jest.mock('firebase/firestore');

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
  functions: {},
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  limit: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

describe('UniversityPermissionsService', () => {
  const mockEmail = 'test@example.com';
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByEmail', () => {
    it('returns user data when found', async () => {
      const mockUserData = {
        displayName: 'Test User',
        email: mockEmail,
      };

      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [
          {
            id: mockUserId,
            data: () => mockUserData,
          },
        ],
      });

      const result = await universityPermissionsService.getUserByEmail(mockEmail);

      expect(result).toEqual({
        uid: mockUserId,
        displayName: mockUserData.displayName,
        email: mockUserData.email,
      });

      // Verify query construction
      expect(collection).toHaveBeenCalledWith(expect.any(Object), 'users');
      expect(where).toHaveBeenCalledWith('email', '==', mockEmail.toLowerCase());
      expect(limit).toHaveBeenCalledWith(1);
    });

    it('returns null when user not found', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await universityPermissionsService.getUserByEmail(mockEmail);

      expect(result).toBeNull();
    });

    it('handles case-insensitive email lookup', async () => {
      const mockUserData = {
        displayName: 'Test User',
        email: 'TEST@example.com',
      };

      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [
          {
            id: mockUserId,
            data: () => mockUserData,
          },
        ],
      });

      const result = await universityPermissionsService.getUserByEmail('test@example.com');

      expect(result).toEqual({
        uid: mockUserId,
        displayName: mockUserData.displayName,
        email: mockUserData.email,
      });

      // Verify email was converted to lowercase
      expect(where).toHaveBeenCalledWith('email', '==', 'test@example.com');
    });
  });
}); 