import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Profile } from '@/types/profile';
import { generateProfileDiffs } from '@/utils/diff';

interface UseProfileDiffResult {
  isLoading: boolean;
  error: string | null;
  diffs: ReturnType<typeof generateProfileDiffs> | null;
}

export const useProfileDiff = (profileId: string): UseProfileDiffResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<ReturnType<typeof generateProfileDiffs> | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const db = await getDb();

        // Fetch published version
        const publishedDoc = await getDoc(doc(db, 'profiles', profileId));
        const publishedProfile = publishedDoc.data() as Profile | null;

        if (!publishedProfile) {
          setError('No published version found');
          return;
        }

        // Fetch draft version
        const draftDoc = await getDoc(doc(db, 'profiles', `${profileId}_draft`));
        const draftProfile = draftDoc.data() as Profile | null;

        if (!draftProfile) {
          setError('No draft version found');
          return;
        }

        // Generate diffs
        const profileDiffs = generateProfileDiffs(publishedProfile, draftProfile);
        setDiffs(profileDiffs);
      } catch (err) {
        setError('Failed to load changes');
        console.error('Error loading profile changes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (profileId) {
      fetchProfiles();
    }
  }, [profileId]);

  return {
    isLoading,
    error,
    diffs,
  };
}; 