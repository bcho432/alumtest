import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';
import { University, User, Profile, Permission, COLLECTIONS } from '@/types/schema';
import { analytics } from './analytics';

function assertDb() {
  if (!firestoreDb) throw new Error('Firestore is not initialized');
  return firestoreDb;
}

export const firestoreService = {
  // University operations
  async createUniversity(data: Omit<University, 'createdAt'>): Promise<void> {
    const db = assertDb();
    const universityRef = doc(collection(db, COLLECTIONS.UNIVERSITIES));
    const university: University = {
      ...data,
      createdAt: Timestamp.now(),
    };
    await setDoc(universityRef, university);
    analytics.trackEvent({ name: 'model_created', properties: { type: 'university', id: universityRef.id } });
  },

  async getUniversity(id: string): Promise<University | null> {
    const db = assertDb();
    const docRef = doc(db, COLLECTIONS.UNIVERSITIES, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as University) : null;
  },

  // User operations
  async createUser(uid: string, data: Omit<User, 'createdAt'>): Promise<void> {
    const db = assertDb();
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const user: User = {
      ...data,
      createdAt: Timestamp.now(),
    };
    await setDoc(userRef, user);
    analytics.trackEvent({ name: 'model_created', properties: { type: 'user', id: uid } });
  },

  async getUser(uid: string): Promise<User | null> {
    const db = assertDb();
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as User) : null;
  },

  async updateUserPinnedSchools(uid: string, pinnedSchools: string[]): Promise<void> {
    const db = assertDb();
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, { pinnedSchools });
  },

  // Profile operations
  async createProfile(data: Omit<Profile, 'createdAt'>): Promise<string> {
    const db = assertDb();
    const profileRef = doc(collection(db, COLLECTIONS.PROFILES));
    const profile: Profile = {
      ...data,
      createdAt: Timestamp.now(),
    };
    await setDoc(profileRef, profile);
    analytics.trackEvent({ name: 'model_created', properties: { type: 'profile', id: profileRef.id } });
    return profileRef.id;
  },

  async getProfile(id: string): Promise<Profile | null> {
    const db = assertDb();
    const docRef = doc(db, COLLECTIONS.PROFILES, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Profile) : null;
  },

  async getProfilesByUniversity(universityId: string): Promise<Profile[]> {
    const db = assertDb();
    const q = query(
      collection(db, COLLECTIONS.PROFILES),
      where('universityId', '==', universityId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Profile);
  },

  // Permission operations
  async createPermission(data: Omit<Permission, 'grantedAt'>): Promise<void> {
    const db = assertDb();
    const permissionRef = doc(collection(db, COLLECTIONS.PERMISSIONS));
    const permission: Permission = {
      ...data,
      grantedAt: Timestamp.now(),
    };
    await setDoc(permissionRef, permission);
    analytics.trackEvent({ name: 'model_created', properties: { type: 'permission', id: permissionRef.id } });
  },

  async getPermissionsByUser(uid: string): Promise<Permission[]> {
    const db = assertDb();
    const q = query(
      collection(db, COLLECTIONS.PERMISSIONS),
      where('userId', '==', uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Permission);
  },

  async deletePermission(id: string): Promise<void> {
    const db = assertDb();
    const permissionRef = doc(db, COLLECTIONS.PERMISSIONS, id);
    await deleteDoc(permissionRef);
  },
}; 