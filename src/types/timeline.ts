import { LifeEvent } from './profile';

export interface TimelineState {
  events: LifeEvent[];
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: Error | null;
}

export interface TimelineError extends Error {
  code?: string;
  details?: unknown;
}

export interface TimelineSaveResult {
  success: boolean;
  error?: TimelineError;
  timestamp: Date;
}

export interface EducationFormValues {
  type: 'education';
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface JobFormValues {
  type: 'job';
  title: string;
  company: string;
  startDate: string;
  endDate: string;
}

export interface EventFormValues {
  type: 'event';
  title: string;
  description: string;
  date: string;
}

export type TimelineEntryFormValues = EducationFormValues | JobFormValues | EventFormValues;

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'education' | 'work' | 'achievement' | 'other';
  location?: string;
  organization?: string;
  skills?: string[];
  tags?: string[];
  media?: {
    type: 'image' | 'video' | 'document';
    url: string;
    thumbnail?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  isPublic: boolean;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  status: 'draft' | 'published' | 'archived';
  metadata?: Record<string, any>;
} 