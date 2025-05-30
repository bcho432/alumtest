import { User } from 'firebase/auth';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Profile } from '@/types';
import { getMemorial } from '@/shared/services/memorials';
import { Memorial } from '@/types/memorial';
import { AllowedRole } from '@/types/permission';

async function assertDb() {
  const db = await getDb();
  if (!db) throw new Error('Firestore is not initialized');
  return db;
}

export interface UserPermission {
  role: AllowedRole;
  grantedBy: string;
  grantedAt: Date;
  lastAccess?: Date;
}

/**
 * Check if a user has a specific role for a university
 */
export async function getUserUniversityRole(userId: string, universityId: string): Promise<AllowedRole | null> {
  try {
    const db = await assertDb();
    const permissionRef = doc(db, 'universities', universityId, 'permissions', userId);
    const permissionDoc = await getDoc(permissionRef);
    
    if (!permissionDoc.exists()) {
      return null;
    }
    
    return permissionDoc.data().role as AllowedRole;
  } catch (error) {
    console.error('Error getting user university role:', error);
    return null;
  }
}

/**
 * Check if a user has a specific role for a profile
 */
export async function getUserProfileRole(userId: string, profileId: string): Promise<AllowedRole | null> {
  try {
    const db = await assertDb();
    const permissionRef = doc(db, 'profiles', profileId, 'permissions', userId);
    const permissionDoc = await getDoc(permissionRef);
    
    if (!permissionDoc.exists()) {
      return null;
    }
    
    return permissionDoc.data().role as AllowedRole;
  } catch (error) {
    console.error('Error getting user profile role:', error);
    return null;
  }
}

/**
 * Check if a user can perform a specific action on a university
 */
export async function canPerformUniversityAction(
  userId: string,
  universityId: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> {
  if (!userId || !universityId) return false;
  
  try {
    const role = await getUserUniversityRole(userId, universityId);
    if (!role) return false;
    
    // Define role-based permissions
    const rolePermissions: Record<AllowedRole, string[]> = {
      admin: ['create', 'read', 'update', 'delete'],
      editor: ['read', 'update'],
      contributor: ['read'],
      viewer: ['read']
    };
    
    return rolePermissions[role].includes(action);
  } catch (error) {
    console.error('Error checking university action permission:', error);
    return false;
  }
}

/**
 * Check if a user can perform a specific action on a profile
 */
export async function canPerformProfileAction(
  userId: string,
  profileId: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> {
  if (!userId || !profileId) return false;
  
  try {
    const role = await getUserProfileRole(userId, profileId);
    if (!role) return false;
    
    // Define role-based permissions
    const rolePermissions: Record<AllowedRole, string[]> = {
      admin: ['create', 'read', 'update', 'delete'],
      editor: ['read', 'update'],
      contributor: ['read'],
      viewer: ['read']
    };
    
    return rolePermissions[role].includes(action);
  } catch (error) {
    console.error('Error checking profile action permission:', error);
    return false;
  }
}

/**
 * Check if a user is a university administrator
 */
export async function isUniversityAdmin(userId: string, universityId: string): Promise<boolean> {
  const role = await getUserUniversityRole(userId, universityId);
  return role === 'admin';
}

/**
 * Check if a user is a profile administrator
 */
export async function isProfileAdmin(userId: string, profileId: string): Promise<boolean> {
  const role = await getUserProfileRole(userId, profileId);
  return role === 'admin';
}

/**
 * Check if a user is an editor
 */
export async function isEditor(userId: string, resourceId: string, resourceType: 'university' | 'profile'): Promise<boolean> {
  const role = resourceType === 'university' 
    ? await getUserUniversityRole(userId, resourceId)
    : await getUserProfileRole(userId, resourceId);
  return role === 'editor';
}

/**
 * Check if a user is a contributor
 */
export async function isContributor(userId: string, resourceId: string, resourceType: 'university' | 'profile'): Promise<boolean> {
  const role = resourceType === 'university' 
    ? await getUserUniversityRole(userId, resourceId)
    : await getUserProfileRole(userId, resourceId);
  return role === 'contributor';
}

/**
 * Check if a user is a viewer
 */
export async function isViewer(userId: string, resourceId: string, resourceType: 'university' | 'profile'): Promise<boolean> {
  const role = resourceType === 'university' 
    ? await getUserUniversityRole(userId, resourceId)
    : await getUserProfileRole(userId, resourceId);
  return role === 'viewer';
}

/**
 * Check if a memorial is published
 */
export async function isMemorialPublished(memorialOrId: Memorial | string): Promise<boolean> {
  try {
    if (typeof memorialOrId === 'string') {
      const memorial = await getMemorial(memorialOrId);
      return memorial?.status === 'published';
    }
    
    return memorialOrId.status === 'published';
  } catch (error) {
    console.error('Error checking if memorial is published:', error);
    return false;
  }
}

/**
 * Check if a user can edit a memorial
 */
export async function canEditMemorial(userId: string, memorialId: string): Promise<boolean> {
  try {
    const memorial = await getMemorial(memorialId);
    if (!memorial) return false;
    
    // Check if user is the creator
    if (memorial.creatorId === userId) return true;
    
    // Check if user has admin role for the university
    const isAdmin = await isUniversityAdmin(userId, memorial.universityId);
    if (isAdmin) return true;
    
    // Check if user has editor role for the university
    const hasEditorRole = await isEditor(userId, memorial.universityId, 'university');
    if (hasEditorRole) return true;
    
    return false;
  } catch (error) {
    console.error('Error checking memorial edit permission:', error);
    return false;
  }
} 