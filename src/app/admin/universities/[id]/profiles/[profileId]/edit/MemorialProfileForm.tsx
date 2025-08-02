import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, DocumentReference, runTransaction } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { MemorialProfile } from '@/types/profile';
import { toast } from 'react-hot-toast';

interface MemorialProfileFormProps {
  profile: MemorialProfile;
  onSubmit: (data: Partial<MemorialProfile>) => Promise<void>;
  onCancel: () => void;
}

const MemorialProfileForm: React.FC<MemorialProfileFormProps> = ({ profile, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<MemorialProfile>>(profile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  // Function to get the correct profile reference
  const getProfileRef = useCallback(() => {
    if (!db) throw new Error('Firestore not initialized');
    return doc(db, `universities/${profile.universityId}/profiles`, profile.id) as DocumentReference<MemorialProfile>;
  }, [profile.universityId, profile.id]);

  // Function to check if the profile is locked with retries
  const checkProfileLock = async (retryCount = 0): Promise<boolean> => {
    try {
      const profileRef = getProfileRef();
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        throw new Error('Profile not found');
      }

      const profileData = profileDoc.data();
      const currentLock = profileData.lock;

      if (currentLock) {
        const lockTime = new Date(currentLock.timestamp).getTime();
        const currentTime = new Date().getTime();
        
        // If lock is expired, we can proceed
        if (currentTime - lockTime > LOCK_TIMEOUT) {
          return true;
        }

        // If lock is held by current user, we can proceed
        if (currentLock.userId === auth.currentUser?.id) {
          return true;
        }

        // Otherwise, profile is locked by another user
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking profile lock:', error);
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return checkProfileLock(retryCount + 1);
      }
      throw error;
    }
  };

  // Function to acquire a lock using a transaction
  const acquireLock = async (retryCount = 0): Promise<boolean> => {
    try {
      if (!db) throw new Error('Firestore not initialized');
      const profileRef = getProfileRef();
      
      return await runTransaction(db, async (transaction) => {
        const profileDoc = await transaction.get(profileRef);
        
        if (!profileDoc.exists()) {
          throw new Error('Profile not found');
        }

        const profileData = profileDoc.data();
        const currentLock = profileData.lock;

        if (currentLock) {
          const lockTime = new Date(currentLock.timestamp).getTime();
          const currentTime = new Date().getTime();
          
          // If lock is expired or held by current user, we can proceed
          if (currentTime - lockTime > LOCK_TIMEOUT || currentLock.userId === auth.currentUser?.id) {
            transaction.update(profileRef, {
              lock: {
                userId: auth.currentUser?.id,
                timestamp: new Date()
              }
            });
            return true;
          }

          return false;
        }

        // No lock exists, acquire it
        transaction.update(profileRef, {
          lock: {
            userId: auth.currentUser?.id,
            timestamp: new Date()
          }
        });
        return true;
      });
    } catch (error) {
      console.error('Error acquiring profile lock:', error);
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return acquireLock(retryCount + 1);
      }
      throw error;
    }
  };

  // Function to release a lock with retries
  const releaseLock = async (retryCount = 0): Promise<void> => {
    try {
      const profileRef = getProfileRef();
      await updateDoc(profileRef, {
        lock: null
      });
    } catch (error) {
      console.error('Error releasing profile lock:', error);
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return releaseLock(retryCount + 1);
      }
      throw error;
    }
  };

  // Handle browser/tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        releaseLock().catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      releaseLock().catch(console.error);
    };
  }, [hasUnsavedChanges]);

  // Check for existing lock when component mounts
  useEffect(() => {
    let mounted = true;

    const checkLock = async () => {
      try {
        const canProceed = await checkProfileLock();
        if (!mounted) return;

        if (!canProceed) {
          setLockError(`This profile is currently being edited by another user. Please try again later.`);
          setIsLocked(true);
          return;
        }

        const acquired = await acquireLock();
        if (!mounted) return;

        if (!acquired) {
          setLockError(`Failed to acquire lock. Please try again later.`);
          setIsLocked(true);
          return;
        }

        setIsLocked(false);
        setLockError(null);
      } catch (error) {
        console.error('Error during lock check:', error);
        if (mounted) {
          setLockError(`An error occurred while checking profile availability. Please try again.`);
          setIsLocked(true);
        }
      }
    };

    checkLock();

    return () => {
      mounted = false;
      releaseLock().catch(console.error);
    };
  }, [profile.id]);

  // Update handleCancel to release lock
  const handleCancel = async () => {
    try {
      await releaseLock();
      onCancel();
    } catch (error) {
      console.error('Error releasing lock during cancel:', error);
      toast.error('Error releasing lock. Your changes may still be locked.');
      // Still proceed with cancel even if lock release fails
      onCancel();
    }
  };

  // Update handleSubmit to release lock on success
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      await releaseLock();
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error during form submission:', error);
      toast.error('Failed to save changes');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // If there's a lock error, show it to the user
  if (lockError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Profile Unavailable</h3>
        <p className="mt-2 text-red-700">{lockError}</p>
        <button
          onClick={handleCancel}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form content will go here */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLocked}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default MemorialProfileForm; 