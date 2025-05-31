import { getDb } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  runTransaction,
  DocumentReference,
  QuerySnapshot,
  DocumentData,
  CollectionReference,
  Timestamp
} from 'firebase/firestore';
import { Memorial, MemorialBasicInfo, MemorialLifeStory, MemorialPhoto } from '@/types/memorial';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Validation functions
const validateBasicInfo = (basicInfo: MemorialBasicInfo): string | null => {
  if (!basicInfo.name?.trim()) {
    return 'Name is required';
  }
  if (basicInfo.name.length > 100) {
    return 'Name must be less than 100 characters';
  }
  if (basicInfo.birthLocation && basicInfo.birthLocation.length > 200) {
    return 'Birth location must be less than 200 characters';
  }
  if (basicInfo.deathLocation && basicInfo.deathLocation.length > 200) {
    return 'Death location must be less than 200 characters';
  }
  if (basicInfo.dateOfBirth && basicInfo.dateOfDeath) {
    const birthDate = new Date(basicInfo.dateOfBirth);
    const deathDate = new Date(basicInfo.dateOfDeath);
    if (isNaN(birthDate.getTime()) || isNaN(deathDate.getTime())) {
      return 'Invalid date format';
    }
    if (deathDate < birthDate) {
      return 'Date of death cannot be before date of birth';
    }
  }
  return null;
};

const validateLifeStory = (lifeStory: MemorialLifeStory): string | null => {
  const fields = [
    'education',
    'notableAchievements',
    'jobs',
    'majorLifeEvents',
    'hobbies',
    'personalStories',
    'memorableQuotes',
    'values',
    'communityInvolvement',
  ];

  for (const field of fields) {
    const value = lifeStory[field as keyof MemorialLifeStory];
    if (value && typeof value === 'string' && value.length > 1000) {
      return `${field} must be less than 1000 characters`;
    }
  }

  return null;
};

const validatePhotos = (photos: MemorialPhoto[]): string | null => {
  if (!Array.isArray(photos)) {
    return 'Photos must be an array';
  }

  if (photos.length > 20) {
    return 'Maximum 20 photos allowed';
  }

  for (const photo of photos) {
    if (!photo.url) {
      return 'Photo URL is required';
    }
    if (photo.caption && photo.caption.length > 200) {
      return 'Photo caption must be less than 200 characters';
    }
  }

  return null;
};

// Retry utility
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(operation, retries - 1, delay * 2);
  }
};

// Helper function to ensure Firestore is initialized
async function assertDb() {
  const db = await getDb();
  if (!db) throw new Error('Firestore is not initialized');
  return db;
}

