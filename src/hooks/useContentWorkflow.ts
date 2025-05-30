import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getDb } from '@/lib/firebase';
import { AppError } from '@/utils/errors';

interface UseContentWorkflowProps {
  contentId: string;
  onStatusChange?: (newStatus: 'draft' | 'review' | 'approved' | 'archived') => void;
}

interface ContentHistory {
  type: 'status_change' | 'change_request';
  from: 'draft' | 'review' | 'approved' | 'archived';
  to: 'draft' | 'review' | 'approved' | 'archived';
  by: string;
  reason?: string;
  timestamp: any; // Firestore Timestamp
}

interface ContentState {
  status: 'draft' | 'review' | 'approved' | 'archived';
  lastModified: Date;
  lastModifiedBy: string;
  pendingChanges: boolean;
}

export const useContentWorkflow = ({ contentId, onStatusChange }: UseContentWorkflowProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentState, setCurrentState] = useState<ContentState | null>(null);
  const { user } = useAuth();
  const { isAdmin, isEditor } = usePermissions();

  const validateStateTransition = (currentStatus: string, newStatus: string): boolean => {
    const validTransitions: Record<string, string[]> = {
      draft: ['review', 'archived'],
      review: ['approved', 'draft'],
      approved: ['archived', 'draft'],
      archived: ['draft']
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  const canApprove = useCallback(async () => {
    if (!user) return false;
    return isAdmin || isEditor;
  }, [user, isAdmin, isEditor]);

  const canArchive = useCallback(async () => {
    if (!user) return false;
    return isAdmin || isEditor;
  }, [user, isAdmin, isEditor]);

  const canRequestChanges = useCallback(async () => {
    if (!user) return false;
    return isAdmin || isEditor;
  }, [user, isAdmin, isEditor]);

  const updateStatus = async (
    newStatus: 'draft' | 'review' | 'approved' | 'archived',
    currentStatus: 'draft' | 'review' | 'approved' | 'archived'
  ) => {
    if (!user) {
      toast.error('You must be logged in to perform this action');
      return false;
    }

    if (!validateStateTransition(currentStatus, newStatus)) {
      toast.error('Invalid state transition');
      return false;
    }

    setIsSubmitting(true);
    let success = false;

    try {
      const dbInstance = await getDb();
      const contentRef = doc(dbInstance, 'content', contentId);

      await runTransaction(dbInstance, async (transaction) => {
        const contentDoc = await transaction.get(contentRef);
        
        if (!contentDoc.exists()) {
          throw new AppError('NOT_FOUND', 'Content not found', 404);
        }

        const content = contentDoc.data();
        if (content.status !== currentStatus) {
          throw new AppError('INVALID_STATE', 'Content state has changed', 409);
        }

        const historyEntry = {
        type: 'status_change',
        from: currentStatus,
        to: newStatus,
        by: user.uid,
        timestamp: serverTimestamp()
      };

        transaction.update(contentRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        history: arrayUnion(historyEntry)
        });
      });

      setCurrentState({
        status: newStatus,
        lastModified: new Date(),
        lastModifiedBy: user.uid,
        pendingChanges: false
      });

      toast.success('Content status updated successfully');
      onStatusChange?.(newStatus);
      success = true;
    } catch (error) {
      console.error('Error updating content status:', error);
      
      if (error instanceof AppError) {
        toast.error(error.message);
      } else {
      toast.error('Failed to update content status');
      }

      // Attempt to recover state
      try {
        const dbInstance = await getDb();
        const contentRef = doc(dbInstance, 'content', contentId);
        const contentDoc = await getDoc(contentRef);
        
        if (contentDoc.exists()) {
          const content = contentDoc.data();
          setCurrentState({
            status: content.status,
            lastModified: content.updatedAt?.toDate() || new Date(),
            lastModifiedBy: content.updatedBy,
            pendingChanges: content.pendingChanges || false
          });
        }
      } catch (recoveryError) {
        console.error('Error recovering state:', recoveryError);
      }
    } finally {
      setIsSubmitting(false);
    }

    return success;
  };

  const requestChanges = async (
    currentStatus: 'draft' | 'review' | 'approved' | 'archived',
    reason: string
  ) => {
    if (!user || !reason.trim()) {
      toast.error('Please provide a reason for requesting changes');
      return false;
    }

    setIsSubmitting(true);

    try {
      const dbInstance = await getDb();
      const contentRef = doc(dbInstance, 'content', contentId);
      const historyEntry: ContentHistory = {
        type: 'change_request',
        from: currentStatus,
        to: 'draft',
        by: user.uid,
        reason: reason.trim(),
        timestamp: serverTimestamp()
      };

      await updateDoc(contentRef, {
        status: 'draft',
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        history: arrayUnion(historyEntry)
      });

      toast.success('Changes requested successfully');
      onStatusChange?.('draft');
      return true;
    } catch (error) {
      console.error('Error requesting changes:', error);
      toast.error('Failed to request changes');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    currentState,
    canApprove,
    canArchive,
    canRequestChanges,
    updateStatus,
    requestChanges
  };
}; 