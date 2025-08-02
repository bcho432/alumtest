import { useState, useEffect, useCallback } from 'react';
import { CommentService, type CreateCommentInput } from '@/services/CommentService';
import type { Comment } from '@/types/comments';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface UseCommentsProps {
  profileId: string;
  orgId: string;
}

export const useComments = ({ profileId, orgId }: UseCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!profileId) return;

    setIsLoading(true);
    try {
      const fetchedComments = await CommentService.getComments(profileId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const commentInput: CreateCommentInput = {
        content,
        createdBy: {
          id: user.id,
          name: user.displayName || 'Anonymous',
          email: user.email || '',
          avatarUrl: undefined
        },
        parentId,
        profileId,
        orgId
      };

      const newComment = await CommentService.createComment(commentInput);
      setComments((prev) => [newComment, ...prev]);
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, profileId, orgId]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      await CommentService.updateComment(commentId, { content });
      await fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }, [fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    setIsSubmitting(true);
    try {
      await CommentService.deleteComment(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resolveComment = useCallback(async (commentId: string) => {
    setIsSubmitting(true);
    try {
      await CommentService.resolveComment(commentId);
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, isResolved: true, updatedAt: new Date() }
            : comment
        )
      );
      toast.success('Comment resolved successfully');
    } catch (error) {
      console.error('Error resolving comment:', error);
      toast.error('Failed to resolve comment');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const toggleReaction = useCallback(async (commentId: string, emoji: string) => {
    if (!user) {
      toast.error('You must be logged in to react to comments');
      return;
    }

    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const hasReacted = comment.reactions[emoji]?.includes(user.id);
      if (hasReacted) {
        await CommentService.removeReaction(commentId, emoji, user.id);
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  reactions: {
                    ...c.reactions,
                    [emoji]: c.reactions[emoji]?.filter((id) => id !== user.id) || []
                  }
                }
              : c
          )
        );
      } else {
        await CommentService.addReaction(commentId, emoji, user.id);
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  reactions: {
                    ...c.reactions,
                    [emoji]: [...(c.reactions[emoji] || []), user.id]
                  }
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    }
  }, [user, comments]);

  return {
    comments,
    isLoading,
    isSubmitting,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    toggleReaction,
    refreshComments: fetchComments
  };
}; 