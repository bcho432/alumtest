import { getFirebaseServices } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, setDoc, writeBatch, arrayUnion, arrayRemove, limit, startAfter, Timestamp, increment } from 'firebase/firestore';
import type { Comment, CommentThread, CommentFilters, CreateCommentDTO, UpdateCommentDTO, CommentReaction, CommentNotification } from '@/types/comments';
import { commentSchema } from '@/types/comments';

export interface CreateCommentInput {
  content: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  parentId?: string;
  profileId: string;
  orgId: string;
}

export class CommentService {
  private static readonly COMMENTS_PER_PAGE = 20;
  private static readonly MAX_REPLY_DEPTH = 3;
  private static readonly COLLECTION = 'comments';

  /**
   * Create a new comment
   */
  static async createComment(input: CreateCommentInput): Promise<Comment> {
    try {
      const { db } = await getFirebaseServices();
      
      const commentData = {
        ...input,
        createdAt: serverTimestamp(),
        reactions: {},
        isResolved: false
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), commentData);
      const docSnap = await getDoc(docRef);
      
      return {
        id: docRef.id,
        ...docSnap.data(),
        createdAt: docSnap.data()?.createdAt?.toDate()
      } as Comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  /**
   * Get comments for a media item with pagination and filtering
   */
  static async getComments(profileId: string): Promise<Comment[]> {
    try {
      const { db } = await getFirebaseServices();
      
      const q = query(
        collection(db, this.COLLECTION),
        where('profileId', '==', profileId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Comment[];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }

  /**
   * Get a comment thread with replies
   */
  static async getCommentThread(commentId: string): Promise<CommentThread> {
    try {
      const { db } = await getFirebaseServices();
      
      // Get root comment
      const commentDoc = await getDoc(doc(db, this.COLLECTION, commentId));
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const rootComment = {
        id: commentDoc.id,
        ...commentDoc.data()
      } as Comment;

      // Get replies
      const repliesQuery = query(
        collection(db, this.COLLECTION),
        where('parentId', '==', commentId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'asc')
      );

      const repliesSnapshot = await getDocs(repliesQuery);
      const replies = repliesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));

      return {
        id: commentId,
        rootComment,
        replies,
        totalReplies: replies.length,
        lastReplyAt: replies.length > 0 ? replies[replies.length - 1].createdAt.toISOString() : rootComment.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Error getting comment thread:', error);
      throw new Error('Failed to get comment thread');
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(commentId: string, data: UpdateCommentDTO): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const commentRef = doc(db, this.COLLECTION, commentId);
      
      await updateDoc(commentRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  static async deleteComment(commentId: string): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const commentRef = doc(db, this.COLLECTION, commentId);
      
      await deleteDoc(commentRef);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Add a reaction to a comment
   */
  static async addReaction(commentId: string, emoji: string, userId: string): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const commentRef = doc(db, this.COLLECTION, commentId);
      
      await updateDoc(commentRef, {
        [`reactions.${emoji}`]: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  /**
   * Remove a reaction from a comment
   */
  static async removeReaction(commentId: string, emoji: string, userId: string): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const commentRef = doc(db, this.COLLECTION, commentId);
      
      await updateDoc(commentRef, {
        [`reactions.${emoji}`]: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw new Error('Failed to remove reaction');
    }
  }

  /**
   * Create a notification for a comment action
   */
  private static async createNotification(notification: Omit<CommentNotification, 'id'>): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      
      await addDoc(collection(db, 'commentNotifications'), {
        ...notification,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnreadNotifications(userId: string): Promise<CommentNotification[]> {
    try {
      const { db } = await getFirebaseServices();
      
      const notificationsQuery = query(
        collection(db, 'commentNotifications'),
        where('toUserId', '==', userId),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CommentNotification));
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw new Error('Failed to get notifications');
    }
  }

  /**
   * Mark notifications as read
   */
  static async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const batch = writeBatch(db);
      
      notificationIds.forEach(id => {
        const notificationRef = doc(db, 'commentNotifications', id);
        batch.update(notificationRef, {
          isRead: true,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw new Error('Failed to mark notifications as read');
    }
  }

  static async resolveComment(commentId: string): Promise<void> {
    try {
      const { db } = await getFirebaseServices();
      const commentRef = doc(db, this.COLLECTION, commentId);
      
      await updateDoc(commentRef, {
        isResolved: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error resolving comment:', error);
      throw new Error('Failed to resolve comment');
    }
  }
} 