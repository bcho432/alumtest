import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { MemorialProfile, PersonalProfile } from '../types/profile';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { useAnalytics } from './useAnalytics';

interface CreateProfileParams {
  university_id: string;
  type: 'personal' | 'memorial';
  status: 'draft' | 'published';
  created_by: string;
  updated_by: string;
  full_name?: string;
  description?: string;
  image_url?: string;
  basic_info?: {
    date_of_birth?: Date | string | null;
    date_of_death?: Date | string | null;
    biography?: string;
    photo?: string;
    birth_location?: string;
    death_location?: string;
  };
  life_story?: {
    content?: string;
    updated_at?: Date | string;
  };
  is_public?: boolean;
  metadata?: {
    tags?: string[];
    categories?: string[];
    last_modified_by?: string;
    last_modified_at?: string;
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
      const profileId = uuidv4();
      console.log('useCreateProfile: Generated profile ID', profileId);

      const baseProfileData = {
        id: profileId,
        university_id: params.university_id,
        status: params.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: params.created_by,
        updated_by: params.updated_by,
        is_public: params.is_public || false,
        metadata: {
          tags: params.metadata?.tags || [],
          categories: params.metadata?.categories || [],
          last_modified_by: params.metadata?.last_modified_by || params.updated_by,
          last_modified_at: new Date().toISOString(),
          version: params.metadata?.version || 1
        }
      };

      let profileData: any;

      if (params.type === 'memorial') {
        profileData = {
          ...baseProfileData,
          type: 'memorial',
          university_id: params.university_id,
          full_name: params.full_name || '',
          description: params.description || '',
          image_url: params.image_url || '',
          basic_info: {
            biography: params.basic_info?.biography || '',
            photo: params.basic_info?.photo || '',
            birth_location: params.basic_info?.birth_location || '',
            death_location: params.basic_info?.death_location || '',
            date_of_birth: null,
            date_of_death: null
          },
          life_story: {
            content: params.life_story?.content || '',
            updated_at: new Date().toISOString()
          }
        } as MemorialProfile;
      } else {
        profileData = {
          ...baseProfileData,
          type: 'personal',
          name: params.full_name || '',
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
            lastModifiedAt: new Date().toISOString(),
            version: 1
          }
        } as PersonalProfile;
      }

      console.log('useCreateProfile: Saving profile data', profileData);
      
      // Use a batch write to ensure atomic updates
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('useCreateProfile: Error creating profile', error);
        throw error;
      }

      // Track the event
      trackEvent('profile_created', {
        profileId,
        profileType: params.type,
        universityId: params.university_id
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