import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from './useToast';
import { usePermissions } from './usePermissions';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Hook for managing profile status
 * @param orgId - The organization ID
 * @param profileId - The profile ID
 */
export const useProfileStatus = (orgId: string, profileId: string) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const { showToast } = useToast();
  const { isAdmin } = usePermissions();

  /**
   * Publishes a profile with retry mechanism
   * @returns Promise<boolean> - Whether the publication was successful
   */
  const publishProfile = async (): Promise<boolean> => {
    if (!isAdmin) {
      showToast({
        title: 'Error',
        description: 'You do not have permission to publish profiles.',
        status: 'error',
      });
      return false;
    }

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        setIsPublishing(true);

        // Update the profile status
        const dbInstance = await getDb();
        const profileRef = doc(dbInstance, 'organizations', orgId, 'profiles', profileId);
        await updateDoc(profileRef, {
          status: 'published',
          publishedAt: serverTimestamp(),
        });

        showToast({
          title: 'Success',
          description: 'Profile is now live',
          status: 'success',
        });
        return true;
      } catch (error) {
        console.error(`Error publishing profile (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
        retries++;

        if (retries === MAX_RETRIES) {
          showToast({
            title: 'Error',
            description: 'Failed to publish profile after multiple attempts.',
            status: 'error',
          });
          return false;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } finally {
        if (retries === MAX_RETRIES) {
          setIsPublishing(false);
        }
      }
    }

    return false;
  };

  return {
    publishProfile,
    isPublishing,
  };
}; 