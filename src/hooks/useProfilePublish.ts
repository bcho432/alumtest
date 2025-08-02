import { useState, useCallback } from 'react';
import { doc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from './useToast';
import { useAnalytics } from './useAnalytics';
import { usePermissions } from './usePermissions';
import { useAuth } from './useAuth';
import { AlumniProfile } from '@/types/profile';

interface UseProfilePublishProps {
  orgId: string;
  profileId: string;
}

interface ProfileValidationError {
  field: string;
  message: string;
}

export function useProfilePublish({ orgId, profileId }: UseProfilePublishProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();
  const { isAdmin } = usePermissions();
  const { user } = useAuth();

  const validateProfile = useCallback(async (profile: AlumniProfile): Promise<ProfileValidationError[]> => {
    const errors: ProfileValidationError[] = [];

    // Required fields validation
    if (!profile.name) {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    return errors;
  }, []);

  const publishProfile = useCallback(async () => {
    if (!orgId || !profileId || !user) return;

    try {
      setIsPublishing(true);

      // Check admin permissions
      const isUserAdmin = await isAdmin(orgId);
      if (!isUserAdmin) {
        throw new Error('You do not have permission to publish profiles');
      }

      // Get and validate profile
      const dbInstance = await getDb();
      const profileRef = doc(dbInstance, 'universities', orgId, 'profiles', profileId);
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        throw new Error('Profile not found');
      }

      const profile = profileDoc.data() as AlumniProfile;
      const validationErrors = await validateProfile(profile);

      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.map(err => `${err.field}: ${err.message}`).join('\n');
        throw new Error(`Profile validation failed:\n${errorMessage}`);
      }

      // Update profile status
      await updateDoc(profileRef, {
        status: 'published',
        updatedAt: serverTimestamp(),
      });

      // Log the publish action
      const logsRef = collection(dbInstance, 'logs');
      await addDoc(logsRef, {
        type: 'profilePublished',
        orgId,
        profileId,
        timestamp: serverTimestamp(),
        metadata: {
          publishedBy: user.id,
          publishedByName: user.displayName || 'Unknown',
          validationStatus: 'passed',
        },
      });

      showToast({
        title: 'Success',
        description: 'Profile published successfully',
        status: 'success',
      });

      trackEvent('profile_published', {
        orgId,
        profileId,
        publishedBy: user.id,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to publish profile');
      showToast({
        title: 'Error',
        description: error.message,
        status: 'error',
      });
      trackEvent('profile_publish_error', {
        orgId,
        profileId,
        error: error.message,
        publishedBy: user?.id,
      });
      throw error;
    } finally {
      setIsPublishing(false);
    }
  }, [orgId, profileId, isAdmin, showToast, trackEvent, user, validateProfile]);

  return {
    publishProfile,
    isPublishing,
  };
} 