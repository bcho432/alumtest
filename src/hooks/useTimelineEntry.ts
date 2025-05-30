import { useState } from 'react';
import { doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from './useToast';
import { usePermissions } from './usePermissions';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Hook for managing timeline entries
 * @param profileId - The ID of the profile containing the timeline entries
 */
export const useTimelineEntry = (profileId: string) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();
  const { isEditor } = usePermissions();

  /**
   * Deletes a timeline entry with retry mechanism
   * @param entryId - The ID of the entry to delete
   * @returns Promise<boolean> - Whether the deletion was successful
   */
  const deleteEntry = async (entryId: string): Promise<boolean> => {
    if (!isEditor) {
      showToast({
        title: 'Error',
        description: 'You do not have permission to delete entries.',
        status: 'error',
      });
      return false;
    }

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        setIsDeleting(true);

        // Delete the entry
        const dbInstance = await getDb();
        const entryRef = doc(dbInstance, 'profiles', profileId, 'timeline', entryId);
        await deleteDoc(entryRef);

        // Log the deletion
        const logRef = doc(dbInstance, 'logs', 'timelineDelete');
        await setDoc(logRef, {
          profileId,
          entryId,
          deletedAt: serverTimestamp(),
          deletedBy: 'user', // TODO: Replace with actual user ID when auth is implemented
        }, { merge: true });

        showToast({
          title: 'Success',
          description: 'Entry deleted successfully.',
          status: 'success',
        });
        return true;
      } catch (error) {
        console.error(`Error deleting timeline entry (attempt ${retries + 1}/${MAX_RETRIES}):`, error);
        retries++;

        if (retries === MAX_RETRIES) {
          showToast({
            title: 'Error',
            description: 'Failed to delete entry after multiple attempts.',
            status: 'error',
          });
          return false;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } finally {
        if (retries === MAX_RETRIES) {
          setIsDeleting(false);
        }
      }
    }

    return false;
  };

  return {
    deleteEntry,
    isDeleting,
  };
}; 