import { z } from 'zod';

export interface Comment {
  id: string;
  content: string;
  userId: string;
  userEmail: string;
  createdAt: Date;
  updatedAt?: Date;
  profileId: string;
  authorId: string; // ID of the author (for analytics and display)
  authorName?: string; // Name of the author (for analytics and display)
  authorAvatar?: string; // Avatar URL of the author (for analytics and display)
  isEdited?: boolean;
  isDeleted?: boolean;
  parentId?: string; // Optional parentId for replies
  likes?: string[]; // Array of user IDs who liked the comment
  isFlagged?: boolean; // Whether the comment is flagged
  replyCount?: number; // Number of replies to this comment
  createdBy?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  reactions: {
    [key: string]: string[]; // emoji -> user IDs
  };
  isResolved?: boolean;
}

export interface CommentThread {
  id: string;
  rootComment: Comment;
  replies: Comment[];
  totalReplies: number;
  lastReplyAt: string;
}

export interface CommentFilters {
  sortBy?: 'newest' | 'oldest' | 'mostLiked';
  parentId?: string;
  authorId?: string;
  includeDeleted?: boolean;
  includeEdited?: boolean;
}

export interface CreateCommentDTO {
  content: string;
  mediaId: string;
  parentId?: string;
  mentions?: string[];
  tags?: string[];
  attachments?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name: string;
    size: number;
  }[];
}

export interface UpdateCommentDTO {
  content?: string;
  mentions?: string[];
  tags?: string[];
  isDeleted?: boolean;
  isFlagged?: boolean;
  attachments?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name: string;
    size: number;
  }[];
}

export interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  createdAt: string;
}

export interface CommentNotification {
  id: string;
  type: 'reply' | 'reaction' | 'mention';
  commentId: string;
  mediaId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  userId: z.string(),
  userEmail: z.string().email(),
  createdAt: z.any(),
  updatedAt: z.any().optional(),
  isEdited: z.boolean().optional(),
  isDeleted: z.boolean().optional()
}); 