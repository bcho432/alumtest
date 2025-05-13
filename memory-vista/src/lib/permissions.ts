import { User } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Memorial } from '@/services/memorials';

/**
 * Check if a user is a university administrator
 */
export async function isUniversityAdmin(userId: string, universityId: string): Promise<boolean> {
  if (!userId || !universityId) return false;
  
  try {
    const db = getDb();
    const universityRef = doc(db, 'universities', universityId);
    const universityDoc = await getDoc(universityRef);
    
    if (!universityDoc.exists()) return false;
    
    const universityData = universityDoc.data();
    return universityData.adminIds?.includes(userId) || false;
  } catch (error) {
    console.error('Error checking university admin status:', error);
    return false;
  }
}

/**
 * Check if a user is the creator of a memorial
 * Note: This will be used once we add creatorId to memorials
 */
export async function isMemorialCreator(userId: string, memorialId: string): Promise<boolean> {
  if (!userId || !memorialId) return false;
  
  try {
    const db = getDb();
    const memorialRef = doc(db, 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) return false;
    
    const memorialData = memorialDoc.data();
    // Currently returning false as creatorId is not yet in the model
    // Will update when memorial model is extended
    return memorialData.creatorId === userId;
  } catch (error) {
    console.error('Error checking memorial creator status:', error);
    return false;
  }
}

/**
 * Check if a user is a collaborator on a memorial
 * Note: This will be used once we add collaboratorIds to memorials
 */
export async function isMemorialCollaborator(userId: string, memorialId: string): Promise<boolean> {
  if (!userId || !memorialId) return false;
  
  try {
    const db = getDb();
    const memorialRef = doc(db, 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) return false;
    
    const memorialData = memorialDoc.data();
    // Currently returning false as collaboratorIds is not yet in the model
    // Will update when memorial model is extended
    return memorialData.collaboratorIds?.includes(userId) || false;
  } catch (error) {
    console.error('Error checking memorial collaborator status:', error);
    return false;
  }
}

/**
 * Check if a memorial is published (public)
 */
export async function isMemorialPublished(memorialId: string): Promise<boolean> {
  if (!memorialId) return false;
  
  try {
    const db = getDb();
    const memorialRef = doc(db, 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) return false;
    
    const memorialData = memorialDoc.data();
    return memorialData.status === 'published';
  } catch (error) {
    console.error('Error checking memorial published status:', error);
    return false;
  }
}

/**
 * Check if a user can edit a specific memorial
 * A user can edit if they are:
 * 1. The university admin
 * 2. The memorial creator
 * 3. A collaborator on the memorial
 */
export async function canEditMemorial(userId: string, memorialId: string): Promise<boolean> {
  if (!userId || !memorialId) return false;
  
  try {
    const db = getDb();
    const memorialRef = doc(db, 'memorials', memorialId);
    const memorialDoc = await getDoc(memorialRef);
    
    if (!memorialDoc.exists()) return false;
    
    const memorialData = memorialDoc.data() as Memorial;
    
    // Check if user is university admin
    const isAdmin = await isUniversityAdmin(userId, memorialData.universityId);
    if (isAdmin) return true;
    
    // Check if user is creator (when we add this field)
    // For now, we'll consider the university ID to be the creator
    const isCreator = userId === memorialData.universityId;
    if (isCreator) return true;
    
    // Check if user is collaborator (when we add this field)
    // This will be expanded when we add the collaboratorIds field
    return false;
  } catch (error) {
    console.error('Error checking edit permissions:', error);
    return false;
  }
} 