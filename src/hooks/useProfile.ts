import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Profile } from '@/types/profile';
import { useToast } from './useToast';
import { useAnalytics } from './useAnalytics';

export function useProfile(profileId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const loadProfile = async () => {
      if (!profileId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const dbInstance = await getDb();
        const profileRef = doc(dbInstance, 'profiles', profileId);
        const profileDoc = await getDoc(profileRef);

        if (!profileDoc.exists()) {
          throw new Error('Profile not found');
        }

        const profileData = profileDoc.data() as Profile;
        setProfile({
          ...profileData,
          id: profileDoc.id,
        });

        trackEvent('profile_loaded', {
          profileId,
          status: profileData.status,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load profile');
        setError(error);
        showToast({
          title: 'Error',
          description: error.message,
          status: 'error',
        });
        trackEvent('profile_load_error', {
          profileId,
          error: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileId, showToast, trackEvent]);

  return { profile, loading, error };
} 