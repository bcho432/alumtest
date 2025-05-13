import { getDb } from '@/lib/firebase';
import { collection, doc, setDoc, updateDoc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

export interface MemorialBasicInfo {
  name: string;
  dateOfBirth: string;
  birthLocation: string;
  dateOfDeath: string;
  deathLocation: string;
}

export interface MemorialLifeStory {
  education: string;
  notableAchievements: string;
  jobs: string;
  majorLifeEvents: string;
  hobbies: string;
  personalStories: string;
  memorableQuotes: string;
  values: string;
  communityInvolvement: string;
}

export interface MemorialPhoto {
  url: string;
  caption: string;
}

export interface Memorial {
  id: string;
  universityId: string;
  status: 'draft' | 'published';
  basicInfo: MemorialBasicInfo;
  lifeStory?: MemorialLifeStory;
  photos?: MemorialPhoto[];
  createdAt: Date;
  updatedAt: Date;
  creatorId?: string;
  collaboratorIds?: string[];
  universityApproved?: boolean;
}

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

export const createMemorial = async (universityId: string, basicInfo: MemorialBasicInfo, creatorId?: string): Promise<Memorial> => {
  if (!universityId) {
    throw new Error('University ID is required');
  }

  // Validate input
  const validationError = validateBasicInfo(basicInfo);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    console.log("Starting simplified memorial creation with:", { universityId, basicInfo, creatorId });
    const db = getDb();

    // Skip university document check for now
    
    const memorialRef = doc(collection(db, 'memorials'));
    const now = new Date();
    const memorial: Memorial = {
      id: memorialRef.id,
      universityId,
      status: 'draft',
      basicInfo,
      createdAt: now,
      updatedAt: now,
      // If a creatorId is provided, use it; otherwise default to universityId
      creatorId: creatorId || universityId,
      collaboratorIds: [],
      universityApproved: creatorId ? false : true, // Auto-approve if university created it
    };

    console.log('Attempting to create memorial document:', {
      memorialId: memorialRef.id,
      universityId,
      creatorId: memorial.creatorId,
      path: memorialRef.path
    });

    await setDoc(memorialRef, {
      ...memorial,
      createdAt: now.toISOString(), // Use regular date instead of serverTimestamp for testing
      updatedAt: now.toISOString(),
    });

    console.log('Memorial created successfully:', memorialRef.id);

    return memorial;
  } catch (error) {
    console.error('Error creating memorial (simplified):', {
      error,
      universityId,
      basicInfo,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown error type',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error) {
      throw new Error(`Failed to create memorial: ${error.message}`);
    }
    throw new Error('Failed to create memorial. Please try again.');
  }
};

export const updateMemorialLifeStory = async (memorialId: string, lifeStory: MemorialLifeStory): Promise<void> => {
  if (!memorialId) {
    throw new Error('Memorial ID is required');
  }

  const validationError = validateLifeStory(lifeStory);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const db = getDb();
    const memorialRef = doc(db, 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) {
      throw new Error('Memorial not found');
    }

    await updateDoc(memorialRef, {
      lifeStory,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating memorial life story:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update life story: ${error.message}`);
    }
    throw new Error('Failed to update life story. Please try again.');
  }
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
    const db = getDb();
    const memorialRef = doc(db, 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) {
      throw new Error('Memorial not found');
    }

    await updateDoc(memorialRef, {
      photos,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating memorial photos:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update photos: ${error.message}`);
    }
    throw new Error('Failed to update photos. Please try again.');
  }
};

export const getMemorial = async (memorialId: string): Promise<Memorial> => {
  if (!memorialId) {
    throw new Error('Memorial ID is required');
  }

  try {
    const db = getDb();
    const memorialRef = doc(db, 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) {
      throw new Error('Memorial not found');
    }

    const data = memorialDoc.data();
    
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

    return {
      ...data,
      id: memorialDoc.id,
      createdAt,
      updatedAt
    } as Memorial;
  } catch (error) {
    console.error('Error getting memorial:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to load memorial: ${error.message}`);
    }
    throw new Error('Failed to load memorial. Please try again.');
  }
};

export const getUniversityMemorials = async (universityId: string): Promise<Memorial[]> => {
  if (!universityId) {
    throw new Error('University ID is required');
  }

  try {
    const db = getDb();
    const memorialsCollection = collection(db, 'memorials');
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
        createdAt,
        updatedAt
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
    const db = getDb();
    const memorialRef = doc(db, 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) {
      throw new Error('Memorial not found');
    }

    await updateDoc(memorialRef, {
      status: 'published',
      updatedAt: serverTimestamp(),
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
    const db = getDb();
    const memorialRef = doc(db, 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) {
      throw new Error('Memorial not found');
    }

    await updateDoc(memorialRef, {
      universityApproved: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error approving memorial:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to approve memorial: ${error.message}`);
    }
    throw new Error('Failed to approve memorial. Please try again.');
  }
}; 