import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { Alert } from '@/components/ui/Alert';
import { useProfileStatus } from '@/hooks/useProfileStatus';
import { usePermissions } from '@/hooks/usePermissions';
import { ProfileStatus as ProfileStatusType } from '@/types/profile';

interface ProfileStatusProps {
  orgId: string;
  profileId: string;
  initialStatus: ProfileStatusType;
}

export const ProfileStatus: React.FC<ProfileStatusProps> = ({
  orgId,
  profileId,
  initialStatus,
}) => {
  const [error, setError] = useState<string | null>(null);
  const { publishProfile, isPublishing } = useProfileStatus(orgId, profileId);
  const { canPublish } = usePermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check permissions on mount
  React.useEffect(() => {
    const checkPermission = async () => {
      try {
        const canPublishProfile = await canPublish(orgId);
        setHasPermission(canPublishProfile);
      } catch (err) {
        setError('Failed to check permissions');
      }
    };
    checkPermission();
  }, [orgId, canPublish]);

  const handleStatusChange = async () => {
    try {
      setError(null);
      const success = await publishProfile();
      if (!success) {
        setError('Failed to update status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (error) {
    return (
      <Alert
        type="error"
        title="Error"
        message={error}
        action={{
          label: 'Dismiss',
          onClick: () => setError(null),
        }}
      />
    );
  }

  if (hasPermission === null) {
    return <LoadingState size="sm" />;
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-500">Status:</span>
        <span className="text-sm text-gray-700">
          {initialStatus === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-500">Status:</span>
        <span
          className={`text-sm font-medium ${
            initialStatus === 'published' ? 'text-green-600' : 'text-yellow-600'
          }`}
        >
          {initialStatus === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleStatusChange}
        disabled={isPublishing}
      >
        {isPublishing ? (
          <LoadingState size="sm" />
        ) : initialStatus === 'published' ? (
          'Set to Draft'
        ) : (
          'Publish'
        )}
      </Button>
    </div>
  );
}; 