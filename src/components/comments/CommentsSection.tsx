'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types/comments';

interface CommentsSectionProps {
  profileId: string;
  comments: Comment[];
  onAddComment: (comments: Comment[]) => void;
  className?: string;
}

export function CommentsSection({ profileId, comments, onAddComment, className }: CommentsSectionProps) {
  const { user } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;

    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching comments:', error);
          toast.error('Failed to load comments');
        } else {
          onAddComment(data || []);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();

    // Set up real-time subscription
    const subscription = supabase
      .channel('comments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments', filter: `profile_id=eq.${profileId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            onAddComment([payload.new as Comment, ...comments]);
          } else if (payload.eventType === 'DELETE') {
            onAddComment(comments.filter(c => c.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            onAddComment(comments.map(c => c.id === payload.new.id ? payload.new as Comment : c));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          profile_id: profileId,
          content: newComment.trim(),
          user_id: user.id,
          user_email: user.email
        }]);

      if (error) throw error;

      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleEdit = async (commentId: string, newContent: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  if (isLoading || rolesLoading) {
    return <div className="animate-pulse">Loading comments...</div>;
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="mb-2"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{comment.user_email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {comment.created_at 
                    ? new Date(comment.created_at).toLocaleString()
                    : new Date(comment.created_at).toLocaleString()}
                  {comment.is_edited && ' (edited)'}
                </p>
              </div>
              {(user?.id === comment.user_id || roles[profileId] === 'admin') && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 