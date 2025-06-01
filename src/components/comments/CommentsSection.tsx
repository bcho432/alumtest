'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'react-hot-toast';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
    if (!db) {
      toast.error('Database not initialized');
      setIsLoading(false);
      return;
    }
    const q = query(
      collection(db, 'profiles', profileId, 'content', 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      onAddComment(loadedComments);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'profiles', profileId, 'content', 'comments'), {
        content: newComment.trim(),
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

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
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    try {
      await deleteDoc(doc(db, 'profiles', profileId, 'content', 'comments', commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleEdit = async (commentId: string, newContent: string) => {
    if (!user) return;
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    try {
      await updateDoc(doc(db, 'profiles', profileId, 'content', 'comments', commentId), {
        content: newContent.trim(),
        updatedAt: serverTimestamp(),
        isEdited: true
      });
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
                <p className="font-medium">{comment.userEmail}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {comment.createdAt instanceof Timestamp 
                    ? comment.createdAt.toDate().toLocaleString()
                    : new Date(comment.createdAt).toLocaleString()}
                  {comment.isEdited && ' (edited)'}
                </p>
              </div>
              {(user?.uid === comment.userId || roles[profileId] === 'admin') && (
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