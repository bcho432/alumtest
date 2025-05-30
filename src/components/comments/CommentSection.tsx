import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CommentService } from '@/services/CommentService';
import { Comment, CommentThread, CommentFilters } from '@/types/comments';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiHeart, FiEdit2, FiTrash2, FiMoreVertical, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface CommentSectionProps {
  mediaId: string;
  onCommentCountChange?: (count: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ mediaId, onCommentCountChange }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [showThread, setShowThread] = useState<string | null>(null);
  const [thread, setThread] = useState<CommentThread | null>(null);
  const [filters, setFilters] = useState<CommentFilters>({ sortBy: 'newest' });
  const [showFilters, setShowFilters] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCommentRef = useRef<HTMLDivElement>(null);

  // Load initial comments
  useEffect(() => {
    loadComments();
  }, [mediaId, filters]);

  // Setup infinite scroll
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreComments();
        }
      },
      { threshold: 0.5 }
    );

    if (lastCommentRef.current) {
      observer.observe(lastCommentRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, comments]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const result = await CommentService.getComments(mediaId);
      setComments(result);
      setHasMore(result.length > 0);
      onCommentCountChange?.(result.length);
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreComments = async () => {
    if (!comments.length) return;

    try {
      const result = await CommentService.getComments(mediaId);
      setComments(prev => [...prev, ...result]);
      setHasMore(result.length > 0);
      onCommentCountChange?.(comments.length + result.length);
    } catch (error) {
      toast.error('Failed to load more comments');
    }
  };

  const loadThread = async (commentId: string) => {
    try {
      const threadData = await CommentService.getCommentThread(commentId);
      setThread(threadData);
      setShowThread(commentId);
    } catch (error) {
      toast.error('Failed to load thread');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const commentId = await CommentService.createComment({
        content: newComment.trim(),
        parentId: replyingTo || undefined,
        createdBy: {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          email: user.email || '',
          avatarUrl: user.photoURL || undefined
        },
        profileId: user.uid,
        orgId: user.uid
      });

      setNewComment('');
      setReplyingTo(null);
      loadComments();
      if (replyingTo) {
        loadThread(replyingTo);
      }
      toast.success('Comment posted successfully');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      await CommentService.updateComment(commentId, { content });
      setEditingComment(null);
      loadComments();
      if (showThread === commentId) {
        loadThread(commentId);
      }
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await CommentService.deleteComment(commentId);
      loadComments();
      if (showThread === commentId) {
        setShowThread(null);
        setThread(null);
      }
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleReaction = async (commentId: string) => {
    if (!user) return;

    try {
      await CommentService.addReaction(commentId, user.uid, 'like');
      loadComments();
      if (showThread === commentId) {
        loadThread(commentId);
      }
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;
    const isThreadVisible = showThread === comment.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`comment ${isReply ? 'ml-8' : ''}`}
      >
        <div className="flex items-start space-x-3">
          <img
            src={comment.authorAvatar || '/default-avatar.png'}
            alt={comment.authorName}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{comment.authorName}</span>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  {comment.isEdited && (
                    <span className="text-sm text-gray-500">(edited)</span>
                  )}
                </div>
                {user?.uid === comment.authorId && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingComment(comment.id)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const content = (e.target as HTMLFormElement).content.value;
                    handleUpdateComment(comment.id, content);
                  }}
                  className="mt-2"
                >
                  <textarea
                    name="content"
                    defaultValue={comment.content}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Update
                    </button>
                  </div>
                </form>
              ) : (
                <p className="mt-1 text-gray-700 dark:text-gray-300">{comment.content}</p>
              )}

              <div className="flex items-center space-x-4 mt-2">
                <button
                  onClick={() => handleReaction(comment.id)}
                  className={`flex items-center space-x-1 ${
                    comment.likes?.includes(user?.uid || '') ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  <FiHeart size={16} />
                  <span>{comment.likes?.length || 0}</span>
                </button>
                {!isReply && (
                  <button
                    onClick={() => {
                      setReplyingTo(comment.id);
                      commentInputRef.current?.focus();
                    }}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <FiMessageSquare size={16} />
                    <span>Reply</span>
                  </button>
                )}
                {!isReply && (comment.replyCount ?? 0) > 0 && (
                  <button
                    onClick={() => isThreadVisible ? setShowThread(null) : loadThread(comment.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {isThreadVisible ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                    <span>{comment.replyCount} replies</span>
                  </button>
                )}
              </div>
            </div>

            {isReplying && (
              <form onSubmit={handleSubmitComment} className="mt-3">
                <textarea
                  ref={commentInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Reply
                  </button>
                </div>
              </form>
            )}

            {isThreadVisible && thread && (
              <div className="mt-4 space-y-4">
                {thread.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="comment-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Comments</h3>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 text-gray-600 dark:text-gray-300"
          >
            <span>Sort by</span>
            <FiMoreVertical size={16} />
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10"
              >
                <button
                  onClick={() => {
                    setFilters({ ...filters, sortBy: 'newest' });
                    setShowFilters(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    filters.sortBy === 'newest' ? 'text-blue-500' : ''
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => {
                    setFilters({ ...filters, sortBy: 'oldest' });
                    setShowFilters(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    filters.sortBy === 'oldest' ? 'text-blue-500' : ''
                  }`}
                >
                  Oldest
                </button>
                <button
                  onClick={() => {
                    setFilters({ ...filters, sortBy: 'mostLiked' });
                    setShowFilters(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    filters.sortBy === 'mostLiked' ? 'text-blue-500' : ''
                  }`}
                >
                  Most Liked
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {user && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post Comment
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment, index) => (
            <div
              key={comment.id}
              ref={index === comments.length - 1 ? lastCommentRef : null}
            >
              {renderComment(comment)}
            </div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}; 