// Memorial service functions
export const createMemorial = async (data: Omit<Memorial, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memorial> => {
  const db = await assertDb();
  
  // Create memorial document with transaction to ensure consistency
  const memorial = await runTransaction(db, async (transaction) => {
    const memorialRef = doc(collection(db, 'memorials'));
    const now = new Date();
    
    const memorialData: Memorial = {
      ...data,
      id: memorialRef.id,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };

    transaction.set(memorialRef, {
      ...memorialData,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });

    return memorialData;
  });

  return memorial;
};

export const updateMemorial = async (
  memorialId: string,
  updates: Partial<Memorial>
): Promise<void> => {
  if (!memorialId) {
    throw new Error('Memorial ID is required');
  }

  return retryWithBackoff(async () => {
    try {
      const memorialRef = doc(await assertDb(), 'memorials', memorialId);
      const memorialDoc = await getDoc(memorialRef);

      if (!memorialDoc.exists()) {
        throw new Error('Memorial not found');
      }

      const memorial = memorialDoc.data() as Memorial;

      // Validate updates
      if (updates.basicInfo) {
        const validationError = validateBasicInfo(updates.basicInfo);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      if (updates.lifeStory) {
        const validationError = validateLifeStory(updates.lifeStory);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      if (updates.photos) {
        const validationError = validatePhotos(updates.photos);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      // Update the memorial
      await updateDoc(memorialRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating memorial:', error);
      throw error;
    }
  });
};

export const getMemorial = async (memorialId: string): Promise<Memorial | null> => {
  if (!memorialId) {
    throw new Error('Memorial ID is required');
  }

  return retryWithBackoff(async () => {
    try {
      const memorialRef = doc(await assertDb(), 'memorials', memorialId);
      const memorialDoc = await getDoc(memorialRef);

      if (!memorialDoc.exists()) {
        return null;
      }

      const data = memorialDoc.data();
      
      // Handle dates that might be stored as ISO strings
      let createdAt = new Date();
      let updatedAt = new Date();
      
      if (data.createdAt) {
        createdAt = typeof data.createdAt === 'string' 
          ? new Date(data.createdAt)
          : data.createdAt.toDate();
      }
      
      if (data.updatedAt) {
        updatedAt = typeof data.updatedAt === 'string'
          ? new Date(data.updatedAt)
          : data.updatedAt.toDate();
      }

      return {
        ...data,
        id: memorialDoc.id,
        createdAt: data.createdAt ?? Timestamp.now(),
        updatedAt: data.updatedAt ?? Timestamp.now(),
        universityId: data.universityId ?? '',
        status: data.status ?? 'draft',
        basicInfo: data.basicInfo ?? {},
        lastModifiedAt: data.lastModifiedAt ?? Timestamp.now(),
        lastModifiedBy: data.lastModifiedBy ?? '',
        version: data.version ?? 1
      } as Memorial;
    } catch (error) {
      console.error('Error getting memorial:', error);
      throw error;
    }
  });
};

export const getMemorialsByUniversity = async (universityId: string): Promise<Memorial[]> => {
  if (!universityId) {
    throw new Error('University ID is required');
  }

  return retryWithBackoff(async () => {
    try {
      const db = await assertDb();
      const memorialsRef = collection(db, 'memorials');
      const q = query(
        memorialsRef,
        where('universityId', '==', universityId),
        where('status', '==', 'published')
      );

      const querySnapshot = await getDocs(q);
      const memorials: Memorial[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt = new Date();
        let updatedAt = new Date();

        if (data.createdAt) {
          createdAt = typeof data.createdAt === 'string'
            ? new Date(data.createdAt)
            : data.createdAt.toDate();
        }

        if (data.updatedAt) {
          updatedAt = typeof data.updatedAt === 'string'
            ? new Date(data.updatedAt)
            : data.updatedAt.toDate();
        }

        memorials.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt ?? Timestamp.now(),
          updatedAt: data.updatedAt ?? Timestamp.now(),
          universityId: data.universityId ?? '',
          status: data.status ?? 'draft',
          basicInfo: data.basicInfo ?? {},
          lastModifiedAt: data.lastModifiedAt ?? Timestamp.now(),
          lastModifiedBy: data.lastModifiedBy ?? '',
          version: data.version ?? 1
        } as Memorial);
      });

      return memorials;
    } catch (error) {
      console.error('Error getting university memorials:', error);
      throw error;
    }
  });
};

export const getMemorialsByCreator = async (creatorId: string): Promise<Memorial[]> => {
  if (!creatorId) {
    throw new Error('Creator ID is required');
  }

  return retryWithBackoff(async () => {
    try {
      const memorialsRef = collection(await assertDb(), 'memorials');
      const q = query(memorialsRef, where('creatorId', '==', creatorId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt ?? Timestamp.now(),
        updatedAt: doc.data().updatedAt ?? Timestamp.now(),
        universityId: doc.data().universityId ?? '',
        status: doc.data().status ?? 'draft',
        basicInfo: doc.data().basicInfo ?? {},
        lastModifiedAt: doc.data().lastModifiedAt ?? Timestamp.now(),
        lastModifiedBy: doc.data().lastModifiedBy ?? '',
        version: doc.data().version ?? 1
      }) as Memorial);
    } catch (error) {
      console.error('Error getting memorials by creator:', error);
      throw error;
    }
  });
};

export const updateMemorialLifeStory = async (
  memorialId: string, 
  lifeStory: MemorialLifeStory
): Promise<void> => {
  if (!memorialId) {
    throw new Error('Memorial ID is required');
  }

  const validationError = validateLifeStory(lifeStory);
  if (validationError) {
    throw new Error(validationError);
  }

  return retryWithBackoff(async () => {
    try {
      const memorialRef = doc(await assertDb(), 'memorials', memorialId);
      
      await runTransaction(await assertDb(), async (transaction) => {
        const memorialDoc = await transaction.get(memorialRef);
        
        if (!memorialDoc.exists()) {
          throw new Error('Memorial not found');
        }

        transaction.update(memorialRef, {
          lifeStory,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      });
    } catch (error) {
      console.error('Error updating memorial life story:', error);
      throw error;
    }
  });
};

export const updateMemorialPhotos = async (memorialId: string, photos: MemorialPhoto[]): Promise<void> => {
  if (!memorialId) {
    throw new Error('Memorial ID is required');
  }

  const validationError = validatePhotos(photos);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const memorialRef = doc(await assertDb(), 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) {
      throw new Error('Memorial not found');
    }

    await updateDoc(memorialRef, {
      photos,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error updating memorial photos:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update photos: ${error.message}`);
    }
    throw new Error('Failed to update photos. Please try again.');
  }
};

export const getUniversityMemorials = async (universityId: string): Promise<Memorial[]> => {
  if (!universityId) {
    throw new Error('University ID is required');
  }

  try {
    const memorialsCollection = collection(await assertDb(), 'memorials');
    const memorialsQuery = query(memorialsCollection, where('universityId', '==', universityId));
    const querySnapshot = await getDocs(memorialsQuery);
    
    const memorials: Memorial[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Handle dates that might be stored as ISO strings
      let createdAt = new Date();
      let updatedAt = new Date();
      
      if (data.createdAt) {
        // Check if it's a Firestore timestamp or an ISO string
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
        }
      }
      
      if (data.updatedAt) {
        // Check if it's a Firestore timestamp or an ISO string
        if (typeof data.updatedAt.toDate === 'function') {
          updatedAt = data.updatedAt.toDate();
        } else if (typeof data.updatedAt === 'string') {
          updatedAt = new Date(data.updatedAt);
        }
      }
      
      memorials.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt ?? Timestamp.now(),
        updatedAt: data.updatedAt ?? Timestamp.now(),
        universityId: data.universityId ?? '',
        status: data.status ?? 'draft',
        basicInfo: data.basicInfo ?? {},
        lastModifiedAt: data.lastModifiedAt ?? Timestamp.now(),
        lastModifiedBy: data.lastModifiedBy ?? '',
        version: data.version ?? 1
      } as Memorial);
    });
    
    return memorials;
  } catch (error) {
    console.error('Error getting university memorials:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to load memorials: ${error.message}`);
    }
    throw new Error('Failed to load memorials. Please try again.');
  }
};

export const publishMemorial = async (memorialId: string): Promise<void> => {
  if (!memorialId) {
    throw new Error('Memorial ID is required');
  }

  try {
    const memorialRef = doc(await assertDb(), 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) {
      throw new Error('Memorial not found');
    }

    await updateDoc(memorialRef, {
      status: 'published',
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error publishing memorial:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to publish memorial: ${error.message}`);
    }
    throw new Error('Failed to publish memorial. Please try again.');
  }
};

export const approveMemorial = async (memorialId: string): Promise<void> => {
  if (!memorialId) {
    throw new Error('Memorial ID is required');
  }

  try {
    const memorialRef = doc(await assertDb(), 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) {
      throw new Error('Memorial not found');
    }

    await updateDoc(memorialRef, {
      universityApproved: true,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error approving memorial:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to approve memorial: ${error.message}`);
    }
    throw new Error('Failed to approve memorial. Please try again.');
  }
}; 