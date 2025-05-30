import { useRouter } from 'next/router';
import { Button } from '../ui/Button';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';

interface EditProfileButtonProps {
  profileId: string;
  orgId: string;
  className?: string;
}

export const EditProfileButton = ({
  profileId,
  orgId,
  className,
}: EditProfileButtonProps) => {
  const router = useRouter();
  const { isAdmin, isLoading: isCheckingPermissions } = usePermissions();
  const { showToast } = useToast();

  const handleEdit = async () => {
    try {
      const hasPermission = await isAdmin(orgId);
      if (!hasPermission) {
        showToast({
          title: 'Permission Denied',
          description: 'You do not have permission to edit this profile',
          status: 'error'
        });
        return;
      }

      router.push(`/profile/${profileId}/edit?step=1`);
    } catch (error) {
      console.error('Error checking permissions:', error);
      showToast({
        title: 'Error',
        description: 'Failed to check permissions',
        status: 'error'
      });
    }
  };

  if (isCheckingPermissions) {
    return (
      <Button disabled className={className}>
        Loading...
      </Button>
    );
  }

  return (
    <Button onClick={handleEdit} className={className}>
      Edit Profile
    </Button>
  );
}; 