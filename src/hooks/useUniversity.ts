import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Profile } from '@/types';
import { getFirebaseServices } from '@/lib/firebase';

export function useUniversity(universityId: string) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const services = await getFirebaseServices();
        const profilesRef = collection(services.db, 'profiles');
        const q = query(profilesRef, where('universityId', '==', universityId));
        const querySnapshot = await getDocs(q);
        
        const loadedProfiles = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Profile[];
        
        setProfiles(loadedProfiles);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load profiles'));
      } finally {
        setIsLoading(false);
      }
    };

    if (universityId) {
      loadProfiles();
    }
  }, [universityId]);

  return { profiles, isLoading, error };
} 