import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ProfileDiffViewer } from './ProfileDiffViewer';
import { cn } from '@/lib/utils';

interface ViewChangesButtonProps {
  profileId: string;
  className?: string;
}

export const ViewChangesButton = ({ profileId, className }: ViewChangesButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin, isLoading } = usePermissions();

  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700',
          className
        )}
      >
        View Changes
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Profile Changes</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <ProfileDiffViewer profileId={profileId} />
          </div>
        </div>
      )}
    </>
  );
}; 