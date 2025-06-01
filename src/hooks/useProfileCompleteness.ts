import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Profile } from '@/types/profile';

export const useProfileCompleteness = (profileId: string) => {
  const [completeness, setCompleteness] = useState({
    required: 0,
    completed: 0,
  });

  useEffect(() => {
    const calculateCompleteness = async () => {
      try {
        const dbInstance = await getDb();
        const profileRef = doc(dbInstance, 'profiles', profileId);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          return;
        }

        const profile = profileSnap.data() as Profile;
        let completed = 0;
        let required = 0;

        // Basic information
        required += 4; // name, bio, photo, department
        if (profile.name) completed++;
        if (profile.bio) completed++;
        if (profile.photoURL) completed++;
        if (profile.department) completed++;

        // Contact information
        required += 1; // universityId
        if (profile.universityId) completed++;

        // Photos
        required += 1; // photos
        if (profile.photos?.length) completed++;

        setCompleteness({ required, completed });
      } catch (error) {
        console.error('Error calculating profile completeness:', error);
      }
    };

    calculateCompleteness();
  }, [profileId]);

  return { completeness };
}; 