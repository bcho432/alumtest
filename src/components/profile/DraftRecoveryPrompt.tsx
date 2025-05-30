import { useState } from 'react';
import { useLocalDraftSync } from '@/hooks/useLocalDraftSync';
import { Profile } from '@/types/profile';
import { cn } from '@/lib/utils';

interface DraftRecoveryPromptProps {
  profileId: string;
  remoteProfile: Profile;
  onRecover: (mergedProfile: Profile) => void;
  onDiscard: () => void;
  className?: string;
}

export const DraftRecoveryPrompt = ({
  profileId,
  remoteProfile,
  onRecover,
  onDiscard,
  className,
}: DraftRecoveryPromptProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { localDraft, mergeDrafts, clearLocalDraft } = useLocalDraftSync(profileId);

  const handleRecover = () => {
    if (localDraft) {
      const mergedProfile = mergeDrafts(localDraft, remoteProfile);
      onRecover(mergedProfile);
      clearLocalDraft();
    }
    setIsOpen(false);
  };

  const handleDiscard = () => {
    clearLocalDraft();
    onDiscard();
    setIsOpen(false);
  };

  if (!isOpen || !localDraft) {
    return null;
  }

  return (
    <div className={cn('fixed inset-0 bg-black/50 flex items-center justify-center z-50', className)}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Recover your previous draft?</h2>
        <p className="text-gray-600 mb-6">
          We found unsaved changes from your last session. Would you like to recover them?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleDiscard}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Discard
          </button>
          <button
            onClick={handleRecover}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recover
          </button>
        </div>
      </div>
    </div>
  );
}; 