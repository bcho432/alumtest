import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useContentWorkflow } from '@/hooks/useContentWorkflow';
import { cn } from '@/lib/utils';

interface ContentWorkflowProps {
  contentId: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  onStatusChange?: (newStatus: 'draft' | 'review' | 'approved' | 'archived') => void;
  className?: string;
}

export const ContentWorkflow: React.FC<ContentWorkflowProps> = ({
  contentId,
  status,
  onStatusChange,
  className
}) => {
  const [changeRequest, setChangeRequest] = useState('');
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const {
    isSubmitting,
    canApprove,
    canArchive,
    canRequestChanges,
    updateStatus,
    requestChanges
  } = useContentWorkflow({
    contentId,
    onStatusChange
  });

  const [canApproveResult, setCanApproveResult] = useState(false);
  const [canRequestChangesResult, setCanRequestChangesResult] = useState(false);
  const [canArchiveResult, setCanArchiveResult] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setCanApproveResult(await (canApprove as () => Promise<boolean>)());
      setCanRequestChangesResult(await (canRequestChanges as () => Promise<boolean>)());
      setCanArchiveResult(await (canArchive as () => Promise<boolean>)());
    })();
    return () => { mounted = false; };
  }, [canApprove, canRequestChanges, canArchive]);

  const handleRequestChanges = async () => {
    const success = await requestChanges(status, changeRequest);
    if (success) {
      setShowChangeRequest(false);
      setChangeRequest('');
    }
  };

  return (
    <div className={className}>
      {/* Status Badge */}
      <div className="mb-4">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
            status === 'draft' && 'bg-yellow-100 text-yellow-800',
            status === 'review' && 'bg-blue-100 text-blue-800',
            status === 'approved' && 'bg-green-100 text-green-800',
            status === 'archived' && 'bg-gray-100 text-gray-800'
          )}
        >
          <Icon
            name={
              status === 'draft'
                ? 'edit'
                : status === 'review'
                ? 'clock'
                : status === 'approved'
                ? 'check'
                : 'archive'
            }
            className="mr-1.5 h-4 w-4"
          />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {status === 'draft' && (
          <Button
            onClick={() => updateStatus('review', status)}
            disabled={isSubmitting}
            className="w-full"
          >
            Submit for Review
          </Button>
        )}

        {status === 'review' && canApproveResult && (
          <Button
            onClick={() => updateStatus('approved', status)}
            disabled={isSubmitting}
            className="w-full"
          >
            Approve
          </Button>
        )}

        {status === 'review' && canRequestChangesResult && (
          <Button
            onClick={() => setShowChangeRequest(true)}
            variant="outline"
            disabled={isSubmitting}
            className="w-full"
          >
            Request Changes
          </Button>
        )}

        {status === 'approved' && canArchiveResult && (
          <Button
            onClick={() => updateStatus('archived', status)}
            variant="outline"
            disabled={isSubmitting}
            className="w-full"
          >
            Archive
          </Button>
        )}

        {status === 'archived' && canArchiveResult && (
          <Button
            onClick={() => updateStatus('draft', status)}
            variant="outline"
            disabled={isSubmitting}
            className="w-full"
          >
            Restore
          </Button>
        )}
      </div>

      {/* Change Request Modal */}
      {showChangeRequest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        >
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-medium">Request Changes</h3>
            <Textarea
              value={changeRequest}
              onChange={(e) => setChangeRequest(e.target.value)}
              placeholder="Please provide a reason for requesting changes..."
              rows={4}
              className="mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChangeRequest(false);
                  setChangeRequest('');
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestChanges}
                disabled={isSubmitting || !changeRequest.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Icon name="loader" className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 