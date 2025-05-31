import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/hooks/useAuth';
import { useCreateProfile } from '@/hooks/useCreateProfile';
import { toast } from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';
import { doc, getDoc, collection, setDoc, writeBatch } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';

interface CreateProfileButtonProps {
  universityId: string;
  profileType: 'memorial' | 'personal';
  className?: string;
}

export const CreateProfileButton: React.FC<CreateProfileButtonProps> = ({
  universityId,
  profileType,
  className
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { createProfile, loading } = useCreateProfile();

  const pollForProfile = useCallback(async (profileId: string, collectionPath: string) => {
    const { db } = await getFirebaseServices();
    const profileRef = doc(db, collectionPath, profileId);
    
    const maxAttempts = 10; // Increased from 5 to 10
    const pollInterval = 2000; // Increased from 1s to 2s
    let attempts = 0;

    while (attempts < maxAttempts) {
      console.log(`[CreateProfileButton] Polling attempt ${attempts + 1}/${maxAttempts}`);
      try {
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          console.log('[CreateProfileButton] Profile found in database');
          return true;
        }

        console.log('[CreateProfileButton] Profile not found yet, waiting...');
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('[CreateProfileButton] Error during polling:', error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    return false;
  }, []);

  const handleCreate = async () => {
    if (!user) {
      console.log('[CreateProfileButton] User not authenticated');
      toast.error('Please sign in to create a profile');
      return;
    }

    try {
      console.log('[CreateProfileButton] Starting profile creation:', { universityId, profileType });
      
      // Create the profile
      const profileId = await createProfile({
        universityId,
        type: profileType,
        status: 'draft',
        createdBy: user.uid,
        updatedBy: user.uid,
        name: '',
        description: '',
        imageUrl: '',
        basicInfo: {
          dateOfBirth: null,
          dateOfDeath: null,
          biography: '',
          photo: '',
          birthLocation: '',
          deathLocation: ''
        },
        lifeStory: {
          content: '',
          updatedAt: Timestamp.now()
        },
        isPublic: false,
        metadata: {
          tags: [],
          categories: [],
          lastModifiedBy: user.uid,
          lastModifiedAt: Timestamp.now(),
          version: 1
        }
      });

      console.log('[CreateProfileButton] Profile created with ID:', profileId);

      // Determine the collection path
      const collectionPath = profileType === 'memorial' 
        ? `universities/${universityId}/profiles`
        : 'profiles';
      
      console.log('[CreateProfileButton] Checking profile in collection:', collectionPath);
      
      // Initialize the timeline subcollection
      const { db } = await getFirebaseServices();
      if (!db) {
        throw new Error('Database not initialized');
      }

      const batch = writeBatch(db);
      
      // Create the main profile document
      const profileRef = doc(db, collectionPath, profileId);
      batch.set(profileRef, {
        id: profileId,
        universityId,
        type: profileType,
        status: 'draft',
        createdBy: user.uid,
        updatedBy: user.uid,
        name: '',
        description: '',
        imageUrl: '',
        basicInfo: {
          dateOfBirth: null,
          dateOfDeath: null,
          biography: '',
          photo: '',
          birthLocation: '',
          deathLocation: ''
        },
        lifeStory: {
          content: '',
          updatedAt: Timestamp.now()
        },
        isPublic: false,
        metadata: {
          tags: [],
          categories: [],
          lastModifiedBy: user.uid,
          lastModifiedAt: Timestamp.now(),
          version: 1
        }
      });

      // Initialize the timeline subcollection
      const timelineRef = collection(db, collectionPath, profileId, 'timeline');
      const initialTimelineDoc = doc(timelineRef);
      batch.set(initialTimelineDoc, {
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        type: 'initialization',
        title: 'Profile Created',
        description: 'Profile timeline initialized',
        startDate: Timestamp.now().toDate().toISOString(),
      });

      // Commit the batch
      await batch.commit();
      
      // Poll for the profile to be saved
      const profileExists = await pollForProfile(profileId, collectionPath);
      
      if (profileExists) {
        const targetPath = profileType === 'memorial'
          ? `/${universityId}/memorials/${profileId}/edit`
          : `/${universityId}/profiles/${profileId}/edit`;
        
        console.log('[CreateProfileButton] Redirecting to:', targetPath);
        
        // Use window.location for navigation
        window.location.href = targetPath;
      } else {
        console.log('[CreateProfileButton] Profile not found after all attempts');
        toast.error('Profile creation is taking longer than expected. Please try refreshing the page.');
      }
    } catch (error) {
      console.error('[CreateProfileButton] Error in profile creation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create profile');
    }
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={loading}
      className={className}
    >
      <Icon name="plus" className="mr-2 h-4 w-4" />
      {loading ? 'Creating...' : `Create New ${profileType === 'memorial' ? 'Memorial' : 'Profile'}`}
    </Button>
  );
}; 