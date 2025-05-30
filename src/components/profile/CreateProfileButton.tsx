import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateProfile } from '@/hooks/useCreateProfile';
import { toast } from 'react-hot-toast';
import { Icon } from '@/components/ui/Icon';

interface CreateProfileButtonProps {
  universityId: string;
  profileType: 'personal' | 'memorial';
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

  const handleCreate = async () => {
    if (!user) {
      console.log('User not authenticated');
      toast.error('Please sign in to create a profile');
      return;
    }

    try {
      console.log('Creating new profile:', { universityId, profileType });
      const profileId = await createProfile({
        universityId,
        type: profileType,
        status: 'draft',
        createdBy: user.uid,
        updatedBy: user.uid
      });

      console.log('Profile created successfully:', profileId);
      toast.success(`${profileType === 'memorial' ? 'Memorial' : 'Profile'} created successfully`);

      // Redirect to the appropriate edit page
      if (profileType === 'memorial') {
        router.push(`/${universityId}/memorials/${profileId}`);
      } else {
        router.push(`/${universityId}/profiles/${profileId}`);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
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