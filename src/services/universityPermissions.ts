import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, DocumentData, orderBy, limit } from 'firebase/firestore';
import { UserData } from '@/types/user';
import { GrantRoleResponse, RemoveRoleResponse, AllowedRole } from '@/types/permission';
import { auditLogService } from './auditLogService';
import { db } from '@/lib/firebase';

export const universityPermissionsService = {
  async grantRole(orgId: string, userId: string, role: AllowedRole): Promise<GrantRoleResponse> {
    const functions = getFunctions();
    const grantRole = httpsCallable(functions, 'grantUniversityRole');
    const result = await grantRole({ orgId, userId, role });
    return result.data as GrantRoleResponse;
  },

  async grantRoleByEmail(orgId: string, email: string, role: AllowedRole, universityId: string): Promise<GrantRoleResponse> {
    const functions = getFunctions();
    const grantRole = httpsCallable(functions, 'grantUniversityRole');
    const result = await grantRole({ orgId, email, role });
    return result.data as GrantRoleResponse;
  },

  async removeRole(orgId: string, userId: string): Promise<RemoveRoleResponse> {
    const functions = getFunctions();
    const removeRole = httpsCallable(functions, 'removeUniversityRole');
    const result = await removeRole({ orgId, userId });
    return result.data as RemoveRoleResponse;
  },

  async listPermissions(orgId: string, limit: number = 25, startAfter?: any) {
    const db = getFirestore();
    const permissionsRef = collection(db, `universities/${orgId}/permissions`);
    let q = query(permissionsRef);
    
    if (startAfter) {
      q = query(permissionsRef, where('__name__', '>', startAfter.id));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit);
  },

  async getUserByEmail(email: string): Promise<UserData | null> {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('email', '==', email.toLowerCase()),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const userDoc = snapshot.docs[0];
    const data = userDoc.data();
    return {
      uid: userDoc.id,
      displayName: data.displayName,
      email: data.email,
    };
  },

  async getUser(userId: string): Promise<UserData | null> {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    const data = userDoc.data();
    return {
      uid: userId,
      displayName: data.displayName,
      email: data.email,
    };
  },

  async hasPermission(orgId: string, userId: string): Promise<boolean> {
    const db = getFirestore();
    const permRef = doc(db, `universities/${orgId}/permissions/${userId}`);
    const permDoc = await getDoc(permRef);
    return permDoc.exists();
  },

  async getPermission(orgId: string, userId: string): Promise<{ role: AllowedRole; grantedAt: any } | null> {
    const db = getFirestore();
    const permRef = doc(db, `universities/${orgId}/permissions/${userId}`);
    const permDoc = await getDoc(permRef);
    if (!permDoc.exists()) return null;
    const data = permDoc.data();
    return {
      role: data.role as AllowedRole,
      grantedAt: data.grantedAt,
    };
  }
}; 