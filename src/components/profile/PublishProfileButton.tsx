import React, { useState } from 'react';
import { useProfileStatus } from '@/hooks/useProfileStatus';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { PublishConfirmationDialog } from './PublishConfirmationDialog';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';

interface PublishProfileButtonProps {
  orgId: string;
  profileId: string;
  onPublish?: () => void;
}

export const PublishProfileButton: React.FC<PublishProfileButtonProps> = ({
  orgId,
  profileId,
  onPublish,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { isAdmin } = usePermissions();
  const { showToast } = useToast();
  const { publishProfile, isPublishing } = useProfileStatus(orgId, profileId);
  const { completeness } = useProfileCompleteness(profileId);

  const handlePublish = async () => {
    try {
      await publishProfile();
      showToast({
        title: 'Success',
        description: 'Profile published successfully',
        status: 'success'
      });
      onPublish?.();
    } catch (error) {
      console.error('Error publishing profile:', error);
      showToast({
        title: 'Error',
        description: 'Failed to publish profile',
        status: 'error'
      });
    } finally {
      setShowConfirm(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPublishing}
        className="btn btn-primary"
      >
        {isPublishing ? (
          <>
            <span className="inline-block animate-spin mr-2">⟳</span>
            Publishing...
          </>
        ) : (
          'Approve and Publish'
        )}
      </button>

      <PublishConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handlePublish}
        isPublishing={isPublishing}
        profileCompleteness={completeness}
      />
    </>
  );
}; 