import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CommentService } from '@/services/CommentService';
import { Comment, CommentFilters } from '@/types/comments';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiFlag, FiCheck, FiX, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface CommentModerationProps {
  onCommentAction?: (action: 'delete' | 'restore' | 'flag', comment: Comment) => void;
}

export const CommentModeration: React.FC<CommentModerationProps> = ({ onCommentAction }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CommentFilters>({
    includeDeleted: true,
    includeEdited: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadComments();
    }
  }, [user, filters]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const resultRaw = await CommentService.getComments('');
      const result = Array.isArray(resultRaw)
        ? resultRaw
        : (resultRaw && typeof resultRaw === 'object' && 'comments' in (resultRaw as any) && Array.isArray((resultRaw as any).comments)
            ? (resultRaw as { comments: Comment[] }).comments
            : []);
      setComments(result);
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    try {
      await CommentService.deleteComment(comment.id);
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, isDeleted: true } : c));
      onCommentAction?.('delete', comment);
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleRestoreComment = async (comment: Comment) => {
    try {
      await CommentService.updateComment(comment.id, { isDeleted: false });
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, isDeleted: false } : c));
      onCommentAction?.('restore', comment);
      toast.success('Comment restored successfully');
    } catch (error) {
      toast.error('Failed to restore comment');
    }
  };

  const handleFlagComment = async (comment: Comment) => {
    try {
      await CommentService.updateComment(comment.id, { isFlagged: true });
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, isFlagged: true } : c));
      onCommentAction?.('flag', comment);
      toast.success('Comment flagged successfully');
    } catch (error) {
      toast.error('Failed to flag comment');
    }
  };

  const handleBulkAction = async (action: 'delete' | 'restore' | 'flag') => {
    if (!selectedComments.size) return;

    try {
      const promises = Array.from(selectedComments).map(commentId => {
        const comment = comments.find(c => c.id === commentId);
        if (!comment) return Promise.resolve();

        switch (action) {
          case 'delete':
            return handleDeleteComment(comment);
          case 'restore':
            return handleRestoreComment(comment);
          case 'flag':
            return handleFlagComment(comment);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      setSelectedComments(new Set());
      toast.success('Bulk action completed successfully');
    } catch (error) {
      toast.error('Failed to perform bulk action');
    }
  };

  const filteredComments = comments.filter(comment => {
    const matchesSearch = searchQuery
      ? comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (comment.authorName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesSearch;
  });

  return (
    <div className="comment-moderation">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Comment Moderation</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search comments..."
              className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            <FiFilter size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.includeDeleted}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeDeleted: e.target.checked }))}
                  className="rounded text-blue-500"
                />
                <span>Include deleted comments</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.includeEdited}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeEdited: e.target.checked }))}
                  className="rounded text-blue-500"
                />
                <span>Include edited comments</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedComments.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg flex items-center justify-between">
          <span>{selectedComments.size} comments selected</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded"
            >
              Delete
            </button>
            <button
              onClick={() => handleBulkAction('restore')}
              className="px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded"
            >
              Restore
            </button>
            <button
              onClick={() => handleBulkAction('flag')}
              className="px-3 py-1 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900 rounded"
            >
              Flag
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments found
          </div>
        ) : (
          filteredComments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg border ${
                comment.isDeleted
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : comment.isFlagged
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedComments.has(comment.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedComments);
                    if (e.target.checked) {
                      newSelected.add(comment.id);
                    } else {
                      newSelected.delete(comment.id);
                    }
                    setSelectedComments(newSelected);
                  }}
                  className="mt-1 rounded text-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={comment.authorAvatar || '/default-avatar.png'}
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <span className="font-medium">{comment.authorName}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {comment.isDeleted ? (
                        <button
                          onClick={() => handleRestoreComment(comment)}
                          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        >
                          <FiCheck size={18} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleFlagComment(comment)}
                            className={`p-1 ${
                              comment.isFlagged
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400'
                            } hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded`}
                          >
                            <FiFlag size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment)}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{comment.content}</p>
                  {comment.isEdited && (
                    <span className="text-sm text-gray-500">(edited)</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}; 