import { collection, doc, getDocs, deleteDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { PinnedSchool } from '@/types/pinned';
import { analytics } from './analytics';
import { getFirebaseServices } from '@/lib/firebase';

export const pinnedSchoolsService = {
  /**
   * Get all pinned schools for a user
   */
  async getPinnedSchools(userId: string): Promise<PinnedSchool[]> {
    const services = await getFirebaseServices();
    const pinnedRef = collection(services.db, `users/${userId}/pinnedSchools`);
    const q = query(pinnedRef, orderBy('pinnedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      orgId: doc.id,
      ...doc.data()
    })) as PinnedSchool[];
  },

  /**
   * Pin a school for a user
   */
  async pinSchool(userId: string, school: Omit<PinnedSchool, 'pinnedAt'>): Promise<void> {
    const services = await getFirebaseServices();
    const pinnedRef = doc(services.db, `users/${userId}/pinnedSchools/${school.orgId}`);
    
    await setDoc(pinnedRef, {
      ...school,
      pinnedAt: new Date().toISOString()
    });
    analytics.trackEvent({
      name: 'school_pinned',
      properties: { userId, schoolId: school.orgId }
    });
  },

  /**
   * Unpin a school for a user
   */
  async unpinSchool(userId: string, schoolId: string): Promise<void> {
    const services = await getFirebaseServices();
    const pinnedRef = doc(services.db, `users/${userId}/pinnedSchools/${schoolId}`);
    await deleteDoc(pinnedRef);
    analytics.trackEvent({
      name: 'school_unpinned',
      properties: { userId, schoolId }
    });
  }
}; 