import { useState } from 'react';
import { getFirebaseServices } from '@/lib/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
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
    dateOfBirth?: Date;
    dateOfDeath?: Date;
    biography?: string;
    photo?: string;
    birthLocation?: string;
    deathLocation?: string;
  };
  lifeStory?: {
    content?: string;
    updatedAt?: Date;
  };
  isPublic?: boolean;
  metadata?: {
    tags?: string[];
    categories?: string[];
    lastModifiedBy?: string;
    lastModifiedAt?: string;
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
        createdAt: Timestamp.now().toDate().toISOString(),
        updatedAt: Timestamp.now().toDate().toISOString(),
        createdBy: params.createdBy,
        updatedBy: params.updatedBy,
        isPublic: params.isPublic || false,
        metadata: {
          tags: params.metadata?.tags || [],
          categories: params.metadata?.categories || [],
          lastModifiedBy: params.metadata?.lastModifiedBy || params.updatedBy,
          lastModifiedAt: Timestamp.now().toDate().toISOString(),
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
            dateOfBirth: params.basicInfo?.dateOfBirth ? new Date(params.basicInfo.dateOfBirth) : new Date(),
            dateOfDeath: params.basicInfo?.dateOfDeath ? new Date(params.basicInfo.dateOfDeath) : new Date(),
            biography: params.basicInfo?.biography || '',
            photo: params.basicInfo?.photo || '',
            birthLocation: params.basicInfo?.birthLocation || '',
            deathLocation: params.basicInfo?.deathLocation || ''
          },
          lifeStory: {
            content: params.lifeStory?.content || '',
            updatedAt: params.lifeStory?.updatedAt ? new Date(params.lifeStory.updatedAt) : new Date()
          }
        } as MemorialProfile;
      } else {
        profileData = {
          ...baseProfileData,
          type: 'personal',
          name: params.name || '',
          bio: params.description || '',
          photoURL: params.imageUrl || '',
          location: params.basicInfo?.birthLocation || '',
          department: '',
          graduationYear: '',
          contact: {
            email: '',
            phone: '',
            website: ''
          },
          education: [],
          experience: [],
          achievements: []
        } as PersonalProfile;
      }

      console.log('useCreateProfile: Saving profile data', profileData);
      await setDoc(profileRef, profileData);

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