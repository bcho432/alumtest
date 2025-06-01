import { useState } from 'react';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, doc, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { MemorialProfile, PersonalProfile } from '../types/profile';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { useAnalytics } from './useAnalytics';

interface CreateProfileParams {
  universityId: string;
  type: 'personal' | 'memorial';
  status: 'draft' | 'published';
  createdBy: string;
  updatedBy: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  basicInfo?: {
    dateOfBirth?: Date | Timestamp | null;
    dateOfDeath?: Date | Timestamp | null;
    biography?: string;
    photo?: string;
    birthLocation?: string;
    deathLocation?: string;
  };
  lifeStory?: {
    content?: string;
    updatedAt?: Date | Timestamp;
  };
  isPublic?: boolean;
  metadata?: {
    tags?: string[];
    categories?: string[];
    lastModifiedBy?: string;
    lastModifiedAt?: Timestamp;
    version?: number;
  };
}

export function useCreateProfile() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();

  const createProfile = async (params: CreateProfileParams) => {
    console.log('useCreateProfile: Starting profile creation', params);
    
    if (!user) {
      console.error('useCreateProfile: User not authenticated');
      throw new Error('User must be authenticated to create a profile');
    }

    try {
      setLoading(true);
      const { db } = await getFirebaseServices();
      if (!db) {
        console.error('useCreateProfile: Database not initialized');
        throw new Error('Database not initialized');
      }

      const profileId = uuidv4();
      console.log('useCreateProfile: Generated profile ID', profileId);

      // Determine the collection path based on profile type
      const collectionPath = params.type === 'memorial' 
        ? `universities/${params.universityId}/profiles`
        : 'profiles';
      
      const profileRef = doc(db, collectionPath, profileId);
      console.log('useCreateProfile: Created profile reference', collectionPath);

      const baseProfileData = {
        id: profileId,
        universityId: params.universityId,
        status: params.status,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: params.createdBy,
        updatedBy: params.updatedBy,
        isPublic: params.isPublic || false,
        metadata: {
          tags: params.metadata?.tags || [],
          categories: params.metadata?.categories || [],
          lastModifiedBy: params.metadata?.lastModifiedBy || params.updatedBy,
          lastModifiedAt: Timestamp.now(),
          version: params.metadata?.version || 1
        }
      };

      let profileData: MemorialProfile | PersonalProfile;

      if (params.type === 'memorial') {
        profileData = {
          ...baseProfileData,
          type: 'memorial',
          universityId: params.universityId,
          name: params.name || '',
          description: params.description || '',
          imageUrl: params.imageUrl || '',
          basicInfo: {
            biography: params.basicInfo?.biography || '',
            photo: params.basicInfo?.photo || '',
            birthLocation: params.basicInfo?.birthLocation || '',
            deathLocation: params.basicInfo?.deathLocation || '',
            dateOfBirth: null,
            dateOfDeath: null
          },
          lifeStory: {
            content: params.lifeStory?.content || '',
            updatedAt: Timestamp.now()
          }
        } as MemorialProfile;
      } else {
        profileData = {
          ...baseProfileData,
          type: 'personal',
          name: params.name || '',
          bio: '',
          photoURL: '',
          location: '',
          department: '',
          graduationYear: '',
          contact: {
            email: '',
            phone: '',
            website: ''
          },
          education: [],
          experience: [],
          achievements: [],
          description: '',
          imageUrl: '',
          metadata: {
            tags: [],
            categories: [],
            lastModifiedBy: '',
            lastModifiedAt: Timestamp.now(),
            version: 1
          }
        } as PersonalProfile;
      }

      console.log('useCreateProfile: Saving profile data', profileData);
      
      // Use a batch write to ensure atomic updates
      const batch = writeBatch(db);
      
      // Create the main profile document
      batch.set(profileRef, profileData);
      
      // Initialize the timeline subcollection with an empty document
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

      // Track the event
      trackEvent('profile_created', {
        profileId,
        profileType: params.type,
        universityId: params.universityId
      });

      return profileId;
    } catch (error) {
      console.error('useCreateProfile: Error creating profile', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProfile,
    loading
  };
} 