import { db } from '@/lib/firebase';
import { analytics } from '../analytics';
import { addDoc, collection } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
}));

// Mock Firestore
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
  },
}));

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockReturnValue('analytics-collection');
    (addDoc as jest.Mock).mockResolvedValue({ id: 'test-id' });
  });

  describe('trackEvent', () => {
    it('should track an event with timestamp', async () => {
      const mockEvent = {
        name: 'test_event',
        properties: { test: 'data', userId: 'test-user' }
      };

      await analytics.trackEvent(mockEvent);

      expect(collection).toHaveBeenCalledWith(db, 'analytics');
      expect(addDoc).toHaveBeenCalledWith(
        'analytics-collection',
        expect.objectContaining({
          ...mockEvent,
          timestamp: expect.anything()
        })
      );
    });
  });

  describe('logUniversityCreated', () => {
    it('should log university creation event', async () => {
      const universityId = 'test-university';
      const createdBy = 'test-admin';

      await analytics.logUniversityCreated(universityId, createdBy);

      expect(collection).toHaveBeenCalledWith(db, 'analytics');
      expect(addDoc).toHaveBeenCalledWith(
        'analytics-collection',
        expect.objectContaining({
          name: 'university_created',
          properties: {
            universityId,
            createdBy,
            timestamp: expect.anything()
          }
        })
      );
    });
  });
}); 