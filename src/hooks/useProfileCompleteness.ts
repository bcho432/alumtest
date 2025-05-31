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
        required += 4; // name, bio, location, interests
        if (profile.name) completed++;
        if (profile.type === 'personal' && profile.bio) completed++;
        if (profile.type === 'personal' && profile.location) completed++;

        // Contact information
        required += 2; // email, phone
        if (profile.type === 'personal' && profile.contact?.email) completed++;
        if (profile.type === 'personal' && profile.contact?.phone) completed++;

        // Timeline entries
        required += 2; // education, work
        if (profile.type === 'personal' && profile.education?.length) completed++;
        if (profile.type === 'personal' && profile.experience?.length) completed++;

        setCompleteness({ required, completed });
      } catch (error) {
        console.error('Error calculating profile completeness:', error);
      }
    };

    calculateCompleteness();
  }, [profileId]);

  return { completeness };
}; 