import { getDb } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { University } from '@/types';
import { analytics } from './analytics';

async function assertDb() {
  const db = await getDb();
  if (!db) throw new Error('Firestore is not initialized');
  return db;
}

export const universitiesService = {
  async getUniversity(id: string): Promise<University> {
    const db = await assertDb();
    const docRef = doc(db, 'universities', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('University not found');
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      createdAt: data.createdAt?.toDate() || new Date(),
      createdBy: data.createdBy,
      admins: data.adminIds || data.admins || [],
      isActive: data.isActive ?? true
    };
  },

  async listUniversities(): Promise<University[]> {
    const db = await assertDb();
    const universitiesRef = collection(db, 'universities');
    const snapshot = await getDocs(universitiesRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.createdBy,
        admins: data.adminIds || data.admins || [],
        isActive: data.isActive ?? true
      };
    });
  },

  async createUniversity(universityData: Omit<University, 'id' | 'createdAt'>): Promise<string> {
    const db = await assertDb();
    const universitiesRef = collection(db, 'universities');
    const docRef = await addDoc(universitiesRef, {
      ...universityData,
      createdAt: serverTimestamp(),
      admins: universityData.admins || [],
      isActive: universityData.isActive ?? true
    });
    
    // Log analytics event
    await analytics.logUniversityCreated(docRef.id, universityData.createdBy);
    
    return docRef.id;
  },

  async updateUniversity(id: string, updates: Partial<University>): Promise<void> {
    const db = await assertDb();
    const universityRef = doc(db, 'universities', id);
    await updateDoc(universityRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async addAdmin(universityId: string, adminEmail: string): Promise<void> {
    const db = await assertDb();
    const universityRef = doc(db, 'universities', universityId);
    const universityDoc = await getDoc(universityRef);
    
    if (!universityDoc.exists()) {
      throw new Error('University not found');
    }

    const university = universityDoc.data();
    const admins = university.admins || [];

    // Get user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', adminEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('User not found');
    }

    const userId = querySnapshot.docs[0].id;

    if (!admins.includes(userId)) {
      await updateDoc(universityRef, {
        admins: [...admins, userId]
      });
    }
  }
};

export async function getFeaturedUniversities() {
  try {
    const db = await assertDb();
    const universitiesRef = collection(db, 'universities');
    const q = query(universitiesRef, where('featured', '==', true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching featured universities:', error);
    return [];
  }
} 