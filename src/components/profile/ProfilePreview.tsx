import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { Alert } from '@/components/ui/Alert';
import { TimelineBuilder } from '@/components/profile/wizard/TimelineBuilder';
import { StoryPrompts } from '@/components/profile/wizard/StoryPrompts';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Profile } from '@/types/profile';

export const ProfilePreview: React.FC = () => {
  const router = useRouter();
  const profileId = typeof router.query.profileId === 'string' ? router.query.profileId : '';
  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const { profile, loading: profileLoading, error: profileError } = useProfile(profileId);
  const { isEditor } = usePermissions();

  useEffect(() => {
    const checkPermission = async () => {
      let orgOrUniversityId = '';
      if (profile?.type === 'memorial') {
        orgOrUniversityId = profile.universityId || '';
      } else if ('orgId' in (profile || {})) {
        orgOrUniversityId = (profile as any).orgId || '';
      }
      if (!profileId || !orgOrUniversityId) return;
      try {
        const canEdit = await isEditor(orgOrUniversityId, profileId);
        setHasPermission(canEdit);
        if (!canEdit) {
          setError('You do not have permission to preview this profile');
          trackEvent('profile_preview_unauthorized', {
            profileId,
            orgId: orgOrUniversityId,
          });
        }
      } catch (err) {
        setError('Failed to check permissions');
        trackEvent('profile_preview_permission_error', {
          profileId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };
    checkPermission();
  }, [profileId, profile, isEditor, trackEvent]);

  const handleReturnToEdit = () => {
    router.push(`/profile/${profileId}/edit`);
    trackEvent('profile_preview_return_to_edit', { profileId });
  };

  if (profileLoading || hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingState size="lg" />
      </div>
    );
  }

  if (error || profileError) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert
          type="error"
          title="Error"
          message={error || profileError?.message || ''}
          action={{
            label: 'Return Home',
            onClick: () => router.push('/'),
          }}
        />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert
          type="error"
          title="Access Denied"
          message="You do not have permission to preview this profile."
          action={{
            label: 'Return Home',
            onClick: () => router.push('/'),
          }}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert
          type="error"
          title="Profile Not Found"
          message="The requested profile could not be found."
          action={{
            label: 'Return Home',
            onClick: () => router.push('/'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Profile Preview</h1>
          <Button
            variant="secondary"
            onClick={handleReturnToEdit}
          >
            Return to Edit
          </Button>
        </div>

        <div className="space-y-8">
          {/* Profile Info Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{profile.name}</p>
              </div>
              {profile.type === 'personal' && (profile as any).location && (
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{(profile as any).location}</p>
                </div>
              )}
            </div>
          </section>

          {/* Timeline Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Timeline</h2>
            <TimelineBuilder
              orgId={profile.type === 'memorial' ? profile.universityId : (profile as any).orgId ?? ''}
              profileId={profileId || ''}
              isPreview
            />
          </section>

          {/* Story Prompts Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Story Prompts</h2>
            <StoryPrompts
              orgId={profile.type === 'memorial' ? profile.universityId : (profile as any).orgId ?? ''}
              profileId={profileId || ''}
              isPreview
            />
          </section>
        </div>
      </div>
    </div>
  );
}; 