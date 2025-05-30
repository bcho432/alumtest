import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ContentApprovalWorkflowProps {
  profileId: string;
  orgId: string;
  currentStatus: 'draft' | 'pending' | 'published' | 'archived';
  onStatusChange: (newStatus: 'draft' | 'pending' | 'published' | 'archived', comments?: string) => Promise<void>;
  className?: string;
}

export const ContentApprovalWorkflow: React.FC<ContentApprovalWorkflowProps> = ({
  profileId,
  orgId,
  currentStatus,
  onStatusChange,
  className
}) => {
  const { user } = useAuth();
  const { isAdmin, isEditor } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState('');
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [hasEditorAccess, setHasEditorAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setHasAdminAccess(false);
        setHasEditorAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        const [adminAccess, editorAccess] = await Promise.all([
          isAdmin(orgId),
          isEditor(orgId, profileId)
        ]);
        setHasAdminAccess(adminAccess);
        setHasEditorAccess(editorAccess);
      } catch (error) {
        console.error('Error checking permissions:', error);
        toast.error('Failed to check permissions');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [user, orgId, profileId, isAdmin, isEditor]);

  const handleSubmitForReview = async () => {
    if (!hasEditorAccess) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onStatusChange('pending');
      toast.success('Profile submitted for review');
    } catch (error) {
      console.error('Error submitting for review:', error);
      toast.error('Failed to submit for review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!hasAdminAccess) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onStatusChange('published', comments);
      toast.success('Profile approved and published');
      setShowComments(false);
      setComments('');
    } catch (error) {
      console.error('Error approving profile:', error);
      toast.error('Failed to approve profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!hasAdminAccess) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onStatusChange('draft', comments);
      toast.success('Profile returned to draft');
      setShowComments(false);
      setComments('');
    } catch (error) {
      console.error('Error rejecting profile:', error);
      toast.error('Failed to reject profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!hasAdminAccess) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onStatusChange('archived');
      toast.success('Profile archived');
    } catch (error) {
      console.error('Error archiving profile:', error);
      toast.error('Failed to archive profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    const variants = {
      draft: 'secondary',
      pending: 'secondary',
      published: 'success',
      archived: 'destructive'
    } as const;

    return (
      <Badge variant={variants[currentStatus]}>
        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <Icon name="loader" className="animate-spin h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2">
          {currentStatus === 'draft' && hasEditorAccess && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="loader" className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Submitting...
                </>
              ) : (
                <>
                  <Icon name="send" className="mr-2 h-4 w-4" />
                  Submit for Review
                </>
              )}
            </Button>
          )}

          {currentStatus === 'pending' && hasAdminAccess && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComments(!showComments)}
              >
                <Icon name="message" className="mr-2 h-4 w-4" />
                Add Comments
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Icon name="loader" className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <Icon name="x" className="mr-2 h-4 w-4" />
                    Reject
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Icon name="loader" className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Icon name="check" className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            </>
          )}

          {currentStatus === 'published' && hasAdminAccess && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="loader" className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Archiving...
                </>
              ) : (
                <>
                  <Icon name="archive" className="mr-2 h-4 w-4" />
                  Archive
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add comments for the editor..."
                className="w-full"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowComments(false);
                    setComments('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  disabled={isSubmitting || !comments.trim()}
                >
                  Approve with Comments
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReject}
                  disabled={isSubmitting || !comments.trim()}
                >
                  Reject with Comments
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 