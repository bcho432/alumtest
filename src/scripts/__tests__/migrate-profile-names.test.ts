import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { migrateProfileNames } from '../migrate-profile-names';

// Mock Firestore
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn()
  }
}));

describe('Profile Name Migration', () => {
  const mockProfiles = [
    { id: '1', data: () => ({ fullName: 'John Doe', name: null }) },
    { id: '2', data: () => ({ fullName: 'Jane Smith', name: null }) },
    { id: '3', data: () => ({ name: 'Bob Wilson' }) } // Already migrated
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firestore methods
    (collection as jest.Mock).mockReturnValue({
      getDocs: jest.fn().mockResolvedValue({
        docs: mockProfiles,
        size: mockProfiles.length
      })
    });
    
    (doc as jest.Mock).mockImplementation((_, id) => id);
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it('should migrate profiles with fullName to name', async () => {
    await migrateProfileNames();

    // Should update two profiles
    expect(updateDoc).toHaveBeenCalledTimes(4); // 2 profiles * 2 updates each

    // Check first profile migration
    expect(updateDoc).toHaveBeenCalledWith('1', {
      name: 'John Doe',
      fullName: null
    });
    expect(updateDoc).toHaveBeenCalledWith('1', {
      fullName: null
    });

    // Check second profile migration
    expect(updateDoc).toHaveBeenCalledWith('2', {
      name: 'Jane Smith',
      fullName: null
    });
    expect(updateDoc).toHaveBeenCalledWith('2', {
      fullName: null
    });

    // Should not update already migrated profile
    expect(updateDoc).not.toHaveBeenCalledWith('3', expect.any(Object));
  });

  it('should handle errors during migration', async () => {
    // Mock an error for the first profile
    (updateDoc as jest.Mock)
      .mockRejectedValueOnce(new Error('Update failed'))
      .mockResolvedValueOnce(undefined);

    await migrateProfileNames();

    // Should still attempt to migrate other profiles
    expect(updateDoc).toHaveBeenCalledWith('2', expect.any(Object));
  });

  it('should track migration analytics', async () => {
    await migrateProfileNames();

    // Check analytics update
    expect(updateDoc).toHaveBeenCalledWith(
      'analytics/migrations',
      expect.objectContaining({
        profile_name_migration: expect.objectContaining({
          totalProcessed: 3,
          migratedCount: 2,
          errorCount: 0
        })
      }),
      { merge: true }
    );
  });
}); 