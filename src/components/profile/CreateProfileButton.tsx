import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/hooks/useAuth';
import { useCreateProfile } from '@/hooks/useCreateProfile';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

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

  const pollForProfile = useCallback(async (profileId: string) => {
    const maxAttempts = 10;
    const pollInterval = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      console.log(`[CreateProfileButton] Polling attempt ${attempts + 1}/${maxAttempts}`);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (!error && data) {
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
        university_id: universityId,
        type: profileType,
        status: 'draft',
        created_by: user.id,
        updated_by: user.id,
        full_name: '',
        description: '',
        image_url: '',
        basic_info: {
          date_of_birth: null,
          date_of_death: null,
          biography: '',
          photo: '',
          birth_location: '',
          death_location: ''
        },
        life_story: {
          content: '',
          updated_at: new Date().toISOString()
        },
        is_public: false,
        metadata: {
          tags: [],
          categories: [],
          last_modified_by: user.id,
          last_modified_at: new Date().toISOString(),
          version: 1
        }
      });

      console.log('[CreateProfileButton] Profile created with ID:', profileId);
      
      // Poll for the profile to be saved
      const profileExists = await pollForProfile(profileId);
      
      if (profileExists) {
        const targetPath = profileType === 'memorial'
          ? `/university/${universityId}/memorials/${profileId}/edit`
          : `/university/${universityId}/profiles/${profileId}/edit`;
        
        console.log('[CreateProfileButton] Redirecting to:', targetPath);
        
        // Use router for navigation
        router.push(targetPath);
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