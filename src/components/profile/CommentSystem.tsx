import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useComments } from '@/hooks/useComments';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Comment, UpdateCommentDTO } from '@/types/comments';
import { toast } from 'react-hot-toast';

interface CommentSystemProps {
  profileId: string;
  orgId: string;
  className?: string;
}

const EMOJI_REACTIONS = ['👍', '❤️', '🎉', '👀', '🚀', '💡'];

export const CommentSystem: React.FC<CommentSystemProps> = ({
  profileId,
  orgId,
  className
}) => {
  const { user } = useAuth();
  const { isAdmin, isEditor } = usePermissions();
  const {
    comments,
    isLoading,
    isSubmitting,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    toggleReaction
  } = useComments({ profileId, orgId });

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment.trim(), replyingTo || undefined);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment.id);
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await resolveComment(commentId);
    } catch (error) {
      console.error('Error resolving comment:', error);
      toast.error('Failed to resolve comment');
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      await toggleReaction(commentId, emoji);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(commentId);
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const renderComment = (comment: Comment) => {
    const isAuthor = comment.authorId === user?.uid;
    const canEdit = isAuthor || isAdmin;
    const canDelete = isAuthor || isAdmin;
    const canResolve = isAdmin;

    return (
      <div key={comment.id} className="mb-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <img
              src={comment.authorAvatar || '/default-avatar.png'}
              alt={comment.authorName || 'User'}
              className="w-8 h-8 rounded-full"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{comment.authorName || 'Anonymous'}</span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {canEdit && (
                  <button
                    onClick={() => handleEditComment(comment)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                )}
                {Boolean(canResolve) && !comment.isResolved && (
                  <button
                    onClick={() => handleResolveComment(comment.id)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
            <div className="mt-1">
              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateComment(comment.id)}
                      className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">{comment.content}</p>
              )}
            </div>
            <div className="mt-2 flex items-center space-x-4">
              <button
                onClick={() => handleReply(comment)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reply
              </button>
              <div className="flex items-center space-x-2">
                {Object.entries(comment.reactions).map(([emoji, userIds]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(comment.id, emoji)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded ${
                      userIds.includes(user?.uid || '')
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-xs">{userIds.length}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
    <div className={cn('space-y-6', className)}>
      <div className="space-y-4">
        {comments
          .filter((c) => !c.parentId)
          .map((comment) => renderComment(comment))}
      </div>

      <div className="space-y-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
          className="w-full"
          rows={3}
        />
        <div className="flex justify-end gap-2">
          {replyingTo && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel Reply
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <>
                <Icon name="loader" className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Posting...
              </>
            ) : (
              'Post Comment'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}; 