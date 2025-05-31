import { getDb } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Profile } from '@/types';
import { ProfileService } from '@/types/services';

async function assertDb() {
  const db = await getDb();
  if (!db) throw new Error('Firestore is not initialized');
  return db;
}

export const profilesService: ProfileService = {
  async getProfile(profileId: string) {
    const db = await assertDb();

    const profileRef = doc(db, 'profiles', profileId);
    const profileDoc = await getDoc(profileRef);
    
    if (!profileDoc.exists()) {
      throw new Error('Profile not found');
    }
    
    return { id: profileDoc.id, ...profileDoc.data() } as Profile;
  },

  async getProfilesByOrganization(organizationId: string) {
    const db = await assertDb();

    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('organizationId', '==', organizationId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
  },

  async createProfile(data: Omit<Profile, 'id'>) {
    const db = await assertDb();

    const profilesRef = collection(db, 'profiles');
    const docRef = await addDoc(profilesRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return { id: docRef.id, ...data } as Profile;
  },

  async updateProfile(profileId: string, data: Partial<Profile>) {
    const db = await assertDb();

    const profileRef = doc(db, 'profiles', profileId);
    await updateDoc(profileRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    
    return this.getProfile(profileId);
  },

  async deleteProfile(profileId: string) {
    const db = await assertDb();

    const profileRef = doc(db, 'profiles', profileId);
    await deleteDoc(profileRef);
  },

  async getProfilesByUniversity(universityId: string): Promise<Profile[]> {
    const db = await assertDb();

    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('universityId', '==', universityId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        isDeceased: data.isDeceased || false,
        createdBy: data.createdBy,
        status: data.status || 'draft',
        createdAt: data.createdAt || Timestamp.now(),
        universityId: data.universityId,
        basicInfo: data.basicInfo,
        lifeStory: data.lifeStory
      };
    });
  },

  async listProfiles(): Promise<Profile[]> {
    const db = await assertDb();

    const profilesRef = collection(db, 'profiles');
    const snapshot = await getDocs(profilesRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        isDeceased: data.isDeceased || false,
        createdBy: data.createdBy,
        status: data.status || 'draft',
        createdAt: data.createdAt || Timestamp.now(),
        universityId: data.universityId,
        basicInfo: data.basicInfo,
        lifeStory: data.lifeStory
      };
    });
  }
}; 