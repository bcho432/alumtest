import { usePermissions } from '@/hooks/usePermissions';
import { useProfileDiff } from '@/hooks/useProfileDiff';
import { DiffSection } from './DiffSection';

interface ProfileDiffViewerProps {
  profileId: string;
}

export const ProfileDiffViewer = ({ profileId }: ProfileDiffViewerProps) => {
  const { isAdmin, isLoading: permissionsLoading } = usePermissions();
  const { isLoading, error, diffs } = useProfileDiff(profileId);

  if (permissionsLoading || !isAdmin) {
    return null;
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading changes...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-600">{error}</div>;
  }

  if (!diffs) {
    return <div className="text-center py-4">No changes detected</div>;
  }

  return (
    <div className="space-y-6">
      <DiffSection title="Profile Information" diff={diffs.metadata} />
      <DiffSection title="Timeline Events" diff={diffs.timeline} />
      <DiffSection title="Story Answers" diff={diffs.storyAnswers} />
    </div>
  );
}; 